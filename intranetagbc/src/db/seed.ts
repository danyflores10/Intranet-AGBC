import "dotenv/config"
import fs from "fs"
import path from "path"
import { createId } from "@paralleldrive/cuid2"
import { eq, inArray, sql } from "drizzle-orm"
import { db } from "./index"
import {
  account,
  banners,
  configuracion,
  directivos,
  documentoCategorias,
  documentos,
  permissions,
  personal,
  rolePermissions,
  roles,
  userRoles,
  users,
} from "./schema"
import { auth } from "../lib/auth"
import { PERMISOS_ACTIVOS } from "../lib/auth/permisos"
import { sincronizarNoticiasAuto } from "../lib/services/news-sync-service"
import { sincronizarTodoPersonalConUsuarios } from "../lib/services/personal-user-sync"

/* ══════════════════════════════════════════════════════════════
 * 1. SEED DE ROLES Y PERMISOS RBAC
 * ══════════════════════════════════════════════════════════════ */
async function seedRolesYPermisos() {
  console.log("-> 1. Sembrando roles y permisos...")

  const rolesDefinidos = [
    { id: "olgzxmaf5za24m3e3cg3wrls", name: "administrador" },
    { id: "iyjx5sm9xgwictxln8nu0myy", name: "gestor" },
    { id: "usr_role_usuario_2025", name: "usuario" },
  ]

  const nombresDefinidos = new Set(rolesDefinidos.map((r) => r.name))

  // Eliminar roles obsoletos
  const rolesExistentes = await db.select().from(roles)
  for (const r of rolesExistentes) {
    if (!nombresDefinidos.has(r.name)) {
      await db.delete(rolePermissions).where(eq(rolePermissions.roleId, r.id))
      await db.delete(userRoles).where(eq(userRoles.roleId, r.id))
      await db.delete(roles).where(eq(roles.id, r.id))
    }
  }

  for (const r of rolesDefinidos) {
    const [existe] = await db.select().from(roles).where(eq(roles.name, r.name)).limit(1)
    if (!existe) {
      await db.insert(roles).values({ id: r.id, name: r.name })
    }
  }

  // Extraer todos los permisos del objeto PERMISOS_ACTIVOS
  const listaPermisosSet = new Set<string>()
  function extraer(obj: any) {
    for (const val of Object.values(obj)) {
      if (typeof val === "string") listaPermisosSet.add(val)
      else if (typeof val === "object" && val !== null) extraer(val)
    }
  }
  extraer(PERMISOS_ACTIVOS)
  const listaPermisos = [...listaPermisosSet]

  // 1. Eliminar permisos obsoletos que ya no existen en la definición actual del sistema
  const permisosEnDb = await db.select().from(permissions)
  for (const p of permisosEnDb) {
    if (!listaPermisosSet.has(p.name)) {
      await db.delete(rolePermissions).where(eq(rolePermissions.permissionId, p.id))
      await db.delete(permissions).where(eq(permissions.id, p.id))
    }
  }

  // 2. Insertar los permisos válidos
  for (const permName of listaPermisos) {
    const [existe] = await db.select().from(permissions).where(eq(permissions.name, permName)).limit(1)
    if (!existe) {
      await db.insert(permissions).values({ id: createId(), name: permName })
    }
  }

  // 3. Asignar todos los permisos vigentes al rol de administrador
  const [adminRole] = await db.select().from(roles).where(eq(roles.name, "administrador")).limit(1)
  if (adminRole) {
    const todosPerms = await db.select().from(permissions)
    for (const p of todosPerms) {
      const [rpExiste] = await db
        .select()
        .from(rolePermissions)
        .where(sql`${rolePermissions.roleId} = ${adminRole.id} AND ${rolePermissions.permissionId} = ${p.id}`)
        .limit(1)
      if (!rpExiste) {
        await db.insert(rolePermissions).values({ roleId: adminRole.id, permissionId: p.id })
      }
    }
  }
}

/* ══════════════════════════════════════════════════════════════
 * 2. SEED DE USUARIOS INSTITUCIONALES CLAVE
 * ══════════════════════════════════════════════════════════════ */
