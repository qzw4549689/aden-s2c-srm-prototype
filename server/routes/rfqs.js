const express = require('express');
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// GET /api/rfqs - List RFQs
router.get('/', (req, res) => {
  const { status, category, search, myInvitations } = req.query;
  let rfqs = db.findAll('rfqs');

  // Supplier: only see invited RFQs
  if (req.user.role === 'supplier') {
    const myOrgId = req.user.orgId;
    const myInvs = db.findAll('rfq_invitations', { supplier_org_id: myOrgId });
    const rfqIds = myInvs.map(i => i.rfq_id);
    rfqs = rfqs.filter(r => rfqIds.includes(r.id));

    // Enrich with invitation status
    rfqs = rfqs.map(r => {
      const inv = myInvs.find(i => i.rfq_id === r.id);
      return { ...r, my_invitation_status: inv ? inv.status : null };
    });
  }

  if (status) rfqs = rfqs.filter(r => r.status === status);
  if (category) rfqs = rfqs.filter(r => r.category === category);
  if (search) {
    const q = search.toLowerCase();
    rfqs = rfqs.filter(r => r.rfq_no.toLowerCase().includes(q) || r.title.toLowerCase().includes(q));
  }

  res.json(rfqs);
});

// GET /api/rfqs/:id - Get RFQ detail with items
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const rfq = db.findById('rfqs', id);
  if (!rfq) return res.status(404).json({ error: 'RFQ not found' });

  const items = db.findAll('rfq_items', { rfq_id: id });
  const invitations = db.findAll('rfq_invitations', { rfq_id: id });
  const quotes = db.findAll('quotes', { rfq_id: id });

  // Enrich invitations with supplier names
  const enrichedInvs = invitations.map(i => {
    const org = db.findById('organizations', i.supplier_org_id);
    return { ...i, supplier_name: org ? org.short_name : null };
  });

  // Enrich quotes with supplier names
  const enrichedQuotes = quotes.map(q => {
    const org = db.findById('organizations', q.supplier_org_id);
    return { ...q, supplier_name: org ? org.short_name : null };
  });

  res.json({ ...rfq, items, invitations: enrichedInvs, quotes: enrichedQuotes });
});

// POST /api/rfqs - Create RFQ (buyer/admin)
router.post('/', requireRole('buyer', 'admin'), (req, res) => {
  const { title, category, due_at, items, invited_supplier_ids } = req.body;

  const count = db.findAll('rfqs').length;
  const rfqNo = `RFQ-${new Date().toISOString().slice(2, 4)}${new Date().toISOString().slice(5, 7)}-${String(count + 1).padStart(3, '0')}`;

  const rfq = db.insert('rfqs', {
    rfq_no: rfqNo,
    title,
    category,
    status: 'Draft',
    due_at,
    created_by: req.user.userId,
    published_at: null,
    award_supplier_id: null,
    award_amount: null,
    rejection_reason: null,
    revision_count: 0
  });

  // Insert items
  if (items && items.length > 0) {
    items.forEach(item => {
      db.insert('rfq_items', { rfq_id: rfq.id, ...item });
    });
  }

  // Create invitations
  if (invited_supplier_ids && invited_supplier_ids.length > 0) {
    invited_supplier_ids.forEach(sid => {
      db.insert('rfq_invitations', {
        rfq_id: rfq.id,
        supplier_org_id: sid,
        status: 'pending',
        invited_at: new Date().toISOString(),
        responded_at: null
      });
    });
  }

  res.status(201).json(rfq);
});

// PUT /api/rfqs/:id - Update RFQ
router.put('/:id', requireRole('buyer', 'admin'), (req, res) => {
  const id = parseInt(req.params.id);
  const rfq = db.findById('rfqs', id);
  if (!rfq) return res.status(404).json({ error: 'RFQ not found' });

  const updates = req.body;
  delete updates.id;
  delete updates.created_at;

  const updated = db.update('rfqs', id, updates);
  res.json(updated);
});

// POST /api/rfqs/:id/publish - Publish RFQ
router.post('/:id/publish', requireRole('buyer', 'admin'), (req, res) => {
  const id = parseInt(req.params.id);
  const rfq = db.findById('rfqs', id);
  if (!rfq) return res.status(404).json({ error: 'RFQ not found' });

  const updated = db.update('rfqs', id, {
    status: 'Published',
    published_at: new Date().toISOString()
  });

  // Create tasks for invited suppliers
  const invitations = db.findAll('rfq_invitations', { rfq_id: id });
  invitations.forEach(inv => {
    const supplierUsers = db.findAll('users', { org_id: inv.supplier_org_id });
    supplierUsers.forEach(u => {
      db.insert('tasks', {
        assignee_user_id: u.id,
        org_id: inv.supplier_org_id,
        object_type: 'rfq',
        object_id: id,
        title: `Submit quote for ${rfq.rfq_no}: ${rfq.title}`,
        status: 'open',
        due_at: rfq.due_at
      });
    });
  });

  res.json(updated);
});

