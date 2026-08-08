# SSH 超时错误修复

## 问题分析

错误信息：
```
Process exited with status 143 from signal TERM
```

**原因**: SSH 命令执行时间过长，被系统终止（SIGTERM 信号）。

## 🔧 修复方案

### 添加超时配置

为所有 SSH 和 SCP 步骤添加超时配置：

```yaml
- name: Create remote directories
  uses: appleboy/ssh-action@master
  with:
    host: ${{ secrets.SERVER_HOST || '43.129.173.218' }}
    username: ${{ secrets.SERVER_USER || 'root' }}
    key: ${{ secrets.SSH_PRIVATE_KEY }}
    port: ${{ secrets.SSH_PORT || '22' }}
    timeout: 300s              # 连接超时
    command_timeout: 120s     # 脚本执行超时
    script: |
      mkdir -p /var/www/laos-logistics/public/admin
      mkdir -p /var/www/laos-logistics/public/services
      mkdir -p /var/www/laos-logistics/public/css
      mkdir -p /var/www/laos-logistics/public/js
      mkdir -p /var/www/laos-logistics/public/lang
      echo "Directories created successfully"
```

### 超时配置说明

| 参数 | 值 | 说明 |
|------|-----|------|
| `timeout` | 300s | 连接超时时间 (5分钟) |
| `command_timeout` | 120s | 脚本执行超时 (2分钟) |

### 不同步骤的超时配置

#### 1. 目录创建 (较短)
- `timeout`: 300s
- `script_timeout`: 60s

#### 2. 文件上传 (较长)
- `timeout`: 300s
- 无 `script_timeout` (使用默认)

#### 3. 依赖安装 (最长)
- `timeout`: 300s
- `script_timeout`: 180s (3分钟)

#### 4. 服务重启 (中等)
- `timeout`: 300s
- `script_timeout`: 60s

#### 5. 验证和清理 (较短)
- `timeout`: 300s
- `script_timeout`: 30s

## 📊 修复的文件

- ✅ `.github/workflows/deploy.yml` - 所有 SSH/SCP 步骤添加超时配置
- ✅ `.github/workflows/rollback.yml` - 添加超时配置

## 🎯 优势

### 1. 防止超时
- 连接超时：5分钟
- 脚本超时：根据操作时间配置
- 避免长时间挂起

### 2. 更好的错误处理
- 超时时立即失败
- 不会浪费等待时间
- 更容易定位问题

### 3. 合理的时间分配
- 简单操作：短超时
- 复杂操作：长超时
- 根据实际需要配置

## 🔍 可能的超时原因

### 1. 网络问题
- 服务器响应慢
- 网络连接不稳定
- 防火墙限制

### 2. 服务器负载
- 服务器资源不足
- CPU/内存负载高
- 磁盘 I/O 慢

### 3. 文件大小
- 文件太大上传慢
- 目录结构复杂
- 压缩/解压耗时

### 4. 命令执行
- npm install 慢
- 数据库操作慢
- 服务启动慢

## 🔄 备用方案

如果超时问题仍然存在：

### 方案 1: 增加超时时间
```yaml
timeout: 600s              # 增加到10分钟
script_timeout: 300s      # 增加到5分钟
```

### 方案 2: 简化部署流程
- 减少同时上传的文件
- 拆分大型操作
- 使用手动部署

### 方案 3: 使用手动部署
```bash
# 使用现有的部署脚本
node deploy-simple.js
```

## 📝 当前配置

### 默认超时设置
- **连接超时**: 300s (5分钟)
- **简单脚本**: 30-60s
- **复杂脚本**: 120-180s
- **文件上传**: 使用默认

### 配置策略
- 快速操作：短超时
- 复杂操作：长超时
- 文件上传：无限制

## 🚀 下一步

1. **测试新的超时配置**
   - 推送代码到 main 分支
   - 观察各步骤执行时间
   - 检查是否还有超时

2. **监控部署时间**
   - 记录每个步骤的执行时间
   - 根据实际情况调整超时
   - 优化部署流程

3. **优化部署流程**
   - 如果某些步骤总是超时
   - 考虑优化或拆分步骤
   - 简化必要的操作

## 📞 如果问题继续

如果超时问题仍然存在：

1. **使用手动部署**
   ```bash
   node deploy-simple.js
   ```

2. **简化 GitHub Actions**
   - 只保留测试工作流
   - 手动执行部署
   - 使用服务器脚本

3. **优化服务器**
   - 检查服务器性能
   - 优化网络连接
   - 减少部署文件数量

## 🎯 建议

### 1. 先解决 SSH 密钥配置
当前的 SSH 密钥配置问题可能更根本，先解决密钥配置。

### 2. 使用手动部署作为主要方式
GitHub Actions 作为辅助，手动部署更可靠。

### 3. 逐步启用 CI/CD
- 先确保手动部署稳定
- 然后逐步启用 CI/CD 功能
- 根据实际情况调整

配置 SSH_PRIVATE_KEY 后，重新测试部署流程，新的超时配置应该解决 TERM 信号问题。