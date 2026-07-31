const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authMiddleware } = require('../middleware/auth');
const path = require('path');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/news'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'));
    }
  }
});

const getMessages = (lang) => {
  const messages = {
    zh: {
      not_found: '新闻不存在',
      required: '缺少必填字段（中文标题和内容）',
      created: '新闻创建成功',
      updated: '新闻更新成功',
      deleted: '删除成功',
      error: '服务器内部错误'
    },
    en: {
      not_found: 'News not found',
      required: 'Missing required fields (Chinese title and content)',
      created: 'News created successfully',
      updated: 'News updated successfully',
      deleted: 'Deleted successfully',
      error: 'Internal server error'
    },
    vi: {
      not_found: 'Tin tức không tồn tại',
      required: 'Thiếu trường bắt buộc (tiêu đề và nội dung tiếng Trung)',
      created: 'Tạo tin tức thành công',
      updated: 'Cập nhật tin tức thành công',
      deleted: 'Xóa thành công',
      error: 'Lỗi máy chủ nội bộ'
    }
  };
  return messages[lang] || messages.zh;
};

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, lang = 'zh' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    let newsList = await db.query('news');
    
    if (category) {
      newsList = newsList.filter(item => item.category === category);
    }
    
    newsList.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    const offset = (pageNum - 1) * limitNum;
    const paginatedData = newsList.slice(offset, offset + limitNum).map(item => {
      const content = item[`content_${lang}`] || item.content_zh;
      const summary = item[`summary_${lang}`] || item.summary_zh || (content ? content.substring(0, 100) + '...' : '');
      return {
        id: item.id,
        title: item[`title_${lang}`] || item.title_zh || '无标题',
        summary: summary,
        image_url: item.image_url,
        category: item.category,
        category_label: getCategoryLabel(item.category, lang),
        publish_date: item.publish_date || item.created_at,
        created_at: item.created_at
      };
    });
    
    const total = newsList.length;
    const totalPages = Math.ceil(total / limitNum);
    
    res.json({
      success: true,
      data: paginatedData,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: total,
        totalPages: totalPages
      }
    });
  } catch (err) {
    console.error('查询新闻列表失败:', err);
    const msg = getMessages(req.lang || 'zh');
    res.status(500).json({ success: false, message: msg.error });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { lang = 'zh' } = req.query;
    const msg = getMessages(lang);
    const news = await db.get('news', { id: parseInt(req.params.id) });
    
    if (!news) {
      return res.status(404).json({ success: false, message: msg.not_found });
    }
    
    res.json({ 
      success: true, 
      data: {
        id: news.id,
        title: news[`title_${lang}`] || news.title_zh,
        content: news[`content_${lang}`] || news.content_zh,
        summary: news[`summary_${lang}`] || news.summary_zh,
        image_url: news.image_url,
        category: news.category,
        category_label: getCategoryLabel(news.category, lang),
        publish_date: news.publish_date || news.created_at,
        created_at: news.created_at
      } 
    });
  } catch (err) {
    console.error('查询新闻详情失败:', err);
    const msg = getMessages(req.lang || 'zh');
    res.status(500).json({ success: false, message: msg.error });
  }
});

router.post('/', authMiddleware, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }]), async (req, res) => {
  try {
    const lang = req.lang || 'zh';
    const msg = getMessages(lang);
    
    const body = req.body;
    const files = req.files || {};
    
    const title_zh = body.title_zh;
    const title_en = body.title_en || '';
    const title_vi = body.title_vi || '';
    const content_zh = body.content_zh;
    const content_en = body.content_en || '';
    const content_vi = body.content_vi || '';
    const summary_zh = body.summary_zh || '';
    const summary_en = body.summary_en || '';
    const summary_vi = body.summary_vi || '';
    const category = body.category;
    const publish_date = body.publish_date || new Date().toISOString().split('T')[0];
    
    let image_url = body.image_url || '';
    let video_url = body.video_url || '';
    
    if (files.image && files.image[0]) {
      image_url = '/uploads/news/' + files.image[0].filename;
    }
    if (files.video && files.video[0]) {
      video_url = '/uploads/news/' + files.video[0].filename;
    }
    
    if (!title_zh || !content_zh || !category) {
      return res.status(400).json({ success: false, message: msg.required });
    }
    
    const result = await db.run(`
      INSERT INTO news (title_zh, title_en, title_vi, content_zh, content_en, content_vi, summary_zh, summary_en, summary_vi, image_url, video_url, category, publish_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [title_zh, title_en, title_vi, content_zh, content_en, content_vi, summary_zh, summary_en, summary_vi, image_url, video_url, category, publish_date]);
    
    res.status(201).json({
      success: true,
      message: msg.created,
      news_id: result.lastID
    });
  } catch (err) {
    console.error('创建新闻失败:', err);
    const msg = getMessages(req.lang || 'zh');
    res.status(500).json({ success: false, message: msg.error });
  }
});

router.put('/:id', authMiddleware, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'video', maxCount: 1 }]), async (req, res) => {
  try {
    const lang = req.lang || 'zh';
    const msg = getMessages(lang);
    
    const body = req.body;
    const files = req.files || {};
    
    const title_zh = body.title_zh;
    const title_en = body.title_en || '';
    const title_vi = body.title_vi || '';
    const content_zh = body.content_zh;
    const content_en = body.content_en || '';
    const content_vi = body.content_vi || '';
    const summary_zh = body.summary_zh || '';
    const summary_en = body.summary_en || '';
    const summary_vi = body.summary_vi || '';
    const category = body.category;
    const publish_date = body.publish_date;
    
    let image_url = body.image_url || '';
    let video_url = body.video_url || '';
    
    if (files.image && files.image[0]) {
      image_url = '/uploads/news/' + files.image[0].filename;
    }
    if (files.video && files.video[0]) {
      video_url = '/uploads/news/' + files.video[0].filename;
    }
    
    const news = await db.get('news', { id: parseInt(req.params.id) });
    if (!news) {
      return res.status(404).json({ success: false, message: msg.not_found });
    }
    
    const updateData = {
      title_zh, title_en, title_vi, content_zh, content_en, content_vi, 
      summary_zh, summary_en, summary_vi, category
    };
    
    if (image_url) updateData.image_url = image_url;
    if (video_url) updateData.video_url = video_url;
    if (publish_date) updateData.publish_date = publish_date;
    
    await db.update('news', { id: parseInt(req.params.id) }, updateData);
    
    res.json({ success: true, message: msg.updated });
  } catch (err) {
    console.error('更新新闻失败:', err);
    const msg = getMessages(req.lang || 'zh');
    res.status(500).json({ success: false, message: msg.error });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const lang = req.lang || 'zh';
    const msg = getMessages(lang);
    const result = await db.deleteRow('news', { id: parseInt(req.params.id) });
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: msg.not_found });
    }
    
    res.json({ success: true, message: msg.deleted });
  } catch (err) {
    console.error('删除新闻失败:', err);
    const msg = getMessages(req.lang || 'zh');
    res.status(500).json({ success: false, message: msg.error });
  }
});

const getCategoryLabel = (category, lang) => {
  const labels = {
    company: { zh: '公司动态', en: 'Company News', vi: 'Tin tức công ty' },
    service: { zh: '服务资讯', en: 'Service News', vi: 'Tin tức dịch vụ' },
    policy: { zh: '政策解读', en: 'Policy News', vi: 'Giải thích chính sách' },
    industry: { zh: '行业动态', en: 'Industry News', vi: 'Tin tức ngành' }
  };
  return labels[category] ? labels[category][lang] || category : category;
};

module.exports = router;