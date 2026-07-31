const fs = require('fs');
const path = require('path');

const files = [
    // 前端文件
    { local: './index.html', remote: '/var/www/laos-logistics/index.html' },
    { local: './lang/zh.js', remote: '/var/www/laos-logistics/lang/zh.js' },
    { local: './lang/en.js', remote: '/var/www/laos-logistics/lang/en.js' },
    { local: './lang/vi.js', remote: '/var/www/laos-logistics/lang/vi.js' },
    { local: './lang/all.js', remote: '/var/www/laos-logistics/lang/all.js' },
    { local: './js/i18n.js', remote: '/var/www/laos-logistics/js/i18n.js' },
    { local: './js/main.js', remote: '/var/www/laos-logistics/js/main.js' },
    { local: './js/chat.js', remote: '/var/www/laos-logistics/js/chat.js' },
    { local: './js/tracking.js', remote: '/var/www/laos-logistics/js/tracking.js' },
    { local: './js/inquiry.js', remote: '/var/www/laos-logistics/js/inquiry.js' },
    { local: './js/news-api.js', remote: '/var/www/laos-logistics/js/news-api.js' },
    { local: './css/style.css', remote: '/var/www/laos-logistics/css/style.css' },
    { local: './css/admin.css', remote: '/var/www/laos-logistics/css/admin.css' },
    { local: './css/chat.css', remote: '/var/www/laos-logistics/css/chat.css' },
    
    // 后端文件（安全修复后）
    { local: './backend/package.json', remote: '/var/www/laos-logistics/backend/package.json' },
    { local: './backend/package-lock.json', remote: '/var/www/laos-logistics/backend/package-lock.json' },
    { local: './backend/.env', remote: '/var/www/laos-logistics/backend/.env' },
    { local: './backend/server.js', remote: '/var/www/laos-logistics/backend/server.js' },
    { local: './backend/models/database.js', remote: '/var/www/laos-logistics/backend/models/database.js' },
    { local: './backend/middleware/auth.js', remote: '/var/www/laos-logistics/backend/middleware/auth.js' },
    { local: './backend/middleware/security.js', remote: '/var/www/laos-logistics/backend/middleware/security.js' },
    
    // 路由文件
    { local: './backend/routes/auth.js', remote: '/var/www/laos-logistics/backend/routes/auth.js' },
    { local: './backend/routes/inquiry.js', remote: '/var/www/laos-logistics/backend/routes/inquiry.js' },
    { local: './backend/routes/tracking.js', remote: '/var/www/laos-logistics/backend/routes/tracking.js' },
    { local: './backend/routes/news.js', remote: '/var/www/laos-logistics/backend/routes/news.js' },
    { local: './backend/routes/services.js', remote: '/var/www/laos-logistics/backend/routes/services.js' },
    { local: './backend/routes/orders.js', remote: '/var/www/laos-logistics/backend/routes/orders.js' },
    { local: './backend/routes/customers.js', remote: '/var/www/laos-logistics/backend/routes/customers.js' },
    { local: './backend/routes/quotes.js', remote: '/var/www/laos-logistics/backend/routes/quotes.js' },
    { local: './backend/routes/chat.js', remote: '/var/www/laos-logistics/backend/routes/chat.js' },
    { local: './backend/routes/roles.js', remote: '/var/www/laos-logistics/backend/routes/roles.js' },
    { local: './backend/routes/admins.js', remote: '/var/www/laos-logistics/backend/routes/admins.js' },
    { local: './backend/routes/logs.js', remote: '/var/www/laos-logistics/backend/routes/logs.js' },
    { local: './backend/routes/coupon.js', remote: '/var/www/laos-logistics/backend/routes/coupon.js' }
];

console.log('Files to upload:');
files.forEach(f => console.log(`  ${f.local} -> ${f.remote}`));

try {
    const { Client } = require('ssh2');
    
    const conn = new Client();
    
    conn.on('ready', () => {
        console.log('\nConnected to server');
        
        let uploaded = 0;
        
        files.forEach(file => {
            const localPath = path.resolve(__dirname, file.local);
            
            fs.readFile(localPath, (err, data) => {
                if (err) {
                    console.log(`Error reading ${file.local}: ${err.message}`);
                    return;
                }
                
                conn.sftp((err, sftp) => {
                    if (err) {
                        console.log(`SFTP error: ${err.message}`);
                        return;
                    }
                    
                    const writeStream = sftp.createWriteStream(file.remote);
                    
                    writeStream.on('close', () => {
                        console.log(`✓ Uploaded: ${file.local}`);
                        uploaded++;
                        
                        if (uploaded === files.length) {
                            console.log('\nAll files uploaded successfully!');
                            
                            // 重启后端服务
                            console.log('\nRestarting backend service...');
                            conn.exec('cd /var/www/laos-logistics/backend && npm install && pm2 restart shengpeng-backend || pm2 start server.js --name shengpeng-backend', (err, stream) => {
                                if (err) {
                                    console.log('Error restarting service:', err.message);
                                    conn.end();
                                    return;
                                }
                                
                                stream.on('close', (code) => {
                                    console.log('Backend service restarted successfully!');
                                    conn.end();
                                });
                                
                                stream.stderr.on('data', (data) => {
                                    console.log('Service restart stderr:', data.toString());
                                });
                            });
                        }
                    });
                    
                    writeStream.on('error', (err) => {
                        console.log(`Error uploading ${file.local}: ${err.message}`);
                        uploaded++;
                        if (uploaded === files.length) {
                            conn.end();
                        }
                    });
                    
                    writeStream.write(data);
                    writeStream.end();
                });
            });
        });
    }).on('error', (err) => {
        console.log(`Connection error: ${err.message}`);
    }).connect({
        host: '43.129.173.218',
        port: 22,
        username: 'root',
        privateKey: fs.readFileSync('F:/hengciwebsite/hengciglobal.pem')
    });
} catch (err) {
    console.log('Error:', err.message);
    console.log('\nPlease install ssh2 package first:');
    console.log('npm install ssh2');
}
