import paramiko
import os

host = '43.129.173.218'
port = 22
username = 'root'
password = input("请输入服务器密码: ")
local_dir = r'f:\Laos shengpeng site'
remote_dir = '/var/www/laos-logistics'

files_to_upload = [
    'js/i18n.js',
    'lang/zh.js',
    'lang/en.js',
    'lang/vi.js',
    'index.html'
]

try:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(host, port, username, password, banner_timeout=200)
    
    sftp = ssh.open_sftp()
    
    for file in files_to_upload:
        local_path = os.path.join(local_dir, file)
        remote_path = os.path.join(remote_dir, file)
        
        if os.path.exists(local_path):
            sftp.put(local_path, remote_path)
            print(f"✓ 上传成功: {file}")
        else:
            print(f"✗ 文件不存在: {local_path}")
    
    sftp.close()
    ssh.close()
    print("\n✅ 所有文件上传完成!")

except Exception as e:
    print(f"❌ 上传失败: {str(e)}")
