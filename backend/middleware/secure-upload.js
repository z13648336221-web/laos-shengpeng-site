/**
 * 安全文件上传中间件
 * 包含文件头魔数检测、随机文件名、安全验证等功能
 */

const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const { scanFile } = require('../utils/virus-scanner');

/**
 * 文件魔数（文件头）定义
 * 用于验证文件真实类型，防止MIME类型欺骗
 */
const FILE_MAGIC_NUMBERS = {
  'image/jpeg': [
    [0xFF, 0xD8, 0xFF] // JPEG
  ],
  'image/png': [
    [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] // PNG
  ],
  'image/gif': [
    [0x47, 0x49, 0x46, 0x38] // GIF
  ],
  'image/webp': [
    [0x52, 0x49, 0x46, 0x46] // RIFF (WebP)
  ],
  'video/mp4': [
    [0x00, 0x00, 0x00], [0x66, 0x74, 0x79, 0x70] // MP4
  ],
  'video/webm': [
    [0x1A, 0x45, 0xDF, 0xA3] // WebM
  ],
  'application/pdf': [
    [0x25, 0x50, 0x44, 0x46] // PDF
  ]
};

/**
 * 允许的文件类型
 */
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png', 
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/webm'
];

/**
 * 允许的文件扩展名
 */
const ALLOWED_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.webm'
];

/**
 * 验证文件魔数
 * @param {Buffer} buffer - 文件内容缓冲区
 * @param {string} mimetype - 声明的MIME类型
 * @returns {boolean} 是否匹配
 */
function validateFileMagicNumber(buffer, mimetype) {
  const magicNumbers = FILE_MAGIC_NUMBERS[mimetype];
  if (!magicNumbers) return false;
  
  // 检查任何一种可能的魔数
  return magicNumbers.some(magic => {
    if (buffer.length < magic.length) return false;
    for (let i = 0; i < magic.length; i++) {
      if (buffer[i] !== magic[i]) return false;
    }
    return true;
  });
}

/**
 * 生成安全的随机文件名
 * @param {string} originalName - 原始文件名
 * @param {string} mimeType - MIME类型
 * @returns {string} 安全的文件名
 */
function generateSecureFilename(originalName, mimeType) {
  const ext = path.extname(originalName).toLowerCase();
  const randomString = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  
  // 验证扩展名是否允许
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    // 根据MIME类型推断扩展名
    const extMap = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'video/mp4': '.mp4',
      'video/webm': '.webm'
    };
    return `${timestamp}-${randomString}${extMap[mimeType] || ''}`;
  }
  
  return `${timestamp}-${randomString}${ext}`;
}

/**
 * 验证文件内容
 * @param {Buffer} buffer - 文件内容
 * @param {string} mimetype - MIME类型
 * @returns {object} 验证结果
 */
function validateFileContent(buffer, mimetype) {
  // 检查文件大小
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (buffer.length > maxSize) {
    return { valid: false, error: '文件大小超过限制 (50MB)' };
  }
  
  // 检查MIME类型是否允许
  if (!ALLOWED_FILE_TYPES.includes(mimetype)) {
    return { valid: false, error: '不支持的文件类型' };
  }
  
  // 检查文件魔数
  if (!validateFileMagicNumber(buffer, mimetype)) {
    return { valid: false, error: '文件内容与声明的类型不匹配' };
  }
  
  return { valid: true };
}

/**
 * 创建安全上传中间件
 * @param {object} options - 配置选项
 * @returns {object} multer中间件
 */
