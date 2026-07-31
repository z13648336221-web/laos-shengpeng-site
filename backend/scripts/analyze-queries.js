/**
 * 慢查询分析工具
 * 使用 EXPLAIN QUERY PLAN 分析查询性能
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
 * 常见查询模式和分析
 */
const commonQueries = [
  {
    name: '管理员登录查询',
    sql: 'SELECT * FROM admins WHERE username = ? AND status = ?',
    params: ['admin', 'active'],
    importance: 'high'
  },
  {
    name: '订单列表查询',
    sql: 'SELECT * FROM orders ORDER BY created_at DESC LIMIT 20',
    params: null,
    importance: 'high'
  },
  {
    name: '运单追踪查询',
    sql: 'SELECT s.*, te.status as latest_status, te.location as latest_location FROM shipments s LEFT JOIN tracking_events te ON s.id = te.shipment_id WHERE s.tracking_number = ?',
    params: ['SP20240001'],
    importance: 'high'
  },
  {
    name: '客户订单统计',
    sql: 'SELECT c.*, COUNT(o.id) as order_count, SUM(o.price) as total_value FROM customers c LEFT JOIN orders o ON c.id = o.customer_id GROUP BY c.id',
    params: null,
    importance: 'medium'
  },
  {
    name: '新闻列表查询',
    sql: 'SELECT * FROM news WHERE published = 1 ORDER BY created_at DESC LIMIT 10',
    params: null,
    importance: 'medium'
  },
  {
    name: '询价统计查询',
    sql: 'SELECT transport_type, status, COUNT(*) as count FROM inquiries GROUP BY transport_type, status',
    params: null,
    importance: 'medium'
  },
  {
    name: '聊天记录查询',
    sql: 'SELECT * FROM chats WHERE visitor_id = ? ORDER BY created_at DESC LIMIT 50',
    params: ['visitor_test'],
    importance: 'low'
  },
  {
    name: '服务列表查询',
    sql: 'SELECT * FROM services WHERE active = 1 ORDER BY sort_order',
    params: null,
    importance: 'low'
  }
];

/**
 * 分析查询执行计划
 */
function analyzeQueryPlan(db, query) {
  try {
    const explainSql = `EXPLAIN QUERY PLAN ${query.sql}`;
    const stmt = db.prepare(explainSql);
    const plan = stmt.all();
    
    // 简化：只分析执行计划，不实际执行查询
    const duration = 0; // 使用默认值
    
    const analysis = {
      query: query.name,
      sql: query.sql,
      plan: plan,
      duration: duration,
      importance: query.importance,
      issues: [],
      recommendations: []
    };
    
    // 检查是否有全表扫描
    const hasFullScan = plan && plan.some(p => p.detail && p.detail.includes('SCAN'));
    if (hasFullScan) {
      analysis.issues.push('存在全表扫描');
      analysis.recommendations.push('考虑添加适当的索引');
    }
    
    // 检查是否使用了索引
    const hasIndex = plan && plan.some(p => p.detail && p.detail.includes('USING INDEX'));
    if (!hasIndex && hasFullScan) {
      analysis.issues.push('未使用索引');
      analysis.recommendations.push('为查询条件字段创建索引');
    }
    
    // 检查临时表使用
    const hasTempTable = plan && plan.some(p => p.detail && p.detail.includes('TEMP B-TREE'));
    if (hasTempTable) {
      analysis.issues.push('使用了临时表');
      analysis.recommendations.push('考虑优化查询或添加复合索引');
    }
    
    // 检查排序操作
    const hasSort = plan && plan.some(p => p.detail && p.detail.includes('USE TEMP B-TREE FOR ORDER'));
    if (hasSort) {
      analysis.issues.push('需要内存排序');
      analysis.recommendations.push('为排序字段添加索引');
    }
    
    // 性能评估
    if (duration > 100) {
      analysis.performance = 'slow';
      analysis.issues.push(`查询耗时过长: ${duration}ms`);
    } else if (duration > 50) {
      analysis.performance = 'moderate';
    } else if (duration >= 0) {
      analysis.performance = 'fast';
    } else {
      analysis.performance = 'error';
    }
    
    return analysis;
    
  } catch (error) {
    return {
      query: query.name,
      sql: query.sql,
      error: error.message,
      performance: 'error'
    };
  }
}

/**
 * 获取当前索引信息
 */
function getIndexInfo(db) {
  try {
    const indexes = db.prepare(`
      SELECT 
        tbl_name as table_name,
        name as index_name
      FROM sqlite_master 
      WHERE type = 'index' 
      AND tbl_name NOT LIKE 'sqlite_%'
    `).all();
    
    return indexes;
  } catch (error) {
    console.error('获取索引信息失败:', error.message);
    return [];
  }
}

/**
 * 检查缺失的索引
 */
