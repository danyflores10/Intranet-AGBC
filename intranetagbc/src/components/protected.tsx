import type { ReactNode } from "react"

import { puedeAccederUsuario, type ReglaAcceso, type UsuarioRbac } from "@/lib/rbac"

type ProtectedProps = {
  usuario: UsuarioRbac
  access?: ReglaAcceso
  fallback?: ReactNode
  children: ReactNode
}

/**
 * Componente Protected para Server Components.
 * Controla la visibilidad de contenido basado en roles y permisos del usuario.
 *
 * @example
 * // Solo mostrar si tiene el permiso
 * <Protected usuario={user} access={{ permissions: ["ver usuarios"] }}>
 *   <UsersTable />
 * </Protected>
 *
 * @example
 * // Solo mostrar si es administrador
 * <Protected usuario={user} access={{ roles: ["administrador"] }}>
 *   <AdminPanel />
 * </Protected>
 *
 * @example
 * // Mostrar un fallback si no tiene acceso
 * <Protected
 *   usuario={user}
 *   access={{ permissions: ["editar usuarios"] }}
 *   fallback={<p>No tienes permisos para editar</p>}
 * >
 *   <UserForm />
 * </Protected>
 */
export function Protected({
  usuario,
  access,
  fallback = null,
  children,
}: ProtectedProps) {
  if (!puedeAccederUsuario(usuario, access)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
