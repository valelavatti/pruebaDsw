import { redirect } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { PatientView } from "@/components/patient/patient-view"
import { DoctorView } from "@/components/doctor/doctor-view"
import { AdminView } from "@/components/admin/admin-view"
import { getSessionUser } from "@/lib/session"
import {
  getSpecialties,
  getDoctors,
  getPatients,
  getAppointments,
  getMyPatientProfile,
  getMyDoctorProfile,
  getProfileSummary,
} from "@/lib/actions/data"

export default async function Page() {
  const user = await getSessionUser()
  if (!user) redirect("/sign-in")

  const profile = await getProfileSummary()

  return (
    <div className="min-h-svh bg-background">
      <Navbar user={user} profile={profile} />
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
          {user.role === "patient" && <PatientContent />}
          {user.role === "doctor" && <DoctorContent />}
          {user.role === "admin" && <AdminContent />}
        </div>
      </main>
      <footer className="border-t border-border/70 py-6">
        <p className="mx-auto max-w-6xl px-4 text-center text-xs text-muted-foreground sm:px-6">
          SaludPlus · Sistema de Gestión de Turnos Médicos · Proyecto académico de
          Desarrollo de Software
        </p>
      </footer>
    </div>
  )
}

async function PatientContent() {
  const [profile, appointments, specialties, doctors] = await Promise.all([
    getMyPatientProfile(),
    getAppointments(),
    getSpecialties(),
    getDoctors(),
  ])
  return (
    <PatientView
      patientName={profile?.firstName ?? "Paciente"}
      appointments={appointments}
      specialties={specialties}
      doctors={doctors}
    />
  )
}

async function DoctorContent() {
  const [profile, appointments, patients] = await Promise.all([
    getMyDoctorProfile(),
    getAppointments(),
    getPatients(),
  ])
  return (
    <DoctorView
      doctorName={
        profile ? `${profile.firstName} ${profile.lastName}` : "Profesional"
      }
      specialtyName={profile?.specialtyName ?? ""}
      appointments={appointments}
      patients={patients}
    />
  )
}

async function AdminContent() {
  const [patients, doctors, specialties] = await Promise.all([
    getPatients(),
    getDoctors(),
    getSpecialties(),
  ])
  return <AdminView patients={patients} doctors={doctors} specialties={specialties} />
}
