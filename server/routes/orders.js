const express = require('express');
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// GET /api/orders - List POs
router.get('/', (req, res) => {
  const { status, supplier_org_id, search } = req.query;
  let orders = db.findAll('purchase_orders');

  // Supplier: only see own POs
  if (req.user.role === 'supplier') {
    orders = orders.filter(o => o.supplier_org_id === req.user.orgId);
  }

  if (status) orders = orders.filter(o => o.status === status);
  if (supplier_org_id) orders = orders.filter(o => o.supplier_org_id === parseInt(supplier_org_id));
  if (search) {
    const q = search.toLowerCase();
    orders = orders.filter(o => o.po_no.toLowerCase().includes(q) || (o.site && o.site.toLowerCase().includes(q)));
  }

  const enriched = orders.map(o => {
    const org = db.findById('organizations', o.supplier_org_id);
    return { ...o, supplier_name: org ? org.short_name : null };
  });

  res.json(enriched);
});

// GET /api/orders/:id - Get PO detail with lines
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const po = db.findById('purchase_orders', id);
  if (!po) return res.status(404).json({ error: 'PO not found' });

  const lines = db.findAll('po_lines', { po_id: id });
  const confirmations = db.findAll('po_confirmations', { po_id: id });
  const asns = db.findAll('asns', { po_id: id });

  const org = db.findById('organizations', po.supplier_org_id);
  res.json({ ...po, supplier_name: org ? org.short_name : null, lines, confirmations, asns });
});

// POST /api/orders - Create PO
router.post('/', requireRole('buyer', 'admin'), (req, res) => {
  const { supplier_org_id, site, delivery_date, lines, contract_id } = req.body;

  const count = db.findAll('purchase_orders').length;
  const poNo = `PO-${45001288 + count}`;

  const po = db.insert('purchase_orders', {
    po_no: poNo,
    supplier_org_id,
    status: 'Pending Supplier',
    site,
    delivery_date,
    total_amount: 0,
    currency: 'CNY',
    contract_id,
    created_by: req.user.userId
  });

  let total = 0;
  if (lines && lines.length > 0) {
    lines.forEach(line => {
      db.insert('po_lines', { po_id: po.id, ...line });
      total += (line.qty || 0) * (line.unit_price || 0);
    });
    db.update('purchase_orders', po.id, { total_amount: total });
  }

  // Create task for supplier
  const supplierUsers = db.findAll('users', { org_id: supplier_org_id });
  supplierUsers.forEach(u => {
    db.insert('tasks', {
      assignee_user_id: u.id,
      org_id: supplier_org_id,
      object_type: 'po',
      object_id: po.id,
      title: `Confirm ${poNo}`,
      status: 'open',
      due_at: new Date(Date.now() + 3 * 86400000).toISOString()
    });
  });

  // Notify supplier
  supplierUsers.forEach(u => {
    db.insert('notifications', {
      user_id: u.id,
      title: 'PO received',
      message: `${poNo} is waiting for confirmation.`,
      object_type: 'po',
      object_id: po.id,
      is_read: false
    });
  });

  res.status(201).json({ ...po, total_amount: total });
});

// POST /api/orders/:id/confirm - Supplier confirms PO
router.post('/:id/confirm', requireRole('supplier'), (req, res) => {
  const id = parseInt(req.params.id);
  const po = db.findById('purchase_orders', id);
  if (!po) return res.status(404).json({ error: 'PO not found' });
  if (po.supplier_org_id !== req.user.orgId) return res.status(403).json({ error: 'Not your PO' });

  const { confirmed_lines, comments } = req.body;

  // Update PO lines with confirmed quantities
  if (confirmed_lines) {
    confirmed_lines.forEach(cl => {
      const line = db.findById('po_lines', cl.line_id);
      if (line && line.po_id === id) {
        db.update('po_lines', cl.line_id, { confirmed_qty: cl.confirmed_qty, remarks: cl.remarks || line.remarks });
      }
    });
  }

  // Check if all lines confirmed
  const lines = db.findAll('po_lines', { po_id: id });
  const allConfirmed = lines.every(l => l.confirmed_qty !== null && l.confirmed_qty !== undefined);
  const anyPartial = lines.some(l => l.confirmed_qty !== null && l.confirmed_qty < l.qty);

  let newStatus = 'Confirmed';
  if (anyPartial) newStatus = 'Partially Confirmed';

  const updated = db.update('purchase_orders', id, { status: newStatus });

  // Create confirmation record
  db.insert('po_confirmations', {
    po_id: id,
    supplier_org_id: req.user.orgId,
    status: 'confirmed',
    proposed_date: null,
    change_type: null,
    change_reason: null,
    comments,
    submitted_at: new Date().toISOString(),
    reviewed_at: null
  });

  res.json(updated);
});

