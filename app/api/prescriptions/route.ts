import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { generateScheduleDateTimes } from "@/lib/schedule"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

type PrescriptionRequest = {
  patient: {
    id: string
    name?: string
    email?: string
    phone?: string
  }
  prescription: {
    medication: {
      name: string
      dosage: string
      type?: string
    }
    schedule: {
      frequency: string
      startDate: string
      duration: string
    }
    instructions?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const payload = (await request.json()) as PrescriptionRequest
    if (!payload?.patient?.id) {
      return NextResponse.json({ success: false, message: "Patient information missing" }, { status: 400 })
    }

    const doctor = await prisma.doctor.upsert({
      where: { staffId: session.user.id },
      update: {
        name: session.user.name ?? session.user.id,
        updatedAt: new Date(),
      },
      create: {
        staffId: session.user.id,
        name: session.user.name ?? session.user.id,
        email: session.user.email ?? undefined,
      },
    })

    const patient = await prisma.patient.upsert({
      where: { externalId: payload.patient.id },
      update: {
        name: payload.patient.name ?? payload.patient.id,
        email: payload.patient.email,
        phone: payload.patient.phone,
        doctorId: doctor.id,
      },
      create: {
        externalId: payload.patient.id,
        name: payload.patient.name ?? payload.patient.id,
        email: payload.patient.email,
        phone: payload.patient.phone,
        doctorId: doctor.id,
      },
    })

    const startDate = new Date(payload.prescription.schedule.startDate)
    if (Number.isNaN(startDate.getTime())) {
      return NextResponse.json({ success: false, message: "Invalid start date" }, { status: 400 })
    }

    const prescription = await prisma.prescription.create({
      data: {
        doctorId: doctor.id,
        patientId: patient.id,
        medicationName: payload.prescription.medication.name,
        dosage: payload.prescription.medication.dosage,
        type: payload.prescription.medication.type ?? "tablet",
        frequency: payload.prescription.schedule.frequency,
        duration: payload.prescription.schedule.duration,
        startDate,
        instructions: payload.prescription.instructions,
      },
    })

    const scheduleDateTimes = generateScheduleDateTimes({
      startDate: payload.prescription.schedule.startDate,
      duration: payload.prescription.schedule.duration,
      frequency: payload.prescription.schedule.frequency,
    })

    if (scheduleDateTimes.length > 0) {
      await prisma.medicationSchedule.createMany({
        data: scheduleDateTimes.map((scheduledAt) => ({
          prescriptionId: prescription.id,
          scheduledAt,
        })),
      })
    }

    return NextResponse.json({
      success: true,
      message: "Prescription created successfully",
      prescriptionId: prescription.id,
      scheduleCount: scheduleDateTimes.length,
    })
  } catch (error) {
    console.error("Error creating prescription:", error)
    return NextResponse.json({ success: false, message: "Failed to create prescription" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientExternalId = searchParams.get("patientId")

    if (!patientExternalId) {
      return NextResponse.json({ success: false, message: "Patient ID is required" }, { status: 400 })
    }

    const patient = await prisma.patient.findUnique({
      where: { externalId: patientExternalId },
      include: {
        prescriptions: {
          include: {
            scheduleEntries: true,
            doctor: true,
          },
        },
      },
    })

    if (!patient) {
      return NextResponse.json({ success: true, prescriptions: [] })
    }

    return NextResponse.json({
      success: true,
      prescriptions: patient.prescriptions.map((prescription) => ({
        id: prescription.id,
        medicationName: prescription.medicationName,
        dosage: prescription.dosage,
        type: prescription.type,
        frequency: prescription.frequency,
        duration: prescription.duration,
        startDate: prescription.startDate,
        instructions: prescription.instructions,
        doctor: {
          id: prescription.doctor.staffId,
          name: prescription.doctor.name,
        },
        scheduleEntries: prescription.scheduleEntries,
      })),
    })
  } catch (error) {
    console.error("Error fetching prescriptions:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch prescriptions" }, { status: 500 })
  }
}
