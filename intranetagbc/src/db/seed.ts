import "dotenv/config"
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
    { id: "cxvl1aqibg7bwar3e5s7va9i", name: "comunicador" },
    { id: "nrnnjehxcpo7uspteon0k0k9", name: "recursos humanos" },
    { id: "usr_role_usuario_2025", name: "usuario" },
  ]

  for (const r of rolesDefinidos) {
    const [existe] = await db.select().from(roles).where(eq(roles.name, r.name)).limit(1)
    if (!existe) {
      await db.insert(roles).values({ id: r.id, name: r.name })
    }
  }

  // Extraer todos los permisos del objeto PERMISOS
  const listaPermisos: string[] = []
  function extraer(obj: any) {
    for (const val of Object.values(obj)) {
      if (typeof val === "string") listaPermisos.push(val)
      else if (typeof val === "object" && val !== null) extraer(val)
    }
  }
  extraer(PERMISOS)

  for (const permName of listaPermisos) {
    const [existe] = await db.select().from(permissions).where(eq(permissions.name, permName)).limit(1)
    if (!existe) {
      await db.insert(permissions).values({ id: createId(), name: permName })
    }
  }

  // Asignar todos los permisos al rol de administrador
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
  const adminCi = "9976322"
  const adminPasswordHash = await authContext.password.hash(adminCi)

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
      nationalId: adminCi,
      dateOfBirth: "1985-05-15",
      isActive: true,
    })

    await db.insert(account).values({
      id: createId(),
      accountId: adminUserId,
      providerId: "credential",
      userId: adminUserId,
      password: adminPasswordHash,
      idToken: adminCi,
    })
  } else {
    await db.update(account).set({
      password: adminPasswordHash,
      idToken: adminCi,
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
 * 4. SEED DE DOCUMENTOS INSTITUCIONALES (12 DOCUMENTOS)
 * ══════════════════════════════════════════════════════════════ */
async function seedDocumentos() {
  console.log("-> 4. Sembrando 12 documentos institucionales...")

  const categorias = [
    { nombre: "Reglamentos", descripcion: "Reglamentos internos y normativas operativas" },
    { nombre: "Manuales", descripcion: "Manuales de procedimientos y funciones" },
    { nombre: "Normativas", descripcion: "Resoluciones y marcos regulatorios oficiales" },
    { nombre: "Formularios", descripcion: "Formularios y solicitudes institucionales" },
  ]

  const catMap: Record<string, string> = {}
  for (const c of categorias) {
    let [catRow] = await db.select().from(documentoCategorias).where(eq(documentoCategorias.nombre, c.nombre)).limit(1)
    if (!catRow) {
      ;[catRow] = await db.insert(documentoCategorias).values({ id: createId(), ...c }).returning()
    }
    catMap[c.nombre] = catRow.id
  }

  const docsBase = [
    {
      titulo: "Estatuto del Funcionario Postal AGBC",
      categoria: "Reglamentos",
      autor: "Dirección de Recursos Humanos",
      descripcion: "Marco legal sobre derechos, deberes e incompatibilidades del servidor público de Correos.",
      tamano: "2.4 MB",
      tipoArchivo: "PDF",
    },
    {
      titulo: "Reglamento Interno de Personal y Asistencia",
      categoria: "Reglamentos",
      autor: "Unidad de Talento Humano",
      descripcion: "Normas sobre control de asistencia, permisos, licencias y régimen disciplinario.",
      tamano: "1.8 MB",
      tipoArchivo: "PDF",
    },
    {
      titulo: "Código de Ética y Conducta Institucional",
      categoria: "Normativas",
      autor: "Unidad de Transparencia",
      descripcion: "Principios éticos, integridad pública y transparencia en el ejercicio del servicio postal.",
      tamano: "950 KB",
      tipoArchivo: "PDF",
    },
    {
      titulo: "Manual de Organización y Funciones (MOF 2026)",
      categoria: "Manuales",
      autor: "Planificación y Desarrollo",
      descripcion: "Estructura orgánica, atribuciones por gerencias y dependencias de la AGBC.",
      tamano: "4.1 MB",
      tipoArchivo: "PDF",
    },
    {
      titulo: "Manual de Procesos y Procedimientos (MAPRO Postal)",
      categoria: "Manuales",
      autor: "Gerencia de Operaciones",
      descripcion: "Flujogramas y protocolos estandarizados para el tratamiento de envíos y paquetería.",
      tamano: "3.7 MB",
      tipoArchivo: "PDF",
    },
    {
      titulo: "Tarifario Oficial Postal Nacional e Internacional",
      categoria: "Normativas",
      autor: "Gerencia Comercial",
      descripcion: "Tabla aprobada de tasas por peso, destino y tipo de correspondencia EMS y ordinaria.",
      tamano: "1.2 MB",
      tipoArchivo: "PDF",
    },
    {
      titulo: "Política de Seguridad de la Información y TIC",
      categoria: "Normativas",
      autor: "Gerencia de Sistemas",
      descripcion: "Políticas de contraseñas, uso de correos institucionales y custodia de bases de datos.",
      tamano: "880 KB",
      tipoArchivo: "PDF",
    },
    {
      titulo: "Guía de Atención y Trato al Usuario en Ventanilla",
      categoria: "Manuales",
      autor: "Atención al Cliente",
      descripcion: "Protocolos de excelencia en servicio, recepción y despacho de paquetes al público.",
      tamano: "1.5 MB",
      tipoArchivo: "PDF",
    },
    {
      titulo: "Reglamento de Manejo de Correspondencia SIGEC",
      categoria: "Reglamentos",
      autor: "Archivo Central",
      descripcion: "Directrices para el registro digital, seguimiento y archivo de cartas y notas oficiales.",
      tamano: "2.0 MB",
      tipoArchivo: "PDF",
    },
    {
      titulo: "Formulario de Solicitud de Licencia y Vacaciones",
      categoria: "Formularios",
      autor: "Recursos Humanos",
      descripcion: "Plantilla oficial editable para solicitud de permisos laborales y descansos anuales.",
      tamano: "450 KB",
      tipoArchivo: "PDF",
    },
    {
      titulo: "Manual de Envíos Express y Comercio Electrónico",
      categoria: "Manuales",
      autor: "Logística y Distribución",
      descripcion: "Guía operativa del servicio Delivery Express para tiendas online y pequeñas empresas.",
      tamano: "2.8 MB",
      tipoArchivo: "PDF",
    },
    {
      titulo: "Guía de Prevención y Reporte de Estafas Digitales",
      categoria: "Normativas",
      autor: "Unidad Jurídica y TI",
      descripcion: "Protocolo de denuncia y orientación contra páginas falsas en redes sociales.",
      tamano: "1.1 MB",
      tipoArchivo: "PDF",
    },
  ]

  for (const doc of docsBase) {
    const [existe] = await db.select().from(documentos).where(eq(documentos.titulo, doc.titulo)).limit(1)
    if (!existe) {
      await db.insert(documentos).values({
        id: createId(),
        titulo: doc.titulo,
        categoriaId: catMap[doc.categoria] || null,
        autor: doc.autor,
        descripcion: doc.descripcion,
        tamano: doc.tamano,
        tipoArchivo: doc.tipoArchivo,
        estado: "publicado",
        archivo: `/documentos/${doc.titulo.toLowerCase().replace(/[^a-z0-9]/g, "-")}.pdf`,
        nombreArchivo: `${doc.titulo}.pdf`,
      })
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
