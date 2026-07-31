const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../database/data.json');

const customerData = [
  {
    name: '李明',
    company: '昆明商贸有限公司',
    phone: '13800138001',
    email: 'liming@kmtrade.com',
    wechat: 'liming123',
    address: '云南省昆明市五华区东风西路100号',
    type: 'enterprise',
    status: 'active',
    remarks: '长期合作客户'
  },
  {
    name: '王芳',
    company: '深圳进出口有限公司',
    phone: '13900139002',
    email: 'wangfang@szimport.com',
    wechat: 'wangfang456',
    address: '广东省深圳市南山区科技园路88号',
    type: 'agent',
    status: 'active',
    remarks: '泰国专线客户'
  },
  {
    name: '张伟',
    company: '广州贸易公司',
    phone: '13700137003',
    email: 'zhangwei@gztrade.com',
    wechat: 'zhangwei789',
    address: '广东省广州市天河区珠江新城50号',
    type: 'VIP',
    status: 'active',
    remarks: '越南专线大客户'
  },
  {
    name: '赵阳',
    company: '',
    phone: '13600136004',
    email: 'zhaoyang@email.com',
    wechat: 'zhaoyang012',
    address: '四川省成都市锦江区春熙路66号',
    type: 'general',
    status: 'active',
    remarks: '个人客户'
  },
  {
    name: '陈静',
    company: '上海物流咨询公司',
    phone: '13500135005',
    email: 'chenjing@shconsult.com',
    wechat: 'chenjing345',
    address: '上海市浦东新区陆家嘴环路1000号',
    type: 'agent',
    status: 'active',
    remarks: '上海地区代理'
  },
  {
    name: '刘强',
    company: '义乌小商品批发',
    phone: '13400134006',
    email: 'liuqiang@yiwuwholesale.com',
    wechat: 'liuqiang678',
    address: '浙江省义乌市国际商贸城一区',
    type: 'enterprise',
    status: 'active',
    remarks: '义乌小商品客户'
  },
  {
    name: '许娟',
    company: '',
    phone: '13300133007',
    email: 'xujuan@email.com',
    wechat: 'xujuan901',
    address: '重庆市渝中区解放碑88号',
    type: 'general',
    status: 'inactive',
    remarks: '暂时不活跃'
  },
  {
    name: '何军',
    company: '宁波进出口贸易',
    phone: '13200132008',
    email: 'hejun@nbimport.com',
    wechat: 'hejun234',
    address: '浙江省宁波市北仑区港前路50号',
    type: 'enterprise',
    status: 'active',
    remarks: '海运专线客户'
  },
  {
    name: '周敏',
    company: '成都跨境电商',
    phone: '13100131009',
    email: 'zhoumin@cdcrossborder.com',
    wechat: 'zhoumin567',
    address: '四川省成都市双流区航空港路200号',
    type: 'VIP',
    status: 'active',
    remarks: '跨境电商VIP客户'
  },
  {
    name: '吴涛',
    company: '',
    phone: '13000130010',
    email: 'wutao@email.com',
    wechat: 'wutao890',
    address: '湖南省长沙市雨花区韶山中路100号',
    type: 'general',
    status: 'active',
    remarks: '新客户'
  }
];

const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const now = new Date().toISOString();

customerData.forEach(customer => {
  const newCustomer = {
    id: db.nextIds.customers++,
    ...customer,
    contact_count: Math.floor(Math.random() * 5),
    total_value: Math.floor(Math.random() * 50000) + 1000,
    last_contact: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : null,
    created_at: now,
    updated_at: now
  };
  db.data.customers.push(newCustomer);
});

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log('成功创建了', customerData.length, '个客户数据');
