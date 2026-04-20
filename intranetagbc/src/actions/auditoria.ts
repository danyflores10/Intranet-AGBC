"use server"

import { db } from "@/db"
import { auditLogs, users } from "@/db/schema"
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
