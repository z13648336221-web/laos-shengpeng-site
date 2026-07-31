const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../database/data.json');

const transportTypes = ['rail', 'thai', 'viet'];
const originCities = ['KM', 'SZ', 'GZ', 'SH', 'CD', 'NJ', 'YW', 'NB'];
const destCities = {
  rail: ['VTE', 'LPQ', 'PKH'],
  thai: ['BKK', 'CM', 'LCH'],
  viet: ['HPH', 'HAN', 'HCM', 'DAD']
};
const cargoNames = [
  '电子产品', '机械设备', '纺织品', '服装鞋帽', '家具家居',
  '食品原料', '化工原料', '建材', '玩具', '五金配件',
  '塑料制品', '汽车配件', '医疗器械', '文具用品', '日用百货',
  '化妆品', '体育用品', '工艺品', '电子产品配件', '包装材料'
];
const contactNames = [
  '李明', '王芳', '张伟', '赵阳', '陈静', '刘强', '许娟', '何军', '周敏', '吴涛',
  '孙磊', '郑华', '黄磊', '林婷', '杨帆', '徐强', '马丽', '朱伟', '胡军', '郭丽'
];

function generatePhone() {
  const prefixes = ['138', '139', '137', '136', '135', '134', '158', '159', '188', '189'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  return prefix + suffix;
}

function generateEmail(name) {
  const domains = ['gmail.com', 'qq.com', '163.com', 'sina.com', 'workmail.com'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  const namePinyin = {
    '李明': 'liming', '王芳': 'wangfang', '张伟': 'zhangwei', '赵阳': 'zhaoyang', '陈静': 'chenjing',
    '刘强': 'liuqiang', '许娟': 'xujuan', '何军': 'hejun', '周敏': 'zhoumin', '吴涛': 'wutao',
    '孙磊': 'sunlei', '郑华': 'zhenghua', '黄磊': 'huanglei', '林婷': 'linting', '杨帆': 'yangfan',
    '徐强': 'xuqiang', '马丽': 'mali', '朱伟': 'zhuwei', '胡军': 'hujun', '郭丽': 'guoli'
  };
  return `${namePinyin[name] || name}@${domain}`;
}

function generateCompany() {
  const companies = [
    '昆明商贸有限公司', '深圳进出口有限公司', '广州贸易公司', '上海物流咨询公司',
    '义乌小商品批发', '宁波进出口贸易', '成都跨境电商', '重庆供应链管理',
    '长沙货运代理', '杭州外贸公司', '武汉物流集团', '南京国际贸易',
    '青岛港务集团', '天津货代公司', '大连海运集团', '厦门外贸企业',
    '西安进出口', '郑州物流中心', '合肥贸易公司', '苏州跨境电商'
  ];
  return companies[Math.floor(Math.random() * companies.length)];
}

const inquiryData = [];

for (let i = 0; i < 20; i++) {
  const transportType = transportTypes[Math.floor(Math.random() * transportTypes.length)];
  const destCityOptions = destCities[transportType];
  const destCity = destCityOptions[Math.floor(Math.random() * destCityOptions.length)];
  const contactName = contactNames[i % contactNames.length];
  const weight = Math.floor(Math.random() * 5000) + 100;
  const volume = (Math.random() * 20).toFixed(2);
  
  inquiryData.push({
    transport_type: transportType,
    origin_city: originCities[Math.floor(Math.random() * originCities.length)],
    dest_city: destCity,
    cargo_name: cargoNames[i % cargoNames.length],
    weight: weight,
    volume: parseFloat(volume),
    need_customs: Math.random() > 0.6 ? 'yes' : 'no',
    need_insurance: Math.random() > 0.7 ? 'yes' : 'no',
    contact_name: contactName,
    contact_phone: generatePhone(),
    contact_email: Math.random() > 0.3 ? generateEmail(contactName) : null,
    company_name: Math.random() > 0.2 ? generateCompany() : null,
    remark: Math.random() > 0.5 ? '希望尽快安排发货' : null,
    status: ['pending', 'processing', 'completed', 'cancelled'][Math.floor(Math.random() * 4)]
  });
}

const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const now = new Date().toISOString();

inquiryData.forEach(inquiry => {
  const newInquiry = {
    id: db.nextIds.inquiries++,
    ...inquiry,
    created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: now
  };
  db.data.inquiries.push(newInquiry);
});

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log('成功创建了', inquiryData.length, '条询价数据');
