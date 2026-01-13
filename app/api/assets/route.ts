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
    const { id, category, name, balance, isHidden } = body

    // Validate required fields
    if (!category || !name || balance === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    let asset
    let oldBalance = 0

    if (id) {
      // Update existing asset
      const existingAsset = await prisma.asset.findUnique({
        where: { id },
      })

      if (existingAsset) {
        oldBalance = Number(existingAsset.balance)
      }

      asset = await prisma.asset.update({
        where: { id },
        data: {
          category,
          name,
          balance,
          isHidden: isHidden ?? false,
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
        "资产变动提醒",
        `您更新了${name}，当前余额¥${Number(balance).toLocaleString()}`
      ).catch((error) => {
        console.error("Failed to send notification:", error)
      })
    }

    return NextResponse.json(asset)
  } catch (error) {
    console.error("Error creating/updating asset:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
