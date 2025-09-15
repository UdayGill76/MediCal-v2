import { type NextRequest, NextResponse } from "next/server"

// In a real app, this would be stored in a database
// For demo purposes, we'll use a simple in-memory store
const prescriptionsStore: any[] = []

export async function POST(request: NextRequest) {
  try {
    const prescriptionData = await request.json()

    // Add timestamp and unique ID
    const prescription = {
      ...prescriptionData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      status: "active",
    }

    // Store prescription (in real app, save to database)
    prescriptionsStore.push(prescription)

    // In a real app, you would also:
    // 1. Send notification to patient
    // 2. Generate calendar entries
    // 3. Set up medication reminders

    return NextResponse.json({
      success: true,
      message: "Prescription created successfully",
      prescriptionId: prescription.id,
    })
  } catch (error) {
    console.error("Error creating prescription:", error)
    return NextResponse.json({ success: false, message: "Failed to create prescription" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patientId")

    if (!patientId) {
      return NextResponse.json({ success: false, message: "Patient ID is required" }, { status: 400 })
    }

    // Filter prescriptions for specific patient
    const patientPrescriptions = prescriptionsStore.filter((prescription) => prescription.patientId === patientId)

    return NextResponse.json({
      success: true,
      prescriptions: patientPrescriptions,
    })
  } catch (error) {
    console.error("Error fetching prescriptions:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch prescriptions" }, { status: 500 })
  }
}
