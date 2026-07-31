const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authMiddleware } = require('../middleware/auth');

const getMessages = (lang) => {
  const messages = {
    zh: {
      not_found: '客户不存在',
      required: '缺少必填字段',
      created: '客户创建成功',
      updated: '客户更新成功',
      deleted: '删除成功',
      error: '服务器内部错误'
    },
    en: {
      not_found: 'Customer not found',
      required: 'Missing required fields',
      created: 'Customer created successfully',
      updated: 'Customer updated successfully',
      deleted: 'Deleted successfully',
      error: 'Internal server error'
    },
    vi: {
      not_found: 'Khách hàng không tồn tại',
      required: 'Thiếu trường bắt buộc',
      created: 'Tạo khách hàng thành công',
      updated: 'Cập nhật khách hàng thành công',
      deleted: 'Xóa thành công',
      error: 'Lỗi máy chủ nội bộ'
    }
  };
  return messages[lang] || messages.zh;
};

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, keyword, type, group, tag, lang = 'zh' } = req.query;
    
    let customers = await db.query('customers');
    
    if (type) {
      customers = customers.filter(item => item.type === type);
    }
    
    if (group) {
      customers = customers.filter(item => item.group === group);
    }
    
    if (tag) {
      customers = customers.filter(item => item.tags && item.tags.includes(tag));
    }
    
    if (keyword) {
      const kw = keyword.toLowerCase();
      customers = customers.filter(item => 
        item.name?.toLowerCase().includes(kw) ||
        item.company?.toLowerCase().includes(kw) ||
        item.phone?.includes(kw) ||
        item.email?.toLowerCase().includes(kw)
      );
    }
    
    customers.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    const offset = (page - 1) * limit;
    const paginatedData = customers.slice(offset, offset + parseInt(limit)).map(customer => ({
      id: customer.id,
      name: customer.name,
      company: customer.company,
      phone: customer.phone,
      email: customer.email,
      type: customer.type,
      type_label: getTypeLabel(customer.type, lang),
      status: customer.status,
      status_label: customer.status === 'active' ? (lang === 'zh' ? '活跃' : lang === 'en' ? 'Active' : 'Hoạt động') : (lang === 'zh' ? '停用' : lang === 'en' ? 'Inactive' : 'Không hoạt động'),
      contact_count: customer.contact_count || 0,
      total_value: customer.total_value || 0,
      last_contact: customer.last_contact,
      created_at: customer.created_at
    }));
    
    res.json({
      success: true,
      data: paginatedData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: customers.length
      }
    });
  } catch (err) {
    console.error('查询客户列表失败:', err);
    const msg = getMessages(req.lang || 'zh');
    res.status(500).json({ success: false, message: msg.error });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { lang = 'zh' } = req.query;
    const msg = getMessages(lang);
    const customer = await db.get('customers', { id: parseInt(req.params.id) });
    
    if (!customer) {
      return res.status(404).json({ success: false, message: msg.not_found });
    }
    
    res.json({ 
      success: true, 
      data: {
        id: customer.id,
        name: customer.name,
        company: customer.company,
        phone: customer.phone,
        email: customer.email,
        wechat: customer.wechat,
        address: customer.address,
        type: customer.type,
        type_label: getTypeLabel(customer.type, lang),
        status: customer.status,
        remarks: customer.remarks,
        contact_count: customer.contact_count || 0,
        total_value: customer.total_value || 0,
        last_contact: customer.last_contact,
        created_at: customer.created_at,
        updated_at: customer.updated_at
      } 
    });
  } catch (err) {
    console.error('查询客户详情失败:', err);
    const msg = getMessages(req.lang || 'zh');
    res.status(500).json({ success: false, message: msg.error });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const lang = req.lang || 'zh';
    const msg = getMessages(lang);
    const { name, company, phone, email, wechat, address, type, remarks } = req.body;
    
    if (!name || !phone) {
      return res.status(400).json({ success: false, message: msg.required });
    }
    
    const result = await db.insert('customers', {
      name,
      company: company || '',
      phone,
      email: email || '',
      wechat: wechat || '',
      address: address || '',
      type: type || 'general',
      status: 'active',
      remarks: remarks || '',
      contact_count: 0,
      total_value: 0
    });
    
    res.status(201).json({
      success: true,
      message: msg.created,
      customer_id: result.lastID
    });
  } catch (err) {
    console.error('创建客户失败:', err);
    const msg = getMessages(req.lang || 'zh');
    res.status(500).json({ success: false, message: msg.error });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const lang = req.lang || 'zh';
    const msg = getMessages(lang);
    const { name, company, phone, email, wechat, address, type, status, remarks, group, tags } = req.body;
    
    const customer = await db.get('customers', { id: parseInt(req.params.id) });
    if (!customer) {
      return res.status(404).json({ success: false, message: msg.not_found });
    }
    
    const updates = {};
    if (name) updates.name = name;
    if (company !== undefined) updates.company = company;
    if (phone) updates.phone = phone;
    if (email !== undefined) updates.email = email;
    if (wechat !== undefined) updates.wechat = wechat;
    if (address !== undefined) updates.address = address;
    if (type) updates.type = type;
    if (status) updates.status = status;
    if (remarks !== undefined) updates.remarks = remarks;
    if (group !== undefined) updates.group = group;
    if (tags !== undefined) updates.tags = tags;
    updates.updated_at = new Date().toISOString();
    
    await db.update('customers', { id: parseInt(req.params.id) }, updates);
    
    res.json({ success: true, message: msg.updated });
  } catch (err) {
    console.error('更新客户失败:', err);
    const msg = getMessages(req.lang || 'zh');
    res.status(500).json({ success: false, message: msg.error });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const lang = req.lang || 'zh';
    const msg = getMessages(lang);
    const result = await db.deleteRow('customers', { id: parseInt(req.params.id) });
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: msg.not_found });
    }
    
    res.json({ success: true, message: msg.deleted });
  } catch (err) {
    console.error('删除客户失败:', err);
    const msg = getMessages(req.lang || 'zh');
    res.status(500).json({ success: false, message: msg.error });
  }
});

