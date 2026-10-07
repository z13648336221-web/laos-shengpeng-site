-- SQLite 数据库 Schema
-- 重庆恒慈国际贸易有限公司物流系统
-- 说明：本 schema 与后端路由/前端页面的字段契约对齐（2026-08 迁移）
-- 变更点：chats/news/tracking_events/orders/quotes/services/customer_contacts/roles/logs 列名对齐路由；
--         inquiries.transport_type CHECK 扩展为 6 种运输方式。

-- 启用外键约束
PRAGMA foreign_keys = ON;

-- 聊天记录表（对齐 routes/chat.js：camelCase 列）
CREATE TABLE IF NOT EXISTS chats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visitorId TEXT NOT NULL,
    visitorName TEXT,
    sender TEXT NOT NULL CHECK (sender IN ('visitor', 'admin')),
    adminName TEXT,
    message TEXT NOT NULL,
    isRead INTEGER DEFAULT 0,
    readAt TEXT,
    createdAt TEXT
);

-- 询价记录表（transport_type 支持 6 种运输方式，对齐 Joi 白名单）
CREATE TABLE IF NOT EXISTS inquiries (
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
    cargo_type TEXT DEFAULT '',
    load_type TEXT DEFAULT '',
    ship_date TEXT DEFAULT '',
    contact_email TEXT,
    company_name TEXT,
    remark TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 运单表（保持不变）
CREATE TABLE IF NOT EXISTS shipments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tracking_number TEXT UNIQUE NOT NULL,
    sender_name TEXT NOT NULL,
    sender_phone TEXT NOT NULL,
    receiver_name TEXT NOT NULL,
    receiver_phone TEXT NOT NULL,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    service_code TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'picked_up', 'in_transit', 'departed', 'customs', 'delivered')),
    goods_description TEXT,
    weight REAL DEFAULT 0,
    volume REAL DEFAULT 0,
    estimated_delivery TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 追踪事件表（timestamp 列，对齐 routes/tracking.js）
CREATE TABLE IF NOT EXISTS tracking_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shipment_id INTEGER NOT NULL,
    status TEXT NOT NULL,
    location TEXT,
    description_zh TEXT,
    description_en TEXT,
    description_vi TEXT,
    timestamp TEXT,
    FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE
);

-- 新闻表（多语言字段，对齐 routes/news.js）
CREATE TABLE IF NOT EXISTS news (
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
);

-- 服务表（价格/时效字段，对齐 routes/services.js）
CREATE TABLE IF NOT EXISTS services (
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
);

-- 订单表（tracking_number/时间线字段，对齐 routes/orders.js）
CREATE TABLE IF NOT EXISTS orders (
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
);

-- 客户表（保持不变）
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    company TEXT,
    phone TEXT NOT NULL,
    email TEXT,
    wechat TEXT,
    address TEXT,
    type TEXT DEFAULT 'general' CHECK (type IN ('general', 'enterprise', 'agent', 'VIP')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blacklisted')),
    remarks TEXT,
    contact_count INTEGER DEFAULT 0,
    total_value REAL DEFAULT 0,
    group_name TEXT DEFAULT 'default',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 客户联系记录表（type/content 列，对齐 routes/customers.js）
CREATE TABLE IF NOT EXISTS customer_contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    type TEXT DEFAULT 'phone',
    content TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- 报价表（价格配置字段，对齐 routes/quotes.js）
CREATE TABLE IF NOT EXISTS quotes (
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
);

-- 管理员表（保持不变）
CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT,
    email TEXT,
    phone TEXT,
    role TEXT DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'editor', 'viewer')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    last_login TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 会话表（保持不变）
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT UNIQUE NOT NULL,
    admin_id INTEGER NOT NULL,
    expires_at TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
);

-- 角色表（code 列，对齐 routes/roles.js）
CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    permissions TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 日志表（admin_name/description/ip 列，对齐 routes/logs.js）
CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER,
    admin_name TEXT,
    action TEXT NOT NULL,
    description TEXT,
    ip TEXT,
    details TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL
);

-- 优惠券表（保留备用）
CREATE TABLE IF NOT EXISTS coupons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value REAL NOT NULL,
    min_order_value REAL DEFAULT 0,
    max_discount REAL,
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    valid_from TEXT NOT NULL,
    valid_until TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_chats_visitorId ON chats(visitorId);
CREATE INDEX IF NOT EXISTS idx_chats_createdAt ON chats(createdAt);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_number ON shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_tracking_events_shipment_id ON tracking_events(shipment_id);
CREATE INDEX IF NOT EXISTS idx_news_category ON news(category);
CREATE INDEX IF NOT EXISTS idx_news_created_at ON news(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_tracking_number ON orders(tracking_number);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_customer_contacts_customer_id ON customer_contacts(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_admin_id ON sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_logs_admin_id ON logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_status ON coupons(status);
