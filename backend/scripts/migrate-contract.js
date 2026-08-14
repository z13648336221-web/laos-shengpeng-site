/**
 * 契约迁移脚本 - 将旧版数据库 schema 迁移到与后端路由/前端契约一致的新 schema
 * 
 * 用法: node scripts/migrate-contract.js [数据库路径，默认 ./database/shengpeng.db]
 * 
 * 迁移内容:
 * - chats:            snake_case(visitor_id/is_read/created_at) -> camelCase(visitorId/isRead/createdAt)
 * - news:             单语言(title/content/summary) -> 多语言(title_zh/content_zh/summary_zh + en/vi)
 * - tracking_events:  event_time -> timestamp
 * - orders:           order_number/transport_type/origin/destination/cargo_description
 *                     -> tracking_number/service_code/origin_city/dest_city/cargo_name + timeline
 * - quotes:           quote_number/price/currency -> name/service_code/base_price/price_unit 等
 * - services:         icon/route/active/sort_order -> base_price/features/image_url/priority 等
 * - customer_contacts: name/position/phone/...     -> customer_id/type/content
 * - roles:            display_name_* -> name/code
 * - logs:             ip_address/user_agent/target_* -> admin_name/description/ip
 * - inquiries:        transport_type CHECK 扩展为 6 种
 * 
 * 执行前自动备份到 database/backups/ 目录，可随时回滚。
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = process.argv[2] ? path.resolve(process.argv[2]) : path.join(__dirname, '../database/shengpeng.db');
const backupDir = path.join(path.dirname(dbPath), 'backups');

if (!fs.existsSync(dbPath)) {
  console.error(`✗ 数据库文件不存在: ${dbPath}`);
  process.exit(1);
}

// 检测当前 schema 是否为旧版（需要迁移）
function detectSchemaVersion(db) {
  const cols = (t) => {
    try {
      return db.prepare(`PRAGMA table_info(${t})`).all().map(c => c.name);
    } catch { return []; }
  };
  const chatCols = cols('chats');
  const newsCols = cols('news');
  if (chatCols.includes('visitorId')) return 'new';       // 已是新 schema
  if (chatCols.includes('visitor_id')) return 'old';      // 旧 schema
  return 'unknown';
}

function main() {
  // 确保备份目录存在
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  const db = new Database(dbPath);
  db.pragma('foreign_keys = OFF');
  db.pragma('journal_mode = WAL');

  const version = detectSchemaVersion(db);
  if (version === 'new') {
    console.log('✓ 数据库已是新版契约 schema，无需迁移');
    db.close();
    return;
  }
  if (version === 'unknown') {
    console.error('✗ 无法识别数据库 schema（chats 表结构异常），请人工检查');
    db.close();
    process.exit(1);
  }

  console.log('检测到旧版 schema，开始迁移...');

  // 1. 备份（WAL 检查点后整文件复制，快照一致且无异步尾部问题）
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `shengpeng-precontract-${ts}.db`);
  db.pragma('wal_checkpoint(TRUNCATE)');
  fs.copyFileSync(dbPath, backupPath);
  console.log('✓ 备份已创建:', backupPath);

  const rebuild = (table, createSql, copySql) => {
    db.exec(`DROP TABLE IF EXISTS ${table}_new`);
    db.exec(createSql);
    db.exec(copySql);
    const oldCount = db.prepare(`SELECT COUNT(*) c FROM ${table}`).get().c;
    const newCount = db.prepare(`SELECT COUNT(*) c FROM ${table}_new`).get().c;
    db.exec(`DROP TABLE ${table}`);
    db.exec(`ALTER TABLE ${table}_new RENAME TO ${table}`);
    console.log(`  ✓ ${table}: ${oldCount} -> ${newCount} 行`);
    if (oldCount !== newCount) {
      throw new Error(`数据行数不一致: ${table} ${oldCount} vs ${newCount}`);
    }
  };

  try {
    // ============ chats: snake_case -> camelCase ============
    rebuild('chats',
      `CREATE TABLE chats_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        visitorId TEXT NOT NULL,
        visitorName TEXT,
        sender TEXT NOT NULL CHECK (sender IN ('visitor', 'admin')),
        adminName TEXT,
        message TEXT NOT NULL,
        isRead INTEGER DEFAULT 0,
        readAt TEXT,
        createdAt TEXT
      )`,
      `INSERT INTO chats_new (id, visitorId, visitorName, sender, adminName, message, isRead, readAt, createdAt)
       SELECT id, visitor_id, visitor_name, sender, admin_name, message, is_read, read_at, created_at FROM chats`
    );

    // ============ news: 单语言 -> 多语言 ============
    rebuild('news',
      `CREATE TABLE news_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title_zh TEXT NOT NULL,
        title_en TEXT DEFAULT '',
        title_vi TEXT DEFAULT '',
        content_zh TEXT NOT NULL,
        content_en TEXT DEFAULT '',
        content_vi TEXT DEFAULT '',
        summary_zh TEXT DEFAULT '',
        summary_en TEXT DEFAULT '',
        summary_vi TEXT DEFAULT '',
        category TEXT DEFAULT 'industry',
        image_url TEXT DEFAULT '',
        video_url TEXT DEFAULT '',
        publish_date TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )`,
      `INSERT INTO news_new (id, title_zh, content_zh, summary_zh, title_en, content_en, summary_en, title_vi, content_vi, summary_vi, category, image_url, video_url, publish_date, created_at, updated_at)
       SELECT id, title, content, summary,
              CASE WHEN lang = 'en' THEN title ELSE '' END,
              CASE WHEN lang = 'en' THEN content ELSE '' END,
              CASE WHEN lang = 'en' THEN summary ELSE '' END,
              CASE WHEN lang = 'vi' THEN title ELSE '' END,
              CASE WHEN lang = 'vi' THEN content ELSE '' END,
              CASE WHEN lang = 'vi' THEN summary ELSE '' END,
              category, image_url, '', created_at, created_at, updated_at
       FROM news`
    );

    // ============ tracking_events: event_time -> timestamp ============
    rebuild('tracking_events',
      `CREATE TABLE tracking_events_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shipment_id INTEGER NOT NULL,
        status TEXT NOT NULL,
        location TEXT,
        description_zh TEXT,
        description_en TEXT,
        description_vi TEXT,
        timestamp TEXT,
        FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE
      )`,
      `INSERT INTO tracking_events_new (id, shipment_id, status, location, description_zh, description_en, description_vi, timestamp)
       SELECT id, shipment_id, status, location, description_zh, description_en, description_vi, event_time FROM tracking_events`
    );

    // ============ orders: order_number -> tracking_number 等 ============
    rebuild('orders',
      `CREATE TABLE orders_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tracking_number TEXT UNIQUE,
        service_code TEXT,
        status TEXT DEFAULT 'pending',
        cargo_name TEXT,
        cargo_type TEXT DEFAULT 'general',
        weight REAL DEFAULT 0,
        volume REAL DEFAULT 0,
        load_type TEXT DEFAULT 'lcl',
        origin_city TEXT,
        dest_city TEXT,
        sender_name TEXT,
        sender_phone TEXT,
        receiver_name TEXT,
        receiver_phone TEXT,
        receiver_address TEXT,
        contact_name TEXT,
        contact_phone TEXT,
        estimated_delivery TEXT,
        actual_delivery TEXT,
        remarks TEXT,
        timeline TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )`,
      `INSERT INTO orders_new (id, tracking_number, service_code, status, cargo_name, cargo_type, weight, volume, load_type, origin_city, dest_city, sender_name, sender_phone, receiver_name, receiver_phone, receiver_address, contact_name, contact_phone, estimated_delivery, actual_delivery, remarks, timeline, created_at, updated_at)
       SELECT id, order_number,
              CASE transport_type WHEN 'rail' THEN 'railway' WHEN 'thai' THEN 'thailand-sea' WHEN 'viet' THEN 'vietnam-sea' ELSE transport_type END,
              CASE WHEN status = 'confirmed' THEN 'picked_up' WHEN status = 'processing' THEN 'in_transit' WHEN status = 'shipped' THEN 'in_transit' ELSE status END,
              COALESCE(cargo_description, ''), 'general', weight, volume, 'lcl', origin, destination,
              NULL, NULL, NULL, NULL, NULL, NULL, NULL, estimated_delivery, actual_delivery, '', '[]', created_at, updated_at
       FROM orders`
    );

    // ============ quotes: quote_number/price -> name/base_price 等 ============
    rebuild('quotes',
      `CREATE TABLE quotes_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        service_code TEXT,
        origin_city TEXT DEFAULT '',
        dest_city TEXT DEFAULT '',
        min_weight REAL,
        max_weight REAL,
        base_price REAL,
        price_unit TEXT DEFAULT 'CBM',
        customs_fee REAL,
        insurance_rate REAL,
        transit_days INTEGER,
        valid_days INTEGER DEFAULT 7,
        status TEXT DEFAULT 'active',
        remarks TEXT DEFAULT '',
        inquiry_id INTEGER,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )`,
      `INSERT INTO quotes_new (id, name, service_code, base_price, price_unit, status, inquiry_id, created_at, updated_at)
       SELECT id, NULL, transport_type, price, currency, status, inquiry_id, created_at, updated_at FROM quotes`
    );

    // ============ services: icon/route/active/sort_order -> 价格/features/priority ============
    rebuild('services',
      `CREATE TABLE services_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name_zh TEXT NOT NULL,
        name_en TEXT DEFAULT '',
        name_vi TEXT DEFAULT '',
        description_zh TEXT,
        description_en TEXT,
        description_vi TEXT,
        base_price REAL,
        min_price REAL,
        max_price REAL,
        customs_fee REAL,
        insurance_rate REAL,
        transit_days INTEGER,
        features TEXT,
        image_url TEXT DEFAULT '',
        priority INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )`,
      `INSERT INTO services_new (id, code, name_zh, name_en, name_vi, description_zh, description_en, description_vi, base_price, min_price, max_price, customs_fee, insurance_rate, transit_days, features, image_url, priority, created_at, updated_at)
       SELECT id, code, name_zh, name_en, name_vi, description_zh, description_en, description_vi,
              NULL, NULL, NULL, NULL, NULL, NULL, '[]', '', sort_order, created_at, updated_at
       FROM services`
    );

    // ============ customer_contacts: name/phone... -> customer_id/type/content ============
    rebuild('customer_contacts',
      `CREATE TABLE customer_contacts_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL,
        type TEXT DEFAULT 'phone',
        content TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
      )`,
      `INSERT INTO customer_contacts_new (id, customer_id, type, content, created_at)
       SELECT id, customer_id, 'phone', COALESCE(NULLIF(phone, ''), name, ''), created_at FROM customer_contacts`
    );

    // ============ roles: display_name_* -> name/code ============
    rebuild('roles',
      `CREATE TABLE roles_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT UNIQUE NOT NULL,
        permissions TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )`,
      `INSERT INTO roles_new (id, name, code, permissions, created_at, updated_at)
       SELECT id, display_name_zh, name, permissions, created_at, updated_at FROM roles`
    );

    // ============ logs: ip_address/target_* -> admin_name/description/ip ============
    rebuild('logs',
      `CREATE TABLE logs_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        admin_id INTEGER,
        admin_name TEXT,
        action TEXT NOT NULL,
        description TEXT,
        ip TEXT,
        details TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL
      )`,
      `INSERT INTO logs_new (id, admin_id, admin_name, action, description, ip, details, created_at)
       SELECT id, admin_id, NULL, action, target_type || ':' || COALESCE(target_id, ''), ip_address, details, created_at FROM logs`
    );

    // ============ inquiries: 重建 CHECK 约束（transport_type 6 种） ============
    rebuild('inquiries',
      `CREATE TABLE inquiries_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transport_type TEXT NOT NULL CHECK (transport_type IN ('rail', 'road', 'thai-rail', 'viet-rail', 'thai', 'viet')),
        origin_city TEXT NOT NULL,
        dest_city TEXT NOT NULL,
        cargo_name TEXT NOT NULL,
        weight REAL NOT NULL CHECK (weight > 0),
        volume REAL DEFAULT 0 CHECK (volume >= 0),
        need_customs TEXT DEFAULT 'no',
        need_insurance TEXT DEFAULT 'no',
        contact_name TEXT NOT NULL,
        contact_phone TEXT NOT NULL,
        contact_email TEXT,
        company_name TEXT,
        remark TEXT,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )`,
      `INSERT INTO inquiries_new (id, transport_type, origin_city, dest_city, cargo_name, weight, volume, need_customs, need_insurance, contact_name, contact_phone, contact_email, company_name, remark, status, created_at, updated_at)
       SELECT id, transport_type, origin_city, dest_city, cargo_name, weight, volume, need_customs, need_insurance, contact_name, contact_phone, contact_email, company_name, remark, status, created_at, updated_at FROM inquiries`
    );

    // 重建索引
    console.log('\n重建索引...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_chats_visitorId ON chats(visitorId)',
      'CREATE INDEX IF NOT EXISTS idx_chats_createdAt ON chats(createdAt)',
      'CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status)',
      'CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_shipments_tracking_number ON shipments(tracking_number)',
      'CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status)',
      'CREATE INDEX IF NOT EXISTS idx_tracking_events_shipment_id ON tracking_events(shipment_id)',
      'CREATE INDEX IF NOT EXISTS idx_news_category ON news(category)',
      'CREATE INDEX IF NOT EXISTS idx_news_created_at ON news(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)',
      'CREATE INDEX IF NOT EXISTS idx_orders_tracking_number ON orders(tracking_number)',
      'CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status)',
      'CREATE INDEX IF NOT EXISTS idx_customer_contacts_customer_id ON customer_contacts(customer_id)',
      'CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status)',
      'CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON sessions(session_id)',
      'CREATE INDEX IF NOT EXISTS idx_sessions_admin_id ON sessions(admin_id)',
      'CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)',
      'CREATE INDEX IF NOT EXISTS idx_logs_admin_id ON logs(admin_id)',
      'CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code)',
      'CREATE INDEX IF NOT EXISTS idx_coupons_status ON coupons(status)'
    ];
    for (const sql of indexes) db.exec(sql);
    console.log('✓ 索引重建完成');

    // 最终校验
    console.log('\n迁移后行数校验:');
    const tables = ['chats', 'news', 'tracking_events', 'orders', 'quotes', 'services', 'customer_contacts', 'roles', 'logs', 'inquiries', 'shipments', 'customers', 'admins', 'sessions'];
    for (const t of tables) {
      const n = db.prepare(`SELECT COUNT(*) c FROM ${t}`).get().c;
      console.log(`  ${t}: ${n} 行`);
    }

    db.pragma('foreign_keys = ON');
    db.close();
    console.log('\n✅ 迁移完成！备份位于:', backupPath);
    console.log('   回滚命令: node -e "require(\'fs\').copyFileSync(process.argv[1], process.argv[2])"', backupPath, dbPath);
  } catch (err) {
    console.error('✗ 迁移失败:', err.message);
    console.error('  数据库可能处于中间状态，请使用备份恢复:', backupPath);
    db.close();
    process.exit(1);
  }
}

main();
