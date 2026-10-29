"use server"

import { db } from "@/db"
import { documentos, documentoCategorias, catalogoImportaciones, users } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { registrarAuditLog } from "@/actions/auditoria"
import { PERMISOS } from "@/lib/auth/permisos"
import { obtenerSesionConAccesoActual, type SesionConAcceso } from "@/lib/auth/session-access"
import { clasificarDocumento } from "@/lib/documentos-jerarquia"
import {
  calcularVersionesCatalogo,
  normalizarFamiliaCanonica,
} from "@/lib/documentos-versionador"
import { verificarDisponibilidadFisica } from "@/lib/documentos-servidor"

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
  numeroCorrelativo?: number
  titulo: string
  direccionNombre?: string
  subcategoriaNombre?: string
  tipoDocumental?: string
  familiaCodigo?: string
  version?: string
  esVigente?: boolean
  fechaOficial?: string
  descripcion?: string
  archivoUrl?: string
  nombreArchivo?: string
  tipoArchivo?: string
  tamano?: string
  disponibilidadArchivo?: string
  accion: "nuevo" | "actualizado"
  diferencias?: string[]
}

export interface ResultadoSincronizacionCatalogo {
  success: boolean
  totalProcesados: number
  nuevos: number
  actualizados: number
  sinCambios: number
  faltanArchivo: number
  errores: number
  mensajes: string[]
}

export interface RegistroHistorialImportacion {
  id: string
  nombreArchivo: string
  totalProcesados: number
  nuevos: number
  actualizados: number
  sinCambios: number
  faltanArchivo: number
  detalles: any
  usuarioNombre: string | null
  revertido?: boolean | null
  revertidoAt?: Date | null
  revertidoPor?: string | null
  createdAt: Date
}

