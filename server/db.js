// Pure JavaScript in-memory database for demo purposes
// Data resets on server restart (suitable for Vercel serverless)

class InMemoryDB {
  constructor() {
    this.tables = {};
    this.sequences = {};
  }

  _ensureTable(name, schema) {
    if (!this.tables[name]) {
      this.tables[name] = [];
      this.sequences[name] = 1;
    }
  }

  _nextId(table) {
    return this.sequences[table]++;
  }

  insert(table, row) {
    this._ensureTable(table);
    const id = this._nextId(table);
    const record = { id, ...row, created_at: new Date().toISOString() };
    this.tables[table].push(record);
    return record;
  }

  findAll(table, filter = {}) {
    this._ensureTable(table);
    let results = [...this.tables[table]];
    for (const [key, value] of Object.entries(filter)) {
      results = results.filter(r => r[key] === value);
    }
    return results.sort((a, b) => b.id - a.id);
  }

  findOne(table, filter = {}) {
    return this.findAll(table, filter)[0] || null;
  }

  findById(table, id) {
    this._ensureTable(table);
    return this.tables[table].find(r => r.id === id) || null;
  }

  update(table, id, updates) {
    this._ensureTable(table);
    const idx = this.tables[table].findIndex(r => r.id === id);
    if (idx === -1) return null;
    this.tables[table][idx] = { ...this.tables[table][idx], ...updates, updated_at: new Date().toISOString() };
    return this.tables[table][idx];
  }

  delete(table, id) {
    this._ensureTable(table);
    const idx = this.tables[table].findIndex(r => r.id === id);
    if (idx === -1) return false;
    this.tables[table].splice(idx, 1);
    return true;
  }

  query(table, predicate) {
    this._ensureTable(table);
    return this.tables[table].filter(predicate).sort((a, b) => b.id - a.id);
  }

  reset() {
    this.tables = {};
    this.sequences = {};
  }

  count(table, filter = {}) {
    return this.findAll(table, filter).length;
  }
}

const db = new InMemoryDB();
module.exports = db;
