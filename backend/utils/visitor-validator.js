/**
 * 访客 ID 验证工具
 * 验证访客 ID 的有效性和安全性
 */

const crypto = require('crypto');

/**
 * 访客 ID 配置
 */
const VISITOR_ID_CONFIG = {
  minLength: 8,
  maxLength: 64,
  allowedChars: /^[a-zA-Z0-9_-]+$/,
  blacklistedIds: ['admin', 'root', 'system', 'test', 'guest', 'anonymous'],
  maxAge: 24 * 60 * 60 * 1000, // 24小时（如果包含时间戳）
  strictMode: true // 严格模式：拒绝不符合格式的 ID
};

/**
 * 生成安全的访客 ID
 * @returns {string} 访客 ID
 */
function generateVisitorId() {
  const timestamp = Date.now().toString(36);
  const randomPart = crypto.randomBytes(8).toString('hex');
  return `visitor_${timestamp}_${randomPart}`;
}

/**
 * 验证访客 ID 格式
 * @param {string} visitorId - 访客 ID
 * @returns {object} 验证结果
 */
function validateVisitorIdFormat(visitorId) {
  const result = {
    valid: true,
    error: null
  };
  
  // 基本检查
  if (!visitorId || typeof visitorId !== 'string') {
    result.valid = false;
    result.error = '访客 ID 不能为空';
    return result;
  }
  
  // 长度检查
  if (visitorId.length < VISITOR_ID_CONFIG.minLength) {
    result.valid = false;
    result.error = `访客 ID 过短，最少需要 ${VISITOR_ID_CONFIG.minLength} 个字符`;
    return result;
  }
  
  if (visitorId.length > VISITOR_ID_CONFIG.maxLength) {
    result.valid = false;
    result.error = `访客 ID 过长，最多允许 ${VISITOR_ID_CONFIG.maxLength} 个字符`;
    return result;
  }
  
  // 字符检查
  if (!VISITOR_ID_CONFIG.allowedChars.test(visitorId)) {
    result.valid = false;
    result.error = '访客 ID 包含非法字符，只允许字母、数字、连字符和下划线';
    return result;
  }
  
  // 黑名单检查
  const lowerId = visitorId.toLowerCase();
  if (VISITOR_ID_CONFIG.blacklistedIds.includes(lowerId)) {
    result.valid = false;
    result.error = '访客 ID 被保留，请使用其他 ID';
    return result;
  }
  
  // 模式检查（防止特殊攻击模式）
  const dangerousPatterns = [
    /\.\./,           // 路径遍历
    /<script/i,       // 脚本注入
    /javascript:/i,   // JavaScript 协议
    /on\w+\s*=/i,     // 事件处理器
    /data:/i,         // 数据 URI
    /file:/i,         // 文件 URI
    /\0/,             // 空字节
    /[\x00-\x1F]/,    // 控制字符
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(visitorId)) {
      result.valid = false;
      result.error = '访客 ID 包含危险模式';
      return result;
    }
  }
  
  return result;
}

/**
 * 验证访客 ID 时间戳（如果包含）
 * @param {string} visitorId - 访客 ID
 * @returns {object} 验证结果
 */
function validateVisitorIdTimestamp(visitorId) {
  const result = {
    valid: true,
    error: null,
    age: null
  };
  
  // 尝试从 ID 中提取时间戳
  const timestampMatch = visitorId.match(/(\d{13,})/); // 毫秒时间戳
  if (timestampMatch) {
    const timestamp = parseInt(timestampMatch[1]);
    const now = Date.now();
    const age = now - timestamp;
    
    result.age = age;
    
    // 检查时间戳是否在未来
    if (timestamp > now) {
      result.valid = false;
      result.error = '访客 ID 时间戳无效';
      return result;
    }
    
    // 检查时间戳是否过期
    if (age > VISITOR_ID_CONFIG.maxAge) {
      result.valid = false;
      result.error = '访客 ID 已过期';
      return result;
    }
  }
  
  return result;
}

