import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"

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
        id: { label: "Doctor ID", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const doctorId = credentials.id?.toString().trim().toUpperCase()
        const password = credentials.password?.toString()

        if (!doctorId || !password) {
          return null
        }

        const doctor = doctorAccounts.find(
          (account) => account.id.toUpperCase() === doctorId && account.password === password,
        )

        if (!doctor) {
          return null
        }

        return {
          id: doctor.id,
          name: doctor.name ?? doctor.id,
          role: "doctor" as const,
        }
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        const role = ((user as { role?: "doctor" | "patient" }).role ?? "doctor") as "doctor" | "patient"
        token.role = role
        token.userId = user.id
      }
      return token
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = (token.userId as string) ?? session.user.id
        session.user.role = (token.role as "doctor" | "patient") ?? "doctor"
      }
      return session
    },
  },
}


