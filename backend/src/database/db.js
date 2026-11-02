const fs = require('fs');
const path = require('path');
const config = require('../config');

class LocalDBStore {
  constructor() {
    this.dataDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    this.dataFile = path.join(this.dataDir, 'uba_sentinel_db.json');
    this.tables = {
      profiles: [],
      monitored_users: [],
      activity_events: [],
      detection_rules: [],
      user_baselines: [],
      risk_assessments: [],
      security_alerts: [],
      incidents: [],
      investigation_notes: [],
      audit_chain_records: [],
      model_runs: [],
      model_evaluation_results: [],
      // Employee Virtual Desktop & Applications Tables
      virtual_computers: [],
      desktop_preferences: [],
      applications: [],
      employee_application_permissions: [],
      employee_sessions: [],
      folders: [],
      employee_files: [],
      file_permissions: [],
      documents: [],
      document_versions: [],
      tasks: [],
      task_comments: [],
      employee_emails: [],
      email_recipients: [],
      email_attachments: [],
      chat_conversations: [],
      conversation_members: [],
      chat_messages: [],
      calendar_events: [],
      shared_resources: [],
      access_requests: []
    };
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.dataFile)) {
        const raw = fs.readFileSync(this.dataFile, 'utf8');
        const parsed = JSON.parse(raw);
        this.tables = { ...this.tables, ...parsed };
      }
    } catch (err) {
      console.error('Error loading local DB file, initializing clean tables:', err.message);
    }
  }

  save() {
    try {
      fs.writeFileSync(this.dataFile, JSON.stringify(this.tables, null, 2), 'utf8');
    } catch (err) {
      console.error('Error saving local DB file:', err.message);
    }
  }

  find(tableName, predicate = () => true) {
    if (!this.tables[tableName]) return [];
    return this.tables[tableName].filter(predicate);
  }

  findOne(tableName, predicate) {
    if (!this.tables[tableName]) return null;
    return this.tables[tableName].find(predicate) || null;
  }

  insert(tableName, record) {
    if (!this.tables[tableName]) this.tables[tableName] = [];
    const newRecord = {
      ...record,
      id: record.id || require('crypto').randomUUID(),
      created_at: record.created_at || new Date().toISOString()
    };
    this.tables[tableName].push(newRecord);
    this.save();
    return newRecord;
  }

  update(tableName, predicate, updates) {
    if (!this.tables[tableName]) return 0;
    let count = 0;
    this.tables[tableName] = this.tables[tableName].map(item => {
      if (predicate(item)) {
        count++;
        return { ...item, ...updates, updated_at: new Date().toISOString() };
      }
      return item;
    });
    if (count > 0) this.save();
    return count;
  }

  delete(tableName, predicate) {
    if (!this.tables[tableName]) return 0;
    const initialLen = this.tables[tableName].length;
    this.tables[tableName] = this.tables[tableName].filter(item => !predicate(item));
    const deletedCount = initialLen - this.tables[tableName].length;
    if (deletedCount > 0) this.save();
    return deletedCount;
  }

  count(tableName, predicate = () => true) {
    if (!this.tables[tableName]) return 0;
    return this.tables[tableName].filter(predicate).length;
  }
}

// Database Manager
let dbInstance = null;

if (config.databaseUrl) {
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: config.databaseUrl,
    ssl: { rejectUnauthorized: false }
  });

  dbInstance = {
    isPostgres: true,
    pool,
    query: (text, params) => pool.query(text, params),
    find: async (tableName, predicate) => {
      // In Postgres mode, falls back or runs standard queries
      const res = await pool.query(`SELECT * FROM ${tableName}`);
      return predicate ? res.rows.filter(predicate) : res.rows;
    },
    findOne: async (tableName, predicate) => {
      const res = await pool.query(`SELECT * FROM ${tableName}`);
      return res.rows.find(predicate) || null;
    },
    insert: async (tableName, record) => {
      const keys = Object.keys(record);
      const values = Object.values(record);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      const query = `INSERT INTO ${tableName} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
      const res = await pool.query(query, values);
      return res.rows[0];
    },
    update: async (tableName, predicateOrCol, filterValOrUpdates, maybeUpdates) => {
      if (typeof predicateOrCol === 'function') {
        const predicate = predicateOrCol;
        const updates = filterValOrUpdates;
        const allRes = await pool.query(`SELECT * FROM ${tableName}`);
        const targets = allRes.rows.filter(predicate);
        if (targets.length === 0) return 0;
        let updatedCount = 0;
        const keys = Object.keys(updates);
        const values = Object.values(updates);
        const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
        for (const target of targets) {
          const query = `UPDATE ${tableName} SET ${setClause} WHERE id = $${keys.length + 1}`;
          const res = await pool.query(query, [...values, target.id]);
          updatedCount += res.rowCount;
        }
        return updatedCount;
      } else {
        const filterCol = predicateOrCol;
        const filterVal = filterValOrUpdates;
        const updates = maybeUpdates;
        const keys = Object.keys(updates);
        const values = Object.values(updates);
        const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
        const query = `UPDATE ${tableName} SET ${setClause} WHERE "${filterCol}" = $${keys.length + 1} RETURNING *`;
        const res = await pool.query(query, [...values, filterVal]);
        return res.rowCount;
      }
    },
    delete: async (tableName, predicateOrCol, filterVal) => {
      if (typeof predicateOrCol === 'function') {
        const predicate = predicateOrCol;
        const allRes = await pool.query(`SELECT * FROM ${tableName}`);
        const targets = allRes.rows.filter(predicate);
        if (targets.length === 0) return 0;
        let deletedCount = 0;
        for (const target of targets) {
          const res = await pool.query(`DELETE FROM ${tableName} WHERE id = $1`, [target.id]);
          deletedCount += res.rowCount;
        }
        return deletedCount;
      } else {
        const res = await pool.query(`DELETE FROM ${tableName} WHERE "${predicateOrCol}" = $1`, [filterVal]);
        return res.rowCount;
      }
    },
    count: async (tableName) => {
      const res = await pool.query(`SELECT COUNT(*) FROM ${tableName}`);
      return parseInt(res.rows[0].count, 10);
    }
  };
  console.log('✅ Connected to external PostgreSQL / Supabase Database');
} else {
  const localStore = new LocalDBStore();
  dbInstance = {
    isPostgres: false,
    store: localStore,
    find: (tableName, predicate) => localStore.find(tableName, predicate),
    findOne: (tableName, predicate) => localStore.findOne(tableName, predicate),
    insert: (tableName, record) => localStore.insert(tableName, record),
    update: (tableName, predicate, updates) => localStore.update(tableName, predicate, updates),
    delete: (tableName, predicate) => localStore.delete(tableName, predicate),
    count: (tableName, predicate) => localStore.count(tableName, predicate)
  };
  console.log('✅ Initialized Local Persistent Database Engine (Turnkey Zero-Config)');
}

module.exports = dbInstance;
