// Tipos que reflejan documentos típicos de MongoDB.
// Todos los documentos usan `_id: string` (ObjectId serializado a string).

export type Role = "patient" | "doctor" | "admin"

export interface Specialty {
  _id: string
  name: string
  description: string
  /** Nombre del icono de lucide-react usado en la UI */
  icon: string
  activeDoctors: number
}

export interface Patient {
  _id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  dni: string
  birthDate: string // ISO date
  bloodType?: string
  createdAt: string // ISO date
}

export interface Doctor {
  _id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  specialtyId: string
  specialtyName: string
  /** URL del avatar */
  avatar: string
  /** Matrícula profesional */
  license: string
  rating: number
  yearsExperience: number
  /** Días de la semana en que atiende (0=domingo ... 6=sábado) */
  workDays: number[]
}

export type AppointmentStatus =
  | "scheduled" // Agendado (futuro)
  | "completed" // Atendido
  | "cancelled" // Cancelado
  | "absent" // Ausente

export interface Appointment {
  _id: string
  patientId: string
  patientName: string
  doctorId: string
  doctorName: string
  specialtyName: string
  /** ISO datetime del turno */
  date: string
  /** Hora en formato HH:mm */
  time: string
  status: AppointmentStatus
  reason?: string
  notes?: string
}
