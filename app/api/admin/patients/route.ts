import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * GET /api/admin/patients
 * Fetch all patients with doctor info
 */
export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if ((session?.user as any)?.role !== "admin") {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
        }

        const patients = await prisma.patient.findMany({
            include: {
                doctor: {
                    select: { name: true, staffId: true }
                }
            },
            orderBy: { createdAt: "desc" }
        })

        return NextResponse.json({ success: true, patients })
    } catch (error) {
        console.error("Error fetching patients:", error)
        return NextResponse.json({ success: false, message: "Failed to fetch patients" }, { status: 500 })
    }
}
