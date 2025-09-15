"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Calendar, Pill, Heart, Stethoscope, Clock, Check, ArrowLeft, Settings, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { AIChatbot } from "@/components/ai-chatbot"
import { NotificationBell } from "@/components/notification-center"
import { AuthGuard, useAuth } from "@/components/auth-guard"

// Sample medication data
const medicationData = {
  "2024-01-15": [
    { id: 1, name: "Aspirin", time: "08:00", taken: true, type: "pill" },
    { id: 2, name: "Vitamin D", time: "08:00", taken: true, type: "pill" },
    { id: 3, name: "Blood Pressure Check", time: "09:00", taken: false, type: "vitals" },
  ],
  "2024-01-16": [
    { id: 4, name: "Aspirin", time: "08:00", taken: false, type: "pill" },
    { id: 5, name: "Vitamin D", time: "08:00", taken: false, type: "pill" },
    { id: 6, name: "Doctor Visit", time: "14:00", taken: false, type: "appointment" },
  ],
  "2024-01-17": [
    { id: 7, name: "Aspirin", time: "08:00", taken: false, type: "pill" },
    { id: 8, name: "Vitamin D", time: "08:00", taken: false, type: "pill" },
  ],
}

const getMedicationIcon = (type: string) => {
  switch (type) {
    case "pill":
      return <Pill className="h-4 w-4" />
    case "vitals":
      return <Heart className="h-4 w-4" />
    case "appointment":
      return <Stethoscope className="h-4 w-4" />
    default:
      return <Pill className="h-4 w-4" />
  }
}

const getMedicationColor = (type: string, taken: boolean) => {
  if (taken) return "bg-primary text-primary-foreground"

  switch (type) {
    case "pill":
      return "bg-blue-100 text-blue-700 border-blue-200"
    case "vitals":
      return "bg-red-100 text-red-700 border-red-200"
    case "appointment":
      return "bg-purple-100 text-purple-700 border-purple-200"
    default:
      return "bg-gray-100 text-gray-700 border-gray-200"
  }
}

export default function UserPortal() {
  const { authData, logout } = useAuth()
  const router = useRouter()
  useEffect(() => {
    // Redirect any access to user portal to the doctor portal
    router.replace("/doctor")
  }, [router])
  const [selectedDate, setSelectedDate] = useState("2024-01-16")
  const [medications, setMedications] = useState(medicationData)

  const toggleMedication = (dateKey: string, medicationId: number) => {
    setMedications((prev) => ({
      ...prev,
      [dateKey]: prev[dateKey]?.map((med) => (med.id === medicationId ? { ...med, taken: !med.taken } : med)) || [],
    }))
  }

  const generateCalendarDays = () => {
    const days = []
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()

    // Get first day of month and number of days
    const firstDay = new Date(currentYear, currentMonth, 1).getDay()
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24"></div>)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `2024-01-${day.toString().padStart(2, "0")}`
      const dayMedications = medications[dateKey] || []
      const isSelected = dateKey === selectedDate
      const hasActivities = dayMedications.length > 0

      days.push(
        <div
          key={day}
          className={`h-24 border border-border rounded-lg p-2 cursor-pointer transition-colors ${
            isSelected ? "bg-primary/10 border-primary" : hasActivities ? "bg-accent/5" : "hover:bg-muted"
          }`}
          onClick={() => setSelectedDate(dateKey)}
        >
          <div className="font-medium text-sm mb-1">{day}</div>
          <div className="flex flex-wrap gap-1">
            {dayMedications.slice(0, 3).map((med, index) => (
              <div
                key={index}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  med.taken ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {getMedicationIcon(med.type)}
              </div>
            ))}
            {dayMedications.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs">
                +{dayMedications.length - 3}
              </div>
            )}
          </div>
        </div>,
      )
    }

    return days
  }

  const selectedDateMedications = medications[selectedDate] || []

  return (
    <AuthGuard requiredRole="doctor">
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link href="/">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                </Link>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-rose-500">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-foreground">User Portal</h1>
                    <p className="text-sm text-muted-foreground">Your Medication Calendar</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/user/medications">
                  <Button variant="outline" size="sm">
                    <Pill className="h-4 w-4 mr-2" />
                    Manage Medications
                  </Button>
                </Link>
                <NotificationBell />
                <Badge variant="secondary" className="hidden sm:flex">
                  {authData?.userId}
                </Badge>
                <Button variant="outline" size="sm" onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Calendar Section */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      January 2024
                    </div>
                    <Link href="/user/medications">
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Manage
                      </Button>
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Calendar Header */}
                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                      <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-2">{generateCalendarDays()}</div>
                </CardContent>
              </Card>
            </div>

            {/* Daily Schedule Section */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Schedule for {selectedDate}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedDateMedications.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">No medications scheduled for this day</p>
                      <Link href="/user/medications">
                        <Button size="sm">
                          <Pill className="h-4 w-4 mr-2" />
                          Add Medications
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    selectedDateMedications.map((med) => (
                      <div
                        key={med.id}
                        className={`p-3 rounded-lg border transition-colors ${
                          med.taken ? "bg-primary/10 border-primary" : "bg-card border-border"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${getMedicationColor(med.type, med.taken)}`}>
                              {getMedicationIcon(med.type)}
                            </div>
                            <div>
                              <div className="font-medium">{med.name}</div>
                              <div className="text-sm text-muted-foreground">{med.time}</div>
                            </div>
                          </div>
                          <Button
                            variant={med.taken ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleMedication(selectedDate, med.id)}
                          >
                            {med.taken ? (
                              <>
                                <Check className="h-4 w-4 mr-1" />
                                Taken
                              </>
                            ) : (
                              "Mark as Taken"
                            )}
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Legend */}
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-sm">Legend</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                      <Pill className="h-3 w-3" />
                    </div>
                    <span className="text-sm">Medication</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-red-100 text-red-700 flex items-center justify-center">
                      <Heart className="h-3 w-3" />
                    </div>
                    <span className="text-sm">Vitals Check</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center">
                      <Stethoscope className="h-3 w-3" />
                    </div>
                    <span className="text-sm">Doctor Visit</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      <Check className="h-3 w-3" />
                    </div>
                    <span className="text-sm">Completed</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <AIChatbot />
      </div>
    </AuthGuard>
  )
}
