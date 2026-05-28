const express = require('express');
const db = require('../db');
const { authMiddleware, requireRole } = require('../auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  res.json(db.findAll('settlements'));
});

router.get('/:id', (req, res) => {
  const s = db.findById('settlements', parseInt(req.params.id));
  if (!s) return res.status(404).json({ error: 'Not found' });
  const invoices = db.findAll('invoices', { settlement_id: s.id });
  res.json({ ...s, invoices });
});

router.post('/', requireRole('buyer', 'admin'), (req, res) => {
  const { code, supplier_id, type, status, amount, currency, numeric_amount, next_step } = req.body;
  const supplier = supplier_id ? db.findById('suppliers', supplier_id) : null;
  const settlement = db.insert('settlements', {
    code: code || `STM-${new Date().toISOString().slice(2, 7).replace('-', '')}-${String(144 + db.findAll('settlements').length).padStart(3, '0')}`,
    supplier_id, supplier_name: supplier ? supplier.name : '',
    type: type || 'Monthly settlement', status: status || 'Draft',
    amount, currency: currency || 'CNY', numeric_amount, next_step
  });
  db.insert('history', { user_id: req.user.username, action: 'Created settlement', entity_type: 'settlement', entity_id: settlement.id, details: `Settlement ${settlement.code} created` });
  res.status(201).json(settlement);
});

router.put('/:id', requireRole('buyer', 'admin'), (req, res) => {
  const settlement = db.update('settlements', parseInt(req.params.id), req.body);
  if (!settlement) return res.status(404).json({ error: 'Not found' });
  db.insert('history', { user_id: req.user.username, action: 'Updated settlement', entity_type: 'settlement', entity_id: settlement.id, details: `Settlement ${settlement.code} updated` });
  res.json(settlement);
});

// Supplier confirms statement
router.post('/:id/confirm', requireRole('supplier'), (req, res) => {
  const settlement = db.update('settlements', parseInt(req.params.id), { status: 'Supplier confirmed', next_step: 'Ready for AP invoice' });
  if (!settlement) return res.status(404).json({ error: 'Not found' });
  db.insert('history', { user_id: req.user.username, action: 'Confirmed settlement', entity_type: 'settlement', entity_id: settlement.id, details: `Settlement ${settlement.code} confirmed by supplier` });
  db.insert('notifications', {
    user_id: 'buyer', title: 'Settlement Confirmed', message: `${req.user.name} confirmed ${settlement.code}`,
    type: 'info', is_read: false, related_type: 'settlement', related_id: settlement.id
  });
  res.json(settlement);
});

// Supplier disputes statement
router.post('/:id/dispute', requireRole('supplier'), (req, res) => {
  const { reason } = req.body;
  const settlement = db.update('settlements', parseInt(req.params.id), { status: 'Disputed', next_step: `Dispute: ${reason}` });
  if (!settlement) return res.status(404).json({ error: 'Not found' });
  db.insert('history', { user_id: req.user.username, action: 'Disputed settlement', entity_type: 'settlement', entity_id: settlement.id, details: `Settlement ${settlement.code} disputed: ${reason}` });
  db.insert('notifications', {
    user_id: 'buyer', title: 'Settlement Disputed', message: `${req.user.name} disputed ${settlement.code}: ${reason}`,
    type: 'alert', is_read: false, related_type: 'settlement', related_id: settlement.id
  });
  res.json(settlement);
});

// Submit invoice
router.post('/:id/invoices', requireRole('supplier'), (req, res) => {
  const settlementId = parseInt(req.params.id);
  const settlement = db.findById('settlements', settlementId);
  if (!settlement) return res.status(404).json({ error: 'Settlement not found' });
  const { code, invoice_type, amount, tax_amount, ocr_status } = req.body;
  const invoice = db.insert('invoices', {
    code: code || `INV-${new Date().toISOString().slice(2, 7).replace('-', '')}-${String(89 + db.findAll('invoices').length).padStart(3, '0')}`,
    settlement_id: settlementId, supplier_id: req.user.id,
    invoice_type: invoice_type || 'VAT special invoice', amount, tax_amount,
    ocr_status: ocr_status || 'Pending', status: 'Submitted'
  });
  db.update('settlements', settlementId, { status: 'Invoice submitted', next_step: 'OCR verification pending' });
  db.insert('history', { user_id: req.user.username, action: 'Submitted invoice', entity_type: 'invoice', entity_id: invoice.id, details: `Invoice ${invoice.code} submitted for ${settlement.code}` });
  db.insert('notifications', {
    user_id: 'buyer', title: 'Invoice Submitted', message: `${req.user.name} submitted invoice ${invoice.code}`,
    type: 'info', is_read: false, related_type: 'settlement', related_id: settlementId
  });
  res.status(201).json(invoice);
});

// Buyer approves invoice
router.post('/invoices/:id/approve', requireRole('buyer', 'admin'), (req, res) => {
  const invoice = db.update('invoices', parseInt(req.params.id), { status: 'Approved', ocr_status: 'Passed' });
  if (!invoice) return res.status(404).json({ error: 'Not found' });
  db.update('settlements', invoice.settlement_id, { status: 'Approved', next_step: 'Send to D365 AP' });
  db.insert('history', { user_id: req.user.username, action: 'Approved invoice', entity_type: 'invoice', entity_id: invoice.id, details: `Invoice ${invoice.code} approved` });
  res.json(invoice);
});

// Buyer rejects invoice (return for correction)
router.post('/invoices/:id/reject', requireRole('buyer', 'admin'), (req, res) => {
  const { reason } = req.body;
  const invoice = db.update('invoices', parseInt(req.params.id), { status: 'Rejected', ocr_status: 'Exception' });
  if (!invoice) return res.status(404).json({ error: 'Not found' });
  db.update('settlements', invoice.settlement_id, { status: 'Exception', next_step: `Return for correction: ${reason}` });
  db.insert('history', { user_id: req.user.username, action: 'Rejected invoice', entity_type: 'invoice', entity_id: invoice.id, details: `Invoice ${invoice.code} rejected: ${reason}` });
  const supplier = db.findById('users', invoice.supplier_id);
  if (supplier) {
    db.insert('notifications', {
      user_id: supplier.username, title: 'Invoice Rejected', message: `Invoice ${invoice.code} was rejected: ${reason}`,
      type: 'alert', is_read: false, related_type: 'invoice', related_id: invoice.id
    });
  }
  res.json(invoice);
});

module.exports = router;
