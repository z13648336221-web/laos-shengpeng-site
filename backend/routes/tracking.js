const express = require('express');
const router = express.Router();
const db = require('../models/database');

const getMessages = (lang) => {
  const messages = {
    zh: {
      not_found: '未找到运单号对应的货物信息',
      tracking_not_found: '运单号不存在',
      required: '缺少必填字段',
      event_added: '追踪事件添加成功',
      shipment_created: '运单创建成功',
      error: '服务器内部错误'
    },
    en: {
      not_found: 'No shipment information found for this tracking number',
      tracking_not_found: 'Tracking number does not exist',
      required: 'Missing required fields',
      event_added: 'Tracking event added successfully',
      shipment_created: 'Shipment created successfully',
      error: 'Internal server error'
    },
    vi: {
      not_found: 'Không tìm thấy thông tin vận đơn cho số theo dõi này',
      tracking_not_found: 'Số theo dõi không tồn tại',
      required: 'Thiếu trường bắt buộc',
      event_added: 'Thêm sự kiện theo dõi thành công',
      shipment_created: 'Tạo vận đơn thành công',
      error: 'Lỗi máy chủ nội bộ'
    }
  };
  return messages[lang] || messages.zh;
};

const getStatusLabel = (status, lang) => {
  const labels = {
    pending: { zh: '待处理', en: 'Pending', vi: 'Chờ xử lý' },
    picked_up: { zh: '已揽收', en: 'Picked Up', vi: 'Đã nhận hàng' },
    in_transit: { zh: '运输中', en: 'In Transit', vi: 'Đang vận chuyển' },
    departed: { zh: '已离港', en: 'Departed', vi: 'Đã rời cảng' },
    customs: { zh: '清关中', en: 'Customs', vi: 'Qua hải quan' },
    delivered: { zh: '已签收', en: 'Delivered', vi: 'Đã giao hàng' }
  };
  return labels[status] ? labels[status][lang] || status : status;
};

const getCityLabel = (cityCode) => {
  const labels = {
    'GZ': '广州', 'SZ': '深圳', 'KM': '昆明', 'DG': '东莞', 'FO': '佛山', 'YW': '义乌', 'SH': '上海', 'NJ': '宁波', 'CD': '成都', 'NB': '宁波',
    'VTE': '老挝·万象', 'LPQ': '老挝·琅勃拉邦', 'PKH': '老挝·巴色',
    'BKK': '泰国·曼谷', 'CM': '泰国·清迈', 'LCH': '泰国·林查班',
    'HCM': '越南·胡志明市', 'HAN': '越南·河内', 'DAD': '越南·岘港', 'HPH': '越南·海防'
  };
  return labels[cityCode] || cityCode;
};

