import paramiko
import os

# 配置
host = '43.129.173.218'
port = 22
username = 'root'
key_path = r'F:\hengciwebsite\hengciglobal.pem'
local_dir = r'E:\code repository\Laos shengpeng site'
remote_dir = '/var/www/laos-logistics'

# 需要上传的文件（安全修复后的后端文件）
files_to_upload = [
    # 前端文件
    'js/i18n.js',
    'lang/zh.js',
    'lang/en.js',
    'lang/vi.js',
    'index.html',
    
    # 后端核心文件
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
    # 连接服务器
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    # 使用私钥登录
    private_key = paramiko.RSAKey.from_private_key_file(key_path)
    ssh.connect(host, port, username, pkey=private_key)
    
    # 创建 SFTP 连接
    sftp = ssh.open_sftp()
    
    # 上传文件
    for file in files_to_upload:
        local_path = os.path.join(local_dir, file)
        remote_path = os.path.join(remote_dir, file)
        
        if os.path.exists(local_path):
            sftp.put(local_path, remote_path)
            print(f"✓ 上传成功: {file}")
        else:
            print(f"✗ 文件不存在: {local_path}")
    
    # 关闭 SFTP 连接
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
    
    # 关闭 SSH 连接
    ssh.close()
    print("\n✅ 所有文件上传完成，服务已重启!")

except Exception as e:
    print(f"❌ 上传失败: {str(e)}")
