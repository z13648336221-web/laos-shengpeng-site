const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authMiddleware, hashPassword, requireRole } = require('../middleware/auth');

router.use(authMiddleware);
// 管理员账号管理（创建/修改/删除）仅限超级管理员，防止普通 admin 自我提权
router.use(requireRole('super_admin'));

router.get('/', async (req, res) => {
  try {
    const admins = await db.query('admins');
    const result = admins.map(admin => {
      const { password, ...rest } = admin;
      return rest;
    });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取管理员失败' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const admin = await db.get('admins', { id: parseInt(req.params.id) });
    if (admin) {
      const { password, ...result } = admin;
      res.json({ success: true, data: result });
    } else {
      res.status(404).json({ success: false, message: '管理员不存在' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: '获取管理员失败' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
    }

    const existing = await db.get('admins', { username });
    if (existing) {
      return res.status(400).json({ success: false, message: '用户名已存在' });
    }

    await db.insert('admins', { 
      username, 
      password: hashPassword(password), 
      role: role || 'admin' 
    });
    res.json({ success: true, message: '管理员创建成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '创建管理员失败' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username) {
      return res.status(400).json({ success: false, message: '用户名不能为空' });
    }

    // 禁止修改自己的角色，防止误操作自我降权后失去管理能力
    if (role && parseInt(req.params.id) === req.admin.id && role !== req.admin.role) {
      return res.status(400).json({ success: false, message: '不能修改自己的角色' });
    }

    const existing = await db.get('admins', { username });
    if (existing && existing.id !== parseInt(req.params.id)) {
      return res.status(400).json({ success: false, message: '用户名已存在' });
    }

    const updates = { username };
    if (password) {
      updates.password = hashPassword(password);
    }
    if (role) {
      updates.role = role;
    }

    await db.update('admins', { id: parseInt(req.params.id) }, updates);
    res.json({ success: true, message: '管理员更新成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '更新管理员失败' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (id === 1) {
      return res.status(400).json({ success: false, message: '无法删除超级管理员' });
    }

    if (id === req.admin.id) {
      return res.status(400).json({ success: false, message: '不能删除自己的账户' });
    }

    const admin = await db.get('admins', { id });
    if (!admin) {
      return res.status(404).json({ success: false, message: '管理员不存在' });
    }

    await db.delete('admins', { id });
    res.json({ success: true, message: '管理员删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '删除管理员失败' });
  }
});

module.exports = router;