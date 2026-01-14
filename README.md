## 值道 - 资产管理应用

一个简洁高效的个人资产管理工具，采用 Next.js 16 + Vercel Postgres 构建。

### 功能特性

- 📊 **资产管理** - 支持现金、投资、房产、负债四大类别
- 📈 **趋势可视化** - 查看历史净资产变化趋势
- 🔒 **隐私模式** - 一键隐藏所有金额数字
- 📱 **响应式设计** - 完美适配桌面端和移动端
- 🔔 **Bark 推送** - 大额资产变动自动推送到 iOS 设备
- 🎯 **目标价格提醒** - 资产达到目标价格时自动通知（每日检查）
- 🔐 **Google 登录** - 安全的 OAuth 2.0 认证

### 技术栈

- **前端**: Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- **UI 组件**: shadcn/ui + Radix UI
- **数据库**: Vercel Postgres + Prisma ORM
- **认证**: NextAuth.js v5 (Email Provider)
- **图表**: Recharts
- **推送**: Bark (iOS)

### 快速开始

1. **安装依赖**

   ```bash
   npm install
   ```

2. **配置环境变量**

   复制 `env.example` 创建 `.env` 文件：

   ```bash
   cp env.example .env
   ```

   配置以下变量：

   - `DATABASE_URL`: 数据库连接字符串
   - `NEXTAUTH_URL`: 应用域名 (本地开发使用 `http://localhost:3000`)
   - `NEXTAUTH_SECRET`: 认证密钥 (可用 `openssl rand -base64 32` 生成)
   - `GOOGLE_CLIENT_ID`: Google OAuth 客户端 ID ([获取方式](https://console.cloud.google.com/apis/credentials))
   - `GOOGLE_CLIENT_SECRET`: Google OAuth 客户端密钥
   - `BARK_KEY`: (可选) Bark 推送密钥
   - `CRON_SECRET`: (生产环境) Vercel Cron 认证密钥

3. **初始化数据库**

   ```bash
   npx prisma db push
   npx prisma generate
   ```

4. **启动开发服务器**

   ```bash
   npm run dev
   ```

   访问 http://localhost:3000

### 数据库结构

- **users** - 用户表
- **assets** - 资产明细表
- **snapshots** - 每日净资产快照表

### 定时任务

应用使用 Vercel Cron 执行每日定时任务：

- **目标价格检查** - 每天 UTC+8 00:00 执行，检查资产是否达到目标价格并发送通知
  - 详细说明见 [docs/target-price-notification.md](docs/target-price-notification.md)

### 部署到 Vercel

1. 推送代码到 GitHub
2. 在 Vercel 导入项目
3. 配置环境变量
4. 自动部署完成

### 开发状态

- [x] Phase 1: 基础设施搭建
- [x] Phase 2: 核心资产管理 API
- [ ] Phase 3: Dashboard 可视化
- [ ] Phase 4: 增强体验
- [ ] Phase 5: 部署与优化

### License

MIT
