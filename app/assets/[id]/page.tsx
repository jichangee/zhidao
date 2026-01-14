"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { X, Edit2, Trash2, Calendar, Tag, Package, Pin, UserX, BarChart3, ArrowUp, ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"

interface Asset {
  id: string
  name: string
  purchasePrice: number | null
  purchaseDate: string | null
  status: string
  assetType: string | null
  category: string
  imageUrl: string | null
  emoji: string | null
  tags: string | null
  targetCostType: string | null
  targetCost: number | null
  targetDate: string | null
  isPinned: boolean
  excludeFromTotal: boolean
  excludeFromDailyAvg: boolean
  notes: string | null
}

export default function AssetDetailPage() {
  const router = useRouter()
  const params = useParams()
  const assetId = params.id as string
  
  const [asset, setAsset] = useState<Asset | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (assetId) {
      fetchAsset()
    }
  }, [assetId])

  const fetchAsset = async () => {
    try {
      const response = await fetch(`/api/assets/${assetId}`)
      if (response.ok) {
        const data = await response.json()
        setAsset(data)
      } else {
        alert("加载资产失败")
        router.push("/")
      }
    } catch (error) {
      console.error("Error loading asset:", error)
      alert("加载资产失败")
      router.push("/")
    } finally {
      setIsLoading(false)
    }
  }

  const calculateDaysUsed = (purchaseDate: string | null) => {
    if (!purchaseDate) return 0
    const purchase = new Date(purchaseDate)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - purchase.getTime())
    return Math.floor(diffTime / (1000 * 60 * 60 * 24))
  }

  const calculateDailyCost = (price: number | null, daysUsed: number) => {
    if (!price || daysUsed === 0) return 0
    return price / daysUsed
  }

  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "未设置"
    const date = new Date(dateString)
    return date.toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" })
  }

  const calculateDaysToTarget = () => {
    if (!asset || !asset.targetCostType || asset.targetCostType === "不设定") return null

    if (asset.targetCostType === "按日期" && asset.targetDate) {
      const target = new Date(asset.targetDate)
      const now = new Date()
      const diffTime = target.getTime() - now.getTime()
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return days
    }

    if (asset.targetCostType === "按价格" && asset.targetCost && asset.purchasePrice && asset.purchaseDate) {
      const daysUsed = calculateDaysUsed(asset.purchaseDate)
      if (daysUsed === 0) return null
      
      const currentDailyCost = asset.purchasePrice / daysUsed
      const targetDailyCost = asset.targetCost
      
      if (currentDailyCost <= targetDailyCost) {
        return 0 // 已达到目标
      }
      
      // 计算还需要多少天才能达到目标日均成本
      // purchasePrice / (daysUsed + x) = targetCost
      // purchasePrice = targetCost * (daysUsed + x)
      // daysUsed + x = purchasePrice / targetCost
      // x = purchasePrice / targetCost - daysUsed
      const totalDaysNeeded = asset.purchasePrice / targetDailyCost
      const daysRemaining = Math.ceil(totalDaysNeeded - daysUsed)
      return daysRemaining > 0 ? daysRemaining : 0
    }

    return null
  }

  const handleEdit = () => {
    router.push(`/assets/new?id=${assetId}`)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/assets/${assetId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        router.push("/")
      } else {
        const error = await response.json()
        alert(`删除失败: ${error.error || "未知错误"}`)
      }
    } catch (error) {
      console.error("Error deleting asset:", error)
      alert("删除失败，请重试")
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white pb-24">
        {/* Header Skeleton */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="w-24 h-6" />
            <div className="w-8" />
          </div>
        </header>

        <div className="px-4 pb-4">
          {/* Icon Skeleton */}
          <div className="flex justify-center my-6">
            <Skeleton className="w-24 h-24 rounded-xl" />
          </div>

          {/* Title Skeleton */}
          <div className="mb-6 text-center flex justify-center">
            <Skeleton className="h-8 w-48" />
          </div>

          {/* Info Cards Skeleton */}
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-4 h-4 rounded-full" />
                  <Skeleton className="w-16 h-4" />
                </div>
                <Skeleton className="h-16 rounded-lg" />
              </div>
            ))}
          </div>

          {/* Toggle Options Skeleton */}
          <div className="space-y-3 mt-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        </div>

        {/* Action Buttons Skeleton */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
          <div className="flex gap-3">
            <Skeleton className="flex-1 h-12 rounded-md" />
            <Skeleton className="flex-1 h-12 rounded-md" />
          </div>
        </div>
      </div>
    )
  }

  if (!asset) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">资产不存在</div>
      </div>
    )
  }

  const daysUsed = calculateDaysUsed(asset.purchaseDate)
  const dailyCost = calculateDailyCost(asset.purchasePrice, daysUsed)
  const parsedTags = asset.tags ? (() => {
    try {
      return JSON.parse(asset.tags)
    } catch {
      return []
    }
  })() : []

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">资产详情</h1>
          <div className="w-8" />
        </div>
      </header>

      <div className="px-4 pb-4">
        {/* Item Icon */}
        <div className="flex justify-center my-6">
          <div className="w-24 h-24 rounded-xl bg-amber-100 flex items-center justify-center overflow-hidden">
            {asset.emoji ? (
              <span className="text-5xl">{asset.emoji}</span>
            ) : asset.imageUrl ? (
              <img 
                src={asset.imageUrl} 
                alt={asset.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <Package className="w-12 h-12 text-amber-600" />
            )}
          </div>
        </div>

        {/* Item Name */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900">{asset.name}</h2>
        </div>

        {/* Price */}
        {asset.purchasePrice && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center">
                <span className="text-xs text-orange-600">¥</span>
              </div>
              <label className="text-sm font-medium text-gray-700">价格</label>
            </div>
            <div className="p-3 border border-gray-200 rounded-lg">
              <div className="text-lg font-semibold text-gray-900">{formatCurrency(asset.purchasePrice)}</div>
            </div>
          </div>
        )}

        {/* Purchase Date */}
        {asset.purchaseDate && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <label className="text-sm font-medium text-gray-700">购买日期</label>
            </div>
            <div className="p-3 border border-gray-200 rounded-lg">
              <div className="text-sm text-gray-900">{formatDate(asset.purchaseDate)}</div>
              {daysUsed > 0 && (
                <div className="text-xs text-gray-500 mt-1">已使用 {daysUsed} 天</div>
              )}
            </div>
          </div>
        )}

        {/* Daily Cost */}
        {dailyCost > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-gray-500" />
              <label className="text-sm font-medium text-gray-700">日均成本</label>
            </div>
            <div className="p-3 border border-gray-200 rounded-lg">
              <div className="text-lg font-semibold text-gray-900">{formatCurrency(dailyCost)}/天</div>
            </div>
          </div>
        )}

        {/* Category */}
        {asset.assetType && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 rounded-full border-2 border-gray-400"></div>
              <label className="text-sm font-medium text-gray-700">类别</label>
            </div>
            <div className="p-3 border border-gray-200 rounded-lg">
              <div className="text-sm text-gray-900">{asset.assetType}</div>
            </div>
          </div>
        )}

        {/* Tags */}
        {parsedTags.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-4 h-4 text-gray-500" />
              <label className="text-sm font-medium text-gray-700">标签</label>
            </div>
            <div className="p-3 border border-gray-200 rounded-lg">
              <div className="flex flex-wrap gap-2">
                {parsedTags.map((tag: string) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Status */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <label className="text-sm font-medium text-gray-700">状态</label>
          </div>
          <div className="p-3 border border-gray-200 rounded-lg">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              asset.status === "服役中" 
                ? "bg-orange-100 text-orange-700"
                : "bg-gray-100 text-gray-700"
            }`}>
              {asset.status}
            </span>
          </div>
        </div>

        {/* Target Cost */}
        {asset.targetCostType && asset.targetCostType !== "不设定" && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm font-medium text-gray-700">目标成本</label>
            </div>
            <div className="p-3 border border-gray-200 rounded-lg space-y-2">
              {asset.targetCostType === "按价格" && asset.targetCost && (
                <>
                  <div className="text-sm text-gray-900">按价格: {formatCurrency(asset.targetCost)}</div>
                  {(() => {
                    const daysRemaining = calculateDaysToTarget()
                    if (daysRemaining !== null) {
                      if (daysRemaining === 0) {
                        return (
                          <div className="flex items-center gap-1 text-sm text-green-600 font-medium">
                            <span>✓</span>
                            <span>已达到目标</span>
                          </div>
                        )
                      } else {
                        return (
                          <div className="flex items-center gap-1 text-sm">
                            <span className="text-gray-500">距离目标还需</span>
                            <span className="font-semibold text-orange-600">{daysRemaining}</span>
                            <span className="text-gray-500">天</span>
                          </div>
                        )
                      }
                    }
                    return null
                  })()}
                </>
              )}
              {asset.targetCostType === "按日期" && asset.targetDate && (
                <>
                  <div className="text-sm text-gray-900">按日期: {formatDate(asset.targetDate)}</div>
                  {(() => {
                    const daysRemaining = calculateDaysToTarget()
                    if (daysRemaining !== null) {
                      if (daysRemaining <= 0) {
                        return (
                          <div className="flex items-center gap-1 text-sm text-green-600 font-medium">
                            <span>✓</span>
                            <span>已到达目标日期</span>
                          </div>
                        )
                      } else {
                        return (
                          <div className="flex items-center gap-1 text-sm">
                            <span className="text-gray-500">距离目标还剩</span>
                            <span className="font-semibold text-orange-600">{daysRemaining}</span>
                            <span className="text-gray-500">天</span>
                          </div>
                        )
                      }
                    }
                    return null
                  })()}
                </>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {asset.notes && (
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 mb-2 block">备注</label>
            <div className="p-3 border border-gray-200 rounded-lg">
              <div className="text-sm text-gray-900 whitespace-pre-wrap">{asset.notes}</div>
            </div>
          </div>
        )}

        {/* Toggle Options Display */}
        <div className="space-y-3 mb-4">
          {/* Pin to top */}
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Pin className="w-4 h-4 text-gray-500" />
              <label className="text-sm font-medium text-gray-700">置顶</label>
            </div>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
              asset.isPinned ? "bg-orange-500" : "bg-gray-300"
            }`}>
              {asset.isPinned && <span className="text-white text-xs">✓</span>}
            </div>
          </div>

          {/* Exclude from total */}
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2">
              <UserX className="w-4 h-4 text-gray-500" />
              <label className="text-sm font-medium text-gray-700">不计入总资产</label>
            </div>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
              asset.excludeFromTotal ? "bg-orange-500" : "bg-gray-300"
            }`}>
              {asset.excludeFromTotal && <span className="text-white text-xs">✓</span>}
            </div>
          </div>

          {/* Exclude from daily average */}
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-gray-500" />
              <label className="text-sm font-medium text-gray-700">不计入日均</label>
            </div>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
              asset.excludeFromDailyAvg ? "bg-orange-500" : "bg-gray-300"
            }`}>
              {asset.excludeFromDailyAvg && <span className="text-white text-xs">✓</span>}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 safe-area-bottom">
          <div className="flex gap-3">
            <Button
              type="button"
              onClick={handleEdit}
              className="flex-1 bg-gray-800 text-white hover:bg-gray-900 h-12 text-base font-medium"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              编辑
            </Button>
            <Button
              type="button"
              onClick={() => setShowDeleteDialog(true)}
              className="flex-1 bg-red-500 text-white hover:bg-red-600 h-12 text-base font-medium"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              删除
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除资产"{asset.name}"吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button
              type="button"
              onClick={() => setShowDeleteDialog(false)}
              className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              取消
            </Button>
            <Button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 bg-red-500 text-white hover:bg-red-600"
            >
              {isDeleting ? "删除中..." : "删除"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
