const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const notifications = db.findAll('notifications').filter(n => n.user_id === req.user.username);
  res.json(notifications);
});

router.get('/unread-count', (req, res) => {
  const count = db.findAll('notifications').filter(n => n.user_id === req.user.username && !n.is_read).length;
  res.json({ count });
});

router.post('/:id/read', (req, res) => {
  const notification = db.update('notifications', parseInt(req.params.id), { is_read: true });
  if (!notification) return res.status(404).json({ error: 'Not found' });
  res.json(notification);
});

router.post('/mark-all-read', (req, res) => {
  db.findAll('notifications').filter(n => n.user_id === req.user.username && !n.is_read).forEach(n => {
    db.update('notifications', n.id, { is_read: true });
  });
  res.json({ success: true });
});

module.exports = router;
