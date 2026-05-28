const express = require('express');
const db = require('../db');
const { authMiddleware, requireRole } = require('../auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const rfqs = db.findAll('rfqs');
  res.json(rfqs);
});

router.get('/:id', (req, res) => {
  const rfq = db.findById('rfqs', parseInt(req.params.id));
  if (!rfq) return res.status(404).json({ error: 'Not found' });
  const quotes = db.findAll('rfq_quotes', { rfq_id: rfq.id });
  res.json({ ...rfq, quotes });
});

router.post('/', requireRole('buyer', 'admin'), (req, res) => {
  const { code, scope, status, suppliers_count, due_date, round, category, sourcing_method } = req.body;
  const rfq = db.insert('rfqs', {
    code: code || `RFQ-${new Date().toISOString().slice(2, 7).replace('-', '')}-${String(db.findAll('rfqs').length + 1).padStart(3, '0')}`,
    scope, status: status || 'Draft', suppliers_count: suppliers_count || '0 suppliers',
    due_date, round: round || '1 round', category, sourcing_method: sourcing_method || 'Invited RFQ',
    created_by: req.user.username
  });
  db.insert('history', {
    user_id: req.user.username,
    action: 'Created RFQ',
    entity_type: 'rfq',
    entity_id: rfq.id,
    details: `RFQ ${rfq.code} created`
  });
  res.status(201).json(rfq);
});

router.put('/:id', requireRole('buyer', 'admin'), (req, res) => {
  const rfq = db.update('rfqs', parseInt(req.params.id), req.body);
  if (!rfq) return res.status(404).json({ error: 'Not found' });
  db.insert('history', {
    user_id: req.user.username,
    action: 'Updated RFQ',
    entity_type: 'rfq',
    entity_id: rfq.id,
    details: `RFQ ${rfq.code} updated`
  });
  res.json(rfq);
});

// Publish RFQ
router.post('/:id/publish', requireRole('buyer', 'admin'), (req, res) => {
  const rfq = db.update('rfqs', parseInt(req.params.id), { status: 'Open' });
  if (!rfq) return res.status(404).json({ error: 'Not found' });
  db.insert('history', {
    user_id: req.user.username,
    action: 'Published RFQ',
    entity_type: 'rfq',
    entity_id: rfq.id,
    details: `RFQ ${rfq.code} published to suppliers`
  });
  // Create tasks for suppliers
  db.findAll('users', { role: 'supplier' }).forEach(u => {
    db.insert('tasks', {
      title: `${rfq.code}: Submit quote`,
      type: 'rfq',
      status: 'open',
      assigned_to: u.username,
      related_type: 'rfq',
      related_id: rfq.id,
      priority: 'medium',
      due_date: rfq.due_date
    });
    db.insert('notifications', {
      user_id: u.username,
      title: 'New RFQ invitation',
      message: `You are invited to ${rfq.code}: ${rfq.scope}`,
      type: 'info',
      is_read: false,
      related_type: 'rfq',
      related_id: rfq.id
    });
  });
  res.json(rfq);
});

// Submit quote
router.post('/:id/quotes', requireRole('supplier'), (req, res) => {
  const rfqId = parseInt(req.params.id);
  const rfq = db.findById('rfqs', rfqId);
  if (!rfq) return res.status(404).json({ error: 'RFQ not found' });
  if (rfq.status !== 'Open') return res.status(400).json({ error: 'RFQ is not open' });

  const { unit_price, currency, lead_time, moq, notes } = req.body;
  const quote = db.insert('rfq_quotes', {
    rfq_id: rfqId,
    supplier_id: req.user.id,
    supplier_name: req.user.name,
    unit_price, currency: currency || 'CNY', lead_time, moq, notes,
    status: 'Submitted'
  });
  db.insert('history', {
    user_id: req.user.username,
    action: 'Submitted quote',
    entity_type: 'rfq',
    entity_id: rfqId,
    details: `Quote submitted for ${rfq.code} at ${currency || 'CNY'} ${unit_price}`
  });
  // Notify buyer
  db.insert('notifications', {
    user_id: 'buyer',
    title: 'New quote received',
    message: `${req.user.name} submitted a quote for ${rfq.code}`,
    type: 'info',
    is_read: false,
    related_type: 'rfq',
    related_id: rfqId
  });
  res.status(201).json(quote);
});

// Award RFQ
router.post('/:id/award', requireRole('buyer', 'admin'), (req, res) => {
  const rfqId = parseInt(req.params.id);
  const { supplier_id } = req.body;
  const rfq = db.update('rfqs', rfqId, { status: 'Awarded' });
  if (!rfq) return res.status(404).json({ error: 'Not found' });

  const supplier = db.findById('suppliers', supplier_id);
  db.insert('history', {
    user_id: req.user.username,
    action: 'Awarded RFQ',
    entity_type: 'rfq',
    entity_id: rfqId,
    details: `RFQ ${rfq.code} awarded to ${supplier ? supplier.name : 'supplier'}`
  });
  // Notify winning supplier
  if (supplier) {
    const user = db.findOne('users', { name: supplier.name });
    if (user) {
      db.insert('notifications', {
        user_id: user.username,
        title: 'RFQ Awarded',
        message: `Congratulations! You have been awarded ${rfq.code}`,
        type: 'info',
        is_read: false,
        related_type: 'rfq',
        related_id: rfqId
      });
    }
  }
  res.json(rfq);
});

module.exports = router;
