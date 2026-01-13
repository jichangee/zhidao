import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { calculateNetWorth } from "@/lib/snapshot"

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
    // Get current net worth
    const netWorth = await calculateNetWorth(user.id)

    // Get assets grouped by category
    const assets = await prisma.asset.findMany({
      where: { userId: user.id },
    })

    const categories = assets.reduce((acc, asset) => {
      const value = Number(asset.balance)
      const current = acc[asset.category] || 0
      acc[asset.category] = asset.category === 'LIABILITY' ? current - value : current + value
      return acc
    }, {} as Record<string, number>)

    // Get trend data from snapshots (last 90 days)
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const snapshots = await prisma.snapshot.findMany({
      where: {
        userId: user.id,
        recordDate: {
          gte: ninetyDaysAgo,
        },
      },
      orderBy: {
        recordDate: "asc",
      },
    })

    const trend = snapshots.map((snapshot) => ({
      date: snapshot.recordDate.toISOString().split('T')[0],
      value: Number(snapshot.totalNetWorth),
    }))

    return NextResponse.json({
      netWorth,
      categories,
      trend,
    })
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
