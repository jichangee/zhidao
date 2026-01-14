"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, ChevronDown, ArrowUpDown, Filter, CheckSquare, Home, Heart, Circle, Settings, Plus, Package, ArrowUp, ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
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
}

interface DashboardData {
  totalAssets: number
  dailyAverageCost: number
  assets: Asset[]
  statusCounts: {
    active: number
    retired: number
    sold: number
  }
  categories: string[]
}

type SortField = "name" | "price" | "date" | "dailyCost" | "none"
type SortOrder = "asc" | "desc"

export default function Dashboard() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState("全部")
  const [selectedStatus, setSelectedStatus] = useState("全部")
  const [sortField, setSortField] = useState<SortField>("dailyCost")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      const response = await fetch("/api/dashboard")
      if (response.ok) {
        const dashboardData = await response.json()
        setData(dashboardData)
      }
    } catch (error) {
      console.error("Failed to fetch dashboard:", error)
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

  const handleSortClick = () => {
    // 循环切换排序方式：none -> name asc -> name desc -> price asc -> price desc -> date asc -> date desc -> dailyCost asc -> dailyCost desc -> none
    const sortSequence: Array<{ field: SortField; order: SortOrder }> = [
      { field: "none", order: "asc" },
      { field: "name", order: "asc" },
      { field: "name", order: "desc" },
      { field: "price", order: "asc" },
      { field: "price", order: "desc" },
      { field: "date", order: "asc" },
      { field: "date", order: "desc" },
      { field: "dailyCost", order: "asc" },
      { field: "dailyCost", order: "desc" },
    ]
    
    const currentIndex = sortSequence.findIndex(
      (s) => s.field === sortField && s.order === sortOrder
    )
    const nextIndex = (currentIndex + 1) % sortSequence.length
    const nextSort = sortSequence[nextIndex]
    
    setSortField(nextSort.field)
    setSortOrder(nextSort.order)
  }

  const filteredAssets = data?.assets.filter((asset) => {
    const categoryMatch = selectedCategory === "全部" || asset.assetType === selectedCategory
    const statusMatch = selectedStatus === "全部" || asset.status === selectedStatus
    return categoryMatch && statusMatch
  }) || []

  // 排序逻辑
  const sortedAssets = [...filteredAssets].sort((a, b) => {
    if (sortField === "none") return 0

    let comparison = 0

    switch (sortField) {
      case "name":
        comparison = (a.name || "").localeCompare(b.name || "", "zh-CN")
        break
      case "price":
        const priceA = a.purchasePrice || 0
        const priceB = b.purchasePrice || 0
        comparison = priceA - priceB
        break
      case "date":
        const dateA = a.purchaseDate ? new Date(a.purchaseDate).getTime() : 0
        const dateB = b.purchaseDate ? new Date(b.purchaseDate).getTime() : 0
        comparison = dateA - dateB
        break
      case "dailyCost":
        const daysA = calculateDaysUsed(a.purchaseDate)
        const daysB = calculateDaysUsed(b.purchaseDate)
        const dailyCostA = calculateDailyCost(a.purchasePrice, daysA)
        const dailyCostB = calculateDailyCost(b.purchasePrice, daysB)
        comparison = dailyCostA - dailyCostB
        break
    }

    return sortOrder === "asc" ? comparison : -comparison
  })

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ background: '#fb923c' }}>
        {/* Header Skeleton */}
        <header className="pt-12 pb-6 px-4">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-9 w-20 bg-orange-300/50" />
          </div>

          {/* Asset Overview Card Skeleton */}
          <div className="bg-white rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Skeleton className="h-3 w-12 mb-2" />
                <Skeleton className="h-8 w-24" />
              </div>
              <div>
                <Skeleton className="h-3 w-16 mb-2" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>

            {/* Progress Bar Skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-3 w-full" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-16" />
                <div className="flex gap-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Skeleton */}
        <main className="px-4 pt-4 pb-24 bg-gray-50 min-h-screen">
          {/* Tabs Skeleton */}
          <div className="mb-4">
            <div className="flex gap-2 mb-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-9 w-16" />
              ))}
            </div>

            {/* Status Filter Buttons Skeleton */}
            <div className="flex items-center gap-2 mb-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-7 w-16 rounded-full" />
              ))}
            </div>

            {/* Asset Grid Skeleton */}
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="p-3">
                  <CardHeader className="p-0 gap-2">
                    <div className="flex items-start justify-between">
                      <Skeleton className="w-10 h-10 rounded-lg" />
                      <Skeleton className="h-5 w-14 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent className="p-0 space-y-1 mt-3">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-20" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>

        {/* Bottom Navigation Skeleton */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
          <div className="flex items-center justify-center gap-16 max-w-md mx-auto py-2">
            <div className="flex flex-col items-center gap-1.5 p-2">
              <Skeleton className="w-9 h-9 rounded-full" />
              <Skeleton className="h-3 w-8" />
            </div>
            <div className="flex flex-col items-center gap-1.5 p-2">
              <Skeleton className="w-6 h-6 rounded" />
              <Skeleton className="h-3 w-8" />
            </div>
          </div>
        </nav>

        {/* Floating Button Skeleton */}
        <Skeleton className="fixed bottom-24 right-6 w-14 h-14 rounded-full" />
      </div>
    )
  }

  const totalAssets = data?.totalAssets || 0
  const dailyAverageCost = data?.dailyAverageCost || 0
  const statusCounts = data?.statusCounts || { active: 0, retired: 0, sold: 0 }
  const totalCount = statusCounts.active + statusCounts.retired + statusCounts.sold

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom right, #fb923c, #f97316)' }}>
      {/* Header with orange gradient */}
      <header className="pt-12 pb-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">值道</h1>

        </div>

        {/* Asset Overview Card */}
        <div className="bg-white rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-600">资产总览</span>
            <span className="text-sm font-medium text-gray-600">{totalCount}/{totalCount}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">总资产</div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalAssets)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">日均成本</div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(dailyAverageCost)}</div>
            </div>
          </div>

          {/* Status Progress Bar */}
          <div className="space-y-2">
            <Progress 
              value={totalCount > 0 ? (statusCounts.active / totalCount) * 100 : 0}
              className="h-3 bg-gray-200"
            />
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-orange-700">服役中 {statusCounts.active}</span>
              <div className="flex gap-2">
                <span className="text-gray-600">已退役 {statusCounts.retired}</span>
                <span className="text-gray-600">已卖出 {statusCounts.sold}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 pt-4 pb-24 bg-gray-50 min-h-screen">
        {/* Category and Status Filters using Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-4">
          <TabsList className="w-full justify-start overflow-x-auto">
            {["全部", ...(data?.categories || [])].map((category) => (
              <TabsTrigger key={category} value={category}>
                {category}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-4">
            {/* Status Filter Buttons */}
            <div className="flex items-center gap-2 mb-4">
              {["全部", "服役中", "已退役", "已卖出"].map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    selectedStatus === status
                      ? "bg-gray-800 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {status}
                </button>
              ))}
              <button
                onClick={handleSortClick}
                className="flex items-center gap-1 ml-auto px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                title={
                  sortField === "none" ? "排序" :
                  sortField === "name" ? `按名称${sortOrder === "asc" ? "升序" : "降序"}` :
                  sortField === "price" ? `按价格${sortOrder === "asc" ? "升序" : "降序"}` :
                  sortField === "date" ? `按购买日期${sortOrder === "asc" ? "升序" : "降序"}` :
                  sortField === "dailyCost" ? `按日均成本${sortOrder === "asc" ? "升序" : "降序"}` :
                  "排序"
                }
              >
                {sortField === "none" ? (
                  <ArrowUpDown className="w-4 h-4 text-gray-500" />
                ) : sortOrder === "asc" ? (
                  <ArrowUp className="w-4 h-4 text-orange-600" />
                ) : (
                  <ArrowDown className="w-4 h-4 text-orange-600" />
                )}
                {sortField !== "none" && (
                  <span className="text-xs text-gray-600">
                    {sortField === "name" ? "名称" :
                     sortField === "price" ? "价格" :
                     sortField === "date" ? "日期" :
                     sortField === "dailyCost" ? "日均" : ""}
                  </span>
                )}
              </button>
            </div>

            {/* Asset Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {sortedAssets.map((asset) => {
                const daysUsed = calculateDaysUsed(asset.purchaseDate)
                const dailyCost = calculateDailyCost(asset.purchasePrice, daysUsed)
                const statusColors = {
                  "服役中": "bg-orange-100 text-orange-700",
                  "已退役": "bg-gray-100 text-gray-700",
                  "已卖出": "bg-gray-100 text-gray-700",
                }

                return (
                  <Card
                    key={asset.id}
                    onClick={() => router.push(`/assets/${asset.id}`)}
                    className="cursor-pointer hover:shadow-md transition-shadow p-3 gap-3"
                  >
                    <CardHeader className="p-0 gap-2">
                      <div className="flex items-start justify-between">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center overflow-hidden">
                          {asset.emoji ? (
                            <span className="text-2xl">{asset.emoji}</span>
                          ) : asset.imageUrl ? (
                            <img 
                              src={asset.imageUrl} 
                              alt={asset.name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-5 h-5 text-amber-600" />
                          )}
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          statusColors[asset.status as keyof typeof statusColors] || "bg-gray-100 text-gray-700"
                        }`}>
                          {asset.status}
                        </span>
                      </div>
                      <CardTitle className="text-sm">{asset.name}</CardTitle>
                    </CardHeader>
                    
                    <CardContent className="p-0 space-y-1">
                      {asset.purchasePrice && (
                        <div className="text-xs text-gray-600">
                          {formatCurrency(asset.purchasePrice)} | 已使用{daysUsed}天
                        </div>
                      )}
                      
                      {dailyCost > 0 && (
                        <div className="text-xs font-medium text-gray-900">
                          {formatCurrency(dailyCost)}/天
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {filteredAssets.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>暂无资产</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom">
        <div className="flex items-center justify-center gap-16 max-w-md mx-auto py-2">
          <button className="flex flex-col items-center gap-1.5 p-2 min-w-[60px]">
            <div className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-900">首页</span>
          </button>
          <button 
            onClick={() => router.push("/settings")}
            className="flex flex-col items-center gap-1.5 p-2 min-w-[60px]"
          >
            <Settings className="w-6 h-6 text-gray-400" />
            <span className="text-xs font-medium text-gray-500">设置</span>
          </button>
        </div>
      </nav>

      {/* Floating Add Asset Button */}
      <button
        onClick={() => router.push("/assets/new")}
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center shadow-lg hover:shadow-xl hover:bg-gray-900 transition-all z-50 active:scale-95"
        aria-label="新增资产"
      >
        <Plus className="w-7 h-7 text-white" />
      </button>
    </div>
  )
}
