"use client"

import { PencilIcon, UserXIcon } from "lucide-react"

import { DataTable } from "@/components/dashboard/data-table"
import type { User } from "@/types/users"

type UsersTableProps = {
  users: User[]
  canEdit: boolean
  canDelete: boolean
  onEdit: (user: User) => void
  onDelete: (user: User) => void
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

function VerifiedBadge({ verified }: { verified: boolean }) {
  return (
    <span
      className={[
        "rounded-full px-2.5 py-0.5 text-xs font-medium",
        verified
          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : "bg-amber-500/10 text-amber-700 dark:text-amber-400",
      ].join(" ")}
    >
      {verified ? "Verificado" : "Pendiente"}
    </span>
  )
}

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={[
        "rounded-full px-2.5 py-0.5 text-xs font-medium",
        active
          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300",
      ].join(" ")}
    >
      {active ? "Activo" : "Inactivo"}
    </span>
  )
}

export function UsersTable({ users, canEdit, canDelete, onEdit, onDelete }: UsersTableProps) {
  const canShowActions = canEdit || canDelete

  return (
    <DataTable
      data={users}
      searchKey="name"
      searchPlaceholder="Buscar usuario..."
      columns={[
        {
          key: "name",
          label: "Nombre",
          render: (row) => <span className="font-medium">{row.name}</span>,
        },
        {
          key: "email",
          label: "Correo personal",
          render: (row) => <span className="text-sm text-muted-foreground">{row.email || "Sin correo"}</span>,
        },
        {
          key: "institutionalEmail",
          label: "Correo institucional",
          render: (row) => <span className="text-sm text-muted-foreground">{row.institutionalEmail}</span>,
        },
        {
          key: "nationalId",
          label: "CI",
          render: (row) => <span className="font-mono text-xs text-muted-foreground">{row.nationalId}</span>,
        },
        {
          key: "roles",
          label: "Rol",
          render: (row) => {
            if (row.roles.length === 0) {
              return <span className="text-xs text-muted-foreground">Sin rol</span>
            }

            const role = row.roles[0]

            return (
              <div className="flex flex-wrap gap-1">
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                  {role.name}
                </span>
                {row.roles.length > 1 ? (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                    +{row.roles.length - 1}
                  </span>
                ) : null}
              </div>
            )
          },
        },
        {
          key: "isActive",
          label: "Estado",
          render: (row) => <ActiveBadge active={row.isActive} />,
        },
        {
          key: "emailVerified",
          label: "Estado de Verificacion de email",
          render: (row) => <VerifiedBadge verified={row.emailVerified} />,
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
                  title="Editar usuario"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-card/80 text-muted-foreground shadow-sm transition-all duration-200 hover:border-[#FFB300]/40 hover:bg-[#FFB300]/10 hover:text-[#FF8800] hover:shadow-md active:scale-95"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
              ) : null}
              {canDelete ? (
                <button
                  type="button"
                  onClick={() => onDelete(row)}
                  title="Desactivar usuario"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-card/80 text-muted-foreground shadow-sm transition-all duration-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 hover:shadow-md dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-400 active:scale-95"
                >
                  <UserXIcon className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          )
          : undefined
      }
    />
  )
}
