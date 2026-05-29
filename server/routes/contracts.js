const express = require('express');
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// GET /api/contracts - List contracts
router.get('/', (req, res) => {
  const { status, supplier_org_id, search } = req.query;
  let contracts = db.findAll('contracts') || [];

  if (status) contracts = contracts.filter(c => c.status === status);
  if (supplier_org_id) contracts = contracts.filter(c => c.supplier_org_id === parseInt(supplier_org_id));
  if (search) {
    const q = search.toLowerCase();
    contracts = contracts.filter(c =>
      (c.contract_no && c.contract_no.toLowerCase().includes(q)) ||
      (c.title && c.title.toLowerCase().includes(q))
    );
  }

  const enriched = contracts.map(c => {
    const org = db.findById('organizations', c.supplier_org_id);
    const rfq = c.rfq_id ? db.findById('rfqs', c.rfq_id) : null;
    return {
      ...c,
      supplier_name: org ? org.short_name : null,
      rfq_no: rfq ? rfq.rfq_no : null
    };
  });

  res.json(enriched);
});

// GET /api/contracts/:id - Get contract detail
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const contract = db.findById('contracts', id);
  if (!contract) return res.status(404).json({ error: 'Contract not found' });

  const org = db.findById('organizations', contract.supplier_org_id);
  const rfq = contract.rfq_id ? db.findById('rfqs', contract.rfq_id) : null;
  res.json({
    ...contract,
    supplier_name: org ? org.short_name : null,
    rfq_no: rfq ? rfq.rfq_no : null
  });
});

// POST /api/contracts - Create contract
router.post('/', requireRole('buyer', 'admin'), (req, res) => {
  const { contract_no, title, supplier_org_id, rfq_id, start_date, end_date, total_amount, currency, terms } = req.body;

  const existingCount = (db.findAll('contracts') || []).length;
  const contract = db.insert('contracts', {
    contract_no: contract_no || `CTR-${new Date().toISOString().slice(2, 4)}${new Date().toISOString().slice(5, 7)}-${String(existingCount + 1).padStart(3, '0')}`,
    title,
    supplier_org_id: parseInt(supplier_org_id),
    rfq_id: rfq_id ? parseInt(rfq_id) : null,
    status: 'draft',
    start_date,
    end_date,
    total_amount: parseFloat(total_amount) || 0,
    currency: currency || 'CNY',
    terms,
    created_by: req.user.userId
  });

  res.status(201).json(contract);
});

// PUT /api/contracts/:id - Update contract
router.put('/:id', requireRole('buyer', 'admin'), (req, res) => {
  const id = parseInt(req.params.id);
  const contract = db.findById('contracts', id);
  if (!contract) return res.status(404).json({ error: 'Contract not found' });

  const updates = req.body;
  delete updates.id;
  delete updates.created_at;

  const updated = db.update('contracts', id, updates);
  res.json(updated);
});

// POST /api/contracts/:id/submit - Submit contract for approval (draft -> under_review)
router.post('/:id/submit', requireRole('buyer', 'admin'), (req, res) => {
  const id = parseInt(req.params.id);
  const contract = db.findById('contracts', id);
  if (!contract) return res.status(404).json({ error: 'Contract not found' });
  if (contract.status !== 'draft' && contract.status !== 'resubmitted') {
    return res.status(400).json({ error: 'Contract must be in draft or resubmitted status' });
  }

  const updated = db.update('contracts', id, {
    status: 'under_review',
    rejection_reason: null
  });

  // Create approval request
  db.insert('approval_requests', {
    object_type: 'contract',
    object_id: id,
    status: 'pending',
    current_step: 1,
    submitted_by: req.user.userId,
    submitted_at: new Date().toISOString()
  });

  // Create task for reviewer
  db.insert('tasks', {
    assignee_user_id: 1, // Buyer
    org_id: 1,
    object_type: 'contract',
    object_id: id,
    title: `Review contract: ${contract.contract_no}`,
    status: 'open',
    due_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  });

  // Create notification
  db.insert('notifications', {
    user_id: 1,
    title: 'Contract submitted for approval',
    message: `${contract.contract_no} has been submitted for approval.`,
    object_type: 'contract',
    object_id: id,
    is_read: 0
  });

  // Audit log
  db.insert('audit_logs', {
    actor_id: req.user.userId,
    object_type: 'contract',
    object_id: id,
    action: 'submitted',
    before_json: JSON.stringify({ status: contract.status }),
    after_json: JSON.stringify({ status: 'under_review' }),
    comments: `${contract.contract_no} submitted for approval`
  });

  res.json(updated);
});

