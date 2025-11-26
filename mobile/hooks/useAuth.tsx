import { useState, useEffect, createContext, useContext, ReactNode } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { STORAGE_KEYS } from "../lib/config"
import { Platform } from "react-native"

// API Base URL - using specific local IP for Expo Go
const API_BASE_URL = __DEV__
  ? "http://172.16.131.10:3000" // Your WiFi IP address
  : "https://your-production-url.com"

type Patient = {
  id: string
  externalId: string | null
  email: string
  name: string
}

type AuthContextType = {
  patient: Patient | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [patient, setPatient] = useState<Patient | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadStoredAuth()
  }, [])

  const loadStoredAuth = async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.PATIENT_TOKEN)
      const patientId = await AsyncStorage.getItem(STORAGE_KEYS.PATIENT_ID)
      const externalId = await AsyncStorage.getItem(STORAGE_KEYS.PATIENT_EXTERNAL_ID)
      const email = await AsyncStorage.getItem(STORAGE_KEYS.PATIENT_EMAIL)

      if (token && patientId && email) {
        setPatient({ id: patientId, externalId: externalId, email, name: "" }) // Name will be fetched from profile
      }
    } catch (error) {
      console.error("Error loading stored auth:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/patient/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Login failed")
      }

      // Store auth data
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.PATIENT_TOKEN, "authenticated"], // Simple token for now
        [STORAGE_KEYS.PATIENT_ID, data.patient.id],
        [STORAGE_KEYS.PATIENT_EXTERNAL_ID, data.patient.externalId || data.patient.id],
        [STORAGE_KEYS.PATIENT_EMAIL, data.patient.email],
      ])

      // Update patient state
      setPatient({
        id: data.patient.id,
        externalId: data.patient.externalId,
        email: data.patient.email,
        name: data.patient.name,
      })
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }

  const logout = async () => {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.PATIENT_TOKEN,
      STORAGE_KEYS.PATIENT_ID,
      STORAGE_KEYS.PATIENT_EXTERNAL_ID,
      STORAGE_KEYS.PATIENT_EMAIL,
    ])
    setPatient(null)
  }

  return (
    <AuthContext.Provider
      value={{
        patient,
        isLoading,
        isAuthenticated: !!patient,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
