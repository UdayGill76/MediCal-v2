"use client"

import { useState } from "react"
import { Pill, Plus, Edit, Trash2, ArrowLeft, Clock, Calendar, AlertCircle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { AIChatbot } from "@/components/ai-chatbot"
import { NotificationBell } from "@/components/notification-center"

interface Medication {
  id: number
  name: string
  dosage: string
  frequency: string
  times: string[]
  startDate: string
  endDate?: string
  instructions: string
  sideEffects: string[]
  prescribedBy: string
  refillDate?: string
  isActive: boolean
  adherenceRate: number
}

const sampleMedications: Medication[] = [
  {
    id: 1,
    name: "Aspirin",
    dosage: "100mg",
    frequency: "Once daily",
    times: ["08:00"],
    startDate: "2024-01-01",
    endDate: "2024-06-01",
    instructions: "Take with food to avoid stomach upset",
    sideEffects: ["Stomach upset", "Dizziness"],
    prescribedBy: "Dr. Smith",
    refillDate: "2024-01-20",
    isActive: true,
    adherenceRate: 95,
  },
  {
    id: 2,
    name: "Vitamin D",
    dosage: "1000 IU",
    frequency: "Once daily",
    times: ["08:00"],
    startDate: "2024-01-01",
    instructions: "Take with breakfast for better absorption",
    sideEffects: [],
    prescribedBy: "Dr. Johnson",
    isActive: true,
    adherenceRate: 88,
  },
  {
    id: 3,
    name: "Metformin",
    dosage: "500mg",
    frequency: "Twice daily",
    times: ["08:00", "20:00"],
    startDate: "2023-12-01",
    instructions: "Take with meals to reduce side effects",
    sideEffects: ["Nausea", "Diarrhea"],
    prescribedBy: "Dr. Wilson",
    refillDate: "2024-01-25",
    isActive: false,
    adherenceRate: 92,
  },
]

export default function MedicationsPage() {
  const [medications, setMedications] = useState<Medication[]>(sampleMedications)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null)
  const [activeTab, setActiveTab] = useState("active")

  const [newMedication, setNewMedication] = useState({
    name: "",
    dosage: "",
    frequency: "",
    times: [""],
    startDate: "",
    endDate: "",
    instructions: "",
    prescribedBy: "",
  })

  const activeMedications = medications.filter((med) => med.isActive)
  const inactiveMedications = medications.filter((med) => !med.isActive)

  const handleAddMedication = () => {
    const medication: Medication = {
      id: Date.now(),
      name: newMedication.name,
      dosage: newMedication.dosage,
      frequency: newMedication.frequency,
      times: newMedication.times.filter((time) => time !== ""),
      startDate: newMedication.startDate,
      endDate: newMedication.endDate || undefined,
      instructions: newMedication.instructions,
      sideEffects: [],
      prescribedBy: newMedication.prescribedBy,
      isActive: true,
      adherenceRate: 100,
    }

    setMedications((prev) => [...prev, medication])
    setNewMedication({
      name: "",
      dosage: "",
      frequency: "",
      times: [""],
      startDate: "",
      endDate: "",
      instructions: "",
      prescribedBy: "",
    })
    setIsAddDialogOpen(false)
  }

  const toggleMedicationStatus = (id: number) => {
    setMedications((prev) => prev.map((med) => (med.id === id ? { ...med, isActive: !med.isActive } : med)))
  }

  const deleteMedication = (id: number) => {
    setMedications((prev) => prev.filter((med) => med.id !== id))
  }

  const getAdherenceColor = (rate: number) => {
    if (rate >= 90) return "text-green-600 bg-green-100"
    if (rate >= 70) return "text-yellow-600 bg-yellow-100"
    return "text-red-600 bg-red-100"
  }

  const addTimeSlot = () => {
    setNewMedication((prev) => ({
      ...prev,
      times: [...prev.times, ""],
    }))
  }

  const updateTimeSlot = (index: number, value: string) => {
    setNewMedication((prev) => ({
      ...prev,
      times: prev.times.map((time, i) => (i === index ? value : time)),
    }))
  }

  const removeTimeSlot = (index: number) => {
    setNewMedication((prev) => ({
      ...prev,
      times: prev.times.filter((_, i) => i !== index),
    }))
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/user">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Calendar
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                  <Pill className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">My Medications</h1>
                  <p className="text-sm text-muted-foreground">Manage your medication schedule</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Medication
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Medication</DialogTitle>
                    <DialogDescription>
                      Enter the details of your new medication. Make sure to include accurate dosage and timing
                      information.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Medication Name</Label>
                        <Input
                          id="name"
                          value={newMedication.name}
                          onChange={(e) => setNewMedication((prev) => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., Aspirin"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dosage">Dosage</Label>
                        <Input
                          id="dosage"
                          value={newMedication.dosage}
                          onChange={(e) => setNewMedication((prev) => ({ ...prev, dosage: e.target.value }))}
                          placeholder="e.g., 100mg"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="frequency">Frequency</Label>
                        <Select
                          value={newMedication.frequency}
                          onValueChange={(value) => setNewMedication((prev) => ({ ...prev, frequency: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="once-daily">Once daily</SelectItem>
                            <SelectItem value="twice-daily">Twice daily</SelectItem>
                            <SelectItem value="three-times-daily">Three times daily</SelectItem>
                            <SelectItem value="four-times-daily">Four times daily</SelectItem>
                            <SelectItem value="as-needed">As needed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="prescribedBy">Prescribed By</Label>
                        <Input
                          id="prescribedBy"
                          value={newMedication.prescribedBy}
                          onChange={(e) => setNewMedication((prev) => ({ ...prev, prescribedBy: e.target.value }))}
                          placeholder="e.g., Dr. Smith"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Times</Label>
                      {newMedication.times.map((time, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            type="time"
                            value={time}
                            onChange={(e) => updateTimeSlot(index, e.target.value)}
                            className="flex-1"
                          />
                          {newMedication.times.length > 1 && (
                            <Button type="button" variant="outline" size="sm" onClick={() => removeTimeSlot(index)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button type="button" variant="outline" size="sm" onClick={addTimeSlot}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Time
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startDate">Start Date</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={newMedication.startDate}
                          onChange={(e) => setNewMedication((prev) => ({ ...prev, startDate: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endDate">End Date (Optional)</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={newMedication.endDate}
                          onChange={(e) => setNewMedication((prev) => ({ ...prev, endDate: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instructions">Instructions</Label>
                      <Textarea
                        id="instructions"
                        value={newMedication.instructions}
                        onChange={(e) => setNewMedication((prev) => ({ ...prev, instructions: e.target.value }))}
                        placeholder="e.g., Take with food, avoid alcohol"
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddMedication}>Add Medication</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Overview Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Pill className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeMedications.length}</p>
                  <p className="text-sm text-muted-foreground">Active Medications</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-100">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {Math.round(
                      activeMedications.reduce((acc, med) => acc + med.adherenceRate, 0) / activeMedications.length ||
                        0,
                    )}
                    %
                  </p>
                  <p className="text-sm text-muted-foreground">Average Adherence</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-yellow-100">
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {
                      medications.filter(
                        (med) =>
                          med.refillDate && new Date(med.refillDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                      ).length
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">Refills Due Soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Medications List */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">Active Medications ({activeMedications.length})</TabsTrigger>
            <TabsTrigger value="inactive">Past Medications ({inactiveMedications.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {activeMedications.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Pill className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Active Medications</h3>
                  <p className="text-muted-foreground mb-4">Add your first medication to get started with tracking.</p>
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Medication
                  </Button>
                </CardContent>
              </Card>
            ) : (
              activeMedications.map((medication) => (
                <Card key={medication.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-full bg-primary/10">
                          <Pill className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-2">
                          <div>
                            <h3 className="text-lg font-semibold">{medication.name}</h3>
                            <p className="text-muted-foreground">
                              {medication.dosage} • {medication.frequency}
                            </p>
                          </div>

                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {medication.times.join(", ")}
                            </div>
                            <div className="flex items-center gap-1">
                              <Info className="h-4 w-4" />
                              {medication.prescribedBy}
                            </div>
                          </div>

                          {medication.instructions && (
                            <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                              {medication.instructions}
                            </p>
                          )}

                          <div className="flex items-center gap-2">
                            <Badge className={getAdherenceColor(medication.adherenceRate)}>
                              {medication.adherenceRate}% Adherence
                            </Badge>
                            {medication.refillDate &&
                              new Date(medication.refillDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
                                <Badge variant="destructive">Refill Due: {medication.refillDate}</Badge>
                              )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => toggleMedicationStatus(medication.id)}>
                          Pause
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => deleteMedication(medication.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="inactive" className="space-y-4">
            {inactiveMedications.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No past medications to display.</p>
                </CardContent>
              </Card>
            ) : (
              inactiveMedications.map((medication) => (
                <Card key={medication.id} className="opacity-75">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-full bg-muted">
                          <Pill className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="space-y-2">
                          <div>
                            <h3 className="text-lg font-semibold">{medication.name}</h3>
                            <p className="text-muted-foreground">
                              {medication.dosage} • {medication.frequency}
                            </p>
                          </div>
                          <Badge variant="secondary">Inactive</Badge>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => toggleMedicationStatus(medication.id)}>
                        Reactivate
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      <AIChatbot />
    </div>
  )
}
