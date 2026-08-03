"use client"

import { useMemo, useState } from "react"
import {
  ArrowLeft,
  ArrowRight,
  Baby,
  Bone,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  HeartPulse,
  PartyPopper,
  Sparkles,
  Star,
  Stethoscope,
  type LucideIcon,
} from "lucide-react"
import { doctors, specialties, availableTimeSlots } from "@/lib/mock-data"
import type { Doctor } from "@/lib/types"
import { formatLongDate, getInitials, parseISODate } from "@/lib/appointments"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const specialtyIcons: Record<string, LucideIcon> = {
  HeartPulse,
  Baby,
  Sparkles,
  Bone,
  Eye,
  Stethoscope,
}

const steps = [
  { id: 1, label: "Especialidad", icon: Stethoscope },
  { id: 2, label: "Profesional", icon: HeartPulse },
  { id: 3, label: "Fecha y hora", icon: CalendarDays },
]

export function BookingStepper({ onBooked }: { onBooked?: () => void }) {
  const [step, setStep] = useState(1)
  const [specialtyId, setSpecialtyId] = useState<string>("")
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [time, setTime] = useState<string>("")
  const [confirmOpen, setConfirmOpen] = useState(false)

  const filteredDoctors = useMemo(
    () => doctors.filter((d) => d.specialtyId === specialtyId),
    [specialtyId],
  )

  const specialtyName = specialties.find((s) => s._id === specialtyId)?.name ?? ""

  function reset() {
    setStep(1)
    setSpecialtyId("")
    setDoctor(null)
    setDate(undefined)
    setTime("")
  }

  const canContinue =
    (step === 1 && specialtyId) ||
    (step === 2 && doctor) ||
    (step === 3 && date && time)

  function handleContinue() {
    if (step < 3) {
      setStep((s) => s + 1)
    } else {
      // Simula el POST /api/appointments al backend Express.
      setConfirmOpen(true)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Indicador de pasos */}
      <ol className="flex items-center">
        {steps.map((s, i) => {
          const done = step > s.id
          const current = step === s.id
          return (
            <li key={s.id} className="flex flex-1 items-center last:flex-none">
              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
                    done && "border-primary bg-primary text-primary-foreground",
                    current &&
                      "border-primary bg-primary/10 text-primary ring-4 ring-primary/10",
                    !done && !current && "border-border bg-card text-muted-foreground",
                  )}
                >
                  {done ? <Check className="size-4" /> : s.id}
                </span>
                <span
                  className={cn(
                    "hidden text-sm font-medium sm:block",
                    current ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <span
                  className={cn(
                    "mx-2 h-0.5 flex-1 rounded-full transition-colors sm:mx-4",
                    done ? "bg-primary" : "bg-border",
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>

      {/* Paso 1: Especialidad */}
      {step === 1 && (
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-base font-semibold">¿Qué especialidad necesitás?</h3>
            <p className="text-sm text-muted-foreground">
              Elegí el área de atención para tu consulta.
            </p>
          </div>
          <Select value={specialtyId} onValueChange={(v) => setSpecialtyId(v ?? "")}>
            <SelectTrigger className="w-full sm:max-w-sm">
              <SelectValue placeholder="Seleccioná una especialidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {specialties.map((s) => (
                  <SelectItem key={s._id} value={s._id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {specialties.map((s) => {
              const Icon = specialtyIcons[s.icon] ?? Stethoscope
              const selected = specialtyId === s._id
              return (
                <button
                  key={s._id}
                  type="button"
                  onClick={() => setSpecialtyId(s._id)}
                  className={cn(
                    "group flex flex-col items-start gap-2 rounded-xl border bg-card p-4 text-left transition-all hover:shadow-md",
                    selected
                      ? "border-primary ring-2 ring-primary/15"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-10 items-center justify-center rounded-lg transition-colors",
                      selected
                        ? "bg-primary text-primary-foreground"
                        : "bg-accent text-accent-foreground",
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                  <span className="text-sm font-semibold">{s.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {s.activeDoctors} profesionales
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Paso 2: Profesional */}
      {step === 2 && (
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-base font-semibold">Elegí un profesional</h3>
            <p className="text-sm text-muted-foreground">
              Médicos disponibles en {specialtyName}.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredDoctors.map((d) => {
              const selected = doctor?._id === d._id
              return (
                <button
                  key={d._id}
                  type="button"
                  onClick={() => setDoctor(d)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border bg-card p-3.5 text-left transition-all hover:shadow-md",
                    selected
                      ? "border-primary ring-2 ring-primary/15"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  <Avatar className="size-14">
                    <AvatarImage src={d.avatar} alt={`${d.firstName} ${d.lastName}`} />
                    <AvatarFallback>
                      {getInitials(`${d.firstName} ${d.lastName}`)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      Dr{d.firstName.match(/a$|ía$/i) ? "a" : ""}. {d.firstName}{" "}
                      {d.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{d.specialtyName}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-0.5 font-medium text-warning">
                        <Star className="size-3.5 fill-current" />
                        {d.rating.toFixed(1)}
                      </span>
                      <span aria-hidden>·</span>
                      <span>{d.yearsExperience} años exp.</span>
                    </div>
                  </div>
                  {selected && (
                    <CheckCircle2 className="size-5 shrink-0 text-primary" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Paso 3: Fecha y hora */}
      {step === 3 && (
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-base font-semibold">Elegí fecha y horario</h3>
            <p className="text-sm text-muted-foreground">
              Turnos disponibles con Dr{doctor?.firstName.match(/a$|ía$/i) ? "a" : ""}.{" "}
              {doctor?.firstName} {doctor?.lastName}.
            </p>
          </div>
          <div className="grid gap-5 lg:grid-cols-[auto_1fr]">
            <div className="flex justify-center rounded-xl border border-border bg-card p-2">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={(d) => {
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  return d < today || d.getDay() === 0
                }}
                className="bg-transparent p-0"
              />
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Clock className="size-4 text-primary" />
                {date ? formatLongDate(parseISODate(date.toISOString()).toISOString()) : "Seleccioná un día"}
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {availableTimeSlots.map((slot) => {
                  const selected = time === slot
                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={!date}
                      onClick={() => setTime(slot)}
                      className={cn(
                        "rounded-lg border px-2 py-2 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40",
                        selected
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border bg-card hover:border-primary/50 hover:bg-accent/50",
                      )}
                    >
                      {slot}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navegación */}
      <div className="flex items-center justify-between border-t border-border pt-4">
        <Button
          variant="ghost"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
        >
          <ArrowLeft data-icon="inline-start" />
          Atrás
        </Button>
        <Button onClick={handleContinue} disabled={!canContinue}>
          {step === 3 ? "Confirmar turno" : "Continuar"}
          {step === 3 ? (
            <Check data-icon="inline-end" />
          ) : (
            <ArrowRight data-icon="inline-end" />
          )}
        </Button>
      </div>

      {/* Diálogo de éxito */}
      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open)
          if (!open) {
            reset()
            onBooked?.()
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="items-center text-center">
            <div className="mb-2 flex size-14 items-center justify-center rounded-full bg-success/15 text-success">
              <PartyPopper className="size-7" />
            </div>
            <DialogTitle className="text-center">¡Turno confirmado!</DialogTitle>
            <DialogDescription className="text-center">
              Te enviamos los detalles por correo electrónico. Podés verlo en{" "}
              <span className="font-medium text-foreground">Mis turnos</span>.
            </DialogDescription>
          </DialogHeader>
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex flex-col gap-3 py-4">
              <div className="flex items-center gap-3">
                <Avatar className="size-11">
                  <AvatarImage src={doctor?.avatar} alt="" />
                  <AvatarFallback>
                    {doctor ? getInitials(`${doctor.firstName} ${doctor.lastName}`) : ""}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">
                    Dr{doctor?.firstName.match(/a$|ía$/i) ? "a" : ""}.{" "}
                    {doctor?.firstName} {doctor?.lastName}
                  </p>
                  <Badge variant="secondary" className="mt-0.5 font-normal">
                    {specialtyName}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="size-4 text-primary" />
                  {date ? formatLongDate(parseISODate(date.toISOString()).toISOString()) : ""}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="size-4 text-primary" />
                  {time} hs
                </span>
              </div>
            </CardContent>
          </Card>
          <DialogFooter>
            <DialogClose render={<Button className="w-full">Listo</Button>} />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
