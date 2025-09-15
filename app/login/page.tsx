"use client"

import type React from "react"
import Image from "next/image"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Stethoscope, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const [userId, setUserId] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const isDoctorId = (id: string) => id.startsWith("DOC-")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const idUpper = userId.toUpperCase()
    const isDoctor = isDoctorId(idUpper)

    if (!isDoctor) {
      setError("Doctor access only. Use a valid Doctor ID like DOC-2024-001.")
      setLoading(false)
      return
    }

    // Mock authentication - in real app, validate against database
    if (password.length < 4) {
      setError("Password must be at least 4 characters.")
      setLoading(false)
      return
    }

    // Store auth data in localStorage (in production, use secure tokens)
    localStorage.setItem(
      "medicalAuth",
      JSON.stringify({
        userId: idUpper,
        role: "doctor",
        timestamp: Date.now(),
      }),
    )

    // Redirect to doctor portal only
    router.push("/doctor")

    setLoading(false)
  }

  const isDoc = isDoctorId(userId.toUpperCase())

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-rose-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center text-teal-600 hover:text-teal-700 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <div className="flex items-center justify-center mb-4 gap-2">
            <div className="w-12 h-12 flex items-center justify-center">
              <Image
                src="/images/medical-logo-clean.jpg"
                alt="MediCal Logo"
                width={48}
                height={48}
                className="object-contain mix-blend-multiply"
              />
            </div>
            <h1 className="text-3xl font-bold">
              <span className="text-teal-600">Medi</span>
              <span className="text-rose-500">Cal</span>
            </h1>
          </div>
          <p className="text-slate-600 mt-2">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center">Enter your credentials to access the doctor portal</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userId">Doctor ID</Label>
                <Input
                  id="userId"
                  type="text"
                  placeholder="DOC-2024-001"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="text-center font-mono"
                  required
                />
                {userId && (
                  <div className="flex items-center justify-center mt-2">
                    <div
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        isDoc ? "bg-teal-100 text-teal-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      <>
                        <Stethoscope className="w-3 h-3 mr-1" />
                        {isDoc ? "Doctor ID detected" : "Doctor ID required"}
                      </>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-700 text-white transition-all duration-200"
                disabled={loading}
              >
                {loading ? "Signing In..." : "Sign In"}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-slate-50 rounded-lg">
              <p className="text-sm font-medium text-slate-700 mb-2">Demo Credentials:</p>
              <div className="space-y-1 text-xs text-slate-600">
                <p>
                  <strong>Doctor:</strong> DOC-2024-001 / password: demo123
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
