import { CheckCircle } from "lucide-react"

export default function VerifyRequestPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-xl dark:bg-gray-900">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">
            检查您的邮箱
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            我们已向您发送了一个登录链接
          </p>
          <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            请点击邮件中的链接完成登录。链接将在1小时后失效。
          </p>
        </div>
      </div>
    </div>
  )
}
