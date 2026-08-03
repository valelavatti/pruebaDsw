import "server-only"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"

export type Role = "patient" | "doctor" | "admin"

export type SessionUser = {
  id: string
  name: string
  email: string
  role: Role
  image?: string | null
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null
  const u = session.user as typeof session.user & { role?: string }
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: (u.role as Role) ?? "patient",
    image: u.image,
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) throw new Error("Unauthorized")
  return user
}
