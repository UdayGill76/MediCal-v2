import { type NextRequest, NextResponse } from "next/server"

// Helper function to generate calendar entries from prescription
function generateCalendarEntries(prescription: any) {
  const entries: any[] = []
  const startDate = new Date(prescription.prescription.schedule.startDate)
  const duration = prescription.prescription.schedule.duration
  const frequency = prescription.prescription.schedule.frequency

  // Parse duration (e.g., "30 days", "2 weeks")
  const durationMatch = duration.match(/(\d+)\s*(day|week|month)s?/i)
  if (!durationMatch) return entries

  const durationValue = Number.parseInt(durationMatch[1])
  const durationUnit = durationMatch[2].toLowerCase()

  // Calculate end date
  const endDate = new Date(startDate)
  switch (durationUnit) {
    case "day":
      endDate.setDate(endDate.getDate() + durationValue)
      break
    case "week":
      endDate.setDate(endDate.getDate() + durationValue * 7)
      break
    case "month":
      endDate.setMonth(endDate.getMonth() + durationValue)
      break
  }

  // Generate daily entries based on frequency
  let timesPerDay = 1
  let timeSlots = ["08:00"]

  switch (frequency.toLowerCase()) {
    case "twice daily":
      timesPerDay = 2
      timeSlots = ["08:00", "20:00"]
      break
    case "three times daily":
      timesPerDay = 3
      timeSlots = ["08:00", "14:00", "20:00"]
      break
    case "four times daily":
      timesPerDay = 4
      timeSlots = ["08:00", "12:00", "16:00", "20:00"]
      break
    case "every 8 hours":
      timesPerDay = 3
      timeSlots = ["08:00", "16:00", "00:00"]
      break
    case "every 12 hours":
      timesPerDay = 2
      timeSlots = ["08:00", "20:00"]
      break
  }

  // Generate entries for each day
  const currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    const dateKey = currentDate.toISOString().split("T")[0]

    timeSlots.forEach((time, index) => {
      entries.push({
        id: `${prescription.id}-${dateKey}-${index}`,
        date: dateKey,
        name: prescription.prescription.medication.name,
        dosage: prescription.prescription.medication.dosage,
        time: time,
        taken: false,
        type: "pill",
        instructions: prescription.prescription.instructions,
        prescriptionId: prescription.id,
      })
    })

    currentDate.setDate(currentDate.getDate() + 1)
  }

  return entries
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patientId")

    if (!patientId) {
      return NextResponse.json({ success: false, message: "Patient ID is required" }, { status: 400 })
    }

    // Get prescriptions from store (in real app, from database)
    const prescriptionsStore = JSON.parse(
      typeof window !== "undefined" ? localStorage.getItem("prescriptions") || "[]" : "[]",
    )

    const patientPrescriptions = prescriptionsStore.filter((prescription: any) => prescription.patientId === patientId)

    // Generate calendar entries for all prescriptions
    const calendarEntries: any = {}

    patientPrescriptions.forEach((prescription: any) => {
      const entries = generateCalendarEntries(prescription)
      entries.forEach((entry) => {
        if (!calendarEntries[entry.date]) {
          calendarEntries[entry.date] = []
        }
        calendarEntries[entry.date].push(entry)
      })
    })

    return NextResponse.json({
      success: true,
      calendar: calendarEntries,
    })
  } catch (error) {
    console.error("Error generating calendar:", error)
    return NextResponse.json({ success: false, message: "Failed to generate calendar" }, { status: 500 })
  }
}
