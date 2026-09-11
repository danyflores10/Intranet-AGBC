"use server"

import { db } from "@/db"
import { documentos, documentoCategorias, archivos } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { registrarAuditLog } from "@/actions/auditoria"
import { PERMISOS } from "@/lib/auth/permisos"
import { obtenerSesionConAccesoActual, type SesionConAcceso } from "@/lib/auth/session-access"

const ROL_SUPER_ADMIN = "super_admin"

function normalizarTexto(value: string): string {
  return value.trim().toLowerCase()
}

function getLegacyPermissionAlias(permission: string): string | null {
  const tokens = normalizarTexto(permission).split(/\s+/).filter(Boolean)

  if (tokens.length < 2) {
    return null
  }

  const [action, ...resourceTokens] = tokens
  const resource = resourceTokens.join("_")

  if (resource.length === 0) {
    return null
  }

  return `${resource}.${action}`
}

function tienePermiso(sesion: SesionConAcceso, permiso: string): boolean {
  const permisoNormalizado = normalizarTexto(permiso)
  const legacyAlias = getLegacyPermissionAlias(permisoNormalizado)

  return sesion.permissions.some((permisoUsuario) => {
    const normalizedPermission = normalizarTexto(permisoUsuario)
    return (
      normalizedPermission === permisoNormalizado
      || (legacyAlias !== null && normalizedPermission === legacyAlias)
    )
  })
}

async function requerirSesionAutenticada(): Promise<SesionConAcceso> {
  const sesion = await obtenerSesionConAccesoActual()

  if (!sesion) {
    throw new Error("No autenticado.")
  }

  return sesion
}

async function autorizarAccion(permisoRequerido: string): Promise<SesionConAcceso> {
  const sesion = await requerirSesionAutenticada()

  if (sesion.roles.some((role) => normalizarTexto(role) === ROL_SUPER_ADMIN)) {
    return sesion
  }

  if (!tienePermiso(sesion, permisoRequerido)) {
    throw new Error("No tienes permisos para realizar esta acción.")
  }

  return sesion
}

export async function obtenerDocumentos() {
  await requerirSesionAutenticada()

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

export async function obtenerDocumentosPublicados() {
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
    .where(eq(documentos.estado, "publicado"))
    .orderBy(desc(documentos.createdAt))
}

export async function obtenerCategorias() {
  await requerirSesionAutenticada()

  return db.select().from(documentoCategorias).orderBy(documentoCategorias.nombre)
}

export async function crearDocumento(data: {
  titulo: string
  categoriaId?: string
  autor?: string
  estado?: string
  archivo?: string
  nombreArchivo?: string
  tipoArchivo?: string
  tamano?: string
  descripcion?: string
}) {
  const sesion = await autorizarAccion(PERMISOS.DOCUMENTOS.CREAR)
  const payload = {
    ...data,
    autor: (data.autor || "").trim() || "AGBC Institucional",
  }
  const [nuevo] = await db.insert(documentos).values(payload).returning()
  await registrarAuditLog({ usuario: sesion.id, accion: `Creó documento: ${data.titulo}`, modulo: "Documentos", resultado: "Exitoso" })
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
  const sesion = await autorizarAccion(PERMISOS.DOCUMENTOS.EDITAR)
  const [actualizado] = await db.update(documentos).set(data).where(eq(documentos.id, id)).returning()
  await registrarAuditLog({ usuario: sesion.id, accion: `Actualizó documento ID: ${id}`, modulo: "Documentos", resultado: "Exitoso" })
  revalidatePath("/documentos")
  return actualizado
}

export async function eliminarDocumento(id: string) {
  const sesion = await autorizarAccion(PERMISOS.DOCUMENTOS.ELIMINAR)

  const [doc] = await db
    .select({
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
    })
    .from(documentos)
    .leftJoin(documentoCategorias, eq(documentos.categoriaId, documentoCategorias.id))
    .where(eq(documentos.id, id))

  if (!doc) {
    throw new Error("Documento no encontrado.")
  }

  const payloadPapelera = {
    source: "documentos",
    version: 1,
    deletedAt: new Date().toISOString(),
    documento: {
      id: doc.id,
      titulo: doc.titulo,
      categoriaId: doc.categoriaId,
      categoria: doc.categoria,
      autor: doc.autor,
      estado: doc.estado,
      archivo: doc.archivo,
      nombreArchivo: doc.nombreArchivo,
      tipoArchivo: doc.tipoArchivo,
      tamano: doc.tamano,
      descripcion: doc.descripcion,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    },
  }

  await db.transaction(async (tx) => {
    await tx.insert(archivos).values({
      nombre: doc.titulo,
      tipo: "papelera_documento",
      categoria: doc.categoria ?? "Sin categoría",
      ubicacion: "PAPELERA",
      descripcion: JSON.stringify(payloadPapelera),
      estado: "papelera",
    })

    await tx.delete(documentos).where(eq(documentos.id, id))
  })

  await registrarAuditLog({
    usuario: sesion.id,
    accion: `Movió documento a papelera: ${doc.titulo}`,
    modulo: "Documentos",
    resultado: "Exitoso",
  })
  revalidatePath("/documentos")
  revalidatePath("/archivo")
}

export async function crearCategoria(data: { nombre: string; descripcion?: string }) {
  const sesion = await autorizarAccion(PERMISOS.DOCUMENTOS.CREAR)
  const [nueva] = await db.insert(documentoCategorias).values(data).returning()
  await registrarAuditLog({
    usuario: sesion.id,
    accion: `Creó categoría de documento: ${data.nombre}`,
    modulo: "Documentos",
    resultado: "Exitoso",
  })
  revalidatePath("/documentos")
  return nueva
}

export async function actualizarCategoria(id: string, data: Partial<{ nombre: string; descripcion: string }>) {
  const sesion = await autorizarAccion(PERMISOS.DOCUMENTOS.EDITAR)
  const [actualizada] = await db.update(documentoCategorias).set(data).where(eq(documentoCategorias.id, id)).returning()
  await registrarAuditLog({
    usuario: sesion.id,
    accion: `Actualizó categoría de documento ID: ${id}`,
    modulo: "Documentos",
    resultado: "Exitoso",
  })
  revalidatePath("/documentos")
  return actualizada
}

export async function eliminarCategoria(id: string) {
  const sesion = await autorizarAccion(PERMISOS.DOCUMENTOS.ELIMINAR)
  const [categoriaEliminada] = await db
    .delete(documentoCategorias)
    .where(eq(documentoCategorias.id, id))
    .returning({
      id: documentoCategorias.id,
      nombre: documentoCategorias.nombre,
    })
  await registrarAuditLog({
    usuario: sesion.id,
    accion: categoriaEliminada
      ? `Eliminó categoría de documento: ${categoriaEliminada.nombre}`
      : `Eliminó categoría de documento ID: ${id}`,
    modulo: "Documentos",
    resultado: "Exitoso",
  })
  revalidatePath("/documentos")
}
