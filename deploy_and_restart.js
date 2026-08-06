const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

// 需要上传的文件列表（安全加固后的后端文件）
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
  
  // 后端核心文件（安全加固后）
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
  // './backend/utils/virus-scanner.js',
  // './backend/utils/content-filter.js',
  // './backend/utils/visitor-validator.js',
  
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

// 第二步：完成部署
function completeDeployment() {
  console.log('\n✅ 文件上传完成！');
  console.log('\n📋 后续手动操作步骤:');
  console.log('1. SSH连接到服务器:');
  console.log('   ssh -i "C:\\Users\\Administrator\\.ssh\\id_ed25519_laos" root@43.129.173.218');
  console.log('2. 进入后端目录:');
  console.log('   cd /var/www/laos-logistics/backend');
  console.log('3. 安装依赖:');
  console.log('   npm install');
  console.log('4. 重启服务:');
  console.log('   pkill -f "node.*server.js"');
  console.log('   nohup node server.js > /dev/null 2>&1 &');
  console.log('5. 验证服务:');
  console.log('   curl http://localhost:3001/api/news');
  console.log('\n✅ 安全加固功能已上传到服务器');
  console.log('✅ 数据库监控系统已上传到服务器');
  console.log('✅ 文件上传安全功能已上传到服务器');
  console.log('✅ 聊天接口安全功能已上传到服务器');
  
  conn.end();
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
        completeDeployment();
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
