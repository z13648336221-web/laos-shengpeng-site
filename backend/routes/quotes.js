const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authMiddleware } = require('../middleware/auth');

const getMessages = (lang) => {
  const messages = {
    zh: {
      not_found: '报价不存在',
      required: '缺少必填字段',
      created: '报价创建成功',
      updated: '报价更新成功',
      deleted: '删除成功',
      error: '服务器内部错误'
    },
    en: {
      not_found: 'Quote not found',
      required: 'Missing required fields',
      created: 'Quote created successfully',
      updated: 'Quote updated successfully',
      deleted: 'Deleted successfully',
      error: 'Internal server error'
    },
    vi: {
      not_found: 'Báo giá không tồn tại',
      required: 'Thiếu trường bắt buộc',
      created: 'Tạo báo giá thành công',
      updated: 'Cập nhật báo giá thành công',
      deleted: 'Xóa thành công',
      error: 'Lỗi máy chủ nội bộ'
    }
  };
  return messages[lang] || messages.zh;
};

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, service_code, lang = 'zh' } = req.query;
    
    let quotes = await db.query('quotes');
    
    if (service_code) {
      quotes = quotes.filter(item => item.service_code === service_code);
    }
    
    quotes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    const offset = (page - 1) * limit;
    const paginatedData = quotes.slice(offset, offset + parseInt(limit)).map(quote => ({
      id: quote.id,
      name: quote.name,
      service_code: quote.service_code,
      service_label: getServiceLabel(quote.service_code, lang),
      origin_city: quote.origin_city,
      dest_city: quote.dest_city,
      min_weight: quote.min_weight,
      max_weight: quote.max_weight,
      base_price: quote.base_price,
      price_unit: quote.price_unit,
      transit_days: quote.transit_days,
      valid_days: quote.valid_days,
      status: quote.status,
      status_label: quote.status === 'active' ? (lang === 'zh' ? '启用' : lang === 'en' ? 'Active' : 'Kích hoạt') : (lang === 'zh' ? '停用' : lang === 'en' ? 'Inactive' : 'Không kích hoạt'),
      remarks: quote.remarks,
      created_at: quote.created_at
    }));
    
    res.json({
      success: true,
      data: paginatedData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: quotes.length
      }
    });
  } catch (err) {
    console.error('查询报价列表失败:', err);
    const msg = getMessages(req.lang || 'zh');
    res.status(500).json({ success: false, message: msg.error });
  }
});

router.get('/calculate', async (req, res) => {
  try {
    const { service_code, weight, volume, need_customs, need_insurance, lang = 'zh' } = req.query;
    
    const quotes = await db.query('quotes');
    const matchingQuote = quotes.find(q => 
      q.service_code === service_code && 
      q.status === 'active' &&
      (!q.min_weight || weight >= q.min_weight) &&
      (!q.max_weight || weight <= q.max_weight)
    );
    
    if (!matchingQuote) {
      return res.status(404).json({ success: false, message: '未找到匹配的报价方案' });
    }
    
    let price = 0;
    const calcVolume = Math.max(parseFloat(volume) || 0, parseFloat(weight) / 1000);
    
    if (matchingQuote.price_unit === 'KG') {
      price = parseFloat(weight) * matchingQuote.base_price;
    } else {
      price = calcVolume * matchingQuote.base_price;
    }
    
    if (need_customs === 'yes' && matchingQuote.customs_fee) {
      price += parseFloat(matchingQuote.customs_fee);
    }
    
    if (need_insurance === 'yes' && matchingQuote.insurance_rate) {
      const estimatedValue = price * 10;
      price += estimatedValue * parseFloat(matchingQuote.insurance_rate);
    }
    
    res.json({
      success: true,
      data: {
        service_code: matchingQuote.service_code,
        service_label: getServiceLabel(matchingQuote.service_code, lang),
        base_price: matchingQuote.base_price,
        price_unit: matchingQuote.price_unit,
        calculated_price: Math.round(price),
        transit_days: matchingQuote.transit_days,
        valid_days: matchingQuote.valid_days,
        includes_customs: need_customs === 'yes',
        includes_insurance: need_insurance === 'yes'
      }
    });
  } catch (err) {
    console.error('计算报价失败:', err);
    res.status(500).json({ success: false, message: '计算失败' });
  }
});