export async function sincronizarCatalogoExcelAction(
  items: ItemSincronizacionCatalogo[],
  nombreArchivoOrigen: string = "catalogo_documentos.xlsx",
  sinCambiosCount: number = 0,
  faltanArchivoCount: number = 0
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
      subMap.set(norm, c)
    } else if (c.nivel === 3) {
      catMap.set(`${c.parentId}_${norm}`, c)
      catMap.set(norm, c)
    }
  }

  // Maps for existing documents
  const docsById = new Map<string, typeof docsDb[0]>()
  const docsByNum = new Map<number, typeof docsDb[0]>()
  const docsByTitle = new Map<string, typeof docsDb[0]>()
  const docsByFile = new Map<string, typeof docsDb[0]>()

  for (const d of docsDb) {
    docsById.set(d.id, d)
    if (d.numeroCorrelativo) docsByNum.set(d.numeroCorrelativo, d)
    if (d.titulo) docsByTitle.set(normalizarTexto(d.titulo), d)
    if (d.nombreArchivo) docsByFile.set(normalizarTexto(d.nombreArchivo), d)
    if (d.archivo) docsByFile.set(normalizarTexto(d.archivo), d)
  }

  let countNuevos = 0
  let countActualizados = 0
  let countErrores = 0
  const mensajes: string[] = []
  const detalleCambios: any[] = []

  for (const item of items) {
    try {
      // 1. Resolver Jerarquía
      let dirName = item.direccionNombre?.trim()
      let subName = item.subcategoriaNombre?.trim()
      let tipoDoc = item.tipoDocumental?.trim()

      if (!dirName || !subName || !tipoDoc) {
        const auto = clasificarDocumento(item.nombreArchivo || item.archivoUrl, item.titulo)
        dirName = dirName || auto.direccionNombre
        subName = subName || auto.subcategoriaNombre
        tipoDoc = tipoDoc || auto.tipoDocumental
      }

      // Dirección
      let dirObj = dirName ? dirMap.get(normalizarTexto(dirName)) : undefined
      if (!dirObj && dirName) {
        for (const [k, v] of dirMap.entries()) {
          if (k.includes(normalizarTexto(dirName)) || normalizarTexto(dirName).includes(k)) {
            dirObj = v
            break
          }
        }
      }

      // Subcategoría
      let subObj = undefined
      if (dirObj && subName) {
        subObj = subMap.get(`${dirObj.id}_${normalizarTexto(subName)}`)
      }
      if (!subObj && subName) {
        subObj = subMap.get(normalizarTexto(subName))
      }

      // Categoría Nivel 3
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

      // 2. Verificar existencia con prioridad estricta: ID -> Número Correlativo -> Archivo -> Título
      const normTitle = normalizarTexto(item.titulo || "")
      const normFile = normalizarTexto(item.nombreArchivo || "")
      
      const existing =
        (item.numeroCorrelativo ? docsByNum.get(item.numeroCorrelativo) : undefined) ||
        (item.id ? docsById.get(item.id) : undefined) ||
        (normTitle ? docsByTitle.get(normTitle) : undefined) ||
        (normFile ? docsByFile.get(normFile) : undefined)

      // Verificar disponibilidad física de archivo
      const checkFisico = verificarDisponibilidadFisica(item.archivoUrl || existing?.archivo)
      const dispFinal =
        item.disponibilidadArchivo ||
        (checkFisico.disponible ? "disponible" : "falta_archivo")

      const codFam = item.familiaCodigo !== undefined && item.familiaCodigo !== "—" && item.familiaCodigo !== ""
        ? item.familiaCodigo
        : (existing?.familiaCodigo || null)

      if (item.accion === "actualizado" || existing) {
        const targetId = existing ? existing.id : item.id
        if (!targetId) {
          throw new Error(`No se encontró documento existente para actualizar: ${item.titulo}`)
        }

        // Snapshot de valores previos para permitir reversión / deshacer cambios
        const estadoAnterior = existing ? {
          titulo: existing.titulo,
          numeroCorrelativo: existing.numeroCorrelativo,
          fechaEmision: existing.fechaEmision,
          direccionId: existing.direccionId,
          subcategoriaId: existing.subcategoriaId,
          categoriaId: existing.categoriaId,
          tipoDocumental: existing.tipoDocumental,
          descripcion: existing.descripcion,
          archivo: existing.archivo,
          nombreArchivo: existing.nombreArchivo,
          tipoArchivo: existing.tipoArchivo,
          tamano: existing.tamano,
          disponibilidadArchivo: existing.disponibilidadArchivo,
          familiaCodigo: existing.familiaCodigo,
          version: existing.version,
          esVigente: existing.esVigente,
        } : null

        await db
          .update(documentos)
          .set({
            titulo: item.titulo,
            numeroCorrelativo: item.numeroCorrelativo !== undefined ? item.numeroCorrelativo : (existing ? existing.numeroCorrelativo : null),
            fechaEmision: item.fechaOficial || (existing ? existing.fechaEmision : null),
            direccionId: direccionId || (existing ? existing.direccionId : undefined),
            subcategoriaId: subcategoriaId || (existing ? existing.subcategoriaId : undefined),
            categoriaId: categoriaId || (existing ? existing.categoriaId : undefined),
            tipoDocumental: tipoDoc || (existing ? existing.tipoDocumental : undefined),
            descripcion: item.descripcion !== undefined ? item.descripcion : (existing ? existing.descripcion : null),
            archivo: item.archivoUrl || (existing ? existing.archivo : null),
            nombreArchivo: item.nombreArchivo || (existing ? existing.nombreArchivo : null),
            tipoArchivo: item.tipoArchivo || (existing ? existing.tipoArchivo : "pdf"),
            tamano: item.tamano || (existing ? existing.tamano : null),
            disponibilidadArchivo: dispFinal,
            familiaCodigo: codFam,
            version: item.version || (existing ? existing.version : "v1.0"),
            esVigente: item.esVigente !== undefined ? item.esVigente : (existing ? existing.esVigente : true),
            updatedAt: new Date(),
          })
          .where(eq(documentos.id, targetId))

        // Actualizar en mapa local para consistencia en la misma transacción
        if (existing) {
          existing.titulo = item.titulo
          if (item.numeroCorrelativo !== undefined) existing.numeroCorrelativo = item.numeroCorrelativo
          existing.version = item.version || existing.version
          existing.esVigente = item.esVigente !== undefined ? item.esVigente : existing.esVigente
          existing.familiaCodigo = codFam
        }

        countActualizados++
        detalleCambios.push({
          id: targetId,
          tipo: "actualizado",
          titulo: item.titulo,
          diferencias: item.diferencias || ["Actualización de metadatos"],
          estadoAnterior,
        })
      } else {
        // Inserción de nuevo documento
        const [nuevoDoc] = await db
          .insert(documentos)
          .values({
            titulo: item.titulo,
            numeroCorrelativo: item.numeroCorrelativo || null,
            fechaEmision: item.fechaOficial || "Sin fecha fija",
            direccionId: direccionId || undefined,
            subcategoriaId: subcategoriaId || undefined,
            categoriaId: categoriaId || undefined,
            tipoDocumental: tipoDoc || "Normativas",
            descripcion: item.descripcion || null,
            archivo: item.archivoUrl || null,
            nombreArchivo: item.nombreArchivo || null,
            tipoArchivo: item.tipoArchivo || "pdf",
            tamano: item.tamano || null,
            disponibilidadArchivo: dispFinal,
            familiaCodigo: codFam,
            version: item.version || "v1.0",
            esVigente: item.esVigente !== undefined ? item.esVigente : true,
            autor: "AGBC Institucional",
            estado: "publicado",
            creadoPor: sesion.id,
          })
          .returning({ id: documentos.id })

        countNuevos++
        detalleCambios.push({
          id: nuevoDoc?.id,
          tipo: "nuevo",
          titulo: item.titulo,
          direccion: dirName,
          subcategoria: subName,
        })
      }
    } catch (err: any) {
      console.error("Error importando item:", item.titulo, err)
      countErrores++
      mensajes.push(`Error en "${item.titulo}": ${err?.message || "Error desconocido"}`)
    }
  }

  // 3. Notificación y registro en historial de importaciones
  try {
    const [usr] = await db
      .select({ firstName: users.firstName, lastName: users.lastNamePaternal })
      .from(users)
      .where(eq(users.id, sesion.id))
      .limit(1)
    const usuarioNombre = usr ? `${usr.firstName || ""} ${usr.lastName || ""}`.trim() : "Administrador AGBC"

    await db.insert(catalogoImportaciones).values({
      nombreArchivo: nombreArchivoOrigen,
      totalProcesados: items.length + sinCambiosCount,
      nuevos: countNuevos,
      actualizados: countActualizados,
      sinCambios: sinCambiosCount,
      faltanArchivo: faltanArchivoCount,
      detalles: JSON.stringify(detalleCambios),
      usuarioId: sesion.id,
      usuarioNombre: usuarioNombre,
    })
  } catch (errHist) {
    console.error("Error guardando historial de importación:", errHist)
  }

  // 5. Auditoría institucional
  await registrarAuditLog({
    usuario: sesion.id,
    accion: `Sincronización de catálogo: ${countNuevos} nuevos, ${countActualizados} actualizados, ${sinCambiosCount} sin cambios`,
    modulo: "Documentos",
    resultado: countErrores === 0 ? "Exitoso" : "Con errores",
    detalles: JSON.stringify({
      archivoOrigen: nombreArchivoOrigen,
      total: items.length + sinCambiosCount,
      nuevos: countNuevos,
      actualizados: countActualizados,
      sinCambios: sinCambiosCount,
      faltanArchivo: faltanArchivoCount,
      errores: countErrores,
    }),
  })

  revalidatePath("/(admin)/documentos")
  revalidatePath("/documentos")
  revalidatePath("/(admin)/dashboard")
  revalidatePath("/dashboard")
  revalidatePath("/")

  return {
    success: countErrores === 0,
    totalProcesados: items.length + sinCambiosCount,
    nuevos: countNuevos,
    actualizados: countActualizados,
    sinCambios: sinCambiosCount,
    faltanArchivo: faltanArchivoCount,
    errores: countErrores,
    mensajes,
  }
}

