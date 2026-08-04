"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { Stethoscope, User, ShieldCheck, HeartPulse } from "lucide-react"
import { cn } from "@/lib/utils"

type Mode = "sign-in" | "sign-up"
type Role = "patient" | "doctor" | "admin"

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [role, setRole] = useState<Role>("patient")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === "sign-up") {
        const { error } = await authClient.signUp.email({ email, password, name })
        if (error) throw new Error(error.message || "No se pudo crear la cuenta")
        // Persistir el rol elegido en el registro.
        await fetch("/api/set-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }),
        })
      } else {
        const { error } = await authClient.signIn.email({ email, password })
        if (error) throw new Error(error.message || "Credenciales inválidas")
      }
      router.push("/")
      router.refresh()
    } catch (err) {
      setError((err as Error).message)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        {mode === "sign-up" && (
          <Field>
            <FieldLabel htmlFor="name">Nombre completo</FieldLabel>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Juan Pérez"
              required
            />
          </Field>
        )}

        <Field>
          <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            autoComplete="email"
            required
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="password">Contraseña</FieldLabel>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            minLength={8}
            required
          />
          {mode === "sign-up" && (
            <FieldDescription>Mínimo 8 caracteres.</FieldDescription>
          )}
        </Field>

        {mode === "sign-up" && (
          <Field>
            <FieldLabel>Tipo de cuenta</FieldLabel>
            <ToggleGroup
              value={[role]}
              onValueChange={(v) => {
                const next = v.find((x) => x !== role) ?? v[0]
                if (next) setRole(next as Role)
              }}
              className="grid grid-cols-3 gap-2"
            >
              <RoleOption value="patient" icon={User} label="Paciente" active={role === "patient"} />
              <RoleOption value="doctor" icon={Stethoscope} label="Médico" active={role === "doctor"} />
              <RoleOption value="admin" icon={ShieldCheck} label="Admin" active={role === "admin"} />
            </ToggleGroup>
          </Field>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading && <Spinner data-icon="inline-start" />}
          {mode === "sign-in" ? "Ingresar" : "Crear cuenta"}
        </Button>
      </FieldGroup>
    </form>
  )
}

function RoleOption({
  value,
  icon: Icon,
  label,
  active,
}: {
  value: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  active: boolean
}) {
  return (
    <ToggleGroupItem
      value={value}
      className={cn(
        "flex h-auto flex-col gap-1.5 rounded-lg border py-3 data-[pressed]:border-primary data-[pressed]:bg-accent",
        active && "border-primary bg-accent",
      )}
    >
      <Icon className="size-5" />
      <span className="text-xs font-medium">{label}</span>
    </ToggleGroupItem>
  )
}
