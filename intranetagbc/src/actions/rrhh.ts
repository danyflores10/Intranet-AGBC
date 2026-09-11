"use server"

import { db } from "@/db"
import { personal, contactosEmergencia, directivos, users, account, userRoles } from "@/db/schema"
import { eq, desc, asc, or } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { registrarAuditLog } from "@/actions/auditoria"
import { auth } from "@/lib/auth"
import {
  sincronizarPersonalConUsuarioIndividual,
  sincronizarTodoPersonalConUsuarios,
} from "@/lib/services/personal-user-sync"

/* ═══════════════════════ PERSONAL ═══════════════════════ */

export async function obtenerPersonal() {
  return db.select().from(personal).orderBy(personal.nombre)
}

export async function sincronizarPersonalYUsuariosAction() {
  const res = await sincronizarTodoPersonalConUsuarios()
  revalidatePath("/rrhh")
  revalidatePath("/usuarios")
  return res
}

export async function crearPersonal(
  data: {
    nombre: string
    ci?: string
    cargo: string
    unidad?: string
    email?: string
    telefono?: string
    foto?: string
    fechaIngreso?: string
  },
  password?: string
) {
  const payload = {
    ...data,
    ci: data.ci ? data.ci.slice(0, 20) : "—",
    unidad: data.unidad || "General",
    fechaIngreso: data.fechaIngreso || new Date().toISOString().split("T")[0],
  }
  const [nuevo] = await db.insert(personal).values(payload).returning()

  // Sincronizar automáticamente con la cuenta de usuario (users + account + roles)
  if (nuevo) {
    await sincronizarPersonalConUsuarioIndividual(nuevo, password)
  }

  await registrarAuditLog({ usuario: "sistema", accion: `Registró personal: ${data.nombre}`, modulo: "RRHH", resultado: "Exitoso" })
  revalidatePath("/rrhh")
  revalidatePath("/usuarios")
  return nuevo
}

export async function actualizarPersonal(
  id: string,
  data: Partial<{
    nombre: string
    ci: string
    cargo: string
    unidad: string
    email: string
    telefono: string
    foto: string
    fechaIngreso: string
    estado: string
  }>,
  password?: string
) {
  const [actualizado] = await db.update(personal).set(data).where(eq(personal.id, id)).returning()

  // Sincronizar automáticamente con la cuenta de usuario (users + account + roles)
  if (actualizado) {
    await sincronizarPersonalConUsuarioIndividual(actualizado, password)
  }

  await registrarAuditLog({ usuario: "sistema", accion: `Actualizó personal ID: ${id}`, modulo: "RRHH", resultado: "Exitoso" })
  revalidatePath("/rrhh")
  revalidatePath("/usuarios")
  return actualizado
}

export async function eliminarPersonal(id: string) {
  const [pers] = await db.select().from(personal).where(eq(personal.id, id)).limit(1)
  if (pers) {
    const emailNorm = pers.email ? pers.email.trim().toLowerCase() : null
    const ciNorm = pers.ci ? pers.ci.trim() : null
    if (emailNorm || (ciNorm && ciNorm !== "—")) {
      try {
        const conditions = []
        if (emailNorm) conditions.push(eq(users.institutionalEmail, emailNorm), eq(users.email, emailNorm))
        if (ciNorm && ciNorm !== "—") conditions.push(eq(users.nationalId, ciNorm))
        if (conditions.length > 0) {
          const matchedUsers = await db.select({ id: users.id }).from(users).where(or(...conditions))
          for (const u of matchedUsers) {
            await db.delete(account).where(eq(account.userId, u.id))
            await db.delete(userRoles).where(eq(userRoles.userId, u.id))
            await db.delete(users).where(eq(users.id, u.id))
          }
        }
      } catch {}
    }
  }

  await db.delete(personal).where(eq(personal.id, id))
  await registrarAuditLog({ usuario: "sistema", accion: `Eliminó permanentemente personal ID: ${id}`, modulo: "RRHH", resultado: "Exitoso" })
  revalidatePath("/rrhh")
  revalidatePath("/usuarios")
}

/* ═══════════════════════ DIRECTIVOS ═══════════════════════ */

export async function obtenerDirectivos() {
  return db.select().from(directivos).orderBy(asc(directivos.orden), asc(directivos.nombre))
}

