"use server"

import { db } from "@/db"
import {
  reconocimientos,
  reconocimientoEmpleadoMes,
  reconocimientoEquipo,
  reconocimientoEquipoIntegrantes,
  reconocimientoLogroSucursal,
  sucursales,
  users,
} from "@/db/schema"
import { and, asc, desc, eq, inArray, ne, or, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import { registrarAuditLog } from "@/actions/auditoria"
import { obtenerUsuarioRbacActual } from "@/lib/auth/session-access"
import { puedeAccederUsuario, type UsuarioRbac } from "@/lib/rbac"
import { PERMISOS } from "@/lib/auth/permisos"
import {
  empleadoMesSchema,
  equipoDestacadoSchema,
  logroSucursalSchema,
  parseOLanzar,
  puedeTransicionar,
  TRANSICIONES_VALIDAS,
  type EstadoReconocimiento,
  type TipoReconocimiento,
  type EmpleadoMesInput,
  type EquipoDestacadoInput,
  type LogroSucursalInput,
} from "@/lib/validations/reconocimientos"

const MODULO = "Reconocimientos"

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de permiso / sesión
// ─────────────────────────────────────────────────────────────────────────────
async function requerirUsuarioConPermiso(permiso: string): Promise<UsuarioRbac> {
  const usuario = await obtenerUsuarioRbacActual()
  if (!usuario) {
    throw new Error("Sesión expirada. Vuelve a iniciar sesión.")
  }
  const autorizado = puedeAccederUsuario(usuario, { permissions: [permiso] })
  if (!autorizado) {
    await registrarAuditLog({
      usuario: usuario.id,
      accion: `Intento sin permiso: ${permiso}`,
      modulo: MODULO,
      resultado: "Fallido",
    })
    throw new Error("No tienes permiso para esta acción.")
  }
  return usuario
}

function limpiarOpcional<T extends string | null | undefined>(valor: T): string | null {
  if (valor === undefined || valor === null) return null
  const clean = String(valor).trim()
  return clean.length > 0 ? clean : null
}

// ─────────────────────────────────────────────────────────────────────────────
// Tipos de dominio
// ─────────────────────────────────────────────────────────────────────────────
export type ReconocimientoBase = typeof reconocimientos.$inferSelect
export type ReconocimientoEmpleadoMes = typeof reconocimientoEmpleadoMes.$inferSelect
export type ReconocimientoEquipo = typeof reconocimientoEquipo.$inferSelect
export type ReconocimientoIntegrante = typeof reconocimientoEquipoIntegrantes.$inferSelect
export type ReconocimientoLogroSucursal = typeof reconocimientoLogroSucursal.$inferSelect

export type ReconocimientoListItem = ReconocimientoBase & {
  subtituloA: string | null // nombre del reconocido / equipo / sucursal
  subtituloB: string | null // cargo / area / ciudad-dpto
}

// ─────────────────────────────────────────────────────────────────────────────
// CREAR
// ─────────────────────────────────────────────────────────────────────────────
export async function crearEmpleadoMes(input: EmpleadoMesInput) {
  const usuario = await requerirUsuarioConPermiso(PERMISOS.RECONOCIMIENTOS.CREAR)
  const parsed = parseOLanzar(empleadoMesSchema, input)

  const titulo = parsed.titulo.trim()

  const nuevoId = await db.transaction(async (tx) => {
    const [creado] = await tx
      .insert(reconocimientos)
      .values({
        tipo: "empleado_mes",
        titulo,
        descripcionCorta: parsed.descripcionCorta.trim(),
        descripcionCompleta: parsed.descripcionCompleta.trim(),
        motivo: parsed.motivo.trim(),
        imagen: limpiarOpcional(parsed.imagen),
        fechaReconocimiento: parsed.fechaReconocimiento,
        periodoDesde: limpiarOpcional(parsed.periodoDesde),
        periodoHasta: limpiarOpcional(parsed.periodoHasta),
        destacado: parsed.destacado,
        mostrarEnLanding: parsed.mostrarEnLanding,
        creadoPor: usuario.id,
        estado: "borrador",
      })
      .returning({ id: reconocimientos.id })

    await tx.insert(reconocimientoEmpleadoMes).values({
      reconocimientoId: creado.id,
      empleadoId: limpiarOpcional(parsed.empleadoId),
      nombreCompleto: parsed.nombreCompleto.trim(),
      cargo: parsed.cargo.trim(),
      area: parsed.area.trim(),
      sucursalId: limpiarOpcional(parsed.sucursalId),
      mes: parsed.mes,
      gestion: parsed.gestion,
      logrosDestacados: limpiarOpcional(parsed.logrosDestacados),
    })

    return creado.id
  })

  await registrarAuditLog({
    usuario: usuario.id,
    accion: `Creó reconocimiento Empleado del Mes: ${titulo}`,
    modulo: MODULO,
  })
  revalidatePath("/reconocimientos")
  revalidatePath("/")
  return { id: nuevoId }
}

export async function crearEquipoDestacado(input: EquipoDestacadoInput) {
  const usuario = await requerirUsuarioConPermiso(PERMISOS.RECONOCIMIENTOS.CREAR)
  const parsed = parseOLanzar(equipoDestacadoSchema, input)
  const titulo = parsed.titulo.trim()

  const nuevoId = await db.transaction(async (tx) => {
    const [creado] = await tx
      .insert(reconocimientos)
      .values({
        tipo: "equipo_destacado",
        titulo,
        descripcionCorta: parsed.descripcionCorta.trim(),
        descripcionCompleta: parsed.descripcionCompleta.trim(),
        motivo: parsed.motivo.trim(),
        imagen: limpiarOpcional(parsed.imagen),
        fechaReconocimiento: parsed.fechaReconocimiento,
        periodoDesde: limpiarOpcional(parsed.periodoDesde),
        periodoHasta: limpiarOpcional(parsed.periodoHasta),
        destacado: parsed.destacado,
        mostrarEnLanding: parsed.mostrarEnLanding,
        creadoPor: usuario.id,
        estado: "borrador",
      })
      .returning({ id: reconocimientos.id })

    await tx.insert(reconocimientoEquipo).values({
      reconocimientoId: creado.id,
      nombreEquipo: parsed.nombreEquipo.trim(),
      area: parsed.area.trim(),
      responsableId: limpiarOpcional(parsed.responsableId),
      responsableNombre: parsed.responsableNombre.trim(),
      resultadosAlcanzados: parsed.resultadosAlcanzados.trim(),
    })

    if (parsed.integrantes && parsed.integrantes.length > 0) {
      await tx.insert(reconocimientoEquipoIntegrantes).values(
        parsed.integrantes.map((i) => ({
          reconocimientoId: creado.id,
          usuarioId: limpiarOpcional(i.usuarioId),
          nombre: i.nombre.trim(),
          rolEquipo: limpiarOpcional(i.rolEquipo),
        })),
      )
    }

    return creado.id
  })

  await registrarAuditLog({
    usuario: usuario.id,
    accion: `Creó reconocimiento Equipo Destacado: ${titulo}`,
    modulo: MODULO,
  })
  revalidatePath("/reconocimientos")
  revalidatePath("/")
  return { id: nuevoId }
}

export async function crearLogroSucursal(input: LogroSucursalInput) {
  const usuario = await requerirUsuarioConPermiso(PERMISOS.RECONOCIMIENTOS.CREAR)
  const parsed = parseOLanzar(logroSucursalSchema, input)
  const titulo = parsed.titulo.trim()

  const nuevoId = await db.transaction(async (tx) => {
    const [creado] = await tx
      .insert(reconocimientos)
      .values({
        tipo: "logro_sucursal",
        titulo,
        descripcionCorta: parsed.descripcionCorta.trim(),
        descripcionCompleta: parsed.descripcionCompleta.trim(),
        motivo: parsed.motivo.trim(),
        imagen: limpiarOpcional(parsed.imagen),
        fechaReconocimiento: parsed.fechaReconocimiento,
        periodoDesde: limpiarOpcional(parsed.periodoDesde),
        periodoHasta: limpiarOpcional(parsed.periodoHasta),
        destacado: parsed.destacado,
        mostrarEnLanding: parsed.mostrarEnLanding,
        creadoPor: usuario.id,
        estado: "borrador",
      })
      .returning({ id: reconocimientos.id })

    await tx.insert(reconocimientoLogroSucursal).values({
      reconocimientoId: creado.id,
      sucursalId: parsed.sucursalId,
      ciudad: parsed.ciudad.trim(),
      departamento: parsed.departamento.trim(),
      responsableNombre: parsed.responsableNombre.trim(),
      tipoLogro: parsed.tipoLogro.trim(),
      indicadores: parsed.indicadores ?? [],
    })

    return creado.id
  })

  await registrarAuditLog({
    usuario: usuario.id,
    accion: `Creó reconocimiento Logro de Sucursal: ${titulo}`,
    modulo: MODULO,
  })
  revalidatePath("/reconocimientos")
  revalidatePath("/")
  return { id: nuevoId }
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTUALIZAR (por tipo)
// ─────────────────────────────────────────────────────────────────────────────
export async function actualizarEmpleadoMes(id: string, input: EmpleadoMesInput) {
  const usuario = await requerirUsuarioConPermiso(PERMISOS.RECONOCIMIENTOS.EDITAR)
  const parsed = parseOLanzar(empleadoMesSchema, input)

  await db.transaction(async (tx) => {
    await tx
      .update(reconocimientos)
      .set({
        titulo: parsed.titulo.trim(),
        descripcionCorta: parsed.descripcionCorta.trim(),
        descripcionCompleta: parsed.descripcionCompleta.trim(),
        motivo: parsed.motivo.trim(),
        imagen: limpiarOpcional(parsed.imagen),
        fechaReconocimiento: parsed.fechaReconocimiento,
        periodoDesde: limpiarOpcional(parsed.periodoDesde),
        periodoHasta: limpiarOpcional(parsed.periodoHasta),
        destacado: parsed.destacado,
        mostrarEnLanding: parsed.mostrarEnLanding,
      })
      .where(and(eq(reconocimientos.id, id), eq(reconocimientos.tipo, "empleado_mes")))

    await tx
      .update(reconocimientoEmpleadoMes)
      .set({
        empleadoId: limpiarOpcional(parsed.empleadoId),
        nombreCompleto: parsed.nombreCompleto.trim(),
        cargo: parsed.cargo.trim(),
        area: parsed.area.trim(),
        sucursalId: limpiarOpcional(parsed.sucursalId),
        mes: parsed.mes,
        gestion: parsed.gestion,
        logrosDestacados: limpiarOpcional(parsed.logrosDestacados),
      })
      .where(eq(reconocimientoEmpleadoMes.reconocimientoId, id))
  })

  await registrarAuditLog({
    usuario: usuario.id,
    accion: `Actualizó reconocimiento Empleado del Mes (${id})`,
    modulo: MODULO,
  })
  revalidatePath("/reconocimientos")
  revalidatePath(`/reconocimientos/${id}`)
  revalidatePath("/")
}

export async function actualizarEquipoDestacado(id: string, input: EquipoDestacadoInput) {
  const usuario = await requerirUsuarioConPermiso(PERMISOS.RECONOCIMIENTOS.EDITAR)
  const parsed = parseOLanzar(equipoDestacadoSchema, input)

  await db.transaction(async (tx) => {
    await tx
      .update(reconocimientos)
      .set({
        titulo: parsed.titulo.trim(),
        descripcionCorta: parsed.descripcionCorta.trim(),
        descripcionCompleta: parsed.descripcionCompleta.trim(),
        motivo: parsed.motivo.trim(),
        imagen: limpiarOpcional(parsed.imagen),
        fechaReconocimiento: parsed.fechaReconocimiento,
        periodoDesde: limpiarOpcional(parsed.periodoDesde),
        periodoHasta: limpiarOpcional(parsed.periodoHasta),
        destacado: parsed.destacado,
        mostrarEnLanding: parsed.mostrarEnLanding,
      })
      .where(and(eq(reconocimientos.id, id), eq(reconocimientos.tipo, "equipo_destacado")))

    await tx
      .update(reconocimientoEquipo)
      .set({
        nombreEquipo: parsed.nombreEquipo.trim(),
        area: parsed.area.trim(),
        responsableId: limpiarOpcional(parsed.responsableId),
        responsableNombre: parsed.responsableNombre.trim(),
        resultadosAlcanzados: parsed.resultadosAlcanzados.trim(),
      })
      .where(eq(reconocimientoEquipo.reconocimientoId, id))

    // Reset de integrantes (simple y predecible)
    await tx
      .delete(reconocimientoEquipoIntegrantes)
      .where(eq(reconocimientoEquipoIntegrantes.reconocimientoId, id))

    if (parsed.integrantes && parsed.integrantes.length > 0) {
      await tx.insert(reconocimientoEquipoIntegrantes).values(
        parsed.integrantes.map((i) => ({
          reconocimientoId: id,
          usuarioId: limpiarOpcional(i.usuarioId),
          nombre: i.nombre.trim(),
          rolEquipo: limpiarOpcional(i.rolEquipo),
        })),
      )
    }
  })

  await registrarAuditLog({
    usuario: usuario.id,
    accion: `Actualizó reconocimiento Equipo Destacado (${id})`,
    modulo: MODULO,
  })
  revalidatePath("/reconocimientos")
  revalidatePath(`/reconocimientos/${id}`)
  revalidatePath("/")
}

export async function actualizarLogroSucursal(id: string, input: LogroSucursalInput) {
  const usuario = await requerirUsuarioConPermiso(PERMISOS.RECONOCIMIENTOS.EDITAR)
  const parsed = parseOLanzar(logroSucursalSchema, input)

  await db.transaction(async (tx) => {
    await tx
      .update(reconocimientos)
      .set({
        titulo: parsed.titulo.trim(),
        descripcionCorta: parsed.descripcionCorta.trim(),
        descripcionCompleta: parsed.descripcionCompleta.trim(),
        motivo: parsed.motivo.trim(),
        imagen: limpiarOpcional(parsed.imagen),
        fechaReconocimiento: parsed.fechaReconocimiento,
        periodoDesde: limpiarOpcional(parsed.periodoDesde),
        periodoHasta: limpiarOpcional(parsed.periodoHasta),
        destacado: parsed.destacado,
        mostrarEnLanding: parsed.mostrarEnLanding,
      })
      .where(and(eq(reconocimientos.id, id), eq(reconocimientos.tipo, "logro_sucursal")))

    await tx
      .update(reconocimientoLogroSucursal)
      .set({
        sucursalId: parsed.sucursalId,
        ciudad: parsed.ciudad.trim(),
        departamento: parsed.departamento.trim(),
        responsableNombre: parsed.responsableNombre.trim(),
        tipoLogro: parsed.tipoLogro.trim(),
        indicadores: parsed.indicadores ?? [],
      })
      .where(eq(reconocimientoLogroSucursal.reconocimientoId, id))
  })

  await registrarAuditLog({
    usuario: usuario.id,
    accion: `Actualizó reconocimiento Logro Sucursal (${id})`,
    modulo: MODULO,
  })
  revalidatePath("/reconocimientos")
  revalidatePath(`/reconocimientos/${id}`)
  revalidatePath("/")
}

// ─────────────────────────────────────────────────────────────────────────────
// TRANSICIONES DE ESTADO
// ─────────────────────────────────────────────────────────────────────────────
async function obtenerReconocimientoBase(id: string) {
  const [row] = await db
    .select()
    .from(reconocimientos)
    .where(eq(reconocimientos.id, id))
    .limit(1)
  return row ?? null
}

function permisoParaTransicion(destino: EstadoReconocimiento): string {
  switch (destino) {
    case "publicado":
      return PERMISOS.RECONOCIMIENTOS.PUBLICAR
    case "rechazado":
      return PERMISOS.RECONOCIMIENTOS.APROBAR
    case "archivado":
      return PERMISOS.RECONOCIMIENTOS.ARCHIVAR
    case "pendiente":
    case "borrador":
    default:
      return PERMISOS.RECONOCIMIENTOS.EDITAR
  }
}

export async function cambiarEstadoReconocimiento(
  id: string,
  nuevoEstado: EstadoReconocimiento,
  extras?: { motivoRechazo?: string },
) {
  const permiso = permisoParaTransicion(nuevoEstado)
  const usuario = await requerirUsuarioConPermiso(permiso)

  const actual = await obtenerReconocimientoBase(id)
  if (!actual) throw new Error("Reconocimiento no encontrado")

  if (actual.estado === nuevoEstado) return { ok: true, sinCambios: true as const }

  if (!puedeTransicionar(actual.estado as EstadoReconocimiento, nuevoEstado)) {
    throw new Error(
      `Transición inválida: ${actual.estado} → ${nuevoEstado}. Permitidos: ${TRANSICIONES_VALIDAS[actual.estado as EstadoReconocimiento]?.join(", ") ?? "(ninguno)"}`,
    )
  }

  // Regla: no se publica sin imagen
  if (nuevoEstado === "publicado" && (!actual.imagen || actual.imagen.trim().length === 0)) {
    throw new Error("No se puede publicar sin una imagen asociada.")
  }

  const ahora = new Date()
  const set: Partial<typeof reconocimientos.$inferInsert> = { estado: nuevoEstado }

  if (nuevoEstado === "publicado") {
    set.publicadoEn = ahora
    set.aprobadoPor = usuario.id
    set.motivoRechazo = null
  }
  if (nuevoEstado === "archivado") {
    set.archivadoEn = ahora
    set.mostrarEnLanding = false
  }
  if (nuevoEstado === "rechazado") {
    set.motivoRechazo = limpiarOpcional(extras?.motivoRechazo) ?? "Sin motivo especificado"
    set.aprobadoPor = usuario.id
  }

  // Regla extra para Empleado del Mes: al publicar, archivar el anterior del mismo (mes, gestión)
  if (nuevoEstado === "publicado" && actual.tipo === "empleado_mes") {
    const [datosEmp] = await db
      .select({ mes: reconocimientoEmpleadoMes.mes, gestion: reconocimientoEmpleadoMes.gestion })
      .from(reconocimientoEmpleadoMes)
      .where(eq(reconocimientoEmpleadoMes.reconocimientoId, id))
      .limit(1)

    if (datosEmp) {
      const anteriores = await db
        .select({ id: reconocimientos.id })
        .from(reconocimientos)
        .innerJoin(
          reconocimientoEmpleadoMes,
          eq(reconocimientoEmpleadoMes.reconocimientoId, reconocimientos.id),
        )
        .where(
          and(
            eq(reconocimientos.tipo, "empleado_mes"),
            eq(reconocimientos.estado, "publicado"),
            eq(reconocimientoEmpleadoMes.mes, datosEmp.mes),
            eq(reconocimientoEmpleadoMes.gestion, datosEmp.gestion),
            ne(reconocimientos.id, id),
          ),
        )

      const idsPrevios = anteriores.map((r) => r.id)
      if (idsPrevios.length > 0) {
        await db
          .update(reconocimientos)
          .set({
            estado: "archivado",
            archivadoEn: ahora,
            mostrarEnLanding: false,
          })
          .where(inArray(reconocimientos.id, idsPrevios))
      }
    }
  }

  await db.update(reconocimientos).set(set).where(eq(reconocimientos.id, id))

  await registrarAuditLog({
    usuario: usuario.id,
    accion: `Cambió estado ${actual.estado} → ${nuevoEstado} (reco ${id})`,
    modulo: MODULO,
    detalles: { id, anterior: actual.estado, nuevo: nuevoEstado },
  })
  revalidatePath("/reconocimientos")
  revalidatePath(`/reconocimientos/${id}`)
  revalidatePath("/")
  return { ok: true, sinCambios: false as const }
}

export async function enviarARevisionReconocimiento(id: string) {
  return cambiarEstadoReconocimiento(id, "pendiente")
}

export async function publicarReconocimiento(id: string) {
  return cambiarEstadoReconocimiento(id, "publicado")
}

export async function despublicarReconocimiento(id: string) {
  return cambiarEstadoReconocimiento(id, "pendiente")
}

export async function rechazarReconocimiento(id: string, motivo: string) {
  return cambiarEstadoReconocimiento(id, "rechazado", { motivoRechazo: motivo })
}

export async function archivarReconocimiento(id: string) {
  return cambiarEstadoReconocimiento(id, "archivado")
}

export async function restaurarReconocimiento(id: string) {
  return cambiarEstadoReconocimiento(id, "borrador")
}

// ─────────────────────────────────────────────────────────────────────────────
// Toggles rápidos
// ─────────────────────────────────────────────────────────────────────────────
export async function toggleDestacadoReconocimiento(id: string) {
  const usuario = await requerirUsuarioConPermiso(PERMISOS.RECONOCIMIENTOS.DESTACAR)
  const actual = await obtenerReconocimientoBase(id)
  if (!actual) throw new Error("Reconocimiento no encontrado")

  const nuevo = !actual.destacado
  await db.update(reconocimientos).set({ destacado: nuevo }).where(eq(reconocimientos.id, id))
  await registrarAuditLog({
    usuario: usuario.id,
    accion: `${nuevo ? "Destacó" : "Quitó destacado de"} reconocimiento (${id})`,
    modulo: MODULO,
  })
  revalidatePath("/reconocimientos")
  revalidatePath("/")
  return { destacado: nuevo }
}

export async function toggleMostrarEnLanding(id: string) {
  const usuario = await requerirUsuarioConPermiso(PERMISOS.RECONOCIMIENTOS.LANDING)
  const actual = await obtenerReconocimientoBase(id)
  if (!actual) throw new Error("Reconocimiento no encontrado")

  const nuevo = !actual.mostrarEnLanding
  if (nuevo && actual.estado !== "publicado") {
    throw new Error("Solo se puede mostrar en landing un reconocimiento publicado.")
  }

  await db
    .update(reconocimientos)
    .set({ mostrarEnLanding: nuevo })
    .where(eq(reconocimientos.id, id))
  await registrarAuditLog({
    usuario: usuario.id,
    accion: `${nuevo ? "Mostró" : "Ocultó"} en landing reconocimiento (${id})`,
    modulo: MODULO,
  })
  revalidatePath("/reconocimientos")
  revalidatePath("/")
  return { mostrarEnLanding: nuevo }
}

// ─────────────────────────────────────────────────────────────────────────────
// ELIMINAR (solo borradores)
// ─────────────────────────────────────────────────────────────────────────────
export async function eliminarReconocimiento(id: string) {
  const usuario = await requerirUsuarioConPermiso(PERMISOS.RECONOCIMIENTOS.ELIMINAR)
  const actual = await obtenerReconocimientoBase(id)
  if (!actual) throw new Error("Reconocimiento no encontrado")
  if (actual.estado !== "borrador" && actual.estado !== "rechazado") {
    throw new Error("Solo se pueden eliminar borradores o rechazados. Usa archivar.")
  }
  await db.delete(reconocimientos).where(eq(reconocimientos.id, id))
  await registrarAuditLog({
    usuario: usuario.id,
    accion: `Eliminó reconocimiento (${id}, estado ${actual.estado})`,
    modulo: MODULO,
  })
  revalidatePath("/reconocimientos")
  revalidatePath("/")
}

// ─────────────────────────────────────────────────────────────────────────────
// LECTURA — listado general
// ─────────────────────────────────────────────────────────────────────────────
export type FiltroListado = {
  tipo?: TipoReconocimiento
  estado?: EstadoReconocimiento
  q?: string
  soloDestacados?: boolean
  soloLanding?: boolean
}

export async function listarReconocimientos(filtro: FiltroListado = {}): Promise<ReconocimientoListItem[]> {
  const conds = []
  if (filtro.tipo) conds.push(eq(reconocimientos.tipo, filtro.tipo))
  if (filtro.estado) conds.push(eq(reconocimientos.estado, filtro.estado))
  if (filtro.soloDestacados) conds.push(eq(reconocimientos.destacado, true))
  if (filtro.soloLanding) conds.push(eq(reconocimientos.mostrarEnLanding, true))
  if (filtro.q && filtro.q.trim().length > 0) {
    const like = `%${filtro.q.trim().toLowerCase()}%`
    conds.push(
      or(
        sql`lower(${reconocimientos.titulo}) like ${like}`,
        sql`lower(${reconocimientos.descripcionCorta}) like ${like}`,
      )!,
    )
  }

  const whereClause = conds.length > 0 ? and(...conds) : undefined

  const base = await db
    .select()
    .from(reconocimientos)
    .where(whereClause)
    .orderBy(desc(reconocimientos.updatedAt))

  if (base.length === 0) return []

  const ids = base.map((r) => r.id)

  const [emp, eq_, log] = await Promise.all([
    db
      .select()
      .from(reconocimientoEmpleadoMes)
      .where(inArray(reconocimientoEmpleadoMes.reconocimientoId, ids)),
    db
      .select()
      .from(reconocimientoEquipo)
      .where(inArray(reconocimientoEquipo.reconocimientoId, ids)),
    db
      .select()
      .from(reconocimientoLogroSucursal)
      .where(inArray(reconocimientoLogroSucursal.reconocimientoId, ids)),
  ])

  const empMap = new Map(emp.map((r) => [r.reconocimientoId, r]))
  const equipoMap = new Map(eq_.map((r) => [r.reconocimientoId, r]))
  const logroMap = new Map(log.map((r) => [r.reconocimientoId, r]))

  return base.map((r) => {
    let subtituloA: string | null = null
    let subtituloB: string | null = null
    if (r.tipo === "empleado_mes") {
      const d = empMap.get(r.id)
      if (d) {
        subtituloA = d.nombreCompleto
        subtituloB = `${d.cargo} · ${d.area}`
      }
    } else if (r.tipo === "equipo_destacado") {
      const d = equipoMap.get(r.id)
      if (d) {
        subtituloA = d.nombreEquipo
        subtituloB = d.area
      }
    } else if (r.tipo === "logro_sucursal") {
      const d = logroMap.get(r.id)
      if (d) {
        subtituloA = d.ciudad
        subtituloB = `${d.departamento} · ${d.tipoLogro}`
      }
    }
    return { ...r, subtituloA, subtituloB }
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// LECTURA — detalle
// ─────────────────────────────────────────────────────────────────────────────
export type ReconocimientoDetalle =
  | {
      base: ReconocimientoBase
      tipo: "empleado_mes"
      empleado: ReconocimientoEmpleadoMes
      sucursalNombre: string | null
    }
  | {
      base: ReconocimientoBase
      tipo: "equipo_destacado"
      equipo: ReconocimientoEquipo
      integrantes: ReconocimientoIntegrante[]
    }
  | {
      base: ReconocimientoBase
      tipo: "logro_sucursal"
      logro: ReconocimientoLogroSucursal
      sucursalNombre: string | null
    }

export async function obtenerDetalleReconocimiento(id: string): Promise<ReconocimientoDetalle | null> {
  const [base] = await db
    .select()
    .from(reconocimientos)
    .where(eq(reconocimientos.id, id))
    .limit(1)
  if (!base) return null

  if (base.tipo === "empleado_mes") {
    let [empleado] = await db
      .select()
      .from(reconocimientoEmpleadoMes)
      .where(eq(reconocimientoEmpleadoMes.reconocimientoId, id))
      .limit(1)
    // Auto-recuperación: si falta la fila tipo-específica, la creamos con
    // valores por defecto a partir de la base para no devolver null.
    if (!empleado) {
      const ahora = new Date()
      await db
        .insert(reconocimientoEmpleadoMes)
        .values({
          reconocimientoId: id,
          nombreCompleto: base.titulo || "Sin asignar",
          cargo: "Sin definir",
          area: "Sin definir",
          mes: ahora.getMonth() + 1,
          gestion: ahora.getFullYear(),
        })
        .onConflictDoNothing()
      ;[empleado] = await db
        .select()
        .from(reconocimientoEmpleadoMes)
        .where(eq(reconocimientoEmpleadoMes.reconocimientoId, id))
        .limit(1)
      if (!empleado) return null
    }
    let sucursalNombre: string | null = null
    if (empleado.sucursalId) {
      const [s] = await db
        .select({ nombre: sucursales.nombre })
        .from(sucursales)
        .where(eq(sucursales.id, empleado.sucursalId))
        .limit(1)
      sucursalNombre = s?.nombre ?? null
    }
    return { base, tipo: "empleado_mes", empleado, sucursalNombre }
  }

  if (base.tipo === "equipo_destacado") {
    let [equipo] = await db
      .select()
      .from(reconocimientoEquipo)
      .where(eq(reconocimientoEquipo.reconocimientoId, id))
      .limit(1)
    if (!equipo) {
      await db
        .insert(reconocimientoEquipo)
        .values({
          reconocimientoId: id,
          nombreEquipo: base.titulo || "Equipo",
          area: "Sin definir",
          responsableNombre: "Sin definir",
          resultadosAlcanzados: base.descripcionCompleta || base.descripcionCorta || "—",
        })
        .onConflictDoNothing()
      ;[equipo] = await db
        .select()
        .from(reconocimientoEquipo)
        .where(eq(reconocimientoEquipo.reconocimientoId, id))
        .limit(1)
      if (!equipo) return null
    }
    const integrantes = await db
      .select()
      .from(reconocimientoEquipoIntegrantes)
      .where(eq(reconocimientoEquipoIntegrantes.reconocimientoId, id))
      .orderBy(asc(reconocimientoEquipoIntegrantes.createdAt))
    return { base, tipo: "equipo_destacado", equipo, integrantes }
  }

  let [logro] = await db
    .select()
    .from(reconocimientoLogroSucursal)
    .where(eq(reconocimientoLogroSucursal.reconocimientoId, id))
    .limit(1)
  if (!logro) {
    // Necesitamos una sucursal real (FK NOT NULL). Tomamos la primera activa.
    const [primeraSucursal] = await db
      .select()
      .from(sucursales)
      .where(eq(sucursales.activo, true))
      .limit(1)
    if (primeraSucursal) {
      await db
        .insert(reconocimientoLogroSucursal)
        .values({
          reconocimientoId: id,
          sucursalId: primeraSucursal.id,
          ciudad: primeraSucursal.capital || "Sin definir",
          departamento: primeraSucursal.departamento || "Sin definir",
          responsableNombre: "Sin definir",
          tipoLogro: "operativo",
        })
        .onConflictDoNothing()
      ;[logro] = await db
        .select()
        .from(reconocimientoLogroSucursal)
        .where(eq(reconocimientoLogroSucursal.reconocimientoId, id))
        .limit(1)
    }
    if (!logro) return null
  }
  let sucursalNombre: string | null = null
  const [s] = await db
    .select({ nombre: sucursales.nombre })
    .from(sucursales)
    .where(eq(sucursales.id, logro.sucursalId))
    .limit(1)
  sucursalNombre = s?.nombre ?? null
  return { base, tipo: "logro_sucursal", logro, sucursalNombre }
}

// ─────────────────────────────────────────────────────────────────────────────
// LECTURA — dashboard
// ─────────────────────────────────────────────────────────────────────────────
export type ReconocimientoStats = {
  total: number
  publicados: number
  pendientes: number
  archivados: number
  destacados: number
  enLanding: number
  porTipo: Record<TipoReconocimiento, number>
}

export async function obtenerStatsReconocimientos(): Promise<ReconocimientoStats> {
  const filas = await db
    .select({
      estado: reconocimientos.estado,
      tipo: reconocimientos.tipo,
      destacado: reconocimientos.destacado,
      mostrarEnLanding: reconocimientos.mostrarEnLanding,
    })
    .from(reconocimientos)

  const stats: ReconocimientoStats = {
    total: filas.length,
    publicados: 0,
    pendientes: 0,
    archivados: 0,
    destacados: 0,
    enLanding: 0,
    porTipo: { empleado_mes: 0, equipo_destacado: 0, logro_sucursal: 0 },
  }

  for (const f of filas) {
    if (f.estado === "publicado") stats.publicados++
    if (f.estado === "pendiente") stats.pendientes++
    if (f.estado === "archivado") stats.archivados++
    if (f.destacado) stats.destacados++
    if (f.mostrarEnLanding && f.estado === "publicado") stats.enLanding++
    if (f.tipo in stats.porTipo) {
      stats.porTipo[f.tipo as TipoReconocimiento]++
    }
  }

  return stats
}

// ─────────────────────────────────────────────────────────────────────────────
// LECTURA — landing pública (sin auth)
// ─────────────────────────────────────────────────────────────────────────────
export type LandingEmpleadoMes = {
  id: string
  titulo: string
  motivo: string
  descripcionCorta: string
  imagen: string | null
  nombreCompleto: string
  cargo: string
  area: string
  sucursalNombre: string | null
  mes: number
  gestion: number
}

export type LandingEquipo = {
  id: string
  titulo: string
  descripcionCorta: string
  imagen: string | null
  nombreEquipo: string
  area: string
  responsableNombre: string
  integrantesCount: number
  destacado: boolean
}

export type LandingLogro = {
  id: string
  titulo: string
  descripcionCorta: string
  imagen: string | null
  ciudad: string
  departamento: string
  tipoLogro: string
  indicadorPrincipal: { nombre: string; valor: string; unidad?: string | null } | null
  destacado: boolean
}

export type LandingReconocimientos = {
  empleadoMes: LandingEmpleadoMes | null
  empleadosMes: LandingEmpleadoMes[]
  equipos: LandingEquipo[]
  logros: LandingLogro[]
}

export async function obtenerLandingReconocimientos(): Promise<LandingReconocimientos> {
  const baseCond = and(
    eq(reconocimientos.estado, "publicado"),
    eq(reconocimientos.activo, true),
    eq(reconocimientos.mostrarEnLanding, true),
  )

  // ── Empleados del mes: todos los publicados marcados para landing (se rotan cada 10s) ──
  const empleadosRows = await db
    .select()
    .from(reconocimientos)
    .innerJoin(
      reconocimientoEmpleadoMes,
      eq(reconocimientoEmpleadoMes.reconocimientoId, reconocimientos.id),
    )
    .where(and(baseCond, eq(reconocimientos.tipo, "empleado_mes")))
    .orderBy(desc(reconocimientos.destacado), desc(reconocimientos.publicadoEn))
    .limit(6)

  const sucursalIdsSet = new Set<string>()
  for (const row of empleadosRows) {
    const s = row.reconocimiento_empleado_mes.sucursalId
    if (s) sucursalIdsSet.add(s)
  }
  const sucursalIds = [...sucursalIdsSet]
  const sucursalMap = new Map<string, string>()
  if (sucursalIds.length > 0) {
    const rows = await db
      .select({ id: sucursales.id, nombre: sucursales.nombre })
      .from(sucursales)
      .where(inArray(sucursales.id, sucursalIds))
    for (const s of rows) sucursalMap.set(s.id, s.nombre)
  }

  const empleadosMes: LandingEmpleadoMes[] = empleadosRows.map(({ reconocimientos: r, reconocimiento_empleado_mes: e }) => ({
    id: r.id,
    titulo: r.titulo,
    motivo: r.motivo,
    descripcionCorta: r.descripcionCorta,
    imagen: r.imagen,
    nombreCompleto: e.nombreCompleto,
    cargo: e.cargo,
    area: e.area,
    sucursalNombre: e.sucursalId ? sucursalMap.get(e.sucursalId) ?? null : null,
    mes: e.mes,
    gestion: e.gestion,
  }))

  const empleadoMes: LandingEmpleadoMes | null = empleadosMes[0] ?? null

  // ── Equipos destacados (hasta 6) ──
  const equiposRow = await db
    .select()
    .from(reconocimientos)
    .innerJoin(
      reconocimientoEquipo,
      eq(reconocimientoEquipo.reconocimientoId, reconocimientos.id),
    )
    .where(and(baseCond, eq(reconocimientos.tipo, "equipo_destacado")))
    .orderBy(desc(reconocimientos.destacado), desc(reconocimientos.publicadoEn))
    .limit(12)

  const equipoIds = equiposRow.map((r) => r.reconocimientos.id)
  const integrantesCounts = equipoIds.length > 0
    ? await db
        .select({
          id: reconocimientoEquipoIntegrantes.reconocimientoId,
          count: sql<number>`count(*)::int`,
        })
        .from(reconocimientoEquipoIntegrantes)
        .where(inArray(reconocimientoEquipoIntegrantes.reconocimientoId, equipoIds))
        .groupBy(reconocimientoEquipoIntegrantes.reconocimientoId)
    : []
  const countMap = new Map(integrantesCounts.map((c) => [c.id, c.count]))

  const equipos: LandingEquipo[] = equiposRow.map(({ reconocimientos: r, reconocimiento_equipo: e }) => ({
    id: r.id,
    titulo: r.titulo,
    descripcionCorta: r.descripcionCorta,
    imagen: r.imagen,
    nombreEquipo: e.nombreEquipo,
    area: e.area,
    responsableNombre: e.responsableNombre,
    integrantesCount: countMap.get(r.id) ?? 0,
    destacado: r.destacado,
  }))

  // ── Logros de sucursales (hasta 8) ──
  const logrosRow = await db
    .select()
    .from(reconocimientos)
    .innerJoin(
      reconocimientoLogroSucursal,
      eq(reconocimientoLogroSucursal.reconocimientoId, reconocimientos.id),
    )
    .where(and(baseCond, eq(reconocimientos.tipo, "logro_sucursal")))
    .orderBy(desc(reconocimientos.destacado), desc(reconocimientos.publicadoEn))
    .limit(16)

  const logros: LandingLogro[] = logrosRow.map(({ reconocimientos: r, reconocimiento_logro_sucursal: l }) => {
    const indicadores = (l.indicadores as Array<{ nombre: string; valor: string; unidad?: string | null }> | null) ?? []
    const indicadorPrincipal = indicadores.length > 0 ? indicadores[0] : null
    return {
      id: r.id,
      titulo: r.titulo,
      descripcionCorta: r.descripcionCorta,
      imagen: r.imagen,
      ciudad: l.ciudad,
      departamento: l.departamento,
      tipoLogro: l.tipoLogro,
      indicadorPrincipal,
      destacado: r.destacado,
    }
  })

  return { empleadoMes, empleadosMes, equipos, logros }
}

// ─────────────────────────────────────────────────────────────────────────────
// Directorio de empleados / sucursales (para los formularios)
// ─────────────────────────────────────────────────────────────────────────────
export async function obtenerUsuariosParaReconocimiento() {
  const rows = await db
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

  return rows.map((u) => ({
    id: u.id,
    nombre: `${u.firstName} ${u.lastNamePaternal}${u.lastNameMaternal ? ` ${u.lastNameMaternal}` : ""}`,
    email: u.institutionalEmail,
    image: u.image,
  }))
}

export async function obtenerSucursalesParaReconocimiento() {
  return db
    .select({
      id: sucursales.id,
      nombre: sucursales.nombre,
      departamento: sucursales.departamento,
      capital: sucursales.capital,
    })
    .from(sucursales)
    .where(eq(sucursales.activo, true))
    .orderBy(asc(sucursales.departamento), asc(sucursales.nombre))
}
