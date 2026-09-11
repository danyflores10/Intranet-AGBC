import { createId } from "@paralleldrive/cuid2"
import { eq, or, sql } from "drizzle-orm"
import { db } from "@/db"
import { account, personal, roles, userRoles, users } from "@/db/schema"
import { auth } from "@/lib/auth"

export function desglosarNombreCompleto(nombreCompleto?: string): {
  firstName: string
  lastNamePaternal: string
  lastNameMaternal: string | null
} {
  if (!nombreCompleto || nombreCompleto.trim().length === 0) {
    return { firstName: "Funcionario", lastNamePaternal: "AGBC", lastNameMaternal: null }
  }
  const parts = nombreCompleto.trim().split(/\s+/)
  if (parts.length === 1) {
    return { firstName: parts[0], lastNamePaternal: "AGBC", lastNameMaternal: null }
  }
  if (parts.length === 2) {
    return { firstName: parts[0], lastNamePaternal: parts[1], lastNameMaternal: null }
  }
  if (parts.length === 3) {
    return { firstName: parts[0], lastNamePaternal: parts[1], lastNameMaternal: parts[2] }
  }
  return {
    firstName: parts.slice(0, -2).join(" "),
    lastNamePaternal: parts[parts.length - 2],
    lastNameMaternal: parts[parts.length - 1],
  }
}

export function generarEmailInstitucional(nombre?: string): string {
  const cleanNombre = (nombre || "personal")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, ".")
    .replace(/\.+/g, ".")
    .replace(/^\.|\.$/g, "")
  return `${cleanNombre || "funcionario"}@correos.gob.bo`
}

export function normalizarEmail(email?: string | null, nombre?: string): string {
  if (email && email.trim().length > 3 && email.includes("@")) {
    return email.trim().toLowerCase()
  }
  return generarEmailInstitucional(nombre)
}

/**
 * Sincroniza un registro individual de personal con las tablas de autenticación (users + account + userRoles).
 */
