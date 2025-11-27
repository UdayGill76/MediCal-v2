import { DefaultSession } from "next-auth"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            role: "doctor" | "patient" | "admin"
        } & DefaultSession["user"]
    }

    interface User {
        role: "doctor" | "patient" | "admin"
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role: "doctor" | "patient" | "admin"
        userId: string
    }
}
