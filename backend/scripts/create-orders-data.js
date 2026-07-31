const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../database/data.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const serviceCodes = ['railway', 'thai_sea', 'viet_sea'];
const cargoTypes = ['general', 'fragile', 'dangerous', 'oversize', 'temperature'];
const loadTypes = ['fcl', 'lcl'];
const originCities = ['KM', 'SZ', 'GZ', 'SH', 'CD'];
const destCities = ['VTE', 'BKK', 'HCM', 'HPH', 'LPQ'];
const statusOptions = ['pending', 'confirmed', 'picked_up', 'in_transit', 'customs', 'delivered'];
const cargoNames = ['电子产品', '机械设备', '纺织品', '服装鞋帽', '家具家居', '食品原料', '化工原料', '建材', '玩具', '五金配件', '塑料制品', '汽车配件', '医疗器械', '文具用品', '日用百货'];

for (let i = 0; i < 15; i++) {
  const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
  const weight = Math.floor(Math.random() * 5000) + 500;
  const volume = (Math.random() * 30 + 1).toFixed(2);
  const price = Math.floor(weight * 2.5 + parseFloat(volume) * 850);
  
  const newOrder = {
    id: db.nextIds.orders++,
    tracking_number: `SP${260000 + i}`,
    service_code: serviceCodes[Math.floor(Math.random() * serviceCodes.length)],
    status: status,
    cargo_name: cargoNames[i % cargoNames.length],
    cargo_type: cargoTypes[Math.floor(Math.random() * cargoTypes.length)],
    weight: weight,
    volume: parseFloat(volume),
    load_type: loadTypes[Math.floor(Math.random() * loadTypes.length)],
    origin_city: originCities[Math.floor(Math.random() * originCities.length)],
    dest_city: destCities[Math.floor(Math.random() * destCities.length)],
    sender_name: `发货人${i + 1}`,
    sender_phone: `138${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
    sender_address: '发货地址测试',
    receiver_name: `收货人${i + 1}`,
    receiver_phone: `139${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
    receiver_address: '收货地址测试',
    price: price,
    customs_fee: Math.floor(Math.random() * 500) + 200,
    insurance_fee: Math.floor(price * 0.003),
    total_fee: price + Math.floor(Math.random() * 500) + 200 + Math.floor(price * 0.003),
    paid: Math.random() > 0.3,
    payment_method: ['bank', 'alipay', 'wechat'][Math.floor(Math.random() * 3)],
    estimated_delivery: new Date(Date.now() + (Math.random() * 15 + 5) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    remarks: Math.random() > 0.5 ? '请小心轻放' : '',
    timeline: [
      {
        time: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        description: '订单已创建'
      }
    ],
    created_at: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  };
  
  db.data.orders.push(newOrder);
}

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log('✅ 创建了 15 条订单数据');