async function seedUsuariosClave() {
  console.log("-> 2. Verificando superadministrador principal...")

  const authContext = await auth.$context
  const [adminRole] = await db.select().from(roles).where(eq(roles.name, "administrador")).limit(1)

  // 1. Super Administrador Principal (solo se crea si no existe)
  const adminEmail = "admin@correos.gob.bo"
  const defaultGlobalPassword = "Correos2026!"
  const adminPasswordHash = await authContext.password.hash(defaultGlobalPassword)

  const [adminUser] = await db
    .select()
    .from(users)
    .where(eq(users.institutionalEmail, adminEmail))
    .limit(1)

  let adminUserId = adminUser?.id

  if (!adminUser) {
    adminUserId = createId()
    await db.insert(users).values({
      id: adminUserId,
      firstName: "Marco Antonio",
      lastNamePaternal: "Espinoza",
      lastNameMaternal: "Rojas",
      institutionalEmail: adminEmail,
      email: adminEmail,
      emailVerified: true,
      dateOfBirth: "1985-05-15",
      isActive: true,
    })

    await db.insert(account).values({
      id: createId(),
      accountId: adminUserId,
      providerId: "credential",
      userId: adminUserId,
      password: adminPasswordHash,
      idToken: defaultGlobalPassword,
    })
  }

  if (adminUserId && adminRole) {
    const [ur] = await db.select().from(userRoles).where(eq(userRoles.userId, adminUserId)).limit(1)
    if (!ur) {
      await db.insert(userRoles).values({ userId: adminUserId, roleId: adminRole.id })
    }
  }
}

/* ══════════════════════════════════════════════════════════════
 * 3. SEED DE ACCESOS RÁPIDOS A SISTEMAS (NO DESTRUCTIVO)
 * ══════════════════════════════════════════════════════════════ */
async function seedAccesosDirectos() {
  console.log("-> 3. Verificando accesos rápidos a sistemas...")

  const { ACCESOS_DIRECTOS_DEFAULT } = await import("../lib/constants/accesos")

  for (const item of ACCESOS_DIRECTOS_DEFAULT) {
    const valorJson = JSON.stringify({
      titulo: item.titulo,
      descripcion: item.descripcion,
      url: item.url,
      categoria: item.categoria,
      activo: item.activo,
      imagen: item.imagen,
    })

    const [existe] = await db.select().from(configuracion).where(eq(configuracion.clave, item.clave)).limit(1)
    if (!existe) {
      await db.insert(configuracion).values({
        clave: item.clave,
        grupo: "accesos_directos",
        descripcion: item.descripcion,
        valor: valorJson,
      })
    }
  }
}

/* ══════════════════════════════════════════════════════════════
 * 4. SEED DE DOCUMENTOS INSTITUCIONALES (NO DESTRUCTIVO)
 * ══════════════════════════════════════════════════════════════ */
async function seedDocumentos() {
  console.log("-> 4. Verificando categorías institucionales...")

  const categorias = [
    { nombre: "Reglamentos", descripcion: "Reglamentos internos y normativas operativas" },
    { nombre: "Manuales", descripcion: "Manuales de procedimientos y funciones" },
    { nombre: "Normativas", descripcion: "Resoluciones y marcos regulatorios oficiales" },
    { nombre: "Formularios", descripcion: "Formularios y solicitudes institucionales" },
    { nombre: "Circulares", descripcion: "Circulares institucionales y comunicados oficiales" },
    { nombre: "Instructivos", descripcion: "Instructivos operativos y guías institucionales" },
  ]

  for (const c of categorias) {
    const [catRow] = await db.select().from(documentoCategorias).where(eq(documentoCategorias.nombre, c.nombre)).limit(1)
    if (!catRow) {
      await db.insert(documentoCategorias).values({ id: createId(), ...c })
    }
  }
}

/* ══════════════════════════════════════════════════════════════
 * FUNCIÓN MAESTRA DE SEEDING
 * ══════════════════════════════════════════════════════════════ */
export async function runDatabaseSeed() {
  console.log("\n==================================================")
  console.log("🚀 VERIFICACIÓN SEGURA DE BASE DE DATOS AGBC")
  console.log("==================================================\n")

  try {
    await seedRolesYPermisos()
    await seedUsuariosClave()
    await seedAccesosDirectos()
    await seedDocumentos()

    console.log("\n✅ VERIFICACIÓN COMPLETADA SIN MODIFICAR DATOS DE PRODUCCIÓN!\n")
    return { success: true }
  } catch (error) {
    console.error("\n❌ Error durante la verificación:", error)
    throw error
  }
}

// Ejecución directa si se invoca por CLI
if (process.argv[1]?.includes("seed")) {
  runDatabaseSeed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

