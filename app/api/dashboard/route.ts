import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const session = await auth()
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  try {
    // Get all assets
    const assets = await prisma.asset.findMany({
      where: { userId: user.id },
      orderBy: {
        updateTime: "desc",
      },
    })

    // Calculate total assets (sum of purchase prices for active assets)
    const totalAssets = assets
      .filter((asset) => asset.status === "服役中" && asset.purchasePrice)
      .reduce((sum, asset) => sum + Number(asset.purchasePrice || 0), 0)

    // Calculate daily average cost (sum of all active assets' daily costs)
    const now = new Date()
    let totalDailyCost = 0

    assets.forEach((asset) => {
      if (asset.status === "服役中" && asset.purchasePrice && asset.purchaseDate) {
        const purchaseDate = new Date(asset.purchaseDate)
        const daysUsed = Math.max(1, Math.floor((now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24)))
        const dailyCost = Number(asset.purchasePrice) / daysUsed
        totalDailyCost += dailyCost
      }
    })

    const dailyAverageCost = totalDailyCost

    // Count assets by status
    const statusCounts = {
      active: assets.filter((asset) => asset.status === "服役中").length,
      retired: assets.filter((asset) => asset.status === "已退役").length,
      sold: assets.filter((asset) => asset.status === "已卖出").length,
    }

    // Get unique categories (assetType) from assets
    const categories = Array.from(
      new Set(
        assets
          .map((asset) => asset.assetType)
          .filter((type): type is string => type !== null && type !== undefined)
      )
    )

    // Format assets for frontend
    const formattedAssets = assets.map((asset) => ({
      id: asset.id,
      name: asset.name,
      purchasePrice: asset.purchasePrice ? Number(asset.purchasePrice) : null,
      purchaseDate: asset.purchaseDate ? asset.purchaseDate.toISOString() : null,
      status: asset.status,
      assetType: asset.assetType,
      category: asset.category,
      imageUrl: asset.imageUrl,
      emoji: asset.emoji,
      targetCostType: asset.targetCostType,
      targetCost: asset.targetCost ? Number(asset.targetCost) : null,
      targetDate: asset.targetDate ? asset.targetDate.toISOString() : null,
    }))

    return NextResponse.json({
      totalAssets,
      dailyAverageCost,
      assets: formattedAssets,
      statusCounts,
      categories,
    })
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
