const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// 信任反向代理（默认 1 层，即 nginx）：
// 使 req.ip 取 X-Forwarded-For 的真实客户端 IP，保证限流/登录锁定的键准确。
// 直连部署时设置环境变量 TRUST_PROXY=0 关闭。
const trustProxy = Number(process.env.TRUST_PROXY !== undefined ? process.env.TRUST_PROXY : 1);
if (!Number.isNaN(trustProxy) && trustProxy >= 0) {
  app.set('trust proxy', trustProxy);
}

// =============================================
// 安全头 - Helmet
// =============================================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:", "/api/files/"],
      connectSrc: ["'self'", "https://api.qrserver.com"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      mediaSrc: ["'self'", "blob:", "/api/files/"],
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// =============================================
// CORS - 生产环境限制允许的域名
// =============================================
const allowedOrigins = isProduction 
  ? ['https://hengciglobal.com', 'https://www.hengciglobal.com']
  : true;

app.use(cors({
  credentials: true,
  origin: allowedOrigins
}));

// =============================================
// 速率限制 - 防止暴力攻击和DDoS
// =============================================
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟窗口
  max: 200,                  // 每个IP最多200次请求
  message: { success: false, message: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false
});

// 登录接口更严格的速率限制
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: '登录尝试过于频繁，请15分钟后再试' },
  standardHeaders: true,
  legacyHeaders: false
});

// 询价接口速率限制
const inquiryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: '询价提交过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false
});

// 聊天接口速率限制 —— 读写分开：
// 前端每 3 秒轮询一次未读消息，读接口必须放宽，否则轮询会被打死；
// 写（发消息）保持严格限制防刷屏
const chatWriteLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1分钟窗口
  max: 10,                  // 每个IP每分钟最多10条消息
  message: { success: false, message: '消息发送过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false
});

const chatReadLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,                  // 轮询约 20次/分钟/标签页，留出多标签页余量
  message: { success: false, message: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false
});

// 新闻列表和详情接口使用更宽松的速率限制（只读操作）
const newsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,  // 允许更多请求，因为新闻是公开内容
  message: { success: false, message: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', apiLimiter);

// =============================================
// 请求体大小限制
// =============================================
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use(cookieParser());

// =============================================
// 自定义安全中间件
// =============================================
const { xssProtection, requestLogger, hideHeaders, inputLengthLimit, startSessionCleanup } = require('./middleware/security');

app.use(hideHeaders);
app.use(requestLogger);
app.use(xssProtection);
app.use(inputLengthLimit(5000));

app.use((req, res, next) => {
  const lang = req.query.lang || req.headers['x-lang'] || 'zh';
  req.lang = ['zh', 'en', 'vi'].includes(lang) ? lang : 'zh';
  res.setHeader('Content-Language', req.lang);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

const db = require('./models/database');
const crypto = require('crypto');
const { hashPassword, comparePassword } = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const inquiryRoutes = require('./routes/inquiry');
const trackingRoutes = require('./routes/tracking');
const newsRoutes = require('./routes/news');
const serviceRoutes = require('./routes/services');
const orderRoutes = require('./routes/orders');
const customerRoutes = require('./routes/customers');
const quoteRoutes = require('./routes/quotes');
const chatRoutes = require('./routes/chat');
const roleRoutes = require('./routes/roles');
const adminRoutes = require('./routes/admins');
const logRoutes = require('./routes/logs');
const couponRoutes = require('./routes/coupon');
const filesRoutes = require('./routes/files');

app.use('/api/auth/login', loginLimiter);
app.use('/api/inquiry', inquiryLimiter);
app.use('/api/files', rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP 15分钟内最多100次文件访问
  message: { success: false, message: '文件访问请求过于频繁，请稍后再试' }
}));

app.use('/api/auth', authRoutes);
app.use('/api/inquiry', inquiryRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/news', newsLimiter, newsRoutes);  // 新闻使用更宽松的速率限制
app.use('/api/services', serviceRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/chat', (req, res, next) => {
  if (req.method === 'GET') return chatReadLimiter(req, res, next);
  return chatWriteLimiter(req, res, next);
}, chatRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/coupon', couponRoutes);
app.use('/api/files', filesRoutes);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/languages', (req, res) => {
  res.json({
    success: true,
    data: [
      { code: 'zh', name: '中文', name_en: 'Chinese', name_vi: 'Tiếng Trung' },
      { code: 'en', name: 'English', name_en: 'English', name_vi: 'Tiếng Anh' },
      { code: 'vi', name: 'Tiếng Việt', name_en: 'Vietnamese', name_vi: 'Tiếng Việt' }
    ]
  });
});

