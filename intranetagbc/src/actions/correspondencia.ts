"use server"

import { db } from "@/db"
import { correspondencia } from "@/db/schema"
import { eq, desc, and, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { registrarAuditLog } from "@/actions/auditoria"

export async function obtenerCorrespondencia(tipo?: string) {
  const where = tipo ? eq(correspondencia.tipo, tipo) : undefined
  return db.select().from(correspondencia).where(where).orderBy(desc(correspondencia.createdAt))
}

export async function crearCorrespondencia(data: {
  hojaRuta: string
  asunto: string
  remitente: string
  destinatario?: string
  tipo: string
  observaciones?: string
}) {
  const [nueva] = await db.insert(correspondencia).values(data).returning()
  await registrarAuditLog({ usuario: "sistema", accion: `Registró correspondencia: ${data.asunto}`, modulo: "Correspondencia", resultado: "Exitoso" })
  revalidatePath("/correspondencia")
  return nueva
}

export async function actualizarCorrespondencia(id: string, data: Partial<{
  asunto: string
  remitente: string
  destinatario: string
  estado: string
  leido: boolean
  observaciones: string
}>) {
  const [actualizada] = await db.update(correspondencia).set(data).where(eq(correspondencia.id, id)).returning()
  await registrarAuditLog({ usuario: "sistema", accion: `Actualizó correspondencia ID: ${id}`, modulo: "Correspondencia", resultado: "Exitoso" })
  revalidatePath("/correspondencia")
  return actualizada
}

export async function eliminarCorrespondencia(id: string) {
  await db.delete(correspondencia).where(eq(correspondencia.id, id))
  await registrarAuditLog({ usuario: "sistema", accion: `Eliminó correspondencia ID: ${id}`, modulo: "Correspondencia", resultado: "Exitoso" })
  revalidatePath("/correspondencia")
}

export async function obtenerStatsCorrespondencia() {
  const todas = await db.select().from(correspondencia)
  const entrada = todas.filter(c => c.tipo === "entrada")
  const salida = todas.filter(c => c.tipo === "salida")
  return {
    total: todas.length,
    entrada: entrada.length,
    salida: salida.length,
    sinLeer: entrada.filter(c => !c.leido).length,
    pendientes: todas.filter(c => c.estado === "pendiente").length,
    atendidas: todas.filter(c => c.estado === "activo").length,
  }
}
