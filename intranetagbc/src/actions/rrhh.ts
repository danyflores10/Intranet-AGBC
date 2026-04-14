"use server"

import { db } from "@/db"
import { personal, contactosEmergencia, directivos } from "@/db/schema"
import { eq, desc, asc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { registrarAuditLog } from "@/actions/auditoria"

/* ═══════════════════════ PERSONAL ═══════════════════════ */

export async function obtenerPersonal() {
  return db.select().from(personal).orderBy(personal.nombre)
}

export async function crearPersonal(data: {
  nombre: string
  ci: string
  cargo: string
  unidad: string
  email?: string
  telefono?: string
  foto?: string
  fechaIngreso: string
}) {
  const [nuevo] = await db.insert(personal).values(data).returning()
  await registrarAuditLog({ usuario: "sistema", accion: `Registró personal: ${data.nombre}`, modulo: "RRHH", resultado: "Exitoso" })
  revalidatePath("/rrhh")
  return nuevo
}

export async function actualizarPersonal(id: string, data: Partial<{
  nombre: string
  ci: string
  cargo: string
  unidad: string
  email: string
  telefono: string
  foto: string
  fechaIngreso: string
  estado: string
}>) {
  const [actualizado] = await db.update(personal).set(data).where(eq(personal.id, id)).returning()
  await registrarAuditLog({ usuario: "sistema", accion: `Actualizó personal ID: ${id}`, modulo: "RRHH", resultado: "Exitoso" })
  revalidatePath("/rrhh")
  return actualizado
}

export async function eliminarPersonal(id: string) {
  await db.delete(personal).where(eq(personal.id, id))
  await registrarAuditLog({ usuario: "sistema", accion: `Eliminó personal ID: ${id}`, modulo: "RRHH", resultado: "Exitoso" })
  revalidatePath("/rrhh")
}

/* ═══════════════════════ DIRECTIVOS ═══════════════════════ */

export async function obtenerDirectivos() {
  return db.select().from(directivos).orderBy(asc(directivos.orden), asc(directivos.nombre))
}

export async function crearDirectivo(data: {
  nombre: string
  cargo: string
  unidad: string
  email?: string
  telefono?: string
  foto?: string
  orden?: number
}) {
  const [nuevo] = await db.insert(directivos).values(data).returning()
  await registrarAuditLog({ usuario: "sistema", accion: `Registró directivo: ${data.nombre}`, modulo: "RRHH", resultado: "Exitoso" })
  revalidatePath("/rrhh")
  revalidatePath("/")
  return nuevo
}

export async function actualizarDirectivo(id: string, data: Partial<{
  nombre: string
  cargo: string
  unidad: string
  email: string
  telefono: string
  foto: string
  orden: number
  estado: string
}>) {
  const [actualizado] = await db.update(directivos).set(data).where(eq(directivos.id, id)).returning()
  await registrarAuditLog({ usuario: "sistema", accion: `Actualizó directivo ID: ${id}`, modulo: "RRHH", resultado: "Exitoso" })
  revalidatePath("/rrhh")
  revalidatePath("/")
  return actualizado
}

export async function eliminarDirectivo(id: string) {
  await db.delete(directivos).where(eq(directivos.id, id))
  await registrarAuditLog({ usuario: "sistema", accion: `Eliminó directivo ID: ${id}`, modulo: "RRHH", resultado: "Exitoso" })
  revalidatePath("/rrhh")
  revalidatePath("/")
}


/* ═══════════════════════ CONTACTOS EMERGENCIA ═══════════════════════ */
export async function obtenerContactosEmergencia(personalId: string) {
  return db.select().from(contactosEmergencia).where(eq(contactosEmergencia.personalId, personalId))
}

export async function crearContactoEmergencia(data: {
  personalId: string
  nombre: string
  parentesco: string
  telefono: string
}) {
  const [nuevo] = await db.insert(contactosEmergencia).values(data).returning()
  revalidatePath("/rrhh")
  return nuevo
}

export async function eliminarContactoEmergencia(id: string) {
  await db.delete(contactosEmergencia).where(eq(contactosEmergencia.id, id))
  revalidatePath("/rrhh")
}
