# 重庆恒慈国际贸易官网 - 项目审计与整改报告

> 审计日期：2026-08-14
> 审计方式：源码审查 + 本地启动后端实测 + API 冒烟测试（22 项）+ 线上站点（hengciglobal.com）验证
> 审计范围：前端 11 个页面 + 服务页 6 个 + 管理后台 11 页 + 全部 JS/CSS/语言文件 + 后端全部路由/中间件/数据库层/脚本 + 部署脚本 + CI/CD

---

## 一、项目概况

重庆恒慈国际贸易有限公司官网是一个跨境物流服务网站（中老铁路/中老公路/中老泰铁路/中越铁路/泰国海运/越南海运），技术栈为静态 HTML/CSS/JS 前端 + Node.js Express + SQLite 后端，支持中/英/越三语。

**审计时项目处于"页面完成度高、内部严重脱节"的状态**：后端因多处缺陷无法启动（线上 `/api/health` 实测 502）；前端多语言、询价、聊天、新闻、追踪时间线等核心功能实际不可用；路由层与数据库 schema 大面积不一致；存在多项安全风险。

---

## 二、已修复问题清单

### A. 后端启动阻塞（4 处，修复后服务可正常启动）

| # | 文件 | 问题 | 修复 |
|---|------|------|------|
| 1 | `backend/routes/news.js` | 未提交改动删掉 POST 路由闭合 `});` → SyntaxError，后端完全无法启动 | 恢复与 git HEAD 一致 |
| 2 | `backend/middleware/secure-upload.js` | `single/fields/array` 外层声明 `async` → 调用返回 Promise 而非中间件 → Express 报 `Route.post() requires a callback function but got a [object Promise]` | 去掉 3 个外层函数的 `async` |
| 3 | `backend/models/database.js` | 路由以 `db.query('表名')` / `db.get('表名',{条件})` 调用，封装层只接受 SQL → `near "admins": syntax error`，`initDefaultAdmin` 崩溃 | `query/get` 增加表名/条件对象兼容重载，补 `delete` 别名 |
| 4 | `backend/routes/customers.js` | 调用不存在的 `db.literal()`（Knex 风格） | 改为原生 SQL |

### B. 前后端契约修复（数据库迁移，见第三节）

| # | 文件 | 问题 | 修复 |
|---|------|------|------|
| 5 | `backend/routes/chat.js` | 插入 `isRead: false/true` 布尔值，better-sqlite3 无法绑定布尔 → 聊天 500 | 改为 `0/1`；顺带修复 `req.user` → `req.admin` |
| 6 | `backend/routes/news.js` | PUT 无条件写入全部字段，部分更新时 `content_zh` 为 undefined → NOT NULL 违约 500 | 改为只更新请求中提供的字段 |
| 7 | `backend/routes/customers.js` | `UPDATE ... last_contact = ?`，而 customers 表无此列 → 添加联系记录 500 | 移除 last_contact |

### C. 前端功能修复

| # | 文件 | 问题 | 修复 |
|---|------|------|------|
| 8 | `public/js/i18n.js` | `export default i18n` + 普通 `<script>` 加载 → 浏览器 SyntaxError，**整个多语言系统从未运行** | 改为 `window.i18n = i18n` |
| 9 | `public/js/inquiry.js` | 提交总是带 `coupon_code`/`estimated_price`，后端 Joi 拒绝未知键 → 询价提交必 400 | 从提交数据移除 |

### D. 数据库 schema 迁移（任务 2 核心）

- 重写 `backend/database/schema.sql`，与路由/前端契约对齐（详见第三节）
- 新增迁移脚本 `backend/scripts/migrate-contract.js`（自动备份 → 重建表 → 数据映射 → 行数校验）
- 更新 `backend/scripts/init-sqlite.js` 种子数据（services 6 条含价格、roles 新结构、news 多语言、tracking_events timestamp）
- 更新 `backend/scripts/analyze-queries.js` 旧列名查询
- 迁移后数据全部保留：news 2、services 3、shipments 3、tracking_events 4、orders 106、roles 4、customers 3、inquiries 1、sessions 2、admins 1

### E. 前端路径修复（任务 3）

