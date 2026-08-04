import Link from "next/link"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { AuthForm } from "@/components/auth/auth-form"
import { AuthShell } from "@/components/auth/auth-shell"

export default async function SignUpPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) redirect("/")

  return (
    <AuthShell
      title="Crear cuenta"
      subtitle="Registrate para reservar y gestionar turnos médicos."
      footer={
        <>
          ¿Ya tenés cuenta?{" "}
          <Link href="/sign-in" className="font-medium text-primary hover:underline">
            Ingresar
          </Link>
        </>
      }
    >
      <AuthForm mode="sign-up" />
    </AuthShell>
  )
}
