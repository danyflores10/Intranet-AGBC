"use client"

import { useState } from "react"
import { PencilIcon, Trash2Icon, ChevronLeftIcon, ChevronRightIcon, UserXIcon, UserCheckIcon } from "lucide-react"
import type { User } from "@/types/users"

type UsersTableProps = {
  users: User[]
  canEdit: boolean
  canDelete: boolean
  onEdit: (user: User) => void
  onDelete: (user: User) => void
  onToggleStatus?: (user: User) => void
}

function formatDate(value: string | Date | undefined): string {
  if (!value) return "Sin fecha"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Sin fecha"
  return new Intl.DateTimeFormat("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
}

function getInitials(name: string) {
  const parts = name.trim().split(" ")
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase() || "US"
}

function getUserLevel(roles: { id: string; name: string }[]) {
  const roleNames = roles.map((r) => r.name.toLowerCase()).join(" ")
  if (roleNames.includes("super") || roleNames.includes("admin_global")) {
    return { level: "Nivel 1", label: "Superadministrador", bg: "bg-[#0E5296] text-[#FFCC00] border-[#FFCC00]/40" }
  }
  if (roleNames.includes("admin") || roleNames.includes("gestor") || roleNames.includes("director")) {
    return { level: "Nivel 2", label: "Administrador", bg: "bg-blue-100 text-[#002F6C] border-blue-200" }
  }
  return { level: "Nivel 3", label: "Operador / Funcionario", bg: "bg-slate-100 text-slate-700 border-slate-200" }
}

export function UsersTable({ users, canEdit, canDelete, onEdit, onDelete, onToggleStatus }: UsersTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 8
  const totalPages = Math.max(1, Math.ceil(users.length / pageSize))
  const paginatedUsers = users.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="rounded-3xl border-2 border-[#002F6C]/15 bg-gradient-to-br from-white via-blue-50/20 to-amber-50/20 p-5 shadow-sm overflow-hidden">
      {/* Cabecera Informativa */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#002F6C]/10 gap-2 mb-4">
        <div>
          <h3 className="text-sm font-black text-[#002F6C]">
            Gestión de Seguridad y Cuentas de Acceso ({users.length})
          </h3>
          <p className="text-[11px] text-slate-500 font-medium">
            Control de niveles de privilegios, roles asignados y estados de autenticación institucional.
          </p>
        </div>
        <span className="text-xs font-bold text-[#0E5296] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
          Página {currentPage} de {totalPages}
        </span>
      </div>

      {/* Contenedor con Scroll Horizontal Responsivo */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
        <table className="w-full text-left border-collapse min-w-[760px]">
          <thead>
            <tr className="border-b border-slate-200/80 bg-gradient-to-r from-blue-50/80 via-white to-amber-50/60 text-[10px] font-black uppercase tracking-wider text-[#002F6C]">
              <th className="py-3.5 px-4">Usuario / Funcionario</th>
              <th className="py-3.5 px-4">Nivel de Acceso</th>
              <th className="py-3.5 px-4">Rol Asignado</th>
              <th className="py-3.5 px-4 text-center">Estado de Cuenta</th>
              <th className="py-3.5 px-4 text-center">Última Actividad</th>
              {(canEdit || canDelete) && (
                <th className="py-3.5 px-4 text-right">Acciones</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                  No hay usuarios que coincidan con la búsqueda.
                </td>
              </tr>
            ) : (
              paginatedUsers.map((u) => {
                const rolesText = u.roles.map((r) => r.name).join(", ") || "Funcionario Base"
                const userLevel = getUserLevel(u.roles)

                return (
                  <tr
                    key={u.id}
                    className="hover:bg-blue-50/40 transition-colors group"
                  >
                    {/* Usuario (Avatar + Nombre + Correo) */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFCC00] text-[#002F6C] font-black text-xs shadow-xs border border-amber-300">
                          {getInitials(u.name)}
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <p className="font-black text-[#002F6C] text-xs truncate max-w-[200px]">
                            {u.name}
                          </p>
                          <p className="text-xs truncate max-w-[200px]">
                            <span className="text-slate-400 font-medium">Cargo: </span>
                            <span className="text-[#0E5296] font-bold">{rolesText || "Personal"}</span>
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Nivel de Usuario */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider border shadow-2xs ${userLevel.bg}`}
                      >
                        <span>{userLevel.level}:</span>
                        <span>{userLevel.label}</span>
                      </span>
                    </td>

                    {/* Rol */}
                    <td className="py-3 px-4">
                      <span
                        className="inline-block rounded-xl bg-slate-100 border border-slate-200 text-[#002F6C] px-2.5 py-0.5 text-[10px] font-bold max-w-[150px] truncate"
                        title={rolesText}
                      >
                        {rolesText}
                      </span>
                    </td>

                    {/* Estado */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          u.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            u.isActive ? "bg-emerald-500" : "bg-slate-400"
                          }`}
                        />
                        {u.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </td>

                    {/* Actualizado */}
                    <td className="py-3 px-4 text-center text-[10px] text-slate-500 font-medium">
                      {formatDate(u.updatedAt)}
                    </td>

                    {/* Acciones */}
                    {(canEdit || canDelete) && (
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canEdit && onToggleStatus && (
                            <button
                              onClick={() => onToggleStatus(u)}
                              className={`flex h-7 items-center gap-1 px-2 rounded-lg text-[10px] font-bold transition-colors cursor-pointer shadow-2xs ${
                                u.isActive
                                  ? "bg-amber-50 text-amber-800 hover:bg-amber-500 hover:text-white border border-amber-200"
                                  : "bg-emerald-50 text-emerald-800 hover:bg-emerald-600 hover:text-white border border-emerald-200"
                              }`}
                              title={u.isActive ? "Dar de baja a este usuario" : "Reactivar / Dar de alta"}
                            >
                              {u.isActive ? (
                                <>
                                  <UserXIcon className="h-3 w-3" />
                                  <span>Baja</span>
                                </>
                              ) : (
                                <>
                                  <UserCheckIcon className="h-3 w-3" />
                                  <span>Alta</span>
                                </>
                              )}
                            </button>
                          )}
                          {canEdit && (
                            <button
                              onClick={() => onEdit(u)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-[#002F6C] hover:bg-[#0E5296] hover:text-white transition-colors cursor-pointer shadow-2xs"
                              title="Editar usuario"
                            >
                              <PencilIcon className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => onDelete(u)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors cursor-pointer shadow-2xs"
                              title="Eliminar usuario"
                            >
                              <Trash2Icon className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación Centrada */}
      {totalPages > 1 && (
        <div className="mt-4 flex flex-col items-center justify-center gap-2 border-t border-[#002F6C]/10 pt-3 text-xs text-slate-500 text-center">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#002F6C] shadow-xs hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
              title="Página anterior"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <span className="font-bold text-[#002F6C] px-3 py-1 rounded-lg bg-blue-50/80 border border-blue-200/60">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#002F6C] shadow-xs hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
              title="Siguiente página"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Mostrando {(currentPage - 1) * pageSize + 1} a{" "}
            {Math.min(currentPage * pageSize, users.length)} de {users.length} usuarios
          </span>
        </div>
      )}
    </div>
  )
}
