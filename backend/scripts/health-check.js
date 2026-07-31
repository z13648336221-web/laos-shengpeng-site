/**
 * 数据库健康检查脚本
 * 检查数据库完整性、性能、配置等方面
 */

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../database/shengpeng.db');
const logDir = path.join(__dirname, '../database/logs');

// 确保日志目录存在
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

/**
 * 健康检查结果
 */
const healthCheck = {
  status: 'unknown',
  checks: [],
  score: 0,
  issues: [],
  recommendations: []
};

/**
 * 检查数据库文件是否存在
 */
function checkDatabaseExists() {
  const check = {
    name: '数据库文件存在性',
    status: 'pass',
    message: '',
    details: {}
  };
  
  try {
    if (fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath);
      check.message = '数据库文件存在';
      check.details.size = stats.size;
      check.details.sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      check.details.modified = stats.mtime;
    } else {
      check.status = 'fail';
      check.message = '数据库文件不存在';
      healthCheck.issues.push('数据库文件不存在');
    }
  } catch (error) {
    check.status = 'error';
    check.message = `检查失败: ${error.message}`;
    healthCheck.issues.push(`数据库文件检查失败: ${error.message}`);
  }
  
  healthCheck.checks.push(check);
  return check;
}

/**
 * 检查数据库完整性
 */
function checkDatabaseIntegrity(db) {
  const check = {
    name: '数据库完整性',
    status: 'pass',
    message: '',
    details: {}
  };
  
  try {
    const result = db.pragma('integrity_check', { simple: true });
    if (result === 'ok') {
      check.message = '数据库完整性检查通过';
    } else {
      check.status = 'fail';
      check.message = `完整性检查失败: ${JSON.stringify(result)}`;
      healthCheck.issues.push(`数据库完整性问题: ${JSON.stringify(result)}`);
      healthCheck.recommendations.push('建议运行数据库修复');
    }
  } catch (error) {
    check.status = 'error';
    check.message = `完整性检查失败: ${error.message}`;
    healthCheck.issues.push(`完整性检查错误: ${error.message}`);
  }
  
  healthCheck.checks.push(check);
  return check;
}

/**
 * 检查外键约束
 */
function checkForeignKeys(db) {
  const check = {
    name: '外键约束',
    status: 'pass',
    message: '',
    details: {}
  };
  
  try {
    const violations = db.pragma('foreign_key_check');
    if (violations.length === 0) {
      check.message = '外键约束检查通过';
      check.details.violations = 0;
    } else {
      check.status = 'fail';
      check.message = `发现 ${violations.length} 个外键约束违规`;
      check.details.violations = violations;
      healthCheck.issues.push(`外键约束违规: ${violations.length} 处`);
      healthCheck.recommendations.push('修复外键约束违规');
    }
  } catch (error) {
    check.status = 'error';
    check.message = `外键检查失败: ${error.message}`;
    healthCheck.issues.push(`外键检查错误: ${error.message}`);
  }
  
  healthCheck.checks.push(check);
  return check;
}

/**
 * 检查数据库配置
 */
function checkDatabaseConfig(db) {
  const check = {
    name: '数据库配置',
    status: 'pass',
    message: '',
    details: {}
  };
  
  try {
    const configs = {
      encoding: db.pragma('encoding', { simple: true }),
      journalMode: db.pragma('journal_mode', { simple: true }),
      pageSize: db.pragma('page_size', { simple: true }),
      cacheSize: db.pragma('cache_size', { simple: true }),
      foreignKeys: db.pragma('foreign_keys', { simple: true }),
      synchronous: db.pragma('synchronous', { simple: true }),
      tempStore: db.pragma('temp_store', { simple: true })
    };
    
    check.details = configs;
    
    // 检查关键配置
    let issues = [];
    
    if (configs.journalMode !== 'wal') {
      issues.push('WAL模式未启用，影响并发性能');
      healthCheck.recommendations.push('启用WAL模式以提高并发性能');
    }
    
    if (configs.foreignKeys !== 1) {
      issues.push('外键约束未启用');
      healthCheck.recommendations.push('启用外键约束以确保数据完整性');
    }
    
    if (configs.pageSize < 4096) {
      issues.push('页面大小偏小，可能影响性能');
      healthCheck.recommendations.push('考虑增加页面大小到4096或8192');
    }
    
    if (issues.length > 0) {
      check.status = 'warning';
      check.message = `配置问题: ${issues.join(', ')}`;
      healthCheck.issues.push(...issues);
    } else {
      check.message = '数据库配置正常';
    }
    
  } catch (error) {
    check.status = 'error';
    check.message = `配置检查失败: ${error.message}`;
    healthCheck.issues.push(`配置检查错误: ${error.message}`);
  }
  
  healthCheck.checks.push(check);
  return check;
}

