"use client"

import { useMemo, useState } from "react"
import {
  CalendarCheck,
  CalendarPlus,
  Clock,
  History,
  LayoutDashboard,
  MapPin,
  Stethoscope,
  Trash2,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { currentPatient, patientAppointments } from "@/lib/mock-data"
import type { Appointment } from "@/lib/types"
import {
  formatLongDate,
  formatShortDate,
  getInitials,
  parseISODate,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { BookingStepper } from "@/components/patient/booking-stepper"

function isFuture(a: Appointment) {
  return a.status === "scheduled"
}

export function PatientView() {
  const [tab, setTab] = useState("inicio")
  const [appointments, setAppointments] = useState<Appointment[]>(patientAppointments)
  const [toCancel, setToCancel] = useState<Appointment | null>(null)

  const upcoming = useMemo(
    () =>
      appointments
        .filter(isFuture)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [appointments],
  )
  const past = useMemo(
    () =>
      appointments
        .filter((a) => !isFuture(a))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [appointments],
  )
  const nextAppointment = upcoming[0]

  function confirmCancel() {
    if (!toCancel) return
    setAppointments((prev) =>
      prev.map((a) =>
        a._id === toCancel._id ? { ...a, status: "cancelled" } : a,
      ),
    )
    toast.success("Turno cancelado", {
      description: `${toCancel.specialtyName} · ${formatShortDate(toCancel.date)}`,
    })
    setToCancel(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          Hola, {currentPatient.firstName}
        </h1>
        <p className="text-muted-foreground">
          Gestioná tus turnos médicos de forma simple y rápida.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="gap-6">
        <TabsList className="w-full max-w-md">
          <TabsTrigger value="inicio">
            <LayoutDashboard data-icon="inline-start" />
            Inicio
          </TabsTrigger>
          <TabsTrigger value="reservar">
            <CalendarPlus data-icon="inline-start" />
            Reservar
          </TabsTrigger>
          <TabsTrigger value="turnos">
            <History data-icon="inline-start" />
            Mis turnos
          </TabsTrigger>
        </TabsList>

        {/* INICIO */}
        <TabsContent value="inicio" className="flex flex-col gap-6">
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Próximo turno destacado */}
            <Card className="overflow-hidden border-primary/20 lg:col-span-2">
              <div className="flex items-center justify-between bg-primary/10 px-6 py-3">
                <span className="flex items-center gap-2 text-sm font-medium text-primary">
                  <CalendarCheck className="size-4" />
                  Próximo turno
                </span>
                {nextAppointment && (
                  <Badge className="bg-primary text-primary-foreground">
                    En {daysUntil(nextAppointment.date)}
                  </Badge>
                )}
              </div>
              <CardContent className="pt-5">
                {nextAppointment ? (
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="size-14">
                        <AvatarFallback className="bg-accent text-accent-foreground font-semibold">
                          {getInitials(nextAppointment.doctorName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{nextAppointment.doctorName}</p>
                        <p className="text-sm text-muted-foreground">
                          {nextAppointment.specialtyName}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {nextAppointment.reason}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 rounded-xl bg-muted/60 p-4 text-sm sm:text-right">
                      <span className="flex items-center gap-2 font-medium sm:justify-end">
                        <Clock className="size-4 text-primary" />
                        {formatLongDate(nextAppointment.date)}
                      </span>
                      <span className="text-2xl font-semibold tracking-tight">
                        {nextAppointment.time} hs
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground sm:justify-end">
                        <MapPin className="size-3.5" />
                        Sede Central · Consultorio 4
                      </span>
                    </div>
                  </div>
                ) : (
                  <Empty className="py-6">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <CalendarPlus />
                      </EmptyMedia>
                      <EmptyTitle>No tenés turnos próximos</EmptyTitle>
                      <EmptyDescription>
                        Reservá tu próxima consulta en segundos.
                      </EmptyDescription>
                    </EmptyHeader>
                    <Button onClick={() => setTab("reservar")}>
                      <CalendarPlus data-icon="inline-start" />
                      Reservar turno
                    </Button>
                  </Empty>
                )}
              </CardContent>
            </Card>

            {/* Resumen + CTA */}
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
                <StatMini
                  icon={<CalendarCheck className="size-5" />}
                  value={upcoming.length}
                  label="Turnos próximos"
                />
                <StatMini
                  icon={<Stethoscope className="size-5" />}
                  value={past.filter((a) => a.status === "completed").length}
                  label="Consultas realizadas"
                />
              </div>
              <Card className="flex-1 border-dashed">
                <CardContent className="flex h-full flex-col items-start justify-center gap-3 py-6">
                  <p className="text-sm text-muted-foreground text-pretty">
                    ¿Necesitás ver a un especialista? Reservá un nuevo turno ahora.
                  </p>
                  <Button className="w-full" onClick={() => setTab("reservar")}>
                    <CalendarPlus data-icon="inline-start" />
                    Nueva reserva
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* RESERVAR */}
        <TabsContent value="reservar">
          <Card>
            <CardHeader>
              <CardTitle>Reservar un nuevo turno</CardTitle>
              <CardDescription>
                Seguí los pasos para agendar tu consulta médica.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BookingStepper onBooked={() => setTab("turnos")} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* MIS TURNOS */}
        <TabsContent value="turnos" className="flex flex-col gap-6">
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Próximos ({upcoming.length})
            </h2>
            {upcoming.length ? (
              <div className="flex flex-col gap-3">
                {upcoming.map((a) => (
                  <AppointmentRow
                    key={a._id}
                    appointment={a}
                    onCancel={() => setToCancel(a)}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  No tenés turnos próximos agendados.
                </CardContent>
              </Card>
            )}
          </section>

          <Separator />

          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Historial ({past.length})
            </h2>
            <div className="flex flex-col gap-3">
              {past.map((a) => (
                <AppointmentRow key={a._id} appointment={a} />
              ))}
            </div>
          </section>
        </TabsContent>
      </Tabs>

      {/* Confirmación de cancelación */}
      <Dialog open={!!toCancel} onOpenChange={(o) => !o && setToCancel(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="mb-1 flex size-11 items-center justify-center rounded-full bg-destructive/12 text-destructive">
              <Trash2 className="size-5" />
            </div>
            <DialogTitle>¿Cancelar este turno?</DialogTitle>
            <DialogDescription>
              {toCancel && (
                <>
                  {toCancel.specialtyName} con {toCancel.doctorName} el{" "}
                  {formatShortDate(toCancel.date)} a las {toCancel.time} hs. Esta acción
                  no se puede deshacer.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Volver</Button>
            </DialogClose>
            <Button variant="destructive" onClick={confirmCancel}>
              Sí, cancelar turno
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatMini({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: number
  label: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-4">
        <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          {icon}
        </span>
        <div>
          <p className="text-2xl font-semibold leading-none">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function AppointmentRow({
  appointment,
  onCancel,
}: {
  appointment: Appointment
  onCancel?: () => void
}) {
  const status = statusConfig[appointment.status]
  const canCancel = appointment.status === "scheduled" && onCancel
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <span className="text-base font-semibold leading-none">
              {parseISODate(appointment.date).getDate()}
            </span>
            <span className="text-[10px] uppercase">
              {monthShort(appointment.date)}
            </span>
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">{appointment.doctorName}</p>
              <Badge variant="outline" className={cn("font-normal", status.className)}>
                {status.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {appointment.specialtyName} · {appointment.time} hs
            </p>
            {appointment.reason && (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {appointment.reason}
              </p>
            )}
          </div>
        </div>
        {canCancel && (
          <Button
            variant="ghost"
            size="sm"
            className="self-start text-destructive hover:bg-destructive/10 hover:text-destructive sm:self-center"
            onClick={onCancel}
          >
            <X data-icon="inline-start" />
            Cancelar
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

const monthsShort = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
]

function monthShort(iso: string) {
  return monthsShort[parseISODate(iso).getMonth()]
}

function daysUntil(iso: string) {
  const target = parseISODate(iso)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000)
  if (diff <= 0) return "hoy"
  if (diff === 1) return "1 día"
  return `${diff} días`
}
