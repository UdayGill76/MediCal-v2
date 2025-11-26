type FrequencyKey =
  | "once daily"
  | "twice daily"
  | "three times daily"
  | "four times daily"
  | "every 8 hours"
  | "every 12 hours"
  | "as needed"
  | string

const FREQUENCY_TIME_SLOTS: Record<FrequencyKey, string[]> = {
  "once daily": ["08:00"],
  "twice daily": ["08:00", "20:00"],
  "three times daily": ["08:00", "14:00", "20:00"],
  "four times daily": ["08:00", "12:00", "16:00", "20:00"],
  "every 8 hours": ["08:00", "16:00", "00:00"],
  "every 12 hours": ["08:00", "20:00"],
  "as needed": ["08:00"],
}

function parseDuration(duration: string): { value: number; unit: "day" | "week" | "month" } | null {
  const match = duration.match(/(\d+)\s*(day|week|month)s?/i)
  if (!match) return null

  const [, valueStr, unit] = match
  return {
    value: Number.parseInt(valueStr, 10),
    unit: unit.toLowerCase() as "day" | "week" | "month",
  }
}

function cloneDate(date: Date) {
  return new Date(date.getTime())
}

export function generateScheduleDateTimes(params: {
  startDate: string
  duration: string
  frequency: string
}) {
  const { startDate, duration, frequency } = params
  const parsedDuration = parseDuration(duration)
  if (!parsedDuration) {
    return []
  }

  const start = new Date(startDate)
  if (Number.isNaN(start.getTime())) {
    return []
  }

  const timeSlots =
    FREQUENCY_TIME_SLOTS[frequency.toLowerCase() as FrequencyKey] ?? FREQUENCY_TIME_SLOTS["once daily"]

  const end = cloneDate(start)
  switch (parsedDuration.unit) {
    case "day": {
      end.setDate(end.getDate() + parsedDuration.value - 1)
      break
    }
    case "week": {
      end.setDate(end.getDate() + parsedDuration.value * 7 - 1)
      break
    }
    case "month": {
      end.setMonth(end.getMonth() + parsedDuration.value)
      end.setDate(end.getDate() - 1)
      break
    }
  }

  const entries: Date[] = []
  const cursor = cloneDate(start)

  while (cursor <= end) {
    timeSlots.forEach((slot) => {
      const [hours, minutes] = slot.split(":").map((value) => Number.parseInt(value, 10))
      const scheduled = cloneDate(cursor)
      scheduled.setHours(hours ?? 8, minutes ?? 0, 0, 0)
      entries.push(scheduled)
    })

    cursor.setDate(cursor.getDate() + 1)
  }

  return entries
}


