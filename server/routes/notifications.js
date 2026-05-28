const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// GET /api/notifications - List notifications for current user
router.get('/', (req, res) => {
  const { is_read } = req.query;
  let notifications = db.findAll('notifications').filter(n => n.user_id === req.user.userId);

  if (is_read !== undefined) {
    const read = is_read === 'true';
    notifications = notifications.filter(n => n.is_read === read);
  }

  res.json(notifications.sort((a, b) => b.id - a.id));
});

// GET /api/notifications/unread-count
router.get('/unread-count', (req, res) => {
  const count = db.findAll('notifications').filter(n => n.user_id === req.user.userId && !n.is_read).length;
  res.json({ count });
});

// PUT /api/notifications/:id/read - Mark as read
router.put('/:id/read', (req, res) => {
  const id = parseInt(req.params.id);
  const notification = db.findById('notifications', id);
  if (!notification) return res.status(404).json({ error: 'Notification not found' });
  if (notification.user_id !== req.user.userId) return res.status(403).json({ error: 'Not your notification' });

  const updated = db.update('notifications', id, { is_read: true });
  res.json(updated);
});

// PUT /api/notifications/read-all - Mark all as read
router.put('/read-all', (req, res) => {
  const notifications = db.findAll('notifications').filter(n => n.user_id === req.user.userId && !n.is_read);
  notifications.forEach(n => db.update('notifications', n.id, { is_read: true }));
  res.json({ marked: notifications.length });
});

module.exports = router;
