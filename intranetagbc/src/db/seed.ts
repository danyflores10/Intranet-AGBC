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
import { PERMISOS } from "../lib/auth/permisos"
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

  // Extraer todos los permisos del objeto PERMISOS
  const listaPermisosSet = new Set<string>()
  function extraer(obj: any) {
    for (const val of Object.values(obj)) {
      if (typeof val === "string") listaPermisosSet.add(val)
      else if (typeof val === "object" && val !== null) extraer(val)
    }
  }
  extraer(PERMISOS)
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
  console.log("-> 2. Sembrando usuarios y directivos clave...")

  const authContext = await auth.$context
  const [adminRole] = await db.select().from(roles).where(eq(roles.name, "administrador")).limit(1)

  // 1. Super Administrador Principal
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
  } else {
    await db.update(account).set({
      password: adminPasswordHash,
      idToken: defaultGlobalPassword,
    }).where(eq(account.userId, adminUserId!))
  }

  if (adminUserId && adminRole) {
    const [ur] = await db.select().from(userRoles).where(eq(userRoles.userId, adminUserId)).limit(1)
    if (!ur) {
      await db.insert(userRoles).values({ userId: adminUserId, roleId: adminRole.id })
    } else {
      await db.update(userRoles).set({ roleId: adminRole.id }).where(eq(userRoles.userId, adminUserId))
    }
  }

  // 2. Directivos Institucionales
  const directivosBase = [
    {
      nombre: "Lic. Abel",
      cargo: "Gerente General",
      unidad: "Dirección General Ejecutiva",
      email: "abel@correos.gob.bo",
      telefono: "69818241",
      orden: 1,
    },
    {
      nombre: "Marco Antonio Espinoza Rojas",
      cargo: "Gerente de Sistemas y TIC",
      unidad: "Tecnología de la Información",
      email: "marco.espinoza@correos.gob.bo",
      telefono: "7855415",
      orden: 2,
    },
    {
      nombre: "Leo",
      cargo: "Subgerente de Sistemas",
      unidad: "TI - TICS",
      email: "leo@correos.gob.bo",
      telefono: "69914145",
      orden: 3,
    },
    {
      nombre: "Ivan",
      cargo: "Gerente Nacional de Operaciones",
      unidad: "Eje Nacional",
      email: "ivan@correos.gob.bo",
      telefono: "6321588",
      orden: 4,
    },
  ]

  for (const d of directivosBase) {
    const [existe] = await db.select().from(directivos).where(eq(directivos.email, d.email)).limit(1)
    if (!existe) {
      await db.insert(directivos).values({ id: createId(), ...d, estado: "activo" })
    }
  }
}

/* ══════════════════════════════════════════════════════════════
 * 3. SEED DE ACCESOS RÁPIDOS A SISTEMAS (18 SISTEMAS)
 * ══════════════════════════════════════════════════════════════ */
async function seedAccesosDirectos() {
  console.log("-> 3. Sembrando 18 accesos rápidos a sistemas categorizados...")

  const { ACCESOS_DIRECTOS_DEFAULT } = await import("../lib/constants/accesos")
  const clavesValidas = ACCESOS_DIRECTOS_DEFAULT.map((a) => a.clave)

  // Eliminar sistemas antiguos o huérfanos que no pertenezcan a los 18 oficiales del PDF
  const todosAccesos = await db.select().from(configuracion).where(eq(configuracion.grupo, "accesos_directos"))
  for (const acc of todosAccesos) {
    if (!clavesValidas.includes(acc.clave)) {
      await db.delete(configuracion).where(eq(configuracion.clave, acc.clave))
    }
  }

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
    } else {
      await db.update(configuracion).set({
        valor: valorJson,
        descripcion: item.descripcion,
        updatedAt: new Date(),
      }).where(eq(configuracion.clave, item.clave))
    }
  }
}

/* ══════════════════════════════════════════════════════════════
 * 4. SEED DE DOCUMENTOS INSTITUCIONALES (CATEGORÍAS Y LIMPIEZA)
 * ══════════════════════════════════════════════════════════════ */
