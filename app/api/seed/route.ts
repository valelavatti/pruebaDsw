import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { user as userT, patients as patientsT, doctors as doctorsT } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export const dynamic = "force-dynamic"

type SeedUser = {
  email: string
  password: string
  name: string
  role: "patient" | "doctor" | "admin"
  /** id del registro de dominio a enlazar (patients/doctors) */
  linkPatientId?: string
  linkDoctorId?: string
}

const SEED_USERS: SeedUser[] = [
  {
    email: "paciente@saludplus.com",
    password: "paciente123",
    name: "Juan Pérez",
    role: "patient",
    linkPatientId: "pac-1",
  },
  {
    email: "medico@saludplus.com",
    password: "medico123",
    name: "Dra. María González",
    role: "doctor",
    linkDoctorId: "doc-1",
  },
  {
    email: "admin@saludplus.com",
    password: "admin123",
    name: "Administración SaludPlus",
    role: "admin",
  },
]

export async function GET() {
  const results: string[] = []

  for (const s of SEED_USERS) {
    const existing = await db.select().from(userT).where(eq(userT.email, s.email)).limit(1)

    if (existing.length === 0) {
      try {
        await auth.api.signUpEmail({
          body: { email: s.email, password: s.password, name: s.name },
        })
        results.push(`creado: ${s.email}`)
      } catch (err) {
        results.push(`error al crear ${s.email}: ${(err as Error).message}`)
        continue
      }
    } else {
      results.push(`ya existía: ${s.email}`)
    }

    // Asegurar rol y enlaces de dominio.
    const [row] = await db.select().from(userT).where(eq(userT.email, s.email)).limit(1)
    if (!row) continue

    await db.update(userT).set({ role: s.role }).where(eq(userT.id, row.id))

    if (s.linkPatientId) {
      await db.update(patientsT).set({ userId: row.id }).where(eq(patientsT.id, s.linkPatientId))
    }
    if (s.linkDoctorId) {
      await db.update(doctorsT).set({ userId: row.id }).where(eq(doctorsT.id, s.linkDoctorId))
    }
  }

  return Response.json({ ok: true, results })
}
