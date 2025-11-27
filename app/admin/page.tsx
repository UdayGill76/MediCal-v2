"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Users, UserPlus, Stethoscope, Search, LogOut, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function AdminDashboard() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [activeTab, setActiveTab] = useState("doctors")
    const [isLoading, setIsLoading] = useState(true)

    // Data states
    const [doctors, setDoctors] = useState<any[]>([])
    const [patients, setPatients] = useState<any[]>([])

    // Doctor Form states
    const [isAddDoctorOpen, setIsAddDoctorOpen] = useState(false)
    const [newDoctor, setNewDoctor] = useState({ name: "", staffId: "", password: "" })
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Patient Details states
    const [selectedPatient, setSelectedPatient] = useState<any>(null)
    const [isPatientDetailsOpen, setIsPatientDetailsOpen] = useState(false)

    // Edit/Delete states
    const [isEditDoctorOpen, setIsEditDoctorOpen] = useState(false)
    const [editingDoctor, setEditingDoctor] = useState<any>(null)
    const [isEditPatientOpen, setIsEditPatientOpen] = useState(false)
    const [editingPatient, setEditingPatient] = useState<any>(null)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [deletingItem, setDeletingItem] = useState<{ type: 'doctor' | 'patient', id: string, name: string } | null>(null)

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login")
        } else if (status === "authenticated") {
            if ((session?.user as any)?.role !== "admin") {
                router.push("/") // Redirect non-admins
            } else {
                fetchData()
            }
        }
    }, [status, session, router])

    const fetchData = async () => {
        setIsLoading(true)
        try {
            // Fetch Doctors
            const doctorsRes = await fetch("/api/admin/doctors")
            const doctorsData = await doctorsRes.json()
            if (doctorsData.success) setDoctors(doctorsData.doctors)

            // Fetch Patients
            const patientsRes = await fetch("/api/admin/patients")
            const patientsData = await patientsRes.json()
            if (patientsData.success) setPatients(patientsData.patients)

        } catch (error) {
            console.error("Error fetching data:", error)
            toast.error("Failed to load dashboard data")
        } finally {
            setIsLoading(false)
        }
    }

    const handleAddDoctor = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            const res = await fetch("/api/admin/doctors", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newDoctor),
            })
            const data = await res.json()

            if (data.success) {
                toast.success("Doctor added successfully")
                setIsAddDoctorOpen(false)
                setNewDoctor({ name: "", staffId: "", password: "" })
                fetchData() // Refresh list
            } else {
                toast.error(data.message || "Failed to add doctor")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEditDoctor = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            const res = await fetch(`/api/admin/doctors/${editingDoctor.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: editingDoctor.name,
                    password: editingDoctor.password || undefined // Only send if changed
                }),
            })
            const data = await res.json()

            if (data.success) {
                toast.success("Doctor updated successfully")
                setIsEditDoctorOpen(false)
                setEditingDoctor(null)
                fetchData()
            } else {
                toast.error(data.message || "Failed to update doctor")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleEditPatient = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            const res = await fetch(`/api/admin/patients/${editingPatient.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: editingPatient.name,
                    email: editingPatient.email,
                    phone: editingPatient.phone,
                    notes: editingPatient.notes
                }),
            })
            const data = await res.json()

            if (data.success) {
                toast.success("Patient updated successfully")
                setIsEditPatientOpen(false)
                setEditingPatient(null)
                fetchData()
            } else {
                toast.error(data.message || "Failed to update patient")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async () => {
        if (!deletingItem) return
        setIsSubmitting(true)
        try {
            const endpoint = deletingItem.type === 'doctor'
                ? `/api/admin/doctors/${deletingItem.id}`
                : `/api/admin/patients/${deletingItem.id}`

            const res = await fetch(endpoint, { method: "DELETE" })
            const data = await res.json()

            if (data.success) {
                toast.success(`${deletingItem.type === 'doctor' ? 'Doctor' : 'Patient'} deleted successfully`)
                setIsDeleteDialogOpen(false)
                setDeletingItem(null)
                fetchData()
            } else {
                toast.error(data.message || "Failed to delete item")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (status === "loading" || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b bg-card">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary/10 p-2 rounded-lg">
                            <Users className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Admin Portal</h1>
                            <p className="text-xs text-muted-foreground">System Administration</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-medium">{session?.user?.name}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => router.push("/api/auth/signout")}>
                            <LogOut className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                {/* Stats Overview */}
                <div className="flex flex-col md:flex-row justify-center gap-6 mb-8">
                    <Card className="w-full md:w-[300px]">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Doctors</CardTitle>
                            <Stethoscope className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{doctors.length}</div>
                        </CardContent>
                    </Card>
                    <Card className="w-full md:w-[300px]">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{patients.length}</div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="doctors">Doctors Management</TabsTrigger>
                        <TabsTrigger value="patients">All Patients</TabsTrigger>
                    </TabsList>

                    {/* Doctors Tab */}
                    <TabsContent value="doctors" className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold tracking-tight">Doctors</h2>
                            <Dialog open={isAddDoctorOpen} onOpenChange={setIsAddDoctorOpen}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Add Doctor
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add New Doctor</DialogTitle>
                                        <DialogDescription>
                                            Create a new doctor account. They will use the Staff ID to login.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleAddDoctor} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Full Name</Label>
                                            <Input
                                                id="name"
                                                value={newDoctor.name}
                                                onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })}
                                                placeholder="Dr. John Doe"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="staffId">Staff ID</Label>
                                            <Input
                                                id="staffId"
                                                value={newDoctor.staffId}
                                                onChange={(e) => setNewDoctor({ ...newDoctor, staffId: e.target.value.toUpperCase() })}
                                                placeholder="DOC-2024-XXX"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="password">Password</Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                value={newDoctor.password}
                                                onChange={(e) => setNewDoctor({ ...newDoctor, password: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                                            {isSubmitting ? "Creating..." : "Create Account"}
                                        </Button>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <Card>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Staff ID</TableHead>
                                        <TableHead>Patients</TableHead>
                                        <TableHead>Joined</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {doctors.map((doctor) => (
                                        <TableRow key={doctor.id}>
                                            <TableCell className="font-medium">{doctor.name}</TableCell>
                                            <TableCell><Badge variant="outline">{doctor.staffId}</Badge></TableCell>
                                            <TableCell>{doctor._count?.patients || 0}</TableCell>
                                            <TableCell>{new Date(doctor.createdAt).toLocaleDateString()}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setEditingDoctor({ ...doctor, password: "" })
                                                            setIsEditDoctorOpen(true)
                                                        }}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => {
                                                            setDeletingItem({ type: 'doctor', id: doctor.id, name: doctor.name })
                                                            setIsDeleteDialogOpen(true)
                                                        }}
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {doctors.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                No doctors found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </Card>
                    </TabsContent>

                    {/* Patients Tab */}
                    <TabsContent value="patients" className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold tracking-tight">All Patients</h2>
                            <div className="relative w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Search patients..." className="pl-8" />
                            </div>
                        </div>

                        <Card>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Assigned Doctor</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Phone</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {patients.map((patient) => (
                                        <TableRow key={patient.id}>
                                            <TableCell className="font-medium">{patient.name}</TableCell>
                                            <TableCell>
                                                {patient.doctor ? (
                                                    <div className="flex items-center gap-2">
                                                        <Stethoscope className="h-3 w-3 text-muted-foreground" />
                                                        <span className="text-sm">{patient.doctor.name}</span>
                                                    </div>
                                                ) : "Unassigned"}
                                            </TableCell>
                                            <TableCell>{patient.email || "-"}</TableCell>
                                            <TableCell>{patient.phone || "-"}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedPatient(patient)
                                                            setIsPatientDetailsOpen(true)
                                                        }}
                                                    >
                                                        View
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setEditingPatient(patient)
                                                            setIsEditPatientOpen(true)
                                                        }}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => {
                                                            setDeletingItem({ type: 'patient', id: patient.id, name: patient.name })
                                                            setIsDeleteDialogOpen(true)
                                                        }}
                                                    >
                                                        Delete
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Edit Doctor Dialog */}
                <Dialog open={isEditDoctorOpen} onOpenChange={setIsEditDoctorOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Doctor</DialogTitle>
                            <DialogDescription>Update doctor details. Leave password blank to keep current one.</DialogDescription>
                        </DialogHeader>
                        {editingDoctor && (
                            <form onSubmit={handleEditDoctor} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Full Name</Label>
                                    <Input
                                        value={editingDoctor.name}
                                        onChange={(e) => setEditingDoctor({ ...editingDoctor, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>New Password (Optional)</Label>
                                    <Input
                                        type="password"
                                        value={editingDoctor.password}
                                        onChange={(e) => setEditingDoctor({ ...editingDoctor, password: e.target.value })}
                                        placeholder="Leave blank to keep current"
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting ? "Saving..." : "Save Changes"}
                                </Button>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Edit Patient Dialog */}
                <Dialog open={isEditPatientOpen} onOpenChange={setIsEditPatientOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Edit Patient</DialogTitle>
                        </DialogHeader>
                        {editingPatient && (
                            <form onSubmit={handleEditPatient} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Full Name</Label>
                                    <Input
                                        value={editingPatient.name}
                                        onChange={(e) => setEditingPatient({ ...editingPatient, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input
                                        value={editingPatient.email || ""}
                                        onChange={(e) => setEditingPatient({ ...editingPatient, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Phone</Label>
                                    <Input
                                        value={editingPatient.phone || ""}
                                        onChange={(e) => setEditingPatient({ ...editingPatient, phone: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Notes</Label>
                                    <Input
                                        value={editingPatient.notes || ""}
                                        onChange={(e) => setEditingPatient({ ...editingPatient, notes: e.target.value })}
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting ? "Saving..." : "Save Changes"}
                                </Button>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the account for <strong>{deletingItem?.name}</strong> and remove their data from our servers.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={(e) => {
                                    e.preventDefault()
                                    handleDelete()
                                }}
                                disabled={isSubmitting}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                {isSubmitting ? "Deleting..." : "Delete"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Patient Details Dialog */}
                <Dialog open={isPatientDetailsOpen} onOpenChange={setIsPatientDetailsOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Patient Details</DialogTitle>
                            <DialogDescription>
                                Full medical record for {selectedPatient?.name}
                            </DialogDescription>
                        </DialogHeader>
                        {selectedPatient && (
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-muted-foreground">Full Name</Label>
                                        <div className="font-medium">{selectedPatient.name}</div>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Patient ID</Label>
                                        <div className="font-medium">{selectedPatient.externalId}</div>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Assigned Doctor</Label>
                                        <div className="font-medium">{selectedPatient.doctor?.name}</div>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Date of Birth</Label>
                                        <div className="font-medium">
                                            {selectedPatient.dateOfBirth ? new Date(selectedPatient.dateOfBirth).toLocaleDateString() : "-"}
                                        </div>
                                    </div>
                                </div>

                                {selectedPatient.notes && (
                                    <div>
                                        <Label className="text-muted-foreground">Medical Notes</Label>
                                        <Card className="mt-1 bg-muted/50">
                                            <CardContent className="p-3 text-sm">
                                                {selectedPatient.notes}
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </main>
        </div>
    )
}
