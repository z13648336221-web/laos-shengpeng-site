/**
 * 数据库性能监控脚本
 * 监控数据库文件大小、查询性能、表统计等信息
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../database/shengpeng.db');
const backupDir = path.join(__dirname, '../database/backups');
const logDir = path.join(__dirname, '../database/logs');

// 确保日志目录存在
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

/**
 * 获取数据库文件大小
 */
function getDatabaseSize() {
  try {
    const stats = fs.statSync(dbPath);
    const sizeInBytes = stats.size;
    const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
    const sizeInGB = (sizeInBytes / (1024 * 1024 * 1024)).toFixed(2);
    
    return {
      bytes: sizeInBytes,
      mb: parseFloat(sizeInMB),
      gb: parseFloat(sizeInGB),
      formatted: sizeInMB > 1024 ? `${sizeInGB} GB` : `${sizeInMB} MB`
    };
  } catch (error) {
    console.error('获取数据库大小失败:', error.message);
    return null;
  }
}

/**
 * 获取数据库统计信息
 */
function getDatabaseStats(db) {
  try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
    const stats = {};
    
    tables.forEach(table => {
      const countResult = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
      const sizeResult = db.prepare(`SELECT COUNT(*) * 8 as estimated_size FROM ${table.name}`).get(); // 估算大小
      
      stats[table.name] = {
        count: countResult.count,
        estimatedSize: sizeResult.estimated_size
      };
    });
    
    return stats;
  } catch (error) {
    console.error('获取数据库统计失败:', error.message);
    return null;
  }
}

/**
 * 检测数据库碎片化
 */
function checkFragmentation(db) {
  try {
    // 获取数据库页面信息
    const pageCount = db.pragma('page_count', { simple: true });
    const pageSize = db.pragma('page_size', { simple: true });
    const freelistCount = db.pragma('freelist_count', { simple: true });
    
    const totalSize = pageCount * pageSize;
    const freeSize = freelistCount * pageSize;
    const fragmentationPercent = ((freeSize / totalSize) * 100).toFixed(2);
    
    return {
      pageCount,
      pageSize,
      totalSize,
      freeSize,
      fragmentationPercent: parseFloat(fragmentationPercent),
      needsVacuum: parseFloat(fragmentationPercent) > 20 // 碎片化超过20%建议清理
    };
  } catch (error) {
    console.error('检查碎片化失败:', error.message);
    return null;
  }
}

/**
 * 测试查询性能
 */
function testQueryPerformance(db) {
  try {
    const queries = [
      {
        name: '简单查询 - 管理员',
        sql: 'SELECT * FROM admins WHERE status = ?',
        params: ['active']
      },
      {
        name: '连接查询 - 订单和客户',
        sql: 'SELECT o.*, c.name as customer_name FROM orders o LEFT JOIN customers c ON o.customer_id = c.id LIMIT 10',
        params: []
      },
      {
        name: '聚合查询 - 统计订单',
        sql: 'SELECT status, COUNT(*) as count FROM orders GROUP BY status',
        params: []
      },
      {
        name: '复杂查询 - 追踪事件',
        sql: 'SELECT s.*, te.status as latest_status FROM shipments s LEFT JOIN tracking_events te ON s.id = te.shipment_id WHERE te.id IN (SELECT MAX(id) FROM tracking_events GROUP BY shipment_id)',
        params: []
      }
    ];
    
    const results = [];
    
    queries.forEach(query => {
      const start = Date.now();
      try {
        const stmt = db.prepare(query.sql);
        if (query.params.length > 0) {
          stmt.all(...query.params);
        } else {
          stmt.all();
        }
        const duration = Date.now() - start;
        
        results.push({
          name: query.name,
          duration: duration,
          status: duration < 100 ? 'good' : duration < 500 ? 'warning' : 'slow'
        });
      } catch (error) {
        results.push({
          name: query.name,
          duration: -1,
          status: 'error',
          error: error.message
        });
      }
    });
    
    return results;
  } catch (error) {
    console.error('测试查询性能失败:', error.message);
    return null;
  }
}

/**
 * 检查数据库健康状态
 */
function checkDatabaseHealth(db) {
  try {
    const health = {
      integrity: null,
      foreignKeys: null,
      encoding: null,
      journalMode: null,
      WALMode: null
    };
    
    // 检查数据库完整性
    try {
      db.pragma('integrity_check');
      health.integrity = 'OK';
    } catch (error) {
      health.integrity = 'FAILED: ' + error.message;
    }
    
    // 检查外键约束
    try {
      const fkCheck = db.pragma('foreign_key_check');
      health.foreignKeys = fkCheck.length === 0 ? 'OK' : 'VIOLATIONS: ' + fkCheck.length;
    } catch (error) {
      health.foreignKeys = 'ERROR: ' + error.message;
    }
    
    // 检查编码
    health.encoding = db.pragma('encoding', { simple: true });
    
    // 检查日志模式
    health.journalMode = db.pragma('journal_mode', { simple: true });
    
    // 检查WAL模式
    health.WALMode = health.journalMode === 'wal';
    
    return health;
  } catch (error) {
    console.error('检查数据库健康失败:', error.message);
    return null;
  }
}

/**
 * 获取备份信息
 */
function getBackupInfo() {
  try {
    if (!fs.existsSync(backupDir)) {
      return { count: 0, totalSize: 0, latest: null, oldest: null };
    }
    
    const backups = fs.readdirSync(backupDir)
      .filter(file => file.endsWith('.db'))
      .map(file => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: stats.size,
          created: stats.mtime
        };
      })
      .sort((a, b) => b.created - a.created);
    
    const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
    
    return {
      count: backups.length,
      totalSize: totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      latest: backups.length > 0 ? backups[0] : null,
      oldest: backups.length > 0 ? backups[backups.length - 1] : null
    };
  } catch (error) {
    console.error('获取备份信息失败:', error.message);
    return null;
  }
}

