import { redirect } from "next/navigation"

import { obtenerPermisosDisponibles, obtenerRoles } from "@/actions/roles"
import { RolesModule } from "@/components/roles/roles-module"
import type { Permission, Role } from "@/components/roles/types"
import { obtenerUsuarioRbacActual } from "@/lib/auth/session-access"
import { puedeAccederUsuario } from "@/lib/rbac"
import { PERMISOS } from "@/lib/auth/permisos"

export default async function RolesPage() {
  const usuario = await obtenerUsuarioRbacActual()

  if (!usuario) {
    redirect("/")
  }
  if (!puedeAccederUsuario(usuario, { permissions: [PERMISOS.ROLES.VER] })) redirect("/dashboard")

  const [rolesResult, permisosResult] = await Promise.all([
    obtenerRoles(),
    obtenerPermisosDisponibles(),
  ])

  const initialRoles = rolesResult.success && rolesResult.data ? (rolesResult.data as Role[]) : []
  const availablePermissions =
    permisosResult.success && permisosResult.data ? (permisosResult.data as Permission[]) : []
  const initialMessage =
    !rolesResult.success
      ? rolesResult.message
      : !permisosResult.success
        ? permisosResult.message
        : null

  return (
    <RolesModule
      usuario={usuario}
      initialRoles={initialRoles}
      availablePermissions={availablePermissions}
      initialMessage={initialMessage}
    />
  )
}
