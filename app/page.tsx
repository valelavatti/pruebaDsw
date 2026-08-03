"use client"

import { useState } from "react"
import type { Role } from "@/lib/types"
import { Navbar } from "@/components/navbar"
import { PatientView } from "@/components/patient/patient-view"
import { DoctorView } from "@/components/doctor/doctor-view"
import { AdminView } from "@/components/admin/admin-view"

export default function Page() {
  const [role, setRole] = useState<Role>("patient")

  return (
    <div className="min-h-svh bg-background">
      <Navbar role={role} onRoleChange={setRole} />
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {/* key fuerza el re-montaje para animar la transición entre vistas */}
        <div key={role} className="animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
          {role === "patient" && <PatientView />}
          {role === "doctor" && <DoctorView />}
          {role === "admin" && <AdminView />}
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