async function seedDocumentos() {
  console.log("-> 4. Verificando categorías y documentos institucionales...")

  const categorias = [
    { nombre: "Reglamentos", descripcion: "Reglamentos internos y normativas operativas" },
    { nombre: "Manuales", descripcion: "Manuales de procedimientos y funciones" },
    { nombre: "Normativas", descripcion: "Resoluciones y marcos regulatorios oficiales" },
    { nombre: "Formularios", descripcion: "Formularios y solicitudes institucionales" },
    { nombre: "Circulares", descripcion: "Circulares institucionales y comunicados oficiales" },
    { nombre: "Instructivos", descripcion: "Instructivos operativos y guías institucionales" },
  ]

  const catMap: Record<string, string> = {}
  for (const c of categorias) {
    let [catRow] = await db.select().from(documentoCategorias).where(eq(documentoCategorias.nombre, c.nombre)).limit(1)
    if (!catRow) {
      ;[catRow] = await db.insert(documentoCategorias).values({ id: createId(), ...c }).returning()
    }
    catMap[c.nombre] = catRow.id
  }

  // Eliminar documentos huérfanos sin archivo físico en disco
  const allDocs = await db.select().from(documentos)
  for (const doc of allDocs) {
    if (doc.archivo) {
      const rel = doc.archivo.replace(/^\//, "")
      const physicalPath = path.join(process.cwd(), "public", rel)
      if (!fs.existsSync(physicalPath)) {
        await db.delete(documentos).where(eq(documentos.id, doc.id))
        console.log(`   [LIMPIEZA] Eliminado documento sin archivo físico: ${doc.titulo}`)
      }
    }
  }

  // Sincronizar los 89 documentos institucionales si la BD está vacía o incompleta
  const docsDir = path.join(process.cwd(), "public", "documentos")
  if (fs.existsSync(docsDir)) {
    const files = fs.readdirSync(docsDir).filter((f) => f.startsWith("doc_"))
    for (const file of files) {
      const url = `/documentos/${file}`
      const [existe] = await db.select().from(documentos).where(eq(documentos.archivo, url)).limit(1)
      if (!existe) {
        const filePath = path.join(docsDir, file)
        const stat = fs.statSync(filePath)
        const ext = file.split(".").pop()?.toLowerCase() || "pdf"
        
        let title = file.replace(/^doc_\d+_/i, "").replace(/\.[^/.]+$/, "").replace(/_/g, " ")
        title = title.replace(/\b\w/g, (l) => l.toUpperCase())
        title = title.replace(/\b(Agbc|Sigec|Sireco|Gescon|Senca|Felcn|Sigep|Mof|Mapro|Re-Sap|Re-Sabs|Re-Soa|Sap|Sabs|Soa|Ra|Cn-08)\b/gi, (m) => m.toUpperCase())

        let cat = "Normativas"
        const upper = file.toUpperCase()
        if (upper.includes("REGLAMENTO")) cat = "Reglamentos"
        else if (upper.includes("MANUAL") || upper.includes("PROCEDIMIENTO") || upper.includes("GUIA")) cat = "Manuales"
        else if (upper.includes("INSTRUCTIVO")) cat = "Instructivos"
        else if (upper.includes("FORMULARIO") || upper.includes("FICHA") || upper.includes("KARDEX") || upper.includes("ACTA") || upper.includes("RECIBO") || upper.includes("MATRIZ") || upper.includes("NOTIFICACION") || upper.includes("REPORTE")) cat = "Formularios"
        else if (upper.includes("CIRCULAR")) cat = "Circulares"

        function formatSize(bytes: number) {
          if (bytes < 1024) return `${bytes} B`
          if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
          return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
        }

        await db.insert(documentos).values({
          id: createId(),
          titulo: title,
          categoriaId: catMap[cat] || catMap["Normativas"],
          autor: "AGBC Institucional",
          estado: "publicado",
          archivo: url,
          nombreArchivo: file,
          tipoArchivo: ext,
          tamano: formatSize(stat.size),
          descripcion: file,
        })
      }
    }
  }
}

/* ══════════════════════════════════════════════════════════════
 * FUNCIÓN MAESTRA DE SEEDING
 * ══════════════════════════════════════════════════════════════ */
export async function runDatabaseSeed() {
  console.log("\n==================================================")
  console.log("🚀 EJECUTANDO SEEDER MAESTRO DE LA INTRANET AGBC")
  console.log("==================================================\n")

  try {
    await seedRolesYPermisos()
    await seedUsuariosClave()
    await seedAccesosDirectos()
    await seedDocumentos()

    console.log("-> 5. Sincronizando 24 noticias (Prensa + Facebook)...")
    await sincronizarNoticiasAuto(true)

    console.log("-> 6. Sincronizando personal con cuentas de usuario y contraseñas...")
    await sincronizarTodoPersonalConUsuarios()

    console.log("-> 7. Estableciendo contraseña institucional 'Correos2026!' a todas las cuentas...")
    const authContext = await auth.$context
    const defaultGlobalHash = await authContext.password.hash("Correos2026!")
    await db.update(account).set({
      password: defaultGlobalHash,
      idToken: "Correos2026!",
      updatedAt: new Date(),
    })

    console.log("\n✅ SEEDING Y SINCRONIZACIÓN COMPLETADOS EXITOSAMENTE!\n")
    return { success: true }
  } catch (error) {
    console.error("\n❌ Error durante la ejecución del seeder:", error)
    throw error
  }
}

// Ejecución directa si se invoca por CLI
if (process.argv[1]?.includes("seed")) {
  runDatabaseSeed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}