app.get('/api/labels', (req, res) => {
  const { lang = 'zh' } = req.query;
  
  const labels = {
    zh: {
      inquiry: {
        success: '询价请求提交成功，我们的客服将在30分钟内联系您！',
        required: '缺少必填字段',
        phone_error: '请输入有效的手机号码',
        weight_error: '重量必须大于0',
        volume_error: '体积必须大于等于0'
      },
      tracking: {
        not_found: '未找到运单号对应的货物信息',
        status: {
          pending: '待处理',
          picked_up: '已揽收',
          in_transit: '运输中',
          departed: '已离港',
          customs: '清关中',
          delivered: '已签收'
        }
      },
      common: {
        success: '操作成功',
        error: '服务器内部错误',
        not_found: '记录不存在',
        invalid: '无效的参数'
      }
    },
    en: {
      inquiry: {
        success: 'Inquiry request submitted successfully! Our customer service will contact you within 30 minutes.',
        required: 'Missing required fields',
        phone_error: 'Please enter a valid phone number',
        weight_error: 'Weight must be greater than 0',
        volume_error: 'Volume must be greater than or equal to 0'
      },
      tracking: {
        not_found: 'No shipment information found for this tracking number',
        status: {
          pending: 'Pending',
          picked_up: 'Picked Up',
          in_transit: 'In Transit',
          departed: 'Departed',
          customs: 'Customs',
          delivered: 'Delivered'
        }
      },
      common: {
        success: 'Operation successful',
        error: 'Internal server error',
        not_found: 'Record not found',
        invalid: 'Invalid parameters'
      }
    },
    vi: {
      inquiry: {
        success: 'Yêu cầu báo giá đã được gửi! Bộ phận chăm sóc khách hàng của chúng tôi sẽ liên hệ với bạn trong 30 phút.',
        required: 'Thiếu trường bắt buộc',
        phone_error: 'Vui lòng nhập số điện thoại hợp lệ',
        weight_error: 'Trọng lượng phải lớn hơn 0',
        volume_error: 'Thể tích phải lớn hơn hoặc bằng 0'
      },
      tracking: {
        not_found: 'Không tìm thấy thông tin vận đơn cho số theo dõi này',
        status: {
          pending: 'Chờ xử lý',
          picked_up: 'Đã nhận hàng',
          in_transit: 'Đang vận chuyển',
          departed: 'Đã rời cảng',
          customs: 'Qua hải quan',
          delivered: 'Đã giao hàng'
        }
      },
      common: {
        success: 'Thao tác thành công',
        error: 'Lỗi máy chủ nội bộ',
        not_found: 'Không tìm thấy bản ghi',
        invalid: 'Tham số không hợp lệ'
      }
    }
  };
  
  res.json({
    success: true,
    data: labels[lang] || labels.zh
  });
});

app.get('/api/health', (req, res) => {
  const messages = {
    zh: '重庆恒慈国际贸易有限公司后端服务运行正常',
    en: 'CHONGQING HENGCI INTERNATIONAL TRADE CO., LTD. Backend Service is running normally',
    vi: 'Dịch vụ backend của CHONGQING HENGCI INTERNATIONAL TRADE CO., LTD. đang hoạt động bình thường'
  };

  res.json({
    status: 'ok',
    message: messages[req.lang] || messages.zh,
    language: req.lang
  });
});

// =============================================
// 全局错误处理器 —— 兜底所有路由/中间件抛出的错误
// 避免未配置 NODE_ENV 时 Express 默认处理器把错误堆栈返回给客户端
// =============================================
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) {
    console.error('[Error]', req.method, req.originalUrl, err);
  }
  res.status(status).json({
    success: false,
    message: isProduction ? '服务器内部错误' : (err.message || '服务器内部错误')
  });
});

/**
 * 初始化/升级管理员账户
 * - 无任何管理员时：用 ADMIN_INITIAL_PASSWORD 环境变量或随机密码创建 admin
 * - 已存在管理员但密码仍是默认值 [REDACTED]：立即强制重置为随机密码（[REDACTED] 已随文档公开泄漏）
 * - 环境变量提供的密码不打印到日志
 */
async function initDefaultAdmin() {
  const admins = await db.query('admins');
  const defaultPassword = '[REDACTED]';
  const envPassword = process.env.ADMIN_INITIAL_PASSWORD;

  if (admins.length === 0) {
    const initialPassword = envPassword || crypto.randomBytes(12).toString('base64url');
    await db.insert('admins', {
      username: 'admin',
      password: hashPassword(initialPassword),
      role: 'admin'
    });
    if (envPassword) {
      console.log('[Security] 默认管理员账户已创建：用户名 admin，密码取自 ADMIN_INITIAL_PASSWORD 环境变量（不打印到日志）');
    } else {
      console.log(`[Security] 默认管理员账户已创建：用户名 admin，一次性初始密码：${initialPassword}（仅此一次显示，请立即登录后修改密码）`);
    }
    return;
  }

  // 检查是否有管理员仍在使用默认密码 [REDACTED]（该密码已随公开文档泄漏，直接重置而非告警）
  for (const admin of admins) {
    if (admin.password && comparePassword(defaultPassword, admin.password)) {
      if (envPassword) {
        await db.update('admins', { id: admin.id }, {
          password: hashPassword(envPassword),
          updated_at: new Date().toISOString()
        });
        console.log(`[Security] 管理员 ${admin.username} 已从默认密码升级为 ADMIN_INITIAL_PASSWORD 指定密码`);
      } else {
        const resetPassword = crypto.randomBytes(12).toString('base64url');
        await db.update('admins', { id: admin.id }, {
          password: hashPassword(resetPassword),
          updated_at: new Date().toISOString()
        });
        console.warn('============================================================');
        console.warn(`[Security] 管理员 ${admin.username} 仍在使用已泄漏的默认密码 [REDACTED]，已强制重置！`);
        console.warn(`[Security] 一次性新密码：${resetPassword}（仅此一次显示，请立即登录后修改密码）`);
        console.warn('============================================================');
      }
    }
  }
}

db.init().then(async () => {
  await initDefaultAdmin();
  
  // 启动定期会话清理
  startSessionCleanup(db);
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${isProduction ? 'Production' : 'Development'}`);
    console.log(`Security: Helmet + Rate Limit + XSS Protection enabled`);
  });
}).catch(err => {
  console.error('数据库初始化失败:', err);
  process.exit(1);
});