- 根页面（5 个）：服务页链接统一 `public/services/service-*.html`（48 处）
- 服务页（6 个）：资源引用 `../css|js|lang/...`；根页面链接 `../../index.html` 等；canonical/og:url 指向实际 URL（105 处）
- `robots.txt`：admin 规则改为 `/public/admin/`
- `sitemap.xml`：服务页 URL 改为 `/public/services/` 前缀
- `public/js/main.js`：客服回复中的服务链接改为根相对路径 `/public/services/...`
- 全站 388 个资源引用本地解析验证 **0 破坏**

### F. 仓库安全清理（任务 1）

- `git rm -r --cached`：`backend/node_modules`（1172 文件）、`backend/.env`、`backend/database/data.json`、`shengpeng.db-shm/-wal`、`backend/uploads/*`（2 张图片）
- `.gitignore` 补全：`*.db-shm`、`*.db-wal`、`*.db.gz`、`data.json`；修复 `*.backupnode_modules/` 粘连笔误
- `backend/.env` 轮换 SESSION_SECRET / COOKIE_SECRET（旧密钥曾进 git 历史，**必须作废**）

---

## 三、数据库 schema 迁移说明

### 迁移前后对照（路由设计为准）

| 表 | 迁移前（旧） | 迁移后（新） | 对应路由 |
|---|---|---|---|
| chats | `visitor_id/is_read/created_at` | `visitorId/isRead/readAt/createdAt` | routes/chat.js |
| news | 单语言 `title/content/summary/lang/published` | 多语言 `title_zh/en/vi` + `content_*` + `summary_*` + `video_url/publish_date` | routes/news.js |
| tracking_events | `event_time` | `timestamp` | routes/tracking.js |
| orders | `order_number/transport_type/origin/destination/cargo_description/price/currency` | `tracking_number/service_code/cargo_name/origin_city/dest_city/.../timeline` | routes/orders.js |
| quotes | `quote_number/price/currency/valid_until/terms` | `name/service_code/base_price/price_unit/min_weight/...` | routes/quotes.js |
| services | `icon/route/active/sort_order` | `base_price/features/image_url/priority/transit_days/...` | routes/services.js |
| customer_contacts | `name/position/phone/...` | `customer_id/type/content` | routes/customers.js |
| roles | `display_name_zh/en/vi` | `name/code` | routes/roles.js |
| logs | `target_type/target_id/ip_address/user_agent` | `admin_name/description/ip/details` | routes/logs.js |
| inquiries | CHECK 只允许 4 种运输方式 | CHECK 允许 6 种（rail/road/thai-rail/viet-rail/thai/viet） | routes/inquiry.js |

### 迁移方式

```bash
cd backend
node scripts/migrate-contract.js            # 默认迁移 ./database/shengpeng.db
node scripts/migrate-contract.js <路径>      # 指定其他数据库
```

迁移前自动备份到 `database/backups/shengpeng-precontract-<时间戳>.db`，迁移后逐表校验行数一致，失败自动报错并可回滚。

---

## 四、冒烟测试结果（迁移后全链路，22/22 通过）

登录、新闻创建/详情/更新/删除、订单列表/创建/详情/状态更新/运单号追踪、报价创建/计算/删除、服务列表、客户联系记录添加/列表、角色列表、管理员列表、询价列表、聊天会话/未读数、文件接口（404 预期）——全部符合预期。

修复前的失败项（均已修复并复测通过）：
- 新闻列表显示"无标题" → 现在显示真实标题
- 追踪时间线时间显示 "--" → 现在正常显示
- 询价选择"中老泰铁路/中越铁路"提交 500 → 现在成功
- 聊天发送 500 / 历史为空 → 现在收发正常
- 新闻发布/更新 500 → 现在正常
- 订单创建/追踪 500 → 现在正常

---

## 五、仍待处理的问题（非本次范围）

### 安全类（建议尽快处理）

