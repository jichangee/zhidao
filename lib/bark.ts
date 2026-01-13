import prisma from "./prisma"

export async function sendBarkNotification(
  userId: string,
  title: string,
  body: string
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { barkKey: true },
    })

    const barkKey = user?.barkKey
    
    if (!barkKey) {
      console.warn("Bark key not configured for user, skipping notification")
      return
    }

    const url = `https://api.day.app/${barkKey}/${encodeURIComponent(
      title
    )}/${encodeURIComponent(body)}?group=AssetMaster`
    
    await fetch(url)
  } catch (error) {
    console.error("Failed to send Bark notification:", error)
    // Don't throw - notifications are non-critical
  }
}

export function shouldNotify(amount: number, threshold: number = 10000): boolean {
  return Math.abs(amount) >= threshold
}
