"use server"

import { db } from "@/db"
import { archivos, documentoCategorias, documentos } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { registrarAuditLog } from "@/actions/auditoria"

type DocumentoPapeleraPayload = {
  source: "documentos"
  version: number
  deletedAt: string
  documento: {
    id: string
    titulo: string
    categoriaId: string | null
    categoria: string | null
    autor: string
    estado: string
    archivo: string | null
    nombreArchivo: string | null
    tipoArchivo: string | null
    tamano: string | null
    descripcion: string | null
    createdAt: string
    updatedAt: string
  }
}

function parseDocumentoPapelera(raw: string | null): DocumentoPapeleraPayload | null {
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as Partial<DocumentoPapeleraPayload>

    if (parsed.source !== "documentos" || !parsed.documento || typeof parsed.documento.titulo !== "string") {
      return null
    }

    return parsed as DocumentoPapeleraPayload
  } catch {
    return null
  }
}

function parseSafeDate(value: string | undefined): Date {
  const date = value ? new Date(value) : new Date()
  if (Number.isNaN(date.getTime())) return new Date()
  return date
}

export async function obtenerPapeleraDocumentos() {
  const rows = await db
    .select()
    .from(archivos)
    .where(eq(archivos.estado, "papelera"))
    .orderBy(desc(archivos.createdAt))

  return rows
    .map((row) => {
      const payload = parseDocumentoPapelera(row.descripcion)
      if (!payload) return null

      return {
        papeleraId: row.id,
        documentoId: payload.documento.id,
        titulo: payload.documento.titulo,
        categoria: payload.documento.categoria ?? row.categoria,
        autor: payload.documento.autor,
        estadoOriginal: payload.documento.estado,
        archivo: payload.documento.archivo,
        nombreArchivo: payload.documento.nombreArchivo,
        tipoArchivo: payload.documento.tipoArchivo,
        tamano: payload.documento.tamano,
        eliminadoAt: parseSafeDate(payload.deletedAt),
        createdAt: parseSafeDate(payload.documento.createdAt),
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
}

export async function restaurarDocumentoDesdePapelera(papeleraId: string) {
  const [registroPapelera] = await db
    .select()
    .from(archivos)
    .where(eq(archivos.id, papeleraId))

  if (!registroPapelera || registroPapelera.estado !== "papelera") {
    throw new Error("Registro de papelera no encontrado.")
  }

  const payload = parseDocumentoPapelera(registroPapelera.descripcion)

  if (!payload) {
    throw new Error("No se pudo leer la información del documento eliminado.")
  }

  const estadoRestaurado = ["publicado", "pendiente", "borrador"].includes(payload.documento.estado)
    ? payload.documento.estado
    : "borrador"

  await db.transaction(async (tx) => {
    let categoriaId = payload.documento.categoriaId

    if (categoriaId) {
      const [categoriaExistente] = await tx
        .select({ id: documentoCategorias.id })
        .from(documentoCategorias)
        .where(eq(documentoCategorias.id, categoriaId))

      if (!categoriaExistente) {
        categoriaId = null
      }
    }

    const [documentoExistente] = await tx
      .select({ id: documentos.id })
      .from(documentos)
      .where(eq(documentos.id, payload.documento.id))

    const baseDocumento = {
      titulo: payload.documento.titulo,
      categoriaId,
      autor: payload.documento.autor,
      estado: estadoRestaurado,
      archivo: payload.documento.archivo,
      nombreArchivo: payload.documento.nombreArchivo,
      tipoArchivo: payload.documento.tipoArchivo,
      tamano: payload.documento.tamano,
      descripcion: payload.documento.descripcion,
      createdAt: parseSafeDate(payload.documento.createdAt),
      updatedAt: new Date(),
    }

    if (documentoExistente) {
      await tx.insert(documentos).values(baseDocumento)
    } else {
      await tx.insert(documentos).values({
        id: payload.documento.id,
        ...baseDocumento,
      })
    }

    await tx.delete(archivos).where(eq(archivos.id, papeleraId))
  })

  await registrarAuditLog({
    usuario: "sistema",
    accion: `Restauró documento desde papelera: ${payload.documento.titulo}`,
    modulo: "Archivo",
    resultado: "Exitoso",
  })

  revalidatePath("/archivo")
  revalidatePath("/documentos")
}

export async function eliminarRegistroPapelera(papeleraId: string) {
  const [registroPapelera] = await db
    .select({
      id: archivos.id,
      estado: archivos.estado,
      nombre: archivos.nombre,
    })
    .from(archivos)
    .where(eq(archivos.id, papeleraId))

  if (!registroPapelera || registroPapelera.estado !== "papelera") {
    throw new Error("Registro de papelera no encontrado.")
  }

  await db.delete(archivos).where(eq(archivos.id, papeleraId))

  await registrarAuditLog({
    usuario: "sistema",
    accion: `Eliminó registro de papelera: ${registroPapelera.nombre}`,
    modulo: "Archivo",
    resultado: "Exitoso",
  })

  revalidatePath("/archivo")
}
