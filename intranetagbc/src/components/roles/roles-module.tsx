"use client"

import { useMemo, useState } from "react"
import { ShieldCheckIcon } from "lucide-react"

import { RoleDeleteDialog } from "@/components/roles/role-delete-dialog"
import { RoleEditDialog } from "@/components/roles/role-edit-dialog"
import { RolesTable } from "@/components/roles/roles-table"
import type { Permission, Role } from "@/types/roles"
import { Card, CardContent } from "@/components/ui/card"
import { PERMISOS } from "@/lib/auth/permisos"
import { crearContextoAcceso, puedeAcceder, type UsuarioRbac } from "@/lib/rbac"

type RolesModuleProps = {
  usuario: UsuarioRbac
  initialRoles: Role[]
  availablePermissions: Permission[]
  initialMessage?: string | null
}

function ordenarRoles(roles: Role[]): Role[] {
  return [...roles].sort((a, b) => a.name.localeCompare(b.name, "es"))
}

export function RolesModule({
  usuario,
  initialRoles,
  availablePermissions,
  initialMessage,
}: RolesModuleProps) {
  const [roles, setRoles] = useState<Role[]>(() => ordenarRoles(initialRoles))
  const [roleToEdit, setRoleToEdit] = useState<Role | null>(null)
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null)
  const accessContext = useMemo(() => crearContextoAcceso(usuario), [usuario])
  const canCreateRole = useMemo(
    () => puedeAcceder({ permissions: [PERMISOS.ROLES.CREAR] }, accessContext),
    [accessContext],
  )
  const canEditRole = useMemo(
    () => puedeAcceder({ permissions: [PERMISOS.ROLES.EDITAR] }, accessContext),
    [accessContext],
  )
  const canDeleteRole = useMemo(
    () => puedeAcceder({ permissions: [PERMISOS.ROLES.ELIMINAR] }, accessContext),
    [accessContext],
  )

  const resumen = useMemo(
    () => ({
      totalRoles: roles.length,
      totalPermisosDisponibles: availablePermissions.length,
      rolesSinPermisos: roles.filter((role) => role.permissions.length === 0).length,
    }),
    [roles, availablePermissions.length],
  )

  function handleRoleCreated(role: Role) {
    setRoles((prev) => ordenarRoles([...prev, role]))
  }

  function handleRoleUpdated(role: Role) {
    setRoles((prev) => ordenarRoles(prev.map((item) => (item.id === role.id ? role : item))))
  }

  function handleRoleDeleted(roleId: string) {
    setRoles((prev) => prev.filter((role) => role.id !== roleId))
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Gestion de roles</h2>
          <p className="text-sm text-muted-foreground">
            Crea roles, define permisos y administra el acceso al sistema.
          </p>
        </div>
      </div>

      {initialMessage ? (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="p-4 text-sm text-amber-700 dark:text-amber-400">
            {initialMessage}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/40">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-[#FFB300]/10 p-2">
                <ShieldCheckIcon className="h-5 w-5 text-[#FFB300]" />
              </div>
              <div>
                <div className="text-2xl font-bold">{resumen.totalRoles}</div>
                <div className="text-xs text-muted-foreground">Roles registrados</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/40">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{resumen.totalPermisosDisponibles}</div>
            <div className="text-xs text-muted-foreground">Permisos disponibles</div>
          </CardContent>
        </Card>
        <Card className="border-border/40">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{resumen.rolesSinPermisos}</div>
            <div className="text-xs text-muted-foreground">Roles sin permisos</div>
          </CardContent>
        </Card>
      </div>

      <RolesTable
        roles={roles}
        availablePermissions={availablePermissions}
        canCreate={canCreateRole}
        canEdit={canEditRole}
        canDelete={canDeleteRole}
        onRoleCreated={handleRoleCreated}
        onEdit={(role) => {
          if (canEditRole) {
            setRoleToEdit(role)
          }
        }}
        onDelete={(role) => {
          if (canDeleteRole) {
            setRoleToDelete(role)
          }
        }}
      />

      {canEditRole ? (
        <RoleEditDialog
          role={roleToEdit}
          permissions={availablePermissions}
          onUpdated={handleRoleUpdated}
          onClose={() => setRoleToEdit(null)}
        />
      ) : null}

      {canDeleteRole ? (
        <RoleDeleteDialog
          role={roleToDelete}
          onDeleted={handleRoleDeleted}
          onClose={() => setRoleToDelete(null)}
        />
      ) : null}
    </div>
  )
}