/**
 * 检查表结构
 */
function checkTableStructure(db) {
  const check = {
    name: '表结构',
    status: 'pass',
    message: '',
    details: {}
  };
  
  try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
    
    check.details.tableCount = tables.length;
    check.details.tables = tables.map(t => t.name);
    
    // 检查必要的表是否存在
    const requiredTables = ['admins', 'orders', 'customers', 'shipments', 'inquiries', 'news', 'services'];
    const missingTables = requiredTables.filter(table => !tables.some(t => t.name === table));
    
    if (missingTables.length > 0) {
      check.status = 'fail';
      check.message = `缺少必要的表: ${missingTables.join(', ')}`;
      healthCheck.issues.push(`缺少必要的表: ${missingTables.join(', ')}`);
    } else {
      check.message = '表结构正常';
    }
    
  } catch (error) {
    check.status = 'error';
    check.message = `表结构检查失败: ${error.message}`;
    healthCheck.issues.push(`表结构检查错误: ${error.message}`);
  }
  
  healthCheck.checks.push(check);
  return check;
}

/**
 * 检查索引状态
 */
function checkIndexes(db) {
  const check = {
    name: '索引状态',
    status: 'pass',
    message: '',
    details: {}
  };
  
  try {
    const indexes = db.prepare(`
      SELECT 
        tbl_name as table_name,
        name as index_name
      FROM sqlite_master 
      WHERE type = 'index' 
      AND tbl_name NOT LIKE 'sqlite_%'
    `).all();
    
    check.details.indexCount = indexes.length;
    check.details.indexes = indexes;
    
    // 检查是否有表完全没有索引
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
    const tablesWithoutIndexes = tables.filter(table => 
      !indexes.some(idx => idx.table_name === table.name)
    );
    
    if (tablesWithoutIndexes.length > 0) {
      check.status = 'warning';
      check.message = `部分表缺少索引: ${tablesWithoutIndexes.map(t => t.name).join(', ')}`;
      healthCheck.recommendations.push('为缺少索引的表添加适当的索引');
    } else {
      check.message = '索引状态正常';
    }
    
  } catch (error) {
    check.status = 'error';
    check.message = `索引检查失败: ${error.message}`;
    healthCheck.issues.push(`索引检查错误: ${error.message}`);
  }
  
  healthCheck.checks.push(check);
  return check;
}

/**
 * 检查数据量
 */
function checkDataVolume(db) {
  const check = {
    name: '数据量',
    status: 'pass',
    message: '',
    details: {}
  };
  
  try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
    const tableStats = {};
    let totalRecords = 0;
    
    tables.forEach(table => {
      const countResult = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
      tableStats[table.name] = countResult.count;
      totalRecords += countResult.count;
    });
    
    check.details.tableStats = tableStats;
    check.details.totalRecords = totalRecords;
    
    // 检查是否有表数据量异常
    const largeTables = Object.entries(tableStats).filter(([name, count]) => count > 10000);
    if (largeTables.length > 0) {
      check.status = 'warning';
      check.message = `部分表数据量较大: ${largeTables.map(([name, count]) => `${name}(${count.toLocaleString()})`).join(', ')}`;
      healthCheck.recommendations.push('考虑对大表进行分区或归档');
    } else {
      check.message = `数据量正常 (总计 ${totalRecords.toLocaleString()} 条记录)`;
    }
    
  } catch (error) {
    check.status = 'error';
    check.message = `数据量检查失败: ${error.message}`;
    healthCheck.issues.push(`数据量检查错误: ${error.message}`);
  }
  
  healthCheck.checks.push(check);
  return check;
}

/**
 * 检查数据库性能
 */
