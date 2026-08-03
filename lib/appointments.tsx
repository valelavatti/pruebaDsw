import type { AppointmentStatus } from "@/lib/types"

export const statusConfig: Record<
  AppointmentStatus,
  { label: string; className: string }
> = {
  scheduled: {
    label: "Agendado",
    className: "border-primary/20 bg-primary/10 text-primary",
  },
  completed: {
    label: "Atendido",
    className: "border-transparent bg-success/15 text-success",
  },
  cancelled: {
    label: "Cancelado",
    className: "border-transparent bg-muted text-muted-foreground",
  },
  absent: {
    label: "Ausente",
    className: "border-transparent bg-destructive/12 text-destructive",
  },
}

const monthsEs = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
]

const weekdaysEs = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
]

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

/** Convierte una fecha ISO (YYYY-MM-DD) en un objeto Date local sin desfase de zona horaria. */
export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number)
  return new Date(year, month - 1, day)
}

export function formatLongDate(iso: string): string {
  const d = parseISODate(iso)
  return `${capitalize(weekdaysEs[d.getDay()])} ${d.getDate()} de ${monthsEs[d.getMonth()]}`
}

export function formatShortDate(iso: string): string {
  const d = parseISODate(iso)
  return `${d.getDate()} ${monthsEs[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`
}

export function getInitials(name: string): string {
  return name
    .replace(/^(Dra?\.?)\s+/i, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("")
}

export function calcAge(birthDate: string): number {
  const b = parseISODate(birthDate)
  const now = new Date()
  let age = now.getFullYear() - b.getFullYear()
  const m = now.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--
  return age
}
