const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// GET /api/tasks - List tasks for current user
router.get('/', (req, res) => {
  const { status, object_type } = req.query;
  let tasks = db.findAll('tasks');

  // Filter by assignee (current user) or org (for supplier tasks)
  tasks = tasks.filter(t => t.assignee_user_id === req.user.userId);

  if (status) tasks = tasks.filter(t => t.status === status);
  if (object_type) tasks = tasks.filter(t => t.object_type === object_type);

  // Enrich with object details
  const enriched = tasks.map(t => {
    let objectDetail = null;
    if (t.object_type === 'rfq') objectDetail = db.findById('rfqs', t.object_id);
    if (t.object_type === 'po') objectDetail = db.findById('purchase_orders', t.object_id);
    if (t.object_type === 'asn') objectDetail = db.findById('asns', t.object_id);
    if (t.object_type === 'settlement') objectDetail = db.findById('settlements', t.object_id);
    if (t.object_type === 'invoice') objectDetail = db.findById('invoices', t.object_id);
    if (t.object_type === 'onboarding') objectDetail = db.findById('supplier_profiles', t.object_id);

    return { ...t, object_detail: objectDetail };
  });

  res.json(enriched);
});

// GET /api/tasks/count - Task counts by status
router.get('/count', (req, res) => {
  let tasks = db.findAll('tasks').filter(t => t.assignee_user_id === req.user.userId);
  const open = tasks.filter(t => t.status === 'open').length;
  const completed = tasks.filter(t => t.status === 'completed').length;
  const overdue = tasks.filter(t => t.status === 'open' && new Date(t.due_at) < new Date()).length;

  res.json({ open, completed, overdue, total: tasks.length });
});

// PUT /api/tasks/:id/complete - Complete a task
router.put('/:id/complete', (req, res) => {
  const id = parseInt(req.params.id);
  const task = db.findById('tasks', id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (task.assignee_user_id !== req.user.userId) return res.status(403).json({ error: 'Not your task' });

  const updated = db.update('tasks', id, { status: 'completed' });
  res.json(updated);
});

module.exports = router;
