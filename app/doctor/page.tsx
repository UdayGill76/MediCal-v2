"use client"

import type React from "react"

import { useState } from "react"
import { Users, Plus, Search, Calendar, Pill, FileText, ArrowLeft, Save, Send, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { AuthGuard, useAuth } from "@/components/auth-guard"

// Sample patient data
const patientsData = [
  {
    id: 1,
    name: "John Smith",
    age: 65,
    email: "john.smith@email.com",
    phone: "(555) 123-4567",
    lastVisit: "2024-01-10",
    conditions: ["Hypertension", "Diabetes"],
    activePrescriptions: 3,
  },
  {
    id: 2,
    name: "Mary Johnson",
    age: 72,
    email: "mary.johnson@email.com",
    phone: "(555) 987-6543",
    lastVisit: "2024-01-08",
    conditions: ["Arthritis", "High Cholesterol"],
    activePrescriptions: 2,
  },
  {
    id: 3,
    name: "Robert Davis",
    age: 58,
    email: "robert.davis@email.com",
    phone: "(555) 456-7890",
    lastVisit: "2024-01-12",
    conditions: ["Heart Disease"],
    activePrescriptions: 4,
  },
]

const medicationTypes = ["Tablet", "Capsule", "Liquid", "Injection", "Topical", "Inhaler"]

const frequencies = [
  "Once daily",
  "Twice daily",
  "Three times daily",
  "Four times daily",
  "Every 8 hours",
  "Every 12 hours",
  "As needed",
  "Weekly",
]

export default function DoctorPortal() {
  const { authData, logout } = useAuth()
  const [activeTab, setActiveTab] = useState("patients")
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [prescriptionForm, setPrescriptionForm] = useState({
    patientId: "",
    medicationName: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: "",
    startDate: "",
    type: "",
  })

  const filteredPatients = patientsData.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handlePrescriptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Create prescription JSON
      const prescriptionJSON = {
        patientId: prescriptionForm.patientId,
        doctorId: authData?.userId || "unknown",
        prescription: {
          medication: {
            name: prescriptionForm.medicationName,
            dosage: prescriptionForm.dosage,
            type: prescriptionForm.type,
          },
          schedule: {
            frequency: prescriptionForm.frequency,
            startDate: prescriptionForm.startDate,
            duration: prescriptionForm.duration,
          },
          instructions: prescriptionForm.instructions,
        },
      }

      const response = await fetch("/api/prescriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(prescriptionJSON),
      })

      const result = await response.json()

      if (result.success) {
        // Reset form
        setPrescriptionForm({
          patientId: "",
          medicationName: "",
          dosage: "",
          frequency: "",
          duration: "",
          instructions: "",
          startDate: "",
          type: "",
        })

        alert("Prescription sent successfully! The patient will see it in their calendar.")
      } else {
        alert("Failed to send prescription: " + result.message)
      }
    } catch (error) {
      console.error("Error sending prescription:", error)
      alert("Failed to send prescription. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthGuard requiredRole="doctor">
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link href="/">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                </Link>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-teal-600">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-foreground">Doctor Portal</h1>
                    <p className="text-sm text-muted-foreground">Patient & Prescription Management</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{authData?.userId}</Badge>
                <Button variant="outline" size="sm" onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="patients" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Patients
              </TabsTrigger>
              <TabsTrigger value="prescriptions" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                New Prescription
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Schedule
              </TabsTrigger>
            </TabsList>

            {/* Patients Tab */}
            <TabsContent value="patients" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Patient Management</h2>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Patient
                </Button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search patients by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Patient List */}
              <div className="grid gap-4">
                {filteredPatients.map((patient) => (
                  <Card key={patient.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <Users className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{patient.name}</h3>
                            <p className="text-muted-foreground">
                              Age: {patient.age} • {patient.email}
                            </p>
                            <p className="text-sm text-muted-foreground">{patient.phone}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex gap-2 mb-2">
                            {patient.conditions.map((condition) => (
                              <Badge key={condition} variant="outline">
                                {condition}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-sm text-muted-foreground">Last visit: {patient.lastVisit}</p>
                          <p className="text-sm text-muted-foreground">
                            Active prescriptions: {patient.activePrescriptions}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setPrescriptionForm((prev) => ({ ...prev, patientId: patient.id.toString() }))
                              setActiveTab("prescriptions")
                            }}
                          >
                            New Prescription
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Prescriptions Tab */}
            <TabsContent value="prescriptions" className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Create New Prescription</h2>
                <p className="text-muted-foreground">
                  Fill out the form below to create a prescription that will be sent to the patient's calendar.
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Pill className="h-5 w-5" />
                    Prescription Details
                  </CardTitle>
                  <CardDescription>
                    This information will be converted to JSON and sent to the patient's medication calendar.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePrescriptionSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Patient Selection */}
                      <div className="space-y-2">
                        <Label htmlFor="patient">Patient</Label>
                        <Select
                          value={prescriptionForm.patientId}
                          onValueChange={(value) => setPrescriptionForm((prev) => ({ ...prev, patientId: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a patient" />
                          </SelectTrigger>
                          <SelectContent>
                            {patientsData.map((patient) => (
                              <SelectItem key={patient.id} value={patient.id.toString()}>
                                {patient.name} - {patient.email}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Medication Name */}
                      <div className="space-y-2">
                        <Label htmlFor="medication">Medication Name</Label>
                        <Input
                          id="medication"
                          value={prescriptionForm.medicationName}
                          onChange={(e) => setPrescriptionForm((prev) => ({ ...prev, medicationName: e.target.value }))}
                          placeholder="e.g., Aspirin, Metformin"
                          required
                        />
                      </div>

                      {/* Dosage */}
                      <div className="space-y-2">
                        <Label htmlFor="dosage">Dosage</Label>
                        <Input
                          id="dosage"
                          value={prescriptionForm.dosage}
                          onChange={(e) => setPrescriptionForm((prev) => ({ ...prev, dosage: e.target.value }))}
                          placeholder="e.g., 100mg, 2 tablets"
                          required
                        />
                      </div>

                      {/* Medication Type */}
                      <div className="space-y-2">
                        <Label htmlFor="type">Medication Type</Label>
                        <Select
                          value={prescriptionForm.type}
                          onValueChange={(value) => setPrescriptionForm((prev) => ({ ...prev, type: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {medicationTypes.map((type) => (
                              <SelectItem key={type} value={type.toLowerCase()}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Frequency */}
                      <div className="space-y-2">
                        <Label htmlFor="frequency">Frequency</Label>
                        <Select
                          value={prescriptionForm.frequency}
                          onValueChange={(value) => setPrescriptionForm((prev) => ({ ...prev, frequency: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            {frequencies.map((freq) => (
                              <SelectItem key={freq} value={freq.toLowerCase()}>
                                {freq}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Duration */}
                      <div className="space-y-2">
                        <Label htmlFor="duration">Duration</Label>
                        <Input
                          id="duration"
                          value={prescriptionForm.duration}
                          onChange={(e) => setPrescriptionForm((prev) => ({ ...prev, duration: e.target.value }))}
                          placeholder="e.g., 30 days, 2 weeks"
                          required
                        />
                      </div>

                      {/* Start Date */}
                      <div className="space-y-2">
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={prescriptionForm.startDate}
                          onChange={(e) => setPrescriptionForm((prev) => ({ ...prev, startDate: e.target.value }))}
                          required
                        />
                      </div>
                    </div>

                    {/* Instructions */}
                    <div className="space-y-2">
                      <Label htmlFor="instructions">Special Instructions</Label>
                      <Textarea
                        id="instructions"
                        value={prescriptionForm.instructions}
                        onChange={(e) => setPrescriptionForm((prev) => ({ ...prev, instructions: e.target.value }))}
                        placeholder="e.g., Take with food, Avoid alcohol, Take before bedtime"
                        rows={3}
                      />
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex gap-4 pt-4">
                      <Button type="submit" className="flex-1" disabled={isSubmitting}>
                        <Send className="h-4 w-4 mr-2" />
                        {isSubmitting ? "Sending..." : "Send Prescription"}
                      </Button>
                      <Button type="button" variant="outline" className="flex-1 bg-transparent">
                        <Save className="h-4 w-4 mr-2" />
                        Save as Draft
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Calendar Tab */}
            <TabsContent value="calendar" className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Appointment Schedule</h2>
                <p className="text-muted-foreground">View and manage your patient appointments and follow-ups.</p>
              </div>

              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Schedule Management</h3>
                  <p className="text-muted-foreground mb-4">
                    Calendar integration for appointment scheduling will be available in the next update.
                  </p>
                  <Button variant="outline">View Full Calendar</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AuthGuard>
  )
}
