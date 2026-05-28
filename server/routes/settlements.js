const express = require('express');
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// GET /api/settlements - List settlements
router.get('/', (req, res) => {
  const { status, period, supplier_org_id } = req.query;
  let settlements = db.findAll('settlements');

  // Supplier: only see own settlements
  if (req.user.role === 'supplier') {
    settlements = settlements.filter(s => s.supplier_org_id === req.user.orgId);
  }

  if (status) settlements = settlements.filter(s => s.status === status);
  if (period) settlements = settlements.filter(s => s.period === period);
  if (supplier_org_id) settlements = settlements.filter(s => s.supplier_org_id === parseInt(supplier_org_id));

  const enriched = settlements.map(s => {
    const org = db.findById('organizations', s.supplier_org_id);
    return { ...s, supplier_name: org ? org.short_name : null };
  });

  res.json(enriched);
});

// GET /api/settlements/:id - Get settlement detail with lines
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const settlement = db.findById('settlements', id);
  if (!settlement) return res.status(404).json({ error: 'Settlement not found' });

  const lines = db.findAll('settlement_lines', { settlement_id: id });
  const invoices = db.findAll('invoices', { settlement_id: id });
  const org = db.findById('organizations', settlement.supplier_org_id);

  res.json({ ...settlement, supplier_name: org ? org.short_name : null, lines, invoices });
});

// POST /api/settlements - Create settlement (buyer)
router.post('/', requireRole('buyer', 'admin'), (req, res) => {
  const { supplier_org_id, period, lines } = req.body;

  const count = db.findAll('settlements').length;
  const stmNo = `STM-${period.slice(2, 4)}${period.slice(5, 7)}-${String(144 + count).padStart(3, '0')}`;

  const settlement = db.insert('settlements', {
    settlement_no: stmNo,
    supplier_org_id,
    period,
    status: 'Published',
    total_amount: 0,
    dispute_amount: 0,
    dispute_reason: null,
    dispute_attachment: null,
    created_by: req.user.userId,
    published_at: new Date().toISOString(),
    confirmed_at: null
  });

  let total = 0;
  if (lines && lines.length > 0) {
    lines.forEach(line => {
      db.insert('settlement_lines', { settlement_id: settlement.id, ...line });
      total += line.amount || 0;
    });
    db.update('settlements', settlement.id, { total_amount: total });
  }

  // Create task for supplier
  const supplierUsers = db.findAll('users', { org_id: supplier_org_id });
  supplierUsers.forEach(u => {
    db.insert('tasks', {
      assignee_user_id: u.id,
      org_id: supplier_org_id,
      object_type: 'settlement',
      object_id: settlement.id,
      title: `Confirm settlement ${stmNo} for ${period}`,
      status: 'open',
      due_at: new Date(Date.now() + 7 * 86400000).toISOString()
    });

    db.insert('notifications', {
      user_id: u.id,
      title: 'Settlement published',
      message: `${stmNo} has been published for your confirmation.`,
      object_type: 'settlement',
      object_id: settlement.id,
      is_read: false
    });
  });

  res.status(201).json({ ...settlement, total_amount: total });
});

// POST /api/settlements/:id/confirm - Supplier confirms
router.post('/:id/confirm', requireRole('supplier'), (req, res) => {
  const id = parseInt(req.params.id);
  const settlement = db.findById('settlements', id);
  if (!settlement) return res.status(404).json({ error: 'Settlement not found' });
  if (settlement.supplier_org_id !== req.user.orgId) return res.status(403).json({ error: 'Not your settlement' });

  const updated = db.update('settlements', id, {
    status: 'Supplier Confirmed',
    confirmed_at: new Date().toISOString()
  });

  res.json(updated);
});

// POST /api/settlements/:id/dispute - Supplier disputes
router.post('/:id/dispute', requireRole('supplier'), (req, res) => {
  const id = parseInt(req.params.id);
  const settlement = db.findById('settlements', id);
  if (!settlement) return res.status(404).json({ error: 'Settlement not found' });
  if (settlement.supplier_org_id !== req.user.orgId) return res.status(403).json({ error: 'Not your settlement' });

  const { dispute_amount, dispute_reason, dispute_attachment } = req.body;

  const updated = db.update('settlements', id, {
    status: 'Disputed',
    dispute_amount,
    dispute_reason,
    dispute_attachment
  });

  // Create task for buyer
  db.insert('tasks', {
    assignee_user_id: 1,
    org_id: 1,
    object_type: 'settlement',
    object_id: id,
    title: `Review dispute for ${settlement.settlement_no}`,
    status: 'open',
    due_at: new Date(Date.now() + 5 * 86400000).toISOString()
  });

  res.json(updated);
});