export async function sincronizarPersonalConUsuarioIndividual(
  p: typeof personal.$inferSelect,
  passwordPersonalizada?: string
) {
  try {
    const authContext = await auth.$context
    const emailNorm = normalizarEmail(p.email, p.nombre)
    const ciRaw = p.ci ? p.ci.trim() : ""
    const ciNorm = ciRaw && ciRaw !== "—" && ciRaw.length >= 4 ? ciRaw : null

    const desglose = desglosarNombreCompleto(p.nombre)
    const firstName = desglose.firstName
    const lastNamePaternal = desglose.lastNamePaternal || "AGBC"
    const lastNameMaternal = desglose.lastNameMaternal

    // Buscar si ya existe el usuario por email institucional, email personal o por CI
    const conditions = [
      eq(users.institutionalEmail, emailNorm),
      eq(users.email, emailNorm),
    ]
    if (ciNorm) {
      conditions.push(eq(users.nationalId, ciNorm))
    }

    const [usrExistente] = await db
      .select()
      .from(users)
      .where(or(...conditions))
      .limit(1)

    // Determinar la contraseña a usar
    let passwordAEstablecer = passwordPersonalizada?.trim()
    if (!passwordAEstablecer || passwordAEstablecer.length < 6) {
      if (ciNorm && ciNorm.length >= 6) {
        passwordAEstablecer = ciNorm
      } else {
        passwordAEstablecer = "Correos2026!"
      }
    }

    const hashedPassword = await authContext.password.hash(passwordAEstablecer)
    const hoyStr = new Date().toISOString().slice(0, 10)
    const dateOfBirth = p.fechaIngreso && /^\d{4}-\d{2}-\d{2}$/.test(p.fechaIngreso)
      ? p.fechaIngreso
      : "1995-01-01"
    const isActive = p.estado === "activo"

    // Obtener rol por defecto 'usuario'
    const allRoles = await db.select().from(roles)
    const defaultRoleId =
      allRoles.find((r) => r.name.toLowerCase() === "usuario")?.id ||
      allRoles[0]?.id ||
      "usr_role_usuario_2025"

    if (usrExistente) {
      // Actualizar usuario existente
      await db
        .update(users)
        .set({
          firstName,
          lastNamePaternal,
          lastNameMaternal,
          institutionalEmail: emailNorm,
          email: emailNorm,
          nationalId: ciNorm || usrExistente.nationalId,
          isActive,
          image: p.foto || usrExistente.image,
          updatedAt: new Date(),
        })
        .where(eq(users.id, usrExistente.id))

      // Actualizar o insertar cuenta de credenciales
      const [acc] = await db.select().from(account).where(eq(account.userId, usrExistente.id)).limit(1)
      if (acc) {
        if (passwordPersonalizada && passwordPersonalizada.trim().length >= 6) {
          await db
            .update(account)
            .set({
              password: hashedPassword,
              idToken: passwordPersonalizada.trim(),
              updatedAt: new Date(),
            })
            .where(eq(account.userId, usrExistente.id))
        }
      } else {
        await db.insert(account).values({
          id: createId(),
          accountId: usrExistente.id,
          providerId: "credential",
          userId: usrExistente.id,
          password: hashedPassword,
          idToken: passwordAEstablecer,
        })
      }

      // Asegurar que tenga rol asignado
      const [ur] = await db.select().from(userRoles).where(eq(userRoles.userId, usrExistente.id)).limit(1)
      if (!ur) {
        await db.insert(userRoles).values({
          userId: usrExistente.id,
          roleId: defaultRoleId,
        })
      }

      return { userId: usrExistente.id, action: "updated" }
    } else {
      // Crear nuevo usuario
      const newUserId = createId()
      const nationalIdToUse = ciNorm || `AGBC-${createId().slice(0, 8).toUpperCase()}`

      await db.insert(users).values({
        id: newUserId,
        firstName,
        lastNamePaternal,
        lastNameMaternal,
        institutionalEmail: emailNorm,
        email: emailNorm,
        emailVerified: false,
        nationalId: nationalIdToUse,
        dateOfBirth,
        isActive,
        image: p.foto || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      await db.insert(account).values({
        id: createId(),
        accountId: newUserId,
        providerId: "credential",
        userId: newUserId,
        password: hashedPassword,
        idToken: passwordAEstablecer,
      })

      await db.insert(userRoles).values({
        userId: newUserId,
        roleId: defaultRoleId,
      })

      return { userId: newUserId, action: "created" }
    }
  } catch (error) {
    console.error(`Error sincronizando personal con usuario (${p.nombre}):`, error)
    return { error }
  }
}

/**
 * Sincroniza bidireccionalmente todo el personal y usuarios:
 * 1. Cada registro de personal se asegura en users + account + userRoles.
 * 2. Cada usuario se asegura en personal.
 */
export async function sincronizarTodoPersonalConUsuarios() {
  try {
    const todosPersonal = await db.select().from(personal)
    const todosUsuarios = await db.select().from(users)

    let creados = 0
    let actualizados = 0

    // 1. Personal -> Users + Account + UserRoles
    for (const p of todosPersonal) {
      const res = await sincronizarPersonalConUsuarioIndividual(p)
      if (res && "action" in res) {
        if (res.action === "created") creados++
        if (res.action === "updated") actualizados++
      }
    }

    // 2. Users -> Personal (para usuarios que no estén aún en la tabla personal)
    const personalEmails = new Set(
      todosPersonal.map((p) => (p.email || "").trim().toLowerCase()).filter(Boolean)
    )
    const personalCIs = new Set(
      todosPersonal.map((p) => (p.ci || "").trim()).filter((ci) => ci && ci !== "—")
    )

    for (const u of todosUsuarios) {
      const email = (u.institutionalEmail || u.email || "").trim().toLowerCase()
      const ci = (u.nationalId || "").trim()

      const yaEnPersonal = personalEmails.has(email) || (ci && ci !== "—" && personalCIs.has(ci))

      if (!yaEnPersonal && email) {
        const nombreCompleto = [u.firstName, u.lastNamePaternal, u.lastNameMaternal]
          .filter(Boolean)
          .join(" ")

        await db.insert(personal).values({
          id: createId(),
          nombre: nombreCompleto || "Funcionario Institucional",
          ci: ci || "—",
          cargo: "Funcionario Institucional",
          unidad: "Administración Central",
          email: email,
          telefono: null,
          foto: u.image || null,
          fechaIngreso: u.createdAt
            ? (u.createdAt instanceof Date ? u.createdAt.toISOString().slice(0, 10) : new Date(u.createdAt).toISOString().slice(0, 10))
            : new Date().toISOString().slice(0, 10),
          estado: u.isActive ? "activo" : "inactivo",
        })
        creados++
      }
    }

    return {
      success: true,
      message: `Sincronización unificada completada: ${creados} registros creados, ${actualizados} actualizados.`,
      creados,
      actualizados,
    }
  } catch (error: any) {
    console.error("Error en sincronización global de personal y usuarios:", error)
    return {
      success: false,
      message: error?.message || "Error desconocido al sincronizar personal con usuarios.",
    }
  }
}
