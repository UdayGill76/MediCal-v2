import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * PUT /api/prescriptions/schedule/[id]
 * Update the taken status of a medication schedule entry
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { taken } = body

        if (typeof taken !== "boolean") {
            return NextResponse.json({ success: false, message: "Invalid status" }, { status: 400 })
        }

        const scheduleEntry = await prisma.medicationSchedule.update({
            where: { id },
            data: {
                taken,
                takenAt: taken ? new Date() : null,
            },
        })

        return NextResponse.json({ success: true, scheduleEntry })
    } catch (error) {
        console.error("Error updating schedule:", error)
        return NextResponse.json({ success: false, message: "Failed to update schedule" }, { status: 500 })
    }
}
