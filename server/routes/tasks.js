const express = require('express');
const db = require('../db');
const { authMiddleware } = require('../auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  const { assigned_to, status } = req.query;
  let tasks = db.findAll('tasks');
  if (assigned_to) {
    tasks = tasks.filter(t => t.assigned_to === assigned_to || t.assigned_to === req.user.role);
  }
  if (status) {
    tasks = tasks.filter(t => t.status === status);
  }
  res.json(tasks);
});

router.get('/:id', (req, res) => {
  const task = db.findById('tasks', parseInt(req.params.id));
  if (!task) return res.status(404).json({ error: 'Not found' });
  res.json(task);
});

router.post('/', (req, res) => {
  const { title, type, status, assigned_to, related_type, related_id, priority, due_date } = req.body;
  const task = db.insert('tasks', {
    title, type, status: status || 'open', assigned_to,
    related_type, related_id, priority: priority || 'medium', due_date
  });
  db.insert('history', { user_id: req.user.username, action: 'Created task', entity_type: 'task', entity_id: task.id, details: `Task "${title}" created` });
  res.status(201).json(task);
});

router.put('/:id', (req, res) => {
  const task = db.update('tasks', parseInt(req.params.id), req.body);
  if (!task) return res.status(404).json({ error: 'Not found' });
  db.insert('history', { user_id: req.user.username, action: 'Updated task', entity_type: 'task', entity_id: task.id, details: `Task "${task.title}" updated` });
  res.json(task);
});

router.post('/:id/complete', (req, res) => {
  const task = db.update('tasks', parseInt(req.params.id), { status: 'completed', completed_at: new Date().toISOString() });
  if (!task) return res.status(404).json({ error: 'Not found' });
  db.insert('history', { user_id: req.user.username, action: 'Completed task', entity_type: 'task', entity_id: task.id, details: `Task "${task.title}" completed` });
  res.json(task);
});

module.exports = router;
