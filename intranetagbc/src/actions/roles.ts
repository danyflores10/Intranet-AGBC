'use server';

import { and, asc, eq, inArray, ne, sql } from "drizzle-orm";

import { db } from "@/db";
import { permissions, rolePermissions, roles } from "@/db/schema";
import { PERMISOS } from "@/lib/auth/permisos";
import { obtenerSesionConAccesoActual, type SesionConAcceso } from "@/lib/auth/session-access";
import { registrarAuditLog } from "@/actions/auditoria";

type ResultadoAccion<TData> = {
  success: boolean;
  message: string;
  data: TData | null;
};

type PermissionDTO = {
  id: string;
  name: string;
};

type RoleDTO = {
  id: string;
  name: string;
  permissions: PermissionDTO[];
  createdAt: string;
  updatedAt: string;
};

type DeletedRoleDTO = {
  id: string;
  name: string;
};

export type CreateRoleInput = {
  name: string;
  permissionIds?: string[];
};

export type UpdateRoleInput = {
  name?: string;
  permissionIds?: string[];
};

type RolFila = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

type QueryRunner = Pick<typeof db, "select" | "insert" | "update" | "delete">;

const ROL_ADMINISTRADOR = "administrador";
const ROL_SUPER_ADMIN_LEGADO = "super_admin";

function respuestaExitosa<TData>(message: string, data: TData): ResultadoAccion<TData> {
  return {
    success: true,
    message,
    data,
  };
}

function respuestaError<TData>(message: string): ResultadoAccion<TData> {
  return {
    success: false,
    message,
    data: null,
  };
}

function obtenerMensajeDeError(error: unknown, fallback = "Ocurrió un error inesperado."): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}

function normalizarTexto(value: string): string {
  return value.trim().toLowerCase();
}

function getLegacyPermissionAlias(permission: string): string | null {
  const normalizado = normalizarTexto(permission);
  const tokens = normalizado.split(/\s+/).filter(Boolean);

  if (tokens.length < 2) {
    return null;
  }

  const [action, ...resourceTokens] = tokens;
  const resource = resourceTokens.join("_");

  if (resource.length === 0) {
    return null;
  }

  return `${resource}.${action}`;
}

function cleanName(name: string | undefined): string {
  if (typeof name !== "string") {
    return "";
  }

  return name.trim();
}

function limpiarPermissionIds(permissionIds: string[] | undefined): string[] {
  if (!permissionIds) {
    return [];
  }

  const limpios = permissionIds
    .map((permissionId) => permissionId.trim())
    .filter((permissionId) => permissionId.length > 0);

  return [...new Set(limpios)];
}

function mapRoleDTO(role: RolFila, permissionsByRole: PermissionDTO[]): RoleDTO {
  return {
    id: role.id,
    name: role.name,
    permissions: permissionsByRole,
    createdAt: role.createdAt.toISOString(),
    updatedAt: role.updatedAt.toISOString(),
  };
}

function esErrorDeNombreDuplicado(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const errorConCodigo = error as { code?: unknown; message?: unknown };
  const code = typeof errorConCodigo.code === "string" ? errorConCodigo.code : "";
  const message =
    typeof errorConCodigo.message === "string"
      ? errorConCodigo.message.toLowerCase()
      : "";

  return code === "23505" || message.includes("roles_name_unique");
}

function esRolAdministrador(roleName: string): boolean {
  const normalizado = normalizarTexto(roleName);
  return normalizado === ROL_ADMINISTRADOR;
}

function esRolSuperAdmin(roleName: string): boolean {
  const normalizado = normalizarTexto(roleName);
  return normalizado === ROL_SUPER_ADMIN_LEGADO;
}

function tieneRolSuperAdmin(session: SesionConAcceso): boolean {
  return session.roles.some((rol) => esRolSuperAdmin(rol));
}

function tienePermiso(session: SesionConAcceso, permiso: string): boolean {
  const permisoNormalizado = normalizarTexto(permiso);
  const legacyAlias = getLegacyPermissionAlias(permisoNormalizado);

  return session.permissions.some(
    (permisoUsuario) => {
      const normalizedPermission = normalizarTexto(permisoUsuario);
      return (
        normalizedPermission === permisoNormalizado ||
        (legacyAlias !== null && normalizedPermission === legacyAlias)
      );
    },
  );
}

async function requerirSesionAutenticada(): Promise<SesionConAcceso> {
  const session = await obtenerSesionConAccesoActual();

  if (!session) {
    throw new Error("No autenticado.");
  }

  return session;
}

