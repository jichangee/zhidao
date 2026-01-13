"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, ChevronDown, ArrowUpDown, Filter, CheckSquare, Home, Heart, Circle, Settings, Plus, Package } from "lucide-react"
import { Button } from "@/components/ui/button"

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

export default function Dashboard() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState("全部")
  const [selectedStatus, setSelectedStatus] = useState("全部")

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

  const filteredAssets = data?.assets.filter((asset) => {
    const categoryMatch = selectedCategory === "全部" || asset.assetType === selectedCategory
    const statusMatch = selectedStatus === "全部" || asset.status === selectedStatus
    return categoryMatch && statusMatch
  }) || []

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </div>
    )
  }

  const totalAssets = data?.totalAssets || 0
  const dailyAverageCost = data?.dailyAverageCost || 0
  const statusCounts = data?.statusCounts || { active: 0, retired: 0, sold: 0 }
  const totalCount = statusCounts.active + statusCounts.retired + statusCounts.sold

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with orange gradient */}
      <header className="bg-gradient-to-br from-orange-400 to-orange-500 pt-12 pb-6 px-4">
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
          <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="absolute left-0 top-0 h-full bg-orange-500"
              style={{ width: `${totalCount > 0 ? (statusCounts.active / totalCount) * 100 : 0}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-between px-3 text-xs font-medium">
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
      <main className="px-4 pt-4">
        {/* Category Tabs */}
        <div className="flex gap-6 mb-4 border-b border-gray-200">
          {["全部", ...(data?.categories || [])].map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`pb-2 px-1 text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? "text-orange-600 border-b-2 border-orange-600"
                  : "text-gray-500"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

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
          <div className="flex items-center gap-2 ml-auto">
            <ArrowUpDown className="w-4 h-4 text-gray-500" />
            <Filter className="w-4 h-4 text-gray-500" />
            <CheckSquare className="w-4 h-4 text-gray-500" />
          </div>
        </div>

        {/* Asset Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {filteredAssets.map((asset) => {
            const daysUsed = calculateDaysUsed(asset.purchaseDate)
            const dailyCost = calculateDailyCost(asset.purchasePrice, daysUsed)
            const statusColors = {
              "服役中": "bg-orange-100 text-orange-700",
              "已退役": "bg-gray-100 text-gray-700",
              "已卖出": "bg-gray-100 text-gray-700",
            }

            return (
              <div
                key={asset.id}
                onClick={() => router.push(`/assets/${asset.id}`)}
                className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
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
                
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">{asset.name}</h3>
                
                {asset.purchasePrice && (
                  <div className="text-xs text-gray-600 mb-1">
                    {formatCurrency(asset.purchasePrice)} | 已使用{daysUsed}天
                  </div>
                )}
                
                {dailyCost > 0 && (
                  <div className="text-xs font-medium text-gray-900">
                    {formatCurrency(dailyCost)}/天
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {filteredAssets.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>暂无资产</p>
          </div>
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex items-center justify-around max-w-md mx-auto">
          <button className="flex flex-col items-center gap-1 p-2">
            <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
              <Home className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs text-gray-900">首页</span>
          </button>
          <button className="flex flex-col items-center gap-1 p-2">
            <Heart className="w-6 h-6 text-gray-400" />
          </button>
          <button className="flex flex-col items-center gap-1 p-2">
            <Circle className="w-6 h-6 text-gray-400" />
          </button>
          <button 
            onClick={() => router.push("/settings")}
            className="flex flex-col items-center gap-1 p-2"
          >
            <Settings className="w-6 h-6 text-gray-400" />
          </button>
          <button 
            onClick={() => router.push("/assets/new")}
            className="flex flex-col items-center gap-1 p-2"
          >
            <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center shadow-lg">
              <Plus className="w-6 h-6 text-white" />
            </div>
          </button>
        </div>
      </nav>
    </div>
  )
}