router.get('/:trackingNo', async (req, res) => {
  try {
    const trackingNo = req.params.trackingNo.toUpperCase();
    const lang = req.lang || 'zh';
    const msg = getMessages(lang);
    
    let shipment = null;
    let isOrder = false;
    
    const shipments = await db.query('shipments');
    shipment = shipments.find(s => s.tracking_number === trackingNo);
    
    if (!shipment) {
      const orders = await db.query('orders');
      shipment = orders.find(o => o.tracking_number === trackingNo);
      isOrder = true;
    }
    
    if (!shipment) {
      return res.status(404).json({
        success: false,
        message: msg.not_found,
        data: null
      });
    }
    
    let timeline = [];
    
    if (!isOrder) {
      const events = await db.query('tracking_events');
      const shipmentEvents = events.filter(e => e.shipment_id === shipment.id);
      shipmentEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      timeline = shipmentEvents.map(event => ({
        time: event.timestamp,
        location: event.location,
        description: event[`description_${lang}`] || event.description_zh,
        status: event.status,
        status_label: getStatusLabel(event.status, lang)
      }));
    } else {
      if (shipment.timeline) {
        try {
          const orderTimeline = typeof shipment.timeline === 'string' ? JSON.parse(shipment.timeline) : shipment.timeline;
          timeline = orderTimeline.map(item => ({
            time: item.time,
            location: item.location || '',
            description: item.description || item.status_label || '',
            status: item.status,
            status_label: item.status_label || getStatusLabel(item.status, lang)
          }));
        } catch (e) {
          console.error('解析订单时间线失败:', e);
        }
      }
    }
    
    const cargo = isOrder ? {
      description: shipment.cargo_name,
      weight: shipment.weight,
      volume: shipment.volume,
      origin: getCityLabel(shipment.origin_city),
      destination: getCityLabel(shipment.dest_city),
      sender_name: shipment.sender_name,
      sender_phone: shipment.sender_phone,
      receiver_name: shipment.receiver_name,
      receiver_phone: shipment.receiver_phone
    } : {
      description: shipment.goods_description,
      weight: shipment.weight,
      volume: shipment.volume,
      origin: shipment.origin,
      destination: shipment.destination,
      sender_name: shipment.sender_name,
      sender_phone: shipment.sender_phone,
      receiver_name: shipment.receiver_name,
      receiver_phone: shipment.receiver_phone
    };
    
    res.json({
      success: true,
      data: {
        tracking_number: shipment.tracking_number,
        service_code: shipment.service_code,
        status: shipment.status,
        status_label: getStatusLabel(shipment.status, lang),
        estimated_delivery: shipment.estimated_delivery,
        cargo: cargo,
        timeline: timeline
      }
    });
  } catch (err) {
    console.error('查询追踪信息失败:', err);
    const msg = getMessages(req.lang || 'zh');
    res.status(500).json({ success: false, message: msg.error });
  }
});

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    let shipments = await db.query('shipments');
    shipments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    const offset = (page - 1) * limit;
    const paginatedData = shipments.slice(offset, offset + parseInt(limit));
    
    res.json({
      success: true,
      data: paginatedData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: shipments.length
      }
    });
  } catch (err) {
    console.error('查询运单列表失败:', err);
    const msg = getMessages(req.lang || 'zh');
    res.status(500).json({ success: false, message: msg.error });
  }
});

router.post('/', async (req, res) => {
  try {
    const lang = req.lang || 'zh';
    const msg = getMessages(lang);
    const { tracking_number, sender_name, sender_phone, receiver_name, receiver_phone, origin, destination, service_code, status, goods_description, weight, volume, estimated_delivery } = req.body;
    
    if (!tracking_number || !origin || !destination || !service_code || !status) {
      return res.status(400).json({ success: false, message: msg.required });
    }
    
    const result = await db.insert('shipments', {
      tracking_number,
      sender_name,
      sender_phone,
      receiver_name,
      receiver_phone,
      origin,
      destination,
      service_code,
      status,
      goods_description,
      weight,
      volume,
      estimated_delivery
    });
    
    res.status(201).json({
      success: true,
      message: msg.shipment_created,
      shipment_id: result.lastID
    });
  } catch (err) {
    console.error('创建运单失败:', err);
    const msg = getMessages(req.lang || 'zh');
    res.status(500).json({ success: false, message: msg.error });
  }
});

router.post('/:trackingNo/events', async (req, res) => {
  try {
    const trackingNo = req.params.trackingNo.toUpperCase();
    const lang = req.lang || 'zh';
    const msg = getMessages(lang);
    const { status, location, description_zh, description_en, description_vi, timestamp } = req.body;
    
    if (!status || !location || !description_zh) {
      return res.status(400).json({ success: false, message: msg.required });
    }
    
    const shipments = await db.query('shipments');
    const shipment = shipments.find(s => s.tracking_number === trackingNo);
    
    if (!shipment) {
      return res.status(404).json({ success: false, message: msg.tracking_not_found });
    }
    
    const result = await db.insert('tracking_events', {
      shipment_id: shipment.id,
      status,
      location,
      description_zh,
      description_en: description_en || description_zh,
      description_vi: description_vi || description_zh,
      timestamp: timestamp || new Date().toISOString()
    });
    
    res.status(201).json({
      success: true,
      message: msg.event_added,
      event_id: result.lastID
    });
  } catch (err) {
    console.error('添加追踪事件失败:', err);
    const msg = getMessages(req.lang || 'zh');
    res.status(500).json({ success: false, message: msg.error });
  }
});

module.exports = router;