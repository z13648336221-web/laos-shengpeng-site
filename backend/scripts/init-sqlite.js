/**
 * SQLite 数据库初始化脚本
 * 创建数据库结构和默认数据
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../database/shengpeng.db');
const schemaPath = path.join(__dirname, '../database/schema.sql');

console.log('初始化 SQLite 数据库...');
console.log('数据库路径:', dbPath);

// 检查数据库文件是否已存在
if (fs.existsSync(dbPath)) {
  console.log('数据库文件已存在，如需重新初始化请先删除现有数据库文件');
  console.log('删除命令: rm', dbPath);
  process.exit(1);
}

try {
  // 创建数据库连接
  const db = new Database(dbPath);
  
  // 启用外键约束
  db.pragma('foreign_keys = ON');
  
  console.log('✓ 数据库连接成功');
  
  // 读取并执行 schema.sql
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema);
    console.log('✓ 数据库表结构创建成功');
  } else {
    console.error('✗ schema.sql 文件不存在:', schemaPath);
    process.exit(1);
  }
  
  // 插入默认管理员账户 (密码: admin123)
  const bcrypt = require('bcryptjs');
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  
  const insertAdmin = db.prepare(`
    INSERT INTO admins (username, password, name, email, role, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  insertAdmin.run('admin', hashedPassword, '系统管理员', 'admin@hengciglobal.com', 'super_admin', 'active');
  console.log('✓ 默认管理员账户创建成功 (用户名: admin, 密码: admin123)');
  
  // 插入默认服务数据
  const insertService = db.prepare(`
    INSERT INTO services (code, name_zh, name_en, name_vi, description_zh, description_en, description_vi, icon, route, active, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const services = [
    {
      code: 'rail',
      name_zh: '中老铁路陆运',
      name_en: 'China-Laos Railway',
      name_vi: 'Đường sắt Trung-Lào',
      description_zh: '连接中国昆明到老挝万象的国际铁路，全程1035公里',
      description_en: 'International railway connecting Kunming to Vientiane, 1035km total',
      description_vi: 'Đường sắt quốc tế kết nối Côn Minh đến Viêng Chăn, tổng cộng 1035km',
      icon: '🚂',
      route: 'service-rail.html',
      active: 1,
      sort_order: 1
    },
    {
      code: 'thai',
      name_zh: '泰国海运',
      name_en: 'Thailand Sea Freight',
      name_vi: 'Vận tải biển Thái Lan',
      description_zh: '中国主要港口到泰国各港口的海运服务',
      description_en: 'Sea freight services from major Chinese ports to Thai ports',
      description_vi: 'Dịch vụ vận tải biển từ các cảng chính của Trung Quốc đến các cảng Thái Lan',
      icon: '🚢',
      route: 'service-thai.html',
      active: 1,
      sort_order: 2
    },
    {
      code: 'viet',
      name_zh: '越南海运',
      name_en: 'Vietnam Sea Freight',
      name_vi: 'Vận tải biển Việt Nam',
      description_zh: '中国主要港口到越南各港口的海运服务',
      description_en: 'Sea freight services from major Chinese ports to Vietnamese ports',
      description_vi: 'Dịch vụ vận tải biển từ các cảng chính của Trung Quốc đến các cảng Việt Nam',
      icon: '⚓',
      route: 'service-viet.html',
      active: 1,
      sort_order: 3
    }
  ];
  
  services.forEach(service => {
    insertService.run(
      service.code,
      service.name_zh,
      service.name_en,
      service.name_vi,
      service.description_zh,
      service.description_en,
      service.description_vi,
      service.icon,
      service.route,
      service.active,
      service.sort_order
    );
  });
  console.log('✓ 默认服务数据创建成功');
  
  // 插入默认角色数据
  const insertRole = db.prepare(`
    INSERT INTO roles (name, display_name_zh, display_name_en, display_name_vi, permissions, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const roles = [
    {
      name: 'super_admin',
      display_name_zh: '超级管理员',
      display_name_en: 'Super Admin',
      display_name_vi: 'Siêu Quản trị viên',
      permissions: JSON.stringify({ all: true }),
      description: '拥有所有权限'
    },
    {
      name: 'admin',
      display_name_zh: '管理员',
      display_name_en: 'Admin',
      display_name_vi: 'Quản trị viên',
      permissions: JSON.stringify({ 
        manage_inquiries: true,
        manage_orders: true,
        manage_customers: true,
        manage_quotes: true,
        view_reports: true
      }),
      description: '标准管理员权限'
    },
    {
      name: 'editor',
      display_name_zh: '编辑',
      display_name_en: 'Editor',
      display_name_vi: 'Biên tập viên',
      permissions: JSON.stringify({ 
        manage_inquiries: true,
        manage_news: true,
        view_reports: true
      }),
      description: '内容编辑权限'
    },
    {
      name: 'viewer',
      display_name_zh: '查看者',
      display_name_en: 'Viewer',
      display_name_vi: 'Người xem',
      permissions: JSON.stringify({ 
        view_reports: true
      }),
      description: '只读权限'
    }
  ];
  
  roles.forEach(role => {
    insertRole.run(
      role.name,
      role.display_name_zh,
      role.display_name_en,
      role.display_name_vi,
      role.permissions,
      role.description
    );
  });
  console.log('✓ 默认角色数据创建成功');
  
  // 插入示例新闻数据
  const insertNews = db.prepare(`
    INSERT INTO news (title, content, summary, category, image_url, lang, published, view_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const newsItems = [
    {
      title: '中老铁路货运量创历史新高',
      content: '中老铁路开通以来，货运量持续增长，本月创下历史新高...',
      summary: '中老铁路货运量持续增长，本月创下历史新高',
      category: 'company',
      image_url: '',
      lang: 'zh',
      published: 1,
      view_count: 0
    },
    {
      title: 'China-Laos Railway Cargo Volume Reaches Record High',
      content: 'Since the opening of the China-Laos Railway, cargo volume has continued to grow...',
      summary: 'China-Laos Railway cargo volume continues to grow, reaching record high this month',
      category: 'company',
      image_url: '',
      lang: 'en',
      published: 1,
      view_count: 0
    }
  ];
  
  newsItems.forEach(news => {
    insertNews.run(
      news.title,
      news.content,
      news.summary,
      news.category,
      news.image_url,
      news.lang,
      news.published,
      news.view_count
    );
  });
  console.log('✓ 示例新闻数据创建成功');
  
  // 插入示例运单数据
  const insertShipment = db.prepare(`
    INSERT INTO shipments (tracking_number, sender_name, sender_phone, receiver_name, receiver_phone, origin, destination, service_code, status, goods_description, weight, volume, estimated_delivery)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const shipments = [
    {
      tracking_number: 'SP20240001',
      sender_name: '李明',
      sender_phone: '13800138001',
      receiver_name: 'SOUTHAVONG',
      receiver_phone: '+856-20-12345678',
      origin: '昆明',
      destination: '万象',
      service_code: 'rail',
      status: 'delivered',
      goods_description: '电子产品',
      weight: 500,
      volume: 2.5,
      estimated_delivery: '2024-01-15'
    },
    {
      tracking_number: 'SP20240088',
      sender_name: '王芳',
      sender_phone: '13900139002',
      receiver_name: 'SOMCHAI',
      receiver_phone: '+66-8-12345678',
      origin: '深圳',
      destination: '曼谷',
      service_code: 'thai',
      status: 'in_transit',
      goods_description: '纺织品',
      weight: 2000,
      volume: 15,
      estimated_delivery: '2024-02-20'
    },
    {
      tracking_number: 'SP20240156',
      sender_name: '张伟',
      sender_phone: '13700137003',
      receiver_name: 'TRAN VAN A',
      receiver_phone: '+84-91-2345678',
      origin: '广州',
      destination: '海防',
      service_code: 'viet',
      status: 'pending',
      goods_description: '机械设备',
      weight: 3500,
      volume: 20,
      estimated_delivery: '2024-02-25'
    }
  ];
  
  shipments.forEach(shipment => {
    insertShipment.run(
      shipment.tracking_number,
      shipment.sender_name,
      shipment.sender_phone,
      shipment.receiver_name,
      shipment.receiver_phone,
      shipment.origin,
      shipment.destination,
      shipment.service_code,
      shipment.status,
      shipment.goods_description,
      shipment.weight,
      shipment.volume,
      shipment.estimated_delivery
    );
  });
  console.log('✓ 示例运单数据创建成功');
  
  // 插入示例追踪事件
  const insertTrackingEvent = db.prepare(`
    INSERT INTO tracking_events (shipment_id, status, location, description_zh, description_en, description_vi, event_time)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  // 为第一个运单添加追踪事件
  const trackingEvents = [
    {
      shipment_id: 1,
      status: 'picked_up',
      location: '昆明',
      description_zh: '货物已揽收',
      description_en: 'Package picked up',
      description_vi: 'Hàng đã được nhận',
      event_time: '2024-01-10 10:00:00'
    },
    {
      shipment_id: 1,
      status: 'in_transit',
      location: '磨憨',
      description_zh: '货物已发出',
      description_en: 'Package in transit',
      description_vi: 'Hàng đang trên đường',
      event_time: '2024-01-11 15:30:00'
    },
    {
      shipment_id: 1,
      status: 'customs',
      location: '万象',
      description_zh: '清关中',
      description_en: 'Customs clearance',
      description_vi: 'Đang thông quan',
      event_time: '2024-01-13 09:00:00'
    },
    {
      shipment_id: 1,
      status: 'delivered',
      location: '万象',
      description_zh: '已签收',
      description_en: 'Delivered',
      description_vi: 'Đã giao hàng',
      event_time: '2024-01-15 14:00:00'
    }
  ];
  
  trackingEvents.forEach(event => {
    insertTrackingEvent.run(
      event.shipment_id,
      event.status,
      event.location,
      event.description_zh,
      event.description_en,
      event.description_vi,
      event.event_time
    );
  });
  console.log('✓ 示例追踪事件数据创建成功');
  
  // 获取表数量
  const tableCount = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().length;
  
  // 关闭数据库连接
  db.close();
  
  console.log('\n✅ SQLite 数据库初始化完成！');
  console.log('数据库文件:', dbPath);
  console.log('表数量:', tableCount);
  
} catch (error) {
  console.error('✗ 数据库初始化失败:', error.message);
  
  // 如果出错，删除可能已创建的数据库文件
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('已删除不完整的数据库文件');
  }
  
  process.exit(1);
}