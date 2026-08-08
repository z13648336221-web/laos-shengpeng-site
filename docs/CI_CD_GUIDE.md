# CI/CD 指南

## 概述

本项目已配置完整的 CI/CD 流程，实现自动化测试、部署和回滚功能。

## 🎯 主要功能

### 1. 自动化部署
- 推送代码到 main/master 分支自动触发部署
- 支持手动触发部署
- 自动备份当前版本
- 自动验证部署结果

### 2. 自动化测试
- 代码推送时自动运行测试
- 项目结构验证
- 代码质量检查
- 文件完整性验证

### 3. 备份和回滚
- 部署前自动备份
- 保留最近5个备份
- 支持一键回滚
- 回滚自动验证

## 📁 工作流文件

### 1. deploy.yml
**位置**: `.github/workflows/deploy.yml`

**功能**: 主部署工作流

**触发条件**:
- 推送到 main 或 master 分支
- 手动触发

**流程**:
1. 检出代码
2. 创建备份时间戳
3. 备份当前部署
4. 上传新文件
5. 安装依赖
6. 创建必要目录
7. 重启服务
8. 验证部署
9. 清理旧备份

### 2. rollback.yml
**位置**: `.github/workflows/rollback.yml`

**功能**: 回滚工作流

**触发条件**: 手动触发

**参数**:
- `backup_timestamp`: 备份时间戳 (格式: YYYYMMDD_HHMMSS)

**流程**:
1. 检查备份是否存在
2. 停止当前服务
3. 移除当前部署
4. 恢复备份
5. 重启服务
6. 验证回滚

### 3. test.yml
**位置**: `.github/workflows/test.yml`

**功能**: 测试工作流

**触发条件**:
- 推送到任何分支
- Pull Request

**测试内容**:
- 后端依赖安装
- 后端测试运行
- 代码质量检查
- HTML 结构验证
- CSS 文件验证
- JavaScript 文件验证
- 后端结构验证

## 🔧 配置要求

### GitHub Secrets 配置

需要在 GitHub 仓库中配置以下 Secrets：

| Secret 名称 | 描述 | 必需 |
|------------|------|------|
| `SERVER_HOST` | 服务器地址 | ✅ |
| `SERVER_USER` | SSH 用户名 | ✅ |
| `SSH_PORT` | SSH 端口 | ✅ |
| `SSH_PRIVATE_KEY` | SSH 私钥 | ✅ |

详细配置步骤请参考: `.github/workflows/SSH_SETUP.md`

## 🚀 使用方法

### 自动部署

```bash
# 推送到 main 分支自动触发部署
git add .
git commit -m "Update website"
git push origin main
```

### 手动部署

1. 进入 GitHub 仓库页面
2. 点击 "Actions" 标签
3. 选择 "Deploy to Production Server" 工作流
4. 点击 "Run workflow"
5. 选择分支并运行

### 查看部署状态

1. 进入 GitHub Actions 页面
2. 查看工作流执行状态
3. 点击具体工作流查看详细日志

### 回滚部署

1. 进入 GitHub Actions 页面
2. 选择 "Rollback Deployment" 工作流
3. 点击 "Run workflow"
4. 输入备份时间戳 (格式: YYYYMMDD_HHMMSS)
5. 运行回滚

### 查看可用备份

```bash
# SSH 连接到服务器
ssh root@43.129.173.218

# 查看备份列表
ls -la /var/www/backups/
```

## 📊 服务器脚本

### auto-deploy.sh
**位置**: `scripts/auto-deploy.sh`

**功能**: 服务器端自动化部署脚本

**使用**:
```bash
# 在服务器上执行
bash /var/www/laos-logistics/scripts/auto-deploy.sh
```

**功能**:
- 创建时间戳备份
- 清理旧备份
- 安装依赖
- 创建必要目录
- 重启服务
- 验证部署
- 自动回滚（如果验证失败）

### rollback.sh
**位置**: `scripts/rollback.sh`

**功能**: 服务器端回滚脚本

**使用**:
```bash
# 在服务器上执行
bash /var/www/laos-logistics/scripts/rollback.sh <TIMESTAMP>

# 示例
bash /var/www/laos-logistics/scripts/rollback.sh 20260808_143000
```

**功能**:
- 检查备份是否存在
- 停止当前服务
- 恢复指定备份
- 重启服务
- 验证回滚

## 🔍 故障排除

### 部署失败

#### 问题：SSH 连接失败
**解决方案**:
1. 检查 GitHub Secrets 配置
2. 验证 SSH 密钥格式
3. 检查服务器可访问性
4. 参考 SSH_SETUP.md

#### 问题：备份失败
**解决方案**:
1. 检查服务器磁盘空间
2. 检查目录权限
3. 查看详细错误日志

#### 问题：部署验证失败
**解决方案**:
1. 检查服务启动状态
2. 查看服务日志
3. 验证依赖安装
4. 自动回滚会触发

### 测试失败

#### 问题：文件验证失败
**解决方案**:
1. 检查文件是否存在
2. 验证文件路径
3. 检查文件权限

#### 问题：代码质量检查失败
**解决方案**:
1. 移除调试代码
2. 移除敏感信息
3. 修复代码问题

## 📈 监控和维护

### 部署监控

1. **GitHub Actions 监控**
   - 定期查看工作流执行状态
   - 监控成功/失败率
   - 查看执行时间

2. **服务器监控**
   - 检查备份存储空间
   - 监控服务运行状态
   - 查看部署日志

### 维护建议

1. **定期维护**
   - 每月检查 SSH 密钥
   - 定期清理旧备份
   - 更新依赖版本

2. **优化改进**
   - 根据实际情况调整工作流
   - 优化部署时间
   - 改进错误处理

## 🔄 部署流程图

```
┌─────────────────┐
│ 代码推送到 main │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 触发 GitHub     │
│ Actions 工作流  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 创建备份         │
│ (/var/www/       │
│  backups/)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 上传新文件       │
│ 到服务器         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 安装依赖         │
│ 重启服务         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 验证部署         │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌──────┐  ┌──────┐
│ 成功 │  │ 失败 │
└──┬───┘  └──┬───┘
   │         │
   ▼         ▼
清理备份   自动回滚
```

## 📝 最佳实践

### 1. 分支管理
- main/master: 生产环境
- develop: 开发环境
- feature/*: 功能分支

### 2. 提交规范
- 使用清晰的提交信息
- 避免推送大量文件
- 重大改动先在测试环境验证

### 3. 备份策略
- 部署前必须备份
- 保留最近5个备份
- 定期清理旧备份

### 4. 回滚策略
- 部署失败自动回滚
- 手动回滚前确认备份
- 回滚后验证功能

## 🎓 学习资源

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [SSH 密钥管理](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)
- [CI/CD 最佳实践](https://docs.github.com/en/actions/learn-github-actions/best-practices-for-github-actions)

## 🆘 支持

如遇到问题，请：
1. 查看工作流日志
2. 检查服务器日志
3. 参考故障排除部分
4. 查看 SSH_SETUP.md