router.get('/:id/contacts', authMiddleware, async (req, res) => {
  try {
    const contacts = await db.query('customer_contacts');
    const customerContacts = contacts.filter(c => c.customer_id === parseInt(req.params.id));
    
    res.json({
      success: true,
      data: customerContacts.map(c => ({
        id: c.id,
        type: c.type,
        type_label: getContactTypeLabel(c.type),
        content: c.content,
        created_at: c.created_at
      }))
    });
  } catch (err) {
    console.error('查询客户联系记录失败:', err);
    res.status(500).json({ success: false, message: '查询失败' });
  }
});

router.post('/:id/contacts', authMiddleware, async (req, res) => {
  try {
    const { type, content } = req.body;
    
    await db.insert('customer_contacts', {
      customer_id: parseInt(req.params.id),
      type: type || 'phone',
      content: content || ''
    });
    
    await db.update('customers', { id: parseInt(req.params.id) }, {
      contact_count: db.literal('contact_count + 1'),
      last_contact: new Date().toISOString()
    });
    
    res.json({ success: true, message: '联系记录添加成功' });
  } catch (err) {
    console.error('添加联系记录失败:', err);
    res.status(500).json({ success: false, message: '添加失败' });
  }
});

function getTypeLabel(type, lang) {
  const labels = {
    general: { zh: '普通客户', en: 'General', vi: 'Khách hàng thông thường' },
    enterprise: { zh: '企业客户', en: 'Enterprise', vi: 'Khách hàng doanh nghiệp' },
    agent: { zh: '代理客户', en: 'Agent', vi: 'Khách hàng đại lý' },
    VIP: { zh: 'VIP客户', en: 'VIP', vi: 'Khách hàng VIP' }
  };
  return labels[type] ? labels[type][lang] || type : type;
}

function getContactTypeLabel(type) {
  const labels = {
    phone: '电话',
    wechat: '微信',
    email: '邮件',
    meeting: '面谈',
    other: '其他'
  };
  return labels[type] || type;
}

module.exports = router;