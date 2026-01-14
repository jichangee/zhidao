"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { X, Bell, Save } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsPage() {
  const router = useRouter()
  const [barkKey, setBarkKey] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings")
      if (response.ok) {
        const data = await response.json()
        setBarkKey(data.barkKey || "")
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setMessage(null)

    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ barkKey: barkKey.trim() || null }),
      })

      if (response.ok) {
        setMessage({ type: "success", text: "设置已保存" })
        setTimeout(() => setMessage(null), 3000)
      } else {
        const error = await response.json()
        setMessage({ type: "error", text: error.error || "保存失败" })
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      setMessage({ type: "error", text: "保存失败，请重试" })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white pb-24">
        {/* Header Skeleton */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="w-16 h-6" />
            <div className="w-8" />
          </div>
        </header>

        <div className="px-4 py-6">
          {/* Section Title Skeleton */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Skeleton className="w-5 h-5" />
              <Skeleton className="w-24 h-6" />
            </div>

            {/* Input Field Skeleton */}
            <div className="space-y-4">
              <div>
                <Skeleton className="w-20 h-5 mb-2" />
                <Skeleton className="w-full h-10" />
                <Skeleton className="w-full h-4 mt-2" />
              </div>
            </div>
          </div>

          {/* Button Skeleton */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
            <Skeleton className="w-full h-12" />
          </div>
        </div>
      </div>
    )
  }

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
          <h1 className="text-lg font-semibold text-gray-900">设置</h1>
          <div className="w-8" />
        </div>
      </header>

      <form onSubmit={handleSave} className="px-4 py-6">
        {/* Bark Notification Settings */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">通知设置</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bark Key
              </label>
              <Input
                type="text"
                placeholder="请输入您的Bark Key"
                value={barkKey}
                onChange={(e) => setBarkKey(e.target.value)}
                className="border-gray-200"
              />
              <p className="mt-2 text-xs text-gray-500">
                配置Bark Key后，当资产达到目标价格或目标日期时会收到推送通知
              </p>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-4 p-3 rounded-lg ${
              message.type === "success"
                ? "bg-orange-50 text-orange-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Save Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
          <Button
            type="submit"
            disabled={isSaving}
            className="w-full bg-gray-800 text-white hover:bg-gray-900 h-12 text-base font-medium"
          >
            {isSaving ? (
              "保存中..."
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                保存设置
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
