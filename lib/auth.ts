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
  // `trustedOrigins` como función: Better Auth la ejecuta en cada verificación
  // de origen y agrega lo que devolvemos a la lista base. OJO: puede llamarse
  // con `request` undefined (p. ej. en tareas internas), así que el acceso a
  // headers debe ser defensivo o el handler devuelve 500.
  //
  // En producción devolvemos SOLO la allowlist explícita. Fuera de producción
  // (incluye el sandbox donde NODE_ENV puede venir sin definir) confiamos en
  // los hosts del preview de v0 —que se sirve dentro de un iframe cuyo host
  // puede ser *.vercel.run o *.vusercontent.net— y, por robustez, en el origen
  // real de la propia request.
  trustedOrigins: (request?: Request) => {
    const base = [
      ...(process.env.V0_RUNTIME_URL ? [process.env.V0_RUNTIME_URL] : []),
      ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
      ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]
        : []),
    ]

    if (process.env.NODE_ENV === "production") return base

    const dynamic: string[] = [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "https://*.vusercontent.net",
      "https://*.vercel.run",
      "https://*.v0.dev",
    ]

    // Origen real de la request (origin o, en su defecto, el del referer).
    // `request` puede venir undefined, por eso el optional chaining.
    const origin = request?.headers?.get("origin")
    if (origin) {
      dynamic.push(origin)
    } else {
      const referer = request?.headers?.get("referer")
      if (referer) {
        try {
          dynamic.push(new URL(referer).origin)
        } catch {
          // referer inválido: lo ignoramos.
        }
      }
    }

    return [...base, ...dynamic]
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 días
    updateAge: 60 * 60 * 24, // 1 día
  },
  ...(process.env.NODE_ENV !== "production"
    ? {
        advanced: {
          // El preview de v0 renderiza la app dentro de un iframe cross-site;
          // sin sameSite:"none"+secure el navegador descarta la cookie de
          // sesión y el usuario aparece siempre deslogueado. NODE_ENV puede
          // venir sin definir en el sandbox, así que aplicamos esto siempre
          // que no sea producción.
          defaultCookieAttributes: {
            sameSite: "none" as const,
            secure: true,
          },
        },
      }
    : {}),
})
