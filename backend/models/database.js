/**
 * SQLite 数据库封装
 * 提供统一的数据库操作接口
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// 优先使用 DB_PATH 环境变量（多环境/测试场景），默认为项目内数据库
const dbPath = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, '../database/shengpeng.db');
const backupDir = path.join(__dirname, '../database/backups');

// 确保备份目录存在
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

let db = null;

/**
 * 幂等表结构迁移：为已存在的旧库补充新增列（新库由 schema.sql 直接建齐）
 */
function migrateSchema() {
  const migrations = [
    {
      table: 'inquiries',
      columns: [
        { name: 'cargo_type', ddl: "ALTER TABLE inquiries ADD COLUMN cargo_type TEXT DEFAULT ''" },
        { name: 'load_type', ddl: "ALTER TABLE inquiries ADD COLUMN load_type TEXT DEFAULT ''" },
        { name: 'ship_date', ddl: "ALTER TABLE inquiries ADD COLUMN ship_date TEXT DEFAULT ''" }
      ]
    }
  ];

  for (const m of migrations) {
    const existing = db.prepare(`PRAGMA table_info(${m.table})`).all().map(c => c.name);
    if (existing.length === 0) continue; // 表不存在（新库由 schema.sql 创建）
    for (const col of m.columns) {
      if (!existing.includes(col.name)) {
        db.prepare(col.ddl).run();
        console.log(`✓ 迁移: ${m.table} 表新增列 ${col.name}`);
      }
    }
  }
}

/**
 * 初始化数据库连接
 */
function init() {
  return new Promise((resolve, reject) => {
    try {
      // 检查数据库文件是否存在
      if (!fs.existsSync(dbPath)) {
        console.error('数据库文件不存在，请先运行: npm run init-sqlite');
        reject(new Error('Database file not found'));
        return;
      }

      // 创建数据库连接
      db = new Database(dbPath, { 
        verbose: process.env.NODE_ENV === 'development' ? console.log : null 
      });
      
      // 启用外键约束
      db.pragma('foreign_keys = ON');

      // 启用 WAL 模式以提高并发性能
      db.pragma('journal_mode = WAL');

      // 幂等表结构迁移
      migrateSchema();

      console.log('✓ SQLite 数据库连接成功:', dbPath);
      resolve();
    } catch (error) {
      console.error('✗ 数据库连接失败:', error.message);
      reject(error);
    }
  });
}

/**
 * 判断字符串是否为裸表名（无空白字符），用于兼容 db.query('table') 调用
 */
function isTableName(str) {
  return typeof str === 'string' && !/\s/.test(str.trim());
}

// 标识符（表名/列名）白名单校验：所有进入 SQL 拼接的标识符必须匹配，
// 防止未来某个调用方把用户输入传入对象 key / orderBy 时变成 SQL 注入
const IDENTIFIER_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

function assertIdentifier(name, label = 'identifier') {
  if (typeof name !== 'string' || !IDENTIFIER_RE.test(name)) {
    throw new Error(`Illegal SQL ${label}: ${String(name)}`);
  }
  return name;
}

function assertColumns(columns) {
  columns.forEach(col => assertIdentifier(col, 'column name'));
  return columns;
}

/**
 * 执行查询并返回所有结果
 * 兼容两种调用方式:
 *   db.query('table')                          -> SELECT * FROM table
 *   db.query('SELECT * FROM t WHERE x = ?', [1]) -> 原生 SQL
 */
function query(sql, params = []) {
  if (!db) {
    throw new Error('Database not initialized');
  }
  
  try {
    // 兼容旧接口: db.query('表名') 直接查询整张表
    if (isTableName(sql)) {
      assertIdentifier(sql, 'table name');
      sql = `SELECT * FROM ${sql}`;
    }
    const stmt = db.prepare(sql);
    return stmt.all(...params);
  } catch (error) {
    console.error('Query error:', error.message);
    throw error;
  }
}

