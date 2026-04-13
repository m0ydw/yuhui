# yuhui - 实时多人协作绘图系统

## 项目介绍

yuhui是一款基于Web的实时多人协作绘图系统，采用前后端分离架构，通过WebSocket实现低延迟数据同步，支持多人同时在线绘图、光标同步、房间管理、历史记录等功能，适用于教育、设计、远程协作等场景。

### 核心功能

- 实时多人笔画同步
- 无限画布、缩放、平移
- 房间创建/加入/管理
- 多用户光标实时显示
- 撤销/重做、画笔/橡皮擦
- 绘图数据持久化

## 技术栈

- 前端：Vue 3 + TypeScript + Vite + Canvas + Pinia
- 后端：Node.js + Express + WebSocket + MySQL + Redis
- 部署：Nginx + PM2

## 本地开发环境搭建

### 环境要求

- Node.js ^20.19.0 或 >=22.12.0
- npm 或 pnpm

### 安装依赖

```bash
# 使用 pnpm（推荐）
pnpm install

# 或使用 npm
npm install
```

### 配置环境变量（无特殊需要不必修改）

复制 `.env` 文件并修改配置：

```bash
cp .env.example .env
```

在 `.env` 文件中设置后端API地址：

```env
# 开发环境配置
VITE_API_SERVER=https://localhost:5500/
VITE_API_WS_SERVER=wss://localhost:5500/ws
VITE_API_URL_SERVER=https://localhost:5500
```

### 启动开发服务器

```bash
# 启动开发服务器
pnpm dev

# 或使用 npm
npm run dev
```

开发服务器默认运行在 `https://localhost:5173`

### 构建生产版本

```bash
# 类型检查并构建
pnpm build

# 或使用 npm
npm run build
```

构建产物将生成在 `dist` 目录

## 生产环境部署

### 1. 构建前端项目

```bash
pnpm build
```

### 2. 配置 Nginx

创建 Nginx 配置文件（例如 `/etc/nginx/conf.d/yuhui.conf`）：

```nginx
# 相关内容已经写在后端的readme中
```

### 3. 重启 Nginx

```bash
sudo nginx -t
sudo systemctl restart nginx
```

### 4. 配置生产环境变量

在 `.env.production` 文件中设置生产环境配置：无特殊需要不必修改

```env
# 生产环境配置
VITE_API_SERVER=https://your-domain.com/
VITE_API_WS_SERVER=wss://your-domain.com/ws
VITE_API_URL_SERVER=https://your-domain.com
```

## 项目结构

```
yuhui/
├── public/          # 静态资源
├── src/
│   ├── api/         # API 接口
│   ├── components/  # 组件
│   ├── models/      # 数据模型
│   ├── router/      # 路由
│   ├── stores/      # 状态管理
│   ├── utils/       # 工具函数
│   ├── views/       # 页面
│   ├── App.vue      # 根组件
│   └── main.ts      # 入口文件
├── .env             # 开发环境变量
├── .env.production  # 生产环境变量
├── index.html       # HTML 模板
└── vite.config.ts   # Vite 配置
```

## 注意事项

1. 确保后端服务已启动并运行在配置的端口上
2. 生产环境中需要配置有效的 SSL 证书
3. 确保 Nginx 配置中的路径和域名正确
4. 前端构建时会自动使用 `.env.production` 中的环境变量

## 常见问题

### Q: 前端无法连接后端

A: 检查 `.env` 文件中的 API 地址是否正确，确保后端服务已启动

### Q: 构建后页面空白

A: 检查 Nginx 配置中的静态文件路径是否正确，确保 `try_files` 配置正确

### Q: WebSocket 连接失败

A: 检查 WebSocket 地址配置，确保 Nginx 对 `/ws` 路径的代理配置正确
