# 数据库监控和维护指南

本文档介绍了数据库监控、备份、性能优化和健康检查的完整工具集。

## 📊 监控工具

### 1. 数据库性能监控
**脚本**: `scripts/monitor-database.js`  
**命令**: `npm run db:monitor`

**功能**:
- 数据库文件大小监控
- 数据统计（各表记录数）
- 碎片化检查
- 查询性能测试
- 数据库健康状态检查
- 备份信息统计
- 性能评估和问题分析

**使用场景**: 定期检查数据库运行状态，及时发现性能问题

### 2. 自动备份
**脚本**: `scripts/auto-backup.js`  
**命令**: `npm run db:backup`

**功能**:
- 自动创建数据库备份
- 备份完整性验证
- 备份压缩（可选）
- 旧备份清理
- 备份保留策略（每日/每周/每月）

**配置**:
```javascript
const backupConfig = {
  retention: {
    daily: 7,      // 保留最近7天的每日备份
    weekly: 4,     // 保留最近4周的每周备份
    monthly: 3,    // 保留最近3个月的每月备份
  },
  maxBackupSize: 500,  // 备份文件大小限制 (MB)
  compress: true,        // 压缩备份
  verify: true          // 验证备份完整性
};
```

### 3. 慢查询分析
**脚本**: `scripts/analyze-queries.js`  
**命令**: `npm run db:analyze`

**功能**:
- 使用 EXPLAIN QUERY PLAN 分析查询性能
- 检测全表扫描
- 检测索引使用情况
- 检测临时表使用
- 检测排序操作
- 缺失索引检查
- 索引优化建议

**使用场景**: 定期分析查询性能，优化慢查询

### 4. 健康检查
**脚本**: `scripts/health-check.js`  
**命令**: `npm run db:health`

**功能**:
- 数据库文件存在性检查
- 数据库完整性检查
- 外键约束检查
- 数据库配置检查
- 表结构检查
- 索引状态检查
- 数据量检查
- 性能测试
- 健康评分

**使用场景**: 全面检查数据库健康状态

## ⏰ 定时任务调度

### 任务调度器
**脚本**: `scripts/scheduler.js`  
**命令**: `npm run db:scheduler`

**配置的任务**:
- **每日备份**: 凌晨2点执行
- **每周备份**: 周日凌晨3点执行
- **每日性能监控**: 凌晨1点执行
- **每周查询分析**: 周一凌晨4点执行
- **每日健康检查**: 凌晨0点执行
- **每小时轻量检查**: 每小时第30分钟（默认禁用）

### 手动执行任务
```bash
# 启动调度器
npm run db:scheduler

# 列出所有任务
npm run db:scheduler list

# 手动执行指定任务
npm run db:scheduler run dailyBackup
npm run db:scheduler run weeklyBackup
npm run db:scheduler run dailyMonitor
npm run db:scheduler run weeklyQueryAnalysis
npm run db:scheduler run dailyHealthCheck
```

## 📈 监控报告

### 报告存储位置
所有监控报告保存在 `backend/database/logs/` 目录:
- `monitor-*.log` - 性能监控报告
- `query-analysis-*.json` - 查询分析报告
- `health-check-*.json` - 健康检查报告

### 备份存储位置
所有备份文件保存在 `backend/database/backups/` 目录:
- `shengpeng-backup-*.db` - 数据库备份文件
- `shengpeng-backup-*.db.gz` - 压缩备份文件

## 🔧 索引优化建议

### 常见索引优化
根据查询分析，以下索引已经被自动创建：
- `idx_admins_username_status` - 管理员登录查询
- `idx_orders_created_at` - 订单列表排序
- `idx_orders_customer_id` - 客户订单关联
- `idx_shipments_tracking_number` - 运单号查询
- `idx_shipments_status` - 运单状态筛选
- `idx_news_published_created_at` - 新闻列表查询
- `idx_inquiries_status_created_at` - 询价统计查询
- `idx_chats_visitor_id_created_at` - 聊天记录查询
- `idx_customers_status` - 客户状态筛选

### 手动创建索引
```sql
-- 创建复合索引
CREATE INDEX idx_table_name_columns ON table_name (column1, column2);

-- 删除索引
DROP INDEX IF EXISTS idx_table_name_columns;
```

## 🚀 部署建议

### 生产环境配置
1. **启用调度器**: 使用 PM2 或 systemd 启动调度器
2. **配置日志轮转**: 防止日志文件过大
3. **监控告警**: 集成告警系统，当健康评分低于阈值时发送通知
4. **定期清理**: 定期清理旧的监控报告和备份文件

### PM2 配置示例
```json
{
  "apps": [{
    "name": "db-scheduler",
    "script": "backend/scripts/scheduler.js",
    "cwd": "/var/www/laos-logistics/backend",
    "instances": 1,
    "exec_mode": "fork",
    "watch": false,
    "max_memory_restart": "500M",
    "env": {
      "NODE_ENV": "production"
    }
  }]
}
```

### systemd 配置示例
```ini
[Unit]
Description=Database Maintenance Scheduler
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/laos-logistics/backend
ExecStart=/usr/bin/node scripts/scheduler.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

## 📋 维护检查清单

### 每日检查
- [ ] 查看性能监控报告
- [ ] 检查备份是否成功创建
- [ ] 查看健康检查报告
- [ ] 监控数据库文件大小

### 每周检查
- [ ] 查看查询分析报告
- [ ] 检查碎片化程度
- [ ] 审查备份保留策略
- [ ] 检查监控日志文件大小

### 每月检查
- [ ] 运行完整的数据库健康检查
- [ ] 清理旧的监控报告
- [ ] 清理旧的备份文件
- [ ] 评估是否需要数据库优化
- [ ] 检查磁盘空间使用情况

## ⚠️ 故障处理

### 数据库文件损坏
1. 停止应用程序
2. 从最新备份恢复
3. 运行完整性检查
4. 重新启动应用程序

### 性能问题
1. 运行查询分析工具
2. 检查慢查询报告
3. 根据建议添加或优化索引
4. 考虑运行 VACUUM 清理碎片

### 备份失败
1. 检查磁盘空间
2. 检查文件权限
3. 检查数据库文件是否被锁定
4. 查看备份日志文件

## 🎯 性能基准

### 性能指标
- **数据库大小**: < 100MB 为优秀，< 500MB 为良好
- **碎片化程度**: < 10% 为优秀，< 20% 为良好
- **查询响应时间**: < 50ms 为优秀，< 100ms 为良好
- **健康评分**: > 90 分为优秀，> 70 分为良好

### 升级建议
- 当数据库文件 > 500MB 时，考虑迁移到 PostgreSQL
- 当查询响应时间 > 100ms 时，需要优化查询或索引
- 当健康评分 < 70 分时，需要立即优化或修复

## 📚 相关文档
- SQLite 官方文档: https://www.sqlite.org/docs.html
- better-sqlite3 文档: https://github.com/WiseLibs/better-sqlite3
- node-cron 文档: https://www.npmjs.com/package/node-cron

---

**最后更新**: 2026-07-31  
**维护者**: 重庆恒慈国际贸易有限公司技术团队