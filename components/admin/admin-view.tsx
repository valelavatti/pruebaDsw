"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Baby,
  Bone,
  Eye,
  HeartPulse,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Stethoscope,
  Trash2,
  UserRound,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"
import type { Doctor, Patient, Specialty } from "@/lib/types"
import {
  upsertPatient,
  deletePatient,
  upsertDoctor,
  deleteDoctor,
  deleteSpecialty,
} from "@/lib/actions/data"
import { calcAge, formatShortDate, getInitials } from "@/lib/appointments"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"

const specialtyIcons: Record<string, LucideIcon> = {
  HeartPulse,
  Baby,
  Sparkles,
  Bone,
  Eye,
  Stethoscope,
}

type Entity = "patients" | "doctors" | "specialties"

const entityLabels: Record<Entity, { singular: string; plural: string }> = {
  patients: { singular: "Paciente", plural: "Pacientes" },
  doctors: { singular: "Médico", plural: "Médicos" },
  specialties: { singular: "Especialidad", plural: "Especialidades" },
}

export function AdminView({
  patients: initialPatients,
  doctors: initialDoctors,
  specialties: initialSpecialties,
}: {
  patients: Patient[]
  doctors: Doctor[]
  specialties: Specialty[]
}) {
  const router = useRouter()
  const [tab, setTab] = useState<Entity>("patients")
  const [patients, setPatients] = useState<Patient[]>(initialPatients)
  const [doctors, setDoctors] = useState<Doctor[]>(initialDoctors)
  const [specialties, setSpecialties] = useState<Specialty[]>(initialSpecialties)
  const [query, setQuery] = useState("")

  useEffect(() => setPatients(initialPatients), [initialPatients])
  useEffect(() => setDoctors(initialDoctors), [initialDoctors])
  useEffect(() => setSpecialties(initialSpecialties), [initialSpecialties])

  // Estado del diálogo de creación/edición.
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Patient | Doctor | null>(null)

  // Estado del diálogo de borrado.
  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null)

  const totalRecords = patients.length + doctors.length + specialties.length

  const filteredPatients = useMemo(
    () => patients.filter((p) => matches(query, p.firstName, p.lastName, p.email, p.dni)),
    [patients, query],
  )
  const filteredDoctors = useMemo(
    () =>
      doctors.filter((d) =>
        matches(query, d.firstName, d.lastName, d.email, d.specialtyName),
      ),
    [doctors, query],
  )
  const filteredSpecialties = useMemo(
    () => specialties.filter((s) => matches(query, s.name, s.description)),
    [specialties, query],
  )

  function handleTabChange(value: string) {
    setTab(value as Entity)
    setQuery("")
  }

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(record: Patient | Doctor) {
    setEditing(record)
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const firstName = String(form.get("firstName") ?? "").trim()
    const lastName = String(form.get("lastName") ?? "").trim()
    const email = String(form.get("email") ?? "").trim()
    const phone = String(form.get("phone") ?? "").trim()

    try {
      if (tab === "patients") {
        const dni = String(form.get("dni") ?? "").trim()
        await upsertPatient({
          _id: editing?._id,
          firstName,
          lastName,
          email,
          phone,
          dni,
          birthDate: (editing as Patient | null)?.birthDate ?? "1990-01-01",
        })
        toast.success(editing ? "Paciente actualizado" : "Paciente creado")
      } else if (tab === "doctors") {
        const specialtyName = String(form.get("specialtyName") ?? "").trim()
        await upsertDoctor({
          _id: editing?._id,
          firstName,
          lastName,
          email,
          phone,
          specialtyName: specialtyName || "General",
          specialtyId: specialties.find((s) => s.name === specialtyName)?._id ?? "",
          license: String(form.get("license") ?? "").trim() || "MN —",
          workDays: (editing as Doctor | null)?.workDays ?? [1, 2, 3, 4, 5],
        })
        toast.success(editing ? "Médico actualizado" : "Médico creado")
      }
      setDialogOpen(false)
      setEditing(null)
      router.refresh()
    } catch {
      toast.error("No se pudo guardar el registro")
    }
  }

  async function confirmDelete() {
    if (!toDelete) return
    const target = toDelete
    setToDelete(null)
    try {
      if (tab === "patients") {
        setPatients((prev) => prev.filter((p) => p._id !== target.id))
        await deletePatient(target.id)
      } else if (tab === "doctors") {
        setDoctors((prev) => prev.filter((d) => d._id !== target.id))
        await deleteDoctor(target.id)
      } else if (tab === "specialties") {
        setSpecialties((prev) => prev.filter((s) => s._id !== target.id))
        await deleteSpecialty(target.id)
      }
      toast.success(`${target.name} eliminado`)
      router.refresh()
    } catch {
      toast.error("No se pudo eliminar el registro")
      router.refresh()
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Panel de administración
        </h1>
        <p className="text-muted-foreground">
          Gestioná las tablas maestras del sistema · {totalRecords} registros.
        </p>
      </div>

      <Tabs value={tab} onValueChange={handleTabChange} className="gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="patients">
              <UserRound data-icon="inline-start" />
              Pacientes
            </TabsTrigger>
            <TabsTrigger value="doctors">
              <Stethoscope data-icon="inline-start" />
              Médicos
            </TabsTrigger>
            <TabsTrigger value="specialties">
              <HeartPulse data-icon="inline-start" />
              Especialidades
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar..."
                className="pl-9"
                aria-label="Buscar registros"
              />
            </div>
            {tab !== "specialties" && (
              <Button onClick={openCreate}>
                <Plus data-icon="inline-start" />
                <span className="hidden sm:inline">
                  Nuevo {entityLabels[tab].singular.toLowerCase()}
                </span>
                <span className="sm:hidden">Nuevo</span>
              </Button>
            )}
          </div>
        </div>

        {/* PACIENTES */}
        <TabsContent value="patients">
          <Card className="overflow-hidden py-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Paciente</TableHead>
                  <TableHead className="hidden md:table-cell">DNI</TableHead>
                  <TableHead className="hidden lg:table-cell">Contacto</TableHead>
                  <TableHead className="hidden sm:table-cell">Edad</TableHead>
                  <TableHead className="hidden xl:table-cell">Alta</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((p) => (
                  <TableRow key={p._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarFallback className="bg-accent text-accent-foreground text-xs font-semibold">
                            {getInitials(`${p.firstName} ${p.lastName}`)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium">
                            {p.firstName} {p.lastName}
                          </p>
                          <p className="truncate text-xs text-muted-foreground md:hidden">
                            {p.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden font-mono text-sm text-muted-foreground md:table-cell">
                      {p.dni}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <p className="text-sm">{p.email}</p>
                      <p className="text-xs text-muted-foreground">{p.phone}</p>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {calcAge(p.birthDate)} años
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground xl:table-cell">
                      {formatShortDate(p.createdAt)}
                    </TableCell>
                    <TableCell>
                      <RowActions
                        onEdit={() => openEdit(p)}
                        onDelete={() =>
                          setToDelete({ id: p._id, name: `${p.firstName} ${p.lastName}` })
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {!filteredPatients.length && <EmptyRow colSpan={6} />}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* MÉDICOS */}
        <TabsContent value="doctors">
          <Card className="overflow-hidden py-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Profesional</TableHead>
                  <TableHead>Especialidad</TableHead>
                  <TableHead className="hidden lg:table-cell">Contacto</TableHead>
                  <TableHead className="hidden md:table-cell">Matrícula</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDoctors.map((d) => (
                  <TableRow key={d._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarImage src={d.avatar} alt="" />
                          <AvatarFallback className="bg-accent text-accent-foreground text-xs font-semibold">
                            {getInitials(`${d.firstName} ${d.lastName}`)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium">
                            {d.firstName} {d.lastName}
                          </p>
                          <p className="truncate text-xs text-muted-foreground lg:hidden">
                            {d.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal">
                        {d.specialtyName}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <p className="text-sm">{d.email}</p>
                      <p className="text-xs text-muted-foreground">{d.phone}</p>
                    </TableCell>
                    <TableCell className="hidden font-mono text-sm text-muted-foreground md:table-cell">
                      {d.license}
                    </TableCell>
                    <TableCell>
                      <RowActions
                        onEdit={() => openEdit(d)}
                        onDelete={() =>
                          setToDelete({ id: d._id, name: `${d.firstName} ${d.lastName}` })
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {!filteredDoctors.length && <EmptyRow colSpan={5} />}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ESPECIALIDADES */}
        <TabsContent value="specialties">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSpecialties.map((s) => {
              const Icon = specialtyIcons[s.icon] ?? Stethoscope
              return (
                <Card key={s._id} className="transition-shadow hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                        <Icon className="size-5" />
                      </span>
                      <Badge variant="secondary" className="font-normal">
                        {s.activeDoctors} médicos
                      </Badge>
                    </div>
                    <CardTitle className="mt-2">{s.name}</CardTitle>
                    <CardDescription>{s.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Pencil data-icon="inline-start" />
                      Editar
                    </Button>
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            aria-label={`Eliminar ${s.name}`}
                            onClick={() => setToDelete({ id: s._id, name: s.name })}
                          />
                        }
                      >
                        <Trash2 />
                      </TooltipTrigger>
                      <TooltipContent>Eliminar especialidad</TooltipContent>
                    </Tooltip>
                  </CardContent>
                </Card>
              )
            })}
            {!filteredSpecialties.length && (
              <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
                No se encontraron especialidades.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Diálogo Crear / Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editing ? "Editar" : "Nuevo"} {entityLabels[tab].singular.toLowerCase()}
              </DialogTitle>
              <DialogDescription>
                {editing
                  ? "Modificá los datos y guardá los cambios."
                  : `Completá el formulario para dar de alta un ${entityLabels[tab].singular.toLowerCase()}.`}
              </DialogDescription>
            </DialogHeader>

            <FieldGroup className="py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="firstName">Nombre</FieldLabel>
                  <Input
                    id="firstName"
                    name="firstName"
                    required
                    defaultValue={editing?.firstName}
                    placeholder="Ej. Juan"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="lastName">Apellido</FieldLabel>
                  <Input
                    id="lastName"
                    name="lastName"
                    required
                    defaultValue={editing?.lastName}
                    placeholder="Ej. Pérez"
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  defaultValue={editing?.email}
                  placeholder="correo@ejemplo.com"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="phone">Teléfono</FieldLabel>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={editing?.phone}
                  placeholder="+54 11 0000-0000"
                />
              </Field>
              {tab === "patients" && (
                <Field>
                  <FieldLabel htmlFor="dni">DNI</FieldLabel>
                  <Input
                    id="dni"
                    name="dni"
                    defaultValue={(editing as Patient | null)?.dni}
                    placeholder="00.000.000"
                  />
                </Field>
              )}
              {tab === "doctors" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="specialtyName">Especialidad</FieldLabel>
                    <Input
                      id="specialtyName"
                      name="specialtyName"
                      defaultValue={(editing as Doctor | null)?.specialtyName}
                      placeholder="Ej. Cardiología"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="license">Matrícula</FieldLabel>
                    <Input
                      id="license"
                      name="license"
                      defaultValue={(editing as Doctor | null)?.license}
                      placeholder="MN 00000"
                    />
                  </Field>
                </div>
              )}
            </FieldGroup>

            <DialogFooter>
              <DialogClose
                render={
                  <Button type="button" variant="outline">
                    Cancelar
                  </Button>
                }
              />
              <Button type="submit">
                {editing ? "Guardar cambios" : "Crear registro"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación de borrado */}
      <Dialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="mb-1 flex size-11 items-center justify-center rounded-full bg-destructive/12 text-destructive">
              <Trash2 className="size-5" />
            </div>
            <DialogTitle>¿Eliminar registro?</DialogTitle>
            <DialogDescription>
              Estás por eliminar a{" "}
              <span className="font-medium text-foreground">{toDelete?.name}</span>. Esta
              acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Cancelar</Button>} />
            <Button variant="destructive" onClick={confirmDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function matches(query: string, ...fields: (string | undefined)[]) {
  if (!query.trim()) return true
  const q = query.toLowerCase()
  return fields.some((f) => f?.toLowerCase().includes(q))
}

function RowActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex justify-end gap-1">
      <Tooltip>
        <TooltipTrigger
          render={
            <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Editar" />
          }
        >
          <Pencil />
        </TooltipTrigger>
        <TooltipContent>Editar</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              aria-label="Eliminar"
            />
          }
        >
          <Trash2 />
        </TooltipTrigger>
        <TooltipContent>Eliminar</TooltipContent>
      </Tooltip>
    </div>
  )
}

function EmptyRow({ colSpan }: { colSpan: number }) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={colSpan} className="py-10 text-center text-sm text-muted-foreground">
        No se encontraron registros.
      </TableCell>
    </TableRow>
  )
}
