const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const roles = await db.query('roles');
    res.json({ success: true, data: roles });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取角色失败' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const role = await db.get('roles', { id: parseInt(req.params.id) });
    if (role) {
      res.json({ success: true, data: role });
    } else {
      res.status(404).json({ success: false, message: '角色不存在' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: '获取角色失败' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, code, permissions } = req.body;
    
    if (!name || !code) {
      return res.status(400).json({ success: false, message: '角色名称和标识不能为空' });
    }

    const existing = await db.get('roles', { code });
    if (existing) {
      return res.status(400).json({ success: false, message: '角色标识已存在' });
    }

    await db.insert('roles', { name, code, permissions: permissions || [] });
    res.json({ success: true, message: '角色创建成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '创建角色失败' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, code, permissions } = req.body;
    
    if (!name || !code) {
      return res.status(400).json({ success: false, message: '角色名称和标识不能为空' });
    }

    const existing = await db.get('roles', { code });
    if (existing && existing.id !== parseInt(req.params.id)) {
      return res.status(400).json({ success: false, message: '角色标识已存在' });
    }

    await db.update('roles', { id: parseInt(req.params.id) }, { name, code, permissions: permissions || [] });
    res.json({ success: true, message: '角色更新成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '更新角色失败' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const role = await db.get('roles', { id: parseInt(req.params.id) });
    if (!role) {
      return res.status(404).json({ success: false, message: '角色不存在' });
    }

    const admins = await db.query('admins');
    const usingAdmin = admins.find(a => a.role === role.code);
    if (usingAdmin) {
      return res.status(400).json({ success: false, message: '该角色正在被管理员使用，无法删除' });
    }

    await db.delete('roles', { id: parseInt(req.params.id) });
    res.json({ success: true, message: '角色删除成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '删除角色失败' });
  }
});

module.exports = router;