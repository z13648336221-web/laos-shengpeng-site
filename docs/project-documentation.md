# 重庆恒慈国际贸易有限公司管理系统 - 项目文档

---

## 📋 项目概述

重庆恒慈国际贸易有限公司管理系统是一个基于 **Node.js + Express + SQLite** 开发的跨境物流企业管理平台，专注于中老铁路及东南亚海运服务。系统支持多语言（中文/英文/越南语），包含前台展示和后台管理两大模块。

**核心定位：**
- 为客户提供便捷的货物追踪、在线询价服务
- 为企业提供完整的订单、客户、报价管理能力
- 支持三语切换，服务中、英、越语系客户
- 提供智能客服系统，提升客户服务效率

**服务范围：**
- 🚂 中老铁路陆运（中国 - 老挝）
- 🚢 泰国海运（中国 - 泰国）
- ⚓ 越南海运（中国 - 越南）

---

## 📁 项目结构

```
Laos shengpeng site/
├── index.html                    # 首页（公司介绍、服务展示、轮播图）
├── about.html                    # 关于我们（公司简介、联系方式）
├── news.html                     # 新闻资讯（动态新闻列表、分类筛选）
├── tracking.html                 # 货物追踪（运单号查询、物流轨迹时间线）
├── inquiry.html                  # 在线询价（表单验证、报价计算、API提交）
├── service-rail.html             # 中老铁路服务详情
├── service-thai.html             # 泰国海运服务详情
├── service-viet.html             # 越南海运服务详情
├── admin.html                    # 后台管理首页（新闻管理）
├── admin-login.html              # 后台登录（密码验证、验证码、登录限制）
├── admin-dashboard.html          # 仪表盘（数据统计、快捷入口）
├── admin-reports.html            # 数据分析报表（订单趋势、收入分析）
├── admin-orders.html             # 订单管理页面（批量操作、状态更新）
├── admin-customers.html          # 客户管理页面（分组管理、标签筛选）
├── admin-quotes.html             # 报价管理页面（价格配置、模板管理）
├── admin-inquiry.html            # 询价管理页面（询价列表、报价处理）
├── admin-chat.html               # 客服管理页面（会话管理、消息回复）
├── css/
│   ├── style.css                 # 全局样式（响应式布局、主题色彩）
│   ├── admin.css                 # 后台管理公共样式（统一风格、组件样式）
│   └── chat.css                  # 在线客服浮窗样式（聊天界面、二维码弹窗）
├── js/
│   ├── i18n.js                   # 多语言模块（语言加载、翻译切换）
│   ├── main.js                   # 主脚本（导航、公共交互）
│   ├── news-api.js               # 新闻API（列表获取、详情展示）
│   ├── tracking.js               # 追踪功能（运单查询、轨迹渲染）
│   ├── inquiry.js                # 询价功能（表单验证、提交处理）
│   └── chat.js                   # 在线客服前端（浮窗、消息发送、自动回复）
├── lang/
│   ├── zh.js                     # 中文翻译（全站文本）
│   ├── en.js                     # 英文翻译（全站文本）
│   └── vi.js                     # 越南语翻译（全站文本）
├── backend/
│   ├── server.js                 # 服务入口（Express配置、中间件、路由注册）
│   ├── routes/                   # API路由（模块化接口定义）
│   │   ├── news.js               # 新闻管理API
│   │   ├── tracking.js           # 货物追踪API
│   │   ├── inquiry.js            # 在线询价API
│   │   ├── orders.js             # 订单管理API
│   │   ├── customers.js          # 客户管理API
│   │   ├── quotes.js             # 报价管理API
│   │   ├── services.js           # 服务配置API
│   │   ├── auth.js               # 认证API（登录、登出、验证码）
│   │   └── chat.js               # 在线客服API（消息收发、自动回复）
│   ├── models/
│   │   └── database.js           # 数据库模型（SQLite操作封装）
│   ├── middleware/
│   │   └── auth.js               # 认证中间件（登录状态检查）
│   ├── database/
│   │   └── data.json             # 初始数据文件
│   ├── scripts/
│   │   ├── init-data.js          # 数据初始化脚本
│   │   ├── create-test-data.js   # 测试数据生成脚本
│   │   ├── create-orders-data.js # 订单测试数据
│   │   ├── create-customers.js   # 客户测试数据
│   │   ├── create-quotes.js      # 报价测试数据
│   │   ├── create-inquiries.js   # 询价测试数据
│   │   └── create_all_test_data.js # 批量创建测试数据
│   ├── .env                      # 环境变量配置
│   ├── package.json              # 依赖配置
│   └── README.md                 # 后端说明文档
├── sitemap.xml                   # 网站地图（SEO优化）
├── robots.txt                    # 爬虫配置（SEO优化）
└── README.md                     # 项目说明
```

