import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/prisma"
import { authConfig } from "./auth.config"

// Verify Prisma client is properly initialized
if (!prisma) {
  throw new Error("Prisma client is not initialized. Make sure DATABASE_URL is set and Prisma Client is generated.")
}

// Create adapter with error handling
let adapter
try {
  adapter = PrismaAdapter(prisma)
} catch (error) {
  console.error("Failed to create PrismaAdapter:", error)
  throw new Error(
    "Failed to initialize PrismaAdapter. Make sure to run 'npx prisma generate' and that your Prisma schema matches NextAuth requirements."
  )
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter,
  session: { strategy: "jwt" }, // 如果要支持 edge middleware，通常建议用 jwt，或者混合模式
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async session({ session, token }) {
      if (session.user && token?.sub) {
        session.user.id = token.sub
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
      }
      return token
    },
  },
})
