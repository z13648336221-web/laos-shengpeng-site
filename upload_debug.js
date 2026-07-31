const Client = require('ssh2').Client;
const fs = require('fs');
const path = require('path');

const config = {
  host: '43.129.173.218',
  port: 22,
  username: 'root',
  privateKey: fs.readFileSync('C:\\Users\\Administrator\\.ssh\\id_ed25519_laos'),
  readyTimeout: 30000,
  debug: function(msg) {
    if (msg.includes('AUTH') || msg.includes('auth') || msg.includes('Handshake') || msg.includes('key')) {
      console.log('[DEBUG]', msg);
    }
  }
};

const localDir = 'f:\\Laos shengpeng site';
const remoteDir = '/var/www/laos-logistics';

const files = [
  'index.html', 'about.html', 'tracking.html', 'news.html',
  'service-rail.html', 'service-road.html', 'service-thai.html',
  'service-thai-rail.html', 'service-viet.html', 'service-viet-rail.html',
  'lang/zh.js', 'lang/en.js', 'lang/vi.js', 'lang/all.js',
  'js/i18n.js', 'js/main.js', 'js/chat.js', 'js/tracking.js',
  'js/inquiry.js', 'js/news-api.js',
  'css/style.css', 'css/admin.css', 'css/chat.css',
  // SEO文件
  'sitemap.xml', 'robots.txt',
  // 后端安全加固文件
  'backend/server.js',
  'backend/middleware/auth.js',
  'backend/middleware/security.js',
  'backend/routes/auth.js',
  'backend/routes/coupon.js',
  'backend/.env',
  'backend/package.json',
  'nginx-config.conf',
  // 智能推荐系统
  'inquiry.html'
];

const conn = new Client();
conn.on('ready', () => {
  console.log('✓ 连接成功!');
  conn.sftp((err, sftp) => {
    if (err) { console.log('SFTP错误:', err); conn.end(); return; }
    
    let uploaded = 0;
    function uploadNext() {
      if (uploaded >= files.length) {
        console.log(`\n✅ ${uploaded}/${files.length} 个文件上传完成!`);
        conn.end();
        return;
      }
      const file = files[uploaded];
      const localPath = path.join(localDir, file);
      const remotePath = `${remoteDir}/${file}`;
      
      if (!fs.existsSync(localPath)) {
        console.log(`✗ 文件不存在: ${file}`);
        uploaded++;
        uploadNext();
        return;
      }
      
      sftp.fastPut(localPath, remotePath, (err) => {
        if (err) {
          console.log(`✗ 上传失败: ${file} - ${err.message}`);
        } else {
          console.log(`✓ ${file}`);
        }
        uploaded++;
        uploadNext();
      });
    }
    uploadNext();
  });
});

conn.on('error', (err) => {
  console.log(`❌ 连接失败: ${err.message}`);
  if (err.level === 'client-authentication') {
    console.log('认证失败，尝试列出可用认证方法...');
  }
});

conn.connect(config);