/**
 * 生成监控报告
 */
function generateReport() {
  console.log('=== 数据库性能监控报告 ===');
  console.log('时间:', new Date().toISOString());
  console.log('');
  
  try {
    const db = new Database(dbPath, { readonly: true });
    
    // 数据库大小
    console.log('📊 数据库大小:');
    const size = getDatabaseSize();
    if (size) {
      console.log(`  文件大小: ${size.formatted} (${size.bytes.toLocaleString()} bytes)`);
      if (size.mb > 100) {
        console.log(`  ⚠️  警告: 数据库文件较大，建议考虑优化或迁移`);
      }
    }
    console.log('');
    
    // 数据库统计
    console.log('📈 数据统计:');
    const stats = getDatabaseStats(db);
    if (stats) {
      Object.entries(stats).forEach(([table, data]) => {
        console.log(`  ${table}: ${data.count.toLocaleString()} 条记录`);
      });
    }
    console.log('');
    
    // 碎片化检查
    console.log('🔧 碎片化状态:');
    const fragmentation = checkFragmentation(db);
    if (fragmentation) {
      console.log(`  总页面数: ${fragmentation.pageCount.toLocaleString()}`);
      console.log(`  页面大小: ${fragmentation.pageSize} bytes`);
      console.log(`  碎片化: ${fragmentation.fragmentationPercent}%`);
      if (fragmentation.needsVacuum) {
        console.log(`  ⚠️  建议: 运行 VACUUM 命令清理碎片`);
      } else {
        console.log(`  ✓ 碎片化程度正常`);
      }
    }
    console.log('');
    
    // 查询性能
    console.log('⚡ 查询性能:');
    const performance = testQueryPerformance(db);
    if (performance) {
      performance.forEach(result => {
        const icon = result.status === 'good' ? '✓' : result.status === 'warning' ? '⚠️' : result.status === 'slow' ? '🐌' : '❌';
        console.log(`  ${icon} ${result.name}: ${result.duration}ms`);
        if (result.error) {
          console.log(`     错误: ${result.error}`);
        }
      });
    }
    console.log('');
    
    // 健康检查
    console.log('🏥 健康状态:');
    const health = checkDatabaseHealth(db);
    if (health) {
      console.log(`  完整性: ${health.integrity === 'OK' ? '✓ 正常' : '❌ ' + health.integrity}`);
      console.log(`  外键约束: ${health.foreignKeys === 'OK' ? '✓ 正常' : '❌ ' + health.foreignKeys}`);
      console.log(`  编码: ${health.encoding}`);
      console.log(`  日志模式: ${health.journalMode}`);
      console.log(`  WAL模式: ${health.WALMode ? '✓ 已启用' : '❌ 未启用'}`);
    }
    console.log('');
    
    // 备份信息
    console.log('💾 备份信息:');
    const backupInfo = getBackupInfo();
    if (backupInfo) {
      console.log(`  备份数量: ${backupInfo.count}`);
      console.log(`  总大小: ${backupInfo.totalSizeMB} MB`);
      if (backupInfo.latest) {
        console.log(`  最新备份: ${backupInfo.latest.name} (${backupInfo.latest.created.toISOString()})`);
      }
      if (backupInfo.oldest) {
        console.log(`  最旧备份: ${backupInfo.oldest.name} (${backupInfo.oldest.created.toISOString()})`);
      }
    }
    console.log('');
    
    // 性能评估
    console.log('📋 性能评估:');
    let score = 100;
    let issues = [];
    
    if (size && size.mb > 100) {
      score -= 10;
      issues.push('数据库文件较大');
    }
    
    if (fragmentation && fragmentation.needsVacuum) {
      score -= 15;
      issues.push('碎片化程度高');
    }
    
    if (performance) {
      const slowQueries = performance.filter(q => q.status === 'slow').length;
      if (slowQueries > 0) {
        score -= slowQueries * 10;
        issues.push(`${slowQueries} 个慢查询`);
      }
    }
    
    if (health && health.integrity !== 'OK') {
      score -= 30;
      issues.push('数据库完整性检查失败');
    }
    
    if (health && !health.WALMode) {
      score -= 5;
      issues.push('WAL模式未启用');
    }
    
    if (backupInfo && backupInfo.count === 0) {
      score -= 10;
      issues.push('无备份文件');
    }
    
    score = Math.max(0, score);
    
    if (score >= 90) {
      console.log(`  总分: ${score}/100 (优秀)`);
    } else if (score >= 70) {
      console.log(`  总分: ${score}/100 (良好)`);
    } else if (score >= 50) {
      console.log(`  总分: ${score}/100 (一般)`);
    } else {
      console.log(`  总分: ${score}/100 (需要优化)`);
    }
    
    if (issues.length > 0) {
      console.log(`  发现问题:`);
      issues.forEach(issue => console.log(`    - ${issue}`));
    }
    
    db.close();
    
    // 保存报告到日志文件
    const logFile = path.join(logDir, `monitor-${new Date().toISOString().replace(/[:.]/g, '-')}.log`);
    const reportContent = {
      timestamp: new Date().toISOString(),
      size,
      stats,
      fragmentation,
      performance,
      health,
      backupInfo,
      score,
      issues
    };
    
    fs.writeFileSync(logFile, JSON.stringify(reportContent, null, 2));
    console.log(`\n📝 监控报告已保存: ${logFile}`);
    
  } catch (error) {
    console.error('生成监控报告失败:', error.message);
    process.exit(1);
  }
}

// 运行监控
generateReport();