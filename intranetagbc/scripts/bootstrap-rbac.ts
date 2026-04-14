import "dotenv/config"

import { asc, eq, sql } from "drizzle-orm"

import { db } from "../src/db"
import { permissions, rolePermissions, roles, userRoles, users } from "../src/db/schema"

const ROLE_ADMINISTRADOR = "administrador"
const ROLE_SUPER_ADMIN_LEGACY = "super_admin"

function buildDisplayName(user: {
  firstName: string
  lastNamePaternal: string
  lastNameMaternal: string | null
}): string {
  return [user.firstName, user.lastNamePaternal, user.lastNameMaternal]
    .map((value) => (value ?? "").trim())
    .filter((value) => value.length > 0)
    .join(" ")
}

async function getTargetUser() {
  const emailFromArg = process.argv[2]?.trim().toLowerCase()

  if (emailFromArg) {
    const [user] = await db
      .select({
        id: users.id,
        institutionalEmail: users.institutionalEmail,
        firstName: users.firstName,
        lastNamePaternal: users.lastNamePaternal,
        lastNameMaternal: users.lastNameMaternal,
      })
      .from(users)
      .where(
        sql`lower(${users.institutionalEmail}) = ${emailFromArg} or lower(${users.email}) = ${emailFromArg}`,
      )
      .limit(1)

    if (!user) {
      throw new Error(`No existe un usuario con email ${emailFromArg}.`)
    }

    return user
  }

  const [user] = await db
    .select({
      id: users.id,
      institutionalEmail: users.institutionalEmail,
      firstName: users.firstName,
      lastNamePaternal: users.lastNamePaternal,
      lastNameMaternal: users.lastNameMaternal,
    })
    .from(users)
    .orderBy(asc(users.createdAt))
    .limit(1)

  if (!user) {
    throw new Error("No hay usuarios registrados para asignar un rol.")
  }

  return user
}

async function ensureAdminRole() {
  return db.transaction(async (tx) => {
    const [adminRole] = await tx
      .select({
        id: roles.id,
        name: roles.name,
      })
      .from(roles)
      .where(eq(roles.name, ROLE_ADMINISTRADOR))
      .limit(1)

    const [legacyRole] = await tx
      .select({
        id: roles.id,
        name: roles.name,
      })
      .from(roles)
      .where(eq(roles.name, ROLE_SUPER_ADMIN_LEGACY))
      .limit(1)

    if (adminRole && legacyRole) {
      const legacyRoleUsers = await tx
        .select({
          userId: userRoles.userId,
        })
        .from(userRoles)
        .where(eq(userRoles.roleId, legacyRole.id))

      if (legacyRoleUsers.length > 0) {
        await tx
          .insert(userRoles)
          .values(
            legacyRoleUsers.map((row) => ({
              userId: row.userId,
              roleId: adminRole.id,
            })),
          )
          .onConflictDoNothing()
      }

      const legacyRolePermissions = await tx
        .select({
          permissionId: rolePermissions.permissionId,
        })
        .from(rolePermissions)
        .where(eq(rolePermissions.roleId, legacyRole.id))

      if (legacyRolePermissions.length > 0) {
        await tx
          .insert(rolePermissions)
          .values(
            legacyRolePermissions.map((row) => ({
              roleId: adminRole.id,
              permissionId: row.permissionId,
            })),
          )
          .onConflictDoNothing()
      }

      await tx.delete(roles).where(eq(roles.id, legacyRole.id))

      return adminRole
    }

    if (adminRole) {
      return adminRole
    }

    if (legacyRole) {
      const [renamedRole] = await tx
        .update(roles)
        .set({ name: ROLE_ADMINISTRADOR })
        .where(eq(roles.id, legacyRole.id))
        .returning({
          id: roles.id,
          name: roles.name,
        })

      if (!renamedRole) {
        throw new Error("No se pudo renombrar el rol super_admin a administrador.")
      }

      return renamedRole
    }

    const [newAdminRole] = await tx
      .insert(roles)
      .values({ name: ROLE_ADMINISTRADOR })
      .returning({
        id: roles.id,
        name: roles.name,
      })

    if (!newAdminRole) {
      throw new Error("No se pudo crear el rol administrador.")
    }

    return newAdminRole
  })
}

async function main() {
  const targetUser = await getTargetUser()
  const adminRole = await ensureAdminRole()

  const allPermissions = await db
    .select({
      id: permissions.id,
      name: permissions.name,
    })
    .from(permissions)

  if (allPermissions.length === 0) {
    throw new Error(
      "No hay permisos en la tabla permissions. Ejecuta primero: pnpm db:seed:permisos",
    )
  }

  await db
    .insert(rolePermissions)
    .values(
      allPermissions.map((permission) => ({
        roleId: adminRole.id,
        permissionId: permission.id,
      })),
    )
    .onConflictDoNothing()

  await db
    .insert(userRoles)
    .values({
      userId: targetUser.id,
      roleId: adminRole.id,
    })
    .onConflictDoNothing()

  const [rolePermissionCount] = await db
    .select({
      total: sql<number>`count(*)::int`,
    })
    .from(rolePermissions)
    .where(eq(rolePermissions.roleId, adminRole.id))

  console.log("RBAC inicializado correctamente.")
  console.log(
    `Usuario objetivo: ${buildDisplayName(targetUser)} <${targetUser.institutionalEmail}>`,
  )
  console.log(`Rol asignado: ${adminRole.name}`)
  console.log(`Permisos vinculados al rol: ${rolePermissionCount?.total ?? 0}`)
  console.log("Cierra sesion y vuelve a iniciar sesion para refrescar permisos en Better Auth.")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error en bootstrap RBAC:", error)
    process.exit(1)
  })
