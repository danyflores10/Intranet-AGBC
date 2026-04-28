"use server"

import { db } from "@/db"
import {
  correspondencia,
  correspondenciaAdjuntos,
  correspondenciaMovimientos,
  correspondenciaTiposDocumento,
  sucursales,
  users,
} from "@/db/schema"
import { and, asc, desc, eq, gte, isNotNull, isNull, lte, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { registrarAuditLog } from "@/actions/auditoria"
import { obtenerSesionConAccesoActual } from "@/lib/auth/session-access"
import {
  ESTADOS_FINALES,
  TIPOS_DOCUMENTO_DEFAULT,
  type EstadoCorrespondencia,
} from "@/lib/correspondencia-constants"

const MODULO = "Correspondencia"
const ROUTE_BASE = "/correspondencia"

function revalidar() {
  revalidatePath(ROUTE_BASE)
  revalidatePath(`${ROUTE_BASE}/dashboard`)
  revalidatePath(`${ROUTE_BASE}/derivaciones`)
  revalidatePath(`${ROUTE_BASE}/seguimiento`)
  revalidatePath(`${ROUTE_BASE}/archivo`)
  revalidatePath(`${ROUTE_BASE}/reportes`)
  revalidatePath(`${ROUTE_BASE}/configuracion`)
}

async function obtenerUsuarioId(): Promise<string | null> {
  const sesion = await obtenerSesionConAccesoActual().catch(() => null)
  return sesion?.id ?? null
}

/* ────────────────────────────────────────────────────────────────────────
 *  HOJA DE RUTA
 * ─────────────────────────────────────────────────────────────────────── */
export async function generarHojaRuta(): Promise<string> {
  const year = new Date().getFullYear()
  const prefijo = `HR-${year}-`
  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(correspondencia)
    .where(sql`${correspondencia.hojaRuta} LIKE ${prefijo + "%"}`)

  const numero = String(Number(total ?? 0) + 1).padStart(5, "0")
  return `${prefijo}${numero}`
}

/* ────────────────────────────────────────────────────────────────────────
 *  TIPOS DE DOCUMENTO
 * ─────────────────────────────────────────────────────────────────────── */
export async function asegurarTiposDocumentoBase() {
  const existentes = await db.select().from(correspondenciaTiposDocumento)
  if (existentes.length > 0) return existentes
  await db
    .insert(correspondenciaTiposDocumento)
    .values(
      TIPOS_DOCUMENTO_DEFAULT.map((t) => ({
        nombre: t.nombre,
        plazoDefaultDias: t.plazoDefaultDias,
      })),
    )
    .onConflictDoNothing({ target: correspondenciaTiposDocumento.nombre })
  return db.select().from(correspondenciaTiposDocumento).orderBy(asc(correspondenciaTiposDocumento.nombre))
}

export async function obtenerTiposDocumento() {
  await asegurarTiposDocumentoBase()
  return db
    .select()
    .from(correspondenciaTiposDocumento)
    .orderBy(asc(correspondenciaTiposDocumento.nombre))
}

export async function crearTipoDocumento(data: {
  nombre: string
  descripcion?: string
  plazoDefaultDias?: number
}) {
  const [row] = await db
    .insert(correspondenciaTiposDocumento)
    .values({
      nombre: data.nombre.trim(),
      descripcion: data.descripcion?.trim() || null,
      plazoDefaultDias: data.plazoDefaultDias ?? 5,
    })
    .returning()
  await registrarAuditLog({
    accion: `Creó tipo de documento: ${data.nombre}`,
    modulo: MODULO,
  })
  revalidar()
  return row
}

export async function actualizarTipoDocumento(
  id: string,
  data: { nombre?: string; descripcion?: string; plazoDefaultDias?: number; activo?: boolean },
) {
  const [row] = await db
    .update(correspondenciaTiposDocumento)
    .set({
      nombre: data.nombre,
      descripcion: data.descripcion,
      plazoDefaultDias: data.plazoDefaultDias,
      activo: data.activo,
    })
    .where(eq(correspondenciaTiposDocumento.id, id))
    .returning()
  await registrarAuditLog({
    accion: `Actualizó tipo de documento ID: ${id}`,
    modulo: MODULO,
  })
  revalidar()
  return row
}

export async function eliminarTipoDocumento(id: string) {
  await db.delete(correspondenciaTiposDocumento).where(eq(correspondenciaTiposDocumento.id, id))
  await registrarAuditLog({
    accion: `Eliminó tipo de documento ID: ${id}`,
    modulo: MODULO,
  })
  revalidar()
}

/* ────────────────────────────────────────────────────────────────────────
 *  CORRESPONDENCIA
 * ─────────────────────────────────────────────────────────────────────── */
export type CrearCorrespondenciaInput = {
  hojaRuta?: string
  tipoDocumentoId?: string
  origen?: "interno" | "externo"
  tipo?: "entrada" | "salida" | "interna"
  prioridad?: string
  remitente: string
  remitenteUserId?: string
  destinatario?: string
  destinatarioUserId?: string
  destinoArea?: string
  destinoSucursalId?: string
  asunto: string
  descripcion?: string
  observaciones?: string
  fechaRecepcion?: Date
  fechaEnvio?: Date
  plazoAtencion?: Date
  adjuntos?: Array<{ url: string; nombre: string; tipo: string; tamano: number }>
}

export async function crearCorrespondencia(data: CrearCorrespondenciaInput) {
  if (!data.asunto?.trim()) throw new Error("El asunto es obligatorio")
  if (!data.remitente?.trim()) throw new Error("El remitente es obligatorio")

  const usuarioId = await obtenerUsuarioId()
  const hojaRuta = data.hojaRuta?.trim() || (await generarHojaRuta())

  const tipo = data.tipo ?? "entrada"
  const prioridad = data.prioridad ?? "normal"

  const [nueva] = await db
    .insert(correspondencia)
    .values({
      hojaRuta,
      tipoDocumentoId: data.tipoDocumentoId ?? null,
      origen: data.origen ?? "interno",
      tipo,
      prioridad,
      estado: "registrado",
      remitente: data.remitente.trim(),
      remitenteUserId: data.remitenteUserId ?? null,
      destinatario: data.destinatario?.trim() ?? null,
      destinatarioUserId: data.destinatarioUserId ?? null,
      destinoArea: data.destinoArea?.trim() ?? null,
      destinoSucursalId: data.destinoSucursalId ?? null,
      asunto: data.asunto.trim(),
      descripcion: data.descripcion?.trim() ?? null,
      observaciones: data.observaciones?.trim() ?? null,
      fechaRecepcion: data.fechaRecepcion ?? new Date(),
      fechaEnvio: tipo === "salida" ? data.fechaEnvio ?? new Date() : data.fechaEnvio ?? null,
      plazoAtencion: data.plazoAtencion ?? null,
      creadoPor: usuarioId,
      actualizadoPor: usuarioId,
    })
    .returning()

  // Movimiento inicial
  await db.insert(correspondenciaMovimientos).values({
    correspondenciaId: nueva.id,
    accion: "registro",
    estadoNuevo: "registrado",
    comentario: "Registro inicial de la correspondencia",
    creadoPor: usuarioId,
  })

  if (data.adjuntos?.length) {
    await db.insert(correspondenciaAdjuntos).values(
      data.adjuntos.map((a) => ({
        correspondenciaId: nueva.id,
        archivoNombre: a.nombre,
        archivoUrl: a.url,
        archivoTipo: a.tipo,
        archivoTamano: a.tamano,
        subidoPor: usuarioId,
      })),
    )
  }

  await registrarAuditLog({
    accion: `Registró correspondencia ${hojaRuta}: ${data.asunto}`,
    modulo: MODULO,
  })
  revalidar()
  return nueva
}

export async function actualizarCorrespondencia(
  id: string,
  data: Partial<{
    asunto: string
    descripcion: string
    observaciones: string
    remitente: string
    destinatario: string
    destinoArea: string
    destinoSucursalId: string
    destinatarioUserId: string
    tipoDocumentoId: string
    origen: string
    tipo: string
    prioridad: string
    plazoAtencion: Date | null
    leido: boolean
  }>,
) {
  const usuarioId = await obtenerUsuarioId()
  const [row] = await db
    .update(correspondencia)
    .set({ ...data, actualizadoPor: usuarioId })
    .where(eq(correspondencia.id, id))
    .returning()

  await registrarAuditLog({
    accion: `Actualizó correspondencia ${row?.hojaRuta ?? id}`,
    modulo: MODULO,
  })
  revalidar()
  return row
}

export async function marcarLeidoCorrespondencia(id: string) {
  const usuarioId = await obtenerUsuarioId()
  await db
    .update(correspondencia)
    .set({ leido: true, actualizadoPor: usuarioId })
    .where(eq(correspondencia.id, id))
  revalidar()
}

export async function eliminarCorrespondencia(id: string) {
  const [actual] = await db.select().from(correspondencia).where(eq(correspondencia.id, id))
  await db.delete(correspondencia).where(eq(correspondencia.id, id))
  await registrarAuditLog({
    accion: `Eliminó correspondencia ${actual?.hojaRuta ?? id}`,
    modulo: MODULO,
    resultado: "Exitoso",
  })
  revalidar()
}

/* ────────────────────────────────────────────────────────────────────────
 *  DERIVACIONES Y CAMBIOS DE ESTADO
 * ─────────────────────────────────────────────────────────────────────── */
export type DerivarInput = {
  correspondenciaId: string
  toUserId?: string
  toArea?: string
  toSucursalId?: string
  instrucciones?: string
  comentario?: string
  prioridad?: string
  plazoAtencion?: Date
}

export async function derivarCorrespondencia(input: DerivarInput) {
  if (!input.toUserId && !input.toArea && !input.toSucursalId) {
    throw new Error("Debe indicar un destinatario (usuario, área o sucursal)")
  }

  const usuarioId = await obtenerUsuarioId()
  const [actual] = await db
    .select()
    .from(correspondencia)
    .where(eq(correspondencia.id, input.correspondenciaId))

  if (!actual) throw new Error("Correspondencia no encontrada")

  await db.insert(correspondenciaMovimientos).values({
    correspondenciaId: actual.id,
    fromUserId: usuarioId,
    fromArea: actual.destinoArea ?? null,
    fromSucursalId: actual.destinoSucursalId ?? null,
    toUserId: input.toUserId ?? null,
    toArea: input.toArea?.trim() ?? null,
    toSucursalId: input.toSucursalId ?? null,
    estadoAnterior: actual.estado,
    estadoNuevo: "derivado",
    accion: "derivacion",
    instrucciones: input.instrucciones?.trim() ?? null,
    comentario: input.comentario?.trim() ?? null,
    prioridad: input.prioridad ?? null,
    plazoAtencion: input.plazoAtencion ?? null,
    creadoPor: usuarioId,
  })

  await db
    .update(correspondencia)
    .set({
      estado: "derivado",
      destinatarioUserId: input.toUserId ?? actual.destinatarioUserId,
      destinoArea: input.toArea ?? actual.destinoArea,
      destinoSucursalId: input.toSucursalId ?? actual.destinoSucursalId,
      prioridad: input.prioridad ?? actual.prioridad,
      plazoAtencion: input.plazoAtencion ?? actual.plazoAtencion,
      actualizadoPor: usuarioId,
    })
    .where(eq(correspondencia.id, actual.id))

  await registrarAuditLog({
    accion: `Derivó correspondencia ${actual.hojaRuta}`,
    modulo: MODULO,
  })
  revalidar()
}

export async function cambiarEstadoCorrespondencia(input: {
  correspondenciaId: string
  nuevoEstado: EstadoCorrespondencia
  comentario?: string
  adjunto?: { url: string; nombre: string; tipo: string; tamano: number }
}) {
  const { correspondenciaId, nuevoEstado, comentario, adjunto } = input

  if (nuevoEstado === "finalizado" && !comentario?.trim()) {
    throw new Error("Para finalizar la correspondencia debe dejar un comentario")
  }

  const usuarioId = await obtenerUsuarioId()
  const [actual] = await db
    .select()
    .from(correspondencia)
    .where(eq(correspondencia.id, correspondenciaId))

  if (!actual) throw new Error("Correspondencia no encontrada")

  const [movimiento] = await db
    .insert(correspondenciaMovimientos)
    .values({
      correspondenciaId,
      fromUserId: usuarioId,
      estadoAnterior: actual.estado,
      estadoNuevo: nuevoEstado,
      accion: "cambio_estado",
      comentario: comentario?.trim() ?? null,
      creadoPor: usuarioId,
    })
    .returning()

  if (adjunto) {
    await db.insert(correspondenciaAdjuntos).values({
      correspondenciaId,
      movimientoId: movimiento.id,
      archivoNombre: adjunto.nombre,
      archivoUrl: adjunto.url,
      archivoTipo: adjunto.tipo,
      archivoTamano: adjunto.tamano,
      subidoPor: usuarioId,
    })
  }

  const setData: Record<string, unknown> = {
    estado: nuevoEstado,
    actualizadoPor: usuarioId,
  }
  if (nuevoEstado === "archivado") setData.archivadoEn = new Date()

  await db.update(correspondencia).set(setData).where(eq(correspondencia.id, correspondenciaId))

  await registrarAuditLog({
    accion: `Cambió estado de ${actual.hojaRuta} a ${nuevoEstado}`,
    modulo: MODULO,
  })
  revalidar()
}

export async function archivarCorrespondencia(id: string, comentario?: string) {
  return cambiarEstadoCorrespondencia({
    correspondenciaId: id,
    nuevoEstado: "archivado",
    comentario: comentario || "Archivado",
  })
}

/* ────────────────────────────────────────────────────────────────────────
 *  ADJUNTOS
 * ─────────────────────────────────────────────────────────────────────── */
export async function agregarAdjunto(input: {
  correspondenciaId: string
  url: string
  nombre: string
  tipo: string
  tamano: number
}) {
  const usuarioId = await obtenerUsuarioId()
  const [row] = await db
    .insert(correspondenciaAdjuntos)
    .values({
      correspondenciaId: input.correspondenciaId,
      archivoNombre: input.nombre,
      archivoUrl: input.url,
      archivoTipo: input.tipo,
      archivoTamano: input.tamano,
      subidoPor: usuarioId,
    })
    .returning()
  await registrarAuditLog({
    accion: `Adjuntó archivo a correspondencia ID: ${input.correspondenciaId}`,
    modulo: MODULO,
  })
  revalidar()
  return row
}

/* ────────────────────────────────────────────────────────────────────────
 *  CONSULTAS
 * ─────────────────────────────────────────────────────────────────────── */
export async function obtenerCorrespondencia(filtro?: {
  tipo?: string
  estado?: string
  prioridad?: string
  origen?: string
  archivadas?: boolean
  destinatarioUserId?: string
  desde?: Date
  hasta?: Date
}) {
  const conds = []
  if (filtro?.tipo) conds.push(eq(correspondencia.tipo, filtro.tipo))
  if (filtro?.estado) conds.push(eq(correspondencia.estado, filtro.estado))
  if (filtro?.prioridad) conds.push(eq(correspondencia.prioridad, filtro.prioridad))
  if (filtro?.origen) conds.push(eq(correspondencia.origen, filtro.origen))
  if (filtro?.destinatarioUserId)
    conds.push(eq(correspondencia.destinatarioUserId, filtro.destinatarioUserId))
  if (filtro?.archivadas === true) conds.push(isNotNull(correspondencia.archivadoEn))
  if (filtro?.archivadas === false) conds.push(isNull(correspondencia.archivadoEn))
  if (filtro?.desde) conds.push(gte(correspondencia.createdAt, filtro.desde))
  if (filtro?.hasta) conds.push(lte(correspondencia.createdAt, filtro.hasta))

  return db
    .select()
    .from(correspondencia)
    .where(conds.length > 0 ? and(...conds) : undefined)
    .orderBy(desc(correspondencia.createdAt))
}

export async function obtenerCorrespondenciaPorId(id: string) {
  const [row] = await db.select().from(correspondencia).where(eq(correspondencia.id, id))
  if (!row) return null
  const [movimientos, adjuntos] = await Promise.all([
    db
      .select()
      .from(correspondenciaMovimientos)
      .where(eq(correspondenciaMovimientos.correspondenciaId, id))
      .orderBy(desc(correspondenciaMovimientos.createdAt)),
    db
      .select()
      .from(correspondenciaAdjuntos)
      .where(eq(correspondenciaAdjuntos.correspondenciaId, id))
      .orderBy(desc(correspondenciaAdjuntos.createdAt)),
  ])
  return { ...row, movimientos, adjuntos }
}

export async function obtenerMovimientos(correspondenciaId: string) {
  return db
    .select()
    .from(correspondenciaMovimientos)
    .where(eq(correspondenciaMovimientos.correspondenciaId, correspondenciaId))
    .orderBy(desc(correspondenciaMovimientos.createdAt))
}

/* ────────────────────────────────────────────────────────────────────────
 *  STATS Y REPORTES
 * ─────────────────────────────────────────────────────────────────────── */
export async function obtenerStatsCorrespondencia() {
  const todas = await db.select().from(correspondencia)
  const ahora = new Date()

  const recibidos = todas.filter((c) => c.tipo === "entrada").length
  const enviados = todas.filter((c) => c.tipo === "salida").length
  const pendientes = todas.filter(
    (c) => !ESTADOS_FINALES.includes(c.estado as EstadoCorrespondencia),
  ).length
  const enProceso = todas.filter((c) => ["derivado", "en_revision", "observado"].includes(c.estado)).length
  const finalizados = todas.filter((c) => c.estado === "finalizado").length
  const archivadas = todas.filter((c) => c.estado === "archivado" || c.archivadoEn).length
  const urgentes = todas.filter((c) => c.prioridad === "urgente").length
  const vencidos = todas.filter(
    (c) =>
      c.plazoAtencion &&
      c.plazoAtencion.getTime() < ahora.getTime() &&
      !ESTADOS_FINALES.includes(c.estado as EstadoCorrespondencia),
  ).length
  const sinLeer = todas.filter((c) => c.tipo === "entrada" && !c.leido).length

  // Por área
  const porArea = new Map<string, number>()
  for (const c of todas) {
    const area = c.destinoArea || "Sin asignar"
    porArea.set(area, (porArea.get(area) ?? 0) + 1)
  }

  // Por sucursal
  const sucursalesData = await db.select().from(sucursales)
  const porSucursal = sucursalesData.map((s) => ({
    id: s.id,
    nombre: s.nombre,
    departamento: s.departamento,
    total: todas.filter((c) => c.destinoSucursalId === s.id).length,
  }))

  return {
    total: todas.length,
    recibidos,
    enviados,
    pendientes,
    enProceso,
    finalizados,
    archivadas,
    urgentes,
    vencidos,
    sinLeer,
    porArea: Array.from(porArea.entries())
      .map(([area, total]) => ({ area, total }))
      .sort((a, b) => b.total - a.total),
    porSucursal: porSucursal.sort((a, b) => b.total - a.total),
  }
}

export async function generarReporte(filtros: {
  desde?: Date
  hasta?: Date
  area?: string
  sucursalId?: string
  responsableId?: string
  estado?: string
  prioridad?: string
  vencidos?: boolean
}) {
  const conds = []
  if (filtros.desde) conds.push(gte(correspondencia.createdAt, filtros.desde))
  if (filtros.hasta) conds.push(lte(correspondencia.createdAt, filtros.hasta))
  if (filtros.area) conds.push(eq(correspondencia.destinoArea, filtros.area))
  if (filtros.sucursalId) conds.push(eq(correspondencia.destinoSucursalId, filtros.sucursalId))
  if (filtros.responsableId)
    conds.push(eq(correspondencia.destinatarioUserId, filtros.responsableId))
  if (filtros.estado) conds.push(eq(correspondencia.estado, filtros.estado))
  if (filtros.prioridad) conds.push(eq(correspondencia.prioridad, filtros.prioridad))

  const datos = await db
    .select()
    .from(correspondencia)
    .where(conds.length > 0 ? and(...conds) : undefined)
    .orderBy(desc(correspondencia.createdAt))

  const ahora = new Date()
  let resultado = datos
  if (filtros.vencidos) {
    resultado = datos.filter(
      (c) =>
        c.plazoAtencion &&
        c.plazoAtencion.getTime() < ahora.getTime() &&
        !ESTADOS_FINALES.includes(c.estado as EstadoCorrespondencia),
    )
  }

  // Productividad por área
  const productividadArea = new Map<string, { total: number; finalizados: number }>()
  for (const c of resultado) {
    const area = c.destinoArea || "Sin asignar"
    const cur = productividadArea.get(area) ?? { total: 0, finalizados: 0 }
    cur.total++
    if (c.estado === "finalizado" || c.estado === "archivado") cur.finalizados++
    productividadArea.set(area, cur)
  }

  return {
    items: resultado,
    productividadArea: Array.from(productividadArea.entries()).map(([area, v]) => ({
      area,
      total: v.total,
      finalizados: v.finalizados,
      productividad: v.total === 0 ? 0 : Math.round((v.finalizados / v.total) * 100),
    })),
  }
}

/* ────────────────────────────────────────────────────────────────────────
 *  USUARIOS / SUCURSALES PARA SELECTORES
 * ─────────────────────────────────────────────────────────────────────── */
export async function obtenerUsuariosBasicos() {
  return db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastNamePaternal: users.lastNamePaternal,
      lastNameMaternal: users.lastNameMaternal,
      institutionalEmail: users.institutionalEmail,
      image: users.image,
    })
    .from(users)
    .where(eq(users.isActive, true))
    .orderBy(asc(users.firstName))
}

