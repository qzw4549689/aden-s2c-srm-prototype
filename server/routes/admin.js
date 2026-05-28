const express = require('express');
const db = require('../db');
const { authMiddleware, requireRole } = require('../auth');

const router = express.Router();
router.use(authMiddleware);
router.use(requireRole('admin'));

router.get('/config', (req, res) => {
  res.json(db.findAll('admin_config'));
});

router.put('/config/:id', (req, res) => {
  const config = db.update('admin_config', parseInt(req.params.id), { value: req.body.value, updated_at: new Date().toISOString() });
  if (!config) return res.status(404).json({ error: 'Not found' });
  db.insert('history', { user_id: req.user.username, action: 'Updated config', entity_type: 'config', entity_id: config.id, details: `Config ${config.key} updated to ${req.body.value}` });
  res.json(config);
});

router.post('/config', (req, res) => {
  const { key, value, category } = req.body;
  const config = db.insert('admin_config', { key, value, category });
  res.status(201).json(config);
});

router.post('/reset', (req, res) => {
  const { seed } = require('../seed');
  seed();
  db.insert('history', { user_id: req.user.username, action: 'Reset database', entity_type: 'system', entity_id: 0, details: 'Database reset to demo data' });
  res.json({ success: true, message: 'Database reset to demo data' });
});

router.get('/stats', (req, res) => {
  res.json({
    users: db.findAll('users').length,
    suppliers: db.findAll('suppliers').length,
    rfqs: db.findAll('rfqs').length,
    orders: db.findAll('orders').length,
    settlements: db.findAll('settlements').length,
    tasks: db.findAll('tasks').length,
    notifications: db.findAll('notifications').length,
    history: db.findAll('history').length,
  });
});

module.exports = router;