/**
 * Obtiene el historial completo de importaciones de catálogo realizadas.
 */
export async function obtenerHistorialImportacionesAction(): Promise<RegistroHistorialImportacion[]> {
  await autorizarAccion(PERMISOS.DOCUMENTOS.VER)

  const registros = await db
    .select()
    .from(catalogoImportaciones)
    .orderBy(desc(catalogoImportaciones.createdAt))
    .limit(50)

  return registros.map((r) => {
    let parsedDetalles: any = []
    try {
      parsedDetalles = r.detalles ? JSON.parse(r.detalles) : []
    } catch {
      parsedDetalles = []
    }

    return {
      id: r.id,
      nombreArchivo: r.nombreArchivo,
      totalProcesados: r.totalProcesados || 0,
      nuevos: r.nuevos || 0,
      actualizados: r.actualizados || 0,
      sinCambios: r.sinCambios || 0,
      faltanArchivo: r.faltanArchivo || 0,
      detalles: parsedDetalles,
      usuarioNombre: r.usuarioNombre,
      revertido: r.revertido,
      revertidoAt: r.revertidoAt,
      revertidoPor: r.revertidoPor,
      createdAt: r.createdAt,
    }
  })
}

/**
 * Revierte una importación previa: elimina documentos nuevos y restaura los valores previos de los actualizados.
 */
