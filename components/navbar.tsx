"use client"

import { Activity, Bell, ChevronDown, LogOut, Settings, User } from "lucide-react"
import type { Role } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface RoleMeta {
  role: Role
  label: string
  person: string
  avatar?: string
  initials: string
}

const roleMeta: Record<Role, RoleMeta> = {
  patient: {
    role: "patient",
    label: "Paciente",
    person: "Lucía Fernández",
    initials: "LF",
  },
  doctor: {
    role: "doctor",
    label: "Profesional",
    person: "Dra. María González",
    avatar: "/doctors/doctor-1.png",
    initials: "MG",
  },
  admin: {
    role: "admin",
    label: "Administración",
    person: "Recepción Central",
    initials: "RC",
  },
}

const roles: { role: Role; label: string }[] = [
  { role: "patient", label: "Paciente" },
  { role: "doctor", label: "Médico" },
  { role: "admin", label: "Administrador" },
]

export function Navbar({
  role,
  onRoleChange,
}: {
  role: Role
  onRoleChange: (role: Role) => void
}) {
  const active = roleMeta[role]

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Activity className="size-5" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight">SaludPlus</p>
            <p className="text-[11px] text-muted-foreground">Gestión de Turnos</p>
          </div>
        </div>

        {/* Selector de rol / vista (segmented control) */}
        <nav
          aria-label="Cambiar de vista"
          className="hidden items-center gap-1 rounded-full border border-border bg-muted/60 p-1 md:flex"
        >
          {roles.map((r) => (
            <button
              key={r.role}
              type="button"
              onClick={() => onRoleChange(r.role)}
              aria-pressed={role === r.role}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
                role === r.role
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {r.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full text-muted-foreground"
            aria-label="Notificaciones"
          >
            <Bell />
            <span className="absolute right-2 top-2 size-2 rounded-full bg-destructive" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  className="h-auto gap-2 rounded-full py-1 pl-1 pr-2 sm:pr-3"
                />
              }
            >
              <>
                <Avatar className="size-8">
                  {active.avatar ? (
                    <AvatarImage src={active.avatar} alt={active.person} />
                  ) : null}
                  <AvatarFallback className="bg-accent text-accent-foreground text-xs font-semibold">
                    {active.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden text-left leading-tight sm:block">
                  <p className="text-sm font-medium">{active.person}</p>
                  <p className="text-[11px] text-muted-foreground">{active.label}</p>
                </div>
                <ChevronDown className="hidden size-4 text-muted-foreground sm:block" />
              </>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex flex-col gap-1">
                <span>{active.person}</span>
                <Badge variant="secondary" className="w-fit font-normal">
                  {active.label}
                </Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <User />
                  Mi perfil
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings />
                  Configuración
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                Cambiar de vista (demo)
              </DropdownMenuLabel>
              <DropdownMenuGroup>
                {roles.map((r) => (
                  <DropdownMenuItem
                    key={r.role}
                    onClick={() => onRoleChange(r.role)}
                    className={cn(role === r.role && "bg-accent/60")}
                  >
                    {r.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">
                <LogOut />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Selector de rol para mobile */}
      <div className="border-t border-border/70 px-4 py-2 md:hidden">
        <div className="flex items-center gap-1 rounded-full border border-border bg-muted/60 p-1">
          {roles.map((r) => (
            <button
              key={r.role}
              type="button"
              onClick={() => onRoleChange(r.role)}
              aria-pressed={role === r.role}
              className={cn(
                "flex-1 rounded-full px-3 py-1.5 text-sm font-medium transition-all",
                role === r.role
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}
