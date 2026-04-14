import "dotenv/config"

import { asc, eq } from "drizzle-orm"

import { db } from "../src/db"
import { permissions, rolePermissions } from "../src/db/schema"
import { PERMISOS } from "../src/lib/auth/permisos"

const LEGACY_PERMISSION_MAP: Array<{ from: string; to: string }> = [
  { from: "roles.ver", to: "ver roles" },
  { from: "roles.crear", to: "crear roles" },
  { from: "roles.editar", to: "editar roles" },
  { from: "roles.eliminar", to: "eliminar roles" },
  { from: "usuarios.ver", to: "ver usuarios" },
  { from: "usuarios.crear", to: "crear usuarios" },
  { from: "usuarios.editar", to: "editar usuarios" },
  { from: "usuarios.eliminar", to: "eliminar usuarios" },
  { from: "auditoria.ver", to: "ver auditoria" },
  { from: "tramites.ver", to: "ver tramites" },
  { from: "tramites.crear", to: "crear tramites" },
  { from: "tramites.editar", to: "editar tramites" },
  { from: "tramites.eliminar", to: "eliminar tramites" },
  { from: "logistica.ver", to: "ver logistica" },
  { from: "logistica.crear", to: "crear logistica" },
  { from: "logistica.editar", to: "editar logistica" },
  { from: "logistica.eliminar", to: "eliminar logistica" },
]

function extraerPermisos(value: unknown): string[] {
  if (!value || typeof value !== "object") {
    return []
  }

  const resultado = new Set<string>()

  function recorrer(actual: unknown) {
    if (!actual || typeof actual !== "object") {
      return
    }

    for (const nested of Object.values(actual)) {
      if (typeof nested === "string") {
        const permiso = nested.trim()
        if (permiso.length > 0) {
          resultado.add(permiso)
        }
      } else if (nested && typeof nested === "object") {
        recorrer(nested)
      }
    }
  }

  recorrer(value)

  return [...resultado]
}

async function migrateLegacyPermissions() {
  for (const item of LEGACY_PERMISSION_MAP) {
    const [legacyPermission] = await db
      .select({
        id: permissions.id,
        name: permissions.name,
      })
      .from(permissions)
      .where(eq(permissions.name, item.from))
      .limit(1)

    if (!legacyPermission) {
      continue
    }

    const [newPermission] = await db
      .select({
        id: permissions.id,
        name: permissions.name,
      })
      .from(permissions)
      .where(eq(permissions.name, item.to))
      .limit(1)

    if (!newPermission) {
      await db
        .update(permissions)
        .set({ name: item.to })
        .where(eq(permissions.id, legacyPermission.id))

      continue
    }

    const rolesWithLegacyPermission = await db
      .select({
        roleId: rolePermissions.roleId,
      })
      .from(rolePermissions)
      .where(eq(rolePermissions.permissionId, legacyPermission.id))

    if (rolesWithLegacyPermission.length > 0) {
      await db
        .insert(rolePermissions)
        .values(
          rolesWithLegacyPermission.map((row) => ({
            roleId: row.roleId,
            permissionId: newPermission.id,
          })),
        )
        .onConflictDoNothing()
    }

    await db.delete(permissions).where(eq(permissions.id, legacyPermission.id))
  }
}

async function main() {
  await migrateLegacyPermissions()

  const permisosBase = extraerPermisos(PERMISOS)

  if (permisosBase.length === 0) {
    console.log("No se encontraron permisos para registrar.")
    return
  }

  await db
    .insert(permissions)
    .values(permisosBase.map((name) => ({ name })))
    .onConflictDoNothing({ target: permissions.name })

  const permisosRegistrados = await db
    .select({
      id: permissions.id,
      name: permissions.name,
    })
    .from(permissions)
    .orderBy(asc(permissions.name))

  console.log(`Permisos registrados en base de datos: ${permisosRegistrados.length}`)
  console.table(permisosRegistrados)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error al registrar permisos:", error)
    process.exit(1)
  })

