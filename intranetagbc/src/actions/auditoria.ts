"use server"

import { db } from "@/db"
import {
  auditLogs,
  users,
  roles,
  permissions,
  userRoles,
  rolePermissions,
  personal,
  directivos,
  contactosEmergencia,
  documentos,
  documentoCategorias,
  comunicados,
  banners,
  configuracion,
  sucursales,
  eventosCalendario,
  solicitudes,
  ticketsSoporte,
  reconocimientos,
  onboardingProgreso,
  onboardingConfig,
  notificaciones,
  emailLogs,
} from "@/db/schema"
import { desc, inArray } from "drizzle-orm"
import { getAuditRequestContext, type AuditRequestContext } from "@/lib/auditoria-context"
import { obtenerSesionConAccesoActual } from "@/lib/auth/session-access"

export type AuditUserDirectoryEntry = {
  id: string
  nombre: string
  email: string
  avatar: string | null
}

export async function obtenerAuditLogs() {
  return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt))
}

export async function registrarAuditLog(data: {
  usuario?: string
  accion: string
  modulo: string
  ip?: string | null
  ubicacionCiudad?: string | null
  ubicacionPais?: string | null
  ubicacionCodigoPais?: string | null
  resultado?: string
  detalles?: string | Record<string, unknown> | null
}) {
  const [session, requestContext] = await Promise.all([
    obtenerSesionConAccesoActual().catch(() => null),
    getAuditRequestContext().catch<AuditRequestContext>(() => ({})),
  ])

  const usuarioInput = cleanText(data.usuario)
  const usuarioFinal =
    !usuarioInput || normalizeText(usuarioInput) === "sistema"
      ? session?.id ?? usuarioInput ?? "sistema"
      : usuarioInput

  const ipFinal = cleanText(data.ip) ?? cleanText(requestContext.ip) ?? null
  const ubicacionCiudad =
    cleanText(data.ubicacionCiudad) ??
    cleanText(requestContext.ubicacion?.ciudad) ??
    null
  const ubicacionPais =
    cleanText(data.ubicacionPais) ??
    cleanText(requestContext.ubicacion?.pais) ??
    null
  const ubicacionCodigoPais =
    cleanText(data.ubicacionCodigoPais) ??
    cleanText(requestContext.ubicacion?.countryCode) ??
    null

  const detalles = mergeDetalles(data.detalles, {
    usuario: session?.id ? { id: session.id } : undefined,
    ubicacion:
      ubicacionCiudad || ubicacionPais || ubicacionCodigoPais
        ? {
            ciudad: ubicacionCiudad ?? undefined,
            pais: ubicacionPais ?? undefined,
            countryCode: ubicacionCodigoPais ?? undefined,
          }
        : undefined,
  })

  await db.insert(auditLogs).values({
    usuario: usuarioFinal,
    accion: data.accion,
    modulo: data.modulo,
    ip: ipFinal,
    ubicacionCiudad,
    ubicacionPais,
    ubicacionCodigoPais,
    resultado: data.resultado ?? "Exitoso",
    detalles: detalles ?? null,
  })
}

export async function obtenerStatsAuditoria() {
  const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt))
  const candidateUserIds = [...new Set(logs.map((log) => log.usuario.trim()).filter(Boolean))]

  const userDirectory: Record<string, AuditUserDirectoryEntry> = {}

  if (candidateUserIds.length > 0) {
    const usuariosEncontrados = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastNamePaternal: users.lastNamePaternal,
        lastNameMaternal: users.lastNameMaternal,
        institutionalEmail: users.institutionalEmail,
        image: users.image,
      })
      .from(users)
      .where(inArray(users.id, candidateUserIds))

    for (const usuario of usuariosEncontrados) {
      userDirectory[usuario.id] = {
        id: usuario.id,
        nombre: `${usuario.firstName} ${usuario.lastNamePaternal}${usuario.lastNameMaternal ? ` ${usuario.lastNameMaternal}` : ""}`,
        email: usuario.institutionalEmail,
        avatar: usuario.image,
      }
    }
  }

  return {
    total: logs.length,
    exitosos: logs.filter(l => l.resultado === "Exitoso").length,
    fallidos: logs.filter(l => l.resultado === "Fallido").length,
    modulos: new Set(logs.map(l => l.modulo)).size,
    logs,
    userDirectory,
  }
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase()
}

