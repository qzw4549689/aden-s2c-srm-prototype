const db = require('./db');
const bcrypt = require('bcryptjs');

const DEMO_PASSWORD = 'demo123';

function seed() {
  db.reset();

  // Users
  const users = [
    { username: 'buyer', password_hash: bcrypt.hashSync(DEMO_PASSWORD, 10), role: 'buyer', name: 'Aden Procurement', email: 'buyer@aden.demo' },
    { username: 'supplier1', password_hash: bcrypt.hashSync(DEMO_PASSWORD, 10), role: 'supplier', name: 'FreshFarm Distribution', email: 'supplier1@aden.demo' },
    { username: 'supplier2', password_hash: bcrypt.hashSync(DEMO_PASSWORD, 10), role: 'supplier', name: 'Jixiang Wonton Food Supply', email: 'supplier2@aden.demo' },
    { username: 'supplier3', password_hash: bcrypt.hashSync(DEMO_PASSWORD, 10), role: 'supplier', name: 'SuXin Food / Su Xiao Liu', email: 'supplier3@aden.demo' },
    { username: 'supplier4', password_hash: bcrypt.hashSync(DEMO_PASSWORD, 10), role: 'supplier', name: 'GreenBox Packaging', email: 'supplier4@aden.demo' },
    { username: 'supplier5', password_hash: bcrypt.hashSync(DEMO_PASSWORD, 10), role: 'supplier', name: 'North Star Logistics', email: 'supplier5@aden.demo' },
    { username: 'admin', password_hash: bcrypt.hashSync(DEMO_PASSWORD, 10), role: 'admin', name: 'System Admin', email: 'admin@aden.demo' },
  ];
  users.forEach(u => db.insert('users', u));

  // Suppliers
  const suppliers = [
    { code: 'SUP-1024', name: 'FreshFarm Distribution', category: 'Food ingredients', status: 'Qualified', score: 92, location: 'Suzhou', integration_status: 'D365 synced', tax_number: '9132********0001', contact: 'Mr. Zhang', bank_account: '**** **** **** 1001' },
    { code: 'SUP-1048', name: 'Jixiang Wonton Food Supply', category: 'Frozen food', status: 'Qualified', score: 95, location: 'Shanghai', integration_status: 'D365 synced', tax_number: '9132********0002', contact: 'Ms. Li', bank_account: '**** **** **** 1002' },
    { code: 'SUP-1081', name: 'SuXin Food / Su Xiao Liu', category: 'Prepared food', status: 'Qualified', score: 91, location: 'Jiangsu', integration_status: 'D365 synced', tax_number: '9132********0003', contact: 'Linda Chen', bank_account: '**** **** **** 8128' },
    { code: 'SUP-1176', name: 'GreenBox Packaging', category: 'Packaging', status: 'Trial', score: 78, location: 'Ningbo', integration_status: 'Pending approval', tax_number: '9132********0004', contact: 'Mr. Wang', bank_account: '**** **** **** 1004' },
    { code: 'SUP-1210', name: 'North Star Logistics', category: 'LSP', status: 'Potential', score: 70, location: 'Shanghai', integration_status: 'Not synced', tax_number: '9132********0005', contact: 'Ms. Liu', bank_account: '**** **** **** 1005' },
  ];
  suppliers.forEach(s => db.insert('suppliers', s));

  // RFQs
  const rfqs = [
    { code: 'RFQ-2605-018', scope: 'Ambient food ingredients', status: 'Open', suppliers_count: '6 suppliers', due_date: 'May 31, 2026', round: '3 rounds', category: 'Food ingredients', sourcing_method: 'Invited RFQ', created_by: 'buyer' },
    { code: 'RFQ-2605-021', scope: 'Kitchen consumables', status: 'Technical review', suppliers_count: '4 suppliers', due_date: 'Jun 03, 2026', round: '2 rounds', category: 'Consumables', sourcing_method: 'Public RFQ', created_by: 'buyer' },
    { code: 'RFQ-2606-004', scope: 'Packaging material', status: 'Draft', suppliers_count: '8 suppliers', due_date: 'Jun 08, 2026', round: '1 round', category: 'Packaging', sourcing_method: 'Invited RFQ', created_by: 'buyer' },
    { code: 'RFQ-2606-009', scope: 'Frozen product replenishment', status: 'Award approval', suppliers_count: '5 suppliers', due_date: 'Jun 12, 2026', round: '3 rounds', category: 'Frozen food', sourcing_method: 'Invited RFQ', created_by: 'buyer' },
  ];
  rfqs.forEach(r => db.insert('rfqs', r));

  // RFQ Quotes
  const quotes = [
    { rfq_id: 1, supplier_id: 1, supplier_name: 'FreshFarm Distribution', unit_price: 18.50, currency: 'CNY', lead_time: '3 days', moq: '100 kg', notes: 'Price includes delivery', status: 'Submitted' },
    { rfq_id: 1, supplier_id: 3, supplier_name: 'SuXin Food / Su Xiao Liu', unit_price: 18.40, currency: 'CNY', lead_time: '3 days', moq: '100 kg', notes: 'Lowest landed cost', status: 'Submitted' },
    { rfq_id: 1, supplier_id: 2, supplier_name: 'Jixiang Wonton Food Supply', unit_price: 19.20, currency: 'CNY', lead_time: '4 days', moq: '150 kg', notes: 'Strong reliability', status: 'Submitted' },
    { rfq_id: 4, supplier_id: 2, supplier_name: 'Jixiang Wonton Food Supply', unit_price: 26.80, currency: 'CNY', lead_time: '2 days', moq: '50 pack', notes: 'Preferred supplier', status: 'Submitted' },
    { rfq_id: 4, supplier_id: 1, supplier_name: 'FreshFarm Distribution', unit_price: 27.50, currency: 'CNY', lead_time: '3 days', moq: '100 pack', notes: '', status: 'Submitted' },
  ];
  quotes.forEach(q => db.insert('rfq_quotes', q));

  // Contracts
  const contracts = [
    { code: 'CTR-2026-041', supplier_id: 1, supplier_name: 'FreshFarm Distribution', type: 'Frame agreement', status: 'Active', valid_until: 'Dec 31, 2026', price_status: 'Price list active' },
    { code: 'CTR-2026-052', supplier_id: 3, supplier_name: 'SuXin Food / Su Xiao Liu', type: 'Food supply', status: 'Legal review', valid_until: 'Mar 31, 2027', price_status: 'D365 price pending' },
    { code: 'CTR-2026-058', supplier_id: 4, supplier_name: 'GreenBox Packaging', type: 'Packaging supply', status: 'Signature', valid_until: 'Dec 31, 2026', price_status: 'Supplier uploaded stamp' },
    { code: 'CTR-2025-117', supplier_id: 5, supplier_name: 'North Star Logistics', type: 'Logistics service', status: 'Expiry alert', valid_until: 'Jun 30, 2026', price_status: 'Renewal required' },
  ];
  contracts.forEach(c => db.insert('contracts', c));

  // Price library
  const prices = [
    { code: 'PRC-2605-771', supplier_id: 3, supplier_name: 'SuXin Food / Su Xiao Liu', category: 'Prepared food', status: 'Approved', unit_price: 'CNY 18.40 / kg', erp_action: 'Sync to D365 catalog' },
    { code: 'PRC-2605-778', supplier_id: 2, supplier_name: 'Jixiang Wonton Food Supply', category: 'Frozen food', status: 'Approved', unit_price: 'CNY 26.80 / pack', erp_action: 'Sync to D365 catalog' },
    { code: 'PRC-2606-010', supplier_id: 4, supplier_name: 'GreenBox Packaging', category: 'Packaging', status: 'Approval', unit_price: 'CNY 0.82 / unit', erp_action: 'Pending D365 sync' },
  ];
  prices.forEach(p => db.insert('prices', p));

  // Orders
  const orders = [
    { code: 'PO-45001288', supplier_id: 1, supplier_name: 'FreshFarm Distribution', status: 'Confirmed', delivery_date: 'Jun 02, 2026', asn_count: '3 ASN lines', next_step: 'Receipt pending' },
    { code: 'PO-45001292', supplier_id: 3, supplier_name: 'SuXin Food / Su Xiao Liu', status: 'Delivery planned', delivery_date: 'Jun 05, 2026', asn_count: '2 ASN lines', next_step: 'Label printed' },
    { code: 'PO-45001304', supplier_id: 4, supplier_name: 'GreenBox Packaging', status: 'Supplier review', delivery_date: 'Jun 08, 2026', asn_count: 'No ASN', next_step: 'Confirmation due' },
    { code: 'PO-45001319', supplier_id: 2, supplier_name: 'Jixiang Wonton Food Supply', status: 'Partially received', delivery_date: 'Jun 09, 2026', asn_count: '1 exception', next_step: 'Reconciliation hold' },
  ];
  orders.forEach(o => db.insert('orders', o));

  // ASNs
  const asns = [
    { code: 'ASN-2605-001', order_id: 1, supplier_id: 1, shipment_date: '2026-06-01', carrier: 'SF Express cold chain', vehicle: 'SH-A1001', packing_list: '3 pallets, 120 cartons', status: 'Shipped' },
    { code: 'ASN-2605-002', order_id: 2, supplier_id: 3, shipment_date: '2026-06-04', carrier: 'YTO Express', vehicle: 'JS-B2002', packing_list: '2 pallets, 80 cartons', status: 'Preparing' },
  ];
  asns.forEach(a => db.insert('asns', a));

  // Settlements
  const settlements = [
    { code: 'STM-2605-144', supplier_id: 2, supplier_name: 'Jixiang Wonton Food Supply', type: 'Monthly settlement', status: 'Supplier confirmed', amount: 'CNY 184,260', currency: 'CNY', numeric_amount: 184260, next_step: 'Ready for AP invoice' },
    { code: 'STM-2605-151', supplier_id: 3, supplier_name: 'SuXin Food / Su Xiao Liu', type: 'Monthly settlement', status: 'Buyer review', amount: 'CNY 221,500', currency: 'CNY', numeric_amount: 221500, next_step: 'Receipt variance 0.8%' },
    { code: 'INV-2605-089', supplier_id: 1, supplier_name: 'FreshFarm Distribution', type: 'Invoice OCR + verification', status: 'Passed', amount: 'CNY 98,640', currency: 'CNY', numeric_amount: 98640, next_step: 'Send to D365 AP' },
    { code: 'INV-2605-104', supplier_id: 4, supplier_name: 'GreenBox Packaging', type: 'Invoice OCR + verification', status: 'Exception', amount: 'CNY 33,250', currency: 'CNY', numeric_amount: 33250, next_step: 'Tax number mismatch' },
  ];
  settlements.forEach(s => db.insert('settlements', s));

  // Invoices
  const invoices = [
    { code: 'INV-2605-089', settlement_id: 3, supplier_id: 1, invoice_type: 'VAT special invoice', amount: 98640, tax_amount: 5918.40, ocr_status: 'Passed', status: 'Approved' },
    { code: 'INV-2605-104', settlement_id: 4, supplier_id: 4, invoice_type: 'VAT special invoice', amount: 33250, tax_amount: 1995.00, ocr_status: 'Exception', status: 'Rejected' },
  ];
  invoices.forEach(i => db.insert('invoices', i));

  // Tasks
  const tasks = [
    { title: 'RFQ-2605-018: Submit commercial response', type: 'rfq', status: 'open', assigned_to: 'supplier', related_type: 'rfq', related_id: 1, priority: 'high', due_date: '2026-05-31' },
    { title: 'PO-45001292: Upload ASN and packing list', type: 'order', status: 'open', assigned_to: 'supplier', related_type: 'order', related_id: 2, priority: 'medium', due_date: '2026-06-04' },
    { title: 'STM-2605-144: Confirm monthly statement', type: 'settlement', status: 'open', assigned_to: 'supplier', related_type: 'settlement', related_id: 1, priority: 'medium', due_date: '2026-06-05' },
    { title: 'RFQ-2605-021: Technical review required', type: 'rfq', status: 'open', assigned_to: 'buyer', related_type: 'rfq', related_id: 2, priority: 'high', due_date: '2026-06-03' },
    { title: 'CTR-2026-052: Legal review pending', type: 'contract', status: 'open', assigned_to: 'buyer', related_type: 'contract', related_id: 2, priority: 'medium', due_date: '2026-06-10' },
  ];
  tasks.forEach(t => db.insert('tasks', t));

  // Notifications
  const notifications = [
    { user_id: 'buyer', title: 'RFQ deadline', message: 'RFQ-2605-018 closes in 3 days.', type: 'alert', is_read: false, related_type: 'rfq', related_id: 1 },
    { user_id: 'buyer', title: 'Contract alert', message: 'CTR-2025-117 expires in 33 days.', type: 'alert', is_read: false, related_type: 'contract', related_id: 4 },
    { user_id: 'buyer', title: 'Integration', message: '7 queued messages are waiting for retry.', type: 'system', is_read: false },
    { user_id: 'buyer', title: 'Supplier portal', message: 'STM-2605-144 has been confirmed by supplier.', type: 'info', is_read: true, related_type: 'settlement', related_id: 1 },
    { user_id: 'supplier3', title: 'New RFQ invitation', message: 'You are invited to RFQ-2605-018.', type: 'info', is_read: false, related_type: 'rfq', related_id: 1 },
    { user_id: 'supplier3', title: 'PO received', message: 'PO-45001292 is waiting for confirmation.', type: 'info', is_read: false, related_type: 'order', related_id: 2 },
  ];
  notifications.forEach(n => db.insert('notifications', n));

  // History
  const history = [
    { user_id: 'buyer', action: 'Created RFQ', entity_type: 'rfq', entity_id: 1, details: 'RFQ-2605-018 created with 6 suppliers invited' },
    { user_id: 'supplier3', action: 'Submitted quote', entity_type: 'rfq', entity_id: 1, details: 'Quote submitted for RFQ-2605-018 at CNY 18.40/kg' },
    { user_id: 'buyer', action: 'Published PO', entity_type: 'order', entity_id: 2, details: 'PO-45001292 published to SuXin Food' },
    { user_id: 'supplier2', action: 'Confirmed statement', entity_type: 'settlement', entity_id: 1, details: 'STM-2605-144 confirmed by Jixiang Wonton' },
  ];
  history.forEach(h => db.insert('history', h));

  // Admin config
  const configs = [
    { key: 'd365_sync_enabled', value: 'true', category: 'integration' },
    { key: 'auto_approve_threshold', value: '50000', category: 'workflow' },
    { key: 'settlement_cycle', value: 'monthly', category: 'workflow' },
    { key: 'rfq_default_deadline_days', value: '7', category: 'sourcing' },
    { key: 'portal_announcement', value: 'Welcome to Aden SRM Portal', category: 'portal' },
  ];
  configs.forEach(c => db.insert('admin_config', c));

  // CAPAs
  const capas = [
    { code: 'CAPA-2605-019', supplier_id: 4, supplier_name: 'GreenBox Packaging', status: 'Review', owner: 'QA Lead', due_date: 'Jun 04, 2026', issue: 'Label mismatch' },
    { code: 'CAPA-2605-027', supplier_id: 5, supplier_name: 'North Star Logistics', status: 'Exception', owner: 'Logistics Lead', due_date: 'Jun 01, 2026', issue: 'Late POD return' },
    { code: 'CAPA-2606-003', supplier_id: 1, supplier_name: 'FreshFarm Distribution', status: 'Open', owner: 'Category Owner', due_date: 'Jun 12, 2026', issue: 'Temperature variance' },
  ];
  capas.forEach(c => db.insert('capas', c));

  // Bids (Auction)
  const bids = [
    { code: 'BID-01', supplier_id: 4, supplier_name: 'GreenBox Packaging', status: 'Open', rank: 1, bid_amount: 'CNY 328,000', last_update: '1 min ago', auction_id: 1 },
    { code: 'BID-02', supplier_id: 1, supplier_name: 'FreshFarm Distribution', status: 'Open', rank: 2, bid_amount: 'CNY 332,500', last_update: '3 min ago', auction_id: 1 },
    { code: 'BID-03', supplier_id: 5, supplier_name: 'North Star Logistics', status: 'Review', rank: 3, bid_amount: 'CNY 338,000', last_update: '5 min ago', auction_id: 1 },
  ];
  bids.forEach(b => db.insert('bids', b));

  // Auctions
  const auctions = [
    { code: 'AUC-2606-004', scope: 'Packaging reverse auction', status: 'Open', due_date: 'Jun 13, 2026', min_decrement: 500, leading_bid: 'CNY 328,000', qualified_bidders: 5, bid_events: 27 },
  ];
  auctions.forEach(a => db.insert('auctions', a));

  // Documents
  const documents = [
    { name: 'Food safety certificate', related_record: 'Supplier profile', status: 'Review', owner: 'Supplier', updated: 'May 27', action: 'Renew' },
    { name: 'Quotation attachment', related_record: 'RFQ-2605-018', status: 'Open', owner: 'Supplier', updated: 'May 28', action: 'Submit' },
    { name: 'Stamped contract copy', related_record: 'CTR-2026-052', status: 'Signature', owner: 'Supplier', updated: 'May 26', action: 'Upload' },
    { name: 'Packing label', related_record: 'PO-45001292', status: 'Approved', owner: 'System', updated: 'May 28', action: 'Print' },
  ];
  documents.forEach(d => db.insert('documents', d));

  // Opportunities (for supplier)
  const opportunities = [
    { code: 'RFQ-2605-018', scope: 'Ambient food ingredients', status: 'Open', buyer: 'Aden Procurement', due_date: 'May 31, 2026', round: 'Round 3' },
    { code: 'TD-2606-002', scope: 'Catering consumables tender', status: 'Pre-qualification', buyer: 'Aden Procurement', due_date: 'Jun 10, 2026', round: 'Technical' },
    { code: 'AUC-2606-004', scope: 'Packaging reverse auction', status: 'Open', buyer: 'Aden Procurement', due_date: 'Jun 13, 2026', round: 'Live' },
  ];
  opportunities.forEach(o => db.insert('opportunities', o));

  console.log('Database seeded with demo data');
}

module.exports = { seed, DEMO_PASSWORD };
