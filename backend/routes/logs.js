const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authMiddleware, requireRole } = require('../middleware/auth');

router.use(authMiddleware);

// 审计日志的删除/清空仅限超级管理员，防止普通管理员清痕；
// 且清空动作本身写入一条不可删的记录留痕
router.delete('/:id', requireRole('super_admin'), async (req, res) => {
  try {
    await db.delete('logs', { id: parseInt(req.params.id) });
    res.json({ success: true, message: '日志删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '删除日志失败' });
  }
});

router.delete('/batch/clear', requireRole('super_admin'), async (req, res) => {
  try {
    const { days } = req.body;
    let deletedCount = 0;
    if (days) {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const logs = await db.query('logs');
      const oldLogs = logs.filter(log => log.created_at < cutoffDate);
      for (const log of oldLogs) {
        await db.delete('logs', { id: log.id });
      }
      deletedCount = oldLogs.length;
    } else {
      const logs = await db.query('logs');
      for (const log of logs) {
        await db.delete('logs', { id: log.id });
      }
      deletedCount = logs.length;
    }
    // 清空后留痕：记录本次清理操作本身
    await logAction(req.admin.id, req.admin.username, 'clear_logs',
      `清理了${deletedCount}条日志${days ? `（${days}天前）` : '（全部）'}`,
      req.ip || 'unknown');
    res.json({ success: true, message: days ? `已删除${deletedCount}条${days}天前的日志` : `已清空${deletedCount}条日志` });
  } catch (error) {
    res.status(500).json({ success: false, message: '清空日志失败' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, admin_id, action, startDate, endDate } = req.query;
    
    let logs = await db.query('logs');
    
    if (admin_id) {
      logs = logs.filter(log => log.admin_id === parseInt(admin_id));
    }
    if (action) {
      logs = logs.filter(log => log.action.includes(action));
    }
    if (startDate) {
      logs = logs.filter(log => log.created_at >= startDate);
    }
    if (endDate) {
      logs = logs.filter(log => log.created_at <= endDate);
    }
    
    logs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    const total = logs.length;
    const start = (page - 1) * limit;
    const end = start + parseInt(limit);
    const paginatedLogs = logs.slice(start, end);
    
    res.json({ 
      success: true, 
      data: paginatedLogs,
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取日志失败' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const log = await db.get('logs', { id: parseInt(req.params.id) });
    if (log) {
      res.json({ success: true, data: log });
    } else {
      res.status(404).json({ success: false, message: '日志不存在' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: '获取日志失败' });
  }
});

// 记录操作日志（供其他路由使用）
async function logAction(adminId, adminName, action, description, ip, details = {}) {
  try {
    await db.insert('logs', {
      admin_id: adminId,
      admin_name: adminName,
      action,
      description,
      ip,
      details: JSON.stringify(details)
    });
  } catch (error) {
    console.error('记录日志失败:', error);
  }
}

// 统一导出路由和工具函数
router.logAction = logAction;
module.exports = router;