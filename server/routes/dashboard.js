const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/buyer', (req, res) => {
  const rfqs = db.findAll('rfqs');
  const suppliers = db.findAll('suppliers');
  const orders = db.findAll('orders');
  const settlements = db.findAll('settlements');
  const tasks = db.findAll('tasks').filter(t => t.assigned_to === 'buyer' && t.status === 'open');
  const notifications = db.findAll('notifications').filter(n => n.user_id === 'buyer' && !n.is_read);

  res.json({
    kpi: {
      active_rfx: rfqs.filter(r => r.status === 'Open').length,
      qualified_suppliers: suppliers.filter(s => s.status === 'Qualified').length,
      expiring_contracts: db.findAll('contracts').filter(c => c.status === 'Expiry alert').length,
      pending_tasks: tasks.length,
      unread_notifications: notifications.length,
    },
    rfqs: rfqs.slice(0, 10),
    suppliers: suppliers.slice(0, 10),
    orders: orders.slice(0, 10),
    settlements: settlements.slice(0, 10),
    tasks: tasks.slice(0, 10),
    notifications: notifications.slice(0, 10),
  });
});

router.get('/supplier', (req, res) => {
  const username = req.user.username;
  const tasks = db.findAll('tasks').filter(t => (t.assigned_to === username || t.assigned_to === 'supplier') && t.status === 'open');
  const notifications = db.findAll('notifications').filter(n => n.user_id === username && !n.is_read);
  const rfqs = db.findAll('rfqs').filter(r => r.status === 'Open');
  const orders = db.findAll('orders');
  const settlements = db.findAll('settlements');

  res.json({
    kpi: {
      open_invitations: rfqs.length,
      pos_to_confirm: orders.filter(o => o.status === 'Supplier review').length,
      statements_to_approve: settlements.filter(s => s.status === 'Buyer review' || s.status === 'Draft').length,
      pending_tasks: tasks.length,
      unread_notifications: notifications.length,
    },
    tasks: tasks.slice(0, 10),
    notifications: notifications.slice(0, 10),
    opportunities: db.findAll('opportunities').slice(0, 10),
    orders: orders.slice(0, 10),
    settlements: settlements.slice(0, 10),
  });
});

module.exports = router;
