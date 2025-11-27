import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * PUT /api/admin/patients/[id]
 * Update patient details
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if ((session?.user as any)?.role !== "admin") {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
        }

        const { id } = await params
        const body = await request.json()
        const { name, email, phone, notes } = body

        const patient = await prisma.patient.update({
            where: { id },
            data: {
                name,
                email: email || null,
                phone: phone || null,
                notes: notes || null,
            },
        })

        return NextResponse.json({ success: true, patient })
    } catch (error) {
        console.error("Error updating patient:", error)
        return NextResponse.json({ success: false, message: "Failed to update patient" }, { status: 500 })
    }
}

/**
 * DELETE /api/admin/patients/[id]
 * Delete a patient
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if ((session?.user as any)?.role !== "admin") {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
        }

        const { id } = await params

        // Delete related records first (cascade manually if needed, or rely on Prisma cascade)
        // Prisma schema doesn't explicitly show cascade, so we'll let Prisma handle it or error
        // Ideally we should delete prescriptions first

        await prisma.prescription.deleteMany({
            where: { patientId: id }
        })

        await prisma.patient.delete({
            where: { id },
        })

        return NextResponse.json({ success: true, message: "Patient deleted successfully" })
    } catch (error) {
        console.error("Error deleting patient:", error)
        return NextResponse.json({ success: false, message: "Failed to delete patient" }, { status: 500 })
    }
}
