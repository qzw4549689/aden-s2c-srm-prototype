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
    return { ...c, supplier_name: org ? org.short_name : null };
  });

  res.json(enriched);
});

// GET /api/contracts/:id - Get contract detail
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const contract = db.findById('contracts', id);
  if (!contract) return res.status(404).json({ error: 'Contract not found' });

  const org = db.findById('organizations', contract.supplier_org_id);
  res.json({ ...contract, supplier_name: org ? org.short_name : null });
});

// POST /api/contracts - Create contract
router.post('/', requireRole('buyer', 'admin'), (req, res) => {
  const { contract_no, title, supplier_org_id, start_date, end_date, amount, currency, terms } = req.body;

  const contract = db.insert('contracts', {
    contract_no: contract_no || `CTR-${new Date().toISOString().slice(2, 4)}${new Date().toISOString().slice(5, 7)}-${String((db.findAll('contracts') || []).length + 1).padStart(3, '0')}`,
    title,
    supplier_org_id,
    status: 'Draft',
    start_date,
    end_date,
    amount,
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

module.exports = router;
