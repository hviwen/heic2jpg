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
