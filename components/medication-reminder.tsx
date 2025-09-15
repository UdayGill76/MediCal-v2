"use client"

import { useState } from "react"
import { Pill, Clock, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface MedicationReminderProps {
  medication: {
    name: string
    dosage: string
    time: string
  }
  onTaken: () => void
  onDismiss: () => void
}

export function MedicationReminder({ medication, onTaken, onDismiss }: MedicationReminderProps) {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <div className="fixed top-20 right-4 z-40 w-80 max-w-[calc(100vw-2rem)]">
      <Card className="shadow-lg border-2 border-primary bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-primary text-primary-foreground">
                <Pill className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Medication Reminder</h4>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {medication.time}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="mb-4">
            <p className="font-medium">{medication.name}</p>
            <p className="text-sm text-muted-foreground">{medication.dosage}</p>
          </div>

          <div className="flex gap-2">
            <Button size="sm" onClick={onTaken} className="flex-1">
              <Check className="h-4 w-4 mr-1" />
              Mark as Taken
            </Button>
            <Button size="sm" variant="outline" onClick={onDismiss}>
              Remind Later
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
