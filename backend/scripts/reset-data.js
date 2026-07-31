const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../database/data.json');

const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// 清空业务数据，保留管理员和会话
db.data.inquiries = [];
db.data.shipments = [];
db.data.tracking_events = [];
db.data.news = [];
db.data.services = [];
db.data.orders = [];
db.data.customers = [];
db.data.customer_contacts = [];
db.data.quotes = [];

// 重置ID计数器
db.nextIds.inquiries = 1;
db.nextIds.shipments = 1;
db.nextIds.tracking_events = 1;
db.nextIds.news = 1;
db.nextIds.services = 1;
db.nextIds.orders = 1;
db.nextIds.customers = 1;
db.nextIds.customer_contacts = 1;
db.nextIds.quotes = 1;

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log('✅ 数据已成功清空！');
console.log('- 已清空：询价、发货、跟踪事件、新闻、服务、订单、客户、报价');
console.log('- 已保留：管理员账号、会话');
console.log('- ID计数器已重置');