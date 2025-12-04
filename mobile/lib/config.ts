import { Platform } from "react-native"
import Constants from "expo-constants"

/**
 * App Configuration
 */

// Dynamic API Configuration
const getApiBaseUrl = () => {
  if (__DEV__) {
    console.log("Device Info:", {
      os: Platform.OS,
      isDevice: Constants.isDevice,
      hostUri: Constants.expoConfig?.hostUri
    })

    // 1. Try to get IP from Expo config (works for physical device & simulators)
    const debuggerHost = Constants.expoConfig?.hostUri
    if (debuggerHost) {
      const ip = debuggerHost.split(':')[0]
      return `http://${ip}:3000`
    }

    // 2. Fallback for specific environments if hostUri is missing
    if (Platform.OS === 'android' && !Constants.isDevice) {
      return "http://10.0.2.2:3000"
    }

    if (Platform.OS === 'ios' && !Constants.isDevice) {
      return "http://localhost:3000"
    }
  }

  // Fallback to last known IP
  return "http://172.20.10.2:3000"
}

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
}

console.log("Final API URL:", API_CONFIG.BASE_URL)

// Storage Keys
export const STORAGE_KEYS = {
  PATIENT_TOKEN: "patient_token",
  PATIENT_ID: "patient_id",
  PATIENT_EXTERNAL_ID: "patient_external_id",
  PATIENT_EMAIL: "patient_email",
}
