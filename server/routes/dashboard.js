const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// GET /api/dashboard - Dashboard data
router.get('/', (req, res) => {
  const role = req.user.role;
  const orgId = req.user.orgId;

  if (role === 'buyer' || role === 'admin') {
    // Buyer dashboard
    const rfqs = db.findAll('rfqs');
    const pos = db.findAll('purchase_orders');
    const asns = db.findAll('asns');
    const settlements = db.findAll('settlements');

    res.json({
      role: 'buyer',
      kpi: {
        active_rfqs: rfqs.filter(r => r.status === 'Published').length,
        pending_awards: rfqs.filter(r => r.status === 'Award Pending').length,
        pending_pos: pos.filter(p => p.status === 'Pending Supplier').length,
        change_requests: pos.filter(p => p.status === 'Change Requested').length,
        pending_asns: asns.filter(a => a.status === 'Submitted').length,
        asn_exceptions: asns.filter(a => a.status === 'Exception').length,
        pending_settlements: settlements.filter(s => s.status === 'Published' || s.status === 'Disputed').length,
        pending_invoices: db.findAll('invoices').filter(i => i.status === 'Under Review').length,
      },
      recent_rfqs: rfqs.slice(0, 5),
      recent_pos: pos.slice(0, 5),
      recent_asns: asns.slice(0, 5),
      pending_tasks: db.findAll('tasks').filter(t => t.assignee_user_id === req.user.userId && t.status === 'open').length,
      unread_notifications: db.findAll('notifications').filter(n => n.user_id === req.user.userId && !n.is_read).length
    });
  } else {
    // Supplier dashboard
    const myPos = db.findAll('purchase_orders').filter(p => p.supplier_org_id === orgId);
    const myAsns = db.findAll('asns').filter(a => a.supplier_org_id === orgId);
    const mySettlements = db.findAll('settlements').filter(s => s.supplier_org_id === orgId);
    const myInvitations = db.findAll('rfq_invitations').filter(i => i.supplier_org_id === orgId && i.status === 'pending');

    res.json({
      role: 'supplier',
      kpi: {
        pending_pos: myPos.filter(p => p.status === 'Pending Supplier').length,
        pending_asns: myAsns.filter(a => a.status === 'Draft').length,
        pending_settlements: mySettlements.filter(s => s.status === 'Published').length,
        open_rfqs: myInvitations.length,
        total_orders: myPos.length,
        total_revenue: mySettlements.filter(s => s.status === 'Approved').reduce((sum, s) => sum + (s.total_amount || 0), 0)
      },
      recent_pos: myPos.slice(0, 5),
      recent_asns: myAsns.slice(0, 5),
      pending_tasks: db.findAll('tasks').filter(t => t.assignee_user_id === req.user.userId && t.status === 'open').length,
      unread_notifications: db.findAll('notifications').filter(n => n.user_id === req.user.userId && !n.is_read).length
    });
  }
});

module.exports = router;
