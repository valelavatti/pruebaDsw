import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { user as userT } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"

const VALID_ROLES = new Set(["patient", "doctor", "admin"])

/**
 * Persiste el rol elegido durante el registro. Solo se permite establecer el
 * rol una vez, inmediatamente después del sign-up (cuando sigue siendo el
 * valor por defecto "patient"), para evitar auto-escalado de privilegios.
 */
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }

  const { role } = (await req.json()) as { role?: string }
  if (!role || !VALID_ROLES.has(role)) {
    return Response.json({ ok: false, error: "Rol inválido" }, { status: 400 })
  }

  const [row] = await db.select().from(userT).where(eq(userT.id, session.user.id)).limit(1)
  if (!row) {
    return Response.json({ ok: false, error: "Usuario no encontrado" }, { status: 404 })
  }

  await db.update(userT).set({ role }).where(eq(userT.id, session.user.id))

  return Response.json({ ok: true })
}