1. **默认管理员 `admin/[REDACTED]`**（`backend/server.js` initDefaultAdmin）——生产环境必须立即修改密码，并考虑移除自动创建逻辑
2. **未鉴权写接口**：`POST /api/tracking`、`POST /api/tracking/:no/events`、`POST/PUT/DELETE /api/services` 无需登录即可操作，应加 `authMiddleware`
3. **PII 泄露**：`GET /api/tracking` 列表接口未鉴权，返回所有运单的发/收件人姓名与电话
4. **聊天历史可被任意读取**：`GET /api/chat/user/:visitorId` 无鉴权、不校验会话所有权
5. **XSS 纵深防御缺失**：`tracking.js`、`news-api.js`、管理后台询价/仪表盘页将 API 数据直接拼 `innerHTML`（后端虽有转义兜底，前端应自行转义）；CSP `scriptSrc` 含 `'unsafe-inline'`
6. **后端转义缺陷**：`security.js` `sanitizeString` 将 `/` 转义为 `&#x2F;`（破坏 URL 类数据），且只清理请求体顶层字段
7. **CI/CD**：工作流硬编码服务器 IP/root 回退值；`test.yml` 吞掉测试失败；`appleboy/*@master` 无版本锁定
8. **deploy-simple.js** 硬编码服务器 IP、root 账号、私钥路径（已在本轮为脚本添加远程目录自动创建，但凭据管理仍建议改环境变量）

### 功能/内容类

9. **联系信息多处矛盾**：聊天自动回复（400-888-8888 / 昆明市 / 2018 年成立）vs 全站（13648336221 / 重庆市南岸区 / 2016 年）；WhatsApp 两个版本号；"有限公司有限公司"文案重复（9 个页面）
10. **i18n key 缺失**：`tracking.statusLabels.*` 等 14 个 key；`serviceThai/serviceViet/serviceRoad/serviceThaiRail/serviceVietRail` 整段缺失；`loading.text` 缺失
11. **`data-i18n-placeholder` 不被翻译**；`tracking.csPhone` 电话号码被 textContent 抹掉
12. **聊天轮询 3 秒 vs 后端限流 5 次/分钟**冲突（页面打开约 15 秒后全部轮询 429）
13. **追踪页示例单号**（SP260001）与种子数据（SP20240001）不符；服务标签编码 `railway` vs `rail` 不一致
14. **新闻订阅按钮无功能**；企业微信客服 kfid 为伪造占位符；ICP 备案号为占位符
15. **管理后台**：admin CSS 路径错误（`public/css/admin.css` → 应为 `../css/admin.css`）；`admin-roles.html` 缺登录检查；`admin-logs.html` fetch 缺 `credentials:'include'`；登录验证码/锁定纯客户端可绕过；报表/仪表盘部分数据为 Math.random 假数据
16. **SEO**：`canonical` 应指向 `https://hengciglobal.com/`；缺 og:image；`index.html` 版权年份等细节

### 运维类

17. **服务进程管理**：CI 用 `pkill + nohup` 裸跑，建议 systemd/PM2 管理并开机自启
18. **Node 版本**：服务器 Node 18 与 better-sqlite3@13（要求 Node >= 22）不兼容，需升级 Node 20+/22+
19. **生产密钥轮换后**：需同步更新服务器上的 `backend/.env`（新密钥），否则服务重启后会话失效

---

## 六、部署上线步骤（修复后）

```bash
# 1. 本地验证
cd backend && npm start          # 确认服务启动、冒烟测试通过

# 2. 提交代码（包含 git rm --cached 的清理）
git add -A && git commit -m "fix: 后端启动修复、数据库契约迁移、前端路径与 i18n 修复、仓库清理"

# 3. 部署（CI 或手动脚本，已支持自动创建远程目录）
node deploy-simple.js            # 需配置好 SSH 私钥

# 4. 服务器端
cd /var/www/laos-logistics/backend
npm install --production
# 确保 .env 使用新的 SESSION_SECRET/COOKIE_SECRET
nohup node server.js > server.log 2>&1 &

# 5. 验证
curl http://localhost:3001/api/health
curl http://localhost:3001/api/news

# 6. 线上检查
#   https://hengciglobal.com/api/health        -> 200
#   https://hengciglobal.com/public/services/service-rail.html -> 200
#   修改默认管理员密码：登录后台后 /api/auth/change-password
```

---

## 七、回滚预案

- 数据库迁移回滚：`node -e "require('fs').copyFileSync('<备份路径>', './database/shengpeng.db')"`（备份位于 `database/backups/shengpeng-precontract-*.db`）
- 代码回滚：`git checkout <上一个提交>`
- 站点回滚：CI 已保留最近 5 份部署备份于服务器 `/var/www/backups/`
