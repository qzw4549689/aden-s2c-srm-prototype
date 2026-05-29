// SQLite-backed persistent database using sql.js (WASM, no native compilation)
// Data persists across restarts via single-file storage

const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js/dist/sql-wasm.js');

const DB_FILE = path.join(__dirname, '..', 'data', 'srm.db');
const DB_DIR = path.dirname(DB_FILE);

let SQL = null;
let db = null;
let initialized = false;

// Lazy initialization: wait for SQL.js WASM to load
async function init() {
  if (initialized) return;
  SQL = await initSqlJs();

  // Load existing DB or create new
  if (fs.existsSync(DB_FILE)) {
    const fileBuffer = fs.readFileSync(DB_FILE);
    db = new SQL.Database(fileBuffer);
  } else {
    fs.mkdirSync(DB_DIR, { recursive: true });
    db = new SQL.Database();
    createTables();
  }
  initialized = true;
}

// Persist DB to disk
function persist() {
  if (!db) return;
  const data = db.export();
  fs.mkdirSync(DB_DIR, { recursive: true });
  fs.writeFileSync(DB_FILE, Buffer.from(data));
}

// Create all tables
function createTables() {
  const schema = `
    CREATE TABLE IF NOT EXISTS organizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT, legal_name TEXT, short_name TEXT, tax_no TEXT,
      bank_account TEXT, bank_name TEXT, address TEXT, status TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE, password_hash TEXT, display_name TEXT,
      role TEXT, org_id INTEGER, status TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS supplier_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      org_id INTEGER, category TEXT, qualification_status TEXT,
      score INTEGER, service_area TEXT, contact_name TEXT,
      contact_phone TEXT, contact_email TEXT, business_license_no TEXT,
      tax_certificate_no TEXT, food_safety_cert_no TEXT, bank_name TEXT,
      bank_account TEXT, bank_branch TEXT, submitted_at TEXT,
      approved_at TEXT, rejected_at TEXT, rejection_reason TEXT,
      version INTEGER, created_by INTEGER, updated_by INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS rfqs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rfq_no TEXT, title TEXT, category TEXT, status TEXT,
      description TEXT, currency TEXT, due_at TEXT,
      created_by INTEGER, published_at TEXT,
      award_supplier_id INTEGER, award_amount REAL,
      rejection_reason TEXT, revision_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS rfq_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rfq_id INTEGER, line_no INTEGER, material_description TEXT,
      quantity REAL, unit TEXT, delivery_date TEXT, remarks TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS rfq_invitations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rfq_id INTEGER, supplier_org_id INTEGER, status TEXT,
      invited_at TEXT, responded_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rfq_id INTEGER, supplier_org_id INTEGER, status TEXT,
      total_amount REAL, currency TEXT, lead_time TEXT, moq TEXT,
      validity_days INTEGER, remarks TEXT, submitted_at TEXT, revision_no INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS quote_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quote_id INTEGER, rfq_item_id INTEGER, unit_price REAL,
      amount REAL, remarks TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS purchase_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      po_no TEXT, supplier_org_id INTEGER, status TEXT, site TEXT,
      delivery_date TEXT, total_amount REAL, currency TEXT,
      contract_id INTEGER, created_by INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS po_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      po_id INTEGER, item_name TEXT, qty REAL, uom TEXT,
      unit_price REAL, confirmed_qty REAL, remarks TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS po_confirmations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      po_id INTEGER, supplier_org_id INTEGER, status TEXT,
      proposed_date TEXT, change_type TEXT, change_reason TEXT,
      comments TEXT, submitted_at TEXT, reviewed_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS asns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asn_no TEXT, po_id INTEGER, supplier_org_id INTEGER, status TEXT,
      ship_date TEXT, eta TEXT, carrier TEXT, tracking_no TEXT,
      total_cartons INTEGER, total_pallets INTEGER, remarks TEXT,
      submitted_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS asn_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asn_id INTEGER, po_line_id INTEGER, ship_qty REAL,
      batch_no TEXT, remarks TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS asn_exceptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asn_id INTEGER, exception_type TEXT, description TEXT,
      reported_by INTEGER, reported_at TEXT, status TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS settlements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      settlement_no TEXT, supplier_org_id INTEGER, period TEXT, status TEXT,
      total_amount REAL, dispute_amount REAL, dispute_reason TEXT,
      dispute_attachment TEXT, created_by INTEGER, published_at TEXT, confirmed_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS settlement_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      settlement_id INTEGER, po_id INTEGER, asn_id INTEGER,
      item_name TEXT, received_qty REAL, unit_price REAL,
      amount REAL, variance_note TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      settlement_id INTEGER, invoice_no TEXT, invoice_date TEXT,
      amount REAL, tax_amount REAL, tax_rate REAL, currency TEXT,
      ocr_status TEXT, verification_status TEXT, status TEXT,
      attachment TEXT, rejection_reason TEXT,
      submitted_at TEXT, approved_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS approval_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      object_type TEXT, object_id INTEGER, status TEXT,
      current_step INTEGER, submitted_by INTEGER, submitted_at TEXT, completed_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS approval_actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      approval_id INTEGER, action TEXT, actor_id INTEGER,
      comments TEXT, action_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assignee_user_id INTEGER, org_id INTEGER, object_type TEXT,
      object_id INTEGER, title TEXT, status TEXT, due_at TEXT,
      completed_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER, title TEXT, message TEXT,
      object_type TEXT, object_id INTEGER, is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_id INTEGER, object_type TEXT, object_id INTEGER,
      action TEXT, before_json TEXT, after_json TEXT, comments TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS system_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE, value_json TEXT, category TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contract_no TEXT, supplier_org_id INTEGER, title TEXT,
      status TEXT, start_date TEXT, end_date TEXT, value REAL,
      currency TEXT, terms TEXT, created_by INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `;
  db.run(schema);
}

