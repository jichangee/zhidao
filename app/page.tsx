import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Dashboard from "@/components/dashboard"

export default async function HomePage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/auth/signin")
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Dashboard />
    </div>
  )
}
