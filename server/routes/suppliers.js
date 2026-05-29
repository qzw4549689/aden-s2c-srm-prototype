const express = require('express');
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// All routes require auth
router.use(authenticateToken);

// GET /api/suppliers - List suppliers
router.get('/', (req, res) => {
  const { status, category, search } = req.query;
  let suppliers = db.findAll('supplier_profiles');

  if (status) suppliers = suppliers.filter(s => s.qualification_status === status);
  if (category) suppliers = suppliers.filter(s => s.category === category);
  if (search) {
    const q = search.toLowerCase();
    suppliers = suppliers.filter(s => {
      const org = db.findById('organizations', s.org_id);
      return (org && org.short_name.toLowerCase().includes(q)) ||
             (s.contact_name && s.contact_name.toLowerCase().includes(q)) ||
             (s.contact_email && s.contact_email.toLowerCase().includes(q));
    });
  }

  const enriched = suppliers.map(s => {
    const org = db.findById('organizations', s.org_id);
    return { ...s, org_name: org ? org.short_name : null, org_type: org ? org.type : null };
  });

  res.json(enriched);
});

// GET /api/suppliers/:id - Get supplier detail
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const profile = db.findById('supplier_profiles', id);
  if (!profile) return res.status(404).json({ error: 'Supplier not found' });
  const org = db.findById('organizations', profile.org_id);
  res.json({ ...profile, org_name: org ? org.short_name : null });
});

// POST /api/suppliers - Create supplier (buyer/admin only)
router.post('/', requireRole('buyer', 'admin'), (req, res) => {
  const { org_name, category, contact_name, contact_phone, contact_email, business_license_no, tax_certificate_no, food_safety_cert_no, bank_name, bank_account, bank_branch, address } = req.body;

  const org = db.insert('organizations', {
    type: 'supplier',
    legal_name: org_name,
    short_name: org_name,
    tax_no: tax_certificate_no,
    bank_account,
    bank_name,
    address,
    status: 'active'
  });

  const profile = db.insert('supplier_profiles', {
    org_id: org.id,
    category,
    qualification_status: 'Draft',
    score: 0,
    service_area: address,
    contact_name,
    contact_phone,
    contact_email,
    business_license_no,
    tax_certificate_no,
    food_safety_cert_no,
    bank_name,
    bank_account,
    bank_branch,
    submitted_at: null,
    approved_at: null,
    rejected_at: null,
    rejection_reason: null,
    version: 1,
    created_by: req.user.userId,
    updated_by: req.user.userId
  });

  res.status(201).json({ ...profile, org_name });
});

// PUT /api/suppliers/:id - Update supplier profile
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const profile = db.findById('supplier_profiles', id);
  if (!profile) return res.status(404).json({ error: 'Supplier not found' });

  // Suppliers can only edit their own profile
  if (req.user.role === 'supplier' && profile.org_id !== req.user.orgId) {
    return res.status(403).json({ error: 'Can only edit own profile' });
  }

  const updates = req.body;
  delete updates.id;
  delete updates.created_at;

  // If org_name is updated, also update the organizations table (both name and short_name)
  if (updates.org_name) {
    db.update('organizations', profile.org_id, { name: updates.org_name, short_name: updates.org_name });
    delete updates.org_name;
  }

  const updated = db.update('supplier_profiles', id, { ...updates, updated_by: req.user.userId });
  res.json(updated);
});

// POST /api/suppliers/:id/submit - Submit for approval
router.post('/:id/submit', requireRole('supplier'), (req, res) => {
  const id = parseInt(req.params.id);
  const profile = db.findById('supplier_profiles', id);
  if (!profile) return res.status(404).json({ error: 'Supplier not found' });
  if (profile.org_id !== req.user.orgId) return res.status(403).json({ error: 'Can only submit own profile' });

  const updated = db.update('supplier_profiles', id, {
    qualification_status: 'Buyer Review',
    submitted_at: new Date().toISOString()
  });

  // Create approval request
  db.insert('approval_requests', {
    object_type: 'onboarding',
    object_id: id,
    status: 'pending',
    current_step: 1,
    submitted_by: req.user.userId,
    submitted_at: new Date().toISOString(),
    completed_at: null
  });

  // Create task for buyer
  db.insert('tasks', {
    assignee_user_id: 1,
    org_id: 1,
    object_type: 'onboarding',
    object_id: id,
    title: `Review supplier onboarding: ${profile.short_name || 'New Supplier'}`,
    status: 'open',
    due_at: new Date(Date.now() + 7 * 86400000).toISOString()
  });

  // Notify supplier that onboarding has been submitted
  const supplierUsers = db.findAll('users', { org_id: profile.org_id });
  supplierUsers.forEach(u => {
    db.insert('notifications', {
      user_id: u.id,
      title: 'Supplier onboarding submitted',
      message: `Your supplier profile has been submitted for buyer review. Current status: Buyer Review.`,
      object_type: 'onboarding',
      object_id: id,
      is_read: false
    });
  });

  res.json(updated);
});

// POST /api/suppliers/:id/approve - Approve supplier
router.post('/:id/approve', requireRole('buyer', 'admin'), (req, res) => {
  const id = parseInt(req.params.id);
  const profile = db.findById('supplier_profiles', id);
  if (!profile) return res.status(404).json({ error: 'Supplier not found' });

  const { score } = req.body;
  const updated = db.update('supplier_profiles', id, {
    qualification_status: 'Approved',
    score: score || profile.score || 80,
    approved_at: new Date().toISOString()
  });

  // Update approval request
  const approval = db.findOne('approval_requests', { object_type: 'onboarding', object_id: id });
  if (approval) {
    db.update('approval_requests', approval.id, { status: 'approved', completed_at: new Date().toISOString() });
    db.insert('approval_actions', {
      approval_id: approval.id,
      action: 'approve',
      actor_id: req.user.userId,
      comments: req.body.comments || 'Approved',
      action_at: new Date().toISOString()
    });
  }

  res.json(updated);
});

// POST /api/suppliers/:id/reject - Reject supplier
router.post('/:id/reject', requireRole('buyer', 'admin'), (req, res) => {
  const id = parseInt(req.params.id);
  const profile = db.findById('supplier_profiles', id);
  if (!profile) return res.status(404).json({ error: 'Supplier not found' });

  const { reason } = req.body;
  const updated = db.update('supplier_profiles', id, {
    qualification_status: 'Rejected',
    rejected_at: new Date().toISOString(),
    rejection_reason: reason
  });

  const approval = db.findOne('approval_requests', { object_type: 'onboarding', object_id: id });
  if (approval) {
    db.update('approval_requests', approval.id, { status: 'rejected', completed_at: new Date().toISOString() });
    db.insert('approval_actions', {
      approval_id: approval.id,
      action: 'reject',
      actor_id: req.user.userId,
      comments: reason,
      action_at: new Date().toISOString()
    });
  }

  res.json(updated);
});

module.exports = router;
