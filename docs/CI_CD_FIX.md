# CI/CD 修复说明

## 问题分析

错误信息：`error: missing server host`

**原因**: GitHub Secrets 未配置，导致 SSH Action 无法获取服务器地址。

## 🔧 修复方案

### 1. 添加默认值

在所有工作流文件中添加了默认值，确保即使 Secrets 未配置也能运行：

```yaml
# 修复前
host: ${{ secrets.SERVER_HOST }}

# 修复后
host: ${{ secrets.SERVER_HOST || '43.129.173.218' }}
```

### 2. 配置默认值

以下默认值已添加到工作流中：

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `SERVER_HOST` | `43.129.173.218` | 服务器地址 |
| `SERVER_USER` | `root` | SSH 用户名 |
| `SSH_PORT` | `22` | SSH 端口 |

### 3. 需要配置的 Secret

只有一个 Secret 必须配置：

| Secret 名称 | 描述 | 状态 |
|------------|------|------|
| `SSH_PRIVATE_KEY` | SSH 私钥 | ⚠️ 必须配置 |

## 📝 正确配置步骤

### 1. 复制私钥内容

```bash
# 在本地执行
cat C:/Users/Administrator/.ssh/id_ed25519_laos
```

### 2. 配置 GitHub Secret

1. 进入 GitHub 仓库页面
2. 点击 `Settings` → `Secrets and variables` → `Actions`
3. 点击 `New repository secret`
4. 配置如下：
   - **Name**: `SSH_PRIVATE_KEY`
   - **Value**: 粘贴完整的私钥内容（包括 BEGIN 和 END 行）
5. 点击 `Add secret`

### 3. 验证配置

配置完成后，可以：
1. 推送代码到 main 分支
2. 查看 GitHub Actions 执行状态
3. 确认部署成功

## 🚀 当前状态

### 已修复的文件
- ✅ `.github/workflows/deploy.yml`
- ✅ `.github/workflows/rollback.yml`

### 默认值配置
- ✅ 服务器地址: `43.129.173.218`
- ✅ 用户名: `root`
- ✅ 端口: `22`

### 必需配置
- ⚠️ SSH_PRIVATE_KEY (必须手动配置)

## 🔍 故障排除

### 问题仍然出现

如果问题仍然出现，请检查：

1. **Secret 是否正确配置**
   - 确认 Secret 名称完全匹配: `SSH_PRIVATE_KEY`
   - 确认私钥内容完整（包括 BEGIN 和 END 行）

2. **SSH 密钥权限**
   - 确认私钥格式正确
   - 确认服务器已配置对应的公钥

3. **服务器连接**
   - 测试服务器是否可访问
   - 检查防火墙设置

### 测试 SSH 连接

```bash
# 使用本地密钥测试连接
ssh -i C:/Users/Administrator/.ssh/id_ed25519_laos root@43.129.173.218
```

## 📊 部署流程

配置完成后的完整流程：

```
配置 SSH_PRIVATE_KEY → 推送代码 → 自动部署 → 备份 → 上传 → 重启 → 验证
```

## 🎯 建议

1. **立即配置 SSH_PRIVATE_KEY**
   - 这是唯一必需的 Secret
   - 配置后 CI/CD 将完全自动化

2. **考虑创建专用密钥**
   - 为 CI/CD 创建专用的 SSH 密钥
   - 提高安全性

3. **监控首次部署**
   - 配置后监控首次自动部署
   - 确认所有步骤正常执行

## 📞 支持

如遇到其他问题，请：
1. 查看 GitHub Actions 日志
2. 检查服务器连接状态
3. 参考 SSH_SETUP.md 文档