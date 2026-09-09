"use client"

import { useMemo, useState, useEffect } from "react"
import {
  MailCheckIcon,
  ShieldCheckIcon,
  UsersIcon,
  SearchIcon,
  FilterIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilIcon,
  Trash2Icon,
  MailIcon,
  FingerprintIcon,
  CalendarIcon,
  LayoutGridIcon,
  TableIcon,
  UserPlusIcon,
  PauseIcon,
  PlayIcon,
  RotateCwIcon,
  FileSpreadsheetIcon,
} from "lucide-react"

import { UserCreateDialog } from "@/components/users/user-create-dialog"
import { UserDeleteDialog } from "@/components/users/user-delete-dialog"
import { UserEditDialog } from "@/components/users/user-edit-dialog"
import { UsersTable } from "@/components/users/users-table"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PERMISOS } from "@/lib/auth/permisos"
import { crearContextoAcceso, puedeAcceder, type UsuarioRbac } from "@/lib/rbac"
import { cambiarEstadoUsuario } from "@/actions/usuarios"
import type { RoleOption, User } from "@/types/users"

type UsersModuleProps = {
  usuario: UsuarioRbac
  initialUsers: User[]
  availableRoles: RoleOption[]
  initialMessage?: string | null
}

const MAX_USERS_POR_CARRUSEL = 6
const CYLINDER_RADIUS = 310

function ordenarUsuarios(users: User[]): User[] {
  return [...users].sort((a, b) => a.name.localeCompare(b.name, "es"))
}

export function UsersModule({
  usuario,
  initialUsers,
  availableRoles,
  initialMessage,
}: UsersModuleProps) {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>(() => ordenarUsuarios(initialUsers))
  const [userToEdit, setUserToEdit] = useState<User | null>(null)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)

  // Filtros de búsqueda
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("todos")
  const [statusFilter, setStatusFilter] = useState("todos")

  async function handleToggleStatus(targetUser: User) {
    const nextStatus = !targetUser.isActive
    try {
      const res = await cambiarEstadoUsuario(targetUser.id, nextStatus)
      if (res.success && res.data) {
        handleUserUpdated(res.data as User)
        toast.success(res.message)
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error("Error al actualizar el estado del usuario")
    }
  }

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

  // Filtrado de usuarios
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.institutionalEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())

      const matchRole =
        roleFilter === "todos" ||
        u.roles.some((r) => r.id === roleFilter || r.name.toLowerCase() === roleFilter.toLowerCase())

      const matchStatus =
        statusFilter === "todos" ||
        (statusFilter === "activo" && u.isActive) ||
        (statusFilter === "inactivo" && !u.isActive)

      return matchSearch && matchRole && matchStatus
    })
  }, [users, searchTerm, roleFilter, statusFilter])

  const resumen = useMemo(
    () => ({
      totalUsuarios: users.length,
      usuariosActivos: users.filter((user) => user.isActive).length,
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
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 bg-gradient-to-br from-slate-50 via-blue-50/25 to-amber-50/20 min-h-screen">
      {/* ── Cabecera Principal ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0E5296] text-[#FFCC00] shadow-sm">
              <ShieldCheckIcon className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-[#002F6C]">
              Cuentas y Niveles de Acceso
            </h1>
            <span className="rounded-full bg-[#0E5296] text-[#FFCC00] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
              Seguridad RBAC
            </span>
          </div>
          <p className="text-xs text-slate-600 font-medium mt-1">
            Administración de credenciales, niveles de privilegios (Superadmin, Administrador, Operador) y roles de seguridad institucional.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {canCreateUser ? (
            <UserCreateDialog roles={availableRoles} onCreated={handleUserCreated} />
          ) : null}
        </div>
      </div>

      {initialMessage ? (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="p-4 text-sm text-amber-700">
            {initialMessage}
          </CardContent>
        </Card>
      ) : null}

      {!canViewUsers ? (
        <Card className="border-slate-200 bg-white p-8 text-center">
          <CardContent className="text-sm text-slate-500">
            No tienes permisos para ver usuarios.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ── Tarjetas de Resumen (Pastel Amarillo & Azul) ── */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3.5 rounded-2xl border-2 border-sky-200/90 bg-gradient-to-br from-sky-50 via-blue-50/60 to-white p-4.5 shadow-xs hover:shadow-md transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0E5296]/15 text-[#0E5296]">
                <UsersIcon className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-[#002F6C]">{resumen.totalUsuarios}</div>
                <div className="text-xs text-slate-600 font-bold">Usuarios Registrados</div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-2xl border-2 border-emerald-200/90 bg-gradient-to-br from-emerald-50 via-teal-50/60 to-white p-4.5 shadow-xs hover:shadow-md transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600/15 text-emerald-700">
                <ShieldCheckIcon className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-[#002F6C]">{resumen.usuariosActivos}</div>
                <div className="text-xs text-slate-600 font-bold">Cuentas Activas</div>
              </div>
            </div>

            <div className="flex items-center gap-3.5 rounded-2xl border-2 border-blue-200/90 bg-gradient-to-br from-blue-50 via-sky-50/50 to-white p-4.5 shadow-xs hover:shadow-md transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0E5296] text-[#FFCC00]">
                <ShieldCheckIcon className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-[#002F6C]">{resumen.usuariosConRoles}</div>
                <div className="text-xs text-slate-600 font-bold">Cuentas con Roles Asignados</div>
              </div>
            </div>
          </div>

          {/* ── Filtros y Buscador ── */}
          <div className="rounded-2xl border-2 border-[#002F6C]/15 bg-gradient-to-r from-white via-blue-50/20 to-amber-50/20 p-4 shadow-xs">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="relative w-full md:w-80">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Buscar por nombre, correo, CI..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-white/90 border-[#002F6C]/20 text-xs font-medium focus:border-[#0E5296]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="rounded-xl border border-[#002F6C]/20 bg-white/90 px-3 py-2 text-xs font-bold text-[#002F6C] outline-hidden shadow-2xs"
                >
                  <option value="todos">Todos los roles</option>
                  {availableRoles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-[#002F6C]/20 bg-white/90 px-3 py-2 text-xs font-bold text-[#002F6C] outline-hidden shadow-2xs"
                >
                  <option value="todos">Todos los estados</option>
                  <option value="activo">Solo activos</option>
                  <option value="inactivo">Solo inactivos</option>
                </select>

                {(searchTerm || roleFilter !== "todos" || statusFilter !== "todos") && (
                  <button
                    onClick={() => {
                      setSearchTerm("")
                      setRoleFilter("todos")
                      setStatusFilter("todos")
                    }}
                    className="rounded-xl bg-white hover:bg-slate-100 border border-slate-200 px-3 py-2 text-xs font-bold text-[#002F6C] cursor-pointer transition-colors shadow-2xs"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── TABLA DE USUARIOS ── */}
          <UsersTable
            users={filteredUsers}
            canEdit={canEditUser}
            canDelete={canDeleteUser}
            onEdit={setUserToEdit}
            onDelete={setUserToDelete}
            onToggleStatus={handleToggleStatus}
          />
        </>
      )}

      {/* ── Modales de Edición y Eliminación ── */}
      <UserEditDialog
        user={userToEdit}
        roles={availableRoles}
        onUpdated={handleUserUpdated}
        onClose={() => setUserToEdit(null)}
      />

      <UserDeleteDialog
        user={userToDelete}
        onDeleted={handleUserDeleted}
        onClose={() => setUserToDelete(null)}
      />
    </div>
  )
}