export async function obtenerSucursalesBasicas() {
  return db
    .select({
      id: sucursales.id,
      nombre: sucursales.nombre,
      departamento: sucursales.departamento,
    })
    .from(sucursales)
    .where(eq(sucursales.activo, true))
    .orderBy(asc(sucursales.departamento))
}

/* ────────────────────────────────────────────────────────────────────────
 *  BANDEJA: vistas filtradas
 * ─────────────────────────────────────────────────────────────────────── */
export async function obtenerBandeja(usuarioId: string | null) {
  const todas = await obtenerCorrespondencia()
  const ahora = new Date()
  return {
    recibidos: todas.filter((c) => c.tipo === "entrada"),
    enviados: todas.filter((c) => c.tipo === "salida"),
    asignadosAMi: usuarioId ? todas.filter((c) => c.destinatarioUserId === usuarioId) : [],
    pendientes: todas.filter(
      (c) => !ESTADOS_FINALES.includes(c.estado as EstadoCorrespondencia),
    ),
    derivados: todas.filter((c) => c.estado === "derivado"),
    urgentes: todas.filter((c) => c.prioridad === "urgente"),
    vencidos: todas.filter(
      (c) =>
        c.plazoAtencion &&
        c.plazoAtencion.getTime() < ahora.getTime() &&
        !ESTADOS_FINALES.includes(c.estado as EstadoCorrespondencia),
    ),
    archivadas: todas.filter((c) => c.estado === "archivado" || c.archivadoEn),
    finalizados: todas.filter((c) => c.estado === "finalizado"),
    todas,
  }
}
