const db = require('./db');
const bcrypt = require('bcryptjs');

const DEMO_PASSWORD = 'demo123';

async function seed() {
  // Ensure DB is initialized
  await db.init();

  // Only seed if database is empty
  const existingOrgs = db.findAll('organizations');
  if (existingOrgs.length > 0) {
    console.log('Database already seeded, skipping.');
    return;
  }

  console.log('Seeding database...');

  // ========== 1. Organizations ==========
  const orgs = [
    { id: 1, type: 'buyer', legal_name: 'Aden Procurement Co., Ltd.', short_name: 'Aden Procurement', tax_no: '9132********0000', bank_account: '**** **** **** 0000', bank_name: 'Bank of China Shanghai', address: 'Shanghai, China', status: 'active' },
    { id: 2, type: 'supplier', legal_name: 'FreshFarm Distribution Co., Ltd.', short_name: 'FreshFarm Distribution', tax_no: '9132********0001', bank_account: '**** **** **** 1001', bank_name: 'ICBC Suzhou', address: 'Suzhou, Jiangsu', status: 'active' },
    { id: 3, type: 'supplier', legal_name: 'Jixiang Wonton Food Supply Co., Ltd.', short_name: 'Jixiang Wonton Food Supply', tax_no: '9132********0002', bank_account: '**** **** **** 1002', bank_name: 'CCB Shanghai', address: 'Shanghai, China', status: 'active' },
    { id: 4, type: 'supplier', legal_name: 'SuXin Food / Su Xiao Liu Co., Ltd.', short_name: 'SuXin Food / Su Xiao Liu', tax_no: '9132********0003', bank_account: '**** **** **** 8128', bank_name: 'ABC Jiangsu', address: 'Jiangsu, China', status: 'active' },
    { id: 5, type: 'supplier', legal_name: 'GreenBox Packaging Co., Ltd.', short_name: 'GreenBox Packaging', tax_no: '9132********0004', bank_account: '**** **** **** 1004', bank_name: 'BOC Ningbo', address: 'Ningbo, Zhejiang', status: 'active' },
    { id: 6, type: 'supplier', legal_name: 'North Star Logistics Co., Ltd.', short_name: 'North Star Logistics', tax_no: '9132********0005', bank_account: '**** **** **** 1005', bank_name: 'CMB Shanghai', address: 'Shanghai, China', status: 'active' },
  ];
  orgs.forEach(o => db.rawRun(
    `INSERT INTO organizations (id, type, legal_name, short_name, tax_no, bank_account, bank_name, address, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [o.id, o.type, o.legal_name, o.short_name, o.tax_no, o.bank_account, o.bank_name, o.address, o.status]
  ));

  // ========== 2. Users ==========
  const users = [
    { id: 1, email: 'buyer@aden.demo', password_hash: bcrypt.hashSync(DEMO_PASSWORD, 10), display_name: 'Aden Procurement', role: 'buyer', org_id: 1, status: 'active' },
    { id: 2, email: 'supplier1@aden.demo', password_hash: bcrypt.hashSync(DEMO_PASSWORD, 10), display_name: 'FreshFarm Admin', role: 'supplier', org_id: 2, status: 'active' },
    { id: 3, email: 'supplier2@aden.demo', password_hash: bcrypt.hashSync(DEMO_PASSWORD, 10), display_name: 'Jixiang Wonton Admin', role: 'supplier', org_id: 3, status: 'active' },
    { id: 4, email: 'supplier3@aden.demo', password_hash: bcrypt.hashSync(DEMO_PASSWORD, 10), display_name: 'SuXin Food Admin', role: 'supplier', org_id: 4, status: 'active' },
    { id: 5, email: 'supplier4@aden.demo', password_hash: bcrypt.hashSync(DEMO_PASSWORD, 10), display_name: 'GreenBox Admin', role: 'supplier', org_id: 5, status: 'active' },
    { id: 6, email: 'supplier5@aden.demo', password_hash: bcrypt.hashSync(DEMO_PASSWORD, 10), display_name: 'North Star Admin', role: 'supplier', org_id: 6, status: 'active' },
    { id: 7, email: 'admin@aden.demo', password_hash: bcrypt.hashSync(DEMO_PASSWORD, 10), display_name: 'System Admin', role: 'admin', org_id: 1, status: 'active' },
  ];
  users.forEach(u => db.rawRun(
    `INSERT INTO users (id, email, password_hash, display_name, role, org_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [u.id, u.email, u.password_hash, u.display_name, u.role, u.org_id, u.status]
  ));

  // ========== 3. Supplier Profiles ==========
  const profiles = [
    { id: 1, org_id: 2, category: 'Food ingredients', qualification_status: 'Approved', score: 92, service_area: 'Suzhou, Jiangsu', contact_name: 'Mr. Zhang', contact_phone: '138****0001', contact_email: 'zhang@freshfarm.demo', business_license_no: 'BL-2020-001', tax_certificate_no: 'TC-2020-001', food_safety_cert_no: 'FS-2021-001', bank_name: 'ICBC Suzhou', bank_account: '**** **** **** 1001', bank_branch: 'Suzhou Industrial Park Branch', submitted_at: '2025-01-15T10:00:00Z', approved_at: '2025-01-20T14:00:00Z', version: 1, created_by: 1, updated_by: 1 },
    { id: 2, org_id: 3, category: 'Frozen food', qualification_status: 'Approved', score: 95, service_area: 'Shanghai', contact_name: 'Ms. Li', contact_phone: '139****0002', contact_email: 'li@jixiang.demo', business_license_no: 'BL-2019-002', tax_certificate_no: 'TC-2019-002', food_safety_cert_no: 'FS-2020-002', bank_name: 'CCB Shanghai', bank_account: '**** **** **** 1002', bank_branch: 'Shanghai Pudong Branch', submitted_at: '2025-02-10T09:00:00Z', approved_at: '2025-02-15T11:00:00Z', version: 1, created_by: 1, updated_by: 1 },
    { id: 3, org_id: 4, category: 'Prepared food', qualification_status: 'Approved', score: 91, service_area: 'Jiangsu', contact_name: 'Linda Chen', contact_phone: '137****0003', contact_email: 'linda@suxin.demo', business_license_no: 'BL-2021-003', tax_certificate_no: 'TC-2021-003', food_safety_cert_no: 'FS-2022-003', bank_name: 'ABC Jiangsu', bank_account: '**** **** **** 8128', bank_branch: 'Nanjing Xinjiekou Branch', submitted_at: '2025-03-05T08:00:00Z', approved_at: '2025-03-10T16:00:00Z', version: 1, created_by: 1, updated_by: 1 },
    { id: 4, org_id: 5, category: 'Packaging', qualification_status: 'Buyer Review', score: 78, service_area: 'Ningbo, Zhejiang', contact_name: 'Mr. Wang', contact_phone: '136****0004', contact_email: 'wang@greenbox.demo', business_license_no: 'BL-2022-004', tax_certificate_no: 'TC-2022-004', food_safety_cert_no: null, bank_name: 'BOC Ningbo', bank_account: '**** **** **** 1004', bank_branch: 'Ningbo Haishu Branch', submitted_at: '2026-05-20T10:00:00Z', approved_at: null, rejected_at: null, rejection_reason: null, version: 1, created_by: 5, updated_by: 5 },
    { id: 5, org_id: 6, category: 'LSP', qualification_status: 'Draft', score: 70, service_area: 'Shanghai', contact_name: 'Ms. Liu', contact_phone: '135****0005', contact_email: 'liu@northstar.demo', business_license_no: null, tax_certificate_no: null, food_safety_cert_no: null, bank_name: null, bank_account: null, bank_branch: null, submitted_at: null, approved_at: null, rejected_at: null, rejection_reason: null, version: 1, created_by: 6, updated_by: 6 },
  ];
  profiles.forEach(p => db.rawRun(
    `INSERT INTO supplier_profiles (id, org_id, category, qualification_status, score, service_area, contact_name, contact_phone, contact_email, business_license_no, tax_certificate_no, food_safety_cert_no, bank_name, bank_account, bank_branch, submitted_at, approved_at, version, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [p.id, p.org_id, p.category, p.qualification_status, p.score, p.service_area, p.contact_name, p.contact_phone, p.contact_email, p.business_license_no, p.tax_certificate_no, p.food_safety_cert_no, p.bank_name, p.bank_account, p.bank_branch, p.submitted_at, p.approved_at, p.version, p.created_by, p.updated_by]
  ));

  // ========== 4. RFQs ==========
  const rfqs = [
    { id: 1, rfq_no: 'RFQ-2605-018', title: 'Ambient food ingredients', category: 'Food ingredients', status: 'Award Approved', due_at: '2026-05-31T23:59:59Z', created_by: 1, published_at: '2026-05-15T10:00:00Z', award_supplier_id: 4, award_amount: 184260, rejection_reason: null, revision_count: 0 },
    { id: 2, rfq_no: 'RFQ-2605-021', title: 'Kitchen consumables', category: 'Consumables', status: 'Comparison', due_at: '2026-06-03T23:59:59Z', created_by: 1, published_at: '2026-05-18T09:00:00Z', award_supplier_id: null, award_amount: null, rejection_reason: null, revision_count: 0 },
    { id: 3, rfq_no: 'RFQ-2606-004', title: 'Packaging material', category: 'Packaging', status: 'Published', due_at: '2026-06-08T23:59:59Z', created_by: 1, published_at: '2026-05-25T14:00:00Z', award_supplier_id: null, award_amount: null, rejection_reason: null, revision_count: 0 },
    { id: 4, rfq_no: 'RFQ-2606-009', title: 'Frozen product replenishment', category: 'Frozen food', status: 'Award Pending', due_at: '2026-06-12T23:59:59Z', created_by: 1, published_at: '2026-05-22T11:00:00Z', award_supplier_id: 3, award_amount: 221500, rejection_reason: null, revision_count: 0 },
    { id: 5, rfq_no: 'RFQ-2606-015', title: 'Catering equipment', category: 'Equipment', status: 'Returned', due_at: '2026-06-15T23:59:59Z', created_by: 1, published_at: '2026-05-28T08:00:00Z', award_supplier_id: null, award_amount: null, rejection_reason: 'Please provide delivery capability proof for all items', revision_count: 1 },
    { id: 6, rfq_no: 'RFQ-2606-020', title: 'Cleaning supplies', category: 'Consumables', status: 'Draft', due_at: '2026-06-20T23:59:59Z', created_by: 1, published_at: null, award_supplier_id: null, award_amount: null, rejection_reason: null, revision_count: 0 },
  ];
  rfqs.forEach(r => db.rawRun(
    `INSERT INTO rfqs (id, rfq_no, title, category, status, due_at, created_by, published_at, award_supplier_id, award_amount, rejection_reason, revision_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [r.id, r.rfq_no, r.title, r.category, r.status, r.due_at, r.created_by, r.published_at, r.award_supplier_id, r.award_amount, r.rejection_reason, r.revision_count]
  ));

  // ========== 5. RFQ Items ==========
  const rfqItems = [
    { id: 1, rfq_id: 1, line_no: 1, material_description: 'Rice (premium grade)', quantity: 5000, unit: 'kg', delivery_date: '2026-06-15', remarks: 'Monthly demand' },
    { id: 2, rfq_id: 1, line_no: 2, material_description: 'Cooking oil (soybean)', quantity: 2000, unit: 'L', delivery_date: '2026-06-15', remarks: 'Brand: Arowana preferred' },
    { id: 3, rfq_id: 2, line_no: 1, material_description: 'Kitchen gloves (nitrile)', quantity: 10000, unit: 'pcs', delivery_date: '2026-06-10', remarks: 'Size M and L' },
    { id: 4, rfq_id: 2, line_no: 2, material_description: 'Trash bags (heavy duty)', quantity: 5000, unit: 'pcs', delivery_date: '2026-06-10', remarks: 'Thickness > 0.05mm' },
    { id: 5, rfq_id: 3, line_no: 1, material_description: 'Corrugated boxes (A4)', quantity: 10000, unit: 'pcs', delivery_date: '2026-06-20', remarks: 'Print logo required' },
    { id: 6, rfq_id: 3, line_no: 2, material_description: 'Bubble wrap', quantity: 500, unit: 'roll', delivery_date: '2026-06-20', remarks: 'Anti-static preferred' },
    { id: 7, rfq_id: 4, line_no: 1, material_description: 'Frozen dumplings (pork)', quantity: 50000, unit: 'pcs', delivery_date: '2026-06-25', remarks: '-18C storage' },
    { id: 8, rfq_id: 4, line_no: 2, material_description: 'Frozen spring rolls', quantity: 30000, unit: 'pcs', delivery_date: '2026-06-25', remarks: '-18C storage' },
    { id: 9, rfq_id: 5, line_no: 1, material_description: 'Stainless steel trays', quantity: 200, unit: 'pcs', delivery_date: '2026-06-30', remarks: '304 stainless steel' },
    { id: 10, rfq_id: 6, line_no: 1, material_description: 'Floor cleaner', quantity: 100, unit: 'pcs', delivery_date: '2026-07-05', remarks: 'Food safe certification' },
  ];
  rfqItems.forEach(i => db.rawRun(
    `INSERT INTO rfq_items (id, rfq_id, line_no, material_description, quantity, unit, delivery_date, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [i.id, i.rfq_id, i.line_no, i.material_description, i.quantity, i.unit, i.delivery_date, i.remarks]
  ));

  // ========== 6. RFQ Invitations ==========
  const invitations = [
    { id: 1, rfq_id: 1, supplier_org_id: 2, status: 'accepted', invited_at: '2026-05-15T10:00:00Z', responded_at: '2026-05-15T12:00:00Z' },
    { id: 2, rfq_id: 1, supplier_org_id: 3, status: 'accepted', invited_at: '2026-05-15T10:00:00Z', responded_at: '2026-05-16T09:00:00Z' },
    { id: 3, rfq_id: 1, supplier_org_id: 4, status: 'accepted', invited_at: '2026-05-15T10:00:00Z', responded_at: '2026-05-15T14:00:00Z' },
    { id: 4, rfq_id: 2, supplier_org_id: 2, status: 'accepted', invited_at: '2026-05-18T09:00:00Z', responded_at: '2026-05-18T11:00:00Z' },
    { id: 5, rfq_id: 2, supplier_org_id: 3, status: 'accepted', invited_at: '2026-05-18T09:00:00Z', responded_at: '2026-05-19T10:00:00Z' },
    { id: 6, rfq_id: 2, supplier_org_id: 4, status: 'accepted', invited_at: '2026-05-18T09:00:00Z', responded_at: '2026-05-18T16:00:00Z' },
    { id: 7, rfq_id: 3, supplier_org_id: 2, status: 'accepted', invited_at: '2026-05-25T14:00:00Z', responded_at: '2026-05-25T15:00:00Z' },
    { id: 8, rfq_id: 3, supplier_org_id: 5, status: 'accepted', invited_at: '2026-05-25T14:00:00Z', responded_at: '2026-05-26T09:00:00Z' },
    { id: 9, rfq_id: 3, supplier_org_id: 6, status: 'pending', invited_at: '2026-05-25T14:00:00Z', responded_at: null },
    { id: 10, rfq_id: 4, supplier_org_id: 3, status: 'accepted', invited_at: '2026-05-22T11:00:00Z', responded_at: '2026-05-22T13:00:00Z' },
    { id: 11, rfq_id: 4, supplier_org_id: 2, status: 'accepted', invited_at: '2026-05-22T11:00:00Z', responded_at: '2026-05-23T10:00:00Z' },
    { id: 12, rfq_id: 4, supplier_org_id: 4, status: 'accepted', invited_at: '2026-05-22T11:00:00Z', responded_at: '2026-05-22T15:00:00Z' },
  ];
  invitations.forEach(i => db.rawRun(
    `INSERT INTO rfq_invitations (id, rfq_id, supplier_org_id, status, invited_at, responded_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [i.id, i.rfq_id, i.supplier_org_id, i.status, i.invited_at, i.responded_at]
  ));

  // ========== 7. Quotes ==========
  const quotes = [
    { id: 1, rfq_id: 1, supplier_org_id: 2, status: 'submitted', total_amount: 185000, currency: 'CNY', lead_time: '3 working days', moq: '100 kg', validity_days: 30, remarks: 'Price includes delivery to Shanghai', submitted_at: '2026-05-20T10:00:00Z', revision_no: 1 },
    { id: 2, rfq_id: 1, supplier_org_id: 3, status: 'submitted', total_amount: 191800, currency: 'CNY', lead_time: '4 working days', moq: '150 kg', validity_days: 30, remarks: 'Strong reliability, preferred frozen-food supplier', submitted_at: '2026-05-21T09:00:00Z', revision_no: 1 },
    { id: 3, rfq_id: 1, supplier_org_id: 4, status: 'submitted', total_amount: 184260, currency: 'CNY', lead_time: '3 working days', moq: '100 kg', validity_days: 30, remarks: 'Lowest landed cost, stable quality', submitted_at: '2026-05-20T14:00:00Z', revision_no: 1 },
    { id: 4, rfq_id: 2, supplier_org_id: 2, status: 'submitted', total_amount: 45000, currency: 'CNY', lead_time: '2 working days', moq: '500 pcs', validity_days: 30, remarks: 'Stock available', submitted_at: '2026-05-25T11:00:00Z', revision_no: 1 },
    { id: 5, rfq_id: 2, supplier_org_id: 3, status: 'submitted', total_amount: 46800, currency: 'CNY', lead_time: '3 working days', moq: '1000 pcs', validity_days: 30, remarks: 'Premium quality', submitted_at: '2026-05-26T10:00:00Z', revision_no: 1 },
    { id: 6, rfq_id: 2, supplier_org_id: 4, status: 'submitted', total_amount: 44200, currency: 'CNY', lead_time: '2 working days', moq: '500 pcs', validity_days: 30, remarks: 'Competitive pricing', submitted_at: '2026-05-25T16:00:00Z', revision_no: 1 },
    { id: 7, rfq_id: 4, supplier_org_id: 3, status: 'submitted', total_amount: 221500, currency: 'CNY', lead_time: '2 working days', moq: '5000 pcs', validity_days: 30, remarks: 'Preferred supplier for frozen products', submitted_at: '2026-05-28T09:00:00Z', revision_no: 1 },
    { id: 8, rfq_id: 4, supplier_org_id: 2, status: 'submitted', total_amount: 228000, currency: 'CNY', lead_time: '3 working days', moq: '8000 pcs', validity_days: 30, remarks: 'Cold chain guaranteed', submitted_at: '2026-05-29T10:00:00Z', revision_no: 1 },
    { id: 9, rfq_id: 4, supplier_org_id: 4, status: 'submitted', total_amount: 235000, currency: 'CNY', lead_time: '4 working days', moq: '10000 pcs', validity_days: 30, remarks: 'New product line', submitted_at: '2026-05-28T15:00:00Z', revision_no: 1 },
  ];
  quotes.forEach(q => db.rawRun(
    `INSERT INTO quotes (id, rfq_id, supplier_org_id, status, total_amount, currency, lead_time, moq, validity_days, remarks, submitted_at, revision_no) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [q.id, q.rfq_id, q.supplier_org_id, q.status, q.total_amount, q.currency, q.lead_time, q.moq, q.validity_days, q.remarks, q.submitted_at, q.revision_no]
  ));

  // ========== 8. Quote Items ==========
  const quoteItems = [
    { id: 1, quote_id: 1, rfq_item_id: 1, unit_price: 18.50, amount: 92500, remarks: 'Best quality' },
    { id: 2, quote_id: 1, rfq_item_id: 2, unit_price: 46.25, amount: 92500, remarks: 'Brand: Arowana' },
    { id: 3, quote_id: 2, rfq_item_id: 1, unit_price: 19.20, amount: 96000, remarks: 'Standard grade' },
    { id: 4, quote_id: 2, rfq_item_id: 2, unit_price: 47.90, amount: 95800, remarks: 'Alternative brand' },
    { id: 5, quote_id: 3, rfq_item_id: 1, unit_price: 18.40, amount: 92000, remarks: 'Lowest price' },
    { id: 6, quote_id: 3, rfq_item_id: 2, unit_price: 46.13, amount: 92260, remarks: 'Same quality' },
    { id: 7, quote_id: 7, rfq_item_id: 7, unit_price: 3.80, amount: 190000, remarks: 'Hand-made style' },
    { id: 8, quote_id: 7, rfq_item_id: 8, unit_price: 1.05, amount: 31500, remarks: 'Vegetable only' },
  ];
  quoteItems.forEach(i => db.rawRun(
    `INSERT INTO quote_items (id, quote_id, rfq_item_id, unit_price, amount, remarks) VALUES (?, ?, ?, ?, ?, ?)`,
    [i.id, i.quote_id, i.rfq_item_id, i.unit_price, i.amount, i.remarks]
  ));

  // ========== 9. Purchase Orders ==========
  const pos = [
    { id: 1, po_no: 'PO-45001288', supplier_org_id: 2, status: 'Confirmed', site: 'Shanghai HQ', delivery_date: '2026-06-02', total_amount: 98500, currency: 'CNY', contract_id: 1, created_by: 1 },
    { id: 2, po_no: 'PO-45001292', supplier_org_id: 4, status: 'Change Requested', site: 'Shanghai HQ', delivery_date: '2026-06-05', total_amount: 112000, currency: 'CNY', contract_id: 2, created_by: 1 },
    { id: 3, po_no: 'PO-45001304', supplier_org_id: 5, status: 'Pending Supplier', site: 'Ningbo Plant', delivery_date: '2026-06-08', total_amount: 45600, currency: 'CNY', contract_id: 3, created_by: 1 },
    { id: 4, po_no: 'PO-45001319', supplier_org_id: 3, status: 'Closed', site: 'Shanghai HQ', delivery_date: '2026-05-20', total_amount: 184260, currency: 'CNY', contract_id: 2, created_by: 1 },
    { id: 5, po_no: 'PO-45001325', supplier_org_id: 2, status: 'Confirmed', site: 'Shanghai HQ', delivery_date: '2026-06-10', total_amount: 67200, currency: 'CNY', contract_id: 1, created_by: 1 },
    { id: 6, po_no: 'PO-45001330', supplier_org_id: 4, status: 'Partially Confirmed', site: 'Shanghai HQ', delivery_date: '2026-06-12', total_amount: 89000, currency: 'CNY', contract_id: 2, created_by: 1 },
    { id: 7, po_no: 'PO-45001335', supplier_org_id: 6, status: 'Pending Supplier', site: 'Shanghai HQ', delivery_date: '2026-06-15', total_amount: 34500, currency: 'CNY', contract_id: null, created_by: 1 },
    { id: 8, po_no: 'PO-45001340', supplier_org_id: 5, status: 'Change Requested', site: 'Ningbo Plant', delivery_date: '2026-06-18', total_amount: 52300, currency: 'CNY', contract_id: 3, created_by: 1 },
  ];
  pos.forEach(p => db.rawRun(
    `INSERT INTO purchase_orders (id, po_no, supplier_org_id, status, site, delivery_date, total_amount, currency, contract_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [p.id, p.po_no, p.supplier_org_id, p.status, p.site, p.delivery_date, p.total_amount, p.currency, p.contract_id, p.created_by]
  ));

  // ========== 10. PO Lines ==========
  const poLines = [
    { id: 1, po_id: 1, item_name: 'Rice (premium grade)', qty: 2000, uom: 'kg', unit_price: 18.50, confirmed_qty: 2000, remarks: 'Monthly order' },
    { id: 2, po_id: 1, item_name: 'Cooking oil (soybean)', qty: 1000, uom: 'L', unit_price: 46.25, confirmed_qty: 1000, remarks: 'Brand: Arowana' },
    { id: 3, po_id: 2, item_name: 'Prepared lunch boxes', qty: 5000, uom: 'pcs', unit_price: 22.40, confirmed_qty: 4000, remarks: 'Change requested for qty' },
    { id: 4, po_id: 3, item_name: 'Corrugated boxes (A4)', qty: 3000, uom: 'pcs', unit_price: 15.20, confirmed_qty: null, remarks: 'Awaiting confirmation' },
    { id: 5, po_id: 4, item_name: 'Frozen dumplings (pork)', qty: 30000, uom: 'pcs', unit_price: 3.80, confirmed_qty: 30000, remarks: 'Completed' },
    { id: 6, po_id: 4, item_name: 'Frozen spring rolls', qty: 20000, uom: 'pcs', unit_price: 1.05, confirmed_qty: 20000, remarks: 'Completed' },
    { id: 7, po_id: 5, item_name: 'Vegetables (mixed)', qty: 1500, uom: 'kg', unit_price: 44.80, confirmed_qty: 1500, remarks: 'Weekly order' },
    { id: 8, po_id: 6, item_name: 'Rice (premium grade)', qty: 1000, uom: 'kg', unit_price: 18.40, confirmed_qty: 800, remarks: 'Partial confirmation' },
    { id: 9, po_id: 7, item_name: 'Logistics service', qty: 1, uom: 'trip', unit_price: 34500, confirmed_qty: null, remarks: 'Awaiting confirmation' },
    { id: 10, po_id: 8, item_name: 'Bubble wrap', qty: 200, uom: 'roll', unit_price: 26.15, confirmed_qty: null, remarks: 'Change requested for delivery date' },
  ];
  poLines.forEach(l => db.rawRun(
    `INSERT INTO po_lines (id, po_id, item_name, qty, uom, unit_price, confirmed_qty, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [l.id, l.po_id, l.item_name, l.qty, l.uom, l.unit_price, l.confirmed_qty, l.remarks]
  ));

  // ========== 11. PO Confirmations ==========
  const poConfirmations = [
    { id: 1, po_id: 2, supplier_org_id: 4, status: 'submitted', proposed_date: '2026-06-10', change_type: 'delivery', change_reason: 'Raw material supply delayed by 5 days', comments: 'Please approve the new delivery date', submitted_at: '2026-05-30T10:00:00Z', reviewed_at: null },
    { id: 2, po_id: 8, supplier_org_id: 5, status: 'submitted', proposed_date: '2026-06-25', change_type: 'delivery', change_reason: 'Production schedule adjusted', comments: 'Need 7 more days for production', submitted_at: '2026-06-01T09:00:00Z', reviewed_at: null },
  ];
  poConfirmations.forEach(c => db.rawRun(
    `INSERT INTO po_confirmations (id, po_id, supplier_org_id, status, proposed_date, change_type, change_reason, comments, submitted_at, reviewed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [c.id, c.po_id, c.supplier_org_id, c.status, c.proposed_date, c.change_type, c.change_reason, c.comments, c.submitted_at, c.reviewed_at]
  ));

  // ========== 12. ASNs ==========
  const asns = [
    { id: 1, asn_no: 'ASN-2605-001', po_id: 1, supplier_org_id: 2, status: 'Accepted', ship_date: '2026-06-01', eta: '2026-06-02', carrier: 'SF Express cold chain', tracking_no: 'SF1234567890', total_cartons: 120, total_pallets: 3, remarks: 'Cold chain maintained at 0-4C', submitted_at: '2026-06-01T08:00:00Z' },
    { id: 2, asn_no: 'ASN-2605-002', po_id: 2, supplier_org_id: 4, status: 'Exception', ship_date: '2026-06-04', eta: '2026-06-05', carrier: 'YTO Express', tracking_no: 'YT9876543210', total_cartons: 80, total_pallets: 2, remarks: 'Normal delivery', submitted_at: '2026-06-04T09:00:00Z' },
    { id: 3, asn_no: 'ASN-2605-003', po_id: 5, supplier_org_id: 2, status: 'Submitted', ship_date: '2026-06-09', eta: '2026-06-10', carrier: 'SF Express', tracking_no: 'SF2345678901', total_cartons: 60, total_pallets: 2, remarks: 'Weekly delivery', submitted_at: '2026-06-09T07:00:00Z' },
    { id: 4, asn_no: 'ASN-2605-004', po_id: 6, supplier_org_id: 4, status: 'Draft', ship_date: null, eta: null, carrier: null, tracking_no: null, total_cartons: null, total_pallets: null, remarks: 'Preparing shipment', submitted_at: null },
    { id: 5, asn_no: 'ASN-2605-005', po_id: 7, supplier_org_id: 6, status: 'Accepted', ship_date: '2026-06-14', eta: '2026-06-15', carrier: 'Self delivery', tracking_no: 'NS-001', total_cartons: 1, total_pallets: 0, remarks: 'Direct delivery to warehouse', submitted_at: '2026-06-14T06:00:00Z' },
  ];
  asns.forEach(a => db.rawRun(
    `INSERT INTO asns (id, asn_no, po_id, supplier_org_id, status, ship_date, eta, carrier, tracking_no, total_cartons, total_pallets, remarks, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [a.id, a.asn_no, a.po_id, a.supplier_org_id, a.status, a.ship_date, a.eta, a.carrier, a.tracking_no, a.total_cartons, a.total_pallets, a.remarks, a.submitted_at]
  ));

  // ========== 13. ASN Lines ==========
  const asnLines = [
    { id: 1, asn_id: 1, po_line_id: 1, ship_qty: 2000, batch_no: 'FF-20260601-A', remarks: 'Rice batch' },
    { id: 2, asn_id: 1, po_line_id: 2, ship_qty: 1000, batch_no: 'FF-20260601-B', remarks: 'Oil batch' },
    { id: 3, asn_id: 2, po_line_id: 3, ship_qty: 3500, batch_no: 'SX-20260604-A', remarks: 'Lunch boxes - qty diff' },
    { id: 4, asn_id: 3, po_line_id: 7, ship_qty: 1500, batch_no: 'FF-20260609-A', remarks: 'Vegetables' },
    { id: 5, asn_id: 5, po_line_id: 9, ship_qty: 1, batch_no: 'NS-001', remarks: 'Logistics service' },
  ];
  asnLines.forEach(l => db.rawRun(
    `INSERT INTO asn_lines (id, asn_id, po_line_id, ship_qty, batch_no, remarks) VALUES (?, ?, ?, ?, ?, ?)`,
    [l.id, l.asn_id, l.po_line_id, l.ship_qty, l.batch_no, l.remarks]
  ));

  // ========== 14. ASN Exceptions ==========
  const asnExceptions = [
    { id: 1, asn_id: 2, exception_type: 'quantity_diff', description: 'Actual received 3500 pcs vs ASN 4000 pcs, shortage of 500 pcs', reported_by: 1, reported_at: '2026-06-05T14:00:00Z', status: 'open' },
  ];
  asnExceptions.forEach(e => db.rawRun(
    `INSERT INTO asn_exceptions (id, asn_id, exception_type, description, reported_by, reported_at, status) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [e.id, e.asn_id, e.exception_type, e.description, e.reported_by, e.reported_at, e.status]
  ));

  // ========== 15. Settlements ==========
  const settlements = [
    { id: 1, settlement_no: 'STM-2605-144', supplier_org_id: 3, period: '2026-05', status: 'Approved', total_amount: 184260, dispute_amount: 0, dispute_reason: null, dispute_attachment: null, created_by: 1, published_at: '2026-05-25T10:00:00Z', confirmed_at: '2026-05-27T16:00:00Z' },
    { id: 2, settlement_no: 'STM-2605-151', supplier_org_id: 4, period: '2026-05', status: 'Disputed', total_amount: 112000, dispute_amount: 5000, dispute_reason: 'PO-45001292 actual received qty less than settlement qty', dispute_attachment: null, created_by: 1, published_at: '2026-05-26T09:00:00Z', confirmed_at: null },
    { id: 3, settlement_no: 'STM-2605-160', supplier_org_id: 2, period: '2026-05', status: 'Invoice Submitted', total_amount: 98500, dispute_amount: 0, dispute_reason: null, dispute_attachment: null, created_by: 1, published_at: '2026-05-28T08:00:00Z', confirmed_at: '2026-05-28T14:00:00Z' },
    { id: 4, settlement_no: 'STM-2605-165', supplier_org_id: 5, period: '2026-05', status: 'Returned', total_amount: 45600, dispute_amount: 0, dispute_reason: null, dispute_attachment: null, created_by: 1, published_at: '2026-05-27T10:00:00Z', confirmed_at: null },
    { id: 5, settlement_no: 'STM-2606-010', supplier_org_id: 4, period: '2026-06', status: 'Published', total_amount: 89000, dispute_amount: 0, dispute_reason: null, dispute_attachment: null, created_by: 1, published_at: '2026-05-28T16:00:00Z', confirmed_at: null },
    { id: 6, settlement_no: 'STM-2606-015', supplier_org_id: 2, period: '2026-06', status: 'Supplier Confirmed', total_amount: 67200, dispute_amount: 0, dispute_reason: null, dispute_attachment: null, created_by: 1, published_at: '2026-05-28T11:00:00Z', confirmed_at: '2026-05-28T15:00:00Z' },
  ];
  settlements.forEach(s => db.rawRun(
    `INSERT INTO settlements (id, settlement_no, supplier_org_id, period, status, total_amount, dispute_amount, dispute_reason, dispute_attachment, created_by, published_at, confirmed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [s.id, s.settlement_no, s.supplier_org_id, s.period, s.status, s.total_amount, s.dispute_amount, s.dispute_reason, s.dispute_attachment, s.created_by, s.published_at, s.confirmed_at]
  ));

  // ========== 16. Settlement Lines ==========
  const settlementLines = [
    { id: 1, settlement_id: 1, po_id: 4, asn_id: null, item_name: 'Frozen dumplings (pork)', received_qty: 30000, unit_price: 3.80, amount: 114000, variance_note: null },
    { id: 2, settlement_id: 1, po_id: 4, asn_id: null, item_name: 'Frozen spring rolls', received_qty: 20000, unit_price: 1.05, amount: 21000, variance_note: null },
    { id: 3, settlement_id: 1, po_id: null, asn_id: null, item_name: 'Previous month adjustment', received_qty: null, unit_price: null, amount: 49260, variance_note: 'Credit note applied' },
    { id: 4, settlement_id: 2, po_id: 2, asn_id: 2, item_name: 'Prepared lunch boxes', received_qty: 3500, unit_price: 22.40, amount: 78400, variance_note: 'Shortage 500 pcs, dispute 5000 CNY' },
    { id: 5, settlement_id: 2, po_id: 6, asn_id: null, item_name: 'Rice (premium grade)', received_qty: 800, unit_price: 18.40, amount: 14720, variance_note: null },
    { id: 6, settlement_id: 2, po_id: null, asn_id: null, item_name: 'Previous month adjustment', received_qty: null, unit_price: null, amount: 18880, variance_note: null },
    { id: 7, settlement_id: 3, po_id: 1, asn_id: 1, item_name: 'Rice (premium grade)', received_qty: 2000, unit_price: 18.50, amount: 37000, variance_note: null },
    { id: 8, settlement_id: 3, po_id: 1, asn_id: 1, item_name: 'Cooking oil (soybean)', received_qty: 1000, unit_price: 46.25, amount: 46250, variance_note: null },
    { id: 9, settlement_id: 3, po_id: 5, asn_id: null, item_name: 'Vegetables (mixed)', received_qty: 1500, unit_price: 44.80, amount: 67200, variance_note: null },
    { id: 10, settlement_id: 5, po_id: 6, asn_id: null, item_name: 'Rice (premium grade)', received_qty: 800, unit_price: 18.40, amount: 14720, variance_note: 'Partial confirmation' },
    { id: 11, settlement_id: 5, po_id: null, asn_id: null, item_name: 'Other items', received_qty: null, unit_price: null, amount: 74280, variance_note: null },
    { id: 12, settlement_id: 6, po_id: 5, asn_id: 3, item_name: 'Vegetables (mixed)', received_qty: 1500, unit_price: 44.80, amount: 67200, variance_note: null },
  ];
  settlementLines.forEach(l => db.rawRun(
    `INSERT INTO settlement_lines (id, settlement_id, po_id, asn_id, item_name, received_qty, unit_price, amount, variance_note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [l.id, l.settlement_id, l.po_id, l.asn_id, l.item_name, l.received_qty, l.unit_price, l.amount, l.variance_note]
  ));

  // ========== 17. Invoices ==========
  const invoices = [
    { id: 1, settlement_id: 3, invoice_no: 'INV-2026-001', invoice_date: '2026-05-28', amount: 98500, tax_amount: 5537.74, tax_rate: 0.06, currency: 'CNY', ocr_status: 'passed', verification_status: 'verified', status: 'Approved', attachment: 'invoice_001.pdf', rejection_reason: null, submitted_at: '2026-05-28T10:00:00Z', approved_at: '2026-05-28T16:00:00Z' },
    { id: 2, settlement_id: 4, invoice_no: 'INV-2026-002', invoice_date: '2026-05-27', amount: 45600, tax_amount: 2566.04, tax_rate: 0.06, currency: 'CNY', ocr_status: 'exception', verification_status: 'failed', status: 'Returned', attachment: 'invoice_002.pdf', rejection_reason: 'Tax number mismatch with system record', submitted_at: '2026-05-27T11:00:00Z', approved_at: null },
    { id: 3, settlement_id: 1, invoice_no: 'INV-2026-003', invoice_date: '2026-05-29', amount: 184260, tax_amount: 10373.21, tax_rate: 0.06, currency: 'CNY', ocr_status: 'passed', verification_status: 'verified', status: 'Approved', attachment: 'invoice_003.pdf', rejection_reason: null, submitted_at: '2026-05-29T09:00:00Z', approved_at: '2026-05-29T14:00:00Z' },
  ];
  invoices.forEach(i => db.rawRun(
    `INSERT INTO invoices (id, settlement_id, invoice_no, invoice_date, amount, tax_amount, tax_rate, currency, ocr_status, verification_status, status, attachment, rejection_reason, submitted_at, approved_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [i.id, i.settlement_id, i.invoice_no, i.invoice_date, i.amount, i.tax_amount, i.tax_rate, i.currency, i.ocr_status, i.verification_status, i.status, i.attachment, i.rejection_reason, i.submitted_at, i.approved_at]
  ));

  // ========== 18. Approval Requests ==========
  const approvals = [
    { id: 1, object_type: 'rfq', object_id: 4, status: 'pending', current_step: 1, submitted_by: 1, submitted_at: '2026-05-28T10:00:00Z', completed_at: null },
    { id: 2, object_type: 'rfq', object_id: 5, status: 'returned', current_step: 1, submitted_by: 1, submitted_at: '2026-05-28T08:00:00Z', completed_at: '2026-05-28T12:00:00Z' },
    { id: 3, object_type: 'onboarding', object_id: 5, status: 'pending', current_step: 1, submitted_by: 5, submitted_at: '2026-05-20T10:00:00Z', completed_at: null },
    { id: 4, object_type: 'invoice', object_id: 2, status: 'returned', current_step: 1, submitted_by: 5, submitted_at: '2026-05-27T11:00:00Z', completed_at: '2026-05-27T15:00:00Z' },
  ];
  approvals.forEach(a => db.rawRun(
    `INSERT INTO approval_requests (id, object_type, object_id, status, current_step, submitted_by, submitted_at, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [a.id, a.object_type, a.object_id, a.status, a.current_step, a.submitted_by, a.submitted_at, a.completed_at]
  ));

  // ========== 19. Approval Actions ==========
  const approvalActions = [
    { id: 1, approval_id: 2, action: 'return', actor_id: 1, comments: 'Please provide delivery capability proof for all items', action_at: '2026-05-28T12:00:00Z' },
    { id: 2, approval_id: 4, action: 'return', actor_id: 1, comments: 'Tax number mismatch with system record, please verify and resubmit', action_at: '2026-05-27T15:00:00Z' },
  ];
  approvalActions.forEach(a => db.rawRun(
    `INSERT INTO approval_actions (id, approval_id, action, actor_id, comments, action_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [a.id, a.approval_id, a.action, a.actor_id, a.comments, a.action_at]
  ));

  // ========== 20. Tasks ==========
  const tasks = [
    { id: 1, assignee_user_id: 2, org_id: 2, object_type: 'rfq', object_id: 3, title: 'Submit quote for RFQ-2606-004: Packaging material', status: 'open', due_at: '2026-06-08T23:59:59Z' },
    { id: 2, assignee_user_id: 3, org_id: 3, object_type: 'rfq', object_id: 3, title: 'Submit quote for RFQ-2606-004: Packaging material', status: 'open', due_at: '2026-06-08T23:59:59Z' },
    { id: 3, assignee_user_id: 4, org_id: 4, object_type: 'rfq', object_id: 3, title: 'Submit quote for RFQ-2606-004: Packaging material', status: 'open', due_at: '2026-06-08T23:59:59Z' },
    { id: 4, assignee_user_id: 1, org_id: 1, object_type: 'rfq', object_id: 2, title: 'Compare quotes for RFQ-2605-021: Kitchen consumables', status: 'open', due_at: '2026-06-03T23:59:59Z' },
    { id: 5, assignee_user_id: 1, org_id: 1, object_type: 'rfq', object_id: 4, title: 'Approve award for RFQ-2606-009: Frozen product replenishment', status: 'open', due_at: '2026-06-10T23:59:59Z' },
    { id: 6, assignee_user_id: 1, org_id: 1, object_type: 'onboarding', object_id: 5, title: 'Review supplier onboarding: GreenBox Packaging', status: 'open', due_at: '2026-06-05T23:59:59Z' },
    { id: 7, assignee_user_id: 5, org_id: 5, object_type: 'po', object_id: 3, title: 'Confirm PO-45001304: Corrugated boxes', status: 'open', due_at: '2026-06-06T23:59:59Z' },
    { id: 8, assignee_user_id: 6, org_id: 6, object_type: 'po', object_id: 7, title: 'Confirm PO-45001335: Logistics service', status: 'open', due_at: '2026-06-10T23:59:59Z' },
    { id: 9, assignee_user_id: 4, org_id: 4, object_type: 'po', object_id: 6, title: 'Confirm PO-45001330: Rice (partial)', status: 'open', due_at: '2026-06-10T23:59:59Z' },
    { id: 10, assignee_user_id: 1, org_id: 1, object_type: 'po', object_id: 2, title: 'Review change request for PO-45001292: Prepared lunch boxes', status: 'open', due_at: '2026-06-05T23:59:59Z' },
    { id: 11, assignee_user_id: 1, org_id: 1, object_type: 'po', object_id: 8, title: 'Review change request for PO-45001340: Bubble wrap', status: 'open', due_at: '2026-06-05T23:59:59Z' },
    { id: 12, assignee_user_id: 1, org_id: 1, object_type: 'asn', object_id: 3, title: 'Review ASN-2605-003: Vegetables from FreshFarm', status: 'open', due_at: '2026-06-10T23:59:59Z' },
    { id: 13, assignee_user_id: 4, org_id: 4, object_type: 'asn', object_id: 2, title: 'Resolve exception for ASN-2605-002: Lunch boxes shortage', status: 'open', due_at: '2026-06-07T23:59:59Z' },
    { id: 14, assignee_user_id: 4, org_id: 4, object_type: 'settlement', object_id: 5, title: 'Confirm settlement STM-2606-010 for June 2026', status: 'open', due_at: '2026-06-05T23:59:59Z' },
    { id: 15, assignee_user_id: 2, org_id: 2, object_type: 'settlement', object_id: 6, title: 'Confirm settlement STM-2606-015 for June 2026', status: 'open', due_at: '2026-06-05T23:59:59Z' },
    { id: 16, assignee_user_id: 1, org_id: 1, object_type: 'settlement', object_id: 2, title: 'Review dispute for STM-2605-151: SuXin Food', status: 'open', due_at: '2026-06-05T23:59:59Z' },
    { id: 17, assignee_user_id: 1, org_id: 1, object_type: 'invoice', object_id: 1, title: 'Approve invoice INV-2026-001: FreshFarm', status: 'open', due_at: '2026-06-02T23:59:59Z' },
    { id: 18, assignee_user_id: 1, org_id: 1, object_type: 'invoice', object_id: 3, title: 'Approve invoice INV-2026-003: Jixiang Wonton', status: 'open', due_at: '2026-06-02T23:59:59Z' },
    { id: 19, assignee_user_id: 5, org_id: 5, object_type: 'invoice', object_id: 2, title: 'Resubmit invoice INV-2026-002: GreenBox (tax number corrected)', status: 'open', due_at: '2026-06-03T23:59:59Z' },
  ];
  tasks.forEach(t => db.rawRun(
    `INSERT INTO tasks (id, assignee_user_id, org_id, object_type, object_id, title, status, due_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [t.id, t.assignee_user_id, t.org_id, t.object_type, t.object_id, t.title, t.status, t.due_at]
  ));

  // ========== 21. Notifications ==========
  const notifications = [
    { id: 1, user_id: 1, title: 'RFQ deadline approaching', message: 'RFQ-2605-018 closes in 3 days.', object_type: 'rfq', object_id: 1, is_read: 0 },
    { id: 2, user_id: 1, title: 'Contract expiry alert', message: 'CTR-2025-117 expires in 33 days.', object_type: 'contract', object_id: 4, is_read: 0 },
    { id: 3, user_id: 1, title: 'Integration queue', message: '7 queued messages are waiting for retry.', object_type: 'system', object_id: null, is_read: 0 },
    { id: 4, user_id: 1, title: 'Settlement confirmed', message: 'STM-2605-144 has been confirmed by supplier.', object_type: 'settlement', object_id: 1, is_read: 1 },
    { id: 5, user_id: 2, title: 'New RFQ invitation', message: 'You are invited to RFQ-2606-004: Packaging material', object_type: 'rfq', object_id: 3, is_read: 0 },
    { id: 6, user_id: 2, title: 'PO received', message: 'PO-45001325 is waiting for confirmation.', object_type: 'po', object_id: 5, is_read: 0 },
    { id: 7, user_id: 3, title: 'New RFQ invitation', message: 'You are invited to RFQ-2606-004: Packaging material', object_type: 'rfq', object_id: 3, is_read: 0 },
    { id: 8, user_id: 3, title: 'Award approved', message: 'Congratulations! You have been awarded RFQ-2606-009.', object_type: 'rfq', object_id: 4, is_read: 0 },
    { id: 9, user_id: 4, title: 'New RFQ invitation', message: 'You are invited to RFQ-2606-004: Packaging material', object_type: 'rfq', object_id: 3, is_read: 0 },
    { id: 10, user_id: 4, title: 'ASN exception reported', message: 'ASN-2605-002 has been marked with exception: quantity_diff.', object_type: 'asn', object_id: 2, is_read: 0 },
    { id: 11, user_id: 5, title: 'Invoice returned', message: 'Invoice INV-2026-002 has been returned: Tax number mismatch.', object_type: 'invoice', object_id: 2, is_read: 0 },
    { id: 12, user_id: 5, title: 'Settlement published', message: 'STM-2605-165 has been published for your confirmation.', object_type: 'settlement', object_id: 4, is_read: 0 },
    { id: 13, user_id: 6, title: 'New RFQ invitation', message: 'You are invited to RFQ-2606-004: Packaging material', object_type: 'rfq', object_id: 3, is_read: 0 },
    { id: 14, user_id: 6, title: 'PO received', message: 'PO-45001335 is waiting for confirmation.', object_type: 'po', object_id: 7, is_read: 0 },
  ];
  notifications.forEach(n => db.rawRun(
    `INSERT INTO notifications (id, user_id, title, message, object_type, object_id, is_read) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [n.id, n.user_id, n.title, n.message, n.object_type, n.object_id, n.is_read]
  ));

  // ========== 22. Audit Logs ==========
  const auditLogs = [
    { id: 1, actor_id: 1, object_type: 'rfq', object_id: 1, action: 'created', before_json: '{}', after_json: '{"status":"Draft"}', comments: 'RFQ-2605-018 created' },
    { id: 2, actor_id: 1, object_type: 'rfq', object_id: 1, action: 'published', before_json: '{"status":"Draft"}', after_json: '{"status":"Published"}', comments: 'Published to 3 suppliers' },
    { id: 3, actor_id: 4, object_type: 'quote', object_id: 3, action: 'submitted', before_json: '{"status":"Draft"}', after_json: '{"status":"Submitted","total_amount":184260}', comments: 'Quote submitted for RFQ-2605-018' },
    { id: 4, actor_id: 1, object_type: 'rfq', object_id: 1, action: 'award_approved', before_json: '{"status":"Award Pending"}', after_json: '{"status":"Award Approved","award_supplier_id":4}', comments: 'Award approved for SuXin Food' },
    { id: 5, actor_id: 5, object_type: 'onboarding', object_id: 5, action: 'submitted', before_json: '{"status":"Draft"}', after_json: '{"status":"Submitted"}', comments: 'GreenBox onboarding submitted' },
    { id: 6, actor_id: 1, object_type: 'po', object_id: 2, action: 'change_requested', before_json: '{"status":"Confirmed"}', after_json: '{"status":"Change Requested"}', comments: 'Supplier requested delivery date change' },
    { id: 7, actor_id: 4, object_type: 'asn', object_id: 2, action: 'submitted', before_json: '{"status":"Draft"}', after_json: '{"status":"Submitted"}', comments: 'ASN-2605-002 submitted' },
    { id: 8, actor_id: 1, object_type: 'asn', object_id: 2, action: 'exception_reported', before_json: '{"status":"Submitted"}', after_json: '{"status":"Exception","exception_type":"quantity_diff"}', comments: 'Quantity difference: 500 pcs shortage' },
    { id: 9, actor_id: 4, object_type: 'settlement', object_id: 2, action: 'disputed', before_json: '{"status":"Published"}', after_json: '{"status":"Disputed","dispute_amount":5000}', comments: 'Dispute: PO-45001292 qty mismatch' },
    { id: 10, actor_id: 5, object_type: 'invoice', object_id: 2, action: 'submitted', before_json: '{"status":"Draft"}', after_json: '{"status":"Submitted"}', comments: 'Invoice INV-2026-002 submitted' },
    { id: 11, actor_id: 1, object_type: 'invoice', object_id: 2, action: 'returned', before_json: '{"status":"Under Review"}', after_json: '{"status":"Returned"}', comments: 'Tax number mismatch' },
  ];
  auditLogs.forEach(l => db.rawRun(
    `INSERT INTO audit_logs (id, actor_id, object_type, object_id, action, before_json, after_json, comments) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [l.id, l.actor_id, l.object_type, l.object_id, l.action, l.before_json, l.after_json, l.comments]
  ));

  // ========== 23. System Configs ==========
  const configs = [
    { id: 1, key: 'd365_sync_enabled', value_json: '{"value":"true"}', category: 'integration' },
    { id: 2, key: 'auto_approve_threshold', value_json: '{"value":"50000"}', category: 'workflow' },
    { id: 3, key: 'settlement_cycle', value_json: '{"value":"monthly"}', category: 'workflow' },
    { id: 4, key: 'rfq_default_deadline_days', value_json: '{"value":"7"}', category: 'sourcing' },
    { id: 5, key: 'portal_announcement', value_json: '{"value":"Welcome to Aden SRM Portal"}', category: 'portal' },
    { id: 6, key: 'ocr_simulate_mode', value_json: '{"value":"random"}', category: 'integration' },
    { id: 7, key: 'approval_required_rfq', value_json: '{"value":"true"}', category: 'workflow' },
    { id: 8, key: 'approval_required_po_change', value_json: '{"value":"true"}', category: 'workflow' },
    { id: 9, key: 'approval_required_invoice', value_json: '{"value":"true"}', category: 'workflow' },
  ];
  configs.forEach(c => db.rawRun(
    `INSERT INTO system_configs (id, key, value_json, category) VALUES (?, ?, ?, ?)`,
    [c.id, c.key, c.value_json, c.category]
  ));

  // ========== 24. Contracts (v2.0) ==========
  const contracts = [
    { id: 1, contract_no: 'CTR-2605-001', supplier_org_id: 4, rfq_id: 1, title: 'Ambient Food Ingredients Supply Contract', start_date: '2026-06-01', end_date: '2027-06-01', total_amount: 184260, currency: 'CNY', status: 'signed', terms: 'Payment: Net 30 days. Delivery: FOB Shanghai. Quality: ISO 22000. Minimum order: 100 kg.', rejection_reason: null, signed_at: '2026-05-29T14:00:00Z', signed_by_buyer: 1, signed_by_supplier: 4, created_by: 1 },
    { id: 2, contract_no: 'CTR-2605-002', supplier_org_id: 2, rfq_id: null, title: 'Fresh Produce Supply Contract', start_date: '2026-06-02', end_date: '2027-06-02', total_amount: 98500, currency: 'CNY', status: 'approved', terms: 'Payment: Net 30 days. Delivery: Cold chain maintained 0-4C.', rejection_reason: null, signed_at: null, signed_by_buyer: null, signed_by_supplier: null, created_by: 1 },
    { id: 3, contract_no: 'CTR-2605-003', supplier_org_id: 3, rfq_id: 4, title: 'Frozen Products Supply Contract', start_date: '2026-06-03', end_date: '2027-06-03', total_amount: 221500, currency: 'CNY', status: 'under_review', terms: 'Payment: Net 45 days. Delivery: -18C storage required.', rejection_reason: null, signed_at: null, signed_by_buyer: null, signed_by_supplier: null, created_by: 1 },
    { id: 4, contract_no: 'CTR-2605-004', supplier_org_id: 5, rfq_id: null, title: 'Packaging Materials Contract', start_date: null, end_date: null, total_amount: 45600, currency: 'CNY', status: 'draft', terms: 'Payment: Net 30 days. Minimum order: 1000 pcs.', rejection_reason: null, signed_at: null, signed_by_buyer: null, signed_by_supplier: null, created_by: 1 },
  ];
  contracts.forEach(c => db.rawRun(
    `INSERT INTO contracts (id, contract_no, supplier_org_id, rfq_id, title, start_date, end_date, total_amount, currency, status, terms, rejection_reason, signed_at, signed_by_buyer, signed_by_supplier, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [c.id, c.contract_no, c.supplier_org_id, c.rfq_id, c.title, c.start_date, c.end_date, c.total_amount, c.currency, c.status, c.terms, c.rejection_reason, c.signed_at, c.signed_by_buyer, c.signed_by_supplier, c.created_by]
  ));

  // ========== 25. Settlement Dispute Logs (v2.0) ==========
  const disputeLogs = [
    { id: 1, settlement_id: 2, sender_id: 4, sender_role: 'supplier', message: 'PO-45001292 actual received 3500 pcs vs settlement qty 4000 pcs. Disputing ¥5,000.', created_at: '2026-05-26T10:00:00Z' },
    { id: 2, settlement_id: 2, sender_id: 1, sender_role: 'buyer', message: 'We have reviewed the GRN record. Confirming 3500 pcs received. Accepting dispute amount of ¥5,000.', created_at: '2026-05-27T14:00:00Z' },
    { id: 3, settlement_id: 2, sender_id: 4, sender_role: 'supplier', message: 'Thank you for the confirmation. We accept the adjusted settlement amount.', created_at: '2026-05-27T16:00:00Z' },
  ];
  disputeLogs.forEach(d => db.rawRun(
    `INSERT INTO settlement_dispute_logs (id, settlement_id, sender_id, sender_role, message, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [d.id, d.settlement_id, d.sender_id, d.sender_role, d.message, d.created_at]
  ));

  // ========== 26. v2.0 Tasks ==========
  const v2Tasks = [
    { id: 20, assignee_user_id: 1, org_id: 1, object_type: 'contract', object_id: 3, title: 'Review contract draft: CTR-2605-003 (Frozen Products)', status: 'open', due_at: '2026-06-05T23:59:59Z' },
    { id: 21, assignee_user_id: 4, org_id: 4, object_type: 'settlement', object_id: 2, title: 'Review adjusted settlement STM-2605-151 after dispute resolution', status: 'open', due_at: '2026-06-03T23:59:59Z' },
  ];
  v2Tasks.forEach(t => db.rawRun(
    `INSERT INTO tasks (id, assignee_user_id, org_id, object_type, object_id, title, status, due_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [t.id, t.assignee_user_id, t.org_id, t.object_type, t.object_id, t.title, t.status, t.due_at]
  ));

  console.log('Database seeded with comprehensive demo data (v2.0)');
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
  console.log('Contracts (v2.0):', db.findAll('contracts').length);
  console.log('Dispute Logs (v2.0):', db.findAll('settlement_dispute_logs').length);
}

module.exports = { seed, DEMO_PASSWORD };
