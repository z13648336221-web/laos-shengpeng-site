const db = require('../models/database');

const initData = async () => {
  await db.init();
  
  await db.insert('services', {
    code: 'railway',
    name_zh: '中老铁路陆运',
    name_en: 'China-Laos Railway',
    name_vi: 'Đường sắt Trung Quốc-Lào',
    description_zh: '中老铁路是连接中国昆明和老挝万象的现代化国际铁路，全程1035公里，运输时间短、成本低。',
    description_en: 'China-Laos Railway is a modern international railway connecting Kunming, China and Vientiane, Laos, with a total length of 1035 km, featuring short transportation time and low cost.',
    description_vi: 'Đường sắt Trung Quốc-Lào là tuyến đường sắt quốc tế hiện đại nối Khuynh Minh, Trung Quốc và Vientiane, Lào, dài 1035 km, thời gian vận chuyển ngắn và chi phí thấp.',
    base_price: 850,
    unit: 'TEU',
    transit_days: 5,
    features: '门到门服务, 清关代理, 实时追踪'
  });
  
  await db.insert('services', {
    code: 'thailand-sea',
    name_zh: '泰国海运',
    name_en: 'Thailand Sea Freight',
    name_vi: 'Vận chuyển biển Thái Lan',
    description_zh: '提供中国到泰国各主要港口的海运服务，包括曼谷、林查班等港口。',
    description_en: 'Providing sea freight services from China to major Thai ports including Bangkok and Laem Chabang.',
    description_vi: 'Cung cấp dịch vụ vận chuyển biển từ Trung Quốc đến các cảng chính của Thái Lan bao gồm Bangkok, Laem Chabang.',
    base_price: 1200,
    unit: 'TEU',
    transit_days: 15,
    features: '整柜运输, 拼箱服务, 港口配送'
  });
  
  await db.insert('services', {
    code: 'vietnam-sea',
    name_zh: '越南海运',
    name_en: 'Vietnam Sea Freight',
    name_vi: 'Vận chuyển biển Việt Nam',
    description_zh: '覆盖越南主要港口：海防、胡志明、岘港，提供快速、可靠的海运服务。',
    description_en: 'Covering major Vietnamese ports: Hai Phong, Ho Chi Minh, Da Nang, providing fast and reliable sea freight services.',
    description_vi: 'Phụ cập các cảng chính của Việt Nam: Hải Phòng, TP.HCM, Đà Nẵng, cung cấp dịch vụ vận chuyển biển nhanh chóng và đáng tin cậy.',
    base_price: 900,
    unit: 'TEU',
    transit_days: 7,
    features: '直达航线, 清关服务, 内陆转运'
  });
  
  await db.insert('services', {
    code: 'road',
    name_zh: '中老公路运输',
    name_en: 'China-Laos Road Transport',
    name_vi: 'Vận chuyển đường bộ Trung Quốc-Lào',
    description_zh: '中老公路运输提供灵活的门到门服务，支持9.6米、13米、13.75米、17.5米等多种车型。',
    description_en: 'China-Laos Road Transport provides flexible door-to-door services, supporting various truck types including 9.6m, 13m, 13.75m, and 17.5m.',
    description_vi: 'Vận chuyển đường bộ Trung Quốc-Lào cung cấp dịch vụ từ cổng đến cổng linh hoạt, hỗ trợ nhiều loại xe bao gồm 9.6m, 13m, 13.75m và 17.5m.',
    base_price: 1500,
    unit: 'CBM',
    transit_days: 8,
    features: '门到门服务, 多种车型, 灵活调度'
  });
  
  await db.insert('services', {
    code: 'thai-rail',
    name_zh: '中老泰铁路联运',
    name_en: 'China-Laos-Thailand Rail Link',
    name_vi: 'Liên vận đường sắt Trung Quốc-Lào-Thái Lan',
    description_zh: '中国铁路经老挝转关到泰国，一票直达，全程无缝衔接，运输时间短，清关便捷。',
    description_en: 'China-Laos-Thailand Rail Link provides one-ticket direct service with seamless connection, short transit time, and convenient customs clearance.',
    description_vi: 'Liên vận đường sắt Trung Quốc-Lào-Thái Lan cung cấp dịch vụ một vé trực tiếp, kết nối liền mạch, thời gian vận chuyển ngắn và hải quan thuận tiện.',
    base_price: 1800,
    unit: 'TEU',
    transit_days: 10,
    features: '一票直达, 无缝衔接, 快速清关'
  });
  
  await db.insert('services', {
    code: 'viet-rail',
    name_zh: '中越铁路',
    name_en: 'China-Vietnam Railway',
    name_vi: 'Đường sắt Trung Quốc-Việt Nam',
    description_zh: '中越铁路运输，连接中国南宁与越南河内，提供跨境铁路货运服务，安全可靠。',
    description_en: 'China-Vietnam Railway connects Nanning, China with Hanoi, Vietnam, providing cross-border rail freight services that are safe and reliable.',
    description_vi: 'Đường sắt Trung Quốc-Việt Nam nối Nanning, Trung Quốc với Hà Nội, Việt Nam, cung cấp dịch vụ vận chuyển đường sắt biên giới an toàn và đáng tin cậy.',
    base_price: 1200,
    unit: 'TEU',
    transit_days: 6,
    features: '跨境直达, 安全可靠, 快速通关'
  });
  
  await db.insert('shipments', {
    tracking_number: 'SP20240001',
    sender_name: '李明',
    sender_phone: '13800138001',
    receiver_name: 'SOUTHAVONG',
    receiver_phone: '+856-20-12345678',
    origin: '昆明',
    destination: '万象',
    service_code: 'railway',
    status: 'delivered',
    goods_description: '电子产品',
    weight: 500,
    volume: 2.5,
    estimated_delivery: '2024-01-15'
  });
  
  await db.insert('tracking_events', {
    shipment_id: 1,
    status: 'picked_up',
    location: '昆明',
    description_zh: '货物已揽收',
    description_en: 'Picked up',
    description_vi: 'Đã nhận hàng',
    timestamp: '2024-01-10T08:00:00Z'
  });
  
  await db.insert('tracking_events', {
    shipment_id: 1,
    status: 'in_transit',
    location: '磨憨口岸',
    description_zh: '正在通关中',
    description_en: 'Customs clearance',
    description_vi: 'Đang qua hải quan',
    timestamp: '2024-01-11T14:30:00Z'
  });
  
  await db.insert('tracking_events', {
    shipment_id: 1,
    status: 'in_transit',
    location: '万象',
    description_zh: '到达目的城市',
    description_en: 'Arrived at destination city',
    description_vi: 'Đã đến thành phố đích',
    timestamp: '2024-01-14T10:00:00Z'
  });
  
  await db.insert('tracking_events', {
    shipment_id: 1,
    status: 'delivered',
    location: '万象',
    description_zh: '货物已签收',
    description_en: 'Delivered',
    description_vi: 'Đã giao hàng',
    timestamp: '2024-01-15T15:00:00Z'
  });
  
  await db.insert('shipments', {
    tracking_number: 'SP20240088',
    sender_name: '王芳',
    sender_phone: '13900139002',
    receiver_name: 'SOMCHAI',
    receiver_phone: '+66-8-12345678',
    origin: '深圳',
    destination: '曼谷',
    service_code: 'thailand-sea',
    status: 'in_transit',
    goods_description: '纺织品',
    weight: 2000,
    volume: 15.0,
    estimated_delivery: '2024-02-20'
  });
  
  await db.insert('tracking_events', {
    shipment_id: 2,
    status: 'departed',
    location: '深圳盐田港',
    description_zh: '船舶已离港',
    description_en: 'Vessel departed',
    description_vi: 'Tàu đã rời cảng',
    timestamp: '2024-02-05T06:00:00Z'
  });
  
  await db.insert('tracking_events', {
    shipment_id: 2,
    status: 'in_transit',
    location: '南海',
    description_zh: '正在海上运输',
    description_en: 'In transit',
    description_vi: 'Đang vận chuyển trên biển',
    timestamp: '2024-02-10T12:00:00Z'
  });
  
  await db.insert('shipments', {
    tracking_number: 'SP20240156',
    sender_name: '张伟',
    sender_phone: '13700137003',
    receiver_name: 'TRAN VAN A',
    receiver_phone: '+84-91-2345678',
    origin: '广州',
    destination: '海防',
    service_code: 'vietnam-sea',
    status: 'pending',
    goods_description: '机械设备',
    weight: 3500,
    volume: 20.0,
    estimated_delivery: '2024-02-25'
  });
  
  await db.insert('news', {
    title_zh: '中老铁路开通两周年 恒慈国际贸易累计运输突破10万吨',
    title_en: 'China-Laos Railway 2nd Anniversary: CHONGQING HENGCI INTERNATIONAL TRADE CO., LTD. Transported Over 100,000 Tons',
    title_vi: 'Kỷ niệm 2 năm đường sắt Trung Quốc-Lào khai thác: CHONGQING HENGCI INTERNATIONAL TRADE CO., LTD. vận chuyển hơn 100.000 tấn',
    content_zh: '中老铁路开通两年来，恒慈国际贸易依托这条黄金运输线，累计运输货物突破10万吨大关，为中老贸易发展做出重要贡献。',
    content_en: 'Since the opening of the China-Laos Railway two years ago, CHONGQING HENGCI INTERNATIONAL TRADE CO., LTD. has transported over 100,000 tons of cargo via this golden transport route, making significant contributions to China-Laos trade development.',
    content_vi: 'Kể từ khi đường sắt Trung Quốc-Lào khai thác hai năm trước, CHONGQING HENGCI INTERNATIONAL TRADE CO., LTD. đã vận chuyển hơn 100.000 tấn hàng hóa qua tuyến đường vàng này, đóng góp quan trọng vào phát triển thương mại Trung Quốc-Lào.',
    category: 'company',
    publish_date: '2024-01-01'
  });
  
  await db.insert('news', {
    title_zh: '恒慈国际贸易新增越南海防港直航航线',
    title_en: 'CHONGQING HENGCI INTERNATIONAL TRADE CO., LTD. Adds Direct Route to Hai Phong Port',
    title_vi: 'CHONGQING HENGCI INTERNATIONAL TRADE CO., LTD. mở tuyến đường trực tiếp đến cảng Hải Phòng',
    content_zh: '为满足客户需求，恒慈国际贸易新增广州至越南海防港直航航线，运输时间缩短至5天。',
    content_en: 'To meet customer demands, CHONGQING HENGCI INTERNATIONAL TRADE CO., LTD. has added a direct shipping route from Guangzhou to Hai Phong Port, reducing transit time to 5 days.',
    content_vi: 'Để đáp ứng nhu cầu khách hàng, CHONGQING HENGCI INTERNATIONAL TRADE CO., LTD. đã mở tuyến đường vận chuyển trực tiếp từ Quảng Châu đến cảng Hải Phòng, giảm thời gian vận chuyển xuống còn 5 ngày.',
    category: 'service',
    publish_date: '2024-01-15'
  });
  
  await db.insert('news', {
    title_zh: '泰国新海关政策解读：2025年进口新规要点',
    title_en: 'Thailand New Customs Policy: Key Points of 2025 Import Regulations',
    title_vi: 'Giải thích chính sách hải quan mới của Thái Lan: Điểm chính của quy định nhập khẩu 2025',
    content_zh: '泰国将于2025年实施新的进口海关政策，涉及电子申报、关税调整等多个方面，企业需提前做好准备。',
    content_en: 'Thailand will implement new import customs policies in 2025, covering electronic declaration, tariff adjustments and other aspects. Enterprises need to prepare in advance.',
    content_vi: 'Thái Lan sẽ thực hiện chính sách hải quan nhập khẩu mới vào năm 2025, bao gồm khai báo điện tử, điều chỉnh thuế quan và các khía cạnh khác. Doanh nghiệp cần chuẩn bị sớm.',
    category: 'policy',
    publish_date: '2024-02-01'
  });
};

initData().catch(err => {
  console.error('初始化失败:', err);
  process.exit(1);
});