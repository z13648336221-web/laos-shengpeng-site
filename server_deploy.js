const Client = require('ssh2').Client;
const fs = require('fs');

const config = {
  host: '43.129.173.218',
  port: 22,
  username: 'root',
  privateKey: fs.readFileSync('C:\\Users\\Administrator\\.ssh\\id_ed25519_laos'),
  readyTimeout: 30000
};

const commands = [
  // 1. 安装新npm依赖
  'cd /var/www/laos-logistics/backend && npm install helmet express-rate-limit bcryptjs 2>&1',
  // 2. 更新nginx配置
  'cp /var/www/laos-logistics/nginx-config.conf /etc/nginx/sites-enabled/hengciglobal.com 2>&1 || cp /var/www/laos-logistics/nginx-config.conf /etc/nginx/conf.d/hengciglobal.com 2>&1',
  // 3. 测试nginx配置
  'nginx -t 2>&1',
  // 4. 重载nginx
  'nginx -s reload 2>&1',
  // 5. 停止旧的后端进程
  'pkill -f "node.*server.js" 2>&1 || true',
  // 6. 等待进程停止
  'sleep 2',
  // 7. 启动新的后端进程
  'cd /var/www/laos-logistics/backend && nohup node server.js > /var/log/hengci-backend.log 2>&1 &',
  // 8. 等待启动
  'sleep 3',
  // 9. 验证后端运行
  'curl -s http://localhost:3001/api/health 2>&1',
  // 10. 检查进程
  'ps aux | grep "node.*server.js" | grep -v grep'
];

const conn = new Client();
conn.on('ready', () => {
  console.log('✓ 服务器连接成功!\n');
  
  let cmdIndex = 0;
  
  function runNext() {
    if (cmdIndex >= commands.length) {
      console.log('\n✅ 所有操作完成!');
      conn.end();
      return;
    }
    
    const cmd = commands[cmdIndex];
    console.log(`[${cmdIndex + 1}/${commands.length}] 执行: ${cmd.substring(0, 80)}...`);
    
    conn.exec(cmd, (err, stream) => {
      if (err) {
        console.log(`  ❌ 执行失败: ${err.message}`);
        cmdIndex++;
        runNext();
        return;
      }
      
      let output = '';
      stream.on('data', (data) => { output += data.toString(); });
      stream.stderr.on('data', (data) => { output += data.toString(); });
      
      stream.on('close', (code) => {
        if (output.trim()) {
          console.log(`  输出: ${output.trim().substring(0, 200)}`);
        }
        console.log(`  退出码: ${code || 0}\n`);
        cmdIndex++;
        runNext();
      });
    });
  }
  
  runNext();
});

conn.on('error', (err) => {
  console.log(`❌ 连接失败: ${err.message}`);
});

conn.connect(config);
