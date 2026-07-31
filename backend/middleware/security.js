/**
 * 安全中间件模块
 * 提供XSS防护、输入清理、速率限制等安全功能
 */

// =============================================
// XSS防护 - 清理HTML特殊字符
// =============================================
function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// =============================================
// 递归清理对象中的所有字符串字段
// =============================================
function sanitizeObject(obj) {
  if (typeof obj === 'string') return sanitizeString(obj);
  if (Array.isArray(obj)) return obj.map(item => sanitizeObject(item));
  if (obj && typeof obj === 'object') {
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      cleaned[key] = sanitizeObject(value);
    }
    return cleaned;
  }
  return obj;
}

// =============================================
// XSS清理中间件 - 清理请求体中的用户输入
// 排除密码字段（密码不需要HTML转义）
// =============================================
function xssProtection(req, res, next) {
  if (req.body) {
    const skipFields = ['password', 'oldPassword', 'newPassword'];
    
    for (const [key, value] of Object.entries(req.body)) {
      if (skipFields.includes(key)) continue;
      if (typeof value === 'string') {
        req.body[key] = sanitizeString(value);
      }
    }
  }
  
  if (req.query) {
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string') {
        req.query[key] = sanitizeString(value);
      }
    }
  }
  
  if (req.params) {
    for (const [key, value] of Object.entries(req.params)) {
      if (typeof value === 'string') {
        req.params[key] = sanitizeString(value);
      }
    }
  }
  
  next();
}

// =============================================
// 请求日志中间件 - 记录所有API请求
// =============================================
function requestLogger(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    };
    
    // 只记录非静态资源请求
    if (!req.originalUrl.match(/\.(js|css|png|jpg|gif|svg|ico|woff|woff2)$/)) {
      console.log(`[${log.method}] ${log.path} ${log.status} ${log.duration} (${log.ip})`);
    }
  });
  
  next();
}

// =============================================
// 防止敏感信息泄露 - 移除危险响应头
// =============================================
function hideHeaders(req, res, next) {
  // 移除X-Powered-By（Express默认设置）
  res.removeHeader('X-Powered-By');
  // 移除Server头
  res.removeHeader('Server');
  next();
}

// =============================================
// 输入长度限制中间件
// =============================================
function inputLengthLimit(maxLength = 5000) {
  return (req, res, next) => {
    if (req.body) {
      for (const [key, value] of Object.entries(req.body)) {
        if (typeof value === 'string' && value.length > maxLength) {
          return res.status(413).json({
            success: false,
            message: `字段 ${key} 超出最大长度限制（${maxLength}字符）`
          });
        }
      }
    }
    next();
  };
}

// =============================================
// 会话清理中间件 - 定期清理过期会话
// =============================================
async function cleanExpiredSessions(db) {
  try {
    const sessions = await db.query('sessions');
    const now = new Date();
    const expiredSessionIds = sessions
      .filter(session => new Date(session.expires_at) < now)
      .map(session => session.session_id);
    
    if (expiredSessionIds.length > 0) {
      for (const sessionId of expiredSessionIds) {
        await db.deleteRow('sessions', { session_id: sessionId });
      }
      console.log(`[Security] 清理了 ${expiredSessionIds.length} 个过期会话`);
    }
  } catch (err) {
    console.error('[Security] 清理会话失败:', err);
  }
}

// 每30分钟清理一次过期会话
function startSessionCleanup(db) {
  // 启动时立即清理一次
  cleanExpiredSessions(db);
  
  // 每30分钟清理一次
  setInterval(() => {
    cleanExpiredSessions(db);
  }, 30 * 60 * 1000);
}

module.exports = {
  sanitizeString,
  sanitizeObject,
  xssProtection,
  requestLogger,
  hideHeaders,
  inputLengthLimit,
  cleanExpiredSessions,
  startSessionCleanup
};
