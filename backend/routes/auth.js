const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authMiddleware, generateSessionId, hashPassword, comparePassword, isLegacyHash } = require('../middleware/auth');
const logsRouter = require('./logs');
const logAction = logsRouter.logAction;

const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8小时（缩短会话时间）
const isProduction = process.env.NODE_ENV === 'production';

// 登录失败次数限制（内存存储，重启后重置）
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCK_DURATION = 15 * 60 * 1000; // 15分钟

function getLoginAttempts(ip) {
  const record = loginAttempts.get(ip);
  if (!record) return { count: 0, locked: false };
  if (record.lockedUntil && Date.now() > record.lockedUntil) {
    loginAttempts.delete(ip);
    return { count: 0, locked: false };
  }
  return { count: record.count, locked: !!record.lockedUntil && Date.now() <= record.lockedUntil };
}

function recordFailedLogin(ip) {
  const record = loginAttempts.get(ip) || { count: 0, lockedUntil: null };
  record.count++;
  if (record.count >= MAX_LOGIN_ATTEMPTS) {
    record.lockedUntil = Date.now() + LOGIN_LOCK_DURATION;
    console.log(`[Security] IP ${ip} 登录尝试次数过多，锁定15分钟`);
  }
  loginAttempts.set(ip, record);
}

function clearLoginAttempts(ip) {
  loginAttempts.delete(ip);
}

router.post('/login', async (req, res) => {
  try {
    const clientIp = req.ip || req.connection?.remoteAddress || 'unknown';
    
    // 检查登录频率限制
    const attempt = getLoginAttempts(clientIp);
    if (attempt.locked) {
      return res.status(429).json({ 
        success: false, 
        message: '登录尝试次数过多，请15分钟后再试' 
      });
    }

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
    }

    // 用户名格式验证（防止注入）
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return res.status(400).json({ success: false, message: '用户名格式错误' });
    }

    const admin = await db.get('admins', { username });

    if (!admin) {
      recordFailedLogin(clientIp);
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    if (!comparePassword(password, admin.password)) {
      recordFailedLogin(clientIp);
      const remaining = MAX_LOGIN_ATTEMPTS - (getLoginAttempts(clientIp).count || 0);
      return res.status(401).json({ 
        success: false, 
        message: remaining > 0 
          ? `用户名或密码错误，还可尝试 ${remaining} 次`
          : '登录尝试次数过多，请15分钟后再试'
      });
    }

    // 登录成功，清除失败记录
    clearLoginAttempts(clientIp);

    // 自动迁移旧版SHA-256密码到bcrypt
    if (isLegacyHash(admin.password)) {
      admin.password = hashPassword(password);
      await db.update('admins', { id: admin.id }, { password: admin.password });
      console.log(`[Security] 管理员 ${username} 密码已自动升级为bcrypt`);
    }

    const sessionId = generateSessionId();
    const expiresAt = new Date(Date.now() + SESSION_DURATION);

    await db.insert('sessions', {
      session_id: sessionId,
      admin_id: admin.id,
      expires_at: expiresAt.toISOString()
    });

    // 安全Cookie配置
    res.cookie('sessionId', sessionId, {
      httpOnly: true,       // 防止XSS读取cookie
      secure: isProduction, // 生产环境仅HTTPS传输
      sameSite: 'strict',   // 防止CSRF
      maxAge: SESSION_DURATION,
      path: '/'
    });

    // 记录登录成功日志（含IP地址）
    logAction(admin.id, admin.username, 'login', `管理员 ${admin.username} 登录成功`, clientIp, { userAgent: req.headers['user-agent'] || '' });

    res.json({
      success: true,
      data: { id: admin.id, username: admin.username, role: admin.role }
    });
  } catch (error) {
    console.error('[Auth] 登录错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const sessionId = req.cookies.sessionId;
    await db.deleteRow('sessions', { session_id: sessionId });
    res.clearCookie('sessionId');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

router.get('/me', authMiddleware, (req, res) => {
  res.json({
    success: true,
    data: { id: req.admin.id, username: req.admin.username, role: req.admin.role }
  });
});

router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const adminId = req.admin.id;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: '旧密码和新密码不能为空' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: '新密码长度至少为6位' });
    }

    if (newPassword.length > 50) {
      return res.status(400).json({ success: false, message: '新密码长度不能超过50位' });
    }

    const admin = await db.get('admins', { id: adminId });

    if (!admin) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    if (!comparePassword(oldPassword, admin.password)) {
      return res.status(401).json({ success: false, message: '旧密码错误' });
    }

    // 新密码统一使用bcrypt加密
    await db.update('admins', { id: adminId }, {
      password: hashPassword(newPassword)
    });

    // 修改密码后清除所有该用户的会话
    const sessions = await db.query('sessions');
    for (const session of sessions) {
      if (session.admin_id === adminId) {
        await db.deleteRow('sessions', { session_id: session.session_id });
      }
    }

    res.json({ success: true, message: '密码修改成功，请重新登录' });
  } catch (error) {
    console.error('[Auth] 修改密码错误:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
