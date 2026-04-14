export type UsuarioRbac = {
  id: string
  name: string
  email: string
  image?: string | null
  roles: string[]
  permissions: string[]
}

export type ReglaAcceso =
  | {
    roles?: string[]
    permissions?: string[]
  }
  | undefined

export type ContextoAcceso = {
  isAdmin: boolean
  anyRoles: (roles: string[]) => boolean
  anyPermissions: (permissions: string[]) => boolean
}

const SUPER_ADMIN_ROLE = "super_admin"

function normalizarAcceso(value: string): string {
  return value.trim().toLowerCase()
}

function legacyPermissionAlias(permission: string): string | null {
  const tokens = permission.split(/\s+/).filter(Boolean)

  if (tokens.length < 2) {
    return null
  }

  const [action, ...resourceTokens] = tokens
  const resource = resourceTokens.join("_")

  if (resource.length === 0) {
    return null
  }

  return `${resource}.${action}`
}

function crearSetNormalizado(values: string[] = []): Set<string> {
  return new Set(
    values
      .map(normalizarAcceso)
      .filter((value) => value.length > 0),
  )
}

export function crearContextoAcceso(usuario: UsuarioRbac): ContextoAcceso {
  const roleSet = crearSetNormalizado(usuario.roles)
  const permissionSet = crearSetNormalizado(usuario.permissions)
  const isAdmin = roleSet.has(SUPER_ADMIN_ROLE)

  return {
    isAdmin,
    anyRoles: (roles: string[]) => roles.some((role) => roleSet.has(normalizarAcceso(role))),
    anyPermissions: (permissions: string[]) => permissions.some((permission) => {
      const normalizedPermission = normalizarAcceso(permission)
      const alias = legacyPermissionAlias(normalizedPermission)

      return (
        permissionSet.has(normalizedPermission)
        || (alias !== null && permissionSet.has(alias))
      )
    }),
  }
}

export function puedeAcceder(regla: ReglaAcceso, contexto: ContextoAcceso): boolean {
  if (contexto.isAdmin) {
    return true
  }

  if (!regla) {
    return true
  }

  const roles = regla.roles ?? []
  const permisos = regla.permissions ?? []

  if (roles.length === 0 && permisos.length === 0) {
    return true
  }

  const roleOk = roles.length > 0 ? contexto.anyRoles(roles) : false
  const permisoOk = permisos.length > 0 ? contexto.anyPermissions(permisos) : false

  return roleOk || permisoOk
}

export function puedeAccederUsuario(usuario: UsuarioRbac, regla: ReglaAcceso): boolean {
  return puedeAcceder(regla, crearContextoAcceso(usuario))
}
