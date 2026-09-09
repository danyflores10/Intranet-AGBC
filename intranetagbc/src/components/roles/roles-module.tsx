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
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 bg-gradient-to-br from-slate-50 via-blue-50/25 to-amber-50/20 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0E5296] text-[#FFCC00] shadow-sm">
              <ShieldCheckIcon className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-[#002F6C]">
              Gestión de Roles y Permisos
            </h1>
          </div>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Crea roles institucionales, define permisos RBAC y administra el control de acceso al sistema.
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
        <div className="flex items-center gap-3.5 rounded-2xl border-2 border-amber-200/90 bg-gradient-to-br from-amber-50 via-yellow-50/60 to-white p-4.5 shadow-xs hover:shadow-md transition-all">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFCC00]/25 text-[#002F6C]">
            <ShieldCheckIcon className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#002F6C]">{resumen.totalRoles}</div>
            <div className="text-xs text-slate-600 font-bold">Roles Registrados</div>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border-2 border-sky-200/90 bg-gradient-to-br from-sky-50 via-blue-50/60 to-white p-4.5 shadow-xs hover:shadow-md transition-all">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0E5296]/15 text-[#0E5296]">
            <ShieldCheckIcon className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#002F6C]">{resumen.totalPermisosDisponibles}</div>
            <div className="text-xs text-slate-600 font-bold">Permisos Disponibles</div>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border-2 border-blue-200/90 bg-gradient-to-br from-blue-50 via-sky-50/50 to-white p-4.5 shadow-xs hover:shadow-md transition-all">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0E5296] text-[#FFCC00]">
            <ShieldCheckIcon className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#002F6C]">{resumen.rolesSinPermisos}</div>
            <div className="text-xs text-slate-600 font-bold">Roles sin Permisos</div>
          </div>
        </div>
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
