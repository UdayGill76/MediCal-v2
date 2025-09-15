"use client"

import { useState } from "react"
import { Bell, X, Clock, Pill, Heart, Stethoscope, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Notification {
  id: string
  type: "medication" | "appointment" | "vitals" | "reminder"
  title: string
  message: string
  time: string
  isRead: boolean
  priority: "low" | "medium" | "high"
  actionRequired?: boolean
}

// Sample notification data
const initialNotifications: Notification[] = [
  {
    id: "1",
    type: "medication",
    title: "Aspirin Reminder",
    message: "Time to take your morning Aspirin (100mg)",
    time: "08:00",
    isRead: false,
    priority: "high",
    actionRequired: true,
  },
  {
    id: "2",
    type: "medication",
    title: "Vitamin D Reminder",
    message: "Don't forget your Vitamin D supplement",
    time: "08:00",
    isRead: false,
    priority: "medium",
    actionRequired: true,
  },
  {
    id: "3",
    type: "appointment",
    title: "Doctor Appointment",
    message: "Appointment with Dr. Smith at 2:00 PM today",
    time: "14:00",
    isRead: false,
    priority: "high",
    actionRequired: false,
  },
  {
    id: "4",
    type: "vitals",
    title: "Blood Pressure Check",
    message: "Time for your daily blood pressure measurement",
    time: "09:00",
    isRead: false,
    priority: "medium",
    actionRequired: true,
  },
  {
    id: "5",
    type: "reminder",
    title: "Medication Refill",
    message: "Your Aspirin prescription expires in 3 days",
    time: "10:00",
    isRead: true,
    priority: "medium",
    actionRequired: false,
  },
]

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "medication":
      return <Pill className="h-4 w-4" />
    case "appointment":
      return <Stethoscope className="h-4 w-4" />
    case "vitals":
      return <Heart className="h-4 w-4" />
    case "reminder":
      return <Clock className="h-4 w-4" />
    default:
      return <Bell className="h-4 w-4" />
  }
}

const getNotificationColor = (type: string, priority: string) => {
  if (priority === "high") {
    return "border-red-200 bg-red-50 text-red-800"
  }

  switch (type) {
    case "medication":
      return "border-blue-200 bg-blue-50 text-blue-800"
    case "appointment":
      return "border-purple-200 bg-purple-50 text-purple-800"
    case "vitals":
      return "border-red-200 bg-red-50 text-red-800"
    case "reminder":
      return "border-yellow-200 bg-yellow-50 text-yellow-800"
    default:
      return "border-gray-200 bg-gray-50 text-gray-800"
  }
}

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)

  const unreadCount = notifications.filter((n) => !n.isRead).length
  const urgentCount = notifications.filter((n) => !n.isRead && n.priority === "high").length

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, isRead: true } : notification)),
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })))
  }

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
      <div
        className="fixed right-4 top-20 w-96 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-6rem)]"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="shadow-2xl border-2">
          <CardHeader className="bg-primary text-primary-foreground">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="bg-white text-primary">
                    {unreadCount}
                  </Badge>
                )}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-primary-foreground hover:bg-primary-foreground/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {urgentCount > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4" />
                {urgentCount} urgent notification{urgentCount > 1 ? "s" : ""}
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-4 border-b">
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="w-full bg-transparent"
              >
                Mark All as Read
              </Button>
            </div>

            <ScrollArea className="h-96">
              <div className="p-4 space-y-3">
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No notifications</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border transition-all ${
                        notification.isRead
                          ? "bg-muted/50 border-border opacity-75"
                          : getNotificationColor(notification.type, notification.priority)
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${notification.isRead ? "bg-muted" : "bg-white"}`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">{notification.title}</h4>
                            <span className="text-xs text-muted-foreground">{notification.time}</span>
                            {!notification.isRead && <div className="w-2 h-2 bg-primary rounded-full"></div>}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                          <div className="flex items-center gap-2">
                            {notification.actionRequired && !notification.isRead && (
                              <Button size="sm" variant="default" className="text-xs">
                                Take Action
                              </Button>
                            )}
                            {!notification.isRead && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => markAsRead(notification.id)}
                                className="text-xs"
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Mark Read
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => dismissNotification(notification.id)}
                              className="text-xs text-muted-foreground hover:text-destructive"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Dismiss
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications] = useState<Notification[]>(initialNotifications)

  const unreadCount = notifications.filter((n) => !n.isRead).length
  const hasUrgent = notifications.some((n) => !n.isRead && n.priority === "high")

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)} className="relative">
        <Bell className={`h-4 w-4 mr-2 ${hasUrgent ? "text-red-500" : ""}`} />
        Notifications
        {unreadCount > 0 && (
          <Badge
            variant={hasUrgent ? "destructive" : "secondary"}
            className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </Button>

      <NotificationCenter isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
