const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// GET /api/settlements/:id/dispute-logs - Get dispute logs for a settlement
router.get('/:id/dispute-logs', (req, res) => {
  const settlementId = parseInt(req.params.id);
  const logs = db.raw(
    `SELECT l.*, u.display_name as sender_name
     FROM settlement_dispute_logs l
     LEFT JOIN users u ON l.sender_id = u.id
     WHERE l.settlement_id = ?
     ORDER BY l.created_at ASC`,
    [settlementId]
  );
  res.json(logs);
});

// POST /api/settlements/:id/dispute-logs - Add a dispute log message
router.post('/:id/dispute-logs', (req, res) => {
  const settlementId = parseInt(req.params.id);
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const settlement = db.findById('settlements', settlementId);
  if (!settlement) return res.status(404).json({ error: 'Settlement not found' });

  const senderRole = req.user.role === 'buyer' || req.user.role === 'admin' ? 'buyer' : 'supplier';

  const log = db.insert('settlement_dispute_logs', {
    settlement_id: settlementId,
    sender_id: req.user.userId,
    sender_role: senderRole,
    message: message.trim(),
    created_at: new Date().toISOString()
  });

  // Get sender name for response
  const sender = db.findById('users', req.user.userId);
  res.status(201).json({ ...log, sender_name: sender ? sender.display_name : null });
});

// POST /api/settlements/:id/accept-dispute - Buyer accepts dispute
router.post('/:id/accept-dispute', (req, res) => {
  const settlementId = parseInt(req.params.id);
  const settlement = db.findById('settlements', settlementId);
  if (!settlement) return res.status(404).json({ error: 'Settlement not found' });
  if (settlement.status !== 'Disputed') {
    return res.status(400).json({ error: 'Settlement must be in Disputed status' });
  }

  const newAmount = settlement.total_amount - (settlement.dispute_amount || 0);

  const updated = db.update('settlements', settlementId, {
    status: 'Resolved',
    total_amount: newAmount,
    dispute_amount: 0
  });

  // Add resolution log
  db.insert('settlement_dispute_logs', {
    settlement_id: settlementId,
    sender_id: req.user.userId,
    sender_role: 'buyer',
    message: `Dispute accepted. Settlement amount adjusted from ${settlement.total_amount} to ${newAmount}.`,
    created_at: new Date().toISOString()
  });

  // Create task for supplier to confirm adjusted settlement
  const supplierUser = db.findOne('users', { org_id: settlement.supplier_org_id, role: 'supplier' });
  if (supplierUser) {
    db.insert('tasks', {
      assignee_user_id: supplierUser.id,
      org_id: settlement.supplier_org_id,
      object_type: 'settlement',
      object_id: settlementId,
      title: `Confirm adjusted settlement: ${settlement.settlement_no}`,
      status: 'open',
      due_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });
  }

  // Notification
  if (supplierUser) {
    db.insert('notifications', {
      user_id: supplierUser.id,
      title: 'Dispute resolved',
      message: `Dispute for ${settlement.settlement_no} has been resolved. Please review and confirm the adjusted amount.`,
      object_type: 'settlement',
      object_id: settlementId,
      is_read: 0
    });
  }

  res.json(updated);
});

// POST /api/settlements/:id/adjust-amount - Buyer adjusts amount
router.post('/:id/adjust-amount', (req, res) => {
  const settlementId = parseInt(req.params.id);
  const { adjusted_amount, reason } = req.body;

  const settlement = db.findById('settlements', settlementId);
  if (!settlement) return res.status(404).json({ error: 'Settlement not found' });
  if (settlement.status !== 'Disputed') {
    return res.status(400).json({ error: 'Settlement must be in Disputed status' });
  }

  const adjustedAmount = parseFloat(adjusted_amount);
  if (isNaN(adjustedAmount) || adjustedAmount <= 0) {
    return res.status(400).json({ error: 'Invalid adjusted amount' });
  }

  const updated = db.update('settlements', settlementId, {
    status: 'Resolved',
    total_amount: adjustedAmount,
    dispute_amount: 0
  });

  // Add resolution log
  db.insert('settlement_dispute_logs', {
    settlement_id: settlementId,
    sender_id: req.user.userId,
    sender_role: 'buyer',
    message: `Dispute partially resolved. Settlement amount adjusted to ${adjustedAmount}. Reason: ${reason || 'Partial acceptance'}`,
    created_at: new Date().toISOString()
  });

  // Create task for supplier
  const supplierUser = db.findOne('users', { org_id: settlement.supplier_org_id, role: 'supplier' });
  if (supplierUser) {
    db.insert('tasks', {
      assignee_user_id: supplierUser.id,
      org_id: settlement.supplier_org_id,
      object_type: 'settlement',
      object_id: settlementId,
      title: `Confirm adjusted settlement: ${settlement.settlement_no}`,
      status: 'open',
      due_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });

    db.insert('notifications', {
      user_id: supplierUser.id,
      title: 'Dispute partially resolved',
      message: `Dispute for ${settlement.settlement_no} has been partially resolved. Adjusted amount: ${adjusted_amount}. Please confirm.`,
      object_type: 'settlement',
      object_id: settlementId,
      is_read: 0
    });
  }

  res.json(updated);
});

// GET /api/supplier/dispute-history - Get dispute history for current supplier
router.get('/supplier/history', (req, res) => {
  const user = db.findById('users', req.user.userId);
  if (!user || user.role !== 'supplier') {
    return res.status(403).json({ error: 'Supplier access only' });
  }

  const settlements = db.findAll('settlements', { supplier_org_id: user.org_id });
  const disputedSettlements = settlements.filter(s => s.dispute_amount > 0 || s.status === 'Disputed');

  const result = disputedSettlements.map(s => ({
    settlement_id: s.id,
    settlement_no: s.settlement_no,
    dispute_amount: s.dispute_amount,
    status: s.status,
    period: s.period,
    resolved_at: s.status === 'Resolved' ? s.confirmed_at : null
  }));

  res.json(result);
});

module.exports = router;
