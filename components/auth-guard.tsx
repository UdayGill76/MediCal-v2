"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: "doctor"
}

export function AuthGuard({ children, requiredRole = "doctor" }: AuthGuardProps) {
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
      return
    }

    if (status === "authenticated" && requiredRole && session?.user.role !== requiredRole) {
      router.replace("/login")
    }
  }, [status, session?.user.role, router, requiredRole])

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (status !== "authenticated" || (requiredRole && session?.user.role !== requiredRole)) {
    return null
  }

  return <>{children}</>
}

export function useAuth() {
  const { data: session } = useSession()

  const logout = () => {
    signOut({ callbackUrl: "/login" })
  }

  if (!session?.user) {
    return { authData: null, logout }
  }

  return {
    authData: {
      userId: session.user.id,
      role: session.user.role ?? "doctor",
      name: session.user.name ?? session.user.id,
    },
    logout,
  }
}
