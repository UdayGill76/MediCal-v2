"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Users, Plus, Search, Calendar, Pill, FileText, ArrowLeft, Save, Send, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { AuthGuard, useAuth } from "@/components/auth-guard"

// Patient type definition
type Patient = {
  id: string
  externalId: string | null
  name: string
  email: string | null
  phone: string | null
  dateOfBirth: string | null
  notes: string | null
  lastVisit: string | null
  activePrescriptions: number
  createdAt: string
}

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
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [patientsData, setPatientsData] = useState<Patient[]>([])
  const [isLoadingPatients, setIsLoadingPatients] = useState(true)
  const [isPatientDialogOpen, setIsPatientDialogOpen] = useState(false)
  const [isCreatingPatient, setIsCreatingPatient] = useState(false)
  const [patientFormError, setPatientFormError] = useState("")
  const [selectedPatientDetails, setSelectedPatientDetails] = useState<Patient | null>(null)
  const [isPatientDetailsOpen, setIsPatientDetailsOpen] = useState(false)
  const [patientPrescriptions, setPatientPrescriptions] = useState<any[]>([])
  const [isLoadingPrescriptions, setIsLoadingPrescriptions] = useState(false)
  const [patientForm, setPatientForm] = useState({
    name: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    notes: "",
    password: "",
  })
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

  // Fetch prescriptions for selected patient
  const fetchPatientPrescriptions = async (patientExternalId: string | null) => {
    if (!patientExternalId) return

    setIsLoadingPrescriptions(true)
    try {
      const response = await fetch(`/api/prescriptions?patientId=${patientExternalId}`)
      const data = await response.json()
      if (data.success) {
        setPatientPrescriptions(data.prescriptions || [])
      }
    } catch (error) {
      console.error("Error fetching prescriptions:", error)
    } finally {
      setIsLoadingPrescriptions(false)
    }
  }

  // Fetch patients from API
  useEffect(() => {
    const fetchPatients = async () => {
      setIsLoadingPatients(true)
      try {
        const response = await fetch("/api/patients")
        const data = await response.json()
        if (data.success) {
          setPatientsData(data.patients)
        } else {
          console.error("Failed to fetch patients:", data.message)
        }
      } catch (error) {
        console.error("Error fetching patients:", error)
      } finally {
        setIsLoadingPatients(false)
      }
    }

    fetchPatients()
  }, [])

  // Refresh patients list
  const refreshPatients = async () => {
    setIsLoadingPatients(true)
    try {
      const response = await fetch("/api/patients")
      const data = await response.json()
      if (data.success) {
        setPatientsData(data.patients)
      }
    } catch (error) {
      console.error("Error fetching patients:", error)
    } finally {
      setIsLoadingPatients(false)
    }
  }

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreatingPatient(true)
    setPatientFormError("")

    try {
      const response = await fetch("/api/patients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: patientForm.name,
          email: patientForm.email || undefined,
          phone: patientForm.phone || undefined,
          dateOfBirth: patientForm.dateOfBirth || undefined,
          notes: patientForm.notes || undefined,
          password: patientForm.password || undefined,
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Reset form
        setPatientForm({
          name: "",
          email: "",
          phone: "",
          dateOfBirth: "",
          notes: "",
          password: "",
        })
        setIsPatientDialogOpen(false)
        // Refresh patient list
        await refreshPatients()
      } else {
        setPatientFormError(result.message || "Failed to create patient")
      }
    } catch (error) {
      console.error("Error creating patient:", error)
      setPatientFormError("Failed to create patient. Please try again.")
    } finally {
      setIsCreatingPatient(false)
    }
  }

  const filteredPatients = patientsData.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (patient.email && patient.email.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const handlePrescriptionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const patientDetails = patientsData.find((patient) => patient.id === prescriptionForm.patientId)
      if (!patientDetails) {
        alert("Please select a patient before sending a prescription.")
        setIsSubmitting(false)
        return
      }

      // Create prescription JSON
      const prescriptionJSON = {
        patient: {
          id: patientDetails.externalId || patientDetails.id,
          name: patientDetails.name,
          email: patientDetails.email || undefined,
          phone: patientDetails.phone || undefined,
        },
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
                <Badge variant="secondary">{authData?.name || authData?.userId}</Badge>
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
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="patients" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Patients
              </TabsTrigger>
              <TabsTrigger value="prescriptions" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                New Prescription
              </TabsTrigger>
            </TabsList>

            {/* Patients Tab */}
            <TabsContent value="patients" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Patient Management</h2>
                <Dialog open={isPatientDialogOpen} onOpenChange={setIsPatientDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Patient
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Patient</DialogTitle>
                      <DialogDescription>
                        Add a new patient to your practice. The patient will receive an ID for mobile app access.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreatePatient} className="space-y-4">
                      {patientFormError && (
                        <Alert variant="destructive">
                          <AlertDescription>{patientFormError}</AlertDescription>
                        </Alert>
                      )}

                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Patient Name */}
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="patient-name">
                            Patient Name <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="patient-name"
                            value={patientForm.name}
                            onChange={(e) => setPatientForm((prev) => ({ ...prev, name: e.target.value }))}
                            placeholder="Full name"
                            required
                          />
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                          <Label htmlFor="patient-email">Email</Label>
                          <Input
                            id="patient-email"
                            type="email"
                            value={patientForm.email}
                            onChange={(e) => setPatientForm((prev) => ({ ...prev, email: e.target.value }))}
                            placeholder="patient@example.com"
                          />
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                          <Label htmlFor="patient-phone">Phone</Label>
                          <Input
                            id="patient-phone"
                            type="tel"
                            value={patientForm.phone}
                            onChange={(e) => setPatientForm((prev) => ({ ...prev, phone: e.target.value }))}
                            placeholder="(555) 123-4567"
                          />
                        </div>

                        {/* Date of Birth */}
                        <div className="space-y-2">
                          <Label htmlFor="patient-dob">Date of Birth</Label>
                          <Input
                            id="patient-dob"
                            type="date"
                            value={patientForm.dateOfBirth}
                            onChange={(e) => setPatientForm((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                          />
                        </div>

                        {/* Password */}
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="patient-password">
                            Initial Password <span className="text-muted-foreground text-xs">(for mobile app login)</span>
                          </Label>
                          <Input
                            id="patient-password"
                            type="password"
                            value={patientForm.password}
                            onChange={(e) => setPatientForm((prev) => ({ ...prev, password: e.target.value }))}
                            placeholder="Leave empty to set later"
                          />
                          <p className="text-xs text-muted-foreground">
                            Patient will use this password with their email to login to the mobile app
                          </p>
                        </div>
                      </div>

                      {/* Notes */}
                      <div className="space-y-2">
                        <Label htmlFor="patient-notes">Notes</Label>
                        <Textarea
                          id="patient-notes"
                          value={patientForm.notes}
                          onChange={(e) => setPatientForm((prev) => ({ ...prev, notes: e.target.value }))}
                          placeholder="Medical history, allergies, or other relevant information"
                          rows={3}
                        />
                      </div>

                      {/* Submit Buttons */}
                      <div className="flex gap-4 pt-4">
                        <Button type="submit" className="flex-1" disabled={isCreatingPatient}>
                          {isCreatingPatient ? "Creating..." : "Create Patient"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsPatientDialogOpen(false)}
                          disabled={isCreatingPatient}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
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
              {isLoadingPatients ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading patients...</p>
                </div>
              ) : filteredPatients.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    {searchTerm ? "No patients found matching your search." : "No patients yet. Create your first patient!"}
                  </p>
                  {!searchTerm && (
                    <Dialog open={isPatientDialogOpen} onOpenChange={setIsPatientDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Patient
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Create New Patient</DialogTitle>
                          <DialogDescription>
                            Add a new patient to your practice. The patient will receive an ID for mobile app access.
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreatePatient} className="space-y-4">
                          {patientFormError && (
                            <Alert variant="destructive">
                              <AlertDescription>{patientFormError}</AlertDescription>
                            </Alert>
                          )}

                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor="patient-name-empty">
                                Patient Name <span className="text-destructive">*</span>
                              </Label>
                              <Input
                                id="patient-name-empty"
                                value={patientForm.name}
                                onChange={(e) => setPatientForm((prev) => ({ ...prev, name: e.target.value }))}
                                placeholder="Full name"
                                required
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="patient-email-empty">Email</Label>
                              <Input
                                id="patient-email-empty"
                                type="email"
                                value={patientForm.email}
                                onChange={(e) => setPatientForm((prev) => ({ ...prev, email: e.target.value }))}
                                placeholder="patient@example.com"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="patient-phone-empty">Phone</Label>
                              <Input
                                id="patient-phone-empty"
                                type="tel"
                                value={patientForm.phone}
                                onChange={(e) => setPatientForm((prev) => ({ ...prev, phone: e.target.value }))}
                                placeholder="(555) 123-4567"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="patient-dob-empty">Date of Birth</Label>
                              <Input
                                id="patient-dob-empty"
                                type="date"
                                value={patientForm.dateOfBirth}
                                onChange={(e) => setPatientForm((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                              />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                              <Label htmlFor="patient-password-empty">
                                Initial Password <span className="text-muted-foreground text-xs">(for mobile app login)</span>
                              </Label>
                              <Input
                                id="patient-password-empty"
                                type="password"
                                value={patientForm.password}
                                onChange={(e) => setPatientForm((prev) => ({ ...prev, password: e.target.value }))}
                                placeholder="Leave empty to set later"
                              />
                              <p className="text-xs text-muted-foreground">
                                Patient will use this password with their email to login to the mobile app
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="patient-notes-empty">Notes</Label>
                            <Textarea
                              id="patient-notes-empty"
                              value={patientForm.notes}
                              onChange={(e) => setPatientForm((prev) => ({ ...prev, notes: e.target.value }))}
                              placeholder="Medical history, allergies, or other relevant information"
                              rows={3}
                            />
                          </div>

                          <div className="flex gap-4 pt-4">
                            <Button type="submit" className="flex-1" disabled={isCreatingPatient}>
                              {isCreatingPatient ? "Creating..." : "Create Patient"}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsPatientDialogOpen(false)}
                              disabled={isCreatingPatient}
                            >
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              ) : (
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
                                {patient.email || "No email"}
                              </p>
                              {patient.phone && (
                                <p className="text-sm text-muted-foreground">{patient.phone}</p>
                              )}
                              {patient.externalId && (
                                <p className="text-xs text-muted-foreground">ID: {patient.externalId}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              {patient.lastVisit ? `Last visit: ${patient.lastVisit}` : "No visits yet"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Active prescriptions: {patient.activePrescriptions}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedPatientDetails(patient)
                                setIsPatientDetailsOpen(true)
                                fetchPatientPrescriptions(patient.externalId)
                              }}
                            >
                              View Details
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                setPrescriptionForm((prev) => ({ ...prev, patientId: patient.id }))
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
              )}
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
                              <SelectItem key={patient.id} value={patient.id}>
                                {patient.name} - {patient.email || "No email"}
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


          </Tabs>

          {/* Patient Details Dialog */}
          <Dialog open={isPatientDetailsOpen} onOpenChange={setIsPatientDetailsOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Patient Details</DialogTitle>
                <DialogDescription>
                  Complete information for {selectedPatientDetails?.name}
                </DialogDescription>
              </DialogHeader>
              {selectedPatientDetails && (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Name</Label>
                      <p className="font-medium">{selectedPatientDetails.name}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Patient ID</Label>
                      <p className="font-medium">{selectedPatientDetails.externalId || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Email</Label>
                      <p className="font-medium">{selectedPatientDetails.email || "Not provided"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Phone</Label>
                      <p className="font-medium">{selectedPatientDetails.phone || "Not provided"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Date of Birth</Label>
                      <p className="font-medium">{selectedPatientDetails.dateOfBirth || "Not provided"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Active Prescriptions</Label>
                      <p className="font-medium">{selectedPatientDetails.activePrescriptions}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Last Visit</Label>
                      <p className="font-medium">{selectedPatientDetails.lastVisit || "No visits yet"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Registered On</Label>
                      <p className="font-medium">{selectedPatientDetails.createdAt}</p>
                    </div>
                  </div>
                  {selectedPatientDetails.notes && (
                    <div>
                      <Label className="text-muted-foreground">Notes</Label>
                      <Card className="mt-2">
                        <CardContent className="p-4">
                          <p className="text-sm whitespace-pre-wrap">{selectedPatientDetails.notes}</p>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Active Prescriptions Section */}
                  <div>
                    <Label className="text-muted-foreground">Active Prescriptions ({patientPrescriptions.length})</Label>
                    {isLoadingPrescriptions ? (
                      <Card className="mt-2">
                        <CardContent className="p-4 text-center text-muted-foreground">
                          Loading prescriptions...
                        </CardContent>
                      </Card>
                    ) : patientPrescriptions.length > 0 ? (
                      <div className="mt-2 space-y-2">
                        {patientPrescriptions.map((prescription: any) => (
                          <Card key={prescription.id}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="space-y-1 flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-semibold">{prescription.medicationName}</h4>
                                    <Badge variant="outline" className="text-xs">{prescription.type}</Badge>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                      <span className="text-muted-foreground">Dosage:</span> {prescription.dosage}
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Frequency:</span> {prescription.frequency}
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Duration:</span> {prescription.duration}
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">Start Date:</span> {new Date(prescription.startDate).toLocaleDateString()}
                                    </div>
                                  </div>
                                  {prescription.instructions && (
                                    <p className="text-sm text-muted-foreground italic mt-2">
                                      {prescription.instructions}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Card className="mt-2">
                        <CardContent className="p-4 text-center text-muted-foreground">
                          No active prescriptions
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={() => {
                        setPrescriptionForm((prev) => ({ ...prev, patientId: selectedPatientDetails.id }))
                        setActiveTab("prescriptions")
                        setIsPatientDetailsOpen(false)
                      }}
                      className="flex-1"
                    >
                      Create Prescription
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsPatientDetailsOpen(false)}
                      className="flex-1"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </AuthGuard>
  )
}