function createSecureUpload(options = {}) {
  const {
    uploadDir = path.join(__dirname, '../secure-uploads'),
    maxFileSize = 50 * 1024 * 1024, // 50MB
    allowedTypes = ALLOWED_FILE_TYPES,
    enableVirusScan = true
  } = options;
  
  // 确保上传目录存在
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const secureName = generateSecureFilename(file.originalname, file.mimetype);
      cb(null, secureName);
    }
  });
  
  const upload = multer({
    storage: storage,
    limits: { fileSize: maxFileSize },
    fileFilter: function (req, file, cb) {
      // 首先检查MIME类型
      if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error('不支持的文件类型'));
      }
      
      // 检查文件扩展名
      const ext = path.extname(file.originalname).toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return cb(new Error('不支持的文件扩展名'));
      }
      
      cb(null, true);
    }
  });
  
  // 包装upload中间件，添加内容验证
  const secureUpload = {
    single: async function (fieldName) {
      return async (req, res, next) => {
        upload.single(fieldName)(req, res, async (err) => {
          if (err) return next(err);
          
          // 验证文件内容
          if (req.file) {
            const filePath = req.file.path;
            try {
              const buffer = fs.readFileSync(filePath);
              const validation = validateFileContent(buffer, req.file.mimetype);
              
              if (!validation.valid) {
                // 删除不安全的文件
                fs.unlinkSync(filePath);
                return next(new Error(validation.error));
              }
              
              // 病毒扫描
              if (enableVirusScan) {
                const scanResult = await scanFile(filePath);
                if (!scanResult.safe) {
                  // 删除感染文件
                  fs.unlinkSync(filePath);
                  return next(new Error(`文件安全检查失败: ${scanResult.threat}`));
                }
              }
            } catch (error) {
              // 读取失败，删除文件
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
              }
              return next(new Error('文件验证失败'));
            }
          }
          
          next();
        });
      };
    },
    
    fields: async function (fields) {
      return async (req, res, next) => {
        upload.fields(fields)(req, res, async (err) => {
          if (err) return next(err);
          
          // 验证所有文件内容
          if (req.files) {
            const fileNames = Object.keys(req.files);
            let hasError = false;
            let errorMessage = '';
            
            for (const fieldName of fileNames) {
              const files = req.files[fieldName];
              for (const file of files) {
                try {
                  const buffer = fs.readFileSync(file.path);
                  const validation = validateFileContent(buffer, file.mimetype);
                  
                  if (!validation.valid) {
                    // 删除不安全的文件
                    fs.unlinkSync(file.path);
                    hasError = true;
                    errorMessage = validation.error;
                    break;
                  }
                  
                  // 病毒扫描
                  if (enableVirusScan) {
                    const scanResult = await scanFile(file.path);
                    if (!scanResult.safe) {
                      // 删除感染文件
                      fs.unlinkSync(file.path);
                      hasError = true;
                      errorMessage = `文件安全检查失败: ${scanResult.threat}`;
                      break;
                    }
                  }
                } catch (error) {
                  // 读取失败，删除文件
                  if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                  }
                  hasError = true;
                  errorMessage = '文件验证失败';
                  break;
                }
              }
              if (hasError) break;
            }
            
            if (hasError) {
              // 清理所有已上传的文件
              for (const fieldName of fileNames) {
                const files = req.files[fieldName];
                for (const file of files) {
                  if (fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                  }
                }
              }
              return next(new Error(errorMessage));
            }
          }
          
          next();
        });
      };
    },
    
    array: async function (fieldName, maxCount) {
      return async (req, res, next) => {
        upload.array(fieldName, maxCount)(req, res, async (err) => {
          if (err) return next(err);
          
          // 验证所有文件内容
          if (req.files) {
            for (const file of req.files) {
              try {
                const buffer = fs.readFileSync(file.path);
                const validation = validateFileContent(buffer, file.mimetype);
                
                if (!validation.valid) {
                  // 删除不安全的文件
                  fs.unlinkSync(file.path);
                  return next(new Error(validation.error));
                }
                
                // 病毒扫描
                if (enableVirusScan) {
                  const scanResult = await scanFile(file.path);
                  if (!scanResult.safe) {
                    // 删除感染文件
                    fs.unlinkSync(file.path);
                    return next(new Error(`文件安全检查失败: ${scanResult.threat}`));
                  }
                }
              } catch (error) {
                // 读取失败，删除文件
                if (fs.existsSync(file.path)) {
                  fs.unlinkSync(file.path);
                }
                return next(new Error('文件验证失败'));
              }
            }
          }
          
          next();
        });
      };
    }
  };
  
  return secureUpload;
}

module.exports = {
  createSecureUpload,
  validateFileMagicNumber,
  generateSecureFilename,
  validateFileContent,
  ALLOWED_FILE_TYPES,
  ALLOWED_EXTENSIONS
};