/**
 * 执行查询并返回单个结果
 * 兼容两种调用方式:
 *   db.get('table', { col: val })              -> SELECT * FROM table WHERE col = ? LIMIT 1
 *   db.get('SELECT * FROM t WHERE x = ?', [1]) -> 原生 SQL
 */
function get(sql, params = []) {
  if (!db) {
    throw new Error('Database not initialized');
  }
  
  try {
    // 兼容旧接口: db.get('表名', { 条件对象 })
    if (typeof params === 'object' && !Array.isArray(params) && params !== null) {
      assertIdentifier(sql, 'table name');
      assertColumns(Object.keys(params));
      const whereClause = Object.keys(params).map(col => `${col} = ?`).join(' AND ');
      const values = Object.values(params);
      sql = `SELECT * FROM ${sql} WHERE ${whereClause} LIMIT 1`;
      params = values;
    }
    const stmt = db.prepare(sql);
    return stmt.get(...params);
  } catch (error) {
    console.error('Get error:', error.message);
    throw error;
  }
}

/**
 * 执行 INSERT/UPDATE/DELETE 操作
 */
function run(sql, params = []) {
  if (!db) {
    throw new Error('Database not initialized');
  }
  
  try {
    const stmt = db.prepare(sql);
    const result = stmt.run(...params);
    return {
      lastID: result.lastInsertRowid,
      changes: result.changes
    };
  } catch (error) {
    console.error('Run error:', error.message);
    throw error;
  }
}

/**
 * 插入数据到指定表
 */
function insert(table, data) {
  if (!db) {
    throw new Error('Database not initialized');
  }
  
  try {
    const columns = assertColumns(Object.keys(data));
    const placeholders = columns.map(() => '?').join(', ');
    const values = Object.values(data);

    assertIdentifier(table, 'table name');
    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
    return run(sql, values);
  } catch (error) {
    console.error('Insert error:', error.message);
    throw error;
  }
}

/**
 * 更新数据
 */
function update(table, conditions, updates) {
  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    assertIdentifier(table, 'table name');
    assertColumns(Object.keys(updates));
    assertColumns(Object.keys(conditions));
    const setClause = Object.keys(updates).map(col => `${col} = ?`).join(', ');
    const whereClause = Object.keys(conditions).map(col => `${col} = ?`).join(' AND ');
    const values = [...Object.values(updates), ...Object.values(conditions)];

    const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
    return run(sql, values);
  } catch (error) {
    console.error('Update error:', error.message);
    throw error;
  }
}

/**
 * 删除数据
 */
function deleteRow(table, conditions) {
  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    assertIdentifier(table, 'table name');
    assertColumns(Object.keys(conditions));
    const whereClause = Object.keys(conditions).map(col => `${col} = ?`).join(' AND ');
    const values = Object.values(conditions);

    const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
    return run(sql, values);
  } catch (error) {
    console.error('Delete error:', error.message);
    throw error;
  }
}

/**
 * 根据条件查询单条记录
 */
function find(table, conditions) {
  if (!db) {
    throw new Error('Database not initialized');
  }
  
  try {
    assertIdentifier(table, 'table name');
    assertColumns(Object.keys(conditions));
    const whereClause = Object.keys(conditions).map(col => `${col} = ?`).join(' AND ');
    const values = Object.values(conditions);

    const sql = `SELECT * FROM ${table} WHERE ${whereClause} LIMIT 1`;
    return get(sql, values);
  } catch (error) {
    console.error('Find error:', error.message);
    throw error;
  }
}

/**
 * 根据条件查询多条记录
 */
