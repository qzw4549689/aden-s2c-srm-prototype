const db = require('./db');
const bcrypt = require('bcryptjs');

const DEMO_PASSWORD = 'demo123';

function seed() {
  // Only seed if database is empty (first start)
  const existingOrgs = db.findAll('organizations');
  if (existingOrgs.length > 0) return;
  db.reset();

  // ========== 1. Organizations ==========
  const orgs = [
    { type: 'buyer', legal_name: 'Aden Procurement Co., Ltd.', short_name: 'Aden Procurement', tax_no: '9132********0000', bank_account: '**** **** **** 0000', bank_name: 'Bank of China Shanghai', address: 'Shanghai, China', status: 'active' },
    { type: 'supplier', legal_name: 'FreshFarm Distribution Co., Ltd.', short_name: 'FreshFarm Distribution', tax_no: '9132********0001', bank_account: '**** **** **** 1001', bank_name: 'ICBC Suzhou', address: 'Suzhou, Jiangsu', status: 'active' },
    { type: 'supplier', legal_name: 'Jixiang Wonton Food Supply Co., Ltd.', short_name: 'Jixiang Wonton Food Supply', tax_no: '9132********0002', bank_account: '**** **** **** 1002', bank_name: 'CCB Shanghai', address: 'Shanghai, China', status: 'active' },
    { type: 'supplier', legal_name: 'SuXin Food / Su Xiao Liu Co., Ltd.', short_name: 'SuXin Food / Su Xiao Liu', tax_no: '9132********0003', bank_account: '**** **** **** 8128', bank_name: 'ABC Jiangsu', address: 'Jiangsu, China', status: 'active' },
    { type: 'supplier', legal_name: 'GreenBox Packaging Co., Ltd.', short_name: 'GreenBox Packaging', tax_no: '9132********0004', bank_account: '**** **** **** 1004', bank_name: 'BOC Ningbo', address: 'Ningbo, Zhejiang', status: 'active' },
    { type: 'supplier', legal_name: 'North Star Logistics Co., Ltd.', short_name: 'North Star Logistics', tax_no: '9132********0005', bank_account: '**** **** **** 1005', bank_name: 'CMB Shanghai', address: 'Shanghai, China', status: 'active' },
  ];
  orgs.forEach(o => db.insert('organizations', o));

  // ========== 2. Users ==========
  const users = [
    { email: 'buyer@aden.demo', password_hash: bcrypt.hashSync(DEMO_PASSWORD, 10), display_name: 'Aden Procurement', role: 'buyer', org_id: 1, status: 'active' },
    { email: 'supplier1@aden.demo', password_hash: bcrypt.hashSync(DEMO_PASSWORD, 10), display_name: 'FreshFarm Admin', role: 'supplier', org_id: 2, status: 'active' },
    { email: 'supplier2@aden.demo', password_hash: bcrypt.hashSync(DEMO_PASSWORD, 10), display_name: 'Jixiang Wonton Admin', role: 'supplier', org_id: 3, status: 'active' },
    { email: 'supplier3@aden.demo', password_hash: bcrypt.hashSync(DEMO_PASSWORD, 10), display_name: 'SuXin Food Admin', role: 'supplier', org_id: 4, status: 'active' },
    { email: 'supplier4@aden.demo', password_hash: bcrypt.hashSync(DEMO_PASSWORD, 10), display_name: 'GreenBox Admin', role: 'supplier', org_id: 5, status: 'active' },
    { email: 'supplier5@aden.demo', password_hash: bcrypt.hashSync(DEMO_PASSWORD, 10), display_name: 'North Star Admin', role: 'supplier', org_id: 6, status: 'active' },
    { email: 'admin@aden.demo', password_hash: bcrypt.hashSync(DEMO_PASSWORD, 10), display_name: 'System Admin', role: 'admin', org_id: 1, status: 'active' },
  ];
  users.forEach(u => db.insert('users', u));

  // ========== 3. Supplier Profiles (Onboarding) ==========
  const profiles = [
    { org_id: 2, category: 'Food ingredients', qualification_status: 'Approved', score: 92, service_area: 'Suzhou, Jiangsu', contact_name: 'Mr. Zhang', contact_phone: '138****0001', contact_email: 'zhang@freshfarm.demo', business_license_no: 'BL-2020-001', tax_certificate_no: 'TC-2020-001', food_safety_cert_no: 'FS-2021-001', bank_name: 'ICBC Suzhou', bank_account: '**** **** **** 1001', bank_branch: 'Suzhou Industrial Park Branch', submitted_at: '2025-01-15T10:00:00Z', approved_at: '2025-01-20T14:00:00Z', version: 1, created_by: 1, updated_by: 1 },
    { org_id: 3, category: 'Frozen food', qualification_status: 'Approved', score: 95, service_area: 'Shanghai', contact_name: 'Ms. Li', contact_phone: '139****0002', contact_email: 'li@jixiang.demo', business_license_no: 'BL-2019-002', tax_certificate_no: 'TC-2019-002', food_safety_cert_no: 'FS-2020-002', bank_name: 'CCB Shanghai', bank_account: '**** **** **** 1002', bank_branch: 'Shanghai Pudong Branch', submitted_at: '2025-02-10T09:00:00Z', approved_at: '2025-02-15T11:00:00Z', version: 1, created_by: 1, updated_by: 1 },
    { org_id: 4, category: 'Prepared food', qualification_status: 'Approved', score: 91, service_area: 'Jiangsu', contact_name: 'Linda Chen', contact_phone: '137****0003', contact_email: 'linda@suxin.demo', business_license_no: 'BL-2021-003', tax_certificate_no: 'TC-2021-003', food_safety_cert_no: 'FS-2022-003', bank_name: 'ABC Jiangsu', bank_account: '**** **** **** 8128', bank_branch: 'Nanjing Xinjiekou Branch', submitted_at: '2025-03-05T08:00:00Z', approved_at: '2025-03-10T16:00:00Z', version: 1, created_by: 1, updated_by: 1 },
    { org_id: 5, category: 'Packaging', qualification_status: 'Buyer Review', score: 78, service_area: 'Ningbo, Zhejiang', contact_name: 'Mr. Wang', contact_phone: '136****0004', contact_email: 'wang@greenbox.demo', business_license_no: 'BL-2022-004', tax_certificate_no: 'TC-2022-004', food_safety_cert_no: null, bank_name: 'BOC Ningbo', bank_account: '**** **** **** 1004', bank_branch: 'Ningbo Haishu Branch', submitted_at: '2026-05-20T10:00:00Z', approved_at: null, rejected_at: null, rejection_reason: null, version: 1, created_by: 5, updated_by: 5 },
    { org_id: 6, category: 'LSP', qualification_status: 'Draft', score: 70, service_area: 'Shanghai', contact_name: 'Ms. Liu', contact_phone: '135****0005', contact_email: 'liu@northstar.demo', business_license_no: null, tax_certificate_no: null, food_safety_cert_no: null, bank_name: null, bank_account: null, bank_branch: null, submitted_at: null, approved_at: null, rejected_at: null, rejection_reason: null, version: 1, created_by: 6, updated_by: 6 },
  ];
  profiles.forEach(p => db.insert('supplier_profiles', p));

  // ========== 4. RFQs ==========
  const rfqs = [
    { rfq_no: 'RFQ-2605-018', title: 'Ambient food ingredients', category: 'Food ingredients', status: 'Award Approved', due_at: '2026-05-31T23:59:59Z', created_by: 1, published_at: '2026-05-15T10:00:00Z', award_supplier_id: 4, award_amount: 184260, rejection_reason: null, revision_count: 0 },
    { rfq_no: 'RFQ-2605-021', title: 'Kitchen consumables', category: 'Consumables', status: 'Comparison', due_at: '2026-06-03T23:59:59Z', created_by: 1, published_at: '2026-05-18T09:00:00Z', award_supplier_id: null, award_amount: null, rejection_reason: null, revision_count: 0 },
    { rfq_no: 'RFQ-2606-004', title: 'Packaging material', category: 'Packaging', status: 'Published', due_at: '2026-06-08T23:59:59Z', created_by: 1, published_at: '2026-05-25T14:00:00Z', award_supplier_id: null, award_amount: null, rejection_reason: null, revision_count: 0 },
    { rfq_no: 'RFQ-2606-009', title: 'Frozen product replenishment', category: 'Frozen food', status: 'Award Pending', due_at: '2026-06-12T23:59:59Z', created_by: 1, published_at: '2026-05-22T11:00:00Z', award_supplier_id: 3, award_amount: 221500, rejection_reason: null, revision_count: 0 },
    { rfq_no: 'RFQ-2606-015', title: 'Catering equipment', category: 'Equipment', status: 'Returned', due_at: '2026-06-15T23:59:59Z', created_by: 1, published_at: '2026-05-28T08:00:00Z', award_supplier_id: null, award_amount: null, rejection_reason: 'Please provide delivery capability proof for all items', revision_count: 1 },
    { rfq_no: 'RFQ-2606-020', title: 'Cleaning supplies', category: 'Consumables', status: 'Draft', due_at: '2026-06-20T23:59:59Z', created_by: 1, published_at: null, award_supplier_id: null, award_amount: null, rejection_reason: null, revision_count: 0 },
  ];
  rfqs.forEach(r => db.insert('rfqs', r));

  // ========== 5. RFQ Items ==========
  const rfqItems = [
    { rfq_id: 1, item_name: 'Rice (premium grade)', description: 'Long grain white rice, 5% broken', qty: 5000, uom: 'kg', delivery_date: '2026-06-15', remarks: 'Monthly demand' },
    { rfq_id: 1, item_name: 'Cooking oil (soybean)', description: 'Refined soybean oil, food grade', qty: 2000, uom: 'L', delivery_date: '2026-06-15', remarks: 'Brand: Arowana preferred' },
    { rfq_id: 2, item_name: 'Kitchen gloves (nitrile)', description: 'Blue nitrile gloves, powder-free', qty: 10000, uom: 'pcs', delivery_date: '2026-06-10', remarks: 'Size M and L' },
    { rfq_id: 2, item_name: 'Trash bags (heavy duty)', description: 'Black, 100L capacity', qty: 5000, uom: 'pcs', delivery_date: '2026-06-10', remarks: 'Thickness > 0.05mm' },
    { rfq_id: 3, item_name: 'Corrugated boxes (A4)', description: '3-layer corrugated, 30x20x15cm', qty: 10000, uom: 'pcs', delivery_date: '2026-06-20', remarks: 'Print logo required' },
    { rfq_id: 3, item_name: 'Bubble wrap', description: 'Width 50cm, roll length 100m', qty: 500, uom: 'roll', delivery_date: '2026-06-20', remarks: 'Anti-static preferred' },
    { rfq_id: 4, item_name: 'Frozen dumplings (pork)', description: 'Hand-made style, 20g each', qty: 50000, uom: 'pcs', delivery_date: '2026-06-25', remarks: '-18C storage' },
    { rfq_id: 4, item_name: 'Frozen spring rolls', description: 'Vegetable, 50g each', qty: 30000, uom: 'pcs', delivery_date: '2026-06-25', remarks: '-18C storage' },
    { rfq_id: 5, item_name: 'Stainless steel trays', description: 'GN 1/1 size, depth 65mm', qty: 200, uom: 'pcs', delivery_date: '2026-06-30', remarks: '304 stainless steel' },
    { rfq_id: 6, item_name: 'Floor cleaner', description: 'Neutral pH, 5L container', qty: 100, uom: 'pcs', delivery_date: '2026-07-05', remarks: 'Food safe certification' },
  ];
  rfqItems.forEach(i => db.insert('rfq_items', i));

  // ========== 6. RFQ Invitations ==========
  const invitations = [
    { rfq_id: 1, supplier_org_id: 2, status: 'accepted', invited_at: '2026-05-15T10:00:00Z', responded_at: '2026-05-15T12:00:00Z' },
    { rfq_id: 1, supplier_org_id: 3, status: 'accepted', invited_at: '2026-05-15T10:00:00Z', responded_at: '2026-05-16T09:00:00Z' },
    { rfq_id: 1, supplier_org_id: 4, status: 'accepted', invited_at: '2026-05-15T10:00:00Z', responded_at: '2026-05-15T14:00:00Z' },
    { rfq_id: 2, supplier_org_id: 2, status: 'accepted', invited_at: '2026-05-18T09:00:00Z', responded_at: '2026-05-18T11:00:00Z' },
    { rfq_id: 2, supplier_org_id: 3, status: 'accepted', invited_at: '2026-05-18T09:00:00Z', responded_at: '2026-05-19T10:00:00Z' },
    { rfq_id: 2, supplier_org_id: 4, status: 'accepted', invited_at: '2026-05-18T09:00:00Z', responded_at: '2026-05-18T16:00:00Z' },
    { rfq_id: 3, supplier_org_id: 2, status: 'accepted', invited_at: '2026-05-25T14:00:00Z', responded_at: '2026-05-25T15:00:00Z' },
    { rfq_id: 3, supplier_org_id: 5, status: 'accepted', invited_at: '2026-05-25T14:00:00Z', responded_at: '2026-05-26T09:00:00Z' },
    { rfq_id: 3, supplier_org_id: 6, status: 'pending', invited_at: '2026-05-25T14:00:00Z', responded_at: null },
    { rfq_id: 4, supplier_org_id: 3, status: 'accepted', invited_at: '2026-05-22T11:00:00Z', responded_at: '2026-05-22T13:00:00Z' },
    { rfq_id: 4, supplier_org_id: 2, status: 'accepted', invited_at: '2026-05-22T11:00:00Z', responded_at: '2026-05-23T10:00:00Z' },
    { rfq_id: 4, supplier_org_id: 4, status: 'accepted', invited_at: '2026-05-22T11:00:00Z', responded_at: '2026-05-22T15:00:00Z' },
  ];
  invitations.forEach(i => db.insert('rfq_invitations', i));

  // ========== 7. Quotes ==========
  const quotes = [
    { rfq_id: 1, supplier_org_id: 2, status: 'submitted', total_amount: 185000, currency: 'CNY', lead_time: '3 working days', moq: '100 kg', validity_days: 30, remarks: 'Price includes delivery to Shanghai', submitted_at: '2026-05-20T10:00:00Z', revision_no: 1 },
    { rfq_id: 1, supplier_org_id: 3, status: 'submitted', total_amount: 191800, currency: 'CNY', lead_time: '4 working days', moq: '150 kg', validity_days: 30, remarks: 'Strong reliability, preferred frozen-food supplier', submitted_at: '2026-05-21T09:00:00Z', revision_no: 1 },
    { rfq_id: 1, supplier_org_id: 4, status: 'submitted', total_amount: 184260, currency: 'CNY', lead_time: '3 working days', moq: '100 kg', validity_days: 30, remarks: 'Lowest landed cost, stable quality', submitted_at: '2026-05-20T14:00:00Z', revision_no: 1 },
    { rfq_id: 2, supplier_org_id: 2, status: 'submitted', total_amount: 45000, currency: 'CNY', lead_time: '2 working days', moq: '500 pcs', validity_days: 30, remarks: 'Stock available', submitted_at: '2026-05-25T11:00:00Z', revision_no: 1 },
    { rfq_id: 2, supplier_org_id: 3, status: 'submitted', total_amount: 46800, currency: 'CNY', lead_time: '3 working days', moq: '1000 pcs', validity_days: 30, remarks: 'Premium quality', submitted_at: '2026-05-26T10:00:00Z', revision_no: 1 },
    { rfq_id: 2, supplier_org_id: 4, status: 'submitted', total_amount: 44200, currency: 'CNY', lead_time: '2 working days', moq: '500 pcs', validity_days: 30, remarks: 'Competitive pricing', submitted_at: '2026-05-25T16:00:00Z', revision_no: 1 },
    { rfq_id: 4, supplier_org_id: 3, status: 'submitted', total_amount: 221500, currency: 'CNY', lead_time: '2 working days', moq: '5000 pcs', validity_days: 30, remarks: 'Preferred supplier for frozen products', submitted_at: '2026-05-28T09:00:00Z', revision_no: 1 },
    { rfq_id: 4, supplier_org_id: 2, status: 'submitted', total_amount: 228000, currency: 'CNY', lead_time: '3 working days', moq: '8000 pcs', validity_days: 30, remarks: 'Cold chain guaranteed', submitted_at: '2026-05-29T10:00:00Z', revision_no: 1 },
    { rfq_id: 4, supplier_org_id: 4, status: 'submitted', total_amount: 235000, currency: 'CNY', lead_time: '4 working days', moq: '10000 pcs', validity_days: 30, remarks: 'New product line', submitted_at: '2026-05-28T15:00:00Z', revision_no: 1 },
  ];
  quotes.forEach(q => db.insert('quotes', q));

  // ========== 8. Quote Items ==========
  const quoteItems = [
    { quote_id: 1, rfq_item_id: 1, unit_price: 18.50, amount: 92500, remarks: 'Best quality' },
    { quote_id: 1, rfq_item_id: 2, unit_price: 46.25, amount: 92500, remarks: 'Brand: Arowana' },
    { quote_id: 2, rfq_item_id: 1, unit_price: 19.20, amount: 96000, remarks: 'Standard grade' },
    { quote_id: 2, rfq_item_id: 2, unit_price: 47.90, amount: 95800, remarks: 'Alternative brand' },
    { quote_id: 3, rfq_item_id: 1, unit_price: 18.40, amount: 92000, remarks: 'Lowest price' },
    { quote_id: 3, rfq_item_id: 2, unit_price: 46.13, amount: 92260, remarks: 'Same quality' },
    { quote_id: 7, rfq_item_id: 7, unit_price: 3.80, amount: 190000, remarks: 'Hand-made style' },
    { quote_id: 7, rfq_item_id: 8, unit_price: 1.05, amount: 31500, remarks: 'Vegetable only' },
  ];
  quoteItems.forEach(i => db.insert('quote_items', i));

  // ========== 9. Purchase Orders ==========
  const pos = [
    { po_no: 'PO-45001288', supplier_org_id: 2, status: 'Confirmed', site: 'Shanghai HQ', delivery_date: '2026-06-02', total_amount: 98500, currency: 'CNY', contract_id: 1, created_by: 1 },
    { po_no: 'PO-45001292', supplier_org_id: 4, status: 'Change Requested', site: 'Shanghai HQ', delivery_date: '2026-06-05', total_amount: 112000, currency: 'CNY', contract_id: 2, created_by: 1 },
    { po_no: 'PO-45001304', supplier_org_id: 5, status: 'Pending Supplier', site: 'Ningbo Plant', delivery_date: '2026-06-08', total_amount: 45600, currency: 'CNY', contract_id: 3, created_by: 1 },
    { po_no: 'PO-45001319', supplier_org_id: 3, status: 'Closed', site: 'Shanghai HQ', delivery_date: '2026-05-20', total_amount: 184260, currency: 'CNY', contract_id: 2, created_by: 1 },
    { po_no: 'PO-45001325', supplier_org_id: 2, status: 'Confirmed', site: 'Shanghai HQ', delivery_date: '2026-06-10', total_amount: 67200, currency: 'CNY', contract_id: 1, created_by: 1 },
    { po_no: 'PO-45001330', supplier_org_id: 4, status: 'Partially Confirmed', site: 'Shanghai HQ', delivery_date: '2026-06-12', total_amount: 89000, currency: 'CNY', contract_id: 2, created_by: 1 },
    { po_no: 'PO-45001335', supplier_org_id: 6, status: 'Pending Supplier', site: 'Shanghai HQ', delivery_date: '2026-06-15', total_amount: 34500, currency: 'CNY', contract_id: null, created_by: 1 },
    { po_no: 'PO-45001340', supplier_org_id: 5, status: 'Change Requested', site: 'Ningbo Plant', delivery_date: '2026-06-18', total_amount: 52300, currency: 'CNY', contract_id: 3, created_by: 1 },
  ];
  pos.forEach(p => db.insert('purchase_orders', p));

  // ========== 10. PO Lines ==========
  const poLines = [
    { po_id: 1, item_name: 'Rice (premium grade)', qty: 2000, uom: 'kg', unit_price: 18.50, confirmed_qty: 2000, remarks: 'Monthly order' },
    { po_id: 1, item_name: 'Cooking oil (soybean)', qty: 1000, uom: 'L', unit_price: 46.25, confirmed_qty: 1000, remarks: 'Brand: Arowana' },
    { po_id: 2, item_name: 'Prepared lunch boxes', qty: 5000, uom: 'pcs', unit_price: 22.40, confirmed_qty: 4000, remarks: 'Change requested for qty' },
    { po_id: 3, item_name: 'Corrugated boxes (A4)', qty: 3000, uom: 'pcs', unit_price: 15.20, confirmed_qty: null, remarks: 'Awaiting confirmation' },
    { po_id: 4, item_name: 'Frozen dumplings (pork)', qty: 30000, uom: 'pcs', unit_price: 3.80, confirmed_qty: 30000, remarks: 'Completed' },
    { po_id: 4, item_name: 'Frozen spring rolls', qty: 20000, uom: 'pcs', unit_price: 1.05, confirmed_qty: 20000, remarks: 'Completed' },
    { po_id: 5, item_name: 'Vegetables (mixed)', qty: 1500, uom: 'kg', unit_price: 44.80, confirmed_qty: 1500, remarks: 'Weekly order' },
    { po_id: 6, item_name: 'Rice (premium grade)', qty: 1000, uom: 'kg', unit_price: 18.40, confirmed_qty: 800, remarks: 'Partial confirmation' },
    { po_id: 7, item_name: 'Logistics service', qty: 1, uom: 'trip', unit_price: 34500, confirmed_qty: null, remarks: 'Awaiting confirmation' },
    { po_id: 8, item_name: 'Bubble wrap', qty: 200, uom: 'roll', unit_price: 26.15, confirmed_qty: null, remarks: 'Change requested for delivery date' },
  ];
  poLines.forEach(l => db.insert('po_lines', l));

  // ========== 11. PO Confirmations ==========
  const poConfirmations = [
    { po_id: 2, supplier_org_id: 4, status: 'submitted', proposed_date: '2026-06-10', change_type: 'delivery', change_reason: 'Raw material supply delayed by 5 days', comments: 'Please approve the new delivery date', submitted_at: '2026-05-30T10:00:00Z', reviewed_at: null },
    { po_id: 8, supplier_org_id: 5, status: 'submitted', proposed_date: '2026-06-25', change_type: 'delivery', change_reason: 'Production schedule adjusted', comments: 'Need 7 more days for production', submitted_at: '2026-06-01T09:00:00Z', reviewed_at: null },
  ];
  poConfirmations.forEach(c => db.insert('po_confirmations', c));

  // ========== 12. ASNs ==========
  const asns = [
    { asn_no: 'ASN-2605-001', po_id: 1, supplier_org_id: 2, status: 'Accepted', ship_date: '2026-06-01', eta: '2026-06-02', carrier: 'SF Express cold chain', tracking_no: 'SF1234567890', total_cartons: 120, total_pallets: 3, remarks: 'Cold chain maintained at 0-4C', submitted_at: '2026-06-01T08:00:00Z' },
    { asn_no: 'ASN-2605-002', po_id: 2, supplier_org_id: 4, status: 'Exception', ship_date: '2026-06-04', eta: '2026-06-05', carrier: 'YTO Express', tracking_no: 'YT9876543210', total_cartons: 80, total_pallets: 2, remarks: 'Normal delivery', submitted_at: '2026-06-04T09:00:00Z' },
    { asn_no: 'ASN-2605-003', po_id: 5, supplier_org_id: 2, status: 'Submitted', ship_date: '2026-06-09', eta: '2026-06-10', carrier: 'SF Express', tracking_no: 'SF2345678901', total_cartons: 60, total_pallets: 2, remarks: 'Weekly delivery', submitted_at: '2026-06-09T07:00:00Z' },
    { asn_no: 'ASN-2605-004', po_id: 6, supplier_org_id: 4, status: 'Draft', ship_date: null, eta: null, carrier: null, tracking_no: null, total_cartons: null, total_pallets: null, remarks: 'Preparing shipment', submitted_at: null },
    { asn_no: 'ASN-2605-005', po_id: 7, supplier_org_id: 6, status: 'Accepted', ship_date: '2026-06-14', eta: '2026-06-15', carrier: 'Self delivery', tracking_no: 'NS-001', total_cartons: 1, total_pallets: 0, remarks: 'Direct delivery to warehouse', submitted_at: '2026-06-14T06:00:00Z' },
  ];
  asns.forEach(a => db.insert('asns', a));

  // ========== 13. ASN Lines ==========
  const asnLines = [
    { asn_id: 1, po_line_id: 1, ship_qty: 2000, batch_no: 'FF-20260601-A', remarks: 'Rice batch' },
    { asn_id: 1, po_line_id: 2, ship_qty: 1000, batch_no: 'FF-20260601-B', remarks: 'Oil batch' },
    { asn_id: 2, po_line_id: 3, ship_qty: 3500, batch_no: 'SX-20260604-A', remarks: 'Lunch boxes - qty diff' },
    { asn_id: 3, po_line_id: 7, ship_qty: 1500, batch_no: 'FF-20260609-A', remarks: 'Vegetables' },
    { asn_id: 5, po_line_id: 9, ship_qty: 1, batch_no: 'NS-001', remarks: 'Logistics service' },
  ];
  asnLines.forEach(l => db.insert('asn_lines', l));

  // ========== 14. ASN Exceptions ==========
  const asnExceptions = [
    { asn_id: 2, exception_type: 'quantity_diff', description: 'Actual received 3500 pcs vs ASN 4000 pcs, shortage of 500 pcs', reported_by: 1, reported_at: '2026-06-05T14:00:00Z', status: 'open' },
  ];
  asnExceptions.forEach(e => db.insert('asn_exceptions', e));

  // ========== 15. Settlements ==========
  const settlements = [
    { settlement_no: 'STM-2605-144', supplier_org_id: 3, period: '2026-05', status: 'Approved', total_amount: 184260, dispute_amount: 0, dispute_reason: null, dispute_attachment: null, created_by: 1, published_at: '2026-05-25T10:00:00Z', confirmed_at: '2026-05-27T16:00:00Z' },
    { settlement_no: 'STM-2605-151', supplier_org_id: 4, period: '2026-05', status: 'Disputed', total_amount: 112000, dispute_amount: 5000, dispute_reason: 'PO-45001292 actual received qty less than settlement qty', dispute_attachment: null, created_by: 1, published_at: '2026-05-26T09:00:00Z', confirmed_at: null },
    { settlement_no: 'STM-2605-160', supplier_org_id: 2, period: '2026-05', status: 'Invoice Submitted', total_amount: 98500, dispute_amount: 0, dispute_reason: null, dispute_attachment: null, created_by: 1, published_at: '2026-05-28T08:00:00Z', confirmed_at: '2026-05-28T14:00:00Z' },
    { settlement_no: 'STM-2605-165', supplier_org_id: 5, period: '2026-05', status: 'Returned', total_amount: 45600, dispute_amount: 0, dispute_reason: null, dispute_attachment: null, created_by: 1, published_at: '2026-05-27T10:00:00Z', confirmed_at: null },
    { settlement_no: 'STM-2606-010', supplier_org_id: 4, period: '2026-06', status: 'Published', total_amount: 89000, dispute_amount: 0, dispute_reason: null, dispute_attachment: null, created_by: 1, published_at: '2026-05-28T16:00:00Z', confirmed_at: null },
    { settlement_no: 'STM-2606-015', supplier_org_id: 2, period: '2026-06', status: 'Supplier Confirmed', total_amount: 67200, dispute_amount: 0, dispute_reason: null, dispute_attachment: null, created_by: 1, published_at: '2026-05-28T11:00:00Z', confirmed_at: '2026-05-28T15:00:00Z' },
  ];
  settlements.forEach(s => db.insert('settlements', s));

  // ========== 16. Settlement Lines ==========
  const settlementLines = [
    { settlement_id: 1, po_id: 4, asn_id: null, item_name: 'Frozen dumplings (pork)', received_qty: 30000, unit_price: 3.80, amount: 114000, variance_note: null },
    { settlement_id: 1, po_id: 4, asn_id: null, item_name: 'Frozen spring rolls', received_qty: 20000, unit_price: 1.05, amount: 21000, variance_note: null },
    { settlement_id: 1, po_id: null, asn_id: null, item_name: 'Previous month adjustment', received_qty: null, unit_price: null, amount: 49260, variance_note: 'Credit note applied' },
    { settlement_id: 2, po_id: 2, asn_id: 2, item_name: 'Prepared lunch boxes', received_qty: 3500, unit_price: 22.40, amount: 78400, variance_note: 'Shortage 500 pcs, dispute 5000 CNY' },
    { settlement_id: 2, po_id: 6, asn_id: null, item_name: 'Rice (premium grade)', received_qty: 800, unit_price: 18.40, amount: 14720, variance_note: null },
    { settlement_id: 2, po_id: null, asn_id: null, item_name: 'Previous month adjustment', received_qty: null, unit_price: null, amount: 18880, variance_note: null },
    { settlement_id: 3, po_id: 1, asn_id: 1, item_name: 'Rice (premium grade)', received_qty: 2000, unit_price: 18.50, amount: 37000, variance_note: null },
    { settlement_id: 3, po_id: 1, asn_id: 1, item_name: 'Cooking oil (soybean)', received_qty: 1000, unit_price: 46.25, amount: 46250, variance_note: null },
    { settlement_id: 3, po_id: 5, asn_id: null, item_name: 'Vegetables (mixed)', received_qty: 1500, unit_price: 44.80, amount: 67200, variance_note: null },
    { settlement_id: 5, po_id: 6, asn_id: null, item_name: 'Rice (premium grade)', received_qty: 800, unit_price: 18.40, amount: 14720, variance_note: 'Partial confirmation' },
    { settlement_id: 5, po_id: null, asn_id: null, item_name: 'Other items', received_qty: null, unit_price: null, amount: 74280, variance_note: null },
    { settlement_id: 6, po_id: 5, asn_id: 3, item_name: 'Vegetables (mixed)', received_qty: 1500, unit_price: 44.80, amount: 67200, variance_note: null },
  ];
  settlementLines.forEach(l => db.insert('settlement_lines', l));

  // ========== 17. Invoices ==========
  const invoices = [
    { settlement_id: 3, invoice_no: 'INV-2026-001', invoice_date: '2026-05-28', amount: 98500, tax_amount: 5537.74, tax_rate: 0.06, currency: 'CNY', ocr_status: 'passed', verification_status: 'verified', status: 'Approved', attachment: 'invoice_001.pdf', rejection_reason: null, submitted_at: '2026-05-28T10:00:00Z', approved_at: '2026-05-28T16:00:00Z' },
    { settlement_id: 4, invoice_no: 'INV-2026-002', invoice_date: '2026-05-27', amount: 45600, tax_amount: 2566.04, tax_rate: 0.06, currency: 'CNY', ocr_status: 'exception', verification_status: 'failed', status: 'Returned', attachment: 'invoice_002.pdf', rejection_reason: 'Tax number mismatch with system record', submitted_at: '2026-05-27T11:00:00Z', approved_at: null },
    { settlement_id: 1, invoice_no: 'INV-2026-003', invoice_date: '2026-05-29', amount: 184260, tax_amount: 10373.21, tax_rate: 0.06, currency: 'CNY', ocr_status: 'passed', verification_status: 'verified', status: 'Approved', attachment: 'invoice_003.pdf', rejection_reason: null, submitted_at: '2026-05-29T09:00:00Z', approved_at: '2026-05-29T14:00:00Z' },
  ];
  invoices.forEach(i => db.insert('invoices', i));

  // ========== 18. Approval Requests ==========
  const approvals = [
    { object_type: 'rfq', object_id: 4, status: 'pending', current_step: 1, submitted_by: 1, submitted_at: '2026-05-28T10:00:00Z', completed_at: null },
    { object_type: 'rfq', object_id: 5, status: 'returned', current_step: 1, submitted_by: 1, submitted_at: '2026-05-28T08:00:00Z', completed_at: '2026-05-28T12:00:00Z' },
    { object_type: 'onboarding', object_id: 5, status: 'pending', current_step: 1, submitted_by: 5, submitted_at: '2026-05-20T10:00:00Z', completed_at: null },
    { object_type: 'invoice', object_id: 2, status: 'returned', current_step: 1, submitted_by: 5, submitted_at: '2026-05-27T11:00:00Z', completed_at: '2026-05-27T15:00:00Z' },
  ];
  approvals.forEach(a => db.insert('approval_requests', a));

  // ========== 19. Approval Actions ==========
  const approvalActions = [
    { approval_id: 2, action: 'return', actor_id: 1, comments: 'Please provide delivery capability proof for all items', action_at: '2026-05-28T12:00:00Z' },
    { approval_id: 4, action: 'return', actor_id: 1, comments: 'Tax number mismatch with system record, please verify and resubmit', action_at: '2026-05-27T15:00:00Z' },
  ];
  approvalActions.forEach(a => db.insert('approval_actions', a));

  // ========== 20. Tasks ==========
  const tasks = [
    { assignee_user_id: 2, org_id: 2, object_type: 'rfq', object_id: 3, title: 'Submit quote for RFQ-2606-004: Packaging material', status: 'open', due_at: '2026-06-08T23:59:59Z' },
    { assignee_user_id: 3, org_id: 3, object_type: 'rfq', object_id: 3, title: 'Submit quote for RFQ-2606-004: Packaging material', status: 'open', due_at: '2026-06-08T23:59:59Z' },
    { assignee_user_id: 4, org_id: 4, object_type: 'rfq', object_id: 3, title: 'Submit quote for RFQ-2606-004: Packaging material', status: 'open', due_at: '2026-06-08T23:59:59Z' },
    { assignee_user_id: 1, org_id: 1, object_type: 'rfq', object_id: 2, title: 'Compare quotes for RFQ-2605-021: Kitchen consumables', status: 'open', due_at: '2026-06-03T23:59:59Z' },
    { assignee_user_id: 1, org_id: 1, object_type: 'rfq', object_id: 4, title: 'Approve award for RFQ-2606-009: Frozen product replenishment', status: 'open', due_at: '2026-06-10T23:59:59Z' },
    { assignee_user_id: 1, org_id: 1, object_type: 'onboarding', object_id: 5, title: 'Review supplier onboarding: GreenBox Packaging', status: 'open', due_at: '2026-06-05T23:59:59Z' },
    { assignee_user_id: 5, org_id: 5, object_type: 'po', object_id: 3, title: 'Confirm PO-45001304: Corrugated boxes', status: 'open', due_at: '2026-06-06T23:59:59Z' },
    { assignee_user_id: 6, org_id: 6, object_type: 'po', object_id: 7, title: 'Confirm PO-45001335: Logistics service', status: 'open', due_at: '2026-06-10T23:59:59Z' },
    { assignee_user_id: 4, org_id: 4, object_type: 'po', object_id: 6, title: 'Confirm PO-45001330: Rice (partial)', status: 'open', due_at: '2026-06-10T23:59:59Z' },
    { assignee_user_id: 1, org_id: 1, object_type: 'po', object_id: 2, title: 'Review change request for PO-45001292: Prepared lunch boxes', status: 'open', due_at: '2026-06-05T23:59:59Z' },
    { assignee_user_id: 1, org_id: 1, object_type: 'po', object_id: 8, title: 'Review change request for PO-45001340: Bubble wrap', status: 'open', due_at: '2026-06-05T23:59:59Z' },
    { assignee_user_id: 1, org_id: 1, object_type: 'asn', object_id: 3, title: 'Review ASN-2605-003: Vegetables from FreshFarm', status: 'open', due_at: '2026-06-10T23:59:59Z' },
    { assignee_user_id: 4, org_id: 4, object_type: 'asn', object_id: 2, title: 'Resolve exception for ASN-2605-002: Lunch boxes shortage', status: 'open', due_at: '2026-06-07T23:59:59Z' },
    { assignee_user_id: 4, org_id: 4, object_type: 'settlement', object_id: 5, title: 'Confirm settlement STM-2606-010 for June 2026', status: 'open', due_at: '2026-06-05T23:59:59Z' },
    { assignee_user_id: 2, org_id: 2, object_type: 'settlement', object_id: 6, title: 'Confirm settlement STM-2606-015 for June 2026', status: 'open', due_at: '2026-06-05T23:59:59Z' },
    { assignee_user_id: 1, org_id: 1, object_type: 'settlement', object_id: 2, title: 'Review dispute for STM-2605-151: SuXin Food', status: 'open', due_at: '2026-06-05T23:59:59Z' },
    { assignee_user_id: 1, org_id: 1, object_type: 'invoice', object_id: 1, title: 'Approve invoice INV-2026-001: FreshFarm', status: 'open', due_at: '2026-06-02T23:59:59Z' },
    { assignee_user_id: 1, org_id: 1, object_type: 'invoice', object_id: 3, title: 'Approve invoice INV-2026-003: Jixiang Wonton', status: 'open', due_at: '2026-06-02T23:59:59Z' },
    { assignee_user_id: 5, org_id: 5, object_type: 'invoice', object_id: 2, title: 'Resubmit invoice INV-2026-002: GreenBox (tax number corrected)', status: 'open', due_at: '2026-06-03T23:59:59Z' },
  ];
  tasks.forEach(t => db.insert('tasks', t));

  // ========== 21. Notifications ==========
  const notifications = [
    { user_id: 1, title: 'RFQ deadline approaching', message: 'RFQ-2605-018 closes in 3 days.', object_type: 'rfq', object_id: 1, is_read: false },
    { user_id: 1, title: 'Contract expiry alert', message: 'CTR-2025-117 expires in 33 days.', object_type: 'contract', object_id: 4, is_read: false },
    { user_id: 1, title: 'Integration queue', message: '7 queued messages are waiting for retry.', object_type: 'system', object_id: null, is_read: false },
    { user_id: 1, title: 'Settlement confirmed', message: 'STM-2605-144 has been confirmed by supplier.', object_type: 'settlement', object_id: 1, is_read: true },
    { user_id: 2, title: 'New RFQ invitation', message: 'You are invited to RFQ-2606-004: Packaging material', object_type: 'rfq', object_id: 3, is_read: false },
    { user_id: 2, title: 'PO received', message: 'PO-45001325 is waiting for confirmation.', object_type: 'po', object_id: 5, is_read: false },
    { user_id: 3, title: 'New RFQ invitation', message: 'You are invited to RFQ-2606-004: Packaging material', object_type: 'rfq', object_id: 3, is_read: false },
    { user_id: 3, title: 'Award approved', message: 'Congratulations! You have been awarded RFQ-2606-009.', object_type: 'rfq', object_id: 4, is_read: false },
    { user_id: 4, title: 'New RFQ invitation', message: 'You are invited to RFQ-2606-004: Packaging material', object_type: 'rfq', object_id: 3, is_read: false },
    { user_id: 4, title: 'ASN exception reported', message: 'ASN-2605-002 has been marked with exception: quantity_diff.', object_type: 'asn', object_id: 2, is_read: false },
    { user_id: 5, title: 'Invoice returned', message: 'Invoice INV-2026-002 has been returned: Tax number mismatch.', object_type: 'invoice', object_id: 2, is_read: false },
    { user_id: 5, title: 'Settlement published', message: 'STM-2605-165 has been published for your confirmation.', object_type: 'settlement', object_id: 4, is_read: false },
    { user_id: 6, title: 'New RFQ invitation', message: 'You are invited to RFQ-2606-004: Packaging material', object_type: 'rfq', object_id: 3, is_read: false },
    { user_id: 6, title: 'PO received', message: 'PO-45001335 is waiting for confirmation.', object_type: 'po', object_id: 7, is_read: false },
  ];
  notifications.forEach(n => db.insert('notifications', n));

  // ========== 22. Audit Logs ==========
  const auditLogs = [
    { actor_id: 1, object_type: 'rfq', object_id: 1, action: 'created', before_json: '{}', after_json: '{"status":"Draft"}', comments: 'RFQ-2605-018 created' },
    { actor_id: 1, object_type: 'rfq', object_id: 1, action: 'published', before_json: '{"status":"Draft"}', after_json: '{"status":"Published"}', comments: 'Published to 3 suppliers' },
    { actor_id: 4, object_type: 'quote', object_id: 3, action: 'submitted', before_json: '{"status":"Draft"}', after_json: '{"status":"Submitted","total_amount":184260}', comments: 'Quote submitted for RFQ-2605-018' },
    { actor_id: 1, object_type: 'rfq', object_id: 1, action: 'award_approved', before_json: '{"status":"Award Pending"}', after_json: '{"status":"Award Approved","award_supplier_id":4}', comments: 'Award approved for SuXin Food' },
    { actor_id: 5, object_type: 'onboarding', object_id: 5, action: 'submitted', before_json: '{"status":"Draft"}', after_json: '{"status":"Submitted"}', comments: 'GreenBox onboarding submitted' },
    { actor_id: 1, object_type: 'po', object_id: 2, action: 'change_requested', before_json: '{"status":"Confirmed"}', after_json: '{"status":"Change Requested"}', comments: 'Supplier requested delivery date change' },
    { actor_id: 4, object_type: 'asn', object_id: 2, action: 'submitted', before_json: '{"status":"Draft"}', after_json: '{"status":"Submitted"}', comments: 'ASN-2605-002 submitted' },
    { actor_id: 1, object_type: 'asn', object_id: 2, action: 'exception_reported', before_json: '{"status":"Submitted"}', after_json: '{"status":"Exception","exception_type":"quantity_diff"}', comments: 'Quantity difference: 500 pcs shortage' },
    { actor_id: 4, object_type: 'settlement', object_id: 2, action: 'disputed', before_json: '{"status":"Published"}', after_json: '{"status":"Disputed","dispute_amount":5000}', comments: 'Dispute: PO-45001292 qty mismatch' },
    { actor_id: 5, object_type: 'invoice', object_id: 2, action: 'submitted', before_json: '{"status":"Draft"}', after_json: '{"status":"Submitted"}', comments: 'Invoice INV-2026-002 submitted' },
    { actor_id: 1, object_type: 'invoice', object_id: 2, action: 'returned', before_json: '{"status":"Under Review"}', after_json: '{"status":"Returned"}', comments: 'Tax number mismatch' },
  ];
  auditLogs.forEach(l => db.insert('audit_logs', l));

  // ========== 23. System Configs ==========
  const configs = [
    { key: 'd365_sync_enabled', value_json: '{"value":"true"}', category: 'integration' },
    { key: 'auto_approve_threshold', value_json: '{"value":"50000"}', category: 'workflow' },
    { key: 'settlement_cycle', value_json: '{"value":"monthly"}', category: 'workflow' },
    { key: 'rfq_default_deadline_days', value_json: '{"value":"7"}', category: 'sourcing' },
    { key: 'portal_announcement', value_json: '{"value":"Welcome to Aden SRM Portal"}', category: 'portal' },
    { key: 'ocr_simulate_mode', value_json: '{"value":"random"}', category: 'integration' },
    { key: 'approval_required_rfq', value_json: '{"value":"true"}', category: 'workflow' },
    { key: 'approval_required_po_change', value_json: '{"value":"true"}', category: 'workflow' },
    { key: 'approval_required_invoice', value_json: '{"value":"true"}', category: 'workflow' },
  ];
  configs.forEach(c => db.insert('system_configs', c));

  console.log('Database seeded with comprehensive demo data');
  console.log('Organizations:', db.findAll('organizations').length);
  console.log('Users:', db.findAll('users').length);
  console.log('Supplier Profiles:', db.findAll('supplier_profiles').length);
  console.log('RFQs:', db.findAll('rfqs').length);
  console.log('RFQ Items:', db.findAll('rfq_items').length);
  console.log('Quotes:', db.findAll('quotes').length);
  console.log('POs:', db.findAll('purchase_orders').length);
  console.log('ASN:', db.findAll('asns').length);
  console.log('Settlements:', db.findAll('settlements').length);
  console.log('Invoices:', db.findAll('invoices').length);
  console.log('Tasks:', db.findAll('tasks').length);
  console.log('Notifications:', db.findAll('notifications').length);
  console.log('Audit Logs:', db.findAll('audit_logs').length);
}

module.exports = { seed, DEMO_PASSWORD };
