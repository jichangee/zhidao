export async function sendBarkNotification(
  title: string,
  body: string
): Promise<void> {
  const barkKey = process.env.BARK_KEY
  
  if (!barkKey) {
    console.warn("Bark key not configured, skipping notification")
    return
  }

  try {
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
