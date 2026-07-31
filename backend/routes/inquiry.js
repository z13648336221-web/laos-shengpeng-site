const express = require('express');
const router = express.Router();
const db = require('../models/database');
const Joi = require('joi');
const { authMiddleware } = require('../middleware/auth');

const getMessages = (lang) => {
  const messages = {
    zh: {
      success: '询价请求提交成功，我们的客服将在30分钟内联系您！',
      required: '缺少必填字段',
      invalid_phone: '请输入有效的手机号码',
      invalid_weight: '重量必须大于0',
      not_found: '询价记录不存在',
      invalid_status: '无效的状态值',
      status_updated: '状态更新成功',
      deleted: '删除成功',
      error: '服务器内部错误'
    },
    en: {
      success: 'Inquiry request submitted successfully! Our customer service will contact you within 30 minutes.',
      required: 'Missing required fields',
      invalid_phone: 'Please enter a valid phone number',
      invalid_weight: 'Weight must be greater than 0',
      not_found: 'Inquiry record not found',
      invalid_status: 'Invalid status value',
      status_updated: 'Status updated successfully',
      deleted: 'Deleted successfully',
      error: 'Internal server error'
    },
    vi: {
      success: 'Yêu cầu báo giá đã được gửi! Bộ phận chăm sóc khách hàng của chúng tôi sẽ liên hệ với bạn trong 30 phút.',
      required: 'Thiếu trường bắt buộc',
      invalid_phone: 'Vui lòng nhập số điện thoại hợp lệ',
      invalid_weight: 'Trọng lượng phải lớn hơn 0',
      not_found: 'Không tìm thấy bản ghi báo giá',
      invalid_status: 'Giá trị trạng thái không hợp lệ',
      status_updated: 'Cập nhật trạng thái thành công',
      deleted: 'Xóa thành công',
      error: 'Lỗi máy chủ nội bộ'
    }
  };
  return messages[lang] || messages.zh;
};

router.post('/', async (req, res) => {
  try {
    const lang = req.lang || 'zh';
    const msg = getMessages(lang);
    
    const schema = Joi.object({
      transport_type: Joi.string().valid('rail', 'road', 'thai-rail', 'viet-rail', 'thai', 'viet').required().messages({
        'any.required': msg.required,
        'any.only': '请选择有效的运输方式'
      }),
      origin_city: Joi.string().required().messages({ 'any.required': msg.required }),
      dest_city: Joi.string().required().messages({ 'any.required': msg.required }),
      cargo_name: Joi.string().min(2).max(50).required().messages({ 'any.required': msg.required }),
      weight: Joi.number().min(1).max(999999).required().messages({ 
        'any.required': msg.required,
        'number.min': msg.invalid_weight 
      }),
      volume: Joi.number().min(0).max(9999).optional(),
      need_customs: Joi.string().valid('yes', 'no').default('no'),
      need_insurance: Joi.string().valid('yes', 'no').default('no'),
      contact_name: Joi.string().min(2).max(20).required().messages({ 'any.required': msg.required }),
      contact_phone: Joi.string().pattern(/^1[3-9]\d{9}$/).required().messages({ 
        'any.required': msg.required,
        'string.pattern.base': msg.invalid_phone 
      }),
      contact_email: Joi.string().email().allow('').optional(),
      company_name: Joi.string().max(100).allow('').optional(),
      remark: Joi.string().max(500).allow('').optional()
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { transport_type, origin_city, dest_city, cargo_name, weight, volume, need_customs, need_insurance, contact_name, contact_phone, contact_email, company_name, remark } = value;

    const result = await db.run(`
      INSERT INTO inquiries (transport_type, origin_city, dest_city, cargo_name, weight, volume, need_customs, need_insurance, contact_name, contact_phone, contact_email, company_name, remark, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [transport_type, origin_city, dest_city, cargo_name, weight, volume || 0, need_customs, need_insurance, contact_name, contact_phone, contact_email, company_name, remark, 'pending']);

    res.status(201).json({
      success: true,
      message: msg.success,
      inquiry_id: result.lastID
    });
  } catch (err) {
    console.error('询价提交失败:', err);
    const msg = getMessages(req.lang || 'zh');
    res.status(500).json({ success: false, message: msg.error });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    let inquiries = await db.query('inquiries');
    
    if (status) {
      inquiries = inquiries.filter(item => item.status === status);
    }
    
    inquiries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    const offset = (page - 1) * limit;
    const paginatedData = inquiries.slice(offset, offset + parseInt(limit));
    
    res.json({
      success: true,
      data: paginatedData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: inquiries.length
      }
    });
  } catch (err) {
    console.error('查询询价列表失败:', err);
    const msg = getMessages(req.lang || 'zh');
    res.status(500).json({ success: false, message: msg.error });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const lang = req.lang || 'zh';
    const msg = getMessages(lang);
    const inquiry = await db.get('inquiries', { id: parseInt(req.params.id) });
    
    if (!inquiry) {
      return res.status(404).json({ success: false, message: msg.not_found });
    }
    
    res.json({ success: true, data: inquiry });
  } catch (err) {
    console.error('查询询价详情失败:', err);
    const msg = getMessages(req.lang || 'zh');
    res.status(500).json({ success: false, message: msg.error });
  }
});

router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    const lang = req.lang || 'zh';
    const msg = getMessages(lang);
    const { status } = req.body;
    
    if (!['pending', 'processing', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: msg.invalid_status });
    }
    
    const inquiries = await db.query('inquiries');
    const inquiry = inquiries.find(item => item.id === parseInt(req.params.id));
    
    if (!inquiry) {
      return res.status(404).json({ success: false, message: msg.not_found });
    }
    
    inquiry.status = status;
    await db.run('UPDATE inquiries SET status = ? WHERE id = ?', [status, parseInt(req.params.id)]);
    
    res.json({ success: true, message: msg.status_updated });
  } catch (err) {
    console.error('更新询价状态失败:', err);
    const msg = getMessages(req.lang || 'zh');
    res.status(500).json({ success: false, message: msg.error });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const lang = req.lang || 'zh';
    const msg = getMessages(lang);
    const result = await db.run('DELETE FROM inquiries WHERE id = ?', [req.params.id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: msg.not_found });
    }
    
    res.json({ success: true, message: msg.deleted });
  } catch (err) {
    console.error('删除询价记录失败:', err);
    const msg = getMessages(req.lang || 'zh');
    res.status(500).json({ success: false, message: msg.error });
  }
});

module.exports = router;