import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * GET /api/patients
 * Fetch all patients for the logged-in doctor
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Get or create doctor by staff ID (auto-create if doesn't exist)
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

    // Fetch all patients for this doctor with prescription counts
    const patients = await prisma.patient.findMany({
      where: { doctorId: doctor.id },
      include: {
        _count: {
          select: {
            prescriptions: true,
          },
        },
        prescriptions: {
          where: {
            status: "ACTIVE",
          },
          select: {
            id: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1, // Get most recent prescription for lastVisit
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Format patients for frontend
    const formattedPatients = patients.map((patient) => {
      const lastPrescription = patient.prescriptions[0]
      const lastVisit = lastPrescription
        ? new Date(lastPrescription.createdAt).toISOString().split("T")[0]
        : null

      return {
        id: patient.id,
        externalId: patient.externalId,
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        dateOfBirth: patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split("T")[0] : null,
        notes: patient.notes,
        lastVisit,
        activePrescriptions: patient._count.prescriptions,
        createdAt: new Date(patient.createdAt).toISOString().split("T")[0],
      }
    })

    return NextResponse.json({
      success: true,
      patients: formattedPatients,
    })
  } catch (error) {
    console.error("Error fetching patients:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch patients" }, { status: 500 })
  }
}

import bcrypt from "bcryptjs"

type CreatePatientRequest = {
  name: string
  email?: string
  phone?: string
  dateOfBirth?: string
  notes?: string
  externalId?: string // Optional - will auto-generate if not provided
  password?: string // Initial password for patient login
}

/**
 * POST /api/patients
 * Create a new patient for the logged-in doctor
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Get or create doctor
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

    const body = (await request.json()) as CreatePatientRequest

    // Validate required fields
    if (!body.name || body.name.trim().length === 0) {
      return NextResponse.json({ success: false, message: "Patient name is required" }, { status: 400 })
    }

    // Generate externalId if not provided (format: PAT-YYYY-MMDD-XXX)
    let externalId = body.externalId
    if (!externalId) {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, "0")
      const day = String(now.getDate()).padStart(2, "0")
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0")
      externalId = `PAT-${year}-${month}${day}-${random}`
    }

    // Check if externalId already exists
    const existingPatient = await prisma.patient.findUnique({
      where: { externalId },
    })

    if (existingPatient) {
      // If provided externalId exists, generate a new one
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, "0")
      const day = String(now.getDate()).padStart(2, "0")
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0")
      externalId = `PAT-${year}-${month}${day}-${random}`
    }

    // Parse dateOfBirth if provided
    let dateOfBirth: Date | undefined
    if (body.dateOfBirth) {
      dateOfBirth = new Date(body.dateOfBirth)
      if (Number.isNaN(dateOfBirth.getTime())) {
        return NextResponse.json({ success: false, message: "Invalid date of birth" }, { status: 400 })
      }
    }

    // Hash password if provided
    let passwordHash: string | undefined
    if (body.password) {
      passwordHash = await bcrypt.hash(body.password, 10)
    }

    // Create patient
    const patient = await prisma.patient.create({
      data: {
        doctorId: doctor.id,
        externalId,
        name: body.name.trim(),
        email: body.email?.trim().toLowerCase() || undefined,
        phone: body.phone?.trim() || undefined,
        dateOfBirth,
        notes: body.notes?.trim() || undefined,
        passwordHash,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Patient created successfully",
      patient: {
        id: patient.id,
        externalId: patient.externalId,
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        dateOfBirth: patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split("T")[0] : null,
        notes: patient.notes,
        createdAt: new Date(patient.createdAt).toISOString().split("T")[0],
      },
    })
  } catch (error) {
    console.error("Error creating patient:", error)
    
    // Handle unique constraint violations
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { success: false, message: "A patient with this external ID or email already exists" },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: false, message: "Failed to create patient" }, { status: 500 })
  }
}

