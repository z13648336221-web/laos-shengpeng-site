/**
 * 自动备份脚本
 * 支持定时备份、备份保留策略、备份验证等功能
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { createReadStream, createWriteStream } = require('fs');

const dbPath = path.join(__dirname, '../database/shengpeng.db');
const backupDir = path.join(__dirname, '../database/backups');
const logDir = path.join(__dirname, '../database/logs');

// 备份配置
const backupConfig = {
  // 备份保留策略
  retention: {
    daily: 7,      // 保留最近7天的每日备份
    weekly: 4,     // 保留最近4周的每周备份
    monthly: 3,    // 保留最近3个月的每月备份
  },
  // 备份文件大小限制 (MB)
  maxBackupSize: 500,
  // 压缩备份
  compress: true,
  // 备份验证
  verify: true
};

/**
 * 确保目录存在
 */
function ensureDirectories() {
  [backupDir, logDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

/**
 * 创建备份
 */
function createBackup() {
  return new Promise((resolve, reject) => {
    try {
      if (!fs.existsSync(dbPath)) {
        reject(new Error('数据库文件不存在'));
        return;
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `shengpeng-backup-${timestamp}.db`;
      const backupPath = path.join(backupDir, backupFileName);

      console.log(`创建备份: ${backupFileName}`);

      // 使用文件复制方式备份（更可靠）
      const readStream = createReadStream(dbPath);
      const writeStream = createWriteStream(backupPath);
      
      readStream.on('error', (error) => {
        console.error('读取数据库文件失败:', error.message);
        reject(error);
      });
      
      writeStream.on('error', (error) => {
        console.error('写入备份文件失败:', error.message);
        reject(error);
      });
      
      writeStream.on('finish', () => {
        console.log('数据库文件复制完成');
        
        // 验证备份
        if (backupConfig.verify) {
          try {
            verifyBackup(backupPath);
          } catch (verifyError) {
            reject(verifyError);
            return;
          }
        }

        // 压缩备份
        if (backupConfig.compress) {
          compressBackup(backupPath);
        }

        console.log(`✓ 备份创建成功: ${backupFileName}`);
        resolve(backupPath);
      });
      
      readStream.pipe(writeStream);

    } catch (error) {
      console.error('✗ 备份创建失败:', error.message);
      reject(error);
    }
  });
}

/**
 * 验证备份
 */
function verifyBackup(backupPath) {
  try {
    console.log('验证备份完整性...');
    
    // 检查备份文件是否存在
    if (!fs.existsSync(backupPath)) {
      throw new Error('备份文件不存在');
    }
    
    // 检查文件大小
    const stats = fs.statSync(backupPath);
    if (stats.size === 0) {
      throw new Error('备份文件为空');
    }
    
    const testDb = new Database(backupPath, { readonly: true });
    
    // 检查数据库完整性
    testDb.pragma('integrity_check');
    
    // 检查外键约束
    const fkCheck = testDb.pragma('foreign_key_check');
    if (fkCheck.length > 0) {
      throw new Error(`外键约束违规: ${fkCheck.length} 处`);
    }
    
    // 检查表数量
    const tables = testDb.prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'").get();
    if (tables.count < 10) {
      throw new Error(`表数量异常: ${tables.count}`);
    }
    
    testDb.close();
    console.log('✓ 备份验证通过');
    
  } catch (error) {
    console.error('✗ 备份验证失败:', error.message);
    // 删除损坏的备份
    if (fs.existsSync(backupPath)) {
      fs.unlinkSync(backupPath);
      console.log('已删除损坏的备份文件');
    }
    throw error;
  }
}

/**
 * 压缩备份
 */
function compressBackup(backupPath) {
  try {
    console.log('压缩备份文件...');
    
    const compressedPath = backupPath + '.gz';
    const gzipCommand = `gzip -c "${backupPath}" > "${compressedPath}"`;
    
    exec(gzipCommand, (error, stdout, stderr) => {
      if (error) {
        console.warn('压缩失败 (gzip不可用):', error.message);
        return;
      }
      
      // 如果压缩成功，删除原文件
      if (fs.existsSync(compressedPath) && fs.statSync(compressedPath).size > 0) {
        fs.unlinkSync(backupPath);
        console.log('✓ 备份压缩完成');
      }
    });
    
  } catch (error) {
    console.warn('压缩失败:', error.message);
  }
}

/**
 * 清理旧备份
 */
function cleanupOldBackups() {
  try {
    console.log('清理旧备份...');
    
    if (!fs.existsSync(backupDir)) {
      console.log('备份目录不存在，跳过清理');
      return;
    }
    
    const backups = fs.readdirSync(backupDir)
      .filter(file => file.endsWith('.db') || file.endsWith('.db.gz'))
      .map(file => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          path: filePath,
          size: stats.size,
          created: stats.mtime,
          age: Date.now() - stats.mtime.getTime()
        };
      })
      .sort((a, b) => b.created - a.created);
    
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;
    const oneMonth = 30 * oneDay;
    
    let deletedCount = 0;
    let deletedSize = 0;
    
    // 按备份类型分类
    const dailyBackups = backups.filter(b => b.age < oneWeek);
    const weeklyBackups = backups.filter(b => b.age >= oneWeek && b.age < oneMonth);
    const monthlyBackups = backups.filter(b => b.age >= oneMonth);
    
    // 清理超过保留期限的备份
    backups.forEach(backup => {
      let shouldDelete = false;
      
      if (backup.age > backupConfig.retention.daily * oneDay && 
          backup.age < backupConfig.retention.weekly * oneWeek) {
        // 每日备份保留期
        if (dailyBackups.length > backupConfig.retention.daily) {
          shouldDelete = true;
        }
      } else if (backup.age > backupConfig.retention.weekly * oneWeek && 
                 backup.age < backupConfig.retention.monthly * oneMonth) {
        // 每周备份保留期
        if (weeklyBackups.length > backupConfig.retention.weekly) {
          shouldDelete = true;
        }
      } else if (backup.age > backupConfig.retention.monthly * oneMonth) {
        // 每月备份保留期
        if (monthlyBackups.length > backupConfig.retention.monthly) {
          shouldDelete = true;
        }
      }
      
      // 检查文件大小限制
      const sizeMB = backup.size / (1024 * 1024);
      if (sizeMB > backupConfig.maxBackupSize) {
        shouldDelete = true;
      }
      
      if (shouldDelete) {
        fs.unlinkSync(backup.path);
        deletedCount++;
        deletedSize += backup.size;
        console.log(`  删除: ${backup.name} (${(backup.size / (1024 * 1024)).toFixed(2)} MB)`);
      }
    });
    
    console.log(`✓ 清理完成: 删除 ${deletedCount} 个文件, 释放 ${(deletedSize / (1024 * 1024)).toFixed(2)} MB`);
    
  } catch (error) {
    console.error('✗ 清理旧备份失败:', error.message);
  }
}

/**
 * 获取备份统计
 */
function getBackupStats() {
  try {
    if (!fs.existsSync(backupDir)) {
      return { count: 0, totalSize: 0, compressed: 0 };
    }
    
    const backups = fs.readdirSync(backupDir);
    const totalSize = backups.reduce((sum, file) => {
      const filePath = path.join(backupDir, file);
      return sum + fs.statSync(filePath).size;
    }, 0);
    
    const compressedCount = backups.filter(file => file.endsWith('.gz')).length;
    
    return {
      count: backups.length,
      totalSize: totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      compressed: compressedCount
    };
  } catch (error) {
    console.error('获取备份统计失败:', error.message);
    return null;
  }
}

/**
 * 主备份流程
 */
async function runBackup() {
  console.log('=== 自动备份开始 ===');
  console.log('时间:', new Date().toISOString());
  console.log('');
  
  try {
    ensureDirectories();
    
    // 创建备份
    const backupPath = await createBackup();
    
    // 清理旧备份
    cleanupOldBackups();
    
    // 显示统计信息
    const stats = getBackupStats();
    if (stats) {
      console.log('\n📊 备份统计:');
      console.log(`  备份文件数: ${stats.count}`);
      console.log(`  总大小: ${stats.totalSizeMB} MB`);
      console.log(`  压缩文件: ${stats.compressed}`);
    }
    
    console.log('\n✅ 自动备份完成');
    
  } catch (error) {
    console.error('\n❌ 自动备份失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runBackup();
}

module.exports = {
  runBackup,
  createBackup,
  cleanupOldBackups,
  getBackupStats,
  backupConfig
};