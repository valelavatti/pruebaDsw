"use server"

import { db } from "@/lib/db"
import {
  specialties as specialtiesT,
  doctors as doctorsT,
  patients as patientsT,
  appointments as appointmentsT,
} from "@/lib/db/schema"
import type {
  Specialty,
  Doctor,
  Patient,
  Appointment,
  AppointmentStatus,
} from "@/lib/types"
import { and, asc, desc, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { requireUser } from "@/lib/session"

// ---- mappers --------------------------------------------------------------

function mapSpecialty(r: typeof specialtiesT.$inferSelect): Specialty {
  return {
    _id: r.id,
    name: r.name,
    description: r.description,
    icon: r.icon,
    activeDoctors: r.activeDoctors,
  }
}

function mapDoctor(r: typeof doctorsT.$inferSelect): Doctor {
  return {
    _id: r.id,
    firstName: r.firstName,
    lastName: r.lastName,
    email: r.email,
    phone: r.phone,
    specialtyId: r.specialtyId,
    specialtyName: r.specialtyName,
    avatar: r.avatar,
    license: r.license,
    rating: r.rating,
    yearsExperience: r.yearsExperience,
    workDays: r.workDays
      .split(",")
      .map((d) => Number.parseInt(d, 10))
      .filter((n) => !Number.isNaN(n)),
  }
}

function mapPatient(r: typeof patientsT.$inferSelect): Patient {
  return {
    _id: r.id,
    firstName: r.firstName,
    lastName: r.lastName,
    email: r.email,
    phone: r.phone,
    dni: r.dni,
    birthDate: r.birthDate,
    bloodType: r.bloodType ?? undefined,
    createdAt: r.createdAt,
  }
}

function mapAppointment(r: typeof appointmentsT.$inferSelect): Appointment {
  return {
    _id: r.id,
    patientId: r.patientId,
    patientName: r.patientName,
    doctorId: r.doctorId,
    doctorName: r.doctorName,
    specialtyName: r.specialtyName,
    date: r.date,
    time: r.time,
    status: r.status as AppointmentStatus,
    reason: r.reason ?? undefined,
    notes: r.notes ?? undefined,
  }
}

function genId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/** Nombres típicamente femeninos para elegir el título Dr./Dra. */
const FEMALE_NAMES = new Set([
  "maría",
  "lucía",
  "ana",
  "sofía",
  "valentina",
  "laura",
  "carla",
  "julia",
  "paula",
  "marta",
])

function doctorTitle(firstName: string) {
  return FEMALE_NAMES.has(firstName.trim().toLowerCase()) ? "Dra." : "Dr."
}

// ---- reads ----------------------------------------------------------------

export async function getSpecialties(): Promise<Specialty[]> {
  const rows = await db.select().from(specialtiesT).orderBy(asc(specialtiesT.name))
  return rows.map(mapSpecialty)
}

export async function getDoctors(): Promise<Doctor[]> {
  const rows = await db.select().from(doctorsT).orderBy(asc(doctorsT.lastName))
  return rows.map(mapDoctor)
}

export async function getPatients(): Promise<Patient[]> {
  const rows = await db.select().from(patientsT).orderBy(asc(patientsT.lastName))
  return rows.map(mapPatient)
}

/**
 * Turnos con scoping por rol:
 * - admin: todos
 * - doctor: solo los suyos (por doctorId enlazado a su userId)
 * - patient: solo los suyos (por patientId enlazado a su userId)
 */
export async function getAppointments(): Promise<Appointment[]> {
  const user = await requireUser()
  const base = db.select().from(appointmentsT)

  if (user.role === "admin") {
    const rows = await base.orderBy(desc(appointmentsT.date), asc(appointmentsT.time))
    return rows.map(mapAppointment)
  }

  if (user.role === "doctor") {
    const [doc] = await db
      .select()
      .from(doctorsT)
      .where(eq(doctorsT.userId, user.id))
      .limit(1)
    if (!doc) return []
    const rows = await db
      .select()
      .from(appointmentsT)
      .where(eq(appointmentsT.doctorId, doc.id))
      .orderBy(asc(appointmentsT.time))
    return rows.map(mapAppointment)
  }

  // patient
  const [pat] = await db
    .select()
    .from(patientsT)
    .where(eq(patientsT.userId, user.id))
    .limit(1)
  if (!pat) return []
  const rows = await db
    .select()
    .from(appointmentsT)
    .where(eq(appointmentsT.patientId, pat.id))
    .orderBy(desc(appointmentsT.date), asc(appointmentsT.time))
  return rows.map(mapAppointment)
}

/** Devuelve el registro de paciente enlazado al usuario actual (si existe). */
export async function getMyPatientProfile(): Promise<Patient | null> {
  const user = await requireUser()
  const [pat] = await db
    .select()
    .from(patientsT)
    .where(eq(patientsT.userId, user.id))
    .limit(1)
  return pat ? mapPatient(pat) : null
}

/** Devuelve el registro de médico enlazado al usuario actual (si existe). */
export async function getMyDoctorProfile(): Promise<Doctor | null> {
  const user = await requireUser()
  const [doc] = await db
    .select()
    .from(doctorsT)
    .where(eq(doctorsT.userId, user.id))
    .limit(1)
  return doc ? mapDoctor(doc) : null
}

// ---- appointment mutations ------------------------------------------------

export async function createAppointment(input: {
  doctorId: string
  date: string
  time: string
  reason?: string
}): Promise<{ ok: boolean; error?: string; appointment?: Appointment }> {
  const user = await requireUser()

  const [pat] = await db
    .select()
    .from(patientsT)
    .where(eq(patientsT.userId, user.id))
    .limit(1)
  if (!pat) return { ok: false, error: "No se encontró el perfil del paciente." }

  const [doc] = await db
    .select()
    .from(doctorsT)
    .where(eq(doctorsT.id, input.doctorId))
    .limit(1)
  if (!doc) return { ok: false, error: "El profesional seleccionado no existe." }

  // Evitar doble reserva del mismo horario para el mismo médico.
  const clash = await db
    .select()
    .from(appointmentsT)
    .where(
      and(
        eq(appointmentsT.doctorId, input.doctorId),
        eq(appointmentsT.date, input.date),
        eq(appointmentsT.time, input.time),
      ),
    )
    .limit(1)
  if (clash.length > 0) {
    return { ok: false, error: "Ese horario ya fue reservado. Elegí otro." }
  }

  const row = {
    id: genId("apt"),
    patientId: pat.id,
    patientName: `${pat.firstName} ${pat.lastName}`,
    doctorId: doc.id,
    doctorName: `${doctorTitle(doc.firstName)} ${doc.firstName} ${doc.lastName}`,
    specialtyName: doc.specialtyName,
    date: input.date,
    time: input.time,
    status: "scheduled" as const,
    reason: input.reason ?? null,
    notes: null,
  }
  await db.insert(appointmentsT).values(row)
  revalidatePath("/")
  return { ok: true, appointment: mapAppointment({ ...row, createdAt: new Date() }) }
}

export async function cancelAppointment(id: string) {
  const user = await requireUser()
  // patient solo cancela los suyos; doctor/admin pueden cancelar
  if (user.role === "patient") {
    const [pat] = await db
      .select()
      .from(patientsT)
      .where(eq(patientsT.userId, user.id))
      .limit(1)
    if (!pat) throw new Error("Unauthorized")
    await db
      .update(appointmentsT)
      .set({ status: "cancelled" })
      .where(and(eq(appointmentsT.id, id), eq(appointmentsT.patientId, pat.id)))
  } else {
    await db.update(appointmentsT).set({ status: "cancelled" }).where(eq(appointmentsT.id, id))
  }
  revalidatePath("/")
}

export async function setAppointmentStatus(id: string, status: AppointmentStatus) {
  const user = await requireUser()
  if (user.role === "patient") throw new Error("Unauthorized")
  await db.update(appointmentsT).set({ status }).where(eq(appointmentsT.id, id))
  revalidatePath("/")
}

export async function saveAppointmentNotes(id: string, notes: string) {
  const user = await requireUser()
  if (user.role === "patient") throw new Error("Unauthorized")
  await db.update(appointmentsT).set({ notes }).where(eq(appointmentsT.id, id))
  revalidatePath("/")
}

// ---- admin CRUD -----------------------------------------------------------

async function requireAdmin() {
  const user = await requireUser()
  if (user.role !== "admin") throw new Error("Unauthorized")
  return user
}

export async function upsertPatient(input: Partial<Patient> & { _id?: string }) {
  await requireAdmin()
  if (input._id) {
    await db
      .update(patientsT)
      .set({
        firstName: input.firstName ?? "",
        lastName: input.lastName ?? "",
        email: input.email ?? "",
        phone: input.phone ?? "",
        dni: input.dni ?? "",
        birthDate: input.birthDate ?? "1990-01-01",
        bloodType: input.bloodType ?? null,
      })
      .where(eq(patientsT.id, input._id))
  } else {
    await db.insert(patientsT).values({
      id: genId("pac"),
      firstName: input.firstName ?? "",
      lastName: input.lastName ?? "",
      email: input.email ?? "",
      phone: input.phone ?? "",
      dni: input.dni ?? "",
      birthDate: input.birthDate ?? "1990-01-01",
      bloodType: input.bloodType ?? null,
      createdAt: new Date().toISOString().slice(0, 10),
    })
  }
  revalidatePath("/")
}

export async function deletePatient(id: string) {
  await requireAdmin()
  await db.delete(patientsT).where(eq(patientsT.id, id))
  revalidatePath("/")
}

export async function upsertDoctor(input: Partial<Doctor> & { _id?: string }) {
  await requireAdmin()
  const workDays = (input.workDays ?? [1, 2, 3, 4, 5]).join(",")
  if (input._id) {
    await db
      .update(doctorsT)
      .set({
        firstName: input.firstName ?? "",
        lastName: input.lastName ?? "",
        email: input.email ?? "",
        phone: input.phone ?? "",
        specialtyId: input.specialtyId ?? "",
        specialtyName: input.specialtyName ?? "",
        license: input.license ?? "",
        yearsExperience: input.yearsExperience ?? 1,
        workDays,
      })
      .where(eq(doctorsT.id, input._id))
  } else {
    await db.insert(doctorsT).values({
      id: genId("doc"),
      firstName: input.firstName ?? "",
      lastName: input.lastName ?? "",
      email: input.email ?? "",
      phone: input.phone ?? "",
      specialtyId: input.specialtyId ?? "",
      specialtyName: input.specialtyName ?? "",
      avatar: input.avatar ?? "",
      license: input.license ?? "",
      rating: input.rating ?? 5,
      yearsExperience: input.yearsExperience ?? 1,
      workDays,
    })
  }
  revalidatePath("/")
}

export async function deleteDoctor(id: string) {
  await requireAdmin()
  await db.delete(doctorsT).where(eq(doctorsT.id, id))
  revalidatePath("/")
}

export async function upsertSpecialty(input: Partial<Specialty> & { _id?: string }) {
  await requireAdmin()
  if (input._id) {
    await db
      .update(specialtiesT)
      .set({
        name: input.name ?? "",
        description: input.description ?? "",
        icon: input.icon ?? "stethoscope",
      })
      .where(eq(specialtiesT.id, input._id))
  } else {
    await db.insert(specialtiesT).values({
      id: genId("esp"),
      name: input.name ?? "",
      description: input.description ?? "",
      icon: input.icon ?? "stethoscope",
      activeDoctors: 0,
    })
  }
  revalidatePath("/")
}

export async function deleteSpecialty(id: string) {
  await requireAdmin()
  await db.delete(specialtiesT).where(eq(specialtiesT.id, id))
  revalidatePath("/")
}
