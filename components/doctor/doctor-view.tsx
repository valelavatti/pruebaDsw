"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  Droplet,
  Mail,
  Phone,
  Save,
  Stethoscope,
  UserX,
  Users,
} from "lucide-react"
import { toast } from "sonner"
import type { Appointment, Patient } from "@/lib/types"
import { setAppointmentStatus, saveAppointmentNotes } from "@/lib/actions/data"
import {
  calcAge,
  formatLongDate,
  getInitials,
  statusConfig,
} from "@/lib/appointments"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

export function DoctorView({
  doctorName,
  specialtyName,
  appointments: initialAppointments,
  patients,
}: {
  doctorName: string
  specialtyName: string
  appointments: Appointment[]
  patients: Patient[]
}) {
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments)
  const [selected, setSelected] = useState<Appointment | null>(null)
  const [notes, setNotes] = useState("")

  useEffect(() => {
    setAppointments(initialAppointments)
  }, [initialAppointments])

  const stats = useMemo(() => {
    const total = appointments.length
    const completed = appointments.filter((a) => a.status === "completed").length
    const pending = appointments.filter((a) => a.status === "scheduled").length
    const absent = appointments.filter((a) => a.status === "absent").length
    return { total, completed, pending, absent }
  }, [appointments])

  async function updateStatus(id: string, status: Appointment["status"]) {
    setAppointments((prev) =>
      prev.map((a) => (a._id === id ? { ...a, status } : a)),
    )
    const labels: Record<string, string> = {
      completed: "Paciente marcado como atendido",
      absent: "Paciente marcado como ausente",
    }
    try {
      await setAppointmentStatus(id, status)
      toast.success(labels[status] ?? "Turno actualizado")
      router.refresh()
    } catch {
      toast.error("No se pudo actualizar el turno")
      router.refresh()
    }
  }

  function openDetail(a: Appointment) {
    setSelected(a)
    setNotes(a.notes ?? "")
  }

  async function saveNotes() {
    if (!selected) return
    const id = selected._id
    setAppointments((prev) => prev.map((a) => (a._id === id ? { ...a, notes } : a)))
    setSelected(null)
    try {
      await saveAppointmentNotes(id, notes)
      toast.success("Observaciones guardadas")
      router.refresh()
    } catch {
      toast.error("No se pudieron guardar las observaciones")
      router.refresh()
    }
  }

  const patient = selected
    ? patients.find((p) => p._id === selected.patientId)
    : undefined

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="size-4" />
          {formatLongDate(new Date().toISOString().slice(0, 10))}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Agenda del día
        </h1>
        <p className="text-muted-foreground">
          {doctorName}
          {specialtyName ? ` · ${specialtyName}` : ""}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          icon={<Users className="size-5" />}
          value={stats.total}
          label="Turnos de hoy"
          tone="primary"
        />
        <KpiCard
          icon={<CheckCircle2 className="size-5" />}
          value={stats.completed}
          label="Atendidos"
          tone="success"
        />
        <KpiCard
          icon={<Clock className="size-5" />}
          value={stats.pending}
          label="Pendientes"
          tone="accent"
        />
        <KpiCard
          icon={<UserX className="size-5" />}
          value={stats.absent}
          label="Ausentes"
          tone="destructive"
        />
      </div>

      {/* Agenda cronológica */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="size-5 text-primary" />
            Pacientes citados
          </CardTitle>
          <CardDescription>
            Gestioná el estado de cada consulta a lo largo del día.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {appointments.map((a) => {
            const status = statusConfig[a.status]
            const isPending = a.status === "scheduled"
            return (
              <div
                key={a._id}
                className={cn(
                  "flex flex-col gap-4 rounded-xl border p-4 transition-colors sm:flex-row sm:items-center",
                  isPending ? "border-border bg-card" : "border-transparent bg-muted/40",
                )}
              >
                <div className="flex w-16 shrink-0 flex-col items-center justify-center gap-0.5 border-border sm:border-r sm:pr-4">
                  <Clock className="size-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">{a.time}</span>
                </div>

                <button
                  type="button"
                  onClick={() => openDetail(a)}
                  className="flex flex-1 items-center gap-3 text-left"
                >
                  <Avatar className="size-11">
                    <AvatarFallback className="bg-accent text-accent-foreground font-semibold">
                      {getInitials(a.patientName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{a.patientName}</p>
                      <Badge
                        variant="outline"
                        className={cn("font-normal", status.className)}
                      >
                        {status.label}
                      </Badge>
                    </div>
                    <p className="truncate text-sm text-muted-foreground">{a.reason}</p>
                  </div>
                </button>

                {isPending ? (
                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      className="bg-success text-success-foreground hover:bg-success/90"
                      onClick={() => updateStatus(a._id, "completed")}
                    >
                      <CheckCircle2 data-icon="inline-start" />
                      Atendido
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => updateStatus(a._id, "absent")}
                    >
                      <UserX data-icon="inline-start" />
                      Ausente
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="shrink-0 text-muted-foreground"
                    onClick={() => openDetail(a)}
                  >
                    Ver detalle
                  </Button>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Panel lateral de detalle del paciente */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Detalle del paciente</SheetTitle>
            <SheetDescription>
              Información clínica y observaciones de la consulta.
            </SheetDescription>
          </SheetHeader>

          {selected && (
            <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 pb-4">
              <div className="flex items-center gap-4">
                <Avatar className="size-16">
                  <AvatarFallback className="bg-accent text-accent-foreground text-lg font-semibold">
                    {getInitials(selected.patientName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-semibold">{selected.patientName}</p>
                  {patient && (
                    <p className="text-sm text-muted-foreground">
                      {calcAge(patient.birthDate)} años · DNI {patient.dni}
                    </p>
                  )}
                  <Badge
                    variant="outline"
                    className={cn("mt-1 font-normal", statusConfig[selected.status].className)}
                  >
                    {statusConfig[selected.status].label}
                  </Badge>
                </div>
              </div>

              {patient && (
                <div className="grid grid-cols-2 gap-3">
                  <InfoTile icon={<Mail className="size-4" />} label="Email" value={patient.email} />
                  <InfoTile icon={<Phone className="size-4" />} label="Teléfono" value={patient.phone} />
                  <InfoTile
                    icon={<Droplet className="size-4" />}
                    label="Grupo sanguíneo"
                    value={patient.bloodType ?? "—"}
                  />
                  <InfoTile
                    icon={<Clock className="size-4" />}
                    label="Horario"
                    value={`${selected.time} hs`}
                  />
                </div>
              )}

              <div className="rounded-xl border border-border bg-muted/40 p-4">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <Stethoscope className="size-4 text-primary" />
                  Motivo de consulta
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{selected.reason}</p>
              </div>

              <Separator />

              <div className="flex flex-col gap-2">
                <Label htmlFor="notes">Observaciones médicas</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Agregá diagnóstico, indicaciones o notas de seguimiento..."
                  className="min-h-32 resize-none"
                />
              </div>
            </div>
          )}

          <SheetFooter>
            <Button onClick={saveNotes}>
              <Save data-icon="inline-start" />
              Guardar observaciones
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}

const toneStyles: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/15 text-success",
  accent: "bg-warning/15 text-warning",
  destructive: "bg-destructive/12 text-destructive",
}

function KpiCard({
  icon,
  value,
  label,
  tone,
}: {
  icon: React.ReactNode
  value: number
  label: string
  tone: keyof typeof toneStyles
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-5">
        <span
          className={cn(
            "flex size-10 items-center justify-center rounded-lg",
            toneStyles[tone],
          )}
        >
          {icon}
        </span>
        <div>
          <p className="text-3xl font-semibold leading-none tracking-tight">{value}</p>
          <p className="mt-1.5 text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function InfoTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-medium">{value}</p>
    </div>
  )
}
