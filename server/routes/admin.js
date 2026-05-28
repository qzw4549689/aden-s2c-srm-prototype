const express = require('express');
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);
router.use(requireRole('admin'));

// GET /api/admin/users - List all users
router.get('/users', (req, res) => {
  const users = db.findAll('users').map(u => ({
    id: u.id,
    email: u.email,
    display_name: u.display_name,
    role: u.role,
    org_id: u.org_id,
    status: u.status
  }));
  res.json(users);
});

// GET /api/admin/stats - System stats
router.get('/stats', (req, res) => {
  res.json({
    users: db.findAll('users').length,
    organizations: db.findAll('organizations').length,
    suppliers: db.findAll('supplier_profiles').length,
    rfqs: db.findAll('rfqs').length,
    purchase_orders: db.findAll('purchase_orders').length,
    asns: db.findAll('asns').length,
    settlements: db.findAll('settlements').length,
    invoices: db.findAll('invoices').length,
    tasks: db.findAll('tasks').length,
    notifications: db.findAll('notifications').length,
    audit_logs: db.findAll('audit_logs').length
  });
});

// GET /api/admin/configs - System configs
router.get('/configs', (req, res) => {
  res.json(db.findAll('system_configs'));
});

// PUT /api/admin/configs/:key - Update config
router.put('/configs/:key', (req, res) => {
  const { key } = req.params;
  const config = db.findOne('system_configs', { key });
  if (!config) return res.status(404).json({ error: 'Config not found' });

  const updated = db.update('system_configs', config.id, {
    value_json: JSON.stringify(req.body)
  });
  res.json(updated);
});

// GET /api/admin/approvals - Approval requests
router.get('/approvals', (req, res) => {
  const { status } = req.query;
  let approvals = db.findAll('approval_requests');
  if (status) approvals = approvals.filter(a => a.status === status);

  const enriched = approvals.map(a => {
    let object = null;
    if (a.object_type === 'rfq') object = db.findById('rfqs', a.object_id);
    if (a.object_type === 'onboarding') object = db.findById('supplier_profiles', a.object_id);
    if (a.object_type === 'invoice') object = db.findById('invoices', a.object_id);

    const submitter = db.findById('users', a.submitted_by);
    return { ...a, object, submitter_name: submitter ? submitter.display_name : null };
  });

  res.json(enriched);
});

// POST /api/admin/approvals/:id/approve - Approve request
router.post('/approvals/:id/approve', (req, res) => {
  const id = parseInt(req.params.id);
  const approval = db.findById('approval_requests', id);
  if (!approval) return res.status(404).json({ error: 'Approval not found' });

  db.update('approval_requests', id, { status: 'approved', completed_at: new Date().toISOString() });
  db.insert('approval_actions', {
    approval_id: id,
    action: 'approve',
    actor_id: req.user.userId,
    comments: req.body.comments || 'Approved',
    action_at: new Date().toISOString()
  });

  res.json({ success: true });
});

// POST /api/admin/approvals/:id/reject - Reject request
router.post('/approvals/:id/reject', (req, res) => {
  const id = parseInt(req.params.id);
  const approval = db.findById('approval_requests', id);
  if (!approval) return res.status(404).json({ error: 'Approval not found' });

  db.update('approval_requests', id, { status: 'rejected', completed_at: new Date().toISOString() });
  db.insert('approval_actions', {
    approval_id: id,
    action: 'reject',
    actor_id: req.user.userId,
    comments: req.body.reason || 'Rejected',
    action_at: new Date().toISOString()
  });

  res.json({ success: true });
});

module.exports = router;
