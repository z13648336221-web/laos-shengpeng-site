const db = require('../models/database');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const BCRYPT_ROUNDS = 10;

function generateSessionId() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * 密码哈希 - 使用bcrypt（带盐值）
 * 比SHA-256更安全，每次哈希结果不同（随机盐）
 */
function hashPassword(password) {
  return bcrypt.hashSync(password, BCRYPT_ROUNDS);
}

/**
 * 密码验证 - bcrypt比对
 * 兼容旧版SHA-256密码（自动迁移）
 */
function comparePassword(password, hashedPassword) {
  // 如果是bcrypt格式（以$2a$或$2b$开头）
  if (hashedPassword && (hashedPassword.startsWith('$2a$') || hashedPassword.startsWith('$2b$'))) {
    return bcrypt.compareSync(password, hashedPassword);
  }
  
  // 兼容旧版SHA-256格式（迁移期间使用）
  const sha256Hash = crypto.createHash('sha256').update(password).digest('hex');
  return sha256Hash === hashedPassword;
}

/**
 * 检查密码是否为旧版SHA-256格式（用于自动迁移）
 */
function isLegacyHash(hashedPassword) {
  return hashedPassword && !hashedPassword.startsWith('$2a$') && !hashedPassword.startsWith('$2b$');
}

/**
 * 认证中间件
 */
async function authMiddleware(req, res, next) {
  const sessionId = req.cookies?.sessionId;

  if (!sessionId) {
    return res.status(401).json({ success: false, message: '未登录，请先登录' });
  }

  const session = await db.get('sessions', { session_id: sessionId });

  if (!session) {
    return res.status(401).json({ success: false, message: '会话已过期，请重新登录' });
  }

  if (new Date(session.expires_at) < new Date()) {
    await db.deleteRow('sessions', { session_id: sessionId });
    return res.status(401).json({ success: false, message: '会话已过期，请重新登录' });
  }

  const admin = await db.get('admins', { id: session.admin_id });

  if (!admin) {
    return res.status(401).json({ success: false, message: '用户不存在' });
  }

  req.admin = admin;
  next();
}

/**
 * 角色权限检查中间件
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ success: false, message: '未登录' });
    }
    
    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({ success: false, message: '权限不足' });
    }
    
    next();
  };
}

module.exports = {
  authMiddleware,
  generateSessionId,
  hashPassword,
  comparePassword,
  isLegacyHash,
  requireRole
};
