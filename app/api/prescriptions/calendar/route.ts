import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientExternalId = searchParams.get("patientId")

    if (!patientExternalId) {
      return NextResponse.json({ success: false, message: "Patient ID is required" }, { status: 400 })
    }

    const prescriptions = await prisma.prescription.findMany({
      where: {
        patient: {
          externalId: patientExternalId,
        },
      },
      include: {
        scheduleEntries: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    const calendarEntries: Record<string, Array<Record<string, unknown>>> = {}

    prescriptions.forEach((prescription) => {
      prescription.scheduleEntries.forEach((entry) => {
        const dateKey = entry.scheduledAt.toISOString().split("T")[0]
        const time = entry.scheduledAt.toISOString().split("T")[1]?.slice(0, 5) ?? "08:00"

        if (!calendarEntries[dateKey]) {
          calendarEntries[dateKey] = []
        }

        calendarEntries[dateKey].push({
          id: entry.id,
          date: dateKey,
          time,
          taken: entry.taken,
          type: prescription.type ?? "pill",
          name: prescription.medicationName,
          dosage: prescription.dosage,
          instructions: prescription.instructions,
          prescriptionId: prescription.id,
        })
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
