import { Platform } from "react-native"

/**
 * App Configuration
 */

// API Configuration
// For Android Emulator: use 10.0.2.2 (special IP that maps to host's localhost)
// For iOS Simulator: use localhost
// For Physical Device: use your computer's IP address (e.g., 192.168.1.100)
export const API_CONFIG = {
  BASE_URL: __DEV__
    ? Platform.OS === 'android'
      ? "http://10.0.2.2:3000"  // Android emulator
      : "http://localhost:3000"  // iOS simulator
    : "https://your-production-url.com",
}

// Storage Keys
export const STORAGE_KEYS = {
  PATIENT_TOKEN: "patient_token",
  PATIENT_ID: "patient_id",
  PATIENT_EXTERNAL_ID: "patient_external_id",
  PATIENT_EMAIL: "patient_email",
}
