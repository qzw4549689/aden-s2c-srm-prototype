const express = require('express');
const db = require('../db');
const { authMiddleware, requireRole } = require('../auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  res.json(db.findAll('contracts'));
});

router.get('/:id', (req, res) => {
  const c = db.findById('contracts', parseInt(req.params.id));
  if (!c) return res.status(404).json({ error: 'Not found' });
  res.json(c);
});

router.post('/', requireRole('buyer', 'admin'), (req, res) => {
  const { code, supplier_id, type, status, valid_until, price_status } = req.body;
  const supplier = supplier_id ? db.findById('suppliers', supplier_id) : null;
  const contract = db.insert('contracts', {
    code: code || `CTR-${new Date().getFullYear()}-${String(db.findAll('contracts').length + 41).padStart(3, '0')}`,
    supplier_id, supplier_name: supplier ? supplier.name : '',
    type, status: status || 'Draft', valid_until, price_status: price_status || 'Pending'
  });
  db.insert('history', { user_id: req.user.username, action: 'Created contract', entity_type: 'contract', entity_id: contract.id, details: `Contract ${contract.code} created` });
  res.status(201).json(contract);
});

router.put('/:id', requireRole('buyer', 'admin'), (req, res) => {
  const contract = db.update('contracts', parseInt(req.params.id), req.body);
  if (!contract) return res.status(404).json({ error: 'Not found' });
  db.insert('history', { user_id: req.user.username, action: 'Updated contract', entity_type: 'contract', entity_id: contract.id, details: `Contract ${contract.code} updated` });
  res.json(contract);
});

// Prices
router.get('/prices', (req, res) => {
  res.json(db.findAll('prices'));
});

router.post('/prices', requireRole('buyer', 'admin'), (req, res) => {
  const { code, supplier_id, category, status, unit_price, erp_action } = req.body;
  const supplier = supplier_id ? db.findById('suppliers', supplier_id) : null;
  const price = db.insert('prices', {
    code: code || `PRC-${new Date().toISOString().slice(2, 7).replace('-', '')}-${String(db.findAll('prices').length + 1).padStart(3, '0')}`,
    supplier_id, supplier_name: supplier ? supplier.name : '', category, status, unit_price, erp_action
  });
  res.status(201).json(price);
});

module.exports = router;