---

## ✅ 已完成功能

### 1. 前台功能

| 功能模块 | 状态 | 说明 | 文件 |
|---------|------|------|------|
| 首页展示 | ✅ | 轮播图、服务卡片、公司介绍、客户案例 | index.html |
| 多语言支持 | ✅ | 中/英/越三语实时切换，URL参数传递 | lang/*, js/i18n.js |
| 货物追踪 | ✅ | 运单号查询、物流轨迹时间线、多语言状态展示 | tracking.html |
| 在线询价 | ✅ | 表单验证、报价计算、API提交、成功反馈 | inquiry.html |
| 新闻资讯 | ✅ | 动态新闻列表、分类筛选、分页展示 | news.html |
| 服务详情 | ✅ | 中老铁路、泰国/越南海运详细介绍 | service-*.html |
| 关于我们 | ✅ | 公司简介、联系方式、资质展示 | about.html |
| 在线客服 | ✅ | 智能客服浮窗、自动回复、企业微信客服集成 | js/chat.js, css/chat.css |

### 2. 后台功能

| 功能模块 | 状态 | 说明 | 文件 |
|---------|------|------|------|
| 登录安全 | ✅ | 密码强度验证、登录失败次数限制（5次锁定60秒）、图形验证码 | admin-login.html |
| 仪表盘 | ✅ | 数据统计卡片、订单状态分布图表、待处理询价列表 | admin-dashboard.html |
| 数据分析报表 | ✅ | 订单量趋势、收入趋势、客户分布等ECharts图表 | admin-reports.html |
| 新闻管理 | ✅ | 添加、编辑、删除新闻，支持多语言 | admin.html |
| 订单管理 | ✅ | 创建订单、状态更新、订单查询、运单号生成、批量操作 | admin-orders.html |
| 客户管理 | ✅ | 客户信息管理、联系记录追踪、客户分类（A/B/C组） | admin-customers.html |
| 报价管理 | ✅ | 价格配置、报价模板管理、自动计算 | admin-quotes.html |
| 询价管理 | ✅ | 询价列表展示、报价处理 | admin-inquiry.html |
| 客服管理 | ✅ | 会话列表、消息管理、快捷回复 | admin-chat.html |

### 3. 后端API

| API模块 | 状态 | 接口 | 文件 |
|---------|------|------|------|
| 认证API | ✅ | POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me, GET /api/auth/captcha | backend/routes/auth.js |
| 新闻API | ✅ | GET/POST/PUT/DELETE /api/news | backend/routes/news.js |
| 追踪API | ✅ | GET /api/tracking/:id, POST /api/tracking/events | backend/routes/tracking.js |
| 询价API | ✅ | POST /api/inquiry, GET /api/inquiry | backend/routes/inquiry.js |
| 订单API | ✅ | GET/POST/PUT/DELETE /api/orders | backend/routes/orders.js |
| 客户API | ✅ | GET/POST/PUT/DELETE /api/customers | backend/routes/customers.js |
| 报价API | ✅ | GET/POST/PUT/DELETE /api/quotes, GET /api/quotes/calculate | backend/routes/quotes.js |
| 服务API | ✅ | GET /api/services | backend/routes/services.js |
| 客服API | ✅ | POST /api/chat/user, GET /api/chat/user/:id, POST /api/chat/admin/reply, GET /api/chat/sessions | backend/routes/chat.js |
| 健康检查 | ✅ | GET /api/health | backend/server.js |
| 语言标签 | ✅ | GET /api/labels | backend/server.js |

---

## 🚀 技术栈

### 前端技术

| 分类 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 框架 | HTML5 | - | 语义化标签、响应式设计 |
| 样式 | CSS3 | - | Flexbox布局、媒体查询、CSS变量 |
| 脚本 | JavaScript ES6+ | - | 模块化开发、异步处理 |
| 多语言 | 自定义i18n | - | 基于data-i18n属性的翻译系统 |
| 图表 | ECharts | ^5.x | 数据可视化图表（仪表盘、报表） |
| 验证码 | Canvas API | - | 动态图形验证码生成 |

### 后端技术

| 分类 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 语言 | Node.js | ^20.x | 服务端运行时 |
| 框架 | Express | ^4.18.2 | Web应用框架 |
| 数据库 | SQLite | ^5.1.6 | 轻量级嵌入式数据库 |
| 中间件 | CORS | ^2.8.5 | 跨域资源共享 |
| 环境变量 | dotenv | ^16.3.1 | 配置管理 |
| 参数验证 | Joi | ^17.11.0 | 数据校验 |
| 会话管理 | express-session | ^1.17.3 | 用户会话管理 |
| 加密 | bcrypt | ^5.1.1 | 密码加密 |

---

## 🔧 启动方式

### 开发环境

```bash
# 启动前端静态服务（端口8000）
cd "Laos shengpeng site"
python -m http.server 8000

# 启动后端API服务（端口3001，新终端）
cd "Laos shengpeng site/backend"
npm install
npm start
```

### 开发模式（热重载）

```bash
cd "Laos shengpeng site/backend"
npm run dev    # 使用nodemon自动重启
```

### 访问地址

| 页面 | 地址 | 说明 |
|------|------|------|
| 网站首页 | http://localhost:8000/index.html | 默认中文 |
| 英文首页 | http://localhost:8000/index.html?lang=en | 英文模式 |
| 越南语首页 | http://localhost:8000/index.html?lang=vi | 越南语模式 |
| 后台登录 | http://localhost:8000/admin-login.html | 用户名:admin, 密码:admin123 |
| 仪表盘 | http://localhost:8000/admin-dashboard.html | 数据概览 |
| 数据分析报表 | http://localhost:8000/admin-reports.html | 图表分析 |
| 新闻管理 | http://localhost:8000/admin.html | 新闻CRUD |
| 订单管理 | http://localhost:8000/admin-orders.html | 订单列表、批量操作 |
| 客户管理 | http://localhost:8000/admin-customers.html | 客户列表、分组管理 |
| 报价管理 | http://localhost:8000/admin-quotes.html | 报价配置 |
| 询价管理 | http://localhost:8000/admin-inquiry.html | 询价处理 |
| 客服管理 | http://localhost:8000/admin-chat.html | 会话管理 |
| 后端API | http://localhost:3001/api | API基础路径 |
| 健康检查 | http://localhost:3001/api/health | 服务状态 |

---

## 🌐 多语言系统

### 语言支持

| 语言代码 | 语言名称 | 说明 |
|---------|---------|------|
| zh | 中文 | 默认语言 |
| en | English | 英文 |
| vi | Tiếng Việt | 越南语 |

### 实现机制

**前端实现：**
- 通过 `data-i18n` 属性标记需要翻译的文本
- `i18n.js` 模块负责加载语言文件和替换文本
- 语言切换通过URL参数 `?lang=zh|en|vi` 传递
- 页面加载时自动检测URL参数并应用对应语言

**后端实现：**
- 通过请求头 `x-lang` 或URL参数 `lang` 识别语言
- 所有API响应支持多语言消息
- 状态标签自动根据语言返回对应翻译

### 翻译文件结构

```javascript
// lang/zh.js 示例
{
  hero: {
    title: '连接中国与东南亚的',
    subtitle: '专业跨境物流',
    partner: '伙伴'
  },
  service: {
    railway: '中老铁路陆运',
    thailand: '泰国海运',
    vietnam: '越南海运'
  },
  login: {
    title: '后台登录',
    username: '用户名',
    password: '密码',
    captcha: '验证码',
    loginBtn: '登录',
    forgotPwd: '忘记密码'
  }
}
```

---

## 📊 数据库结构

### 1. news（新闻表）

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | INTEGER | 主键，自增 | PRIMARY KEY AUTOINCREMENT |
| title_zh | TEXT | 中文标题 | NOT NULL |
| title_en | TEXT | 英文标题 | - |
| title_vi | TEXT | 越南语标题 | - |
| content_zh | TEXT | 中文内容 | NOT NULL |
| content_en | TEXT | 英文内容 | - |
| content_vi | TEXT | 越南语内容 | - |
| summary_zh | TEXT | 中文摘要 | - |
| summary_en | TEXT | 英文摘要 | - |
| summary_vi | TEXT | 越南语摘要 | - |
| image_url | TEXT | 封面图片URL | - |
| category | TEXT | 分类 | company/service/policy/industry |
| publish_date | TEXT | 发布日期 | YYYY-MM-DD |
| created_at | TEXT | 创建时间 | ISO格式 |

### 2. shipments（运单表）

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | INTEGER | 主键 | PRIMARY KEY AUTOINCREMENT |
| tracking_number | TEXT | 运单号 | UNIQUE |
| service_code | TEXT | 服务代码 | railway/thailand-sea/vietnam-sea |
| status | TEXT | 状态 | pending/picked_up/in_transit/departed/customs/delivered |
| goods_description | TEXT | 货物描述 | - |
| weight | REAL | 重量(KG) | - |
| volume | REAL | 体积(CBM) | - |
| origin | TEXT | 起运地 | - |
| destination | TEXT | 目的地 | - |
| sender_name | TEXT | 发货人姓名 | - |
| sender_phone | TEXT | 发货人电话 | - |
| receiver_name | TEXT | 收货人姓名 | - |
| receiver_phone | TEXT | 收货人电话 | - |
| estimated_delivery | TEXT | 预计到达时间 | - |
| created_at | TEXT | 创建时间 | ISO格式 |

### 3. tracking_events（追踪事件表）

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | INTEGER | 主键 | PRIMARY KEY AUTOINCREMENT |
| shipment_id | INTEGER | 关联运单ID | FOREIGN KEY |
| status | TEXT | 状态 | - |
| location | TEXT | 位置 | - |
| description_zh | TEXT | 中文描述 | NOT NULL |
| description_en | TEXT | 英文描述 | - |
| description_vi | TEXT | 越南语描述 | - |
| timestamp | TEXT | 时间戳 | ISO格式 |

### 4. inquiry（询价表）

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | INTEGER | 主键 | PRIMARY KEY AUTOINCREMENT |
| transport_type | TEXT | 运输方式 | - |
| origin_city | TEXT | 起运城市 | - |
| dest_city | TEXT | 目的城市 | - |
| cargo_name | TEXT | 货物品名 | - |
| weight | REAL | 重量(KG) | - |
| volume | REAL | 体积(CBM) | - |
| contact_name | TEXT | 联系人 | - |
| contact_phone | TEXT | 联系电话 | - |
| status | TEXT | 状态 | pending/quoted/rejected |
| quote_id | INTEGER | 关联报价ID | - |
| created_at | TEXT | 创建时间 | ISO格式 |

### 5. orders（订单表）

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | INTEGER | 主键 | PRIMARY KEY AUTOINCREMENT |
| tracking_number | TEXT | 运单号 | UNIQUE |
| service_code | TEXT | 服务代码 | - |
| status | TEXT | 状态 | pending/picked_up/in_transit/departed/customs/delivered/cancelled |
| cargo_name | TEXT | 货物品名 | NOT NULL |
| cargo_type | TEXT | 货物类型 | general/dangerous/valuable |
| weight | REAL | 重量(KG) | NOT NULL |
| volume | REAL | 体积(CBM) | - |
| load_type | TEXT | 装载类型 | lcl/fcl |
| origin_city | TEXT | 起运城市代码 | NOT NULL |
| dest_city | TEXT | 目的城市代码 | NOT NULL |
| sender_name | TEXT | 发货人 | - |
| sender_phone | TEXT | 发货人电话 | - |
| receiver_name | TEXT | 收货人 | - |
| receiver_phone | TEXT | 收货人电话 | - |
| receiver_address | TEXT | 收货地址 | - |
| contact_name | TEXT | 联系人 | NOT NULL |
| contact_phone | TEXT | 联系电话 | NOT NULL |
| estimated_delivery | TEXT | 预计送达 | - |
| actual_delivery | TEXT | 实际送达 | - |
| timeline | TEXT | 轨迹JSON | - |
| remarks | TEXT | 备注 | - |
| created_at | TEXT | 创建时间 | ISO格式 |
| updated_at | TEXT | 更新时间 | ISO格式 |

### 6. customers（客户表）

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | INTEGER | 主键 | PRIMARY KEY AUTOINCREMENT |
| name | TEXT | 客户姓名 | NOT NULL |
| company | TEXT | 公司名称 | - |
| phone | TEXT | 联系电话 | NOT NULL |
| email | TEXT | 邮箱 | - |
| wechat | TEXT | 微信号 | - |
| address | TEXT | 地址 | - |
| type | TEXT | 客户类型 | general/enterprise/agent/VIP |
| group | TEXT | 客户分组 | A/B/C |
| status | TEXT | 状态 | active/inactive |
| remarks | TEXT | 备注 | - |
| contact_count | INTEGER | 联系次数 | DEFAULT 0 |
| total_value | REAL | 累计交易额 | DEFAULT 0 |
| last_contact | TEXT | 最后联系时间 | - |
| created_at | TEXT | 创建时间 | ISO格式 |
| updated_at | TEXT | 更新时间 | ISO格式 |

### 7. customer_contacts（客户联系记录表）

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | INTEGER | 主键 | PRIMARY KEY AUTOINCREMENT |
| customer_id | INTEGER | 关联客户ID | FOREIGN KEY |
| type | TEXT | 联系类型 | phone/wechat/email/meeting/other |
| content | TEXT | 联系内容 | - |
| created_at | TEXT | 创建时间 | ISO格式 |

### 8. quotes（报价表）

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | INTEGER | 主键 | PRIMARY KEY AUTOINCREMENT |
| name | TEXT | 报价名称 | NOT NULL |
| service_code | TEXT | 服务代码 | NOT NULL |
| origin_city | TEXT | 起运城市 | - |
| dest_city | TEXT | 目的城市 | - |
| min_weight | REAL | 最低重量(KG) | - |
| max_weight | REAL | 最高重量(KG) | - |
| base_price | REAL | 基础单价 | NOT NULL |
| price_unit | TEXT | 计价单位 | KG/CBM |
| customs_fee | REAL | 清关费用 | - |
| insurance_rate | REAL | 保险费率 | - |
| transit_days | INTEGER | 运输天数 | - |
| valid_days | INTEGER | 报价有效期(天) | DEFAULT 7 |
| status | TEXT | 状态 | active/inactive |
| remarks | TEXT | 备注 | - |
| created_at | TEXT | 创建时间 | ISO格式 |
| updated_at | TEXT | 更新时间 | ISO格式 |

### 9. chat_messages（聊天消息表）

| 字段 | 类型 | 说明 | 约束 |
|------|------|------|------|
| id | INTEGER | 主键 | PRIMARY KEY AUTOINCREMENT |
| visitor_id | TEXT | 访客ID | NOT NULL |
| visitor_name | TEXT | 访客名称 | - |
| sender | TEXT | 发送者 | visitor/admin |
| message | TEXT | 消息内容 | NOT NULL |
| created_at | TEXT | 创建时间 | ISO格式 |

---

## 🔌 API接口文档

### 1. 认证API

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| POST | /api/auth/login | 用户登录 | username, password, captcha |
| POST | /api/auth/logout | 用户登出 | - |
| GET | /api/auth/me | 获取当前用户 | - |
| GET | /api/auth/captcha | 获取验证码图片 | - |

**登录响应格式：**
```json
{
  "success": true,
  "data": { "username": "admin", "role": "admin" },
  "message": "登录成功"
}
```

### 2. 新闻API

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| GET | /api/news | 获取新闻列表 | page, limit, category, lang |
| GET | /api/news/:id | 获取新闻详情 | id, lang |
| POST | /api/news | 创建新闻 | title_zh, title_en, title_vi, content_zh, content_en, content_vi, summary_zh, summary_en, summary_vi, image_url, category, publish_date |
| PUT | /api/news/:id | 更新新闻 | 同上 |
| DELETE | /api/news/:id | 删除新闻 | id |

### 3. 追踪API

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| GET | /api/tracking/:trackingNo | 查询运单轨迹 | trackingNo, lang |
| GET | /api/tracking | 获取运单列表 | page, limit |
| POST | /api/tracking | 创建运单 | tracking_number, sender_name, sender_phone, receiver_name, receiver_phone, origin, destination, service_code, status, goods_description, weight, volume, estimated_delivery |
| POST | /api/tracking/:trackingNo/events | 添加追踪事件 | status, location, description_zh, description_en, description_vi, timestamp |

### 4. 询价API

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| POST | /api/inquiry | 提交询价 | transport_type, origin_city, dest_city, cargo_name, weight, volume, contact_name, contact_phone |
| GET | /api/inquiry | 获取询价列表 | page, limit, status, lang |
| GET | /api/inquiry/:id | 获取询价详情 | id, lang |
| PUT | /api/inquiry/:id | 更新询价状态 | status, quote_id |

### 5. 订单API

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| GET | /api/orders | 获取订单列表 | page, limit, status, keyword, lang |
| GET | /api/orders/:id | 获取订单详情 | id, lang |
| POST | /api/orders | 创建订单 | service_code, cargo_name, weight, origin_city, dest_city, contact_name, contact_phone, sender_name, sender_phone, receiver_name, receiver_phone, receiver_address, cargo_type, volume, load_type, estimated_delivery, remarks |
| PUT | /api/orders/:id | 更新订单 | status, estimated_delivery, remarks |
| DELETE | /api/orders/:id | 删除订单 | id |
| PUT | /api/orders/batch/status | 批量更新状态 | ids[], status |
| DELETE | /api/orders/batch | 批量删除订单 | ids[] |

### 6. 客户API

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| GET | /api/customers | 获取客户列表 | page, limit, keyword, type, group, lang |
| GET | /api/customers/:id | 获取客户详情 | id, lang |
| POST | /api/customers | 创建客户 | name, company, phone, email, wechat, address, type, group, remarks |
| PUT | /api/customers/:id | 更新客户 | 同上 + status |
| DELETE | /api/customers/:id | 删除客户 | id |
| GET | /api/customers/:id/contacts | 获取联系记录 | id |
| POST | /api/customers/:id/contacts | 添加联系记录 | type, content |

### 7. 报价API

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| GET | /api/quotes | 获取报价列表 | page, limit, service_code, lang |
| GET | /api/quotes/:id | 获取报价详情 | id, lang |
| POST | /api/quotes | 创建报价 | name, service_code, origin_city, dest_city, min_weight, max_weight, base_price, price_unit, customs_fee, insurance_rate, transit_days, valid_days, remarks |
| PUT | /api/quotes/:id | 更新报价 | 同上 + status |
| DELETE | /api/quotes/:id | 删除报价 | id |
| GET | /api/quotes/calculate | 计算报价 | service_code, weight, volume, need_customs, need_insurance, lang |

### 8. 客服API

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| POST | /api/chat/user | 访客发送消息 | visitorId, visitorName, message |
| GET | /api/chat/user/:visitorId | 获取访客消息历史 | visitorId |
| POST | /api/chat/admin/reply | 管理员回复消息 | visitorId, message |
| GET | /api/chat/sessions | 获取会话列表 | - |
| GET | /api/chat/session/:visitorId | 获取指定会话 | visitorId |
| DELETE | /api/chat/session/:visitorId | 删除会话 | visitorId |

### 9. 通用API

| 方法 | 路径 | 说明 | 参数 |
|------|------|------|------|
| GET | /api/health | 健康检查 | - |
| GET | /api/languages | 获取支持语言列表 | - |
| GET | /api/labels | 获取多语言标签 | lang |
| GET | /api/services | 获取服务配置 | - |

---

## 🛡️ 安全功能

### 登录安全

| 功能 | 说明 | 实现位置 |
|------|------|----------|
| 密码强度验证 | 实时检测密码强度（弱/中/强），要求至少6位 | admin-login.html |
| 登录失败次数限制 | 5次失败后锁定账户60秒 | backend/routes/auth.js |
| 图形验证码 | Canvas动态生成随机验证码，防止自动化攻击 | backend/routes/auth.js |
| 会话管理 | 使用express-session管理登录状态 | backend/middleware/auth.js |

### 自动回复规则

系统内置17条自动回复规则，覆盖常见业务场景：

| 关键词 | 回复内容摘要 |
|--------|-------------|
| 价格、费用、报价 | 运费计算说明，不同运输方式价格范围 |
| 时间、时效、多久 | 不同运输方式的预计时效 |
| 铁路、中老铁路 | 中老铁路服务介绍 |
| 海运、泰国、越南 | 海运服务说明 |
| 清关、报关 | 清关流程和费用说明 |
| 包装、装箱 | 包装要求和注意事项 |
| 付款、支付 | 付款方式说明 |
| 保险 | 货物保险服务介绍 |

---

## 📝 开发规范

### 代码风格

- **前端：** 使用 ES6+ 语法，变量用 `const/let`，函数用箭头函数
- **后端：** 使用 CommonJS 模块，遵循 Express 标准约定
- **命名：** 变量用驼峰式(camelCase)，常量用大写下划线(SNAKE_CASE)
- **注释：** 函数和复杂逻辑添加必要注释

### 多语言规范

- 所有用户可见文本必须使用 `data-i18n` 属性
- 翻译键名采用层级结构（如 `hero.title`）
- 三语必须同步更新，保持一致性

### API规范

- 响应统一格式：`{ success: boolean, data?: any, message?: string, pagination?: object }`
- 错误处理：使用合适的HTTP状态码（400参数错误、401未授权、404未找到、500服务器错误）
- 多语言消息：根据 `lang` 参数返回对应语言的提示信息

### 数据库规范

- 时间字段统一使用 ISO 格式字符串
- JSON字段存储为 TEXT 类型，使用 `JSON.parse/stringify` 处理
- 关联字段使用 INTEGER 类型存储ID

---

## 🔐 安全注意事项

- **输入验证：** 所有用户输入必须经过验证，防止注入攻击
- **XSS防护：** 前端输出内容进行HTML转义
- **CORS配置：** 限制允许的来源域名
- **错误处理：** 避免暴露敏感错误信息给客户端
- **密码安全：** 使用bcrypt进行密码加密存储
- **会话安全：** 使用HttpOnly和Secure标志保护会话Cookie

---

## 📈 部署建议

### 开发环境
- 前端：Python HTTP Server 或 Live Server
- 后端：Node.js + nodemon 热重载

### 生产环境
- 前端：Nginx 静态文件服务 + 反向代理
- 后端：PM2 进程管理
- 数据库：SQLite 文件备份策略
- SSL证书：配置HTTPS

---

## 📝 开发日志

### 2026年4月
- ✅ 项目初始化
- ✅ 多语言系统搭建
- ✅ 货物追踪功能开发
- ✅ 在线询价功能开发
- ✅ 新闻管理后台开发
- ✅ SEO优化（sitemap.xml, robots.txt）

### 2026年5月
- ✅ 订单管理系统开发
- ✅ 客户管理系统开发
- ✅ 报价管理系统开发
- ✅ 多语言内容完善
- ✅ 项目文档编写
- ✅ 仪表盘页面开发
- ✅ 数据分析报表页面

### 2026年6月
- ✅ 登录安全增强（密码强度、验证码、登录限制）
- ✅ 订单批量操作功能
- ✅ 客户分组管理（A/B/C组）
- ✅ 在线客服系统（自动回复、企业微信集成）
- ✅ 数据可视化图表（ECharts）
- ✅ 后台样式统一（admin.css）
- ✅ 修复新闻添加后列表不显示问题
- ✅ 修复订单状态更新无效问题
- ✅ 修复批量删除确认问题
- ✅ 修复客服会话点击无反应问题

---

## 📄 许可证

© 2026 重庆恒慈国际贸易有限公司有限公司