import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { updateSnapshot } from "@/lib/snapshot"
import { sendBarkNotification, shouldNotify } from "@/lib/bark"

// GET /api/assets - Get all assets for the current user
export async function GET(request: NextRequest) {
  const session = await auth()
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Get user by email
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category")

  const assets = await prisma.asset.findMany({
    where: {
      userId: user.id,
      ...(category && { category }),
    },
    orderBy: {
      updateTime: "desc",
    },
  })

  return NextResponse.json(assets)
}

// POST /api/assets - Create or update an asset
export async function POST(request: NextRequest) {
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
    const body = await request.json()
    const { 
      id, 
      category, 
      name, 
      balance, 
      isHidden,
      purchasePrice,
      purchaseDate,
      status,
      assetType,
      tags,
      targetCostType,
      targetCost,
      targetDate,
      isPinned,
      excludeFromTotal,
      excludeFromDailyAvg,
      notes,
      imageUrl,
      emoji
    } = body

    // Validate required fields
    if (!category || !name || balance === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    let asset
    let oldBalance = 0
    let shouldResetNotification = false

    if (id) {
      // Update existing asset
      const existingAsset = await prisma.asset.findUnique({
        where: { id },
      })

      if (existingAsset) {
        oldBalance = Number(existingAsset.balance)
        
        // Check if target price settings changed - if so, reset notification flag
        const targetCostTypeChanged = targetCostType !== existingAsset.targetCostType
        const targetCostChanged = targetCost !== (existingAsset.targetCost ? Number(existingAsset.targetCost) : null)
        
        if (targetCostTypeChanged || (targetCostType === "按价格" && targetCostChanged)) {
          shouldResetNotification = true
        }
      }

      asset = await prisma.asset.update({
        where: { id },
        data: {
          category,
          name,
          balance,
          isHidden: isHidden ?? false,
          purchasePrice: purchasePrice !== undefined ? purchasePrice : null,
          purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
          status: status || "服役中",
          assetType: assetType || null,
          tags: tags || null,
          targetCostType: targetCostType || null,
          targetCost: targetCost !== undefined ? targetCost : null,
          targetDate: targetDate ? new Date(targetDate) : null,
          isPinned: isPinned ?? false,
          excludeFromTotal: excludeFromTotal ?? false,
          excludeFromDailyAvg: excludeFromDailyAvg ?? false,
          notes: notes || null,
          imageUrl: imageUrl || null,
          emoji: emoji || null,
          // Reset notification flag if target price settings changed
          targetPriceNotified: shouldResetNotification ? false : undefined,
        },
      })
    } else {
      // Create new asset
      asset = await prisma.asset.create({
        data: {
          userId: user.id,
          category,
          name,
          balance,
          isHidden: isHidden ?? false,
          purchasePrice: purchasePrice !== undefined ? purchasePrice : null,
          purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
          status: status || "服役中",
          assetType: assetType || null,
          tags: tags || null,
          targetCostType: targetCostType || null,
          targetCost: targetCost !== undefined ? targetCost : null,
          targetDate: targetDate ? new Date(targetDate) : null,
          isPinned: isPinned ?? false,
          excludeFromTotal: excludeFromTotal ?? false,
          excludeFromDailyAvg: excludeFromDailyAvg ?? false,
          notes: notes || null,
          imageUrl: imageUrl || null,
          emoji: emoji || null,
        },
      })
    }

    // Update snapshot asynchronously
    updateSnapshot(user.id).catch((error) => {
      console.error("Failed to update snapshot:", error)
    })

    // Send Bark notification if change is significant
    const changeAmount = Number(balance) - oldBalance
    if (id && shouldNotify(changeAmount)) {
      sendBarkNotification(
        user.id,
        "资产变动提醒",
        `您更新了${name}，当前余额¥${Number(balance).toLocaleString()}`
      ).catch((error) => {
        console.error("Failed to send notification:", error)
      })
    }

    // Note: Target price notifications are handled by the daily cron job at /api/cron/check-target-price

    return NextResponse.json(asset)
  } catch (error) {
    console.error("Error creating/updating asset:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
