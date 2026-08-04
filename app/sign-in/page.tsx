import Link from "next/link"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { AuthForm } from "@/components/auth/auth-form"
import { AuthShell } from "@/components/auth/auth-shell"
import { DemoCredentials } from "@/components/auth/demo-credentials"

export default async function SignInPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) redirect("/")

  return (
    <AuthShell
      title="Bienvenido de nuevo"
      subtitle="Ingresá a tu cuenta para gestionar tus turnos."
      footer={
        <>
          ¿No tenés cuenta?{" "}
          <Link href="/sign-up" className="font-medium text-primary hover:underline">
            Crear cuenta
          </Link>
        </>
      }
    >
      <AuthForm mode="sign-in" />
      <DemoCredentials />
    </AuthShell>
  )
}
