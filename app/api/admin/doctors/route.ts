import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import bcrypt from "bcryptjs"

/**
 * GET /api/admin/doctors
 * Fetch all doctors
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if ((session?.user as any)?.role !== "admin") {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
        }

        const doctors = await prisma.doctor.findMany({
            include: {
                _count: {
                    select: { patients: true }
                }
            },
            orderBy: { createdAt: "desc" }
        })

        return NextResponse.json({ success: true, doctors })
    } catch (error) {
        console.error("Error fetching doctors:", error)
        return NextResponse.json({ success: false, message: "Failed to fetch doctors" }, { status: 500 })
    }
}

/**
 * POST /api/admin/doctors
 * Create a new doctor
 */
export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if ((session?.user as any)?.role !== "admin") {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { name, staffId, password } = body

        if (!name || !staffId || !password) {
            return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
        }

        // Check if doctor exists
        const existingDoctor = await prisma.doctor.findUnique({
            where: { staffId: staffId.toUpperCase() }
        })

        if (existingDoctor) {
            return NextResponse.json({ success: false, message: "Doctor ID already exists" }, { status: 400 })
        }

        const passwordHash = await bcrypt.hash(password, 10)

        const doctor = await prisma.doctor.create({
            data: {
                name,
                staffId: staffId.toUpperCase(),
                passwordHash,
            }
        })

        return NextResponse.json({ success: true, doctor })
    } catch (error) {
        console.error("Error creating doctor:", error)
        return NextResponse.json({ success: false, message: "Failed to create doctor" }, { status: 500 })
    }
}
