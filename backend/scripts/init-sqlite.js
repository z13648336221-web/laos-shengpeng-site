/**
 * SQLite 数据库初始化脚本
 * 创建数据库结构和默认数据
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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
  
  // 插入默认管理员账户（密码来自 ADMIN_INITIAL_PASSWORD 或随机生成，不再硬编码 [REDACTED]）
  const bcrypt = require('bcryptjs');
  const initialPassword = process.env.ADMIN_INITIAL_PASSWORD || crypto.randomBytes(12).toString('base64url');
  const hashedPassword = bcrypt.hashSync(initialPassword, 10);
  
  const insertAdmin = db.prepare(`
    INSERT INTO admins (username, password, name, email, role, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  insertAdmin.run('admin', hashedPassword, '系统管理员', 'admin@hengciglobal.com', 'super_admin', 'active');
  console.log(`✓ 默认管理员账户创建成功 (用户名: admin, 初始密码: ${initialPassword}，请立即修改)`);
  
  // 插入默认服务数据
  const insertService = db.prepare(`
    INSERT INTO services (code, name_zh, name_en, name_vi, description_zh, description_en, description_vi, base_price, min_price, max_price, customs_fee, insurance_rate, transit_days, features, image_url, priority)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      base_price: 850,
      min_price: 850,
      max_price: 1200,
      customs_fee: 300,
      insurance_rate: 0.003,
      transit_days: 5,
      features: '["门到门服务", "清关代理", "实时追踪"]',
      image_url: '',
      priority: 1
    },
    {
      code: 'road',
      name_zh: '中老公路运输',
      name_en: 'China-Laos Road Transport',
      name_vi: 'Vận tải đường bộ Trung-Lào',
      description_zh: '中老公路运输提供灵活的门到门服务，多种车型可选',
      description_en: 'China-Laos road transport with flexible door-to-door service',
      description_vi: 'Vận tải đường bộ Trung-Lào, dịch vụ tận nơi linh hoạt',
      base_price: 1200,
      min_price: 1200,
      max_price: 1800,
      customs_fee: 300,
      insurance_rate: 0.003,
      transit_days: 8,
      features: '["门到门服务", "多种车型", "灵活调度"]',
      image_url: '',
      priority: 2
    },
    {
      code: 'thai-rail',
      name_zh: '中老泰铁路联运',
      name_en: 'China-Laos-Thailand Rail',
      name_vi: 'Liên vận đường sắt Trung-Lào-Thái',
      description_zh: '中国经老挝转关到泰国的铁路联运服务，一票直达',
      description_en: 'China-Laos-Thailand railway intermodal service',
      description_vi: 'Dịch vụ liên vận đường sắt qua Lào đến Thái Lan',
      base_price: 1500,
      min_price: 1500,
      max_price: 2000,
      customs_fee: 400,
      insurance_rate: 0.003,
      transit_days: 9,
      features: '["一票直达", "无缝衔接", "清关便捷"]',
      image_url: '',
      priority: 3
    },
    {
      code: 'viet-rail',
      name_zh: '中越铁路',
      name_en: 'China-Vietnam Railway',
      name_vi: 'Đường sắt Trung-Việt',
      description_zh: '连接中国南宁与越南河内的跨境铁路货运服务',
      description_en: 'Cross-border railway freight between Nanning and Hanoi',
      description_vi: 'Vận tải đường sắt xuyên biên giới Nam Ninh - Hà Nội',
      base_price: 1000,
      min_price: 1000,
      max_price: 1500,
      customs_fee: 300,
      insurance_rate: 0.003,
      transit_days: 6,
      features: '["安全可靠", "时效快", "专业清关"]',
      image_url: '',
      priority: 4
    },
    {
      code: 'thai',
      name_zh: '泰国海运',
      name_en: 'Thailand Sea Freight',
      name_vi: 'Vận tải biển Thái Lan',
      description_zh: '中国主要港口到泰国各港口的海运服务',
      description_en: 'Sea freight services from major Chinese ports to Thai ports',
      description_vi: 'Dịch vụ vận tải biển từ các cảng chính của Trung Quốc đến các cảng Thái Lan',
      base_price: 900,
      min_price: 900,
      max_price: 1500,
      customs_fee: 300,
      insurance_rate: 0.004,
      transit_days: 10,
      features: '["整柜运输", "拼箱服务", "港口配送"]',
      image_url: '',
      priority: 5
    },
    {
      code: 'viet',
      name_zh: '越南海运',
      name_en: 'Vietnam Sea Freight',
      name_vi: 'Vận tải biển Việt Nam',
      description_zh: '中国主要港口到越南各港口的海运服务',
      description_en: 'Sea freight services from major Chinese ports to Vietnamese ports',
      description_vi: 'Dịch vụ vận tải biển từ các cảng chính của Trung Quốc đến các cảng Việt Nam',
      base_price: 800,
      min_price: 800,
      max_price: 1300,
      customs_fee: 300,
      insurance_rate: 0.004,
      transit_days: 8,
      features: '["直达航线", "清关服务", "内陆转运"]',
      image_url: '',
      priority: 6
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
      service.base_price,
      service.min_price,
      service.max_price,
      service.customs_fee,
      service.insurance_rate,
      service.transit_days,
      service.features,
      service.image_url,
      service.priority
    );
  });
  console.log('✓ 默认服务数据创建成功');
  
  // 插入默认角色数据
  const insertRole = db.prepare(`
    INSERT INTO roles (name, code, permissions)
    VALUES (?, ?, ?)
  `);
  
  const roles = [
    {
      name: '超级管理员',
      code: 'super_admin',
      permissions: JSON.stringify({ all: true })
    },
    {
      name: '管理员',
      code: 'admin',
      permissions: JSON.stringify({ 
        manage_inquiries: true,
        manage_orders: true,
        manage_customers: true,
        manage_quotes: true,
        view_reports: true
      })
    },
    {
      name: '编辑',
      code: 'editor',
      permissions: JSON.stringify({ 
        manage_inquiries: true,
        manage_news: true,
        view_reports: true
      })
    },
    {
      name: '查看者',
      code: 'viewer',
      permissions: JSON.stringify({ 
        view_reports: true
      })
    }
  ];
  
  roles.forEach(role => {
    insertRole.run(
      role.name,
      role.code,
      role.permissions
    );
  });
  console.log('✓ 默认角色数据创建成功');
  
  // 插入示例新闻数据（多语言字段）
  const insertNews = db.prepare(`
    INSERT INTO news (title_zh, title_en, title_vi, content_zh, content_en, content_vi, summary_zh, summary_en, summary_vi, category, image_url, video_url, publish_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const newsItems = [
    {
      title_zh: '中老铁路货运量创历史新高',
      content_zh: '中老铁路开通以来，货运量持续增长，本月创下历史新高...',
      summary_zh: '中老铁路货运量持续增长，本月创下历史新高',
      category: 'company',
      image_url: '',
      publish_date: new Date().toISOString().split('T')[0]
    },
    {
      title_zh: '中老泰铁路联运正式开通',
      title_en: 'China-Laos-Thailand Railway Officially Opens',
      content_zh: '中老泰铁路联运服务正式开通，实现中国经老挝到泰国的一票直达运输...',
      content_en: 'The China-Laos-Thailand railway intermodal service has officially opened, providing one-ticket direct transport from China through Laos to Thailand...',
      summary_zh: '中老泰铁路联运正式开通，一票直达',
      summary_en: 'China-Laos-Thailand railway intermodal officially opened',
      category: 'service',
      image_url: '',
      publish_date: new Date().toISOString().split('T')[0]
    }
  ];
  
  newsItems.forEach(news => {
    insertNews.run(
      news.title_zh,
      news.title_en || '',
      news.title_vi || '',
      news.content_zh,
      news.content_en || '',
      news.content_vi || '',
      news.summary_zh || '',
      news.summary_en || '',
      news.summary_vi || '',
      news.category,
      news.image_url || '',
      news.video_url || '',
      news.publish_date
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
    INSERT INTO tracking_events (shipment_id, status, location, description_zh, description_en, description_vi, timestamp)
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
      timestamp: '2024-01-10 10:00:00'
    },
    {
      shipment_id: 1,
      status: 'in_transit',
      location: '磨憨',
      description_zh: '货物已发出',
      description_en: 'Package in transit',
      description_vi: 'Hàng đang trên đường',
      timestamp: '2024-01-11 15:30:00'
    },
    {
      shipment_id: 1,
      status: 'customs',
      location: '万象',
      description_zh: '清关中',
      description_en: 'Customs clearance',
      description_vi: 'Đang thông quan',
      timestamp: '2024-01-13 09:00:00'
    },
    {
      shipment_id: 1,
      status: 'delivered',
      location: '万象',
      description_zh: '已签收',
      description_en: 'Delivered',
      description_vi: 'Đã giao hàng',
      timestamp: '2024-01-15 14:00:00'
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
      event.timestamp
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