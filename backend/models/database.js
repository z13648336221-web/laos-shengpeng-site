const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../database/data.json');

let data = {
  inquiries: [],
  shipments: [],
  tracking_events: [],
  news: [],
  services: [],
  orders: [],
  customers: [],
  customer_contacts: [],
  quotes: [],
  admins: [],
  sessions: [],
  chats: [],
  roles: [],
  logs: []
};

let nextIds = {
  inquiries: 1,
  shipments: 1,
  tracking_events: 1,
  news: 1,
  services: 1,
  orders: 1,
  customers: 1,
  customer_contacts: 1,
  quotes: 1,
  admins: 1,
  sessions: 1,
  chats: 1,
  roles: 1,
  logs: 1
};

const init = () => {
  return new Promise((resolve) => {
    if (fs.existsSync(dbPath)) {
      try {
        const content = fs.readFileSync(dbPath, 'utf8');
        const saved = JSON.parse(content);
        data = saved.data || data;
        nextIds = saved.nextIds || nextIds;
      } catch (err) {
        console.error('数据库文件损坏，使用新数据:', err);
      }
    }
    resolve();
  });
};

const save = () => {
  try {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dbPath, JSON.stringify({ data, nextIds }, null, 2));
  } catch (err) {
    console.error('保存数据库失败:', err);
  }
};

const query = (table) => {
  return Promise.resolve(data[table] || []);
};

const insert = (table, row) => {
  const id = nextIds[table]++;
  const newRow = { id, ...row, created_at: new Date().toISOString() };
  
  if (!data[table]) data[table] = [];
  data[table].push(newRow);
  save();
  
  return Promise.resolve({ lastID: id, changes: 1 });
};

const update = (table, conditions, updates) => {
  let changes = 0;
  const rows = data[table] || [];
  
  rows.forEach(row => {
    let match = true;
    for (const [key, value] of Object.entries(conditions)) {
      if (row[key] != value) {
        match = false;
        break;
      }
    }
    if (match) {
      Object.assign(row, updates);
      changes++;
    }
  });
  
  if (changes > 0) {
    save();
  }
  
  return Promise.resolve({ changes });
};

const deleteRow = (table, conditions) => {
  const originalLength = (data[table] || []).length;
  data[table] = (data[table] || []).filter(row => {
    for (const [key, value] of Object.entries(conditions)) {
      if (String(row[key]) === String(value)) return false;
    }
    return true;
  });
  
  const changes = originalLength - (data[table] || []).length;
  
  if (changes > 0) {
    save();
  }
  
  return Promise.resolve({ changes });
};

const get = (table, conditions) => {
  const result = (data[table] || []).find(row => {
    for (const [key, value] of Object.entries(conditions)) {
      if (row[key] != value) return false;
    }
    return true;
  });
  return Promise.resolve(result || null);
};

const run = (sql, params = []) => {
  return new Promise((resolve) => {
    const upperSql = sql.toUpperCase().trim();
    
    if (upperSql.startsWith('INSERT INTO')) {
      const tableMatch = sql.match(/INSERT\s+INTO\s+(\w+)/i);
      const insertMatch = sql.match(/INSERT\s+INTO\s+\w+\s*\(([^)]+)\)/i);
      
      if (tableMatch && insertMatch) {
        const table = tableMatch[1];
        const columns = insertMatch[1].split(',').map(c => c.trim());
        const row = {};
        
        columns.forEach((col, index) => {
          row[col] = params[index];
        });
        
        const id = nextIds[table]++;
        const newRow = { id, ...row, created_at: new Date().toISOString() };
        
        if (!data[table]) data[table] = [];
        data[table].push(newRow);
        save();
        
        resolve({ lastID: id, changes: 1 });
        return;
      }
    }
    
    if (upperSql.startsWith('UPDATE')) {
      const tableMatch = sql.match(/UPDATE\s+(\w+)/i);
      const setMatch = sql.match(/SET\s+([^WHERE]+)/i);
      const whereMatch = sql.match(/WHERE\s+(\w+)\s*=\s*\?/i);
      
      if (tableMatch && setMatch && whereMatch) {
        const table = tableMatch[1];
        const column = whereMatch[1];
        const whereValue = params[params.length - 1];
        
        const setClause = setMatch[1].trim();
        const setPairs = setClause.split(',').map(p => p.trim());
        
        let changes = 0;
        const rows = data[table] || [];
        
        rows.forEach(row => {
          if (String(row[column]) === String(whereValue)) {
            let paramIndex = 0;
            setPairs.forEach(pair => {
              const [colName] = pair.split('=').map(s => s.trim());
              if (colName && colName !== '?') {
                row[colName] = params[paramIndex++];
              }
            });
            changes++;
          }
        });
        
        if (changes > 0) {
          save();
        }
        
        resolve({ changes });
        return;
      }
    }
    
    if (upperSql.startsWith('DELETE FROM')) {
      const tableMatch = sql.match(/DELETE\s+FROM\s+(\w+)/i);
      const whereMatch = sql.match(/WHERE\s+(\w+)\s*=\s*\?/i);
      
      if (tableMatch && whereMatch) {
        const table = tableMatch[1];
        const column = whereMatch[1];
        const value = params[0];
        
        const originalLength = (data[table] || []).length;
        data[table] = (data[table] || []).filter(row => String(row[column]) !== String(value));
        
        const changes = originalLength - (data[table] || []).length;
        
        if (changes > 0) {
          save();
        }
        
        resolve({ changes });
        return;
      }
    }
    
    resolve({ lastID: 0, changes: 0 });
  });
};

module.exports = {
  init,
  query,
  get,
  run,
  insert,
  update,
  deleteRow
};