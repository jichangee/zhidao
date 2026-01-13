import prisma from "@/lib/prisma"

export async function calculateNetWorth(userId: string): Promise<number> {
  const assets = await prisma.asset.findMany({
    where: { userId },
  })

  const total = assets.reduce((sum, asset) => {
    const value = Number(asset.balance)
    // LIABILITY category should be subtracted
    return asset.category === 'LIABILITY' ? sum - value : sum + value
  }, 0)

  return total
}

export async function updateSnapshot(userId: string): Promise<void> {
  const totalNet = await calculateNetWorth(userId)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  await prisma.snapshot.upsert({
    where: {
      userId_recordDate: {
        userId,
        recordDate: today,
      },
    },
    update: {
      totalNetWorth: totalNet,
    },
    create: {
      userId,
      totalNetWorth: totalNet,
      recordDate: today,
    },
  })
}