// POST /api/rfqs/:id/award - Award RFQ
router.post('/:id/award', requireRole('buyer', 'admin'), (req, res) => {
  const id = parseInt(req.params.id);
  const rfq = db.findById('rfqs', id);
  if (!rfq) return res.status(404).json({ error: 'RFQ not found' });

  const { supplier_org_id, amount } = req.body;

  const updated = db.update('rfqs', id, {
    status: 'Award Pending',
    award_supplier_id: supplier_org_id,
    award_amount: amount
  });

  // Create approval request
  db.insert('approval_requests', {
    object_type: 'rfq',
    object_id: id,
    status: 'pending',
    current_step: 1,
    submitted_by: req.user.userId,
    submitted_at: new Date().toISOString(),
    completed_at: null
  });

  // Create task for buyer approval
  db.insert('tasks', {
    assignee_user_id: 1,
    org_id: 1,
    object_type: 'rfq',
    object_id: id,
    title: `Approve award for ${rfq.rfq_no}: ${rfq.title}`,
    status: 'open',
    due_at: new Date(Date.now() + 3 * 86400000).toISOString()
  });

  res.json(updated);
});

// POST /api/rfqs/:id/approve-award - Approve award
router.post('/:id/approve-award', requireRole('buyer', 'admin'), (req, res) => {
  const id = parseInt(req.params.id);
  const rfq = db.findById('rfqs', id);
  if (!rfq) return res.status(404).json({ error: 'RFQ not found' });

  const updated = db.update('rfqs', id, { status: 'Award Approved' });

  // Update approval request
  const approval = db.findOne('approval_requests', { object_type: 'rfq', object_id: id });
  if (approval) {
    db.update('approval_requests', approval.id, { status: 'approved', completed_at: new Date().toISOString() });
    db.insert('approval_actions', {
      approval_id: approval.id,
      action: 'approve',
      actor_id: req.user.userId,
      comments: req.body.comments || 'Award approved',
      action_at: new Date().toISOString()
    });
  }

  // Notify winning supplier
  const supplierUsers = db.findAll('users', { org_id: rfq.award_supplier_id });
  supplierUsers.forEach(u => {
    db.insert('notifications', {
      user_id: u.id,
      title: 'Award approved',
      message: `Congratulations! You have been awarded ${rfq.rfq_no}.`,
      object_type: 'rfq',
      object_id: id,
      is_read: false
    });
  });

  res.json(updated);
});

// POST /api/rfqs/:id/reject-award - Reject award
router.post('/:id/reject-award', requireRole('buyer', 'admin'), (req, res) => {
  const id = parseInt(req.params.id);
  const rfq = db.findById('rfqs', id);
  if (!rfq) return res.status(404).json({ error: 'RFQ not found' });

  const { reason } = req.body;
  const updated = db.update('rfqs', id, {
    status: 'Returned',
    rejection_reason: reason,
    revision_count: (rfq.revision_count || 0) + 1
  });

  const approval = db.findOne('approval_requests', { object_type: 'rfq', object_id: id });
  if (approval) {
    db.update('approval_requests', approval.id, { status: 'returned', completed_at: new Date().toISOString() });
    db.insert('approval_actions', {
      approval_id: approval.id,
      action: 'return',
      actor_id: req.user.userId,
      comments: reason,
      action_at: new Date().toISOString()
    });
  }

  res.json(updated);
});

// POST /api/rfqs/:id/quote - Submit quote (supplier)
router.post('/:id/quote', requireRole('supplier'), (req, res) => {
  const id = parseInt(req.params.id);
  const rfq = db.findById('rfqs', id);
  if (!rfq) return res.status(404).json({ error: 'RFQ not found' });

  const myOrgId = req.user.orgId;
  const invitation = db.findOne('rfq_invitations', { rfq_id: id, supplier_org_id: myOrgId });
  if (!invitation) return res.status(403).json({ error: 'Not invited to this RFQ' });

  const { total_amount, currency, lead_time, moq, validity_days, remarks, items } = req.body;

  const quote = db.insert('quotes', {
    rfq_id: id,
    supplier_org_id: myOrgId,
    status: 'submitted',
    total_amount,
    currency: currency || 'CNY',
    lead_time,
    moq,
    validity_days: validity_days || 30,
    remarks,
    submitted_at: new Date().toISOString(),
    revision_no: 1
  });

  if (items && items.length > 0) {
    items.forEach(item => {
      db.insert('quote_items', { quote_id: quote.id, ...item });
    });
  }

  // Update invitation status
  db.update('rfq_invitations', invitation.id, { status: 'quoted', responded_at: new Date().toISOString() });

  res.status(201).json(quote);
});

// GET /api/rfqs/:id/compare - Quote comparison
router.get('/:id/compare', requireRole('buyer', 'admin'), (req, res) => {
  const id = parseInt(req.params.id);
  const rfq = db.findById('rfqs', id);
  if (!rfq) return res.status(404).json({ error: 'RFQ not found' });

  const items = db.findAll('rfq_items', { rfq_id: id });
  const quotes = db.findAll('quotes', { rfq_id: id });

  const enrichedQuotes = quotes.map(q => {
    const org = db.findById('organizations', q.supplier_org_id);
    const qItems = db.findAll('quote_items', { quote_id: q.id });
    return {
      ...q,
      supplier_name: org ? org.short_name : null,
      items: qItems
    };
  });

  res.json({ rfq, items, quotes: enrichedQuotes });
});

module.exports = router;