/**
 * 综合验证访客 ID
 * @param {string} visitorId - 访客 ID
 * @param {object} options - 验证选项
 * @returns {object} 验证结果
 */
function validateVisitorId(visitorId, options = {}) {
  const {
    checkTimestamp = false,
    strictMode = VISITOR_ID_CONFIG.strictMode
  } = options;
  
  const result = {
    valid: true,
    error: null,
    details: {}
  };
  
  // 格式验证
  const formatResult = validateVisitorIdFormat(visitorId);
  result.details.format = formatResult;
  
  if (!formatResult.valid) {
    result.valid = false;
    result.error = formatResult.error;
    
    // 在严格模式下拒绝无效 ID
    if (strictMode) {
      return result;
    }
  }
  
  // 时间戳验证
  if (checkTimestamp) {
    const timestampResult = validateVisitorIdTimestamp(visitorId);
    result.details.timestamp = timestampResult;
    
    if (!timestampResult.valid) {
      result.valid = false;
      result.error = timestampResult.error;
      return result;
    }
  }
  
  return result;
}

/**
 * 标准化访客 ID
 * @param {string} visitorId - 原始访客 ID
 * @returns {string} 标准化后的访客 ID
 */
function normalizeVisitorId(visitorId) {
  if (!visitorId || typeof visitorId !== 'string') {
    return generateVisitorId();
  }
  
  // 去除前后空格
  let normalized = visitorId.trim();
  
  // 转换为小写（可选）
  // normalized = normalized.toLowerCase();
  
  // 移除特殊字符
  normalized = normalized.replace(/[^a-zA-Z0-9_-]/g, '');
  
  // 如果标准化后为空或太短，生成新 ID
  if (normalized.length < VISITOR_ID_CONFIG.minLength) {
    return generateVisitorId();
  }
  
  return normalized;
}

/**
 * 检查访客 ID 是否被滥用
 * @param {string} visitorId - 访客 ID
 * @param {object} db - 数据库实例
 * @returns {Promise<object>} 检查结果
 */
async function checkVisitorIdAbuse(visitorId, db) {
  const result = {
    isAbused: false,
    reason: null,
    stats: null
  };
  
  try {
    // 检查该访客 ID 的消息数量
    const chats = await db.query('chats');
    const visitorChats = chats.filter(c => c.visitorId === visitorId);
    
    // 统计最近1小时的消息数量
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentChats = visitorChats.filter(c => 
      new Date(c.createdAt) > oneHourAgo
    );
    
    // 统计最近1天的消息数量
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const dailyChats = visitorChats.filter(c => 
      new Date(c.createdAt) > oneDayAgo
    );
    
    result.stats = {
      total: visitorChats.length,
      recent: recentChats.length,
      daily: dailyChats.length
    };
    
    // 滥用检测规则
    if (recentChats.length > 20) {
      result.isAbused = true;
      result.reason = '1小时内发送消息过多';
    } else if (dailyChats.length > 100) {
      result.isAbused = true;
      result.reason = '1天内发送消息过多';
    }
    
  } catch (error) {
    console.error('检查访客 ID 滥用失败:', error);
    // 如果检查失败，为了安全起见，假设可能被滥用
    result.isAbused = true;
    result.reason = '滥用检查失败';
  }
  
  return result;
}

/**
 * 记录访客 ID 验证日志
 * @param {string} visitorId - 访客 ID
 * @param {object} result - 验证结果
 * @param {string} ip - 客户端 IP
 */
function logVisitorValidation(visitorId, result, ip) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    visitorId,
    valid: result.valid,
    error: result.error,
    ip,
    userAgent: require('express').request?.headers?.['user-agent'] || 'unknown'
  };
  
  console.log('访客 ID 验证:', JSON.stringify(logEntry));
  
  // 这里可以扩展为写入日志文件或数据库
}

module.exports = {
  generateVisitorId,
  validateVisitorIdFormat,
  validateVisitorIdTimestamp,
  validateVisitorId,
  normalizeVisitorId,
  checkVisitorIdAbuse,
  logVisitorValidation,
  VISITOR_ID_CONFIG
};