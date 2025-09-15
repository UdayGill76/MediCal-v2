"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface AuthData {
  userId: string
  role: "doctor"
  timestamp: number
}

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: "doctor"
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      try {
        const authData = localStorage.getItem("medicalAuth")
        if (!authData) {
          router.push("/login")
          return
        }

        const auth: AuthData = JSON.parse(authData)

        // Check if token is expired (24 hours)
        const isExpired = Date.now() - auth.timestamp > 24 * 60 * 60 * 1000
        if (isExpired) {
          localStorage.removeItem("medicalAuth")
          router.push("/login")
          return
        }

        // Doctor-only access enforcement
        if (auth.role !== "doctor") {
          localStorage.removeItem("medicalAuth")
          router.push("/login")
          return
        }
        if (requiredRole && auth.role !== requiredRole) {
          router.push("/doctor")
          return
        }

        setIsAuthenticated(true)
      } catch (error) {
        console.error("Auth check failed:", error)
        router.push("/login")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router, requiredRole])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}

export function useAuth() {
  const [authData, setAuthData] = useState<AuthData | null>(null)

  useEffect(() => {
    const auth = localStorage.getItem("medicalAuth")
    if (auth) {
      setAuthData(JSON.parse(auth))
    }
  }, [])

  const logout = () => {
    localStorage.removeItem("medicalAuth")
    window.location.href = "/login"
  }

  return { authData, logout }
}
