# HEIC2JPG - 批量 HEIC/HEIF 转换平台

一个面向公开 Web 使用场景的 HEIC/HEIF 转换工具，支持浏览器端和服务器端双模式处理，并已接入最小登录能力。

## 特性

- 🚀 **双模式处理**: 浏览器端小批量处理（保护隐私） + 服务器端大批量处理（高性能）
- 🔐 **最小账号体系**: 支持 Google OAuth 登录，匿名用户也可直接使用
- 🎨 **现代界面**: Vue3 + TypeScript + Vite + Tailwind CSS
- 📱 **响应式设计**: 支持桌面和移动设备
- 📁 **批量处理**: 支持拖放、文件夹上传、多文件选择
- ⚡ **实时进度**: 详细的转换进度和状态显示
- 🔒 **隐私保护**: 可选择浏览器端处理，文件不离开设备
- 🎯 **高质量转换**: 保留EXIF信息，支持质量调整

## 技术栈

### 前端
- Vue 3 + TypeScript + Vite
- Tailwind CSS + Headless UI
- Pinia (状态管理)
- libheif-js (浏览器端HEIC解码)
- File System Access API (文件系统访问)

### 后端
- Node.js + Express
- Node.js SQLite (`node:sqlite`)
- Sharp (高性能图像处理)
- Multer (文件上传处理)
- CORS (跨域支持)

## 项目结构

```
heic2jpg/
├── frontend/          # Vue3前端应用
│   ├── src/
│   │   ├── api/      # API接口
│   │   ├── assets/   # 静态资源
│   │   ├── components/# UI组件
│   │   ├── composables/# 组合式函数
│   │   ├── stores/   # Pinia状态管理
│   │   ├── types/    # TypeScript类型定义
│   │   ├── utils/    # 工具函数
│   │   ├── workers/  # Web Workers
│   │   └── views/    # 页面组件
│   └── ...
├── backend/          # Node.js后端服务
│   ├── src/
│   │   ├── routes/   # API路由
│   │   ├── services/ # 业务逻辑
│   │   ├── utils/    # 工具函数
│   │   └── middleware/# 中间件
│   └── ...
└── README.md
```

## 快速开始

### 环境要求
- Node.js 22+
- pnpm 10+（推荐）

### 安装和运行

开发环境默认端口：
- 前端：`http://localhost:5173`
- 后端：`http://localhost:3001`

1. 克隆项目
```bash
git clone <repository-url>
cd heic2jpg
```

2. 配置环境变量
```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

如果要启用 Google 登录，请在 `backend/.env` 中补充：
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `SESSION_SECRET`
- `BACKEND_URL`
- `FRONTEND_URL`
- `CORS_ORIGIN`

3. 启动前端
```bash
cd frontend
pnpm install
pnpm dev
```

4. 启动后端
```bash
cd backend
pnpm install
pnpm dev
```

5. 打开浏览器访问 `http://localhost:5173`

## 使用说明

1. **上传文件**:
   - 拖放HEIC/HEIF文件到上传区域
   - 点击选择文件或文件夹
   - 从剪贴板粘贴图片

2. **选择处理模式**:
   - **浏览器端处理** (推荐): 文件在本地转换，保护隐私
   - **服务器端处理**: 适用于大批量文件，性能更好

3. **配置选项**:
   - 输出质量 (1-100)
   - 是否保留EXIF信息
   - 输出文件名格式

4. **开始转换**:
   - 实时查看转换进度
   - 支持暂停/继续/取消
   - 逐个文件下载或打包下载

## 开发说明

### 前端开发
```bash
cd frontend
pnpm install
pnpm dev        # 开发模式
pnpm build      # 生产构建
pnpm preview    # 预览生产构建
```

### 后端开发
```bash
cd backend
pnpm install
pnpm start         # 生产模式
pnpm dev           # 开发模式（nodemon）
```

### 代码质量
```bash
# 前端代码检查
cd frontend
pnpm lint

# 类型检查
pnpm type-check

# 后端测试
cd ../backend
pnpm test
```

## 认证接口

后端已提供：
- `GET /api/auth/session`
- `GET /api/auth/google/start`
- `GET /api/auth/google/callback`
- `POST /api/auth/logout`

认证使用 HTTP-only cookie，不在前端本地保存 token。

## Google Auth 接入指南

### 当前实现方式

本项目采用服务端发起的 Google OAuth 2.0 授权码流程：
- 前端点击登录后跳转到后端 `GET /api/auth/google/start`
- 后端生成 `state`、写入 HTTP-only session cookie，再重定向到 Google 授权页
- Google 回调 `GET /api/auth/google/callback`
- 后端用 `code` 换取 token，读取用户资料后写入本地用户表和会话
- 前端通过 `GET /api/auth/session` 获取当前登录态

这意味着：
- 前端不保存 Google access token
- 登录态依赖后端 cookie 和会话表
- 匿名用户仍可直接使用转换功能

### 1. 在 Google Cloud Console 创建 OAuth 配置

