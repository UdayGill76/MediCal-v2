import { useState, useEffect, useCallback, useRef } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions, Modal } from "react-native"
import { Calendar } from "react-native-calendars"
import { useAuth } from "../hooks/useAuth"
import { useFocusEffect } from "@react-navigation/native"
import { API_CONFIG } from "../lib/config"

const SCREEN_WIDTH = Dimensions.get('window').width
const ITEM_WIDTH = SCREEN_WIDTH * 0.6 // Center item takes 60% of screen
const SIDE_ITEM_WIDTH = SCREEN_WIDTH * 0.2 // Side items take 20% each

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

type DayData = {
  date: string
  dayNumber: number
  dayName: string
  monthName: string
  isToday: boolean
}

export default function CalendarScreen() {
  const { patient, logout } = useAuth()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [calendarData, setCalendarData] = useState<CalendarResponse>({})
  const [isLoading, setIsLoading] = useState(false)
  const [days, setDays] = useState<DayData[]>([])
  const [showMonthlyView, setShowMonthlyView] = useState(false)
  const scrollViewRef = useRef<ScrollView>(null)

  // API Base URL
  const API_BASE_URL = API_CONFIG.BASE_URL

  const fetchCalendarData = async () => {
    if (!patient?.externalId) return

    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/prescriptions/calendar?patientId=${patient.externalId}`)
      const data = await response.json()

      if (data.success) {
        setCalendarData(data.calendar)
      }
    } catch (error) {
      console.error("Error fetching calendar:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleTaken = async (scheduleId: string, taken: boolean) => {
    // Optimistic update
    const updatedCalendar = { ...calendarData }
    Object.keys(updatedCalendar).forEach(date => {
      updatedCalendar[date] = updatedCalendar[date].map(med => {
        if (med.id === scheduleId) {
          return { ...med, taken }
        }
        return med
      })
    })
    setCalendarData(updatedCalendar)

    try {
      const response = await fetch(`${API_BASE_URL}/api/prescriptions/schedule/${scheduleId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ taken }),
      })

      const data = await response.json()
      if (!data.success) {
        // Revert on failure
        fetchCalendarData()
        alert("Failed to update status")
      }
    } catch (error) {
      console.error("Error updating status:", error)
      fetchCalendarData() // Revert
      alert("Error updating status")
    }
  }

  useFocusEffect(
    useCallback(() => {
      fetchCalendarData()
    }, [patient?.externalId])
  )

  // Generate days for carousel (60 days: 30 before, today, 29 after)
  useEffect(() => {
    const generateDays = () => {
      const today = new Date()
      const daysArray: DayData[] = []

      for (let i = -30; i <= 29; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() + i)

        const dateString = date.toISOString().split("T")[0]
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

        daysArray.push({
          date: dateString,
          dayNumber: date.getDate(),
          dayName: dayNames[date.getDay()],
          monthName: monthNames[date.getMonth()],
          isToday: i === 0
        })
      }

      setDays(daysArray)
    }

    generateDays()
  }, [])

  // Auto-scroll to today on mount
  useEffect(() => {
    if (days.length > 0 && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ x: 30 * SCREEN_WIDTH, animated: false })
      }, 100)
    }
  }, [days])

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x
    const index = Math.round(offsetX / SCREEN_WIDTH)

    if (days[index] && days[index].date !== selectedDate) {
      setSelectedDate(days[index].date)
    }
  }

  // Process calendar data for monthly view
  const processCalendarMarks = () => {
    const marks: any = {}

    Object.keys(calendarData).forEach((date) => {
      const medications = calendarData[date]
      if (medications.length > 0) {
        const dots = medications.slice(0, 3).map((med) => {
          let color = "#3b82f6"
          if (med.type === "capsule") color = "#8b5cf6"
          else if (med.type === "liquid") color = "#06b6d4"
          else if (med.type === "injection") color = "#ef4444"
          else if (med.type === "topical") color = "#10b981"
          if (med.taken) color = "#94a3b8"

          return { key: med.id, color }
        })

        marks[date] = {
          dots,
          selected: date === selectedDate,
          selectedColor: date === selectedDate ? "#059669" : undefined,
        }
      }
    })

    // Mark today
    const today = new Date().toISOString().split("T")[0]
    if (!marks[today]) {
      marks[today] = { marked: true, dotColor: "#059669" }
    }

    return marks
  }

  const selectedMedications = calendarData[selectedDate] || []

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Medications</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            onPress={() => setShowMonthlyView(true)}
            style={styles.monthViewButton}
          >
            <Text style={styles.monthViewText}>📅</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={logout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Carousel Date Picker */}
      <View style={styles.carouselContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          decelerationRate="fast"
          snapToInterval={SCREEN_WIDTH}
          contentContainerStyle={styles.carouselContent}
        >
          {days.map((day, index) => {
            const isSelected = day.date === selectedDate
            const medications = calendarData[day.date] || []

            return (
              <View key={day.date} style={styles.carouselItem}>
                <View style={[styles.dateCard, isSelected && styles.dateCardSelected]}>
                  <Text style={[styles.monthText, isSelected && styles.monthTextSelected]}>
                    {day.monthName}
                  </Text>
                  <Text style={[styles.dateNumber, isSelected && styles.dateNumberSelected]}>
                    {day.dayNumber}
                  </Text>
                  <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                    {day.dayName}
                  </Text>

                  {/* Medication indicators */}
                  {medications.length > 0 && (
                    <View style={styles.medicationIndicators}>
                      {medications.slice(0, 4).map((med, idx) => {
                        let color = "#3b82f6"
                        if (med.type === "capsule") color = "#8b5cf6"
                        else if (med.type === "liquid") color = "#06b6d4"
                        else if (med.type === "injection") color = "#ef4444"
                        else if (med.type === "topical") color = "#10b981"
                        if (med.taken) color = "#94a3b8"

                        return (
                          <View
                            key={idx}
                            style={[
                              styles.medLine,
                              { backgroundColor: color },
                              isSelected && styles.medLineSelected
                            ]}
                          />
                        )
                      })}
                    </View>
                  )}
                </View>
              </View>
            )
          })}
        </ScrollView>
      </View>

      {/* Medication List for Selected Day */}
      <View style={styles.scheduleContainer}>
        <Text style={styles.scheduleTitle}>
          Today's Schedule
        </Text>

        {isLoading ? (
          <ActivityIndicator color="#059669" style={{ marginTop: 20 }} />
        ) : (
          <ScrollView style={styles.medicationList} showsVerticalScrollIndicator={false}>
            {selectedMedications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No medications scheduled</Text>
              </View>
            ) : (
              selectedMedications.map((med) => (
                <View key={med.id} style={styles.medicationCard}>
                  <View style={styles.medHeader}>
                    <View style={styles.medInfo}>
                      <Text style={styles.medName}>{med.name}</Text>
                      <Text style={styles.medDosage}>{med.dosage}</Text>
                    </View>
                    <Text style={styles.medTime}>{med.time}</Text>
                  </View>
                  {med.instructions && (
                    <Text style={styles.medInstructions}>{med.instructions}</Text>
                  )}
                  <View style={styles.cardFooter}>
                    <View style={[styles.statusBadge, med.taken ? styles.takenBadge : styles.pendingBadge]}>
                      <Text style={[styles.statusText, med.taken ? styles.takenText : styles.pendingText]}>
                        {med.taken ? "✓ Taken" : "Pending"}
                      </Text>
                    </View>

                    {!med.taken && (
                      <TouchableOpacity
                        style={styles.markTakenButton}
                        onPress={() => handleToggleTaken(med.id, true)}
                      >
                        <Text style={styles.markTakenText}>Mark as Taken</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        )}
      </View>

      {/* Monthly Calendar Modal */}
      <Modal
        visible={showMonthlyView}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowMonthlyView(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Monthly Overview</Text>
            <TouchableOpacity onPress={() => setShowMonthlyView(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Calendar
              current={selectedDate}
              markingType="multi-dot"
              markedDates={processCalendarMarks()}
              onDayPress={(day) => {
                setSelectedDate(day.dateString)
                setShowMonthlyView(false)
              }}
              theme={{
                todayTextColor: "#059669",
                selectedDayBackgroundColor: "#059669",
                selectedDayTextColor: "#ffffff",
                arrowColor: "#059669",
                monthTextColor: "#0f172a",
                textMonthFontWeight: "bold",
                textMonthFontSize: 18,
              }}
            />

            <View style={styles.legendContainer}>
              <Text style={styles.legendTitle}>Medication Types</Text>
              <View style={styles.legendGrid}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: "#3b82f6" }]} />
                  <Text style={styles.legendText}>Tablet/Pill</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: "#8b5cf6" }]} />
                  <Text style={styles.legendText}>Capsule</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: "#06b6d4" }]} />
                  <Text style={styles.legendText}>Liquid</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: "#ef4444" }]} />
                  <Text style={styles.legendText}>Injection</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: "#10b981" }]} />
                  <Text style={styles.legendText}>Topical</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: "#94a3b8" }]} />
                  <Text style={styles.legendText}>Taken</Text>
                </View>
              </View>
            </View>

            {/* Show medications for selected date in modal */}
            {selectedMedications.length > 0 && (
              <View style={styles.modalMedicationList}>
                <Text style={styles.modalMedicationTitle}>
                  Medications for {new Date(selectedDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </Text>
                {selectedMedications.map((med) => (
                  <View key={med.id} style={styles.modalMedicationCard}>
                    <Text style={styles.modalMedName}>{med.name}</Text>
                    <Text style={styles.modalMedDetails}>{med.dosage} • {med.time}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
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
  headerButtons: {
    flexDirection: "row",
    gap: 8,
  },
  monthViewButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "transparent",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#059669",
  },
  monthViewText: {
    color: "#059669",
    fontSize: 13,
    fontWeight: "600",
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "600",
  },
  carouselContainer: {
    height: 200,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  carouselContent: {
    alignItems: "center",
  },
  carouselItem: {
    width: SCREEN_WIDTH,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  dateCard: {
    width: 140,
    height: 160,
    backgroundColor: "#f1f5f9",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e2e8f0",
  },
  dateCardSelected: {
    width: 180,
    height: 180,
    backgroundColor: "#059669",
    borderColor: "#059669",
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  monthText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  monthTextSelected: {
    color: "#dcfce7",
    fontSize: 16,
  },
  dateNumber: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#0f172a",
    marginVertical: 4,
  },
  dateNumberSelected: {
    fontSize: 64,
    color: "#fff",
  },
  dayText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  dayTextSelected: {
    fontSize: 16,
    color: "#dcfce7",
    fontWeight: "600",
  },
  medicationIndicators: {
    flexDirection: "row",
    gap: 4,
    marginTop: 12,
  },
  medLine: {
    width: 20,
    height: 3,
    borderRadius: 2,
  },
  medLineSelected: {
    width: 24,
    height: 4,
  },
  scheduleContainer: {
    flex: 1,
    padding: 20,
  },
  scheduleTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 16,
  },
  medicationList: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    color: "#94a3b8",
    fontSize: 16,
    fontStyle: "italic",
  },
  medicationCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  medHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  medInfo: {
    flex: 1,
  },
  medName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 4,
  },
  medDosage: {
    fontSize: 14,
    color: "#64748b",
  },
  medTime: {
    fontSize: 16,
    fontWeight: "600",
    color: "#059669",
  },
  medInstructions: {
    fontSize: 14,
    color: "#64748b",
    fontStyle: "italic",
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  takenBadge: {
    backgroundColor: "#dcfce7",
  },
  pendingBadge: {
    backgroundColor: "#fee2e2",
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
  },
  takenText: {
    color: "#166534",
  },
  pendingText: {
    color: "#991b1b",
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0f172a",
  },
  closeButton: {
    fontSize: 28,
    color: "#64748b",
    fontWeight: "300",
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  legendContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 12,
  },
  legendGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    width: "45%",
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 13,
    color: "#64748b",
  },
  modalMedicationList: {
    marginTop: 24,
  },
  modalMedicationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 12,
  },
  modalMedicationCard: {
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  modalMedName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 4,
  },
  modalMedDetails: {
    fontSize: 13,
    color: "#64748b",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  markTakenButton: {
    backgroundColor: "#059669",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  markTakenText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
})