async function autorizarAccion(permisoRequerido: string): Promise<SesionConAcceso> {
  const session = await requerirSesionAutenticada();

  if (tieneRolSuperAdmin(session)) {
    return session;
  }

  if (!tienePermiso(session, permisoRequerido)) {
    throw new Error("No tienes permisos para realizar esta acción.");
  }

  return session;
}

async function findRoleById(roleId: string, runner: QueryRunner = db): Promise<RolFila | null> {
  const [rol] = await runner
    .select({
      id: roles.id,
      name: roles.name,
      createdAt: roles.createdAt,
      updatedAt: roles.updatedAt,
    })
    .from(roles)
    .where(eq(roles.id, roleId))
    .limit(1);

  return rol ?? null;
}

async function findRoleByName(
  roleName: string,
  options?: {
    excludeRoleId?: string;
    runner?: QueryRunner;
  },
): Promise<RolFila | null> {
  const runner = options?.runner ?? db;
  const roleNameNormalizado = normalizarTexto(roleName);

  const condicionNombre = sql`lower(${roles.name}) = ${roleNameNormalizado}`;
  const condicionFinal = options?.excludeRoleId
    ? and(condicionNombre, ne(roles.id, options.excludeRoleId))
    : condicionNombre;

  const [rol] = await runner
    .select({
      id: roles.id,
      name: roles.name,
      createdAt: roles.createdAt,
      updatedAt: roles.updatedAt,
    })
    .from(roles)
    .where(condicionFinal)
    .limit(1);

  return rol ?? null;
}

async function findPermissionsByRoleId(
  roleId: string,
  runner: QueryRunner = db,
): Promise<PermissionDTO[]> {
  const permisos = await runner
    .select({
      id: permissions.id,
      name: permissions.name,
    })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(eq(rolePermissions.roleId, roleId))
    .orderBy(asc(permissions.name));

  return permisos;
}

async function findMissingPermissionIds(
  permissionIds: string[],
  runner: QueryRunner = db,
): Promise<string[]> {
  const unicos = [...new Set(permissionIds)];

  if (unicos.length === 0) {
    return [];
  }

  const permisosExistentes = await runner
    .select({
      id: permissions.id,
    })
    .from(permissions)
    .where(inArray(permissions.id, unicos));

  const existentesSet = new Set(permisosExistentes.map((permiso) => permiso.id));

  return unicos.filter((permissionId) => !existentesSet.has(permissionId));
}

async function replacePermissions(
  runner: QueryRunner,
  roleId: string,
  permissionIds: string[],
): Promise<void> {
  const unicos = [...new Set(permissionIds)];

  await runner.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));

  if (unicos.length === 0) {
    return;
  }

  await runner
    .insert(rolePermissions)
    .values(unicos.map((permissionId) => ({ roleId, permissionId })));
}

export async function obtenerRoles(): Promise<ResultadoAccion<RoleDTO[]>> {
  try {
    await requerirSesionAutenticada();

    const rolesEncontrados = await db
      .select({
        id: roles.id,
        name: roles.name,
        createdAt: roles.createdAt,
        updatedAt: roles.updatedAt,
      })
      .from(roles)
      .orderBy(asc(roles.name));

    const data = await Promise.all(
      rolesEncontrados.map(async (rol) => {
        const permisos = await findPermissionsByRoleId(rol.id);
        return mapRoleDTO(rol, permisos);
      }),
    );

    return respuestaExitosa("Roles obtenidos correctamente.", data);
  } catch (error) {
    return respuestaError<RoleDTO[]>(
      obtenerMensajeDeError(error, "No fue posible obtener los roles."),
    );
  }
}

export async function obtenerPermisosDisponibles(): Promise<ResultadoAccion<PermissionDTO[]>> {
  try {
    await requerirSesionAutenticada();

    const permisos = await db
      .select({
        id: permissions.id,
        name: permissions.name,
      })
      .from(permissions)
      .orderBy(asc(permissions.name));

    return respuestaExitosa("Permisos obtenidos correctamente.", permisos);
  } catch (error) {
    return respuestaError<PermissionDTO[]>(
      obtenerMensajeDeError(error, "No fue posible obtener los permisos."),
    );
  }
}

export async function obtenerRolPorId(
  roleId: string,
): Promise<ResultadoAccion<RoleDTO>> {
  try {
    await requerirSesionAutenticada();

    const roleIdLimpio = roleId.trim();

    if (roleIdLimpio.length === 0) {
      return respuestaError("El identificador del rol es obligatorio.");
    }

    const rol = await findRoleById(roleIdLimpio);

    if (!rol) {
      return respuestaError("El rol no existe.");
    }

    const permisos = await findPermissionsByRoleId(rol.id);

    return respuestaExitosa("Rol obtenido correctamente.", mapRoleDTO(rol, permisos));
  } catch (error) {
    return respuestaError<RoleDTO>(
      obtenerMensajeDeError(error, "No fue posible obtener el rol."),
    );
  }
}