// POST /api/contracts/:id/approve - Approve contract (under_review -> approved)
router.post('/:id/approve', requireRole('buyer', 'admin'), (req, res) => {
  const id = parseInt(req.params.id);
  const contract = db.findById('contracts', id);
  if (!contract) return res.status(404).json({ error: 'Contract not found' });
  if (contract.status !== 'under_review') {
    return res.status(400).json({ error: 'Contract must be under review' });
  }

  const updated = db.update('contracts', id, { status: 'approved' });

  // Update approval request
  const approvalReqs = db.raw(
    "SELECT * FROM approval_requests WHERE object_type = 'contract' AND object_id = ? AND status = 'pending'",
    [id]
  );
  if (approvalReqs.length > 0) {
    db.update('approval_requests', approvalReqs[0].id, { status: 'approved', completed_at: new Date().toISOString() });
    db.insert('approval_actions', {
      approval_id: approvalReqs[0].id,
      action: 'approve',
      actor_id: req.user.userId,
      comments: 'Contract approved',
      action_at: new Date().toISOString()
    });
  }

  // Close related task
  const tasks = db.raw(
    "SELECT * FROM tasks WHERE object_type = 'contract' AND object_id = ? AND status = 'open'",
    [id]
  );
  tasks.forEach(t => db.update('tasks', t.id, { status: 'completed', completed_at: new Date().toISOString() }));

  // Notification
  db.insert('notifications', {
    user_id: 1,
    title: 'Contract approved',
    message: `${contract.contract_no} has been approved and is ready for signing.`,
    object_type: 'contract',
    object_id: id,
    is_read: 0
  });

  res.json(updated);
});

// POST /api/contracts/:id/return - Return contract (under_review -> returned)
router.post('/:id/return', requireRole('buyer', 'admin'), (req, res) => {
  const id = parseInt(req.params.id);
  const { reason } = req.body;
  const contract = db.findById('contracts', id);
  if (!contract) return res.status(404).json({ error: 'Contract not found' });
  if (contract.status !== 'under_review') {
    return res.status(400).json({ error: 'Contract must be under review' });
  }

  const updated = db.update('contracts', id, {
    status: 'returned',
    rejection_reason: reason || 'Returned for revision'
  });

  // Update approval request
  const approvalReqs = db.raw(
    "SELECT * FROM approval_requests WHERE object_type = 'contract' AND object_id = ? AND status = 'pending'",
    [id]
  );
  if (approvalReqs.length > 0) {
    db.update('approval_requests', approvalReqs[0].id, { status: 'returned', completed_at: new Date().toISOString() });
    db.insert('approval_actions', {
      approval_id: approvalReqs[0].id,
      action: 'return',
      actor_id: req.user.userId,
      comments: reason || 'Returned for revision',
      action_at: new Date().toISOString()
    });
  }

  // Notification
  db.insert('notifications', {
    user_id: 1,
    title: 'Contract returned',
    message: `${contract.contract_no} has been returned: ${reason || 'Returned for revision'}`,
    object_type: 'contract',
    object_id: id,
    is_read: 0
  });

  res.json(updated);
});

// POST /api/contracts/:id/sign - Sign contract (approved -> signed)
router.post('/:id/sign', requireRole('buyer', 'admin'), (req, res) => {
  const id = parseInt(req.params.id);
  const contract = db.findById('contracts', id);
  if (!contract) return res.status(404).json({ error: 'Contract not found' });
  if (contract.status !== 'approved') {
    return res.status(400).json({ error: 'Contract must be approved before signing' });
  }

  const updated = db.update('contracts', id, {
    status: 'signed',
    signed_at: new Date().toISOString(),
    signed_by_buyer: req.user.userId
  });

  // Audit log
  db.insert('audit_logs', {
    actor_id: req.user.userId,
    object_type: 'contract',
    object_id: id,
    action: 'signed',
    before_json: JSON.stringify({ status: 'approved' }),
    after_json: JSON.stringify({ status: 'signed' }),
    comments: `${contract.contract_no} signed`
  });

  // Notification
  db.insert('notifications', {
    user_id: 1,
    title: 'Contract signed',
    message: `${contract.contract_no} has been signed successfully.`,
    object_type: 'contract',
    object_id: id,
    is_read: 0
  });

  res.json(updated);
});

module.exports = router;
