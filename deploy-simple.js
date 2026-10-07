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

// 启动前校验必需环境变量（在建立 SSH 连接前失败），凭证不在代码中硬编码
const requiredEnv = ['DEPLOY_HOST', 'DEPLOY_USER', 'DEPLOY_KEY'];
const missingEnv = requiredEnv.filter(name => !process.env[name]);
if (missingEnv.length > 0) {
  console.error('✗ 缺少部署配置环境变量: ' + missingEnv.join(', '));
  console.error('  用法示例: DEPLOY_HOST=<服务器IP> DEPLOY_USER=<用户> DEPLOY_KEY=<SSH私钥路径> node deploy-simple.js');
  process.exit(1);
}

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
  // 注意：严禁上传 backend/.env 和 backend/database/shengpeng.db ——
  // 会用本地配置/开发数据覆盖生产环境配置与线上订单客户数据
  './backend/package.json',
  './backend/package-lock.json',
  './backend/server.js',
  './backend/models/database.js',
  './backend/middleware/auth.js',
  './backend/middleware/security.js',
  './backend/middleware/secure-upload.js',
  
  // 数据库相关文件
  './backend/database/schema.sql',
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
  './backend/routes/coupon.js',
  
  // 部署脚本
  './scripts/auto-deploy.sh',
  './scripts/rollback.sh'
];

const conn = new Client();

conn.on('ready', () => {
  console.log('✓ SSH连接成功\n');
  console.log('创建远程目录...\n');
  
  // 先创建远程目录结构，避免首次部署 fastPut 失败
  const mkdirCmd = 'mkdir -p /var/www/laos-logistics/public/css /var/www/laos-logistics/public/js /var/www/laos-logistics/public/lang /var/www/laos-logistics/public/services /var/www/laos-logistics/public/admin /var/www/laos-logistics/backend/database/backups /var/www/laos-logistics/backend/secure-uploads/news /var/www/laos-logistics/backend/secure-uploads/documents /var/www/laos-logistics/backend/secure-uploads/avatars /var/www/laos-logistics/backend/uploads/news';
  conn.exec(mkdirCmd, (err, stream) => {
    if (err) {
      console.error('创建目录失败:', err.message);
      conn.end();
      return;
    }
    stream.on('close', () => {
      console.log('✓ 远程目录创建完成\n');
      console.log('开始上传文件...\n');
      uploadAll();
    }).on('data', (d) => process.stdout.write(d));
  });
  
  function uploadAll() {
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
      } else if (file.startsWith('./scripts/')) {
        remotePath = '/var/www/laos-logistics/' + file;
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
  }
}).on('error', (err) => {
  console.error('SSH连接失败:', err.message);
  console.log('\n请检查:');
  console.log('1. 环境变量 DEPLOY_HOST / DEPLOY_USER / DEPLOY_KEY 是否正确');
  console.log('2. 服务器是否可访问');
  console.log('3. 网络连接是否正常');
}).connect({
  // 凭证一律从环境变量读取，不在代码中硬编码服务器 IP / 账号
  host: process.env.DEPLOY_HOST,
  port: parseInt(process.env.DEPLOY_PORT || '22', 10),
  username: process.env.DEPLOY_USER,
  privateKey: fs.readFileSync(process.env.DEPLOY_KEY),
  readyTimeout: 30000
});

function showInstructions() {
  console.log('='.repeat(60));
  console.log('📋 后续手动操作步骤');
  console.log('='.repeat(60));
  console.log('\n请通过SSH手动执行以下命令:\n');
  console.log('1. 连接到服务器:');
  console.log('   ssh -i $DEPLOY_KEY $DEPLOY_USER@$DEPLOY_HOST');
  console.log('\n2. 进入后端目录:');
  console.log('   cd /var/www/laos-logistics/backend');
  console.log('\n3. 安装依赖（如 package.json 有变更）:');
  console.log('   npm install --production');
  console.log('\n4. 重启服务（服务器使用 PM2 管理）:');
  console.log('   pm2 restart laos-backend   # 或 pm2 list 查看实际进程名');
  console.log('\n5. 验证服务:');
  console.log('   curl http://localhost:3001/api/health');
  console.log('\n6. 查看服务日志:');
  console.log('   pm2 logs laos-backend --lines 50');
  console.log('\n' + '='.repeat(60));
  console.log('📝 注意事项:');
  console.log('- 本次部署未上传 backend/.env（生产环境配置以服务器为准）');
  console.log('- 本次部署未上传生产数据库 shengpeng.db（严禁用本地库覆盖线上）');
  console.log('- 若后端有新增依赖或表结构变更，请先在服务器上执行迁移');
  console.log('='.repeat(60));
}