export async function crearDirectivo(data: {
  nombre: string
  cargo?: string
  unidad?: string
  email?: string
  telefono?: string
  foto?: string
  orden?: number
}) {
  const payload = {
    ...data,
    cargo: data.cargo || data.unidad || "Dirección",
    unidad: data.unidad || "Dirección General",
    orden: data.orden ?? 0,
  }
  const [nuevo] = await db.insert(directivos).values(payload).returning()
  await registrarAuditLog({ usuario: "sistema", accion: `Registró directivo: ${data.nombre}`, modulo: "RRHH", resultado: "Exitoso" })
  revalidatePath("/rrhh")
  revalidatePath("/")
  return nuevo
}

export async function actualizarDirectivo(id: string, data: Partial<{
  nombre: string
  cargo: string
  unidad: string
  email: string
  telefono: string
  foto: string
  orden: number
  estado: string
}>) {
  const [actualizado] = await db.update(directivos).set(data).where(eq(directivos.id, id)).returning()
  await registrarAuditLog({ usuario: "sistema", accion: `Actualizó directivo ID: ${id}`, modulo: "RRHH", resultado: "Exitoso" })
  revalidatePath("/rrhh")
  revalidatePath("/")
  return actualizado
}

export async function eliminarDirectivo(id: string) {
  await db.delete(directivos).where(eq(directivos.id, id))
  await registrarAuditLog({ usuario: "sistema", accion: `Eliminó directivo ID: ${id}`, modulo: "RRHH", resultado: "Exitoso" })
  revalidatePath("/rrhh")
  revalidatePath("/")
}


/* ═══════════════════════ CONTACTOS EMERGENCIA ═══════════════════════ */
export async function obtenerContactosEmergencia(personalId: string) {
  return db.select().from(contactosEmergencia).where(eq(contactosEmergencia.personalId, personalId))
}

export async function crearContactoEmergencia(data: {
  personalId: string
  nombre: string
  parentesco: string
  telefono: string
}) {
  const [nuevo] = await db.insert(contactosEmergencia).values(data).returning()
  revalidatePath("/rrhh")
  return nuevo
}

export async function eliminarContactoEmergencia(id: string) {
  await db.delete(contactosEmergencia).where(eq(contactosEmergencia.id, id))
  revalidatePath("/rrhh")
}

/* ═══════════════════════ IMPORTACIÓN EXCEL RRHH ═══════════════════════ */

export type ImportPersonalRecord = {
  id?: string
  nombre: string
  ci?: string
  cargo?: string
  unidad?: string
  email?: string
  telefono?: string
  fechaIngreso?: string
  estado?: string
}

