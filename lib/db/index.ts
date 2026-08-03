import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"

/**
 * Adoptamos la semántica libpq para el modo SSL de forma explícita.
 * Neon requiere SSL; con `uselibpqcompat=true&sslmode=require` evitamos el
 * warning de deprecación de pg y mantenemos el comportamiento correcto.
 */
function buildConnectionString() {
  const raw = process.env.DATABASE_URL ?? ""
  if (!raw) return raw
  // Si ya optó por la semántica libpq, no tocamos nada.
  if (/[?&]uselibpqcompat=/.test(raw)) return raw
  const sep = raw.includes("?") ? "&" : "?"
  // Agregamos uselibpqcompat=true; si no había sslmode, fijamos require.
  const extra = /[?&]sslmode=/.test(raw)
    ? "uselibpqcompat=true"
    : "uselibpqcompat=true&sslmode=require"
  return `${raw}${sep}${extra}`
}

export const pool = new Pool({ connectionString: buildConnectionString() })
export const db = drizzle(pool, { schema })
