"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { X, Edit2, Calendar, Tag, Image as ImageIcon, ChevronRight, Package, Pin, UserX, BarChart3, ArrowUp, ArrowDown, Plus, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldGroup,
  FieldContent,
} from "@/components/ui/field"

const DEFAULT_CATEGORIES = ["全部"]
const DEFAULT_TAGS: string[] = []

export default function NewAssetPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const assetId = searchParams.get("id")
  const isEditMode = !!assetId
  
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES)
  const [tags, setTags] = useState<string[]>(DEFAULT_TAGS)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [showTagDialog, setShowTagDialog] = useState(false)
  const [newCategory, setNewCategory] = useState("")
  const [newTag, setNewTag] = useState("")
  
  const [formData, setFormData] = useState({
    name: "",
    purchasePrice: "",
    purchaseDate: new Date().toISOString().split('T')[0],
    category: "全部",
    tags: "",
    targetCostType: "不设定",
    targetCost: "",
    targetDate: "",
    isPinned: false,
    excludeFromTotal: false,
    excludeFromDailyAvg: false,
    status: "服役中",
    notes: "",
    imageUrl: "",
    emoji: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showImageDialog, setShowImageDialog] = useState(false)
  const [imageTab, setImageTab] = useState<"upload" | "emoji">("upload")
  const [isUploading, setIsUploading] = useState(false)

  // Load categories from API
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) {
          setCategories(["全部", ...data.categories])
        }
      })
      .catch((error) => {
        console.error("Error loading categories:", error)
      })
  }, [])

  // Load asset data when in edit mode
  useEffect(() => {
    if (assetId) {
      setIsLoading(true)
      fetch(`/api/assets/${assetId}`)
        .then((res) => res.json())
        .then((asset) => {
          if (asset.error) {
            alert("加载资产失败")
            router.push("/")
            return
          }
          
          // Parse tags
          let parsedTags: string[] = []
          if (asset.tags) {
            try {
              parsedTags = JSON.parse(asset.tags)
            } catch (e) {
              parsedTags = []
            }
          }
          setSelectedTags(parsedTags)
          
          // Update tags list if needed
          setTags((prev) => {
            const newTags = [...prev]
            parsedTags.forEach((tag) => {
              if (!newTags.includes(tag)) {
                newTags.push(tag)
              }
            })
            return newTags
          })
          
          // Format purchase date
          const purchaseDate = asset.purchaseDate 
            ? new Date(asset.purchaseDate).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0]
          
          // Format target date
          const targetDate = asset.targetDate
            ? new Date(asset.targetDate).toISOString().split('T')[0]
            : ""
          
          setFormData({
            name: asset.name || "",
            purchasePrice: asset.purchasePrice ? String(asset.purchasePrice) : "",
            purchaseDate: purchaseDate,
            category: asset.category === "PROPERTY" ? "全部" : (asset.assetType || "全部"),
            tags: "",
            targetCostType: asset.targetCostType || "不设定",
            targetCost: asset.targetCost ? String(asset.targetCost) : "",
            targetDate: targetDate,
            isPinned: asset.isPinned || false,
            excludeFromTotal: asset.excludeFromTotal || false,
            excludeFromDailyAvg: asset.excludeFromDailyAvg || false,
            status: asset.status || "服役中",
            notes: asset.notes || "",
            imageUrl: asset.imageUrl || "",
            emoji: asset.emoji || "",
          })
        })
        .catch((error) => {
          console.error("Error loading asset:", error)
          alert("加载资产失败")
          router.push("/")
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [assetId, router])

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleToggle = (field: string) => {
    setFormData((prev) => ({ ...prev, [field]: !prev[field as keyof typeof prev] }))
  }

  const handleStatusChange = (status: string) => {
    setFormData((prev) => ({ ...prev, status }))
  }

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()])
      setNewCategory("")
    }
  }

  const handleDeleteCategory = async (category: string) => {
    // Cannot delete "全部"
    if (category === "全部") {
      return
    }

    if (!confirm(`确定要删除分类"${category}"吗？该分类下的资产将归类到"全部"。`)) {
      return
    }

    try {
      const response = await fetch(`/api/categories?category=${encodeURIComponent(category)}`, {
        method: "DELETE",
      })

      if (response.ok) {
        // Remove category from local state
        setCategories(categories.filter((c) => c !== category))
        
        // If the deleted category was selected, reset to "全部"
        if (formData.category === category) {
          handleInputChange("category", "全部")
        }
      } else {
        const error = await response.json()
        alert(`删除失败: ${error.error || "未知错误"}`)
      }
    } catch (error) {
      console.error("Error deleting category:", error)
      alert("删除失败，请重试")
    }
  }

  const handleSelectCategory = (category: string) => {
    handleInputChange("category", category)
    setShowCategoryDialog(false)
  }

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag("")
    }
  }

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag))
    } else {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/assets/upload", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        handleInputChange("imageUrl", data.url)
        handleInputChange("emoji", "")
        setShowImageDialog(false)
      } else {
        alert("图片上传失败")
      }
    } catch (error) {
      console.error("Error uploading image:", error)
      alert("图片上传失败，请重试")
    } finally {
      setIsUploading(false)
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    handleInputChange("emoji", emoji)
    handleInputChange("imageUrl", "")
    setShowImageDialog(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const payload = {
        ...(isEditMode && { id: assetId }),
        name: formData.name,
        category: formData.category === "全部" ? "PROPERTY" : formData.category,
        balance: formData.purchasePrice ? parseFloat(formData.purchasePrice) : 0,
        purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : null,
        purchaseDate: formData.purchaseDate || null,
        status: formData.status,
        assetType: formData.category === "全部" ? null : formData.category,
        tags: selectedTags.length > 0 ? JSON.stringify(selectedTags) : null,
        targetCostType: formData.targetCostType !== "不设定" ? formData.targetCostType : null,
        targetCost: formData.targetCost && formData.targetCostType === "按价格" ? parseFloat(formData.targetCost) : null,
        targetDate: formData.targetDate && formData.targetCostType === "按日期" ? formData.targetDate : null,
        isPinned: formData.isPinned,
        excludeFromTotal: formData.excludeFromTotal,
        excludeFromDailyAvg: formData.excludeFromDailyAvg,
        notes: formData.notes || null,
        imageUrl: formData.imageUrl || null,
        emoji: formData.emoji || null,
      }

      const response = await fetch("/api/assets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        // Refresh categories after saving
        fetch("/api/categories")
          .then((res) => res.json())
          .then((data) => {
            if (data.categories) {
              setCategories(["全部", ...data.categories])
            }
          })
          .catch((error) => {
            console.error("Error refreshing categories:", error)
          })
        
        router.push("/")
      } else {
        const error = await response.json()
        alert(`保存失败: ${error.error || "未知错误"}`)
      }
    } catch (error) {
      console.error("Error saving asset:", error)
      alert("保存失败，请重试")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white pb-24">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="h-6 w-24" />
            <div className="w-8" />
          </div>
        </header>

        <div className="px-4 pb-4">
          {/* Item Icon */}
          <div className="flex justify-center my-6">
            <Skeleton className="w-24 h-24 rounded-xl" />
          </div>

          {/* Item Name */}
          <div className="mb-4">
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Price */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="w-5 h-5 rounded-full" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>

          {/* Purchase Date */}
          <div className="mb-4">
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>

          {/* Category */}
          <div className="mb-4">
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>

          {/* Tags */}
          <div className="mb-4">
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>

          {/* Target Cost */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="w-5 h-5 rounded-full" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <Skeleton className="h-9 rounded-lg" />
              <Skeleton className="h-9 rounded-lg" />
              <Skeleton className="h-9 rounded-lg" />
            </div>
          </div>

          {/* Notes */}
          <div className="mb-4">
            <Skeleton className="h-4 w-16 mb-2" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>

          {/* Toggle Options */}
          <div className="space-y-3 mb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>

          {/* Save Button */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
            <Skeleton className="h-12 w-full rounded-lg" />
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
          <h1 className="text-lg font-semibold text-gray-900">{isEditMode ? "编辑资产" : "添加资产"}</h1>
          <div className="w-8" />
        </div>
      </header>

      <form onSubmit={handleSubmit} className="px-4 pb-4">
        {/* Item Icon */}
        <div className="flex justify-center my-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-xl bg-amber-100 flex items-center justify-center overflow-hidden">
              {formData.emoji ? (
                <span className="text-5xl">{formData.emoji}</span>
              ) : formData.imageUrl ? (
                <img 
                  src={formData.imageUrl} 
                  alt="Asset" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package className="w-12 h-12 text-amber-600" />
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowImageDialog(true)}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center shadow-lg"
            >
              <Edit2 className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Item Name */}
        <div className="mb-4">
          <Input
            type="text"
            placeholder="请输入物品名称"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            className="text-center text-lg border-0 border-b-2 border-gray-200 rounded-none focus:border-orange-500 focus-visible:ring-0"
            required
          />
        </div>

        {/* Basic Information Card */}
        <Card className="mb-4 border-gray-200">
          <CardContent className="py-4">
            <FieldGroup>
              {/* Price */}
              <Field>
                <FieldLabel htmlFor="purchasePrice">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center">
                      <span className="text-xs text-orange-600">*</span>
                    </div>
                    <span>价格</span>
                  </div>
                </FieldLabel>
                <FieldContent>
                  <FieldDescription>请输入购买物品的实际价格</FieldDescription>
                  <Input
                    id="purchasePrice"
                    type="number"
                    step="0.01"
                    placeholder="请输入物品价格"
                    value={formData.purchasePrice}
                    onChange={(e) => handleInputChange("purchasePrice", e.target.value)}
                    className="border-gray-200"
                    required
                  />
                </FieldContent>
              </Field>

              {/* Purchase Date */}
              <Field orientation="horizontal">
                <FieldLabel htmlFor="purchaseDate">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span>购买日期</span>
                  </div>
                </FieldLabel>
                <div className="flex items-center gap-2">
                  <input
                    id="purchaseDate"
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => handleInputChange("purchaseDate", e.target.value)}
                    className="text-sm text-gray-700 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </Field>

              {/* Category */}
              <Field orientation="horizontal">
                <FieldLabel>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-gray-400"></div>
                    <span>类别</span>
                  </div>
                </FieldLabel>
                <button
                  type="button"
                  onClick={() => setShowCategoryDialog(true)}
                  className="flex items-center gap-2 hover:text-orange-600 transition-colors"
                >
                  <span className="text-sm text-gray-700">{formData.category}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </Field>

              {/* Tags */}
              <Field orientation="horizontal">
                <FieldLabel>
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-gray-500" />
                    <span>标签</span>
                  </div>
                </FieldLabel>
                <button
                  type="button"
                  onClick={() => setShowTagDialog(true)}
                  className="flex items-center gap-2 hover:text-orange-600 transition-colors"
                >
                  {selectedTags.length > 0 ? (
                    <span className="text-sm text-gray-700">{selectedTags.length}个标签</span>
                  ) : (
                    <span className="text-sm text-gray-400">未选择</span>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        {/* Target Cost Card */}
        <Card className="mb-4 border-gray-200">
          <CardContent className="py-4">
            <Field>
              <FieldLabel>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center">
                    <span className="text-xs text-orange-600">*</span>
                  </div>
                  <span>目标成本</span>
                </div>
              </FieldLabel>
              <FieldContent>
                <FieldDescription>
                  设置物品的目标成本，用于计算性价比和回本进度
                </FieldDescription>
                <div className="grid grid-cols-3 gap-2">
                  {["不设定", "按价格", "按日期"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleInputChange("targetCostType", type)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        formData.targetCostType === type
                          ? "bg-gray-800 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                
                {formData.targetCostType === "按价格" && (
                  <div className="mt-3">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="请输入目标价格"
                      value={formData.targetCost}
                      onChange={(e) => handleInputChange("targetCost", e.target.value)}
                      className="border-gray-200"
                    />
                  </div>
                )}
                
                {formData.targetCostType === "按日期" && (
                  <div className="mt-3">
                    <Input
                      type="date"
                      value={formData.targetDate}
                      onChange={(e) => handleInputChange("targetDate", e.target.value)}
                      className="border-gray-200"
                    />
                  </div>
                )}
              </FieldContent>
            </Field>
          </CardContent>
        </Card>

        {/* Notes Card */}
        <Card className="mb-4 border-gray-200">
          <CardContent className="py-4">
            <Field>
              <FieldLabel htmlFor="notes">备注信息</FieldLabel>
              <FieldContent>
                <FieldDescription>
                  添加关于此物品的额外信息或备注
                </FieldDescription>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="添加备注信息..."
                  className="h-32 resize-none border-gray-200"
                />
              </FieldContent>
            </Field>
          </CardContent>
        </Card>

        {/* Toggle Options */}
        <Card className="mb-4 border-gray-200">
          <CardContent className="py-4">
            <FieldGroup>
              {/* Pin to top */}
              <Field orientation="horizontal">
                <FieldLabel htmlFor="isPinned">
                  <div className="flex items-center gap-2">
                    <Pin className="w-4 h-4 text-gray-500" />
                    <span>置顶</span>
                  </div>
                </FieldLabel>
                <FieldContent>
                  <FieldDescription>在资产列表中优先显示此物品</FieldDescription>
                </FieldContent>
                <Switch
                  id="isPinned"
                  checked={formData.isPinned}
                  onCheckedChange={() => handleToggle("isPinned")}
                  className="data-[state=checked]:bg-orange-500"
                />
              </Field>

              {/* Exclude from total */}
              <Field orientation="horizontal">
                <FieldLabel htmlFor="excludeFromTotal">
                  <div className="flex items-center gap-2">
                    <UserX className="w-4 h-4 text-gray-500" />
                    <span>不计入总资产</span>
                  </div>
                </FieldLabel>
                <FieldContent>
                  <FieldDescription>此物品不会计入总资产统计</FieldDescription>
                </FieldContent>
                <Switch
                  id="excludeFromTotal"
                  checked={formData.excludeFromTotal}
                  onCheckedChange={() => handleToggle("excludeFromTotal")}
                  className="data-[state=checked]:bg-orange-500"
                />
              </Field>

              {/* Exclude from daily average */}
              <Field orientation="horizontal">
                <FieldLabel htmlFor="excludeFromDailyAvg">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-gray-500" />
                    <span>不计入日均</span>
                  </div>
                </FieldLabel>
                <FieldContent>
                  <FieldDescription>此物品不会计入日均成本统计</FieldDescription>
                </FieldContent>
                <Switch
                  id="excludeFromDailyAvg"
                  checked={formData.excludeFromDailyAvg}
                  onCheckedChange={() => handleToggle("excludeFromDailyAvg")}
                  className="data-[state=checked]:bg-orange-500"
                />
              </Field>

              {/* Retired */}
              <Field orientation="horizontal">
                <FieldLabel htmlFor="retired">
                  <div className="flex items-center gap-2">
                    <ArrowUp className="w-4 h-4 text-gray-500" />
                    <span>已退役</span>
                  </div>
                </FieldLabel>
                <FieldContent>
                  <FieldDescription>标记为不再使用的物品</FieldDescription>
                </FieldContent>
                <Switch
                  id="retired"
                  checked={formData.status === "已退役"}
                  onCheckedChange={() => {
                    if (formData.status === "已退役") {
                      handleStatusChange("服役中")
                    } else {
                      handleStatusChange("已退役")
                    }
                  }}
                  className="data-[state=checked]:bg-orange-500"
                />
              </Field>

              {/* Sold */}
              <Field orientation="horizontal">
                <FieldLabel htmlFor="sold">
                  <div className="flex items-center gap-2">
                    <ArrowDown className="w-4 h-4 text-gray-500" />
                    <span>已卖出</span>
                  </div>
                </FieldLabel>
                <FieldContent>
                  <FieldDescription>标记为已经卖出的物品</FieldDescription>
                </FieldContent>
                <Switch
                  id="sold"
                  checked={formData.status === "已卖出"}
                  onCheckedChange={() => {
                    if (formData.status === "已卖出") {
                      handleStatusChange("服役中")
                    } else {
                      handleStatusChange("已卖出")
                    }
                  }}
                  className="data-[state=checked]:bg-orange-500"
                />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
          <Button
            type="submit"
            disabled={isSubmitting || !formData.name || !formData.purchasePrice}
            className="w-full bg-gray-800 text-white hover:bg-gray-900 h-12 text-base font-medium"
          >
            {isSubmitting ? "保存中..." : "保存"}
          </Button>
        </div>
      </form>

      {/* Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>选择类别</DialogTitle>
            <DialogDescription>选择一个类别或添加新类别</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {categories.map((category) => (
              <div
                key={category}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  formData.category === category
                    ? "bg-orange-50 border-orange-500 text-orange-700"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleSelectCategory(category)}
                  className="flex-1 text-left"
                >
                  {category}
                </button>
                {category !== "全部" && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteCategory(category)
                    }}
                    className="ml-2 p-1 hover:bg-red-100 rounded transition-colors"
                    title="删除分类"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <Input
              type="text"
              placeholder="输入新类别名称"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleAddCategory()
                }
              }}
              className="flex-1"
            />
            <Button type="button" onClick={handleAddCategory}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tag Dialog */}
      <Dialog open={showTagDialog} onOpenChange={setShowTagDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>选择标签</DialogTitle>
            <DialogDescription>选择一个或多个标签或添加新标签</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleToggleTag(tag)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedTags.includes(tag)
                    ? "bg-orange-50 border-orange-500 text-orange-700"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{tag}</span>
                  {selectedTags.includes(tag) && (
                    <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
              </button>
            ))}
            {tags.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">暂无标签，请添加</p>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <Input
              type="text"
              placeholder="输入新标签名称"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleAddTag()
                }
              }}
              className="flex-1"
            />
            <Button type="button" onClick={handleAddTag}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Selection Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>选择图片</DialogTitle>
            <DialogDescription>上传图片或选择Emoji</DialogDescription>
          </DialogHeader>
          
          <Tabs value={imageTab} onValueChange={(value) => setImageTab(value as "upload" | "emoji")} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">上传图片</TabsTrigger>
              <TabsTrigger value="emoji">Emoji</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="mt-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                  disabled={isUploading}
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <ImageIcon className="w-12 h-12 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {isUploading ? "上传中..." : "点击选择图片"}
                  </span>
                  <span className="text-xs text-gray-400">支持 JPG、PNG、GIF，最大 5MB</span>
                </label>
              </div>
            </TabsContent>

            <TabsContent value="emoji" className="mt-4">
              <div className="max-h-64 overflow-y-auto">
                <div className="grid grid-cols-8 gap-2">
                  {[
                    "📱", "💻", "⌚", "🎧", "📷", "🎮", "📺", "🔌",
                    "🚗", "🚲", "✈️", "🏠", "🛋️", "🛏️", "🚪", "🪑",
                    "👕", "👔", "👖", "👟", "👓", "👜", "💼", "🎒",
                    "📚", "✏️", "📝", "📖", "🎨", "🎭", "🎪", "🎬",
                    "⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏓", "🏸",
                    "🍎", "🍌", "🍇", "🍊", "🍓", "🥝", "🍉", "🍑",
                    "🍔", "🍕", "🌮", "🌯", "🍜", "🍱", "🍣", "🍤",
                    "☕", "🍵", "🍶", "🍷", "🍸", "🍹", "🍺", "🍻",
                    "⌨️",
                  ].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleEmojiSelect(emoji)}
                      className="w-10 h-10 text-2xl hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}
