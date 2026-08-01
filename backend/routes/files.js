/**
 * 文件访问代理路由
 * 提供安全的文件访问接口，避免直接暴露上传目录
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { authMiddleware } = require('../middleware/auth');

// 安全文件存储目录（在web根目录外）
const SECURE_UPLOAD_DIR = path.join(__dirname, '../secure-uploads');

/**
 * 确保安全上传目录存在
 */
function ensureSecureUploadDir() {
  const subdirs = ['news', 'documents', 'avatars'];
  
  if (!fs.existsSync(SECURE_UPLOAD_DIR)) {
    fs.mkdirSync(SECURE_UPLOAD_DIR, { recursive: true });
  }
  
  subdirs.forEach(subdir => {
    const dirPath = path.join(SECURE_UPLOAD_DIR, subdir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
}

ensureSecureUploadDir();

/**
 * 文件访问白名单
 * 只允许访问这些类型的文件
 */
const ALLOWED_ACCESS_TYPES = [
  'image/jpeg',
  'image/png', 
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/webm'
];

/**
 * 验证文件路径安全性
 * 防止路径遍历攻击
 */
function validateFilePath(relativePath) {
  // 移除开头的斜杠
  const cleanPath = relativePath.replace(/^\/+/, '');
  
  // 检查是否包含路径遍历字符
  if (cleanPath.includes('..') || cleanPath.includes('~')) {
    return null;
  }
  
  // 构建完整路径
  const fullPath = path.join(SECURE_UPLOAD_DIR, cleanPath);
  
  // 验证路径是否在安全目录内
  const resolvedPath = path.resolve(fullPath);
  const resolvedSecureDir = path.resolve(SECURE_UPLOAD_DIR);
  
  if (!resolvedPath.startsWith(resolvedSecureDir)) {
    return null;
  }
  
  return fullPath;
}

/**
 * 获取文件MIME类型
 */
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * GET /files/:category/:filename
 * 通过代理访问上传的文件
 */
router.get('/:category/:filename', async (req, res) => {
  try {
    const { category, filename } = req.params;
    
    // 验证分类是否合法
    const allowedCategories = ['news', 'documents', 'avatars'];
    if (!allowedCategories.includes(category)) {
      return res.status(400).json({ 
        success: false, 
        message: '无效的文件分类' 
      });
    }
    
    // 构建安全路径
    const relativePath = path.join(category, filename);
    const filePath = validateFilePath(relativePath);
    
    if (!filePath) {
      return res.status(403).json({ 
        success: false, 
        message: '文件路径无效' 
      });
    }
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        success: false, 
        message: '文件不存在' 
      });
    }
    
    // 检查是否为文件
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
      return res.status(403).json({ 
        success: false, 
        message: '无效的文件类型' 
      });
    }
    
    // 验证文件类型
    const mimeType = getMimeType(filePath);
    if (!ALLOWED_ACCESS_TYPES.includes(mimeType)) {
      return res.status(403).json({ 
        success: false, 
        message: '不允许的文件类型' 
      });
    }
    
    // 设置安全响应头
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1年缓存
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // 发送文件
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    fileStream.on('error', (error) => {
      console.error('文件读取错误:', error);
      if (!res.headersSent) {
        res.status(500).json({ 
          success: false, 
          message: '文件读取失败' 
        });
      }
    });
    
  } catch (error) {
    console.error('文件访问错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器内部错误' 
    });
  }
});

/**
 * DELETE /files/:category/:filename
 * 删除上传的文件（需要管理员权限）
 */
router.delete('/:category/:filename', authMiddleware, async (req, res) => {
  try {
    // 检查管理员权限
    if (req.admin.role !== 'super_admin' && req.admin.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: '权限不足' 
      });
    }
    
    const { category, filename } = req.params;
    
    // 验证分类是否合法
    const allowedCategories = ['news', 'documents', 'avatars'];
    if (!allowedCategories.includes(category)) {
      return res.status(400).json({ 
        success: false, 
        message: '无效的文件分类' 
      });
    }
    
    // 构建安全路径
    const relativePath = path.join(category, filename);
    const filePath = validateFilePath(relativePath);
    
    if (!filePath) {
      return res.status(403).json({ 
        success: false, 
        message: '文件路径无效' 
      });
    }
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        success: false, 
        message: '文件不存在' 
      });
    }
    
    // 删除文件
    fs.unlinkSync(filePath);
    
    res.json({ 
      success: true, 
      message: '文件删除成功' 
    });
    
  } catch (error) {
    console.error('文件删除错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器内部错误' 
    });
  }
});

/**
 * GET /files/info/:category/:filename
 * 获取文件信息（需要管理员权限）
 */
router.get('/info/:category/:filename', authMiddleware, async (req, res) => {
  try {
    // 检查管理员权限
    if (req.admin.role !== 'super_admin' && req.admin.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: '权限不足' 
      });
    }
    
    const { category, filename } = req.params;
    
    // 验证分类是否合法
    const allowedCategories = ['news', 'documents', 'avatars'];
    if (!allowedCategories.includes(category)) {
      return res.status(400).json({ 
        success: false, 
        message: '无效的文件分类' 
      });
    }
    
    // 构建安全路径
    const relativePath = path.join(category, filename);
    const filePath = validateFilePath(relativePath);
    
    if (!filePath) {
      return res.status(403).json({ 
        success: false, 
        message: '文件路径无效' 
      });
    }
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        success: false, 
        message: '文件不存在' 
      });
    }
    
    // 获取文件信息
    const stats = fs.statSync(filePath);
    const mimeType = getMimeType(filePath);
    
    res.json({ 
      success: true, 
      data: {
        filename: filename,
        category: category,
        size: stats.size,
        mimeType: mimeType,
        created: stats.birthtime,
        modified: stats.mtime
      }
    });
    
  } catch (error) {
    console.error('文件信息获取错误:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器内部错误' 
    });
  }
});

module.exports = router;