function findAll(table, conditions = {}, options = {}) {
  if (!db) {
    throw new Error('Database not initialized');
  }
  
  try {
    assertIdentifier(table, 'table name');
    let sql = `SELECT * FROM ${table}`;
    const values = [];

    if (Object.keys(conditions).length > 0) {
      assertColumns(Object.keys(conditions));
      const whereClause = Object.keys(conditions).map(col => `${col} = ?`).join(' AND ');
      sql += ` WHERE ${whereClause}`;
      values.push(...Object.values(conditions));
    }

    if (options.orderBy) {
      assertIdentifier(options.orderBy, 'ORDER BY column');
      sql += ` ORDER BY ${options.orderBy}`;
      if (options.orderDir) {
        const dir = String(options.orderDir).toUpperCase();
        if (dir !== 'ASC' && dir !== 'DESC') {
          throw new Error(`Illegal ORDER BY direction: ${options.orderDir}`);
        }
        sql += ` ${dir}`;
      }
    }

    if (options.limit) {
      const limit = parseInt(options.limit, 10);
      if (Number.isNaN(limit) || limit < 0) throw new Error('Illegal LIMIT');
      sql += ` LIMIT ${limit}`;
    }

    if (options.offset) {
      const offset = parseInt(options.offset, 10);
      if (Number.isNaN(offset) || offset < 0) throw new Error('Illegal OFFSET');
      sql += ` OFFSET ${offset}`;
    }

    return query(sql, values);
  } catch (error) {
    console.error('FindAll error:', error.message);
    throw error;
  }
}

/**
 * 计数查询
 */
function count(table, conditions = {}) {
  if (!db) {
    throw new Error('Database not initialized');
  }
  
  try {
    assertIdentifier(table, 'table name');
    let sql = `SELECT COUNT(*) as count FROM ${table}`;
    const values = [];

    if (Object.keys(conditions).length > 0) {
      assertColumns(Object.keys(conditions));
      const whereClause = Object.keys(conditions).map(col => `${col} = ?`).join(' AND ');
      sql += ` WHERE ${whereClause}`;
      values.push(...Object.values(conditions));
    }
    
    const result = get(sql, values);
    return result ? result.count : 0;
  } catch (error) {
    console.error('Count error:', error.message);
    throw error;
  }
}

/**
 * 执行事务
 */
function transaction(fn) {
  if (!db) {
    throw new Error('Database not initialized');
  }
  
  try {
    // better-sqlite3 的 transaction 是一个函数，需要调用它来创建事务包装器
    const transactionWrapper = db.transaction(fn);
    return transactionWrapper();
  } catch (error) {
    console.error('Transaction error:', error.message);
    throw error;
  }
}

/**
 * 创建数据库备份
 */
async function backup() {
  if (!db) {
    throw new Error('Database not initialized');
  }
  
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `shengpeng-backup-${timestamp}.db`);
    
    // 备份数据库 (better-sqlite3 的 backup 是同步的)
    db.backup(backupPath);
    console.log('✓ 数据库备份创建成功:', backupPath);
    
    return backupPath;
  } catch (error) {
    console.error('Backup error:', error.message);
    throw error;
  }
}

/**
 * 关闭数据库连接
 */
function close() {
  if (db) {
    try {
      db.close();
      db = null;
      console.log('✓ 数据库连接已关闭');
    } catch (error) {
      console.error('关闭数据库连接时出错:', error.message);
    }
  }
}

/**
 * 获取数据库统计信息
 */
function getStats() {
  if (!db) {
    throw new Error('Database not initialized');
  }
  
  try {
    const tables = query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
    const stats = {};
    
    tables.forEach(table => {
      const count = query(`SELECT COUNT(*) as count FROM ${table.name}`)[0].count;
      stats[table.name] = count;
    });
    
    return stats;
  } catch (error) {
    console.error('Get stats error:', error.message);
    throw error;
  }
}

// 兼容旧版接口的别名函数
const queryTable = (table) => query(`SELECT * FROM ${table}`);
const getRow = (table, conditions) => find(table, conditions);

module.exports = {
  init,
  query,
  get,
  run,
  insert,
  update,
  deleteRow,
  delete: deleteRow, // 兼容旧接口的别名
  find,
  findAll,
  count,
  transaction,
  backup,
  close,
  getStats,
  // 兼容旧版
  queryTable,
  getRow
};