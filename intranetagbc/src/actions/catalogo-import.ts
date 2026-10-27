"use server"

import { db } from "@/db"
import { documentos, documentoCategorias } from "@/db/schema"
import { eq, inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { registrarAuditLog } from "@/actions/auditoria"
import { PERMISOS } from "@/lib/auth/permisos"
import { obtenerSesionConAccesoActual, type SesionConAcceso } from "@/lib/auth/session-access"
import { clasificarDocumento } from "@/lib/documentos-jerarquia"

const ROL_SUPER_ADMIN = "super_admin"

function normalizarTexto(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

function getLegacyPermissionAlias(permission: string): string | null {
  const tokens = normalizarTexto(permission).split(/\s+/).filter(Boolean)
  if (tokens.length < 2) return null
  const [action, ...resourceTokens] = tokens
  const resource = resourceTokens.join("_")
  if (resource.length === 0) return null
  return `${resource}.${action}`
}

function tienePermiso(sesion: SesionConAcceso, permiso: string): boolean {
  const permisoNormalizado = normalizarTexto(permiso)
  const legacyAlias = getLegacyPermissionAlias(permisoNormalizado)

  return sesion.permissions.some((permisoUsuario) => {
    const normalizedPermission = normalizarTexto(permisoUsuario)
    return (
      normalizedPermission === permisoNormalizado ||
      (legacyAlias !== null && normalizedPermission === legacyAlias)
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

export interface ItemSincronizacionCatalogo {
  id?: string
  titulo: string
  direccionNombre?: string
  subcategoriaNombre?: string
  tipoDocumental?: string
  fechaOficial?: string
  descripcion?: string
  archivoUrl?: string
  nombreArchivo?: string
  tipoArchivo?: string
  tamano?: string
  accion: "nuevo" | "actualizado"
}

export interface ResultadoSincronizacionCatalogo {
  success: boolean
  totalProcesados: number
  nuevos: number
  actualizados: number
  errores: number
  mensajes: string[]
}

export async function sincronizarCatalogoExcelAction(
  items: ItemSincronizacionCatalogo[]
): Promise<ResultadoSincronizacionCatalogo> {
  const sesion = await autorizarAccion(PERMISOS.DOCUMENTOS.CREAR)

  const catsDb = await db.select().from(documentoCategorias)
  const docsDb = await db.select().from(documentos)

  // Map categories by level and name
  const dirMap = new Map<string, typeof catsDb[0]>()
  const subMap = new Map<string, typeof catsDb[0]>()
  const catMap = new Map<string, typeof catsDb[0]>()

  for (const c of catsDb) {
    const norm = normalizarTexto(c.nombre)
    if (c.nivel === 1) {
      dirMap.set(norm, c)
    } else if (c.nivel === 2) {
      subMap.set(`${c.parentId}_${norm}`, c)
      // also fallback by pure name
      subMap.set(norm, c)
    } else if (c.nivel === 3) {
      catMap.set(`${c.parentId}_${norm}`, c)
      catMap.set(norm, c)
    }
  }

  // Maps for existing documents
  const docsById = new Map<string, typeof docsDb[0]>()
  const docsByTitle = new Map<string, typeof docsDb[0]>()
  const docsByFile = new Map<string, typeof docsDb[0]>()

  for (const d of docsDb) {
    docsById.set(d.id, d)
    if (d.titulo) docsByTitle.set(normalizarTexto(d.titulo), d)
    if (d.nombreArchivo) docsByFile.set(normalizarTexto(d.nombreArchivo), d)
    if (d.archivo) docsByFile.set(normalizarTexto(d.archivo), d)
  }

  let countNuevos = 0
  let countActualizados = 0
  let countErrores = 0
  const mensajes: string[] = []

  for (const item of items) {
    try {
      // 1. Resolve Hierarchy
      let dirName = item.direccionNombre?.trim()
      let subName = item.subcategoriaNombre?.trim()
      let tipoDoc = item.tipoDocumental?.trim()

      // If missing or unassigned, auto-classify
      if (!dirName || !subName || !tipoDoc) {
        const auto = clasificarDocumento(item.nombreArchivo || item.archivoUrl, item.titulo)
        dirName = dirName || auto.direccionNombre
        subName = subName || auto.subcategoriaNombre
        tipoDoc = tipoDoc || auto.tipoDocumental
      }

      // Find Dirección
      let dirObj = dirName ? dirMap.get(normalizarTexto(dirName)) : undefined
      if (!dirObj && dirName) {
        // Partial match
        for (const [k, v] of dirMap.entries()) {
          if (k.includes(normalizarTexto(dirName)) || normalizarTexto(dirName).includes(k)) {
            dirObj = v
            break
          }
        }
      }

      // Find Subcategoría
      let subObj = undefined
      if (dirObj && subName) {
        subObj = subMap.get(`${dirObj.id}_${normalizarTexto(subName)}`)
      }
      if (!subObj && subName) {
        subObj = subMap.get(normalizarTexto(subName))
      }

      // Find Level 3 Category
      let catObj = undefined
      if (subObj && tipoDoc) {
        catObj = catMap.get(`${subObj.id}_${normalizarTexto(tipoDoc)}`)
      }
      if (!catObj && tipoDoc) {
        catObj = catMap.get(normalizarTexto(tipoDoc))
      }

      const direccionId = dirObj ? dirObj.id : null
      const subcategoriaId = subObj ? subObj.id : null
      const categoriaId = catObj ? catObj.id : null

      // Check if document exists
      const normTitle = normalizarTexto(item.titulo || "")
      const normFile = normalizarTexto(item.nombreArchivo || "")
      
      const existing =
        (item.id ? docsById.get(item.id) : undefined) ||
        (normFile ? docsByFile.get(normFile) : undefined) ||
        (normTitle ? docsByTitle.get(normTitle) : undefined)

      if (item.accion === "actualizado" || existing) {
        const targetId = existing ? existing.id : item.id
        if (!targetId) {
          throw new Error(`No se encontró documento existente para actualizar: ${item.titulo}`)
        }

        await db
          .update(documentos)
          .set({
            titulo: item.titulo,
            direccionId: direccionId || (existing ? existing.direccionId : undefined),
            subcategoriaId: subcategoriaId || (existing ? existing.subcategoriaId : undefined),
            categoriaId: categoriaId || (existing ? existing.categoriaId : undefined),
            tipoDocumental: tipoDoc || (existing ? existing.tipoDocumental : undefined),
            descripcion: item.descripcion !== undefined ? item.descripcion : (existing ? existing.descripcion : null),
            archivo: item.archivoUrl || (existing ? existing.archivo : null),
            nombreArchivo: item.nombreArchivo || (existing ? existing.nombreArchivo : null),
            tipoArchivo: item.tipoArchivo || (existing ? existing.tipoArchivo : "pdf"),
            tamano: item.tamano || (existing ? existing.tamano : null),
            updatedAt: new Date(),
          })
          .where(eq(documentos.id, targetId))

        countActualizados++
      } else {
        // Insert new document
        await db.insert(documentos).values({
          titulo: item.titulo,
          direccionId: direccionId || undefined,
          subcategoriaId: subcategoriaId || undefined,
          categoriaId: categoriaId || undefined,
          tipoDocumental: tipoDoc || "Normativas",
          descripcion: item.descripcion || null,
          archivo: item.archivoUrl || null,
          nombreArchivo: item.nombreArchivo || null,
          tipoArchivo: item.tipoArchivo || "pdf",
          tamano: item.tamano || null,
          autor: "AGBC Institucional",
          estado: "publicado",
          creadoPor: sesion.id,
        })

        countNuevos++
      }
    } catch (err: any) {
      console.error("Error importando item:", item.titulo, err)
      countErrores++
      mensajes.push(`Error en "${item.titulo}": ${err?.message || "Error desconocido"}`)
    }
  }

  // Audit Log
  await registrarAuditLog({
    usuario: sesion.id,
    accion: `Sincronización de catálogo: ${countNuevos} nuevos, ${countActualizados} actualizados`,
    modulo: "Documentos",
    resultado: countErrores === 0 ? "Exitoso" : "Con errores",
    detalles: JSON.stringify({
      total: items.length,
      nuevos: countNuevos,
      actualizados: countActualizados,
      errores: countErrores,
    }),
  })

  revalidatePath("/documentos")

  return {
    success: countErrores === 0,
    totalProcesados: items.length,
    nuevos: countNuevos,
    actualizados: countActualizados,
    errores: countErrores,
    mensajes,
  }
}
