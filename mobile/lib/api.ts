import axios from "axios"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Platform } from "react-native"

// API Base URL - Update this to your Next.js backend URL
// For Android Emulator: use 10.0.2.2 (special IP that maps to host's localhost)
// For iOS Simulator: use localhost
// For Physical Device: use your computer's IP address (e.g., 192.168.1.100)
const API_BASE_URL = __DEV__
  ? "http://172.16.131.10:3000"  // Physical device - use your computer's local IP
  : "https://your-production-url.com" // Update for production

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor - Add auth token if available
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("patient_token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      await AsyncStorage.removeItem("patient_token")
    }
    return Promise.reject(error)
  }
)

export default api

// API endpoints
export const patientAPI = {
  // Auth
  login: (email: string, password: string) =>
    api.post("/api/patient/auth/login", { email, password }),

  // Profile
  getProfile: () => api.get("/api/patient/profile"),

  // Calendar
  getCalendar: (patientId: string) =>
    api.get(`/api/prescriptions/calendar?patientId=${patientId}`),

  // Medications
  markAsTaken: (medicationId: string) =>
    api.patch(`/api/medications/${medicationId}/taken`, { taken: true }),

  // Prescriptions
  getPrescriptions: () => api.get("/api/patient/prescriptions"),
}

