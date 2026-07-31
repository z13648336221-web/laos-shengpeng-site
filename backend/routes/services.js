const express = require('express');
const router = express.Router();
const db = require('../models/database');

const getMessages = (lang) => {
  const messages = {
    zh: {
      not_found: '服务不存在',
      required: '缺少必填字段（代码和中文名称）',
      created: '服务创建成功',
      updated: '服务更新成功',
      deleted: '删除成功',
      error: '服务器内部错误'
    },
    en: {
      not_found: 'Service not found',
      required: 'Missing required fields (code and Chinese name)',
      created: 'Service created successfully',
      updated: 'Service updated successfully',
      deleted: 'Deleted successfully',
      error: 'Internal server error'
    },
    vi: {
      not_found: 'Dịch vụ không tồn tại',
      required: 'Thiếu trường bắt buộc (mã và tên tiếng Trung)',
      created: 'Tạo dịch vụ thành công',
      updated: 'Cập nhật dịch vụ thành công',
      deleted: 'Xóa thành công',
      error: 'Lỗi máy chủ nội bộ'
    }
  };
  return messages[lang] || messages.zh;
};

router.get('/', async (req, res) => {
  try {
    const { lang = 'zh' } = req.query;
    
    let services = await db.query('services');
    services.sort((a, b) => (a.priority || 0) - (b.priority || 0));
    
    const result = services.map(service => {
      let features = [];
      if (service.features) {
        try {
          features = JSON.parse(service.features);
        } catch {
          features = service.features.split(',').map(f => f.trim());
        }
      }
      
      return {
        id: service.id,
        code: service.code,
        name: service[`name_${lang}`] || service.name_zh,
        description: service[`description_${lang}`] || service.description_zh,
        base_price: service.base_price,
        min_price: service.min_price,
        max_price: service.max_price,
        customs_fee: service.customs_fee,
        insurance_rate: service.insurance_rate,
        transit_days: service.transit_days,
        features: features,
        image_url: service.image_url,
        priority: service.priority
      };
    });
    
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('查询服务列表失败:', err);
    const msg = getMessages(req.lang || 'zh');
    res.status(500).json({ success: false, message: msg.error });
  }
});

router.get('/:code', async (req, res) => {
  try {
    const { lang = 'zh' } = req.query;
    const msg = getMessages(lang);
    const services = await db.query('services');
    const service = services.find(s => s.code === req.params.code);
    
    if (!service) {
      return res.status(404).json({ success: false, message: msg.not_found });
    }
    
    let features = [];
    if (service.features) {
      try {
        features = JSON.parse(service.features);
      } catch {
        features = service.features.split(',').map(f => f.trim());
      }
    }
    
    res.json({ 
      success: true, 
      data: {
        id: service.id,
        code: service.code,
        name: service[`name_${lang}`] || service.name_zh,
        description: service[`description_${lang}`] || service.description_zh,
        base_price: service.base_price,
        min_price: service.min_price,
        max_price: service.max_price,
        customs_fee: service.customs_fee,
        insurance_rate: service.insurance_rate,
        transit_days: service.transit_days,
        features: features,
        image_url: service.image_url,
        priority: service.priority
      } 
    });
  } catch (err) {
    console.error('查询服务详情失败:', err);
    const msg = getMessages(req.lang || 'zh');
    res.status(500).json({ success: false, message: msg.error });
  }
});

router.post('/', async (req, res) => {
  try {
    const lang = req.lang || 'zh';
    const msg = getMessages(lang);
    const { code, name_zh, name_en, name_vi, description_zh, description_en, description_vi, base_price, min_price, max_price, customs_fee, insurance_rate, transit_days, features, image_url, priority } = req.body;
    
    if (!code || !name_zh) {
      return res.status(400).json({ success: false, message: msg.required });
    }
    
    const featuresJson = typeof features === 'string' ? features : JSON.stringify(features || []);
    
    const result = await db.run(`
      INSERT INTO services (code, name_zh, name_en, name_vi, description_zh, description_en, description_vi, base_price, min_price, max_price, customs_fee, insurance_rate, transit_days, features, image_url, priority)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [code, name_zh, name_en, name_vi, description_zh, description_en, description_vi, base_price, min_price, max_price, customs_fee, insurance_rate, transit_days, featuresJson, image_url, priority || 0]);
    
    res.status(201).json({
      success: true,
      message: msg.created,
      service_id: result.lastID
    });
  } catch (err) {
    console.error('创建服务失败:', err);
    const msg = getMessages(req.lang || 'zh');
    res.status(500).json({ success: false, message: msg.error });
  }
});

router.put('/:code', async (req, res) => {
  try {
    const lang = req.lang || 'zh';
    const msg = getMessages(lang);
    const { name_zh, name_en, name_vi, description_zh, description_en, description_vi, base_price, min_price, max_price, customs_fee, insurance_rate, transit_days, features, image_url, priority } = req.body;
    
    const services = await db.query('services');
    const service = services.find(s => s.code === req.params.code);
    
    if (!service) {
      return res.status(404).json({ success: false, message: msg.not_found });
    }
    
    Object.assign(service, {
      name_zh, name_en, name_vi, description_zh, description_en, description_vi, 
      base_price, min_price, max_price, customs_fee, insurance_rate, transit_days, 
      features: typeof features === 'string' ? features : JSON.stringify(features || []), 
      image_url, priority: priority || 0
    });
    
    res.json({ success: true, message: msg.updated });
  } catch (err) {
    console.error('更新服务失败:', err);
    const msg = getMessages(req.lang || 'zh');
    res.status(500).json({ success: false, message: msg.error });
  }
});

router.delete('/:code', async (req, res) => {
  try {
    const lang = req.lang || 'zh';
    const msg = getMessages(lang);
    const result = await db.run('DELETE FROM services WHERE code = ?', [req.params.code]);
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: msg.not_found });
    }
    
    res.json({ success: true, message: msg.deleted });
  } catch (err) {
    console.error('删除服务失败:', err);
    const msg = getMessages(req.lang || 'zh');
    res.status(500).json({ success: false, message: msg.error });
  }
});

module.exports = router;