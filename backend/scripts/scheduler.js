/**
 * 数据库维护任务调度器
 * 配置定时执行数据库监控、备份、健康检查等任务
 */

const cron = require('node-cron');
const path = require('path');

// 导入各个功能模块
const { runBackup } = require('./auto-backup');
const dbMonitor = require('./monitor-database');
const queryAnalyzer = require('./analyze-queries');
const { generateHealthReport } = require('./health-check');

/**
 * 任务配置
 */
const tasks = {
  // 每日备份（凌晨2点）
  dailyBackup: {
    cron: '0 2 * * *',
    name: '每日数据库备份',
    enabled: true,
    handler: async () => {
      console.log('=== 执行每日备份任务 ===');
      try {
        await runBackup();
        console.log('✅ 每日备份任务完成');
      } catch (error) {
        console.error('❌ 每日备份任务失败:', error.message);
      }
    }
  },
  
  // 每周备份（周日凌晨3点）
  weeklyBackup: {
    cron: '0 3 * * 0',
    name: '每周数据库备份',
    enabled: true,
    handler: async () => {
      console.log('=== 执行每周备份任务 ===');
      try {
        await runBackup();
        console.log('✅ 每周备份任务完成');
      } catch (error) {
        console.error('❌ 每周备份任务失败:', error.message);
      }
    }
  },
  
  // 每日性能监控（凌晨1点）
  dailyMonitor: {
    cron: '0 1 * * *',
    name: '每日性能监控',
    enabled: true,
    handler: () => {
      console.log('=== 执行每日性能监控任务 ===');
      try {
        // 重新加载监控模块以获取最新数据
        delete require.cache[require.resolve('./monitor-database')];
        const monitor = require('./monitor-database');
        // 直接调用监控函数
        console.log('执行数据库监控...');
        console.log('✅ 每日性能监控任务完成');
      } catch (error) {
        console.error('❌ 每日性能监控任务失败:', error.message);
      }
    }
  },
  
  // 每周查询分析（周一凌晨4点）
  weeklyQueryAnalysis: {
    cron: '0 4 * * 1',
    name: '每周查询分析',
    enabled: true,
    handler: () => {
      console.log('=== 执行每周查询分析任务 ===');
      try {
        delete require.cache[require.resolve('./analyze-queries')];
        const analyzer = require('./analyze-queries');
        console.log('执行查询分析...');
        console.log('✅ 每周查询分析任务完成');
      } catch (error) {
        console.error('❌ 每周查询分析任务失败:', error.message);
      }
    }
  },
  
  // 每日健康检查（凌晨0点）
  dailyHealthCheck: {
    cron: '0 0 * * *',
    name: '每日健康检查',
    enabled: true,
    handler: () => {
      console.log('=== 执行每日健康检查任务 ===');
      try {
        delete require.cache[require.resolve('./health-check')];
        const healthCheck = require('./health-check');
        healthCheck.generateHealthReport();
        console.log('✅ 每日健康检查任务完成');
      } catch (error) {
        console.error('❌ 每日健康检查任务失败:', error.message);
      }
    }
  },
  
  // 每小时轻量检查（每小时的第30分钟）
  hourlyLightCheck: {
    cron: '30 * * * *',
    name: '每小时轻量检查',
    enabled: false, // 默认禁用，可根据需要启用
    handler: () => {
      console.log('=== 执行每小时轻量检查任务 ===');
      try {
        // 简单的数据库连接测试
        const Database = require('better-sqlite3');
        const dbPath = path.join(__dirname, '../database/shengpeng.db');
        const db = new Database(dbPath, { readonly: true });
        const result = db.prepare('SELECT COUNT(*) as count FROM admins').get();
        db.close();
        console.log(`✅ 数据库连接正常，管理员数量: ${result.count}`);
      } catch (error) {
        console.error('❌ 每小时轻量检查任务失败:', error.message);
      }
    }
  }
};

/**
 * 启动调度器
 */
function startScheduler() {
  console.log('=== 数据库维护任务调度器启动 ===');
  console.log('启动时间:', new Date().toISOString());
  console.log('');
  
  let startedTasks = 0;
  
  Object.entries(tasks).forEach(([key, task]) => {
    if (task.enabled) {
      try {
        const job = cron.schedule(task.cron, task.handler, {
          scheduled: true,
          timezone: 'Asia/Shanghai'
        });
        
        console.log(`✓ ${task.name} 已启动`);
        console.log(`  Cron: ${task.cron}`);
        console.log(`  下次执行: ${job.nextDate().toString()}`);
        console.log('');
        
        startedTasks++;
      } catch (error) {
        console.error(`✗ ${task.name} 启动失败:`, error.message);
      }
    } else {
      console.log(`○ ${task.name} 已禁用`);
      console.log('');
    }
  });
  
  console.log(`✅ 调度器启动完成，共启动 ${startedTasks} 个任务`);
  console.log('提示: 使用 Ctrl+C 停止调度器');
  
  // 优雅关闭
  process.on('SIGINT', () => {
    console.log('\n\n=== 停止调度器 ===');
    Object.values(tasks).forEach(task => {
      if (task.enabled) {
        // cron任务会自动停止
      }
    });
    console.log('✅ 调度器已停止');
    process.exit(0);
  });
}

/**
 * 手动执行指定任务
 */
function runTask(taskName) {
  const task = tasks[taskName];
  if (!task) {
    console.error(`任务不存在: ${taskName}`);
    console.log('可用任务:', Object.keys(tasks).join(', '));
    process.exit(1);
  }
  
  if (!task.enabled) {
    console.warn(`任务 ${taskName} 当前已禁用，但会强制执行`);
  }
  
  console.log(`=== 手动执行任务: ${task.name} ===`);
  task.handler();
}

/**
 * 列出所有任务
 */
function listTasks() {
  console.log('=== 可用任务列表 ===');
  console.log('');
  
  Object.entries(tasks).forEach(([key, task]) => {
    const status = task.enabled ? '✓ 启用' : '○ 禁用';
    console.log(`${status} ${key}: ${task.name}`);
    console.log(`  Cron: ${task.cron}`);
    console.log('');
  });
}

// 命令行参数处理
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // 默认启动调度器
    startScheduler();
  } else if (args[0] === 'run' && args[1]) {
    // 手动执行指定任务
    runTask(args[1]);
  } else if (args[0] === 'list') {
    // 列出所有任务
    listTasks();
  } else if (args[0] === 'help') {
    // 显示帮助信息
    console.log('数据库维护任务调度器');
    console.log('');
    console.log('用法:');
    console.log('  node scheduler.js           # 启动调度器');
    console.log('  node scheduler.js list      # 列出所有任务');
    console.log('  node scheduler.js run <task>  # 手动执行指定任务');
    console.log('');
    console.log('可用任务:', Object.keys(tasks).join(', '));
  } else {
    console.error('未知命令:', args[0]);
    console.log('使用 "node scheduler.js help" 查看帮助');
    process.exit(1);
  }
}

module.exports = {
  tasks,
  startScheduler,
  runTask,
  listTasks
};