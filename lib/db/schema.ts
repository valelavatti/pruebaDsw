import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  real,
} from "drizzle-orm/pg-core"

// --- Better Auth required tables -------------------------------------------
// Column names are camelCase to match Better Auth's defaults. Do not rename.
// These live in the public schema (self-hosted Better Auth), separate from the
// managed `neon_auth` schema.

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  // Rol de la aplicación: patient | doctor | admin
  role: text("role").notNull().default("patient"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
})

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
})

// --- App tables ------------------------------------------------------------

export const specialties = pgTable("specialties", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  activeDoctors: integer("activeDoctors").notNull().default(0),
})

export const doctors = pgTable("doctors", {
  id: text("id").primaryKey(),
  // Enlace opcional a una cuenta de usuario con rol "doctor".
  userId: text("userId"),
  firstName: text("firstName").notNull(),
  lastName: text("lastName").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull().default(""),
  specialtyId: text("specialtyId").notNull().default(""),
  specialtyName: text("specialtyName").notNull().default(""),
  avatar: text("avatar").notNull().default(""),
  license: text("license").notNull().default(""),
  rating: real("rating").notNull().default(5),
  yearsExperience: integer("yearsExperience").notNull().default(1),
  workDays: text("workDays").notNull().default("1,2,3,4,5"),
})

export const patients = pgTable("patients", {
  id: text("id").primaryKey(),
  // Enlace opcional a una cuenta de usuario con rol "patient".
  userId: text("userId"),
  firstName: text("firstName").notNull(),
  lastName: text("lastName").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull().default(""),
  dni: text("dni").notNull().default(""),
  birthDate: text("birthDate").notNull().default("1990-01-01"),
  bloodType: text("bloodType"),
  createdAt: text("createdAt").notNull(),
})

export const appointments = pgTable("appointments", {
  id: text("id").primaryKey(),
  patientId: text("patientId").notNull(),
  patientName: text("patientName").notNull(),
  doctorId: text("doctorId").notNull(),
  doctorName: text("doctorName").notNull(),
  specialtyName: text("specialtyName").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  status: text("status").notNull().default("scheduled"),
  reason: text("reason"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
})
