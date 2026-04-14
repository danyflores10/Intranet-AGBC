"use server"

import { db } from "@/db"
import { archivos } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { registrarAuditLog } from "@/actions/auditoria"

export async function obtenerArchivos() {
  return db.select().from(archivos).orderBy(desc(archivos.createdAt))
}

export async function crearArchivo(data: {
  nombre: string
  tipo: string
  categoria: string
  ubicacion?: string
  descripcion?: string
  estado?: string
}) {
  const [nuevo] = await db.insert(archivos).values(data).returning()
  await registrarAuditLog({ usuario: "sistema", accion: `Creó archivo: ${data.nombre}`, modulo: "Archivo", resultado: "Exitoso" })
  revalidatePath("/archivo")
  return nuevo
}

export async function actualizarArchivo(id: string, data: Partial<{
  nombre: string
  tipo: string
  categoria: string
  ubicacion: string
  descripcion: string
  estado: string
}>) {
  const [actualizado] = await db.update(archivos).set(data).where(eq(archivos.id, id)).returning()
  await registrarAuditLog({ usuario: "sistema", accion: `Actualizó archivo ID: ${id}`, modulo: "Archivo", resultado: "Exitoso" })
  revalidatePath("/archivo")
  return actualizado
}

export async function eliminarArchivo(id: string) {
  await db.delete(archivos).where(eq(archivos.id, id))
  await registrarAuditLog({ usuario: "sistema", accion: `Eliminó archivo ID: ${id}`, modulo: "Archivo", resultado: "Exitoso" })
  revalidatePath("/archivo")
}
