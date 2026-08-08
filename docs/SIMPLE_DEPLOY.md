# 简化部署工作流说明

## 问题分析

GitHub Actions 部署工作流持续遇到问题：
1. SSH 密钥配置问题
2. SCP tar 归档错误
3. SSH 超时错误
4. 参数名称错误

## 🔧 新的解决方案

### 创建简化部署工作流

创建了 `deploy-simple.yml` 工作流，特点：

#### 1. 添加 SSH 连接测试
```yaml
- name: Test SSH connection
  uses: appleboy/ssh-action@master
  with:
    host: ${{ secrets.SERVER_HOST || '43.129.173.218' }}
    username: ${{ secrets.SERVER_USER || 'root' }}
    key: ${{ secrets.SSH_PRIVATE_KEY }}
    port: ${{ secrets.SSH_PORT || '22' }}
    timeout: 300s
    command_timeout: 60s
    script: |
      echo "SSH connection successful"
      pwd
      whoami
      date
```

#### 2. 改进的备份逻辑
```yaml
- name: Backup current deployment
  uses: appleboy/ssh-action@master
  with:
    script: |
      if [ -d "/var/www/laos-logistics" ]; then
        cp -r /var/www/laos-logistics /var/www/backups/laos-logistics_${{ steps.backup.outputs.timestamp }}
        echo "Backup created"
      else
        echo "No existing deployment to backup"
      fi
```

#### 3. 简化的流程
- 测试 SSH 连接 → 创建备份 → 上传文件 → 安装依赖 → 重启服务 → 验证
- 每个步骤都有明确的超时配置
- 使用正确的参数名称

## 📊 工作流对比

### deploy.yml (复杂版)
- 完整的部署流程
- 多个验证步骤
- 更多的错误处理

### deploy-simple.yml (简化版)
- ✅ SSH 连接测试
- ✅ 简化的备份逻辑
- ✅ 更容易调试
- ✅ 更快的执行时间

## 🚀 使用方法

### 1. 禁用复杂工作流
```yaml
# 重命名 deploy.yml 为 deploy-complex.yml
# 这样就不会自动触发
```

### 2. 启用简化工作流
```yaml
# deploy-simple.yml 已经准备好
# 可以立即使用
```

### 3. 测试部署
```bash
# 推送代码到 main 分支
git add .
git commit -m "Test simple deployment"
git push origin main
```

## 🔍 调试步骤

### 1. 检查 SSH 连接测试
如果第一步失败，说明 SSH_PRIVATE_KEY 配置有问题。

### 2. 检查备份步骤
如果备份失败，检查服务器磁盘空间和权限。

### 3. 检查文件上传
如果上传失败，检查网络连接和文件路径。

### 4. 检查依赖安装
如果 npm install 失败，检查 Node.js 版本和网络。

## 🎯 优势

### 1. 更快的故障定位
- 第一步就测试 SSH 连接
- 立即发现配置问题
- 减少调试时间

### 2. 更好的错误处理
- 检查部署目录是否存在
- 避免不必要的备份操作
- 更清晰的错误信息

### 3. 更简单的维护
- 代码更简洁
- 更容易理解
- 更容易修改

## 📝 当前状态

### 新建文件
- ✅ `.github/workflows/deploy-simple.yml` - 简化部署工作流
- ✅ `docs/SIMPLE_DEPLOY.md` - 使用说明

### 修复的文件
- ✅ `.github/workflows/deploy.yml` - 修正所有参数名称

### 需要配置
- ⚠️ SSH_PRIVATE_KEY (必须配置)

## 🔄 建议的使用流程

### 1. 首先配置 SSH_PRIVATE_KEY
这是唯一必需的配置，其他都有默认值。

### 2. 测试简化工作流
使用 deploy-simple.yml 进行首次测试。

### 3. 如果成功，考虑使用复杂工作流
如果简化工作流稳定，可以切换到更完整的 deploy.yml。

### 4. 如果失败，使用手动部署
```bash
node deploy-simple.js
```

## 🆘 故障排除

### SSH 连接测试失败
- 检查 SSH_PRIVATE_KEY 配置
- 验证密钥格式
- 测试本地 SSH 连接

### 备份步骤失败
- 检查服务器磁盘空间
- 检查目录权限
- 验证路径是否正确

### 文件上传失败
- 检查网络连接
- 验证文件路径
- 检查磁盘空间

### 依赖安装失败
- 检查 Node.js 版本
- 验证网络连接
- 检查 package.json

## 🎉 总结

简化工作流的主要改进：
1. ✅ 添加 SSH 连接测试
2. ✅ 改进备份逻辑
3. ✅ 使用正确的参数名称
4. ✅ 更容易调试和维护

建议先使用简化工作流测试，成功后再考虑使用完整的工作流。