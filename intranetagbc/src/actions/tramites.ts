"use server"

import { db } from "@/db"
import { tramites } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { registrarAuditLog } from "@/actions/auditoria"

export async function obtenerTramites() {
  return db.select().from(tramites).orderBy(desc(tramites.createdAt))
}

export async function crearTramite(data: {
  codigo: string
  solicitante: string
  tipo: string
  descripcion?: string
  prioridad?: string
}) {
  const [nuevo] = await db.insert(tramites).values(data).returning()
  await registrarAuditLog({ usuario: "sistema", accion: `Creó trámite: ${data.codigo}`, modulo: "Trámites", resultado: "Exitoso" })
  revalidatePath("/tramites")
  return nuevo
}

export async function actualizarTramite(id: string, data: Partial<{
  solicitante: string
  tipo: string
  descripcion: string
  estado: string
  prioridad: string
  observaciones: string
}>) {
  const [actualizado] = await db.update(tramites).set(data).where(eq(tramites.id, id)).returning()
  await registrarAuditLog({ usuario: "sistema", accion: `Actualizó trámite ID: ${id}`, modulo: "Trámites", resultado: "Exitoso" })
  revalidatePath("/tramites")
  return actualizado
}

export async function eliminarTramite(id: string) {
  await db.delete(tramites).where(eq(tramites.id, id))
  await registrarAuditLog({ usuario: "sistema", accion: `Eliminó trámite ID: ${id}`, modulo: "Trámites", resultado: "Exitoso" })
  revalidatePath("/tramites")
}
