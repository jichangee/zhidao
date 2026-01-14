# 目标价格通知功能

## 功能说明

当资产的日均成本达到（小于或等于）设置的目标价格时，系统会通过 Bark 发送一次性通知。

## 工作原理

1. **触发条件**：资产的日均成本 ≤ 目标价格
   - 日均成本 = 购买价格 / 已使用天数
   - 只有状态为"服役中"且目标成本类型为"按价格"的资产会被检查

2. **执行时间**：每天 UTC+8 时间 00:00（即 UTC 16:00）自动执行一次

3. **通知规则**：
   - 每个资产只会通知一次
   - 通知后会在数据库中标记为已通知（`targetPriceNotified = true`）
   - 如果用户未配置 Bark Key，则跳过通知

## 配置步骤

### 1. 设置环境变量

在 Vercel 项目设置中添加以下环境变量：

```env
CRON_SECRET=your-random-secret-here
```

这个密钥用于验证 Cron 请求，确保只有 Vercel 可以触发定时任务。

### 2. 配置 Bark Key

用户需要在设置页面配置自己的 Bark Key，以接收通知。

### 3. 设置资产目标价格

在资产编辑页面：
1. 将"目标成本类型"设置为"按价格"
2. 输入目标日均成本价格
3. 保存资产

## Vercel Cron 配置

`vercel.json` 文件已配置：

```json
{
  "crons": [
    {
      "path": "/api/cron/check-target-price",
      "schedule": "0 16 * * *"
    }
  ]
}
```

- `schedule`: "0 16 * * *" 表示每天 UTC 16:00 执行（即北京时间 00:00）
- Vercel 会自动设置 `Authorization` header 为 `Bearer ${CRON_SECRET}`

## API 端点

### GET /api/cron/check-target-price

检查所有资产是否达到目标价格并发送通知。

**Headers:**
```
Authorization: Bearer ${CRON_SECRET}
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2026-01-14T00:00:00.000Z",
  "assetsChecked": 10,
  "notificationsSent": 2,
  "notifications": [
    {
      "assetId": "xxx",
      "userId": "yyy",
      "assetName": "MacBook Pro"
    }
  ]
}
```

## 测试

在开发环境中，可以直接调用 API 进行测试：

```bash
curl http://localhost:3000/api/cron/check-target-price
```

注意：在生产环境中，必须提供正确的 Authorization header。

## 重置通知状态

如果需要让资产再次接收通知，可以在数据库中将 `targetPriceNotified` 字段设置回 `false`：

```sql
UPDATE assets 
SET target_price_notified = false 
WHERE id = 'asset-id';
```

## 通知示例

当资产达到目标价格时，用户会收到如下 Bark 通知：

**标题**: 🎯 达到目标价格  
**内容**: MacBook Pro 的日均成本已达到目标！当前: ¥12.50/天，目标: ¥15.00/天

## 注意事项

1. 确保用户已配置 Bark Key
2. 确保资产有购买价格和购买日期
3. 只有状态为"服役中"的资产会被检查
4. 目标成本类型必须是"按价格"
5. 每个资产只会通知一次，除非手动重置通知状态