export async function crearRol(
  data: CreateRoleInput,
): Promise<ResultadoAccion<RoleDTO>> {
  try {
    await autorizarAccion(PERMISOS.ROLES.CREAR);

    const name = cleanName(data.name);

    if (name.length === 0) {
      return respuestaError("El nombre del rol es obligatorio.");
    }

    const rolDuplicado = await findRoleByName(name);

    if (rolDuplicado) {
      return respuestaError("Ya existe un rol con ese nombre.");
    }

    const permissionIdsLimpios = limpiarPermissionIds(data.permissionIds);
    const permissionIdsFaltantes = await findMissingPermissionIds(permissionIdsLimpios);

    if (permissionIdsFaltantes.length > 0) {
      return respuestaError("Uno o más permisos enviados no existen.");
    }

    const rolCreado = await db.transaction(async (tx) => {
      const [nuevoRol] = await tx
        .insert(roles)
        .values({
          name,
        })
        .returning({
          id: roles.id,
          name: roles.name,
          createdAt: roles.createdAt,
          updatedAt: roles.updatedAt,
        });

      if (!nuevoRol) {
        throw new Error("No fue posible crear el rol.");
      }

      await replacePermissions(tx, nuevoRol.id, permissionIdsLimpios);

      const permisos = await findPermissionsByRoleId(nuevoRol.id, tx);

      return mapRoleDTO(nuevoRol, permisos);
    });

    await registrarAuditLog({
      usuario: (await obtenerSesionConAccesoActual())?.id ?? "sistema",
      accion: `Creó rol: ${rolCreado.name}`,
      modulo: "Roles",
      resultado: "Exitoso",
    });

    return respuestaExitosa("Rol creado correctamente.", rolCreado);
  } catch (error) {
    if (esErrorDeNombreDuplicado(error)) {
      return respuestaError("Ya existe un rol con ese nombre.");
    }

    return respuestaError<RoleDTO>(
      obtenerMensajeDeError(error, "No fue posible crear el rol."),
    );
  }
}

export async function editarRol(
  roleId: string,
  data: UpdateRoleInput,
): Promise<ResultadoAccion<RoleDTO>> {
  try {
    await autorizarAccion(PERMISOS.ROLES.EDITAR);

    const roleIdLimpio = roleId.trim();

    if (roleIdLimpio.length === 0) {
      return respuestaError("El identificador del rol es obligatorio.");
    }

    const rolActual = await findRoleById(roleIdLimpio);

    if (!rolActual) {
      return respuestaError("El rol no existe.");
    }

    const nameInput = data.name;
    const cleanNameInput = cleanName(nameInput);
    const hasNameInput = typeof nameInput !== "undefined";
    const seEnvioPermisos = Array.isArray(data.permissionIds);

    if (hasNameInput && cleanNameInput.length === 0) {
      return respuestaError("El nombre del rol es obligatorio.");
    }

    const finalName = hasNameInput ? cleanNameInput : rolActual.name;
    const hasNameChange = normalizarTexto(finalName) !== normalizarTexto(rolActual.name);
    const permissionIdsLimpios = limpiarPermissionIds(data.permissionIds);

    if (hasNameChange) {
      const rolDuplicado = await findRoleByName(finalName, {
        excludeRoleId: roleIdLimpio,
      });

      if (rolDuplicado) {
        return respuestaError("Ya existe un rol con ese nombre.");
      }
    }

    if (seEnvioPermisos) {
      const permissionIdsFaltantes = await findMissingPermissionIds(permissionIdsLimpios);

      if (permissionIdsFaltantes.length > 0) {
        return respuestaError("Uno o más permisos enviados no existen.");
      }
    }

    const rolActualizado = await db.transaction(async (tx) => {
      let rolTx = rolActual;

      if (hasNameChange) {
        const [rolEditado] = await tx
          .update(roles)
          .set({
            name: finalName,
          })
          .where(eq(roles.id, roleIdLimpio))
          .returning({
            id: roles.id,
            name: roles.name,
            createdAt: roles.createdAt,
            updatedAt: roles.updatedAt,
          });

        if (!rolEditado) {
          throw new Error("No fue posible actualizar el rol.");
        }

        rolTx = rolEditado;
      }

      if (seEnvioPermisos) {
        await replacePermissions(tx, roleIdLimpio, permissionIdsLimpios);

        const [rolConTimestampActualizado] = await tx
          .update(roles)
          .set({
            updatedAt: new Date(),
          })
          .where(eq(roles.id, roleIdLimpio))
          .returning({
            id: roles.id,
            name: roles.name,
            createdAt: roles.createdAt,
            updatedAt: roles.updatedAt,
          });

        if (rolConTimestampActualizado) {
          rolTx = rolConTimestampActualizado;
        }
      }

      const permisos = await findPermissionsByRoleId(roleIdLimpio, tx);

      return mapRoleDTO(rolTx, permisos);
    });

    await registrarAuditLog({
      usuario: (await obtenerSesionConAccesoActual())?.id ?? "sistema",
      accion: `Editó rol: ${rolActualizado.name}`,
      modulo: "Roles",
      resultado: "Exitoso",
    });

    return respuestaExitosa("Rol actualizado correctamente.", rolActualizado);
  } catch (error) {
    if (esErrorDeNombreDuplicado(error)) {
      return respuestaError("Ya existe un rol con ese nombre.");
    }

    return respuestaError<RoleDTO>(
      obtenerMensajeDeError(error, "No fue posible editar el rol."),
    );
  }
}