// Convert SQLite row to JS object
function rowToObject(stmt) {
  const cols = stmt.getColumnNames();
  const result = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    // Convert integer booleans
    if ('is_read' in row) row.is_read = !!row.is_read;
    result.push(row);
  }
  stmt.free();
  return result;
}

// Single row helper
function run(sql, params = []) {
  ensureInit();
  db.run(sql, params);
}

function query(sql, params = []) {
  ensureInit();
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  return rowToObject(stmt);
}

function queryOne(sql, params = []) {
  const results = query(sql, params);
  return results[0] || null;
}

function ensureInit() {
  if (!initialized) {
    throw new Error('Database not initialized. Call db.init() first.');
  }
}

// ==========================================
// Public API (same interface as old InMemoryDB)
// ==========================================

const dbApi = {
  // Initialize (must be called before use)
  init,

  // Check if table has any rows
  async isSeeded() {
    await init();
    const result = query("SELECT COUNT(*) as cnt FROM organizations");
    return result[0].cnt > 0;
  },

  insert(table, row) {
    const keys = Object.keys(row);
    const placeholders = keys.map(() => '?').join(',');
    const sql = `INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`;
    run(sql, keys.map(k => row[k] === undefined ? null : row[k]));
    persist();
    // Get the inserted row using MAX(id) since last_insert_rowid() doesn't work
    // when seeds use explicit IDs
    const lastId = query(`SELECT MAX(id) as id FROM ${table}`)[0].id;
    return this.findById(table, lastId);
  },

  findAll(table, filter = {}) {
    let sql = `SELECT * FROM ${table}`;
    const params = [];
    const conditions = Object.entries(filter).filter(([_, v]) => v !== undefined);
    if (conditions.length > 0) {
      const clauses = conditions.map(([k, _]) => {
        params.push(filter[k]);
        return `${k} = ?`;
      });
      sql += ` WHERE ${clauses.join(' AND ')}`;
    }
    sql += ` ORDER BY id DESC`;
    return query(sql, params);
  },

  findOne(table, filter = {}) {
    return this.findAll(table, filter)[0] || null;
  },

  findById(table, id) {
    return queryOne(`SELECT * FROM ${table} WHERE id = ?`, [id]);
  },

  update(table, id, updates) {
    // Get valid columns for this table
    const validCols = query(`PRAGMA table_info(${table})`).map(col => col.name);
    const keys = Object.keys(updates).filter(k => 
      k !== 'id' && k !== 'created_at' && validCols.includes(k)
    );
    if (keys.length === 0) return this.findById(table, id);
    const setClause = keys.map(k => `${k} = ?`).join(', ');
    const params = keys.map(k => updates[k] === undefined ? null : updates[k]);
    params.push(id);
    // Check if table has updated_at column (some tables don't)
    const hasUpdatedAt = validCols.includes('updated_at');
    if (hasUpdatedAt) {
      run(`UPDATE ${table} SET ${setClause}, updated_at = datetime('now') WHERE id = ?`, params);
    } else {
      run(`UPDATE ${table} SET ${setClause} WHERE id = ?`, params);
    }
    persist();
    return this.findById(table, id);
  },

  delete(table, id) {
    run(`DELETE FROM ${table} WHERE id = ?`, [id]);
    persist();
    return true;
  },

  // Query with custom SQL WHERE clause (callback replaced by SQL string)
  query(table, predicateSql, params = []) {
    const sql = `SELECT * FROM ${table} WHERE ${predicateSql} ORDER BY id DESC`;
    return query(sql, params);
  },

  count(table, filter = {}) {
    return this.findAll(table, filter).length;
  },

  reset() {
    ensureInit();
    // Drop all known tables
    const tables = [
      'organizations', 'users', 'supplier_profiles', 'rfqs', 'rfq_items',
      'rfq_invitations', 'quotes', 'quote_items', 'purchase_orders', 'po_lines',
      'po_confirmations', 'asns', 'asn_lines', 'asn_exceptions',
      'settlements', 'settlement_lines', 'invoices', 'approval_requests',
      'approval_actions', 'tasks', 'notifications', 'audit_logs',
      'system_configs', 'contracts'
    ];
    tables.forEach(t => {
      try { db.run(`DELETE FROM ${t}`); } catch (e) { /* ignore */ }
    });
    // Reset autoincrement counters
    tables.forEach(t => {
      try { db.run(`DELETE FROM sqlite_sequence WHERE name = ?`, [t]); } catch (e) { /* ignore */ }
    });
    persist();
  },

  // Raw SQL for complex queries in routes
  raw(sql, params = []) {
    ensureInit();
    return query(sql, params);
  },

  rawOne(sql, params = []) {
    return queryOne(sql, params);
  },

  rawRun(sql, params = []) {
    run(sql, params);
    persist();
  }
};

module.exports = dbApi;
