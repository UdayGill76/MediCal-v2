import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      role: "doctor" | "patient"
    }
  }

  interface User {
    id: string
    role: "doctor" | "patient"
    name?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string
    role?: "doctor" | "patient"
  }
}


