# Google OAuth 配置指南

## 获取 Google OAuth 凭据

1. **访问 Google Cloud Console**

   - 打开 [Google Cloud Console](https://console.cloud.google.com/)
   - 登录您的 Google 账号

2. **创建项目** (如果还没有)

   - 点击顶部的项目选择器
   - 点击"新建项目"
   - 输入项目名称（例如："值道"）
   - 点击"创建"

3. **启用 OAuth 同意屏幕**

   - 在左侧菜单中，选择"API 和服务" → "OAuth 同意屏幕"
   - 选择"外部"用户类型（除非您有 Google Workspace）
   - 填写应用信息：
     - 应用名称：值道
     - 用户支持电子邮件：您的邮箱
     - 授权域：（生产环境填写您的域名）
   - 添加必要的权限范围（NextAuth 默认需要 `email` 和 `profile`）
   - 保存并继续

4. **创建 OAuth 2.0 凭据**

   - 在左侧菜单中，选择"API 和服务" → "凭据"
   - 点击"创建凭据" → "OAuth 客户端 ID"
   - 应用类型：选择"Web 应用"
   - 名称：值道 Web 客户端
   - **已授权的 JavaScript 来源**：
     - 本地开发：`http://localhost:3000`
     - 生产环境：`https://yourdomain.com`
   - **已授权的重定向 URI**：
     - 本地开发：`http://localhost:3000/api/auth/callback/google`
     - 生产环境：`https://yourdomain.com/api/auth/callback/google`
   - 点击"创建"

5. **获取凭据**
   - 创建完成后会显示您的客户端 ID 和客户端密钥
   - 将这两个值复制到 `.env` 文件：
     ```bash
     GOOGLE_CLIENT_ID="your-client-id-here.apps.googleusercontent.com"
     GOOGLE_CLIENT_SECRET="your-secret-here"
     ```

## 本地开发测试

```bash
# 1. 确保环境变量已配置
cat .env

# 2. 启动开发服务器
npm run dev

# 3. 访问 http://localhost:3000
# 4. 点击"使用 Google 登录"按钮
# 5. 使用您的 Google 账号登录
```

## 生产环境部署

在 Vercel 部署时，需要在项目设置中添加以下环境变量：

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_URL` (设置为生产域名，如 `https://zhidao.vercel.app`)
- `NEXTAUTH_SECRET` (使用 `openssl rand -base64 32` 生成)

同时确保在 Google Cloud Console 中添加了生产环境的重定向 URI。

## 安全建议

- ⚠️ **切勿将 `.env` 文件提交到 Git**（已在 `.gitignore` 中）
- ⚠️ **客户端密钥必须保密**，仅在服务端使用
- ✅ 定期轮换客户端密钥
- ✅ 在 Google Console 中限制 OAuth 客户端的使用范围

## 故障排查

### "redirect_uri_mismatch" 错误

- 检查 Google Console 中配置的重定向 URI 是否与实际一致
- 本地开发必须使用 `http://localhost:3000/api/auth/callback/google`（不是 127.0.0.1）

### 登录后重定向到错误页面

- 确保 `.env` 中 `NEXTAUTH_URL` 设置正确
- 检查 `NEXTAUTH_SECRET` 是否已配置

### 用户信息未保存到数据库

- 确认 Prisma 已生成客户端：`npx prisma generate`
- 确认数据库已迁移：`npx prisma db push`
