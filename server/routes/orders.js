const express = require('express');
const db = require('../db');
const { authMiddleware, requireRole } = require('../auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  res.json(db.findAll('orders'));
});

router.get('/:id', (req, res) => {
  const order = db.findById('orders', parseInt(req.params.id));
  if (!order) return res.status(404).json({ error: 'Not found' });
  const asns = db.findAll('asns', { order_id: order.id });
  res.json({ ...order, asns });
});

router.post('/', requireRole('buyer', 'admin'), (req, res) => {
  const { code, supplier_id, status, delivery_date, asn_count, next_step } = req.body;
  const supplier = supplier_id ? db.findById('suppliers', supplier_id) : null;
  const order = db.insert('orders', {
    code: code || `PO-${45001288 + db.findAll('orders').length}`,
    supplier_id, supplier_name: supplier ? supplier.name : '',
    status: status || 'Draft', delivery_date, asn_count: asn_count || 'No ASN', next_step: next_step || 'Confirmation due'
  });
  db.insert('history', { user_id: req.user.username, action: 'Created PO', entity_type: 'order', entity_id: order.id, details: `PO ${order.code} created` });
  res.status(201).json(order);
});

router.put('/:id', requireRole('buyer', 'admin'), (req, res) => {
  const order = db.update('orders', parseInt(req.params.id), req.body);
  if (!order) return res.status(404).json({ error: 'Not found' });
  db.insert('history', { user_id: req.user.username, action: 'Updated PO', entity_type: 'order', entity_id: order.id, details: `PO ${order.code} updated` });
  res.json(order);
});

// Supplier confirms PO
router.post('/:id/confirm', requireRole('supplier'), (req, res) => {
  const order = db.update('orders', parseInt(req.params.id), { status: 'Confirmed' });
  if (!order) return res.status(404).json({ error: 'Not found' });
  db.insert('history', { user_id: req.user.username, action: 'Confirmed PO', entity_type: 'order', entity_id: order.id, details: `PO ${order.code} confirmed by supplier` });
  db.insert('notifications', {
    user_id: 'buyer', title: 'PO Confirmed', message: `${req.user.name} confirmed PO ${order.code}`,
    type: 'info', is_read: false, related_type: 'order', related_id: order.id
  });
  res.json(order);
});

// Create ASN
router.post('/:id/asns', requireRole('supplier'), (req, res) => {
  const orderId = parseInt(req.params.id);
  const order = db.findById('orders', orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const { code, shipment_date, carrier, vehicle, packing_list } = req.body;
  const asn = db.insert('asns', {
    code: code || `ASN-${new Date().toISOString().slice(2, 7).replace('-', '')}-${String(db.findAll('asns').length + 1).padStart(3, '0')}`,
    order_id: orderId, supplier_id: req.user.id,
    shipment_date, carrier, vehicle, packing_list, status: 'Preparing'
  });
  db.update('orders', orderId, { asn_count: `${(db.findAll('asns', { order_id: orderId }).length)} ASN lines`, status: 'ASN created' });
  db.insert('history', { user_id: req.user.username, action: 'Created ASN', entity_type: 'asn', entity_id: asn.id, details: `ASN ${asn.code} created for PO ${order.code}` });
  db.insert('notifications', {
    user_id: 'buyer', title: 'ASN Created', message: `${req.user.name} created ASN for PO ${order.code}`,
    type: 'info', is_read: false, related_type: 'order', related_id: orderId
  });
  res.status(201).json(asn);
});

module.exports = router;
