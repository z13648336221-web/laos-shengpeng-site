# 重庆恒慈国际贸易有限公司官网

> 专注东南亚跨境物流的专业物流服务网站，提供中老铁路陆运、泰国海运、越南海运等跨境物流服务。

## 🚀 功能特性

### 多语言支持
- **中文 (简体)** - 默认语言
- **English** - 英文版本
- **Tiếng Việt** - 越南语版本

通过页面顶部的语言切换按钮（中/EN/VN）可以实时切换显示语言。

### 核心服务
- 🚂 **中老铁路陆运** - `service-rail.html`
- 🚢 **泰国海运** - `service-thai.html`
- ⚓ **越南海运** - `service-viet.html`

### 主要页面
| 页面 | 文件 | 说明 |
|------|------|------|
| 首页 | `index.html` | 公司介绍、服务概览 |
| 中老铁路服务 | `service-rail.html` | 路线图、优势、流程、案例 |
| 泰国海运服务 | `service-thai.html` | 详细海运方案 |
| 越南海运服务 | `service-viet.html` | 详细海运方案 |
| 关于我们 | `about.html` | 公司介绍、发展历程、团队 |
| 新闻资讯 | `news.html` | 行业动态、公司新闻 |
| 在线询价 | `inquiry.html` | 物流报价系统 |
| 货物追踪 | `tracking.html` | 运单查询系统 |

## 🛠️ 技术栈

### 前端
- **HTML5** - 语义化网页结构
- **CSS3** - 响应式设计，自定义 CSS 变量
- **JavaScript (ES6+)** - 动态交互功能
- **国际化 (i18n)** - 基于 `data-i18n` 属性的多语言切换

### 后端 (可选)
- **Node.js** - 服务端运行环境
- **Express** - Web 框架
- **API 接口** - 询价、新闻、追踪数据接口

## 📁 项目结构

```
Laos shengpeng site/
├── index.html              # 主页
├── service-rail.html      # 中老铁路服务页
├── service-thai.html      # 泰国海运服务页
├── service-viet.html      # 越南海运服务页
├── about.html             # 关于我们
├── news.html              # 新闻资讯
├── inquiry.html           # 在线询价
├── tracking.html          # 货物追踪
├── css/
│   └── style.css         # 全局样式
├── js/
│   ├── main.js           # 主脚本（含多语言切换）
│   ├── tracking.js       # 追踪功能
│   └── inquiry.js        # 询价功能
├── lang/
│   ├── zh.js             # 中文翻译
│   ├── en.js             # 英文翻译
│   └── vi.js             # 越南语翻译
├── backend/              # 后端服务（可选）
│   ├── server.js
│   ├── routes/
│   └── database/
├── images/               # 图片资源
└── README.md             # 项目说明文档
```

## 🌐 多语言实现

### 数据属性方式
使用 `data-i18n` 属性标记需要翻译的元素：

```html
<h2 data-i18n="service.title">服务标题</h2>
```

### 语言文件结构
翻译文件位于 `lang/` 目录，采用键值对结构：

```javascript
// zh.js 示例
const translations = {
  service: {
    title: '服务标题',
    subtitle: '服务副标题'
  }
}
```

### 切换语言
通过调用 `setLanguage(lang)` 函数切换：
- `setLanguage('zh')` - 切换到中文
- `setLanguage('en')` - 切换到英文
- `setLanguage('vi')` - 切换到越南语

## 🚀 快速开始

### 前端开发
1. 使用任意本地服务器运行项目：
   ```bash
   # Python
   python -m http.server 8000
   
   # Node.js
   npx serve
   
   # VS Code Live Server 扩展
   ```

2. 在浏览器打开 `http://localhost:8000`

### 后端开发（可选）
1. 进入后端目录：
   ```bash
   cd backend
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 启动服务器：
   ```bash
   node server.js
   ```

## 📝 页面开发规范

### 新增页面
1. 在 `lang/` 目录下的三个翻译文件中添加对应的翻译键
2. 在 HTML 中使用 `data-i18n` 属性标记静态文本
3. 保持页脚和导航栏的一致性

### 翻译文件格式
```javascript
const translations = {
  nav: { /* 导航相关 */ },
  footer: { /* 页脚相关 */ },
  pageSpecific: { /* 页面特定内容 */ }
};
```

## 🔧 开发工具推荐

- **代码编辑器**: VS Code
- **浏览器**: Chrome DevTools
- **本地服务器**: Python HTTP Server / Live Server
- **版本控制**: Git

## 📄 许可证

Copyright © 2024 重庆恒慈国际贸易有限公司有限公司. All rights reserved.

## 📞 联系方式

- 电话：13648336221
- 邮箱：z13648336221@Gmail.com
- 地址：重庆市南岸区

---

*最后更新：2026-05-27*
