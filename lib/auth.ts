import { betterAuth } from "better-auth"
import { createHash } from "crypto"
import { pool } from "@/lib/db"

/**
 * Secret estable para firmar sesiones.
 * Preferimos BETTER_AUTH_SECRET; si no está definido (en el preview la variable
 * puede no persistir entre sincronizaciones), derivamos un valor determinístico
 * a partir de DATABASE_URL —que sí es estable en el proyecto— para que las
 * sesiones no se invaliden en cada recarga del servidor.
 */
function resolveAuthSecret() {
  if (process.env.BETTER_AUTH_SECRET) return process.env.BETTER_AUTH_SECRET
  const seed = process.env.DATABASE_URL ?? "saludplus-dev-seed"
  return createHash("sha256").update(`saludplus:${seed}`).digest("base64")
}

export const auth = betterAuth({
  database: pool,
  secret: resolveAuthSecret(),
  baseURL:
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.V0_RUNTIME_URL),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "patient",
        input: false,
      },
    },
  },
  trustedOrigins: [
    ...(process.env.V0_RUNTIME_URL ? [process.env.V0_RUNTIME_URL] : []),
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]
      : []),
    ...(process.env.NODE_ENV === "development"
      ? ["http://localhost:3000", "http://127.0.0.1:3000"]
      : []),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 días
    updateAge: 60 * 60 * 24, // 1 día
  },
  ...(process.env.NODE_ENV === "development"
    ? {
        advanced: {
          // En dev (iframe del preview de v0) forzamos cookies cross-site
          // para que el navegador conserve la cookie de sesión.
          defaultCookieAttributes: {
            sameSite: "none" as const,
            secure: true,
          },
        },
      }
    : {}),
})
