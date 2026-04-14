"use server"

import { db } from "@/db"
import { documentos, documentoCategorias } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { registrarAuditLog } from "@/actions/auditoria"

export async function obtenerDocumentos() {
  return db.select({
    id: documentos.id,
    titulo: documentos.titulo,
    categoriaId: documentos.categoriaId,
    categoria: documentoCategorias.nombre,
    autor: documentos.autor,
    estado: documentos.estado,
    archivo: documentos.archivo,
    nombreArchivo: documentos.nombreArchivo,
    tipoArchivo: documentos.tipoArchivo,
    tamano: documentos.tamano,
    descripcion: documentos.descripcion,
    createdAt: documentos.createdAt,
    updatedAt: documentos.updatedAt,
  }).from(documentos)
    .leftJoin(documentoCategorias, eq(documentos.categoriaId, documentoCategorias.id))
    .orderBy(desc(documentos.createdAt))
}

export async function obtenerCategorias() {
  return db.select().from(documentoCategorias).orderBy(documentoCategorias.nombre)
}

export async function crearDocumento(data: {
  titulo: string
  categoriaId?: string
  autor: string
  estado?: string
  archivo?: string
  nombreArchivo?: string
  tipoArchivo?: string
  tamano?: string
  descripcion?: string
}) {
  const [nuevo] = await db.insert(documentos).values(data).returning()
  await registrarAuditLog({ usuario: "sistema", accion: `Creó documento: ${data.titulo}`, modulo: "Documentos", resultado: "Exitoso" })
  revalidatePath("/documentos")
  return nuevo
}

export async function actualizarDocumento(id: string, data: Partial<{
  titulo: string
  categoriaId: string
  autor: string
  estado: string
  archivo: string
  nombreArchivo: string
  tipoArchivo: string
  tamano: string
  descripcion: string
}>) {
  const [actualizado] = await db.update(documentos).set(data).where(eq(documentos.id, id)).returning()
  await registrarAuditLog({ usuario: "sistema", accion: `Actualizó documento ID: ${id}`, modulo: "Documentos", resultado: "Exitoso" })
  revalidatePath("/documentos")
  return actualizado
}

export async function eliminarDocumento(id: string) {
  await db.delete(documentos).where(eq(documentos.id, id))
  await registrarAuditLog({ usuario: "sistema", accion: `Eliminó documento ID: ${id}`, modulo: "Documentos", resultado: "Exitoso" })
  revalidatePath("/documentos")
}

export async function crearCategoria(data: { nombre: string; descripcion?: string }) {
  const [nueva] = await db.insert(documentoCategorias).values(data).returning()
  revalidatePath("/documentos")
  return nueva
}

export async function actualizarCategoria(id: string, data: Partial<{ nombre: string; descripcion: string }>) {
  const [actualizada] = await db.update(documentoCategorias).set(data).where(eq(documentoCategorias.id, id)).returning()
  revalidatePath("/documentos")
  return actualizada
}

export async function eliminarCategoria(id: string) {
  await db.delete(documentoCategorias).where(eq(documentoCategorias.id, id))
  revalidatePath("/documentos")
}
