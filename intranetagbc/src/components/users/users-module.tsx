"use client"

import { useMemo, useState } from "react"
import { MailCheckIcon, ShieldCheckIcon, UsersIcon } from "lucide-react"

import { UserCreateDialog } from "@/components/users/user-create-dialog"
import { UserDeleteDialog } from "@/components/users/user-delete-dialog"
import { UserEditDialog } from "@/components/users/user-edit-dialog"
import { UsersTable } from "@/components/users/users-table"
import { Card, CardContent } from "@/components/ui/card"
import { PERMISOS } from "@/lib/auth/permisos"
import { crearContextoAcceso, puedeAcceder, type UsuarioRbac } from "@/lib/rbac"
import type { RoleOption, User } from "@/types/users"

type UsersModuleProps = {
  usuario: UsuarioRbac
  initialUsers: User[]
  availableRoles: RoleOption[]
  initialMessage?: string | null
}

function ordenarUsuarios(users: User[]): User[] {
  return [...users].sort((a, b) => a.name.localeCompare(b.name, "es"))
}

export function UsersModule({
  usuario,
  initialUsers,
  availableRoles,
  initialMessage,
}: UsersModuleProps) {
  const [users, setUsers] = useState<User[]>(() => ordenarUsuarios(initialUsers))
  const [userToEdit, setUserToEdit] = useState<User | null>(null)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)

  const accessContext = useMemo(() => crearContextoAcceso(usuario), [usuario])
  const canViewUsers = useMemo(
    () => puedeAcceder({ permissions: [PERMISOS.USUARIOS.VER] }, accessContext),
    [accessContext],
  )
  const canCreateUser = useMemo(
    () => puedeAcceder({ permissions: [PERMISOS.USUARIOS.CREAR] }, accessContext),
    [accessContext],
  )
  const canEditUser = useMemo(
    () => puedeAcceder({ permissions: [PERMISOS.USUARIOS.EDITAR] }, accessContext),
    [accessContext],
  )
  const canDeleteUser = useMemo(
    () => puedeAcceder({ permissions: [PERMISOS.USUARIOS.ELIMINAR] }, accessContext),
    [accessContext],
  )

  const resumen = useMemo(
    () => ({
      totalUsuarios: users.length,
      correosVerificados: users.filter((user) => user.emailVerified).length,
      usuariosConRoles: users.filter((user) => user.roles.length > 0).length,
    }),
    [users],
  )

  function handleUserCreated(user: User) {
    setUsers((prev) => ordenarUsuarios([...prev, user]))
  }

  function handleUserUpdated(user: User) {
    setUsers((prev) => ordenarUsuarios(prev.map((item) => (item.id === user.id ? user : item))))
  }

  function handleUserDeleted(userId: string) {
    setUsers((prev) => prev.filter((user) => user.id !== userId))
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Gestion de usuarios</h2>
          <p className="text-sm text-muted-foreground">
            Administra cuentas de acceso, datos de perfil y roles asignados.
          </p>
        </div>

        {canCreateUser ? (
          <UserCreateDialog roles={availableRoles} onCreated={handleUserCreated} />
        ) : null}
      </div>

      {initialMessage ? (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="p-4 text-sm text-amber-700 dark:text-amber-400">
            {initialMessage}
          </CardContent>
        </Card>
      ) : null}

      {!canViewUsers ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No tienes permisos para ver usuarios.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="border-border/40">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-[#FFB300]/10 p-2">
                    <UsersIcon className="h-5 w-5 text-[#FFB300]" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{resumen.totalUsuarios}</div>
                    <div className="text-xs text-muted-foreground">Usuarios registrados</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/40">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-emerald-500/10 p-2">
                    <MailCheckIcon className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{resumen.correosVerificados}</div>
                    <div className="text-xs text-muted-foreground">Correos verificados</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/40">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-sky-500/10 p-2">
                    <ShieldCheckIcon className="h-5 w-5 text-sky-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{resumen.usuariosConRoles}</div>
                    <div className="text-xs text-muted-foreground">Usuarios con roles</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <UsersTable
            users={users}
            canEdit={canEditUser}
            canDelete={canDeleteUser}
            onEdit={(selectedUser) => {
              if (canEditUser) {
                setUserToEdit(selectedUser)
              }
            }}
            onDelete={(selectedUser) => {
              if (canDeleteUser) {
                setUserToDelete(selectedUser)
              }
            }}
          />

          {canEditUser ? (
            <UserEditDialog
              user={userToEdit}
              roles={availableRoles}
              onUpdated={handleUserUpdated}
              onClose={() => setUserToEdit(null)}
            />
          ) : null}

          {canDeleteUser ? (
            <UserDeleteDialog
              user={userToDelete}
              onDeleted={handleUserDeleted}
              onClose={() => setUserToDelete(null)}
            />
          ) : null}
        </>
      )}
    </div>
  )
}
