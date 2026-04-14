import { redirect } from "next/navigation"

import { obtenerRolesDisponibles, obtenerUsuarios } from "@/actions/usuarios"
import { UsersModule } from "@/components/users/users-module"
import { obtenerUsuarioRbacActual } from "@/lib/auth/session-access"
import { puedeAccederUsuario } from "@/lib/rbac"
import { PERMISOS } from "@/lib/auth/permisos"
import type { RoleOption, User } from "@/types/users"

export default async function UsuariosPage() {
  const usuario = await obtenerUsuarioRbacActual()

  if (!usuario) {
    redirect("/login")
  }
  if (!puedeAccederUsuario(usuario, { permissions: [PERMISOS.USUARIOS.VER] })) redirect("/dashboard")

  const [usuariosResult, rolesResult] = await Promise.all([
    obtenerUsuarios(),
    obtenerRolesDisponibles(),
  ])

  const initialUsers = usuariosResult.success && usuariosResult.data
    ? (usuariosResult.data as User[])
    : []
  const availableRoles = rolesResult.success && rolesResult.data
    ? (rolesResult.data as RoleOption[])
    : []

  const initialMessage = !usuariosResult.success
    ? usuariosResult.message
    : !rolesResult.success
      ? rolesResult.message
      : null

  return (
    <UsersModule
      usuario={usuario}
      initialUsers={initialUsers}
      availableRoles={availableRoles}
      initialMessage={initialMessage}
    />
  )
}
