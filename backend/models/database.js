/**
 * SQLite 数据库封装
 * 提供统一的数据库操作接口
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../database/shengpeng.db');
const backupDir = path.join(__dirname, '../database/backups');

// 确保备份目录存在
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

let db = null;

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
      
      console.log('✓ SQLite 数据库连接成功');
      resolve();
    } catch (error) {
      console.error('✗ 数据库连接失败:', error.message);
      reject(error);
    }
  });
}

/**
 * 执行查询并返回所有结果
 */
function query(sql, params = []) {
  if (!db) {
    throw new Error('Database not initialized');
  }
  
  try {
    const stmt = db.prepare(sql);
    return stmt.all(...params);
  } catch (error) {
    console.error('Query error:', error.message);
    throw error;
  }
}

/**
 * 执行查询并返回单个结果
 */
function get(sql, params = []) {
  if (!db) {
    throw new Error('Database not initialized');
  }
  
  try {
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
    const columns = Object.keys(data);
    const placeholders = columns.map(() => '?').join(', ');
    const values = Object.values(data);
    
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
    let sql = `SELECT * FROM ${table}`;
    const values = [];
    
    if (Object.keys(conditions).length > 0) {
      const whereClause = Object.keys(conditions).map(col => `${col} = ?`).join(' AND ');
      sql += ` WHERE ${whereClause}`;
      values.push(...Object.values(conditions));
    }
    
    if (options.orderBy) {
      sql += ` ORDER BY ${options.orderBy}`;
      if (options.orderDir) {
        sql += ` ${options.orderDir.toUpperCase()}`;
      }
    }
    
    if (options.limit) {
      sql += ` LIMIT ${options.limit}`;
    }
    
    if (options.offset) {
      sql += ` OFFSET ${options.offset}`;
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
    let sql = `SELECT COUNT(*) as count FROM ${table}`;
    const values = [];
    
    if (Object.keys(conditions).length > 0) {
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