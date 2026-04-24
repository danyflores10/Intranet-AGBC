"use server"

import { db } from "@/db"
import { onboardingConfig, onboardingProgreso, users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import { obtenerUsuarioRbacActual } from "@/lib/auth/session-access"
import { puedeAccederUsuario } from "@/lib/rbac"
import { PERMISOS } from "@/lib/auth/permisos"
import { registrarAuditLog } from "@/actions/auditoria"

const CLAVE_SINGLETON = "default"
const UMBRAL_NUEVO_DIAS = 7

export type MostrarAOnboarding = "todos" | "nuevos" | "rol"
export type EstadoProgreso = "pendiente" | "completado" | "omitido"

// ─────────────────────────────────────────────────────────────────────────────
// Config global
// ─────────────────────────────────────────────────────────────────────────────
export async function obtenerConfigOnboarding() {
  const [existente] = await db
    .select()
    .from(onboardingConfig)
    .where(eq(onboardingConfig.clave, CLAVE_SINGLETON))
    .limit(1)
  if (existente) return existente

  const [creado] = await db
    .insert(onboardingConfig)
    .values({
      clave: CLAVE_SINGLETON,
      activo: true,
      mostrarA: "nuevos",
      version: "1",
    })
    .returning()
  return creado
}

export async function actualizarConfigOnboarding(input: {
  activo: boolean
  mostrarA: MostrarAOnboarding
  rolObjetivo?: string | null
}) {
  const usuario = await obtenerUsuarioRbacActual()
  if (!usuario) throw new Error("No autorizado")
  if (!puedeAccederUsuario(usuario, { permissions: [PERMISOS.ONBOARDING.CONFIGURAR] })) {
    throw new Error("Sin permiso para configurar el onboarding")
  }

  await obtenerConfigOnboarding() // asegura que exista
  await db
    .update(onboardingConfig)
    .set({
      activo: input.activo,
      mostrarA: input.mostrarA,
      rolObjetivo: input.mostrarA === "rol" ? (input.rolObjetivo ?? null) : null,
    })
    .where(eq(onboardingConfig.clave, CLAVE_SINGLETON))

  await registrarAuditLog({
    usuario: usuario.id,
    accion: `Actualizó configuración de onboarding (mostrarA=${input.mostrarA}, activo=${input.activo})`,
    modulo: "Onboarding",
  })
  revalidatePath("/configuracion/onboarding")
}

export async function reiniciarOnboardingGlobal() {
  const usuario = await obtenerUsuarioRbacActual()
  if (!usuario) throw new Error("No autorizado")
  if (!puedeAccederUsuario(usuario, { permissions: [PERMISOS.ONBOARDING.CONFIGURAR] })) {
    throw new Error("Sin permiso")
  }

  const actual = await obtenerConfigOnboarding()
  const nuevaVersion = String(Number(actual.version || "1") + 1)

  await db
    .update(onboardingConfig)
    .set({ version: nuevaVersion })
    .where(eq(onboardingConfig.clave, CLAVE_SINGLETON))

  await registrarAuditLog({
    usuario: usuario.id,
    accion: `Reinició onboarding globalmente (versión ${nuevaVersion})`,
    modulo: "Onboarding",
  })
  revalidatePath("/configuracion/onboarding")
}

// ─────────────────────────────────────────────────────────────────────────────
// Progreso por usuario
// ─────────────────────────────────────────────────────────────────────────────
export type EstadoOnboardingUsuario = {
  debeVerlo: boolean
  estado: EstadoProgreso
  version: string
}

async function obtenerProgresoPorUsuario(usuarioId: string) {
  const [row] = await db
    .select()
    .from(onboardingProgreso)
    .where(eq(onboardingProgreso.usuarioId, usuarioId))
    .limit(1)
  return row ?? null
}

function esUsuarioNuevo(createdAt: Date | string): boolean {
  const creado = typeof createdAt === "string" ? new Date(createdAt) : createdAt
  const diffMs = Date.now() - creado.getTime()
  const diffDias = diffMs / (1000 * 60 * 60 * 24)
  return diffDias <= UMBRAL_NUEVO_DIAS
}

export async function obtenerEstadoOnboardingUsuarioActual(): Promise<EstadoOnboardingUsuario | null> {
  const usuario = await obtenerUsuarioRbacActual()
  if (!usuario) return null

  const config = await obtenerConfigOnboarding()
  if (!config.activo) return { debeVerlo: false, estado: "pendiente", version: config.version }

  const progreso = await obtenerProgresoPorUsuario(usuario.id)

  // Si la versión cambió, el progreso queda "obsoleto" → debe verlo de nuevo
  const versionIgual = progreso?.version === config.version
  const estado: EstadoProgreso = versionIgual
    ? (progreso?.estado as EstadoProgreso) ?? "pendiente"
    : "pendiente"

  if (estado === "completado" || estado === "omitido") {
    return { debeVerlo: false, estado, version: config.version }
  }

  // Aplicar regla "mostrarA"
  let elegible = false
  if (config.mostrarA === "todos") {
    elegible = true
  } else if (config.mostrarA === "nuevos") {
    const [u] = await db
      .select({ createdAt: users.createdAt })
      .from(users)
      .where(eq(users.id, usuario.id))
      .limit(1)
    elegible = u ? esUsuarioNuevo(u.createdAt) : false
  } else if (config.mostrarA === "rol") {
    const objetivo = (config.rolObjetivo ?? "").trim().toLowerCase()
    elegible = objetivo.length > 0 && usuario.roles.includes(objetivo)
  }

  return {
    debeVerlo: elegible,
    estado: "pendiente",
    version: config.version,
  }
}

async function upsertProgreso(
  usuarioId: string,
  datos: { estado: EstadoProgreso; paso?: string | null; version: string },
) {
  const existente = await obtenerProgresoPorUsuario(usuarioId)
  const ahora = new Date()
  const set = {
    estado: datos.estado,
    paso: datos.paso ?? null,
    version: datos.version,
    vistoEn: existente?.vistoEn ?? ahora,
    completadoEn: datos.estado === "completado" ? ahora : existente?.completadoEn ?? null,
  }
  if (existente) {
    await db
      .update(onboardingProgreso)
      .set(set)
      .where(eq(onboardingProgreso.usuarioId, usuarioId))
  } else {
    await db.insert(onboardingProgreso).values({ usuarioId, ...set })
  }
}

export async function marcarOnboardingVisto() {
  const usuario = await obtenerUsuarioRbacActual()
  if (!usuario) return
  const config = await obtenerConfigOnboarding()
  const existente = await obtenerProgresoPorUsuario(usuario.id)
  if (existente && existente.version === config.version && existente.estado !== "pendiente") return
  await upsertProgreso(usuario.id, { estado: "pendiente", version: config.version })
}

export async function completarOnboarding() {
  const usuario = await obtenerUsuarioRbacActual()
  if (!usuario) return
  const config = await obtenerConfigOnboarding()
  await upsertProgreso(usuario.id, { estado: "completado", version: config.version })
}

export async function omitirOnboarding() {
  const usuario = await obtenerUsuarioRbacActual()
  if (!usuario) return
  const config = await obtenerConfigOnboarding()
  await upsertProgreso(usuario.id, { estado: "omitido", version: config.version })
}

export async function reiniciarOnboardingUsuarioActual() {
  const usuario = await obtenerUsuarioRbacActual()
  if (!usuario) return
  const config = await obtenerConfigOnboarding()
  await upsertProgreso(usuario.id, { estado: "pendiente", version: config.version })
  revalidatePath("/perfil")
}