function normalizarTextoBusqueda(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function generarPasswordAleatoria(): string {
  const prefixes = ["Agbc", "Correos", "Bolivia", "Postal", "AdminAGBC"]
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const year = 2026
  const symbols = ["!", "@", "#", "$", "*"]
  const symbol = symbols[Math.floor(Math.random() * symbols.length)]
  const chars = "abcdefghjkmnpqrstuvwxyz23456789ABCDEFGHJKMNPQRSTUVWXYZ"
  let randomSuffix = ""
  for (let i = 0; i < 4; i++) {
    randomSuffix += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `${prefix}${year}${symbol}${randomSuffix}`
}

let snapshotPersonalAntesDeImportacion: (typeof personal.$inferSelect)[] | null = null

export async function importarPersonalLote(registros: ImportPersonalRecord[]) {
  try {
    let totalImportados = 0
    let totalActualizados = 0
    let totalOmitidos = 0
    const hoy = new Date().toISOString().slice(0, 10)

    // Guardar snapshot de seguridad antes de procesar cambios para permitir revertir
    const personalPrevio = await db.select().from(personal)
    snapshotPersonalAntesDeImportacion = personalPrevio.map((p) => ({ ...p }))

    // Cargar todo el personal existente para cruce y deduplicación inteligente
    const todosPersonal = [...personalPrevio]
    const authContext = await auth.$context

    for (const r of registros) {
      const nombreLimpio = r.nombre ? r.nombre.trim() : ""
      if (!nombreLimpio) {
        totalOmitidos++
        continue
      }

      // Descartar si el nombre es solo números (ej. el N° 1, 2, 3...) o es demasiado corto o es un encabezado/banner
      const esNumero = /^[0-9]+$/.test(nombreLimpio)
      const esBanner =
        nombreLimpio === "N°" ||
        nombreLimpio.toLowerCase().startsWith("fecha de") ||
        /reporte oficial|planilla|nomina|agencia boliviana|fecha de emision|total funcionarios/i.test(nombreLimpio)

      if (esNumero || esBanner || nombreLimpio.length < 3) {
        totalOmitidos++
        continue
      }

      const idLimpio = r.id && r.id.trim().length > 5 ? r.id.trim() : undefined
      const ciRaw = r.ci && r.ci.trim() !== "—" && !r.ci.toLowerCase().includes("no registrado") ? r.ci.trim() : undefined
      const ciLimpio = ciRaw ? ciRaw.slice(0, 20) : "—"
      const cargoLimpio = (r.cargo || "Personal").trim()
      const unidadLimpia = (r.unidad || "Administración Central").trim()
      const emailLimpio = r.email && r.email.trim() !== "Sin asignar" && r.email.includes("@")
        ? r.email.trim().toLowerCase()
        : undefined
      const telefonoLimpio = r.telefono && r.telefono.trim() !== "Sin asignar" && r.telefono.trim() !== "—"
        ? r.telefono.trim()
        : undefined
      const fechaIngresoLimpia = r.fechaIngreso && /^\d{4}-\d{2}-\d{2}$/.test(r.fechaIngreso) ? r.fechaIngreso : hoy
      const estadoLimpio = r.estado?.toLowerCase() === "inactivo" ? "inactivo" : "activo"

      const nombreNorm = normalizarTextoBusqueda(nombreLimpio)

      // ── Búsqueda inteligente de duplicados / coincidencias ──
      let indexExistente = -1

      // 1. Coincidencia por ID explícito
      if (idLimpio) {
        indexExistente = todosPersonal.findIndex((p) => p.id === idLimpio)
      }

      // 2. Coincidencia por CI válido
      if (indexExistente === -1 && ciLimpio && ciLimpio !== "—") {
        indexExistente = todosPersonal.findIndex(
          (p) => p.ci && p.ci.trim() === ciLimpio && p.ci.trim() !== "—"
        )
      }

      // 3. Coincidencia por Correo Electrónico
      if (indexExistente === -1 && emailLimpio) {
        indexExistente = todosPersonal.findIndex(
          (p) => p.email && p.email.trim().toLowerCase() === emailLimpio
        )
      }

      // 4. Coincidencia por Nombre Completo Normalizado (permite variaciones leves, mayúsculas y acentos)
      if (indexExistente === -1 && nombreNorm.length >= 3) {
        // 4a. Coincidencia exacta normalizada
        indexExistente = todosPersonal.findIndex(
          (p) => normalizarTextoBusqueda(p.nombre) === nombreNorm
        )

        // 4b. Coincidencia por inclusión de nombres o palabras clave
        if (indexExistente === -1 && nombreNorm.length >= 4) {
          indexExistente = todosPersonal.findIndex((p) => {
            const dbNorm = normalizarTextoBusqueda(p.nombre)
            if (dbNorm.length >= 4 && (nombreNorm.includes(dbNorm) || dbNorm.includes(nombreNorm))) {
              return true
            }
            const tokens1 = nombreNorm.split(" ").filter((w) => w.length > 2)
            const tokens2 = dbNorm.split(" ").filter((w) => w.length > 2)
            if (tokens1.length >= 2 && tokens2.length >= 2) {
              const matches = tokens1.filter((t) => tokens2.includes(t))
              if (matches.length >= Math.min(tokens1.length, tokens2.length)) {
                return true
              }
            }
            return false
          })
        }
      }

      if (indexExistente !== -1) {
        // ── ACTUALIZAR REGISTRO EXISTENTE (UPSERT) ──
        // Refleja exactamente las nuevas mayúsculas, minúsculas, acentos y textos del Excel
        const existente = todosPersonal[indexExistente]
        const updateData: Partial<typeof personal.$inferInsert> = {
          nombre: nombreLimpio,
          cargo: cargoLimpio || existente.cargo,
          unidad: unidadLimpia || existente.unidad,
          estado: estadoLimpio,
        }

        if (emailLimpio) updateData.email = emailLimpio
        if (telefonoLimpio) updateData.telefono = telefonoLimpio
        if (ciLimpio && ciLimpio !== "—") updateData.ci = ciLimpio
        if (fechaIngresoLimpia && fechaIngresoLimpia !== hoy) {
          updateData.fechaIngreso = fechaIngresoLimpia
        }

        const [actualizado] = await db.update(personal).set(updateData).where(eq(personal.id, existente.id)).returning()
        if (actualizado) {
          await sincronizarPersonalConUsuarioIndividual(actualizado)
        }

        todosPersonal[indexExistente] = {
          ...existente,
          ...updateData,
        }
        totalActualizados++
      } else {
        // ── INSERTAR NUEVO REGISTRO ──
        const insertData = {
          nombre: nombreLimpio,
          ci: ciLimpio,
          cargo: cargoLimpio,
          unidad: unidadLimpia,
          email: emailLimpio || null,
          telefono: telefonoLimpio || null,
          fechaIngreso: fechaIngresoLimpia,
          estado: estadoLimpio,
        }

        const [nuevo] = await db.insert(personal).values(insertData).returning()
        if (nuevo) {
          todosPersonal.push(nuevo)
          // Sincronizar automáticamente con users, account y roles
          await sincronizarPersonalConUsuarioIndividual(nuevo)
        }
        totalImportados++
      }
    }

    // Sincronización de seguridad bidireccional
    await sincronizarTodoPersonalConUsuarios()

    await registrarAuditLog({
      usuario: "sistema",
      accion: `Importó nómina Excel RRHH: ${totalImportados} nuevos, ${totalActualizados} actualizados`,
      modulo: "RRHH",
      resultado: "Exitoso",
    })

    revalidatePath("/rrhh")
    revalidatePath("/usuarios")
    revalidatePath("/dashboard")
    revalidatePath("/")

    return {
      success: true,
      data: {
        totalImportados,
        totalActualizados,
        totalOmitidos,
      },
    }
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Error al procesar la planilla de personal.",
    }
  }
}

export async function revertirUltimaImportacionRRHH() {
  try {
    if (snapshotPersonalAntesDeImportacion && snapshotPersonalAntesDeImportacion.length > 0) {
      await db.delete(personal)
      for (const p of snapshotPersonalAntesDeImportacion) {
        await db.insert(personal).values({
          id: p.id,
          nombre: p.nombre,
          ci: p.ci,
          cargo: p.cargo,
          unidad: p.unidad,
          email: p.email,
          telefono: p.telefono,
          fechaIngreso: p.fechaIngreso,
          estado: p.estado,
          foto: p.foto,
          createdAt: p.createdAt ? (p.createdAt instanceof Date ? p.createdAt : new Date(p.createdAt)) : new Date(),
          updatedAt: p.updatedAt ? (p.updatedAt instanceof Date ? p.updatedAt : new Date(p.updatedAt)) : new Date(),
        })
      }
      snapshotPersonalAntesDeImportacion = null
    } else {
      // Si no hay snapshot en memoria, limpiar automáticamente todos los registros inválidos/corruptos
      const all = await db.select().from(personal)
      for (const p of all) {
        const nombreTrim = p.nombre ? p.nombre.trim() : ""
        const isBogus =
          /^[0-9]+$/.test(nombreTrim) ||
          nombreTrim.length < 3 ||
          nombreTrim.toLowerCase().startsWith("fecha de") ||
          nombreTrim === "N°" ||
          /reporte oficial|planilla|nomina|agencia boliviana|total funcionarios/i.test(nombreTrim)

        if (isBogus) {
          await db.delete(personal).where(eq(personal.id, p.id))
        }
      }
    }

    // Sincronizar bidireccionalmente el personal restaurado con las cuentas de usuario
    await sincronizarTodoPersonalConUsuarios()

    await registrarAuditLog({
      usuario: "sistema",
      accion: "Revirtió importación de Excel en RRHH",
      modulo: "RRHH",
      resultado: "Exitoso",
    })

    revalidatePath("/rrhh")
    revalidatePath("/usuarios")
    revalidatePath("/dashboard")
    revalidatePath("/")

    return {
      success: true,
      message: "Cambios revertidos exitosamente. El padrón ha sido restaurado.",
    }
  } catch (err: unknown) {
    console.error("Error en revertirUltimaImportacionRRHH:", err)
    return {
      success: false,
      message: err instanceof Error ? err.message : "Error al revertir los cambios.",
    }
  }
}

export async function confirmarCambiosImportacionRRHH() {
  try {
    snapshotPersonalAntesDeImportacion = null

    await registrarAuditLog({
      usuario: "sistema",
      accion: "Confirmó y consolidó cambios de importación Excel RRHH",
      modulo: "RRHH",
      resultado: "Exitoso",
    })

    return {
      success: true,
      message: "Cambios fijados y consolidados permanentemente en el padrón.",
    }
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Error al confirmar los cambios.",
    }
  }
}

