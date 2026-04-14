"use client"

import { PencilIcon, Trash2Icon } from "lucide-react"

import { DataTable } from "@/components/dashboard/data-table"
import type { Role } from "@/components/roles/types"

type RolesTableProps = {
  roles: Role[]
  canEdit: boolean
  canDelete: boolean
  onEdit: (role: Role) => void
  onDelete: (role: Role) => void
}

function formatDate(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "Sin fecha"
  }

  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date)
}

export function RolesTable({
  roles,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: RolesTableProps) {
  const canShowActions = canEdit || canDelete

  return (
    <DataTable
      data={roles}
      searchKey="name"
      searchPlaceholder="Buscar rol..."
      columns={[
        {
          key: "name",
          label: "Rol",
          render: (row) => <span className="font-medium">{row.name}</span>,
        },
        {
          key: "permissions",
          label: "Permisos",
          render: (row) => (
            <div className="flex flex-wrap gap-1">
              {row.permissions.length === 0 ? (
                <span className="text-xs text-muted-foreground">Sin permisos</span>
              ) : (
                row.permissions.slice(0, 3).map((permission) => (
                  <span
                    key={permission.id}
                    className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium"
                  >
                    {permission.name}
                  </span>
                ))
              )}
              {row.permissions.length > 3 && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                  +{row.permissions.length - 3}
                </span>
              )}
            </div>
          ),
        },
        {
          key: "createdAt",
          label: "Creado",
          render: (row) => <span className="text-xs text-muted-foreground">{formatDate(row.createdAt)}</span>,
        },
        {
          key: "updatedAt",
          label: "Actualizado",
          render: (row) => (
            <span className="text-xs text-muted-foreground">{formatDate(row.updatedAt)}</span>
          ),
        },
      ]}
      actions={
        canShowActions
          ? (row) => (
            <div className="flex items-center justify-end gap-2">
              {canEdit ? (
                <button
                  type="button"
                  onClick={() => onEdit(row)}
                  title="Editar rol"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-card/80 text-muted-foreground shadow-sm transition-all duration-200 hover:border-[#FFB300]/40 hover:bg-[#FFB300]/10 hover:text-[#FF8800] hover:shadow-md active:scale-95"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
              ) : null}
              {canDelete ? (
                <button
                  type="button"
                  onClick={() => onDelete(row)}
                  title="Eliminar rol"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-card/80 text-muted-foreground shadow-sm transition-all duration-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 hover:shadow-md dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-400 active:scale-95"
                >
                  <Trash2Icon className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          )
          : undefined
      }
    />
  )
}
