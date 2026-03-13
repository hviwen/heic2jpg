# HEIC2JPG 后端服务

用于批量HEIC/HEIF转换为JPEG的Node.js后端API服务。

## 特性

- 🚀 基于Express的高性能API服务器
- 📁 支持单文件和批量文件转换
- 🔧 使用Sharp库进行高质量图片转换
- 🛡️ 完善的文件验证和安全防护
- 📊 实时转换进度跟踪
- 🧹 自动清理临时文件
- 🔒 CORS和文件大小限制

## 技术栈

- Node.js 22+
- Express.js
- node:sqlite
- Sharp (高性能图片处理)
- Multer (文件上传)
- CORS (跨域支持)

## 安装和运行

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```bash
cp .env.example .env
```

### 3. 启动服务

开发模式：
```bash
pnpm dev
```

生产模式：
```bash
pnpm start
```

服务将在 `http://localhost:3001` 启动。

## API接口

### 健康检查

```http
GET /api/health
```

响应：
```json
{
  "status": "healthy",
  "service": "HEIC2JPG Conversion API",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 认证会话

```http
GET /api/auth/session
GET /api/auth/google/start
GET /api/auth/google/callback
POST /api/auth/logout
```

说明：
- 登录使用 Google OAuth
- 会话使用 HTTP-only cookie
- 匿名用户也可以直接调用转换接口

### 单文件转换

```http
POST /api/convert/single
Content-Type: multipart/form-data
```

参数：
- `file`: HEIC/HEIF文件
- `quality`: 图片质量 (1-100，默认90)
- `keepMetadata`: 是否保留元数据 (true/false，默认true)
- `outputFormat`: 输出格式 (jpeg/png/webp，默认jpeg)
- `maxWidth`: 最大宽度 (可选)
- `maxHeight`: 最大高度 (可选)

响应：
```json
{
  "success": true,
  "message": "文件转换成功",
  "data": {
    "original": {
      "filename": "photo.heic",
      "size": 1024000
    },
    "converted": {
      "filename": "converted-photo.jpg",
      "url": "/uploads/converted-photo.jpg",
      "size": 512000
    }
  }
}
```

### 批量文件转换

```http
POST /api/convert/batch
Content-Type: multipart/form-data
```

参数：
- `files`: 多个HEIC/HEIF文件
- 其他参数同单文件转换

响应：
```json
{
  "success": true,
  "message": "批量转换任务已开始",
  "data": {
    "batchId": "123e4567-e89b-12d3-a456-426614174000",
    "totalFiles": 10,
    "status": "processing",
    "progressUrl": "/api/convert/batch/123e4567-e89b-12d3-a456-426614174000/progress",
    "resultsUrl": "/api/convert/batch/123e4567-e89b-12d3-a456-426614174000/results"
  }
}
```

### 转换进度查询

```http
GET /api/convert/batch/{batchId}/progress
```

### 转换结果查询

```http
GET /api/convert/batch/{batchId}/results
```

### 文件下载

```http
GET /api/convert/download/{filename}
```

## 文件支持

### 输入格式
- .heic (iOS照片)
- .heif (高效图像文件格式)

### 输出格式
- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)

### 文件限制
- 单个文件最大: 100MB
- 批量文件最大: 50个文件，总共500MB
- 支持的MIME类型:
  - `image/heic`
  - `image/heif`
  - `image/heic-sequence`
  - `image/heif-sequence`

## 配置选项

### 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| PORT | 3001 | 服务器端口 |
| NODE_ENV | development | 运行环境 |
| BACKEND_URL | http://localhost:3001 | 后端公网地址 |
| FRONTEND_URL | http://localhost:5173 | 前端地址 |
| GOOGLE_CLIENT_ID | - | Google OAuth 客户端 ID |
| GOOGLE_CLIENT_SECRET | - | Google OAuth 客户端密钥 |
| SESSION_SECRET | - | 会话签名密钥 |
| SESSION_MAX_AGE_DAYS | 7 | 会话有效期 |
| DATABASE_PATH | ./data/heic2jpg.sqlite3 | SQLite 文件路径 |
| MAX_FILE_SIZE | 104857600 | 最大文件大小(字节) |
| MAX_FILES | 50 | 最大文件数量 |
| DEFAULT_QUALITY | 90 | 默认图片质量 |
| KEEP_METADATA | true | 是否保留元数据 |
| CLEANUP_OLD_FILES | true | 是否清理旧文件 |
| FILE_RETENTION_HOURS | 24 | 文件保留时间(小时) |

### Sharp配置

Sharp库已经预配置了以下优化：

```javascript
sharp.concurrency(2) // 并发限制
sharp.cache({ memory: 50 }) // 内存缓存
```

## 错误处理

所有错误都按照以下格式返回：

```json
{
  "error": "错误类型",
  "message": "错误描述",
  "path": "/api/convert/single",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "requestId": "abc123"
}
```

### 常见错误代码

| 状态码 | 说明 |
|--------|------|
| 400 | 请求参数错误 |
| 413 | 文件大小超过限制 |
| 415 | 不支持的文件类型 |
| 500 | 服务器内部错误 |
| 507 | 磁盘空间不足 |

## 开发

### 项目结构

```
src/
├── index.js              # 应用入口
├── routes/              # API路由
│   ├── conversion.js    # 转换路由
│   └── health.js        # 健康检查路由
├── services/            # 业务逻辑
│   └── conversionService.js # 转换服务
├── utils/               # 工具函数
│   ├── fileUtils.js     # 文件操作
│   └── validation.js    # 验证逻辑
└── middleware/          # 中间件
    └── errorHandler.js  # 错误处理
```

### 测试

```bash
# 运行测试
pnpm test

# 语法检查
node --check src/index.js
```
## Docker

项目已提供 [`Dockerfile`](/Users/pan/hankins/native/heic2jpg/backend/Dockerfile)，可直接用于容器部署。
CMD ["npm", "start"]
```

### 环境要求

- Node.js 18+
- 足够的磁盘空间（建议至少1GB）
- 支持libheif的系统依赖（Sharp会自动处理）

## 监控和维护

### 日志

日志输出到控制台和文件：

```bash
# 查看实时日志
tail -f logs/app.log
```

### 清理任务

服务会自动清理超过24小时的临时文件，可以通过以下配置调整：

```env
CLEANUP_OLD_FILES=true
FILE_RETENTION_HOURS=24
CLEANUP_INTERVAL_HOURS=1
```

### 性能监控

集成New Relic或Sentry进行性能监控：

```env
NEW_RELIC_LICENSE_KEY=your_license_key
SENTRY_DSN=your_sentry_dsn
```

## 许可证

MIT License
