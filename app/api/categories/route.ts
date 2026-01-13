import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { updateSnapshot } from "@/lib/snapshot"

// GET /api/categories - Get all categories (assetType) for the current user
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
    // Get all assets for the user
    const assets = await prisma.asset.findMany({
      where: { userId: user.id },
      select: { assetType: true },
    })

    // Get unique categories (assetType) from assets
    const categories = Array.from(
      new Set(
        assets
          .map((asset) => asset.assetType)
          .filter((type): type is string => type !== null && type !== undefined)
      )
    )

    return NextResponse.json({ categories })
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/categories - Delete a category and update all assets with that category
export async function DELETE(request: NextRequest) {
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
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")

    if (!category) {
      return NextResponse.json(
        { error: "Category parameter is required" },
        { status: 400 }
      )
    }

    // Cannot delete "全部"
    if (category === "全部") {
      return NextResponse.json(
        { error: "Cannot delete default category" },
        { status: 400 }
      )
    }

    // Update all assets with this category to null (which means "全部")
    await prisma.asset.updateMany({
      where: {
        userId: user.id,
        assetType: category,
      },
      data: {
        assetType: null,
      },
    })

    // Update snapshot asynchronously
    updateSnapshot(user.id).catch((error) => {
      console.error("Failed to update snapshot:", error)
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting category:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