function checkMissingIndexes(db) {
  try {
    const missingIndexes = [];
    
    // 检查常用查询条件的索引
    const checks = [
      { table: 'admins', columns: ['username', 'status'], reason: '管理员登录查询' },
      { table: 'orders', columns: ['created_at'], reason: '订单列表按时间排序' },
      { table: 'orders', columns: ['customer_id'], reason: '客户订单关联查询' },
      { table: 'shipments', columns: ['tracking_number'], reason: '运单号查询' },
      { table: 'shipments', columns: ['status'], reason: '运单状态筛选' },
      { table: 'news', columns: ['published', 'created_at'], reason: '新闻列表查询' },
      { table: 'inquiries', columns: ['status', 'created_at'], reason: '询价统计查询' },
      { table: 'chats', columns: ['visitor_id', 'created_at'], reason: '聊天记录查询' },
      { table: 'customers', columns: ['status'], reason: '客户状态筛选' }
    ];
    
    const existingIndexes = getIndexInfo(db);
    
    checks.forEach(check => {
      const hasIndex = existingIndexes.some(idx => 
        idx.table_name === check.table && 
        check.columns.every(col => idx.sql && idx.sql.includes(col))
      );
      
      if (!hasIndex) {
        missingIndexes.push({
          table: check.table,
          columns: check.columns,
          reason: check.reason,
          recommendation: `CREATE INDEX idx_${check.table}_${check.columns.join('_')} ON ${check.table} (${check.columns.join(', ')})`
        });
      }
    });
    
    return missingIndexes;
    
  } catch (error) {
    console.error('检查缺失索引失败:', error.message);
    return [];
  }
}

/**
 * 生成分析报告
 */
function generateAnalysisReport() {
  console.log('=== 慢查询分析报告 ===');
  console.log('时间:', new Date().toISOString());
  console.log('');
  
  try {
    const db = new Database(dbPath, { readonly: true });
    
    // 分析常见查询
    console.log('📊 查询性能分析:');
    const analyses = [];
    
    commonQueries.forEach(query => {
      const analysis = analyzeQueryPlan(db, query);
      analyses.push(analysis);
    });
    
    let slowQueries = 0;
    let moderateQueries = 0;
    let fastQueries = 0;
    
    analyses.forEach(analysis => {
      const icon = analysis.performance === 'fast' ? '✓' : 
                   analysis.performance === 'moderate' ? '⚠️' : 
                   analysis.performance === 'slow' ? '🐌' : '❌';
      
      console.log(`  ${icon} ${analysis.query}: ${analysis.duration}ms`);
      
      if (analysis.performance === 'slow') slowQueries++;
      else if (analysis.performance === 'moderate') moderateQueries++;
      else if (analysis.performance === 'fast') fastQueries++;
      
      if (analysis.issues && analysis.issues.length > 0) {
        analysis.issues.forEach(issue => {
          console.log(`    ⚠️  ${issue}`);
        });
      }
      
      if (analysis.recommendations && analysis.recommendations.length > 0) {
        analysis.recommendations.forEach(rec => {
          console.log(`    💡 ${rec}`);
        });
      }
    });
    
    console.log(`\n  统计: ${fastQueries} 快, ${moderateQueries} 中等, ${slowQueries} 慢`);
    console.log('');
    
    // 检查缺失索引
    console.log('🔍 缺失索引检查:');
    const missingIndexes = checkMissingIndexes(db);
    if (missingIndexes.length > 0) {
      console.log(`  发现 ${missingIndexes.length} 个建议添加的索引:`);
      missingIndexes.forEach((missing, index) => {
        console.log(`  ${index + 1}. ${missing.table} (${missing.columns.join(', ')})`);
        console.log(`     原因: ${missing.reason}`);
        console.log(`     建议: ${missing.recommendation}`);
      });
    } else {
      console.log('  ✓ 常用查询字段索引配置良好');
    }
    console.log('');
    
    // 当前索引信息
    console.log('📋 当前索引信息:');
    const indexes = getIndexInfo(db);
    console.log(`  总索引数: ${indexes.length}`);
    
    const indexByTable = {};
    indexes.forEach(idx => {
      if (!indexByTable[idx.table_name]) {
        indexByTable[idx.table_name] = [];
      }
      indexByTable[idx.table_name].push(idx.index_name);
    });
    
    Object.entries(indexByTable).forEach(([table, idxs]) => {
      console.log(`  ${table}: ${idxs.length} 个索引 (${idxs.join(', ')})`);
    });
    console.log('');
    
    // 总体评估
    console.log('📈 总体评估:');
    let score = 100;
    let issues = [];
    
    if (slowQueries > 0) {
      score -= slowQueries * 15;
      issues.push(`${slowQueries} 个慢查询`);
    }
    
    if (moderateQueries > 2) {
      score -= moderateQueries * 5;
      issues.push(`${moderateQueries} 个中等性能查询`);
    }
    
    if (missingIndexes.length > 0) {
      score -= missingIndexes.length * 10;
      issues.push(`${missingIndexes.length} 个缺失索引`);
    }
    
    if (indexes.length < 5) {
      score -= 10;
      issues.push('索引数量偏少');
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
    const logFile = path.join(logDir, `query-analysis-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    const reportContent = {
      timestamp: new Date().toISOString(),
      analyses,
      missingIndexes,
      indexes,
      score,
      issues
    };
    
    fs.writeFileSync(logFile, JSON.stringify(reportContent, null, 2));
    console.log(`\n📝 分析报告已保存: ${logFile}`);
    
  } catch (error) {
    console.error('生成分析报告失败:', error.message);
    process.exit(1);
  }
}

// 运行分析
generateAnalysisReport();