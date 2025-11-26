import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      )
    }

    // Find patient by email
    const patient = await prisma.patient.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        externalId: true,
      },
    })

    if (!patient) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      )
    }

    // Check if patient has a password set
    if (!patient.passwordHash) {
      return NextResponse.json(
        { success: false, message: "Password not set. Please contact your doctor." },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, patient.passwordHash)

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      )
    }

    // Return patient info (in production, you'd generate a JWT token here)
    return NextResponse.json({
      success: true,
      patient: {
        id: patient.id,
        email: patient.email,
        name: patient.name,
        externalId: patient.externalId,
      },
      // In production, include a JWT token here
      // token: generateJWT(patient.id)
    })
  } catch (error) {
    console.error("Patient login error:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}

