import { useState, useEffect, useCallback, useRef } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions } from "react-native"
import { useAuth } from "../hooks/useAuth"
import { useFocusEffect } from "@react-navigation/native"

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
  const scrollViewRef = useRef<ScrollView>(null)

  // API Base URL - Updated to match your local network
  const API_BASE_URL = "http://172.16.133.69:3000"

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

  const selectedMedications = calendarData[selectedDate] || []

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Medications</Text>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
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
                  <View style={[styles.statusBadge, med.taken ? styles.takenBadge : styles.pendingBadge]}>
                    <Text style={[styles.statusText, med.taken ? styles.takenText : styles.pendingText]}>
                      {med.taken ? "✓ Taken" : "Pending"}
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
})
