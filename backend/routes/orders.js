const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authMiddleware } = require('../middleware/auth');

const getMessages = (lang) => {
  const messages = {
    zh: {
      not_found: '订单不存在',
      required: '缺少必填字段',
      created: '订单创建成功',
      updated: '订单更新成功',
      deleted: '删除成功',
      error: '服务器内部错误'
    },
    en: {
      not_found: 'Order not found',
      required: 'Missing required fields',
      created: 'Order created successfully',
      updated: 'Order updated successfully',
      deleted: 'Deleted successfully',
      error: 'Internal server error'
    },
    vi: {
      not_found: 'Đơn hàng không tồn tại',
      required: 'Thiếu trường bắt buộc',
      created: 'Tạo đơn hàng thành công',
      updated: 'Cập nhật đơn hàng thành công',
      deleted: 'Xóa thành công',
      error: 'Lỗi máy chủ nội bộ'
    }
  };
  return messages[lang] || messages.zh;
};

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, keyword, lang = 'zh' } = req.query;
    
    let orders = await db.query('orders');
    
    if (status) {
      orders = orders.filter(item => item.status === status);
    }
    
    if (keyword) {
      const kw = keyword.toLowerCase();
      orders = orders.filter(item => 
        item.tracking_number?.toLowerCase().includes(kw) ||
        item.cargo_name?.toLowerCase().includes(kw) ||
        item.contact_name?.toLowerCase().includes(kw) ||
        item.contact_phone?.includes(kw)
      );
    }
    
    orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    const offset = (page - 1) * limit;
    const paginatedData = orders.slice(offset, offset + parseInt(limit)).map(order => ({
      id: order.id,
      tracking_number: order.tracking_number,
      service_code: order.service_code,
      service_label: getServiceLabel(order.service_code, lang),
      status: order.status,
      status_label: getStatusLabel(order.status, lang),
      cargo_name: order.cargo_name,
      weight: order.weight,
      origin_city: order.origin_city,
      dest_city: order.dest_city,
      contact_name: order.contact_name,
      contact_phone: order.contact_phone,
      estimated_delivery: order.estimated_delivery,
      created_at: order.created_at
    }));
    
    res.json({
      success: true,
      data: paginatedData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: orders.length
      }
    });
  } catch (err) {
    console.error('查询订单列表失败:', err);
    const msg = getMessages(req.lang || 'zh');
    res.status(500).json({ success: false, message: msg.error });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { lang = 'zh' } = req.query;
    const msg = getMessages(lang);
    const order = await db.get('orders', { id: parseInt(req.params.id) });
    
    if (!order) {
      return res.status(404).json({ success: false, message: msg.not_found });
    }
    
    res.json({ 
      success: true, 
      data: {
        id: order.id,
        tracking_number: order.tracking_number,
        service_code: order.service_code,
        service_label: getServiceLabel(order.service_code, lang),
        status: order.status,
        status_label: getStatusLabel(order.status, lang),
        cargo_name: order.cargo_name,
        cargo_type: order.cargo_type,
        weight: order.weight,
        volume: order.volume,
        load_type: order.load_type,
        origin_city: order.origin_city,
        origin_label: getCityLabel(order.origin_city),
        dest_city: order.dest_city,
        dest_label: getCityLabel(order.dest_city),
        sender_name: order.sender_name,
        sender_phone: order.sender_phone,
        receiver_name: order.receiver_name,
        receiver_phone: order.receiver_phone,
        receiver_address: order.receiver_address,
        contact_name: order.contact_name,
        contact_phone: order.contact_phone,
        estimated_delivery: order.estimated_delivery,
        actual_delivery: order.actual_delivery,
        timeline: order.timeline ? JSON.parse(order.timeline) : [],
        remarks: order.remarks,
        created_at: order.created_at,
        updated_at: order.updated_at
      } 
    });
  } catch (err) {
    console.error('查询订单详情失败:', err);
    const msg = getMessages(req.lang || 'zh');
    res.status(500).json({ success: false, message: msg.error });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const lang = req.lang || 'zh';
    const msg = getMessages(lang);
    const { 
      service_code, cargo_name, weight, origin_city, dest_city,
      contact_name, contact_phone, sender_name, sender_phone,
      receiver_name, receiver_phone, receiver_address,
      cargo_type, volume, load_type, estimated_delivery, remarks 
    } = req.body;
    
    if (!service_code || !cargo_name || !weight || !origin_city || !dest_city) {
      return res.status(400).json({ success: false, message: msg.required });
    }
    
    const trackingNumber = generateTrackingNumber();
    
    const timeline = JSON.stringify([{
      time: new Date().toISOString(),
      status: 'pending',
      status_label: lang === 'zh' ? '订单已创建' : lang === 'en' ? 'Order created' : 'Đơn hàng đã tạo',
      description: lang === 'zh' ? '您的订单已成功创建，等待揽收' : lang === 'en' ? 'Your order has been created successfully, awaiting pickup' : 'Đơn hàng của bạn đã được tạo thành công, chờ lấy hàng',
      location: ''
    }]);
    
    const result = await db.run(`
      INSERT INTO orders (
        tracking_number, service_code, status, cargo_name, cargo_type, 
        weight, volume, load_type, origin_city, dest_city,
        sender_name, sender_phone, receiver_name, receiver_phone, receiver_address,
        contact_name, contact_phone, estimated_delivery, remarks, timeline
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      trackingNumber, service_code, 'pending', cargo_name, cargo_type || 'general',
      weight, volume || 0, load_type || 'lcl', origin_city, dest_city,
      sender_name, sender_phone, receiver_name, receiver_phone, receiver_address,
      contact_name, contact_phone, estimated_delivery, remarks || '', timeline
    ]);
    
    res.status(201).json({
      success: true,
      message: msg.created,
      order_id: result.lastID,
      tracking_number: trackingNumber
    });
  } catch (err) {
    console.error('创建订单失败:', err);
    const msg = getMessages(req.lang || 'zh');
    res.status(500).json({ success: false, message: msg.error });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const lang = req.lang || 'zh';
    const msg = getMessages(lang);
    const { status, estimated_delivery, remarks, remark, location } = req.body;
    const updateRemarks = remarks !== undefined ? remarks : (remark !== undefined ? remark : undefined);
    
    const order = await db.get('orders', { id: parseInt(req.params.id) });
    if (!order) {
      return res.status(404).json({ success: false, message: msg.not_found });
    }
    
    const updates = [];
    const params = [];
    
    if (status && status !== order.status) {
      updates.push('status = ?');
      params.push(status);
      
      const timeline = typeof order.timeline === 'string' ? JSON.parse(order.timeline) : (order.timeline || []);
      const statusDescriptions = {
        pending: { zh: '订单已创建', en: 'Order created', vi: 'Đơn hàng đã tạo' },
        picked_up: { zh: '已揽收', en: 'Picked up', vi: 'Đã lấy hàng' },
        in_transit: { zh: '运输中', en: 'In transit', vi: 'Đang vận chuyển' },
        departed: { zh: '已离港', en: 'Departed', vi: 'Đã đi khỏi cảng' },
        customs: { zh: '清关中', en: 'Customs clearance', vi: 'Đang khai thác hải quan' },
        delivered: { zh: '已签收', en: 'Delivered', vi: 'Đã giao' },
        cancelled: { zh: '已取消', en: 'Cancelled', vi: 'Đã hủy' }
      };
      
      const desc = statusDescriptions[status] || { zh: status, en: status, vi: status };
      timeline.unshift({
        time: new Date().toISOString(),
        status: status,
        status_label: desc[lang],
        description: lang === 'zh' ? `订单状态更新为：${desc.zh}` : lang === 'en' ? `Order status updated to: ${desc.en}` : `Trạng thái đơn hàng đã cập nhật: ${desc.vi}`,
        location: location || ''
      });
      
      updates.push('timeline = ?');
      params.push(JSON.stringify(timeline));
      
      if (status === 'delivered') {
        updates.push('actual_delivery = ?');
        params.push(new Date().toISOString());
      }
    }
    
    if (estimated_delivery) {
      updates.push('estimated_delivery = ?');
      params.push(estimated_delivery);
    }
    
    if (updateRemarks !== undefined) {
      updates.push('remarks = ?');
      params.push(updateRemarks);
    }
    
    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    
    params.push(req.params.id);
    
    await db.run(`UPDATE orders SET ${updates.join(', ')} WHERE id = ?`, params);
    
    res.json({ success: true, message: msg.updated });
  } catch (err) {
    console.error('更新订单失败:', err);
    const msg = getMessages(req.lang || 'zh');
    res.status(500).json({ success: false, message: msg.error });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const lang = req.lang || 'zh';
    const msg = getMessages(lang);
    const result = await db.run('DELETE FROM orders WHERE id = ?', [req.params.id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: msg.not_found });
    }
    
    res.json({ success: true, message: msg.deleted });
  } catch (err) {
    console.error('删除订单失败:', err);
    const msg = getMessages(req.lang || 'zh');
    res.status(500).json({ success: false, message: msg.error });
  }
});

function generateTrackingNumber() {
  const prefix = 'SP';
  const year = new Date().getFullYear().toString().slice(-2);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${year}${random}`;
}

function getServiceLabel(serviceCode, lang) {
  const labels = {
    'railway': { zh: '🚂 中老铁路陆运', en: '🚂 Laos-China Railway', vi: '🚂 Đường sắt Trung-Lào' },
    'thailand-sea': { zh: '🚢 泰国海运', en: '🚢 Thailand Sea Freight', vi: '🚢 Vận chuyển biển Thái Lan' },
    'vietnam-sea': { zh: '⚓ 越南海运', en: '⚓ Vietnam Sea Freight', vi: '⚓ Vận chuyển biển Việt Nam' }
  };
  return labels[serviceCode] ? labels[serviceCode][lang] || serviceCode : serviceCode;
}

function getStatusLabel(status, lang) {
  const labels = {
    pending: { zh: '○ 待发运', en: '○ Pending', vi: '○ Chờ giao' },
    picked_up: { zh: '● 已揽收', en: '● Picked Up', vi: '● Đã lấy hàng' },
    in_transit: { zh: '● 运输中', en: '● In Transit', vi: '● Đang vận chuyển' },
    departed: { zh: '● 已离港', en: '● Departed', vi: '● Đã đi khỏi cảng' },
    customs: { zh: '● 清关中', en: '● Customs', vi: '● Đang khai thác' },
    delivered: { zh: '✓ 已签收', en: '✓ Delivered', vi: '✓ Đã giao' },
    cancelled: { zh: '✕ 已取消', en: '✕ Cancelled', vi: '✕ Đã hủy' }
  };
  return labels[status] ? labels[status][lang] || status : status;
}

function getCityLabel(cityCode) {
  const labels = {
    'GZ': '广州', 'SZ': '深圳', 'KM': '昆明', 'DG': '东莞', 'FO': '佛山', 'YW': '义乌', 'SH': '上海', 'NJ': '宁波',
    'VTE': '老挝·万象', 'LPQ': '老挝·琅勃拉邦', 'BKK': '泰国·曼谷', 'CM': '泰国·清迈',
    'HCM': '越南·胡志明市', 'HAN': '越南·河内', 'DAN': '越南·岘港'
  };
  return labels[cityCode] || cityCode;
}

module.exports = router;