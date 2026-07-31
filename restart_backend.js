const fs = require('fs');
const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('✓ SSH连接成功');

  conn.exec('pkill -f "node server.js" 2>/dev/null; sleep 2; cd /var/www/laos-logistics/backend && nohup node server.js > /dev/null 2>&1 & sleep 3 && curl -s http://localhost:3001/api/news | head -c 50', (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }

    let output = '';
    stream.on('data', data => output += data);
    stream.stderr.on('data', data => {}); // consume stderr

    stream.on('close', () => {
      console.log('✓ 后端服务已重启');
      if (output.includes('success')) {
        console.log('✓ 健康检查通过');
      } else {
        console.log('⚠️ 健康检查:', output || '无输出');
      }
      conn.end();
    });
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
