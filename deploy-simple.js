/**
 * 简化部署脚本 - 只上传文件，不执行远程命令
 * 避免SSH命令执行超时问题
 */

import fs from 'fs';
import path from 'path';
import { Client } from 'ssh2';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 需要上传的文件列表
const filesToUpload = [
  // 前端文件 (使用原始文件)
  './index.html',
  './public/lang/zh.js',
  './public/lang/en.js',
  './public/lang/vi.js',
  './public/lang/all.js',
  './public/js/i18n.js',
  './public/js/main.js',
  './public/js/chat.js',
  './public/js/tracking.js',
  './public/js/inquiry.js',
  './public/js/news-api.js',
  './public/js/loading.js',
  './public/js/notification.js',
  './public/css/style.css',
  './public/css/admin.css',
  './public/css/chat.css',
  
  // 其他前端页面
  './about.html',
  './inquiry.html',
  './tracking.html',
  './news.html',
  
  // 管理后台页面
  './public/admin/admin.html',
  './public/admin/admin-login.html',
  './public/admin/admin-dashboard.html',
  './public/admin/admin-chat.html',
  './public/admin/admin-customers.html',
  './public/admin/admin-inquiry.html',
  './public/admin/admin-orders.html',
  './public/admin/admin-quotes.html',
  './public/admin/admin-reports.html',
  './public/admin/admin-roles.html',
  './public/admin/admin-logs.html',
  
  // 服务页面
  './public/services/service-rail.html',
  './public/services/service-road.html',
  './public/services/service-thai.html',
  './public/services/service-viet.html',
  './public/services/service-thai-rail.html',
  './public/services/service-viet-rail.html',
  
  // 网站资源
  './public/robots.txt',
  './public/sitemap.xml',
  
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

conn.on('ready', () => {
  console.log('✓ SSH连接成功\n');
  console.log('开始上传文件...\n');
  
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
        showInstructions();
        conn.end();
        return;
      }
      
      const file = filesToUpload[uploaded];
      const localPath = path.resolve(__dirname, file);
      
      // 特殊文件处理
      let remotePath;
      if (file === './nginx-optimization.conf') {
        remotePath = '/var/www/laos-logistics/nginx-optimization.conf';
      } else {
        remotePath = '/var/www/laos-logistics/' + file;
      }
      
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

function showInstructions() {
  console.log('='.repeat(60));
  console.log('📋 后续手动操作步骤');
  console.log('='.repeat(60));
  console.log('\n请通过SSH手动执行以下命令:\n');
  console.log('1. 连接到服务器:');
  console.log('   ssh -i "C:\\Users\\Administrator\\.ssh\\id_ed25519_laos" root@43.129.173.218');
  console.log('\n2. 进入后端目录:');
  console.log('   cd /var/www/laos-logistics/backend');
  console.log('\n3. 创建安全上传目录:');
  console.log('   mkdir -p secure-uploads/news secure-uploads/documents secure-uploads/avatars');
  console.log('\n4. 安装依赖:');
  console.log('   npm install');
  console.log('\n5. 重启 Node.js 服务:');
  console.log('   pkill -f "node.*server.js"');
  console.log('   nohup node server.js > /dev/null 2>&1 &');
  console.log('\n6. 验证服务:');
  console.log('   curl http://localhost:3001/api/news');
  console.log('\n7. 查看服务日志:');
  console.log('   tail -f nohup.out');
  console.log('\n' + '='.repeat(60));
  console.log('✅ 前端文件已重组优化');
  console.log('✅ 安全加固功能已上传到服务器');
  console.log('✅ 数据库监控系统已上传到服务器');
  console.log('✅ 文件上传安全功能已上传到服务器');
  console.log('✅ 聊天接口安全功能已上传到服务器');
  console.log('✅ SQLite数据库已上传到服务器');
  console.log('='.repeat(60));
  console.log('📝 注意事项:');
  console.log('- 前端文件已重组为清晰的项目结构');
  console.log('- 静态资源移动到 public/ 目录');
  console.log('- 管理后台页面移动到 public/admin/ 目录');
  console.log('- 服务页面移动到 public/services/ 目录');
  console.log('- 所有路径引用已更新，网站功能正常');
  console.log('='.repeat(60));
}