export async function revertirImportacionAction(
  importacionId: string
): Promise<{ success: boolean; message: string }> {
  const sesion = await autorizarAccion(PERMISOS.DOCUMENTOS.EDITAR)

  const [importacion] = await db
    .select()
    .from(catalogoImportaciones)
    .where(eq(catalogoImportaciones.id, importacionId))
    .limit(1)

  if (!importacion) {
    throw new Error("Registro de importación no encontrado")
  }

  if (importacion.revertido) {
    throw new Error("Esta importación ya fue revertida previamente")
  }

  let detalles: any[] = []
  try {
    detalles = importacion.detalles ? JSON.parse(importacion.detalles) : []
  } catch {
    detalles = []
  }

  let revertidosNuevos = 0
  let restauradosActualizados = 0

  for (const item of detalles) {
    try {
      if (item.tipo === "nuevo" && item.id) {
        await db.delete(documentos).where(eq(documentos.id, item.id))
        revertidosNuevos++
      } else if (item.tipo === "actualizado" && item.id && item.estadoAnterior) {
        await db
          .update(documentos)
          .set({
            titulo: item.estadoAnterior.titulo,
            numeroCorrelativo: item.estadoAnterior.numeroCorrelativo,
            fechaEmision: item.estadoAnterior.fechaEmision,
            direccionId: item.estadoAnterior.direccionId,
            subcategoriaId: item.estadoAnterior.subcategoriaId,
            categoriaId: item.estadoAnterior.categoriaId,
            tipoDocumental: item.estadoAnterior.tipoDocumental,
            descripcion: item.estadoAnterior.descripcion,
            archivo: item.estadoAnterior.archivo,
            nombreArchivo: item.estadoAnterior.nombreArchivo,
            tipoArchivo: item.estadoAnterior.tipoArchivo,
            tamano: item.estadoAnterior.tamano,
            disponibilidadArchivo: item.estadoAnterior.disponibilidadArchivo,
            familiaCodigo: item.estadoAnterior.familiaCodigo,
            version: item.estadoAnterior.version,
            esVigente: item.estadoAnterior.esVigente,
            updatedAt: new Date(),
          })
          .where(eq(documentos.id, item.id))
        restauradosActualizados++
      }
    } catch (errItem) {
      console.error("Error revirtiendo elemento:", item, errItem)
    }
  }

  // Recalcular versiones del catálogo para asegurar coherencia
  try {
    const todosDocs = await db.select().from(documentos)
    const versionados = calcularVersionesCatalogo(
      todosDocs.map((d) => ({
        id: d.id,
        titulo: d.titulo,
        fechaEmision: d.fechaEmision,
        numeroCorrelativo: d.numeroCorrelativo,
        subcategoriaId: d.subcategoriaId,
      }))
    )

    for (const v of versionados) {
      if (!v.item.id) continue
      await db
        .update(documentos)
        .set({
          version: v.version,
          esVigente: v.esVigente,
          familiaCodigo: v.familiaCodigo,
        })
        .where(eq(documentos.id, v.item.id))
    }
  } catch (errRecalc) {
    console.error("Error recalculando versiones tras reversión:", errRecalc)
  }

  // Obtener nombre del usuario que revierte
  const [usr] = await db
    .select({ firstName: users.firstName, lastName: users.lastNamePaternal })
    .from(users)
    .where(eq(users.id, sesion.id))
    .limit(1)
  const usuarioNombre = usr ? `${usr.firstName || ""} ${usr.lastName || ""}`.trim() : "Administrador AGBC"

  await db
    .update(catalogoImportaciones)
    .set({
      revertido: true,
      revertidoAt: new Date(),
      revertidoPor: usuarioNombre,
    })
    .where(eq(catalogoImportaciones.id, importacionId))

  await registrarAuditLog({
    usuario: sesion.id,
    accion: `Reversión de importación "${importacion.nombreArchivo}": eliminados ${revertidosNuevos} nuevos, restaurados ${restauradosActualizados} modificados`,
    modulo: "Documentos",
    resultado: "Exitoso",
  })

  revalidatePath("/(admin)/documentos")
  revalidatePath("/documentos")
  revalidatePath("/(admin)/dashboard")
  revalidatePath("/dashboard")
  revalidatePath("/")

  return {
    success: true,
    message: `Importación revertida: se eliminaron ${revertidosNuevos} documentos creados y se restauraron ${restauradosActualizados} documentos modificados.`,
  }
}