// POST /api/orders/:id/request-change - Supplier requests change
router.post('/:id/request-change', requireRole('supplier'), (req, res) => {
  const id = parseInt(req.params.id);
  const po = db.findById('purchase_orders', id);
  if (!po) return res.status(404).json({ error: 'PO not found' });
  if (po.supplier_org_id !== req.user.orgId) return res.status(403).json({ error: 'Not your PO' });

  const { change_type, proposed_date, change_reason, comments } = req.body;

  const updated = db.update('purchase_orders', id, { status: 'Change Requested' });

  db.insert('po_confirmations', {
    po_id: id,
    supplier_org_id: req.user.orgId,
    status: 'submitted',
    proposed_date,
    change_type,
    change_reason,
    comments,
    submitted_at: new Date().toISOString(),
    reviewed_at: null
  });

  // Create task for buyer
  db.insert('tasks', {
    assignee_user_id: 1,
    org_id: 1,
    object_type: 'po',
    object_id: id,
    title: `Review change request for ${po.po_no}`,
    status: 'open',
    due_at: new Date(Date.now() + 3 * 86400000).toISOString()
  });

  res.json(updated);
});

// POST /api/orders/:id/approve-change - Buyer approves change
router.post('/:id/approve-change', requireRole('buyer', 'admin'), (req, res) => {
  const id = parseInt(req.params.id);
  const po = db.findById('purchase_orders', id);
  if (!po) return res.status(404).json({ error: 'PO not found' });

  const confirmation = db.findOne('po_confirmations', { po_id: id, status: 'submitted' });
  if (confirmation) {
    db.update('po_confirmations', confirmation.id, { status: 'approved', reviewed_at: new Date().toISOString() });
  }

  const updated = db.update('purchase_orders', id, { status: 'Confirmed', delivery_date: confirmation ? confirmation.proposed_date : po.delivery_date });
  res.json(updated);
});

// POST /api/orders/:id/reject-change - Buyer rejects change
router.post('/:id/reject-change', requireRole('buyer', 'admin'), (req, res) => {
  const id = parseInt(req.params.id);
  const po = db.findById('purchase_orders', id);
  if (!po) return res.status(404).json({ error: 'PO not found' });

  const { reason } = req.body;
  const confirmation = db.findOne('po_confirmations', { po_id: id, status: 'submitted' });
  if (confirmation) {
    db.update('po_confirmations', confirmation.id, { status: 'rejected', reviewed_at: new Date().toISOString() });
  }

  const updated = db.update('purchase_orders', id, { status: 'Confirmed' });
  res.json(updated);
});