1. 打开 [Google Cloud Console](https://console.cloud.google.com/) 并选择项目。
2. 进入 Google Auth Platform，完成 `Branding`、`Audience`、`Data Access` 基础配置。
3. 创建 `OAuth client ID`，应用类型选择 `Web application`。
4. 在 `Authorized redirect URIs` 中添加回调地址：
   - 本地开发：`http://localhost:3001/api/auth/google/callback`
   - 生产环境：`https://<your-backend-domain>/api/auth/google/callback`
5. 如果应用是 `External` 且仍在测试阶段，把测试账号加入 `Audience > Test users`。

本项目当前只使用基础登录权限，scope 为 `openid email profile`，通常不需要额外敏感权限审批。

### 2. 配置环境变量

后端 `.env` 最少需要以下配置：

```bash
PORT=3001
NODE_ENV=development
BACKEND_URL=http://localhost:3001
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
SESSION_SECRET=replace-with-a-long-random-string
SESSION_MAX_AGE_DAYS=7
```

前端 `.env` 需要指向后端：

```bash
VITE_API_BASE_URL=http://localhost:3001
```

关键要求：
- `BACKEND_URL` 必须和 Google Console 里登记的回调域名完全一致
- `FRONTEND_URL` 用于登录成功或失败后的页面跳转
- `CORS_ORIGIN` 必须指向真实前端地址，并允许带 cookie 请求
- `SESSION_SECRET` 必须使用高强度随机值，生产环境不要使用默认值

### 3. 本地联调流程

1. 在 `backend/.env` 中填入 Google OAuth 凭据。
2. 启动后端：`cd backend && pnpm install && pnpm dev`
3. 启动前端：`cd frontend && pnpm install && pnpm dev`
4. 打开 `http://localhost:5173`
5. 点击页面右上角的 Google 登录按钮
6. 登录成功后，前端会通过 `/api/auth/session` 刷新当前用户信息

你可以用下面几个接口确认链路是否正常：
- `GET /api/auth/session`：查看当前是否已登录，以及 `oauthEnabled` 是否为 `true`
- `GET /api/auth/google/start`：检查是否能跳到 Google 授权页
- `POST /api/auth/logout`：确认会话和 cookie 是否已清除

### 4. 生产部署清单

- 前端部署到静态站点，`VITE_API_BASE_URL` 指向后端公网地址
- 后端部署到独立域名，并设置正确的 `BACKEND_URL`
- Google Console 的回调地址改为生产域名
- `FRONTEND_URL`、`CORS_ORIGIN`、`BACKEND_URL` 都换成线上地址
- `SESSION_SECRET` 使用高强度随机串
- 生产环境必须启用 HTTPS

生产环境下，本项目会把 session cookie 设置为：
- `HttpOnly`
- `Secure`
- `SameSite=None`

这适合前后端分域部署，但前提是浏览器访问链路已经是 HTTPS。

### 5. 常见问题排查

#### `GET /api/auth/google/start` 返回 503

通常表示后端没有读到：
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

#### 登录后回调报 `invalid_state`

通常是 session cookie 没带回来，优先检查：
- 前后端域名或端口是否和环境变量一致
- 代理层是否正确转发 `Set-Cookie`
- 生产环境是否启用了 HTTPS

#### Google 返回 `redirect_uri_mismatch`

说明 Google Console 中登记的回调地址和后端实际使用的地址不一致。当前代码使用的回调地址规则是：

```text
${BACKEND_URL}/api/auth/google/callback
```

协议、域名、端口、路径都必须完全一致。

#### 页面上看不到登录按钮

前端会先请求 `/api/auth/session`，只有当返回里的 `oauthEnabled` 为 `true` 时才显示 Google 登录入口。优先检查后端环境变量是否已生效。

### 6. 官方参考

- [OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect)
- [Set up OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [Configure OAuth consent](https://developers.google.com/workspace/guides/configure-oauth-consent)

## 部署建议

- 前端：Vercel 或 Netlify 静态托管
- 后端：Railway 或 Render 独立 API 服务
- 前端通过 `VITE_API_BASE_URL` 指向后端域名
- 生产环境请确保：
  - `CORS_ORIGIN` 指向前端域名
  - `FRONTEND_URL`、`BACKEND_URL` 为公网地址
  - `SESSION_SECRET` 为高强度随机值

## Docker

已提供：
- [`frontend/Dockerfile`](/Users/pan/hankins/native/heic2jpg/frontend/Dockerfile)
- [`backend/Dockerfile`](/Users/pan/hankins/native/heic2jpg/backend/Dockerfile)

## 性能优化

- **浏览器端**: 使用Web Workers处理HEIC解码，避免阻塞UI
- **并发控制**: 限制同时处理的文件数量，防止内存溢出
- **内存管理**: 及时释放Blob URL，避免内存泄漏
- **渐进式加载**: 大文件分块处理，显示实时进度

## 浏览器支持

- Chrome 89+ (推荐)
- Firefox 87+
- Safari 15.4+
- Edge 89+

## 许可证

MIT License
