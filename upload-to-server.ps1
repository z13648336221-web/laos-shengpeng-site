<#
.SYNOPSIS
上传文件到服务器

.DESCRIPTION
使用 SSH.NET 将指定文件上传到远程服务器
#>

# 检查 SSH.NET 是否已安装
try {
    $null = [System.Reflection.Assembly]::LoadWithPartialName("Renci.SshNet")
} catch {
    Write-Host "正在安装 SSH.NET..."
    Install-Package Renci.SshNet -Scope CurrentUser -Force
}

# 加载 SSH.NET 程序集
Add-Type -Path (Get-ChildItem -Path "$env:USERPROFILE\.nuget\packages\renci.sshnet\*\lib\net45\Renci.SshNet.dll" | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName

# 服务器配置
$server = "43.129.173.218"
$port = 22
$username = "root"
$privateKeyPath = "F:\hengciwebsite\hengciglobal.pem"

# 需要上传的文件列表
$filesToUpload = @(
    @{ LocalPath = "f:\Laos shengpeng site\js\i18n.js"; RemotePath = "/var/www/laos-logistics/js/i18n.js" },
    @{ LocalPath = "f:\Laos shengpeng site\lang\zh.js"; RemotePath = "/var/www/laos-logistics/lang/zh.js" },
    @{ LocalPath = "f:\Laos shengpeng site\lang\en.js"; RemotePath = "/var/www/laos-logistics/lang/en.js" },
    @{ LocalPath = "f:\Laos shengpeng site\lang\vi.js"; RemotePath = "/var/www/laos-logistics/lang/vi.js" },
    @{ LocalPath = "f:\Laos shengpeng site\index.html"; RemotePath = "/var/www/laos-logistics/index.html" }
)

try {
    Write-Host "正在连接服务器..."
    
    # 创建 SSH 客户端
    $privateKey = New-Object Renci.SshNet.PrivateKeyFile($privateKeyPath)
    $connectionInfo = New-Object Renci.SshNet.ConnectionInfo($server, $port, $username, $privateKey)
    $ssh = New-Object Renci.SshNet.SftpClient($connectionInfo)
    
    # 连接
    $ssh.Connect()
    Write-Host "成功连接到服务器 $server`n"
    
    # 上传文件
    foreach ($file in $filesToUpload) {
        $localFile = $file.LocalPath
        $remoteFile = $file.RemotePath
        
        if (Test-Path $localFile) {
            Write-Host "正在上传: $localFile -> $remoteFile"
            
            # 读取本地文件
            $fileStream = [System.IO.File]::OpenRead($localFile)
            
            # 上传到服务器
            $ssh.UploadFile($fileStream, $remoteFile)
            
            $fileStream.Close()
            Write-Host "上传成功!`n"
        } else {
            Write-Host "警告: 文件不存在 - $localFile`n"
        }
    }
    
    # 断开连接
    $ssh.Disconnect()
    $ssh.Dispose()
    
    Write-Host "所有文件上传完成!"
} catch {
    Write-Host "上传失败: $_"
    exit 1
}
