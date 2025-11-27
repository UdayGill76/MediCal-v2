import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

type DoctorAccount = {
  id: string
  password: string
  name?: string
}

const DEFAULT_DOCTOR_ACCOUNTS: DoctorAccount[] = [
  {
    id: "DOC-2024-001",
    password: "demo123",
    name: "Demo Doctor",
  },
]

function getDoctorAccounts(): DoctorAccount[] {
  const source = process.env.DOCTOR_ACCOUNTS

  if (!source) {
    return DEFAULT_DOCTOR_ACCOUNTS
  }

  try {
    const parsed = JSON.parse(source) as DoctorAccount[]
    const isValidArray =
      Array.isArray(parsed) &&
      parsed.length > 0 &&
      parsed.every((item) => typeof item?.id === "string" && typeof item?.password === "string")

    if (isValidArray) {
      return parsed
    }

    console.warn("DOCTOR_ACCOUNTS does not contain any valid entries. Falling back to default credentials.")
  } catch (error) {
    console.warn("Failed to parse DOCTOR_ACCOUNTS. Falling back to default credentials.", error)
  }

  return DEFAULT_DOCTOR_ACCOUNTS
}

const doctorAccounts = getDoctorAccounts()

export const authConfig: NextAuthConfig = {
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        id: { label: "User ID", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const userId = credentials.id?.toString().trim()
        const password = credentials.password?.toString()

        if (!userId || !password) {
          return null
        }

        // 1. Check for Admin
        if (userId === "ADMIN" && password === "admin123") {
          return {
            id: "ADMIN",
            name: "Administrator",
            role: "admin",
          } as any
        }

        // 2. Check Database for Doctor
        try {
          const doctor = await prisma.doctor.findUnique({
            where: { staffId: userId.toUpperCase() },
          })

          if (doctor && doctor.passwordHash) {
            const isValid = await bcrypt.compare(password, doctor.passwordHash)
            if (isValid) {
              return {
                id: doctor.staffId,
                name: doctor.name,
                role: "doctor",
              } as any
            }
          }
        } catch (error) {
          console.error("Error fetching doctor from DB:", error)
        }

        // 3. Fallback to hardcoded/env doctors (Legacy support)
        const legacyDoctor = doctorAccounts.find(
          (account) => account.id.toUpperCase() === userId.toUpperCase() && account.password === password,
        )

        if (legacyDoctor) {
          return {
            id: legacyDoctor.id,
            name: legacyDoctor.name ?? legacyDoctor.id,
            role: "doctor",
          } as any
        }

        return null
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = user.role
        token.userId = user.id
      }
      return token
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = (token.userId as string) || session.user.id
        session.user.role = (token.role as any) || "doctor"
      }
      return session
    },
  },
}


