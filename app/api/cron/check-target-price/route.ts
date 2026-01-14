import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { sendBarkNotification } from "@/lib/bark"

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 最长执行60秒

/**
 * Cron job to check if assets have reached their target price
 * This should run once per day at UTC+8 00:00 (UTC 16:00 previous day)
 */
export async function GET(request: Request) {
  try {
    // 验证请求来自 Vercel Cron
    const authHeader = request.headers.get("authorization")
    if (
      process.env.NODE_ENV === "production" &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Starting daily target price check...")

    // 查找所有设置了按价格目标且状态为服役中的资产
    const assets = await prisma.asset.findMany({
      where: {
        status: "服役中",
        targetCostType: "按价格",
        targetCost: {
          not: null,
        },
        targetPriceNotified: false, // 只查找未通知过的
      },
      include: {
        user: {
          select: {
            id: true,
            barkKey: true,
            email: true,
          },
        },
      },
    })

    console.log(`Found ${assets.length} assets with target price set`)

    const notifications: Array<{ assetId: string; userId: string; assetName: string }> = []

    for (const asset of assets) {
      // 计算当前日均成本
      if (!asset.purchasePrice || !asset.purchaseDate) {
        continue
      }

      const purchaseDate = new Date(asset.purchaseDate)
      const now = new Date()
      const daysUsed = Math.floor(
        (now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysUsed === 0) {
        continue // 避免除以零
      }

      const dailyCost = Number(asset.purchasePrice) / daysUsed
      const targetCost = Number(asset.targetCost)

      // 检查是否达到目标价格（小于目标价格）
      if (dailyCost <= targetCost) {
        console.log(
          `Asset ${asset.name} reached target price. Daily cost: ${dailyCost}, Target: ${targetCost}`
        )

        // 发送 Bark 通知
        if (asset.user.barkKey) {
          try {
            await sendBarkNotification(
              asset.user.id,
              "🎯 达到目标价格",
              `${asset.name} 的日均成本已达到目标！当前: ¥${dailyCost.toFixed(2)}/天，目标: ¥${targetCost.toFixed(2)}/天`
            )

            // 标记为已通知
            await prisma.asset.update({
              where: { id: asset.id },
              data: { targetPriceNotified: true },
            })

            notifications.push({
              assetId: asset.id,
              userId: asset.user.id,
              assetName: asset.name,
            })

            console.log(`Notification sent for asset ${asset.name}`)
          } catch (error) {
            console.error(`Failed to send notification for asset ${asset.name}:`, error)
          }
        } else {
          console.log(`User ${asset.user.email} has no Bark key configured`)
        }
      }
    }

    console.log(`Target price check completed. Sent ${notifications.length} notifications.`)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      assetsChecked: assets.length,
      notificationsSent: notifications.length,
      notifications,
    })
  } catch (error) {
    console.error("Error in target price check cron job:", error)
    return NextResponse.json(
      { error: "Internal server error", message: String(error) },
      { status: 500 }
    )
  }
}
