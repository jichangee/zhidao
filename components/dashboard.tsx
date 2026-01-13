"use client"

import { useEffect, useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DashboardData {
  netWorth: number
  categories: Record<string, number>
  trend: Array<{ date: string; value: number }>
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isPrivacyMode, setIsPrivacyMode] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

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

  const formatCurrency = (amount: number) => {
    if (isPrivacyMode) {
      return "¥***,***"
    }
    return `¥${amount.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const getCategoryName = (category: string) => {
    const names: Record<string, string> = {
      CASH: "现金",
      INVEST: "投资",
      PROPERTY: "房产",
      LIABILITY: "负债",
    }
    return names[category] || category
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">加载中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Privacy Toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          资产概览
        </h2>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsPrivacyMode(!isPrivacyMode)}
          title={isPrivacyMode ? "显示金额" : "隐藏金额"}
        >
          {isPrivacyMode ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Net Worth Card */}
      <div className="rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 p-6 text-white shadow-lg">
        <h3 className="text-sm font-medium opacity-90">净资产总额</h3>
        <p className="mt-2 text-4xl font-bold">
          {formatCurrency(data?.netWorth || 0)}
        </p>
      </div>

      {/* Category Breakdown */}
      {data && Object.keys(data.categories).length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(data.categories).map(([category, value]) => (
            <div
              key={category}
              className="rounded-lg bg-white p-4 shadow dark:bg-gray-900"
            >
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {getCategoryName(category)}
              </h4>
              <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(value)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Placeholder for trend chart */}
      {data && data.trend.length > 0 && (
        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-900">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            资产趋势
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            最近 {data.trend.length} 天的数据
          </p>
          {/* Trend chart will be added later with recharts */}
        </div>
      )}
    </div>
  )
}