router.get('/history', authMiddleware, async (req, res) => {
  try {
    let quotes = await db.query('quotes');
    
    const history = quotes
      .filter(q => q.inquiry_id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    res.json({
      success: true,
      data: history
    });
  } catch (err) {
    console.error('查询报价历史失败:', err);
    res.status(500).json({ success: false, message: '查询失败' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { lang = 'zh' } = req.query;
    const msg = getMessages(lang);
    const quote = await db.get('quotes', { id: parseInt(req.params.id) });
    
    if (!quote) {
      return res.status(404).json({ success: false, message: msg.not_found });
    }
    
    res.json({ 
      success: true, 
      data: {
        id: quote.id,
        name: quote.name,
        service_code: quote.service_code,
        service_label: getServiceLabel(quote.service_code, lang),
        origin_city: quote.origin_city,
        dest_city: quote.dest_city,
        min_weight: quote.min_weight,
        max_weight: quote.max_weight,
        base_price: quote.base_price,
        price_unit: quote.price_unit,
        customs_fee: quote.customs_fee,
        insurance_rate: quote.insurance_rate,
        transit_days: quote.transit_days,
        valid_days: quote.valid_days,
        status: quote.status,
        remarks: quote.remarks,
        created_at: quote.created_at,
        updated_at: quote.updated_at
      } 
    });
  } catch (err) {
    console.error('查询报价详情失败:', err);
    const msg = getMessages(req.lang || 'zh');
    res.status(500).json({ success: false, message: msg.error });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const lang = req.lang || 'zh';
    const msg = getMessages(lang);
    const { 
      name, service_code, origin_city, dest_city, 
      min_weight, max_weight, base_price, price_unit,
      customs_fee, insurance_rate, transit_days, valid_days, remarks 
    } = req.body;
    
    if (!name || !service_code || !base_price) {
      return res.status(400).json({ success: false, message: msg.required });
    }
    
    const result = await db.insert('quotes', {
      name,
      service_code,
      origin_city: origin_city || '',
      dest_city: dest_city || '',
      min_weight: parseFloat(min_weight) || null,
      max_weight: parseFloat(max_weight) || null,
      base_price: parseFloat(base_price),
      price_unit: price_unit || 'CBM',
      customs_fee: parseFloat(customs_fee) || null,
      insurance_rate: parseFloat(insurance_rate) || null,
      transit_days: parseInt(transit_days) || null,
      valid_days: parseInt(valid_days) || 7,
      status: 'active',
      remarks: remarks || ''
    });
    
    res.status(201).json({
      success: true,
      message: msg.created,
      quote_id: result.lastID
    });
  } catch (err) {
    console.error('创建报价失败:', err);
    const msg = getMessages(req.lang || 'zh');
    res.status(500).json({ success: false, message: msg.error });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const lang = req.lang || 'zh';
    const msg = getMessages(lang);
    const { 
      name, service_code, origin_city, dest_city, 
      min_weight, max_weight, base_price, price_unit,
      customs_fee, insurance_rate, transit_days, valid_days, status, remarks 
    } = req.body;
    
    const quote = await db.get('quotes', { id: parseInt(req.params.id) });
    if (!quote) {
      return res.status(404).json({ success: false, message: msg.not_found });
    }
    
    const updates = {};
    if (name) updates.name = name;
    if (service_code) updates.service_code = service_code;
    if (origin_city !== undefined) updates.origin_city = origin_city;
    if (dest_city !== undefined) updates.dest_city = dest_city;
    if (min_weight !== undefined) updates.min_weight = parseFloat(min_weight) || null;
    if (max_weight !== undefined) updates.max_weight = parseFloat(max_weight) || null;
    if (base_price !== undefined) updates.base_price = parseFloat(base_price);
    if (price_unit) updates.price_unit = price_unit;
    if (customs_fee !== undefined) updates.customs_fee = parseFloat(customs_fee) || null;
    if (insurance_rate !== undefined) updates.insurance_rate = parseFloat(insurance_rate) || null;
    if (transit_days !== undefined) updates.transit_days = parseInt(transit_days) || null;
    if (valid_days !== undefined) updates.valid_days = parseInt(valid_days);
    if (status) updates.status = status;
    if (remarks !== undefined) updates.remarks = remarks;
    updates.updated_at = new Date().toISOString();
    
    await db.update('quotes', { id: parseInt(req.params.id) }, updates);
    
    res.json({ success: true, message: msg.updated });
  } catch (err) {
    console.error('更新报价失败:', err);
    const msg = getMessages(req.lang || 'zh');
    res.status(500).json({ success: false, message: msg.error });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const lang = req.lang || 'zh';
    const msg = getMessages(lang);
    const result = await db.deleteRow('quotes', { id: parseInt(req.params.id) });
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: msg.not_found });
    }
    
    res.json({ success: true, message: msg.deleted });
  } catch (err) {
    console.error('删除报价失败:', err);
    const msg = getMessages(req.lang || 'zh');
    res.status(500).json({ success: false, message: msg.error });
  }
});

function getServiceLabel(serviceCode, lang) {
  const labels = {
    'railway': { zh: '🚂 中老铁路陆运', en: '🚂 Laos-China Railway', vi: '🚂 Đường sắt Trung-Lào' },
    'road': { zh: '🚛 中老公路运输', en: '🚛 China-Laos Road Transport', vi: '🚛 Vận chuyển đường bộ Trung-Lào' },
    'thai-rail': { zh: '🚂 中老泰铁路联运', en: '🚂 China-Laos-Thailand Rail', vi: '🚂 Liên vận đường sắt Trung-Lào-Thái' },
    'viet-rail': { zh: '🚂 中越铁路', en: '🚂 China-Vietnam Railway', vi: '🚂 Đường sắt Trung-Việt' },
    'thailand-sea': { zh: '🚢 泰国海运', en: '🚢 Thailand Sea Freight', vi: '🚢 Vận chuyển biển Thái Lan' },
    'vietnam-sea': { zh: '⚓ 越南海运', en: '⚓ Vietnam Sea Freight', vi: '⚓ Vận chuyển biển Việt Nam' }
  };
  return labels[serviceCode] ? labels[serviceCode][lang] || serviceCode : serviceCode;
}

module.exports = router;