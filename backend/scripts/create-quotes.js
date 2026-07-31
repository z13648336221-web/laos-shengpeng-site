const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../database/data.json');

const quoteData = [
  {
    name: '中老铁路标准散货',
    service_code: 'railway',
    origin_city: 'KM',
    dest_city: 'VTE',
    min_weight: 100,
    max_weight: 1000,
    base_price: 850,
    price_unit: 'CBM',
    customs_fee: 300,
    insurance_rate: 0.005,
    transit_days: 5,
    valid_days: 30,
    status: 'active',
    remarks: '适用于普通货物散货运输'
  },
  {
    name: '中老铁路整柜运输',
    service_code: 'railway',
    origin_city: 'KM',
    dest_city: 'VTE',
    min_weight: 5000,
    max_weight: 25000,
    base_price: 12000,
    price_unit: 'CBM',
    customs_fee: 500,
    insurance_rate: 0.003,
    transit_days: 5,
    valid_days: 30,
    status: 'active',
    remarks: '20尺整柜优惠价格'
  },
  {
    name: '泰国曼谷海运专线',
    service_code: 'thailand-sea',
    origin_city: 'SZ',
    dest_city: 'BKK',
    min_weight: 500,
    max_weight: 5000,
    base_price: 1200,
    price_unit: 'CBM',
    customs_fee: 800,
    insurance_rate: 0.005,
    transit_days: 15,
    valid_days: 30,
    status: 'active',
    remarks: '深圳到曼谷海运专线'
  },
  {
    name: '泰国林查班整柜',
    service_code: 'thailand-sea',
    origin_city: 'SZ',
    dest_city: 'LCH',
    min_weight: 10000,
    max_weight: 50000,
    base_price: 18000,
    price_unit: 'CBM',
    customs_fee: 1200,
    insurance_rate: 0.003,
    transit_days: 18,
    valid_days: 30,
    status: 'active',
    remarks: '林查班港整柜服务'
  },
  {
    name: '越南海防海运',
    service_code: 'vietnam-sea',
    origin_city: 'GZ',
    dest_city: 'HPH',
    min_weight: 300,
    max_weight: 3000,
    base_price: 900,
    price_unit: 'CBM',
    customs_fee: 500,
    insurance_rate: 0.004,
    transit_days: 7,
    valid_days: 30,
    status: 'active',
    remarks: '广州到海防海运快线'
  },
  {
    name: '越南胡志明整柜',
    service_code: 'vietnam-sea',
    origin_city: 'GZ',
    dest_city: 'HCM',
    min_weight: 8000,
    max_weight: 40000,
    base_price: 15000,
    price_unit: 'CBM',
    customs_fee: 1000,
    insurance_rate: 0.003,
    transit_days: 10,
    valid_days: 30,
    status: 'active',
    remarks: '胡志明港整柜运输'
  },
  {
    name: '中老铁路轻泡货',
    service_code: 'railway',
    origin_city: 'KM',
    dest_city: 'LPQ',
    min_weight: 50,
    max_weight: 500,
    base_price: 950,
    price_unit: 'CBM',
    customs_fee: 250,
    insurance_rate: 0.006,
    transit_days: 6,
    valid_days: 30,
    status: 'active',
    remarks: '轻泡货物专用报价'
  },
  {
    name: '泰国清迈陆运',
    service_code: 'thailand-sea',
    origin_city: 'KM',
    dest_city: 'CNX',
    min_weight: 200,
    max_weight: 2000,
    base_price: 1100,
    price_unit: 'CBM',
    customs_fee: 600,
    insurance_rate: 0.005,
    transit_days: 12,
    valid_days: 30,
    status: 'active',
    remarks: '清迈陆运专线'
  },
  {
    name: '越南岘港海运',
    service_code: 'vietnam-sea',
    origin_city: 'YW',
    dest_city: 'DAD',
    min_weight: 400,
    max_weight: 4000,
    base_price: 950,
    price_unit: 'CBM',
    customs_fee: 550,
    insurance_rate: 0.004,
    transit_days: 8,
    valid_days: 30,
    status: 'active',
    remarks: '义乌到岘港海运'
  },
  {
    name: '中老铁路大件运输',
    service_code: 'railway',
    origin_city: 'KM',
    dest_city: 'VTE',
    min_weight: 2000,
    max_weight: 20000,
    base_price: 1500,
    price_unit: 'CBM',
    customs_fee: 800,
    insurance_rate: 0.008,
    transit_days: 7,
    valid_days: 30,
    status: 'active',
    remarks: '大件货物特殊报价'
  }
];

const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const now = new Date().toISOString();

quoteData.forEach(quote => {
  const newQuote = {
    id: db.nextIds.quotes++,
    ...quote,
    created_at: now,
    updated_at: now
  };
  db.data.quotes.push(newQuote);
});

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log('成功创建了', quoteData.length, '条报价数据');