// POST /api/settlements/:id/approve - Buyer approves settlement
router.post('/:id/approve', requireRole('buyer', 'admin'), (req, res) => {
  const id = parseInt(req.params.id);
  const settlement = db.findById('settlements', id);
  if (!settlement) return res.status(404).json({ error: 'Settlement not found' });

  const updated = db.update('settlements', id, { status: 'Approved' });
  res.json(updated);
});

// POST /api/settlements/:id/invoice - Submit invoice (supplier)
router.post('/:id/invoice', requireRole('supplier'), (req, res) => {
  const id = parseInt(req.params.id);
  const settlement = db.findById('settlements', id);
  if (!settlement) return res.status(404).json({ error: 'Settlement not found' });
  if (settlement.supplier_org_id !== req.user.orgId) return res.status(403).json({ error: 'Not your settlement' });

  const { invoice_no, invoice_date, amount, tax_amount, tax_rate, currency, attachment } = req.body;

  // Simulate OCR
  const ocrStatuses = ['passed', 'passed', 'passed', 'exception'];
  const ocrStatus = ocrStatuses[Math.floor(Math.random() * ocrStatuses.length)];

  // Simulate verification
  const verificationStatus = ocrStatus === 'passed' ? 'verified' : 'failed';

  const invoice = db.insert('invoices', {
    settlement_id: id,
    invoice_no,
    invoice_date,
    amount,
    tax_amount,
    tax_rate: tax_rate || 0.06,
    currency: currency || 'CNY',
    ocr_status: ocrStatus,
    verification_status: verificationStatus,
    status: verificationStatus === 'verified' ? 'Under Review' : 'Returned',
    attachment,
    rejection_reason: verificationStatus === 'failed' ? 'OCR verification failed' : null,
    submitted_at: new Date().toISOString(),
    approved_at: null
  });

  // Update settlement status
  db.update('settlements', id, { status: 'Invoice Submitted' });

  // Create task for buyer if passed
  if (ocrStatus === 'passed') {
    db.insert('tasks', {
      assignee_user_id: 1,
      org_id: 1,
      object_type: 'invoice',
      object_id: invoice.id,
      title: `Approve invoice ${invoice_no}`,
      status: 'open',
      due_at: new Date(Date.now() + 3 * 86400000).toISOString()
    });
  } else {
    // Create task for supplier to resubmit
    db.insert('tasks', {
      assignee_user_id: req.user.userId,
      org_id: req.user.orgId,
      object_type: 'invoice',
      object_id: invoice.id,
      title: `Resubmit invoice ${invoice_no} (OCR failed)`,
      status: 'open',
      due_at: new Date(Date.now() + 3 * 86400000).toISOString()
    });
  }

  res.status(201).json(invoice);
});

// POST /api/settlements/invoices/:id/approve - Approve invoice
router.post('/invoices/:id/approve', requireRole('buyer', 'admin'), (req, res) => {
  const id = parseInt(req.params.id);
  const invoice = db.findById('invoices', id);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

  const updated = db.update('invoices', id, {
    status: 'Approved',
    approved_at: new Date().toISOString()
  });

  res.json(updated);
});

// POST /api/settlements/invoices/:id/reject - Reject invoice
router.post('/invoices/:id/reject', requireRole('buyer', 'admin'), (req, res) => {
  const id = parseInt(req.params.id);
  const invoice = db.findById('invoices', id);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

  const { reason } = req.body;
  const updated = db.update('invoices', id, {
    status: 'Returned',
    rejection_reason: reason
  });

  // Create task for supplier
  const settlement = db.findById('settlements', invoice.settlement_id);
  if (settlement) {
    const supplierUsers = db.findAll('users', { org_id: settlement.supplier_org_id });
    supplierUsers.forEach(u => {
      db.insert('tasks', {
        assignee_user_id: u.id,
        org_id: settlement.supplier_org_id,
        object_type: 'invoice',
        object_id: id,
        title: `Resubmit invoice ${invoice.invoice_no} (${reason})`,
        status: 'open',
        due_at: new Date(Date.now() + 3 * 86400000).toISOString()
      });

      db.insert('notifications', {
        user_id: u.id,
        title: 'Invoice returned',
        message: `Invoice ${invoice.invoice_no} has been returned: ${reason}.`,
        object_type: 'invoice',
        object_id: id,
        is_read: false
      });
    });
  }

  res.json(updated);
});

module.exports = router;
