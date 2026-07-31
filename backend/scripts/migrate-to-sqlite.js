/**
 * 数据迁移脚本：从 JSON 数据库迁移到 SQLite
 * 保留现有数据，升级数据库系统
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const jsonDbPath = path.join(__dirname, '../database/data.json');
const sqliteDbPath = path.join(__dirname, '../database/shengpeng.db');
const backupPath = path.join(__dirname, '../database/data.json.backup');

console.log('开始数据迁移：JSON → SQLite');
console.log('源文件:', jsonDbPath);
console.log('目标文件:', sqliteDbPath);

// 检查源文件是否存在
if (!fs.existsSync(jsonDbPath)) {
  console.error('✗ JSON 数据库文件不存在:', jsonDbPath);
  process.exit(1);
}

// 检查目标文件是否已存在
if (fs.existsSync(sqliteDbPath)) {
  console.error('✗ SQLite 数据库文件已存在，如需重新迁移请先删除:', sqliteDbPath);
  console.log('删除命令: rm', sqliteDbPath);
  process.exit(1);
}

try {
  // 备份 JSON 数据库
  console.log('创建 JSON 数据库备份...');
  fs.copyFileSync(jsonDbPath, backupPath);
  console.log('✓ 备份创建成功:', backupPath);
  
  // 读取 JSON 数据
  console.log('读取 JSON 数据...');
  const jsonData = JSON.parse(fs.readFileSync(jsonDbPath, 'utf8'));
  const data = jsonData.data || {};
  console.log('✓ JSON 数据读取成功');
  
  // 创建 SQLite 数据库
  console.log('创建 SQLite 数据库...');
  const db = new Database(sqliteDbPath);
  db.pragma('foreign_keys = ON');
  
  // 执行 schema
  const schemaPath = path.join(__dirname, '../database/schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema);
    console.log('✓ 数据库表结构创建成功');
  } else {
    console.error('✗ schema.sql 文件不存在');
    process.exit(1);
  }
  
  // 迁移数据函数
  const migrateTable = (tableName, data, columnMapping) => {
    if (!data || data.length === 0) {
      console.log(`  ${tableName}: 无数据`);
      return;
    }
    
    const columns = Object.keys(columnMapping);
    const placeholders = columns.map(() => '?').join(', ');
    const columnNames = columns.join(', ');
    
    const insert = db.prepare(`INSERT INTO ${tableName} (${columnNames}) VALUES (${placeholders})`);
    
    let count = 0;
    const insertMany = db.transaction((rows) => {
      for (const row of rows) {
        const values = columns.map(col => {
          const sourceCol = columnMapping[col];
          let value = row[sourceCol];
          
          // 处理布尔值转换
          if (typeof value === 'boolean') {
            value = value ? 1 : 0;
          }
          
          // 处理 null 值
          if (value === null || value === undefined) {
            return null;
          }
          
          // 处理对象转换为 JSON 字符串
          if (typeof value === 'object' && !(value instanceof Date)) {
            return JSON.stringify(value);
          }
          
          return value;
        });
        
        try {
          insert.run(...values);
          count++;
        } catch (error) {
          console.warn(`    跳过记录: ${error.message}`);
        }
      }
    });
    
    insertMany(data);
    console.log(`  ${tableName}: ${count} 条记录`);
  };
  
  // 开始迁移
  console.log('\n开始迁移数据:');
  
  // 迁移聊天记录
  if (data.chats) {
    migrateTable('chats', data.chats, {
      id: 'id',
      visitor_id: 'visitorId',
      visitor_name: 'visitorName',
      sender: 'sender',
      admin_name: 'adminName',
      message: 'message',
      is_read: 'isRead',
      created_at: 'created_at',
      read_at: 'readAt'
    });
  }
  
  // 迁移询价记录
  if (data.inquiries) {
    migrateTable('inquiries', data.inquiries, {
      id: 'id',
      transport_type: 'transport_type',
      origin_city: 'origin_city',
      dest_city: 'dest_city',
      cargo_name: 'cargo_name',
      weight: 'weight',
      volume: 'volume',
      need_customs: 'need_customs',
      need_insurance: 'need_insurance',
      contact_name: 'contact_name',
      contact_phone: 'contact_phone',
      contact_email: 'contact_email',
      company_name: 'company_name',
      remark: 'remark',
      status: 'status',
      created_at: 'created_at'
    });
  }
  
  // 迁移运单
  if (data.shipments) {
    migrateTable('shipments', data.shipments, {
      id: 'id',
      tracking_number: 'tracking_number',
      sender_name: 'sender_name',
      sender_phone: 'sender_phone',
      receiver_name: 'receiver_name',
      receiver_phone: 'receiver_phone',
      origin: 'origin',
      destination: 'destination',
      service_code: 'service_code',
      status: 'status',
      goods_description: 'goods_description',
      weight: 'weight',
      volume: 'volume',
      estimated_delivery: 'estimated_delivery',
      created_at: 'created_at'
    });
  }
  
  // 迁移追踪事件
  if (data.tracking_events) {
    migrateTable('tracking_events', data.tracking_events, {
      id: 'id',
      shipment_id: 'shipment_id',
      status: 'status',
      location: 'location',
      description_zh: 'description_zh',
      description_en: 'description_en',
      description_vi: 'description_vi',
      event_time: 'event_time'
    });
  }
  
  // 迁移新闻
  if (data.news) {
    migrateTable('news', data.news, {
      id: 'id',
      title: 'title',
      content: 'content',
      summary: 'summary',
      category: 'category',
      image_url: 'image_url',
      lang: 'lang',
      published: 'published',
      view_count: 'view_count',
      created_at: 'created_at',
      updated_at: 'updated_at'
    });
  }
  
  // 迁移服务
  if (data.services) {
    migrateTable('services', data.services, {
      id: 'id',
      code: 'code',
      name_zh: 'name_zh',
      name_en: 'name_en',
      name_vi: 'name_vi',
      description_zh: 'description_zh',
      description_en: 'description_en',
      description_vi: 'description_vi',
      icon: 'icon',
      route: 'route',
      active: 'active',
      sort_order: 'sort_order',
      created_at: 'created_at',
      updated_at: 'updated_at'
    });
  }
  
  // 迁移订单
  if (data.orders) {
    migrateTable('orders', data.orders, {
      id: 'id',
      order_number: 'order_number',
      customer_id: 'customer_id',
      inquiry_id: 'inquiry_id',
      transport_type: 'transport_type',
      origin: 'origin',
      destination: 'destination',
      cargo_description: 'cargo_description',
      weight: 'weight',
      volume: 'volume',
      price: 'price',
      currency: 'currency',
      status: 'status',
      estimated_delivery: 'estimated_delivery',
      actual_delivery: 'actual_delivery',
      created_at: 'created_at',
      updated_at: 'updated_at'
    });
  }
  
  // 迁移客户
  if (data.customers) {
    migrateTable('customers', data.customers, {
      id: 'id',
      name: 'name',
      company: 'company',
      phone: 'phone',
      email: 'email',
      wechat: 'wechat',
      address: 'address',
      type: 'type',
      status: 'status',
      remarks: 'remarks',
      contact_count: 'contact_count',
      total_value: 'total_value',
      group_name: 'group',
      created_at: 'created_at',
      updated_at: 'updated_at'
    });
  }
  
  // 迁移客户联系人
  if (data.customer_contacts) {
    migrateTable('customer_contacts', data.customer_contacts, {
      id: 'id',
      customer_id: 'customer_id',
      name: 'name',
      position: 'position',
      phone: 'phone',
      email: 'email',
      wechat: 'wechat',
      is_primary: 'is_primary',
      remarks: 'remarks',
      created_at: 'created_at',
      updated_at: 'updated_at'
    });
  }
  
  // 迁移报价
  if (data.quotes) {
    migrateTable('quotes', data.quotes, {
      id: 'id',
      quote_number: 'quote_number',
      customer_id: 'customer_id',
      inquiry_id: 'inquiry_id',
      transport_type: 'transport_type',
      origin: 'origin',
      destination: 'destination',
      cargo_description: 'cargo_description',
      weight: 'weight',
      volume: 'volume',
      price: 'price',
      currency: 'currency',
      valid_until: 'valid_until',
      terms: 'terms',
      status: 'status',
      created_at: 'created_at',
      updated_at: 'updated_at'
    });
  }
  
  // 迁移管理员
  if (data.admins) {
    migrateTable('admins', data.admins, {
      id: 'id',
      username: 'username',
      password: 'password',
      name: 'name',
      email: 'email',
      phone: 'phone',
      role: 'role',
      status: 'status',
      last_login: 'last_login',
      created_at: 'created_at',
      updated_at: 'updated_at'
    });
  }
  
  // 迁移会话
  if (data.sessions) {
    migrateTable('sessions', data.sessions, {
      id: 'id',
      session_id: 'session_id',
      admin_id: 'admin_id',
      expires_at: 'expires_at',
      ip_address: 'ip_address',
      user_agent: 'user_agent',
      created_at: 'created_at'
    });
  }
  
  // 迁移角色
  if (data.roles) {
    migrateTable('roles', data.roles, {
      id: 'id',
      name: 'name',
      display_name_zh: 'display_name_zh',
      display_name_en: 'display_name_en',
      display_name_vi: 'display_name_vi',
      permissions: 'permissions',
      description: 'description',
      created_at: 'created_at',
      updated_at: 'updated_at'
    });
  }
  
  // 迁移日志
  if (data.logs) {
    migrateTable('logs', data.logs, {
      id: 'id',
      admin_id: 'admin_id',
      action: 'action',
      target_type: 'target_type',
      target_id: 'target_id',
      details: 'details',
      ip_address: 'ip_address',
      user_agent: 'user_agent',
      created_at: 'created_at'
    });
  }
  
  // 优惠券数据可能不存在于旧数据库中，跳过
  
  // 重置自增ID序列
  console.log('\n重置自增ID序列...');
  const tables = ['chats', 'inquiries', 'shipments', 'tracking_events', 'news', 'services', 'orders', 'customers', 'customer_contacts', 'quotes', 'admins', 'sessions', 'roles', 'logs', 'coupons'];
  
  tables.forEach(table => {
    try {
      const maxIdResult = db.prepare(`SELECT MAX(id) as max_id FROM ${table}`).get();
      if (maxIdResult && maxIdResult.max_id) {
        db.prepare(`DELETE FROM sqlite_sequence WHERE name = ?`).run(table);
        db.prepare(`INSERT INTO sqlite_sequence (name, seq) VALUES (?, ?)`).run(table, maxIdResult.max_id);
      }
    } catch (error) {
      // 表可能不存在或没有数据，忽略错误
    }
  });
  
  console.log('✓ 自增ID序列重置完成');
  
  // 关闭数据库连接
  db.close();
  
  console.log('\n✅ 数据迁移完成！');
  console.log('SQLite 数据库:', sqliteDbPath);
  console.log('JSON 备份文件:', backupPath);
  
  // 显示迁移统计
  console.log('\n迁移统计:');
  const newDb = new Database(sqliteDbPath);
  tables.forEach(table => {
    try {
      const count = newDb.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
      console.log(`  ${table}: ${count.count} 条记录`);
    } catch (error) {
      console.log(`  ${table}: 表不存在或查询失败`);
    }
  });
  newDb.close();
  
  console.log('\n下一步:');
  console.log('1. 测试新的 SQLite 数据库系统');
  console.log('2. 确认无误后，可以删除 JSON 备份文件');
  console.log('3. 更新生产环境配置');
  
} catch (error) {
  console.error('✗ 数据迁移失败:', error.message);
  
  // 清理可能不完整的数据库文件
  if (fs.existsSync(sqliteDbPath)) {
    fs.unlinkSync(sqliteDbPath);
    console.log('已删除不完整的 SQLite 数据库文件');
  }
  
  // 恢复备份
  if (fs.existsSync(backupPath)) {
    console.log('JSON 备份文件保留在:', backupPath);
  }
  
  process.exit(1);
}