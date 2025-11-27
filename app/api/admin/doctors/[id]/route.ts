import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import bcrypt from "bcryptjs"

/**
 * PUT /api/admin/doctors/[id]
 * Update doctor details
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
        const { name, password } = body

        const updateData: any = {}
        if (name) updateData.name = name
        if (password) {
            updateData.passwordHash = await bcrypt.hash(password, 10)
        }

        const doctor = await prisma.doctor.update({
            where: { id },
            data: updateData,
        })

        return NextResponse.json({ success: true, doctor })
    } catch (error) {
        console.error("Error updating doctor:", error)
        return NextResponse.json({ success: false, message: "Failed to update doctor" }, { status: 500 })
    }
}

/**
 * DELETE /api/admin/doctors/[id]
 * Delete a doctor
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
        console.log(`Attempting to delete doctor with ID: ${id}`)

        // Check if doctor has patients
        const doctor = await prisma.doctor.findUnique({
            where: { id },
            include: { _count: { select: { patients: true } } }
        })

        if (doctor?._count.patients && doctor._count.patients > 0) {
            return NextResponse.json({
                success: false,
                message: "Cannot delete doctor with assigned patients. Reassign them first."
            }, { status: 400 })
        }

        await prisma.doctor.delete({
            where: { id },
        })

        return NextResponse.json({ success: true, message: "Doctor deleted successfully" })
    } catch (error) {
        console.error("Error deleting doctor:", error)
        return NextResponse.json({ success: false, message: "Failed to delete doctor" }, { status: 500 })
    }
}
