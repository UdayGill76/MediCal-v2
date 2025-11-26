import { useState, useEffect, useCallback } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native"
import { useAuth } from "../hooks/useAuth"
import { Calendar, DateData } from "react-native-calendars"
import { useFocusEffect } from "@react-navigation/native"

// Define types for our data
type CalendarEntry = {
  id: string
  date: string
  time: string
  taken: boolean
  type: string
  name: string
  dosage: string
  instructions: string | null
  prescriptionId: string
}

type CalendarResponse = {
  [date: string]: CalendarEntry[]
}

export default function CalendarScreen() {
  const { patient, logout } = useAuth()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [calendarData, setCalendarData] = useState<CalendarResponse>({})
  const [isLoading, setIsLoading] = useState(false)
  const [markedDates, setMarkedDates] = useState<any>({})

  // API Base URL - Updated to match your local network
  const API_BASE_URL = "http://172.16.131.10:3000"

  const fetchCalendarData = async () => {
    if (!patient?.externalId) return

    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/prescriptions/calendar?patientId=${patient.externalId}`)
      const data = await response.json()

      if (data.success) {
        setCalendarData(data.calendar)
        processCalendarMarks(data.calendar)
      }
    } catch (error) {
      console.error("Error fetching calendar:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      fetchCalendarData()
    }, [patient?.externalId])
  )

  const processCalendarMarks = (data: CalendarResponse) => {
    const marks: any = {}

    Object.keys(data).forEach(date => {
      const entries = data[date]

      // Create dots for each medication (max 3 visible)
      const dots = entries.slice(0, 3).map((entry, index) => {
        let color = "#3b82f6" // blue for pills

        // Color based on medication type
        if (entry.type === "tablet" || entry.type === "pill") color = "#3b82f6" // blue
        else if (entry.type === "capsule") color = "#8b5cf6" // purple
        else if (entry.type === "liquid") color = "#06b6d4" // cyan
        else if (entry.type === "injection") color = "#ef4444" // red
        else if (entry.type === "topical") color = "#10b981" // green

        // If taken, make it lighter/muted
        if (entry.taken) {
          color = "#94a3b8" // gray for taken
        }

        return { color }
      })

      marks[date] = {
        dots: dots,
        marked: true,
      }
    })

    // Add selected date styling
    const current = marks[selectedDate] || {}
    marks[selectedDate] = {
      ...current,
      selected: true,
      selectedColor: "#059669",
      selectedTextColor: "#ffffff"
    }

    setMarkedDates(marks)
  }

  const onDayPress = (day: DateData) => {
    setSelectedDate(day.dateString)

    // Update selection style
    const marks = { ...markedDates }

    // Remove old selection
    Object.keys(marks).forEach(key => {
      if (marks[key].selected) {
        const { selected, selectedColor, ...rest } = marks[key]
        marks[key] = rest
        if (Object.keys(marks[key]).length === 0) delete marks[key]
      }
    })

    // Add new selection
    marks[day.dateString] = {
      ...(marks[day.dateString] || {}),
      selected: true,
      selectedColor: "#059669"
    }

    setMarkedDates(marks)
  }

  const selectedMedications = calendarData[selectedDate] || []

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Medications</Text>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Calendar
        onDayPress={onDayPress}
        markedDates={markedDates}
        theme={{
          todayTextColor: "#059669",
          arrowColor: "#059669",
          dotColor: "#059669",
          selectedDayBackgroundColor: "#059669",
        }}
      />

      <View style={styles.scheduleContainer}>
        <Text style={styles.dateTitle}>
          Schedule for {selectedDate}
        </Text>

        {isLoading ? (
          <ActivityIndicator color="#059669" style={{ marginTop: 20 }} />
        ) : (
          <ScrollView style={styles.medicationList}>
            {selectedMedications.length === 0 ? (
              <Text style={styles.emptyText}>No medications scheduled for this day.</Text>
            ) : (
              selectedMedications.map((med) => (
                <View key={med.id} style={styles.medicationCard}>
                  <View style={styles.medHeader}>
                    <Text style={styles.medName}>{med.name}</Text>
                    <Text style={styles.medTime}>{med.time}</Text>
                  </View>
                  <Text style={styles.medDosage}>{med.dosage} • {med.type}</Text>
                  {med.instructions && (
                    <Text style={styles.medInstructions}>{med.instructions}</Text>
                  )}
                  <View style={[styles.statusBadge, med.taken ? styles.takenBadge : styles.pendingBadge]}>
                    <Text style={[styles.statusText, med.taken ? styles.takenText : styles.pendingText]}>
                      {med.taken ? "Taken" : "Pending"}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0f172a",
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "600",
  },
  scheduleContainer: {
    flex: 1,
    padding: 20,
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 16,
  },
  medicationList: {
    flex: 1,
  },
  emptyText: {
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 20,
    fontStyle: "italic",
  },
  medicationCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  medHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  medName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
  },
  medTime: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
  },
  medDosage: {
    fontSize: 14,
    color: "#475569",
    marginBottom: 8,
  },
  medInstructions: {
    fontSize: 13,
    color: "#64748b",
    fontStyle: "italic",
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  takenBadge: {
    backgroundColor: "#dcfce7",
  },
  pendingBadge: {
    backgroundColor: "#fee2e2",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  takenText: {
    color: "#166534",
  },
  pendingText: {
    color: "#991b1b",
  },
})
