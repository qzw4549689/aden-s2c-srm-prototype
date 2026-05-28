const express = require('express');
const db = require('../db');
const { authMiddleware, requireRole } = require('../auth');

const router = express.Router();

router.use(authMiddleware);

// List all suppliers
router.get('/', (req, res) => {
  const suppliers = db.findAll('suppliers');
  res.json(suppliers);
});

// Get single supplier
router.get('/:id', (req, res) => {
  const supplier = db.findById('suppliers', parseInt(req.params.id));
  if (!supplier) return res.status(404).json({ error: 'Not found' });
  res.json(supplier);
});

// Create supplier (buyer/admin only)
router.post('/', requireRole('buyer', 'admin'), (req, res) => {
  const { code, name, category, status, score, location, integration_status, tax_number, contact, bank_account } = req.body;
  const supplier = db.insert('suppliers', {
    code: code || `SUP-${Date.now()}`,
    name, category, status: status || 'Potential', score: score || 0,
    location, integration_status: integration_status || 'Not synced',
    tax_number, contact, bank_account
  });
  db.insert('history', {
    user_id: req.user.username,
    action: 'Created supplier',
    entity_type: 'supplier',
    entity_id: supplier.id,
    details: `Supplier ${supplier.name} created with status ${supplier.status}`
  });
  res.status(201).json(supplier);
});

// Update supplier
router.put('/:id', requireRole('buyer', 'admin'), (req, res) => {
  const updates = req.body;
  const supplier = db.update('suppliers', parseInt(req.params.id), updates);
  if (!supplier) return res.status(404).json({ error: 'Not found' });
  db.insert('history', {
    user_id: req.user.username,
    action: 'Updated supplier',
    entity_type: 'supplier',
    entity_id: supplier.id,
    details: `Supplier ${supplier.name} updated` + (updates.status ? `, status changed to ${updates.status}` : '')
  });
  res.json(supplier);
});

// Update supplier status (lifecycle)
router.patch('/:id/status', requireRole('buyer', 'admin'), (req, res) => {
  const { status } = req.body;
  const validStatuses = ['Potential', 'Registration', 'Qualification', 'Trial', 'Qualified', 'Blacklisted'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const supplier = db.update('suppliers', parseInt(req.params.id), { status });
  if (!supplier) return res.status(404).json({ error: 'Not found' });
  db.insert('history', {
    user_id: req.user.username,
    action: 'Status changed',
    entity_type: 'supplier',
    entity_id: supplier.id,
    details: `Supplier ${supplier.name} status changed to ${status}`
  });
  res.json(supplier);
});

module.exports = router;