function cleanText(value: string | null | undefined): string | undefined {
  if (!value) {
    return undefined
  }

  const clean = value.trim()
  return clean.length > 0 ? clean : undefined
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function mergeNestedRecord(
  base: unknown,
  extra: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  const baseRecord = isObjectRecord(base) ? base : undefined

  if (!baseRecord && !extra) {
    return undefined
  }

  return {
    ...(extra ?? {}),
    ...(baseRecord ?? {}),
  }
}

function mergeDetalles(
  input: string | Record<string, unknown> | null | undefined,
  extras: {
    usuario?: Record<string, unknown>
    ubicacion?: Record<string, unknown>
  },
): string | undefined {
  if (typeof input === "string") {
    const trimmed = input.trim()

    if (trimmed.length === 0) {
      return buildDetailsFromRecord({}, extras)
    }

    try {
      const parsed = JSON.parse(trimmed) as unknown

      if (isObjectRecord(parsed)) {
        return buildDetailsFromRecord(parsed, extras)
      }
    } catch {
      return buildDetailsFromRecord({ mensaje: trimmed }, extras) ?? trimmed
    }

    return buildDetailsFromRecord({ mensaje: trimmed }, extras) ?? trimmed
  }

  if (isObjectRecord(input)) {
    return buildDetailsFromRecord(input, extras)
  }

  return buildDetailsFromRecord({}, extras)
}

function buildDetailsFromRecord(
  record: Record<string, unknown>,
  extras: {
    usuario?: Record<string, unknown>
    ubicacion?: Record<string, unknown>
  },
): string | undefined {
  const merged: Record<string, unknown> = {
    ...record,
  }

  const usuario = mergeNestedRecord(record.usuario, extras.usuario)
  const ubicacion = mergeNestedRecord(record.ubicacion, extras.ubicacion)

  if (usuario) {
    merged.usuario = usuario
  }

  if (ubicacion) {
    merged.ubicacion = ubicacion
  }

  if (Object.keys(merged).length === 0) {
    return undefined
  }

  return JSON.stringify(merged)
}

// ── Generar Copia de Seguridad Completa de la Base de Datos ──
export async function generarBackupBaseDatosAction(): Promise<{
  success: boolean
  message: string
  backup?: any
  filename?: string
}> {
  try {
    const session = await obtenerSesionConAccesoActual()
    if (!session?.id) {
      return { success: false, message: "No autorizado para generar respaldos de base de datos" }
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const filename = `backup_agbc_db_${timestamp}.json`

    const [
      u, r, p, ur, rp,
      pers, dir, conEmerg,
      docs, docCats,
      coms, bans, configs,
      sucs, evCal,
      solics, ticks,
      recs, onbProg, onbConf,
      notifs, eLogs, aLogs,
    ] = await Promise.all([
      db.select().from(users).catch(() => []),
      db.select().from(roles).catch(() => []),
      db.select().from(permissions).catch(() => []),
      db.select().from(userRoles).catch(() => []),
      db.select().from(rolePermissions).catch(() => []),
      db.select().from(personal).catch(() => []),
      db.select().from(directivos).catch(() => []),
      db.select().from(contactosEmergencia).catch(() => []),
      db.select().from(documentos).catch(() => []),
      db.select().from(documentoCategorias).catch(() => []),
      db.select().from(comunicados).catch(() => []),
      db.select().from(banners).catch(() => []),
      db.select().from(configuracion).catch(() => []),
      db.select().from(sucursales).catch(() => []),
      db.select().from(eventosCalendario).catch(() => []),
      db.select().from(solicitudes).catch(() => []),
      db.select().from(ticketsSoporte).catch(() => []),
      db.select().from(reconocimientos).catch(() => []),
      db.select().from(onboardingProgreso).catch(() => []),
      db.select().from(onboardingConfig).catch(() => []),
      db.select().from(notificaciones).limit(2000).catch(() => []),
      db.select().from(emailLogs).limit(2000).catch(() => []),
      db.select().from(auditLogs).limit(5000).catch(() => []),
    ])

    const conteoPorTabla: Record<string, number> = {
      usuarios: u.length,
      roles: r.length,
      permisos: p.length,
      usuario_roles: ur.length,
      rol_permisos: rp.length,
      personal_rrhh: pers.length,
      directivos: dir.length,
      contactos_emergencia: conEmerg.length,
      documentos: docs.length,
      categorias_documentos: docCats.length,
      comunicados: coms.length,
      noticias_banners: bans.length,
      configuracion: configs.length,
      sucursales: sucs.length,
      eventos_calendario: evCal.length,
      solicitudes_tramites: solics.length,
      tickets_soporte: ticks.length,
      reconocimientos: recs.length,
      onboarding_progreso: onbProg.length,
      onboarding_config: onbConf.length,
      notificaciones: notifs.length,
      email_logs: eLogs.length,
      logs_auditoria: aLogs.length,
    }

    const totalRegistros = Object.values(conteoPorTabla).reduce((acc, curr) => acc + curr, 0)

    const backupData = {
      metadata: {
        sistema: "Intranet AGBC - Agencia Boliviana de Correos",
        version: "2.0",
        fechaGeneracion: new Date().toISOString(),
        usuarioId: session.id,
        totalTablas: Object.keys(conteoPorTabla).length,
        totalRegistros,
        conteoPorTabla,
      },
      tablas: {
        users: u,
        roles: r,
        permissions: p,
        userRoles: ur,
        rolePermissions: rp,
        personal: pers,
        directivos: dir,
        contactosEmergencia: conEmerg,
        documentos: docs,
        documentoCategorias: docCats,
        comunicados: coms,
        banners: bans,
        configuracion: configs,
        sucursales: sucs,
        eventosCalendario: evCal,
        solicitudes: solics,
        ticketsSoporte: ticks,
        reconocimientos: recs,
        onboardingProgreso: onbProg,
        onboardingConfig: onbConf,
        notificaciones: notifs,
        emailLogs: eLogs,
        auditLogs: aLogs,
      },
    }

    await registrarAuditLog({
      usuario: session.id,
      accion: `Generó Copia de Seguridad completa de la Base de Datos (${totalRegistros} registros en ${Object.keys(conteoPorTabla).length} tablas)`,
      modulo: "Auditoría",
      resultado: "Exitoso",
      detalles: {
        archivo: filename,
        totalRegistros,
        totalTablas: Object.keys(conteoPorTabla).length,
      },
    })

    return {
      success: true,
      message: `Respaldo generado con éxito: ${totalRegistros} registros en ${Object.keys(conteoPorTabla).length} tablas.`,
      backup: backupData,
      filename,
    }
  } catch (error: any) {
    console.error("Error al generar backup de base de datos:", error)
    return {
      success: false,
      message: error?.message || "Error al generar la copia de seguridad de la base de datos",
    }
  }
}
