# 重庆恒慈国际贸易有限公司后端服务

基于 Node.js + Express + SQLite 的轻量级后端服务，为重庆恒慈国际贸易有限公司网站提供 API 支持。

## 功能特性

- ✅ 询价表单提交与管理
- ✅ 货物追踪查询
- ✅ 新闻资讯管理
- ✅ 服务配置管理
- ✅ 多语言支持（中文/英文/越南语）

## 技术栈

- Node.js 18+
- Express 4.18+
- SQLite 3
- Joi 验证

## 快速开始

### 安装依赖

```bash
cd backend
npm install
```

### 初始化数据库

```bash
npm run init
```

或手动运行：

```bash
node scripts/init-data.js
```

### 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

服务默认运行在 http://localhost:3001

## API 接口

### 健康检查

```
GET /api/health
```

### 询价管理

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/inquiry | 创建询价请求 |
| GET | /api/inquiry | 获取询价列表 |
| GET | /api/inquiry/:id | 获取询价详情 |
| PUT | /api/inquiry/:id/status | 更新询价状态 |
| DELETE | /api/inquiry/:id | 删除询价记录 |

**POST /api/inquiry 请求体：**
```json
{
  "transport_type": "rail",
  "origin_city": "广州",
  "dest_city": "万象",
  "cargo_name": "电子产品",
  "weight": 500,
  "volume": 3.5,
  "need_customs": "yes",
  "need_insurance": "no",
  "contact_name": "张三",
  "contact_phone": "13800138000",
  "contact_email": "zhangsan@example.com",
  "company_name": "某科技有限公司",
  "remark": "易碎品，小心轻放"
}
```

### 货物追踪

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/tracking/:trackingNo | 查询运单追踪信息 |
| GET | /api/tracking | 获取运单列表 |
| POST | /api/tracking | 创建运单 |
| POST | /api/tracking/:trackingNo/events | 添加追踪事件 |

### 新闻管理

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/news | 获取新闻列表 |
| GET | /api/news/:id | 获取新闻详情 |
| POST | /api/news | 创建新闻 |
| PUT | /api/news/:id | 更新新闻 |
| DELETE | /api/news/:id | 删除新闻 |

**GET /api/news 查询参数：**
- `page`: 页码，默认 1
- `limit`: 每页数量，默认 10
- `category`: 分类筛选
- `lang`: 语言（zh/en/vi），默认 zh

### 服务管理

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/services | 获取服务列表 |
| GET | /api/services/:code | 获取服务详情 |
| POST | /api/services | 创建服务 |
| PUT | /api/services/:code | 更新服务 |
| DELETE | /api/services/:code | 删除服务 |

**GET /api/services 查询参数：**
- `lang`: 语言（zh/en/vi），默认 zh

## 项目结构

```
backend/
├── server.js          # 服务器入口
├── package.json       # 依赖配置
├── .env              # 环境变量
├── models/
│   └── database.js   # 数据库连接与操作
├── routes/
│   ├── inquiry.js    # 询价路由
│   ├── tracking.js   # 追踪路由
│   ├── news.js       # 新闻路由
│   └── services.js   # 服务路由
├── scripts/
│   └── init-data.js  # 初始化数据脚本
└── database/
    └── example_db.sqlite  # SQLite 数据库文件
```

## 环境变量

| 变量 | 默认值 | 描述 |
|------|--------|------|
| PORT | 3001 | 服务端口 |
| NODE_ENV | development | 运行环境 |
| DB_PATH | ./database/example_db.sqlite | 数据库路径 |

## 测试运单号

- SP20240001 - 中老铁路陆运（运输中）
- SP20240088 - 越南海运（已签收）
- SP20240156 - 泰国海运（运输中）

## License

MIT