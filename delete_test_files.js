const Client = require('ssh2').Client;
const fs = require('fs');

const conn = new Client();
conn.on('ready', () => {
  console.log('Connected');
  const files = [
    '/var/www/laos-logistics/admin-chat-test.html',
    '/var/www/laos-logistics/chat-test.html',
    '/var/www/laos-logistics/test-login.html',
    '/var/www/laos-logistics/test-login.json',
    '/var/www/laos-logistics/test-news.json',
    '/var/www/laos-logistics/test-plan.html',
    '/var/www/laos-logistics/backend/scripts/add-test-chats.js',
    '/var/www/laos-logistics/backend/scripts/create-test-data.js',
    '/var/www/laos-logistics/backend/scripts/create_all_test_data.js',
  ];
  const cmd = files.map(f => `rm -f ${f} && echo "deleted: ${f}" || echo "not found: ${f}"`).join(' && ');
  conn.exec(cmd, (err, stream) => {
    let out = '';
    stream.on('data', d => out += d);
    stream.stderr.on('data', d => out += d);
    stream.on('close', () => {
      console.log(out);
      conn.end();
    });
  });
});

conn.on('error', (err) => {
  console.log('Error:', err.message);
});

conn.connect({
  host: '43.129.173.218',
  port: 22,
  username: 'root',
  privateKey: fs.readFileSync('C:\\Users\\Administrator\\.ssh\\id_ed25519_laos'),
  readyTimeout: 30000
});
