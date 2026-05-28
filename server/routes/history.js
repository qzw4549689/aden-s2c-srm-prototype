const express = require('express');
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// GET /api/history - Audit logs
router.get('/', (req, res) => {
  const { object_type, object_id, action } = req.query;
  let logs = db.findAll('audit_logs');

  if (object_type) logs = logs.filter(l => l.object_type === object_type);
  if (object_id) logs = logs.filter(l => l.object_id === parseInt(object_id));
  if (action) logs = logs.filter(l => l.action === action);

  // Enrich with actor name
  const enriched = logs.map(l => {
    const actor = db.findById('users', l.actor_id);
    return {
      ...l,
      actor_name: actor ? actor.display_name : null,
      before: l.before_json ? JSON.parse(l.before_json) : null,
      after: l.after_json ? JSON.parse(l.after_json) : null
    };
  });

  res.json(enriched.sort((a, b) => b.id - a.id));
});

// POST /api/history - Create audit log entry
router.post('/', requireRole('buyer', 'admin', 'supplier'), (req, res) => {
  const { object_type, object_id, action, before, after, comments } = req.body;

  const log = db.insert('audit_logs', {
    actor_id: req.user.userId,
    object_type,
    object_id,
    action,
    before_json: before ? JSON.stringify(before) : '{}',
    after_json: after ? JSON.stringify(after) : '{}',
    comments
  });

  res.status(201).json(log);
});

module.exports = router;