export async function eliminarRol(
  roleId: string,
): Promise<ResultadoAccion<DeletedRoleDTO>> {
  try {
    await autorizarAccion(PERMISOS.ROLES.ELIMINAR);

    const roleIdLimpio = roleId.trim();

    if (roleIdLimpio.length === 0) {
      return respuestaError("El identificador del rol es obligatorio.");
    }

    const rol = await findRoleById(roleIdLimpio);

    if (!rol) {
      return respuestaError("El rol no existe.");
    }

    if (esRolAdministrador(rol.name) || esRolSuperAdmin(rol.name)) {
      return respuestaError("No se puede eliminar un rol reservado del sistema.");
    }

    const rolEliminado = await db.transaction(async (tx) => {
      const [eliminado] = await tx
        .delete(roles)
        .where(eq(roles.id, roleIdLimpio))
        .returning({
          id: roles.id,
          name: roles.name,
        });

      if (!eliminado) {
        throw new Error("No fue posible eliminar el rol.");
      }

      return eliminado;
    });

    await registrarAuditLog({
      usuario: (await obtenerSesionConAccesoActual())?.id ?? "sistema",
      accion: `Eliminó rol: ${rolEliminado.name}`,
      modulo: "Roles",
      resultado: "Exitoso",
    });

    return respuestaExitosa("Rol eliminado correctamente.", rolEliminado);
  } catch (error) {
    return respuestaError<DeletedRoleDTO>(
      obtenerMensajeDeError(error, "No fue posible eliminar el rol."),
    );
  }
}

export async function reemplazarPermisosDeRol(
  roleId: string,
  permissionIds: string[],
): Promise<ResultadoAccion<RoleDTO>> {
  try {
    await autorizarAccion(PERMISOS.ROLES.EDITAR);

    const roleIdLimpio = roleId.trim();

    if (roleIdLimpio.length === 0) {
      return respuestaError("El identificador del rol es obligatorio.");
    }

    const rol = await findRoleById(roleIdLimpio);

    if (!rol) {
      return respuestaError("El rol no existe.");
    }

    const permissionIdsLimpios = limpiarPermissionIds(permissionIds);
    const permissionIdsFaltantes = await findMissingPermissionIds(permissionIdsLimpios);

    if (permissionIdsFaltantes.length > 0) {
      return respuestaError("Uno o más permisos enviados no existen.");
    }

    const rolActualizado = await db.transaction(async (tx) => {
      await replacePermissions(tx, roleIdLimpio, permissionIdsLimpios);

      await tx
        .update(roles)
        .set({
          updatedAt: new Date(),
        })
        .where(eq(roles.id, roleIdLimpio));

      const permisos = await findPermissionsByRoleId(roleIdLimpio, tx);
      const rolTx = await findRoleById(roleIdLimpio, tx);

      if (!rolTx) {
        throw new Error("No fue posible encontrar el rol después de actualizar permisos.");
      }

      return mapRoleDTO(rolTx, permisos);
    });

    return respuestaExitosa("Permisos del rol actualizados correctamente.", rolActualizado);
  } catch (error) {
    return respuestaError<RoleDTO>(
      obtenerMensajeDeError(error, "No fue posible actualizar los permisos del rol."),
    );
  }
}