function checkPerformance(db) {
  const check = {
    name: '数据库性能',
    status: 'pass',
    message: '',
    details: {}
  };
  
  try {
    // 简单性能测试
    const queries = [
      'SELECT COUNT(*) FROM admins',
      'SELECT COUNT(*) FROM orders',
      'SELECT COUNT(*) FROM customers'
    ];
    
    const results = [];
    let totalTime = 0;
    
    queries.forEach(sql => {
      const start = Date.now();
      db.prepare(sql).get();
      const duration = Date.now() - start;
      results.push({ sql, duration });
      totalTime += duration;
    });
    
    check.details.queries = results;
    check.details.averageTime = (totalTime / queries.length).toFixed(2);
    
    if (totalTime > 100) {
      check.status = 'warning';
      check.message = `查询性能较慢 (平均 ${check.details.averageTime}ms)`;
      healthCheck.recommendations.push('考虑优化查询或添加索引');
    } else {
      check.message = `性能正常 (平均 ${check.details.averageTime}ms)`;
    }
    
  } catch (error) {
    check.status = 'error';
    check.message = `性能检查失败: ${error.message}`;
    healthCheck.issues.push(`性能检查错误: ${error.message}`);
  }
  
  healthCheck.checks.push(check);
  return check;
}

/**
 * 计算健康评分
 */
function calculateScore() {
  let score = 100;
  
  healthCheck.checks.forEach(check => {
    if (check.status === 'fail') {
      score -= 20;
    } else if (check.status === 'warning') {
      score -= 10;
    } else if (check.status === 'error') {
      score -= 15;
    }
  });
  
  return Math.max(0, score);
}

/**
 * 生成健康检查报告
 */
function generateHealthReport() {
  console.log('=== 数据库健康检查报告 ===');
  console.log('时间:', new Date().toISOString());
  console.log('');
  
  try {
    // 重置健康检查状态
    healthCheck.status = 'unknown';
    healthCheck.checks = [];
    healthCheck.score = 0;
    healthCheck.issues = [];
    healthCheck.recommendations = [];
    
    // 检查数据库文件存在性
    const existenceCheck = checkDatabaseExists();
    if (existenceCheck.status === 'fail') {
      healthCheck.status = 'critical';
      console.log('❌ 数据库文件不存在，无法继续检查');
      return;
    }
    
    // 打开数据库连接
    const db = new Database(dbPath, { readonly: true });
    
    // 执行各项检查
    checkDatabaseIntegrity(db);
    checkForeignKeys(db);
    checkDatabaseConfig(db);
    checkTableStructure(db);
    checkIndexes(db);
    checkDataVolume(db);
    checkPerformance(db);
    
    db.close();
    
    // 计算健康评分
    healthCheck.score = calculateScore();
    
    // 确定总体状态
    if (healthCheck.score >= 90) {
      healthCheck.status = 'healthy';
    } else if (healthCheck.score >= 70) {
      healthCheck.status = 'good';
    } else if (healthCheck.score >= 50) {
      healthCheck.status = 'warning';
    } else {
      healthCheck.status = 'critical';
    }
    
    // 显示检查结果
    console.log('🏥 健康检查结果:');
    healthCheck.checks.forEach(check => {
      const icon = check.status === 'pass' ? '✓' : 
                   check.status === 'warning' ? '⚠️' : 
                   check.status === 'fail' ? '❌' : '❓';
      console.log(`  ${icon} ${check.name}: ${check.message}`);
    });
    
    console.log('');
    console.log('📊 健康评分:');
    console.log(`  总分: ${healthCheck.score}/100`);
    console.log(`  状态: ${healthCheck.status.toUpperCase()}`);
    
    if (healthCheck.issues.length > 0) {
      console.log('');
      console.log('⚠️  发现问题:');
      healthCheck.issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue}`);
      });
    }
    
    if (healthCheck.recommendations.length > 0) {
      console.log('');
      console.log('💡 优化建议:');
      healthCheck.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
    }
    
    // 保存报告到日志文件
    const logFile = path.join(logDir, `health-check-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    const reportContent = {
      timestamp: new Date().toISOString(),
      status: healthCheck.status,
      score: healthCheck.score,
      checks: healthCheck.checks,
      issues: healthCheck.issues,
      recommendations: healthCheck.recommendations
    };
    
    fs.writeFileSync(logFile, JSON.stringify(reportContent, null, 2));
    console.log(`\n📝 健康检查报告已保存: ${logFile}`);
    
    console.log('\n✅ 健康检查完成');
    
  } catch (error) {
    console.error('❌ 健康检查失败:', error.message);
    healthCheck.status = 'error';
    healthCheck.issues.push(`健康检查失败: ${error.message}`);
    process.exit(1);
  }
}

// 运行健康检查
generateHealthReport();

module.exports = {
  generateHealthReport,
  healthCheck
};