// POST /api/orders/:id/asn - Create ASN
router.post('/:id/asn', requireRole('supplier'), (req, res) => {
  const id = parseInt(req.params.id);
  const po = db.findById('purchase_orders', id);
  if (!po) return res.status(404).json({ error: 'PO not found' });
  if (po.supplier_org_id !== req.user.orgId) return res.status(403).json({ error: 'Not your PO' });

  const { ship_date, eta, carrier, tracking_no, total_cartons, total_pallets, remarks, lines } = req.body;

  const count = db.findAll('asns').length;
  const asnNo = `ASN-${new Date().toISOString().slice(2, 4)}${new Date().toISOString().slice(5, 7)}-${String(count + 1).padStart(3, '0')}`;

  const asn = db.insert('asns', {
    asn_no: asnNo,
    po_id: id,
    supplier_org_id: req.user.orgId,
    status: 'Submitted',
    ship_date,
    eta,
    carrier,
    tracking_no,
    total_cartons,
    total_pallets,
    remarks,
    submitted_at: new Date().toISOString()
  });

  if (lines && lines.length > 0) {
    lines.forEach(line => {
      db.insert('asn_lines', { asn_id: asn.id, ...line });
    });
  }

  // Create task for buyer to review ASN
  db.insert('tasks', {
    assignee_user_id: 1,
    org_id: 1,
    object_type: 'asn',
    object_id: asn.id,
    title: `Review ${asnNo}: ${po.po_no}`,
    status: 'open',
    due_at: new Date(Date.now() + 2 * 86400000).toISOString()
  });

  res.status(201).json(asn);
});

// GET /api/orders/asns - List ASNs
router.get('/asns/list', (req, res) => {
  const { status, po_id } = req.query;
  let asns = db.findAll('asns');

  if (req.user.role === 'supplier') {
    asns = asns.filter(a => a.supplier_org_id === req.user.orgId);
  }

  if (status) asns = asns.filter(a => a.status === status);
  if (po_id) asns = asns.filter(a => a.po_id === parseInt(po_id));

  const enriched = asns.map(a => {
    const po = db.findById('purchase_orders', a.po_id);
    const org = db.findById('organizations', a.supplier_org_id);
    return { ...a, po_no: po ? po.po_no : null, supplier_name: org ? org.short_name : null };
  });

  res.json(enriched);
});

// GET /api/orders/asns/:id - Get ASN detail
router.get('/asns/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const asn = db.findById('asns', id);
  if (!asn) return res.status(404).json({ error: 'ASN not found' });

  const lines = db.findAll('asn_lines', { asn_id: id });
  const exceptions = db.findAll('asn_exceptions', { asn_id: id });
  const po = db.findById('purchase_orders', asn.po_id);

  res.json({ ...asn, lines, exceptions, po_no: po ? po.po_no : null });
});

// POST /api/orders/asns/:id/accept - Accept ASN
router.post('/asns/:id/accept', requireRole('buyer', 'admin'), (req, res) => {
  const id = parseInt(req.params.id);
  const asn = db.findById('asns', id);
  if (!asn) return res.status(404).json({ error: 'ASN not found' });

  const updated = db.update('asns', id, { status: 'Accepted' });
  res.json(updated);
});

// POST /api/orders/asns/:id/exception - Report exception
router.post('/asns/:id/exception', requireRole('buyer', 'admin'), (req, res) => {
  const id = parseInt(req.params.id);
  const asn = db.findById('asns', id);
  if (!asn) return res.status(404).json({ error: 'ASN not found' });

  const { exception_type, description } = req.body;

  const updated = db.update('asns', id, { status: 'Exception' });

  db.insert('asn_exceptions', {
    asn_id: id,
    exception_type,
    description,
    reported_by: req.user.userId,
    reported_at: new Date().toISOString(),
    status: 'open'
  });

  // Notify supplier
  const supplierUsers = db.findAll('users', { org_id: asn.supplier_org_id });
  supplierUsers.forEach(u => {
    db.insert('notifications', {
      user_id: u.id,
      title: 'ASN exception reported',
      message: `${asn.asn_no} has been marked with exception: ${exception_type}.`,
      object_type: 'asn',
      object_id: id,
      is_read: false
    });
  });

  // Create task for supplier
  supplierUsers.forEach(u => {
    db.insert('tasks', {
      assignee_user_id: u.id,
      org_id: asn.supplier_org_id,
      object_type: 'asn',
      object_id: id,
      title: `Resolve exception for ${asn.asn_no}: ${exception_type}`,
      status: 'open',
      due_at: new Date(Date.now() + 3 * 86400000).toISOString()
    });
  });

  res.json(updated);
});

module.exports = router;
