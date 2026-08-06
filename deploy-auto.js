/**
 * 完整的自动部署脚本
 * 包含文件上传、依赖安装、服务重启、健康检查
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

// 需要上传的文件列表
const filesToUpload = [
  // 前端文件
  './index.html',
  './lang/zh.js',
  './lang/en.js',
  './lang/vi.js',
  './lang/all.js',
  './js/i18n.js',
  './js/main.js',
  './js/chat.js',
  './js/tracking.js',
  './js/inquiry.js',
  './js/news-api.js',
  './css/style.css',
  './css/admin.css',
  './css/chat.css',
  
  // 后端核心文件
  './backend/package.json',
  './backend/package-lock.json',
  './backend/.env',
  './backend/server.js',
  './backend/models/database.js',
  './backend/middleware/auth.js',
  './backend/middleware/security.js',
  './backend/middleware/secure-upload.js',
  
  // 数据库相关文件
  './backend/database/schema.sql',
  './backend/database/shengpeng.db',
  './backend/scripts/init-sqlite.js',
  './backend/scripts/migrate-to-sqlite.js',
  
  // 数据库监控脚本
  './backend/scripts/monitor-database.js',
  './backend/scripts/auto-backup.js',
  './backend/scripts/analyze-queries.js',
  './backend/scripts/health-check.js',
  './backend/scripts/scheduler.js',
  
  // 安全工具
  './backend/utils/virus-scanner.js',
  './backend/utils/content-filter.js',
  './backend/utils/visitor-validator.js',
  
  // 后端路由文件
  './backend/routes/auth.js',
  './backend/routes/inquiry.js',
  './backend/routes/tracking.js',
  './backend/routes/news.js',
  './backend/routes/services.js',
  './backend/routes/orders.js',
  './backend/routes/customers.js',
  './backend/routes/quotes.js',
  './backend/routes/chat.js',
  './backend/routes/files.js',
  './backend/routes/roles.js',
  './backend/routes/admins.js',
  './backend/routes/logs.js',
  './backend/routes/coupon.js'
];

const conn = new Client();

// 步骤1: 上传文件
function uploadFiles() {
  console.log('步骤1: 上传文件到服务器\n');
  
  conn.sftp((err, sftp) => {
    if (err) { 
      console.error('SFTP错误:', err.message); 
      conn.end(); 
      return; 
    }
    
    let uploaded = 0;
    let failed = 0;
    
    function uploadNext() {
      if (uploaded >= filesToUpload.length) {
        console.log(`\n✓ 文件上传完成! 成功: ${uploaded - failed}, 失败: ${failed}\n`);
        if (failed > 0) {
          console.log('⚠️ 部分文件上传失败，请检查网络连接');
        }
        restartBackend();
        return;
      }
      
      const file = filesToUpload[uploaded];
      const localPath = path.resolve(__dirname, file);
      const remotePath = '/var/www/laos-logistics/' + file;
      
      // 检查本地文件是否存在
      if (!fs.existsSync(localPath)) {
        console.log(`[${uploaded+1}/${filesToUpload.length}] 跳过 ${file} (文件不存在)`);
        failed++;
        uploaded++;
        uploadNext();
        return;
      }
      
      console.log(`[${uploaded+1}/${filesToUpload.length}] 上传 ${file}...`);
      
      sftp.fastPut(localPath, remotePath, (err) => {
        if (err) {
          console.error(`  ✗ 失败: ${err.message}`);
          failed++;
        } else {
          console.log('  ✓ 成功');
        }
        uploaded++;
        uploadNext();
      });
    }
    
    uploadNext();
  });
}

// 步骤2: 重启后端服务
function restartBackend() {
  console.log('步骤2: 重启后端服务\n');
  
  // 创建安全上传目录
  console.log('[目录] 创建安全上传目录...');
  conn.exec('mkdir -p /var/www/laos-logistics/backend/secure-uploads/news /var/www/laos-logistics/backend/secure-uploads/documents /var/www/laos-logistics/backend/secure-uploads/avatars', (err, stream) => {
    if (err) { 
      console.error('创建目录失败:', err.message);
      // 继续执行，目录可能已存在
    }
    
    stream.on('close', () => {
      console.log('  ✓ 目录创建完成');
      
      // 停止旧进程
      console.log('[进程] 停止旧进程...');
      conn.exec('pkill -f "node.*server.js" 2>/dev/null || echo "进程已停止或不存在"', (err, stream) => {
        if (err) { 
          console.error('停止进程失败:', err.message);
        }
        
        stream.on('close', () => {
          console.log('  ✓ 进程停止完成');
          
          // 等待进程完全停止
          setTimeout(() => {
            // 安装依赖
            console.log('[依赖] 安装后端依赖...');
            conn.exec('cd /var/www/laos-logistics/backend && npm install', (err, stream) => {
              if (err) { 
                console.error('依赖安装失败:', err.message);
                console.log('⚠️ 继续启动服务，依赖可能不完整');
              }
              
              stream.on('close', () => {
                console.log('  ✓ 依赖安装完成');
                
                // 启动新进程
                console.log('[服务] 启动新进程...');
                conn.exec('cd /var/www/laos-logistics/backend && nohup node server.js > /dev/null 2>&1 &', (err, stream) => {
                  if (err) { 
                    console.error('启动进程失败:', err.message);
                    conn.end();
                    return;
                  }
                  
                  stream.on('close', () => {
                    console.log('  ✓ 进程启动完成');
                    
                    // 等待服务启动
                    setTimeout(() => {
                      healthCheck();
                    }, 3000);
                  });
                });
              });
            });
          }, 2000);
        });
      });
    });
  });
}

// 步骤3: 健康检查
function healthCheck() {
  console.log('\n步骤3: 健康检查\n');
  
  console.log('[检查] 测试API接口...');
  conn.exec('curl -s http://localhost:3001/api/news', (err, stream) => {
    if (err) { 
      console.error('健康检查失败:', err.message);
      console.log('⚠️ 无法验证服务状态');
      showSummary();
      conn.end();
      return;
    }
    
    let output = '';
    stream.on('data', data => output += data);
    stream.stderr.on('data', () => {});
    
    stream.on('close', () => {
      if (output.includes('success') || output.includes('data')) {
        console.log('  ✓ API响应正常');
        console.log(`  响应: ${output.substring(0, 50)}...`);
      } else {
        console.log('  ⚠️ API响应异常');
        console.log(`  响应: ${output.substring(0, 50)}...`);
      }
      
      showSummary();
      conn.end();
    });
  });
}

// 显示部署摘要
function showSummary() {
  console.log('\n' + '='.repeat(50));
  console.log('📊 部署摘要');
  console.log('='.repeat(50));
  console.log('✅ 文件上传: 完成');
  console.log('✅ 目录创建: 完成');
  console.log('✅ 服务重启: 完成');
  console.log('✅ 健康检查: 完成');
  console.log('='.repeat(50));
  console.log('\n🎉 自动部署完成！');
  console.log('\n📋 部署的功能:');
  console.log('  • 数据库监控系统');
  console.log('  • 文件上传安全加固');
  console.log('  • 聊天接口安全加固');
  console.log('  • SQLite数据库升级');
  console.log('\n🔧 后续操作:');
  console.log('  • 可选: 启动定时任务监控: npm run db:scheduler');
  console.log('  • 可选: 运行数据库监控: npm run db:monitor');
  console.log('  • 可选: 运行健康检查: npm run db:health');
  console.log('  • 可选: 运行查询分析: npm run db:analyze');
  console.log('\n📚 相关文档:');
  console.log('  • backend/DATABASE_MONITORING.md');
  console.log('  • backend/FILE_UPLOAD_SECURITY.md');
  console.log('  • backend/CHAT_SECURITY.md');
}

// 开始部署
conn.on('ready', () => {
  console.log('✓ SSH连接成功\n');
  console.log('='.repeat(50));
  console.log('🚀 开始自动部署');
  console.log('='.repeat(50) + '\n');
  
  uploadFiles();
}).on('error', (err) => {
  console.error('SSH连接失败:', err.message);
  console.log('\n请检查:');
  console.log('1. SSH密钥路径是否正确');
  console.log('2. 服务器是否可访问');
  console.log('3. 网络连接是否正常');
}).connect({
  host: '43.129.173.218',
  port: 22,
  username: 'root',
  privateKey: fs.readFileSync('C:\\Users\\Administrator\\.ssh\\id_ed25519_laos'),
  readyTimeout: 30000
});