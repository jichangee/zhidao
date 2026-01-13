import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { updateSnapshot } from "@/lib/snapshot"

// GET /api/assets/[id] - Get a specific asset
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params

    // Verify the asset belongs to the user
    const asset = await prisma.asset.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 })
    }

    return NextResponse.json(asset)
  } catch (error) {
    console.error("Error fetching asset:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH /api/assets/[id] - Update a specific asset
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params
    const body = await request.json()

    // Verify the asset belongs to the user
    const existingAsset = await prisma.asset.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!existingAsset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 })
    }

    const asset = await prisma.asset.update({
      where: { id },
      data: body,
    })

    // Update snapshot asynchronously
    updateSnapshot(user.id).catch((error) => {
      console.error("Failed to update snapshot:", error)
    })

    return NextResponse.json(asset)
  } catch (error) {
    console.error("Error updating asset:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/assets/[id] - Delete a specific asset
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params

    // Verify the asset belongs to the user
    const existingAsset = await prisma.asset.findFirst({
      where: {
        id,
        userId: user.id,
      },
    })

    if (!existingAsset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 })
    }

    await prisma.asset.delete({
      where: { id },
    })

    // Update snapshot asynchronously
    updateSnapshot(user.id).catch((error) => {
      console.error("Failed to update snapshot:", error)
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting asset:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
