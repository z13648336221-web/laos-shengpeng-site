import paramiko
import os

host = '43.129.173.218'
port = 22
username = 'root'
password = 'Qweasd1120'
local_dir = r'E:\code repository\Laos shengpeng site'
remote_dir = '/var/www/laos-logistics'

files_to_upload = [
    # 前端文件
    'index.html',
    'about.html',
    'tracking.html',
    'news.html',
    'service-rail.html',
    'service-road.html',
    'service-thai.html',
    'service-thai-rail.html',
    'service-viet.html',
    'service-viet-rail.html',
    'lang/zh.js',
    'lang/en.js',
    'lang/vi.js',
    'lang/all.js',
    'js/i18n.js',
    'js/main.js',
    'js/chat.js',
    'js/tracking.js',
    'js/inquiry.js',
    'js/news-api.js',
    'css/style.css',
    'css/admin.css',
    'css/chat.css',
    
    # 后端核心文件（安全修复后）
    'backend/package.json',
    'backend/package-lock.json',
    'backend/.env',
    'backend/server.js',
    'backend/models/database.js',
    'backend/middleware/auth.js',
    'backend/middleware/security.js',
    
    # 后端路由文件
    'backend/routes/auth.js',
    'backend/routes/inquiry.js',
    'backend/routes/tracking.js',
    'backend/routes/news.js',
    'backend/routes/services.js',
    'backend/routes/orders.js',
    'backend/routes/customers.js',
    'backend/routes/quotes.js',
    'backend/routes/chat.js',
    'backend/routes/roles.js',
    'backend/routes/admins.js',
    'backend/routes/logs.js',
    'backend/routes/coupon.js'
]

try:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(host, port, username, password, banner_timeout=200, auth_timeout=200)
    print(f"✓ 成功连接到服务器 {host}")
    
    sftp = ssh.open_sftp()
    
    success = 0
    for file in files_to_upload:
        local_path = os.path.join(local_dir, file)
        remote_path = os.path.join(remote_dir, file)
        
        if os.path.exists(local_path):
            sftp.put(local_path, remote_path)
            print(f"✓ 上传成功: {file}")
            success += 1
        else:
            print(f"✗ 文件不存在: {local_path}")
    
    sftp.close()
    
    # 重启后端服务
    print("\n🔄 重启后端服务...")
    stdin, stdout, stderr = ssh.exec_command('cd /var/www/laos-logistics/backend && npm install && pm2 restart shengpeng-backend || pm2 start server.js --name shengpeng-backend')
    
    # 等待命令完成
    exit_status = stdout.channel.recv_exit_status()
    
    if exit_status == 0:
        print("✅ 后端服务重启成功!")
    else:
        print(f"⚠️ 后端服务重启警告，退出码: {exit_status}")
        print("错误输出:", stderr.read().decode())
    
    ssh.close()
    print(f"\n✅ {success}/{len(files_to_upload)} 个文件上传完成，服务已重启!")

except Exception as e:
    print(f"❌ 上传失败: {str(e)}")
