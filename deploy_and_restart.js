const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

// 需要上传的文件列表（数据库升级后的后端文件）
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
  
  // 后端核心文件（数据库升级后）
  './backend/package.json',
  './backend/package-lock.json',
  './backend/.env',
  './backend/server.js',
  './backend/models/database.js',
  './backend/middleware/auth.js',
  './backend/middleware/security.js',
  
  // 数据库相关文件
  './backend/database/schema.sql',
  './backend/database/shengpeng.db',
  './backend/scripts/init-sqlite.js',
  './backend/scripts/migrate-to-sqlite.js',
  
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
  './backend/routes/roles.js',
  './backend/routes/admins.js',
  './backend/routes/logs.js',
  './backend/routes/coupon.js'
];

const conn = new Client();

// 第二步：数据库迁移和重启后端
function restartBackend() {
  console.log('[重启] 停止旧进程...');
  conn.exec('pkill -f "node.*server.js" 2>/dev/null || true', (err, stream) => {
    if (err) { console.error(err); }
    
    stream.on('close', () => {
      setTimeout(() => {
        console.log('[数据库] 检查并迁移数据库...');
        // 检查是否存在SQLite数据库，如果不存在则初始化
        conn.exec('cd /var/www/laos-logistics/backend && if [ ! -f database/shengpeng.db ]; then npm run init-sqlite; else echo "SQLite数据库已存在"; fi', (err, stream) => {
          if (err) { console.error(err); }
          
          stream.on('close', () => {
            console.log('[重启] 安装依赖并启动新进程...');
            conn.exec('cd /var/www/laos-logistics/backend && npm install && nohup node server.js > /dev/null 2>&1 & sleep 3 && curl -s http://localhost:3001/api/news | head -c 50', (err, stream) => {
              if (err) { console.error(err); conn.end(); return; }
              
              let output = '';
              stream.on('data', data => output += data);
              stream.stderr.on('data', () => {});
              
              stream.on('close', () => {
                console.log('[重启] 后端已启动');
                if (output.includes('success')) {
                  console.log('✓ 健康检查通过\n');
                } else {
                  console.log('⚠️ 健康检查:', output || '无输出\n');
                }
                conn.end();
              });
            });
          });
        });
      }, 2000);
    });
  });
}

conn.on('ready', () => {
  console.log('✓ SSH连接成功\n');

  // 第一步：上传文件
  conn.sftp((err, sftp) => {
    if (err) { console.error('SFTP错误:', err); conn.end(); return; }

    let uploaded = 0;
    function uploadNext() {
      if (uploaded >= filesToUpload.length) {
        console.log('\n✓ 所有文件上传完成！\n');
        restartBackend();
        return;
      }
      const file = filesToUpload[uploaded];
      const localPath = path.resolve(__dirname, file);
      const remotePath = '/var/www/laos-logistics/' + file;
      console.log(`[${uploaded+1}/${filesToUpload.length}] 上传 ${file}...`);
      
      sftp.fastPut(localPath, remotePath, (err) => {
        if (err) {
          console.error(`  ✗ 失败: ${err.message}`);
        } else {
          console.log('  ✓ 成功');
        }
        uploaded++;
        uploadNext();
      });
    }
    uploadNext();
  });
}).on('error', (err) => {
  console.error('SSH错误:', err.message);
}).connect({
  host: '43.129.173.218',
  port: 22,
  username: 'root',
  privateKey: fs.readFileSync('C:\\Users\\Administrator\\.ssh\\id_ed25519_laos'),
  readyTimeout: 30000
});
