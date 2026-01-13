import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Dashboard from "@/components/dashboard"

export default async function HomePage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/auth/signin")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              值道
            </h1>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {session.user.email}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Dashboard />
      </main>
    </div>
  )
}
