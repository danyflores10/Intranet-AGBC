"use client"

import { useMemo, useState } from "react"
import {
  ArrowUpDownIcon,
  FilterIcon,
  MoreVerticalIcon,
  SearchIcon,
} from "lucide-react"

import { RoleCreateDialog } from "@/components/roles/role-create-dialog"
import type { Permission, Role } from "@/components/roles/types"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type RolesTableProps = {
  roles: Role[]
  availablePermissions: Permission[]
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  onRoleCreated: (role: Role) => void
  onEdit: (role: Role) => void
  onDelete: (role: Role) => void
}

const PAGE_SIZE = 10

const ACTION_ORDER = ["ver", "crear", "editar", "eliminar"] as const
type ActionKey = (typeof ACTION_ORDER)[number]

const ACTION_LABELS: Record<ActionKey, string> = {
  ver: "Ver",
  crear: "Crear",
  editar: "Editar",
  eliminar: "Eliminar",
}

const ACTION_PILL_STYLES: Record<ActionKey, string> = {
  ver: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/35 dark:bg-emerald-500/10 dark:text-emerald-300",
  crear: "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-500/35 dark:bg-cyan-500/10 dark:text-cyan-300",
  editar: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/35 dark:bg-amber-500/10 dark:text-amber-300",
  eliminar: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/35 dark:bg-rose-500/10 dark:text-rose-300",
}

const MODULE_LABEL_MAP: Record<string, string> = {
  accesos: "Accesos Directos",
  banners: "Noticias",
  rrhh: "RRHH",
  "secciones landing": "Secciones Landing",
}

const MODULE_PILL_STYLES = [
  "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/35 dark:bg-violet-500/10 dark:text-violet-300",
  "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/35 dark:bg-emerald-500/10 dark:text-emerald-300",
  "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-500/35 dark:bg-cyan-500/10 dark:text-cyan-300",
  "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/35 dark:bg-amber-500/10 dark:text-amber-300",
  "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/35 dark:bg-sky-500/10 dark:text-sky-300",
  "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/35 dark:bg-indigo-500/10 dark:text-indigo-300",
] as const

type SortKey = "actualizacion" | "nombre" | "modulos"
type FilterKey = "todos" | ActionKey

type TableRow = {
  role: Role
  modules: string[]
  actionCounts: Record<ActionKey, number>
  updatedAtMs: number
  searchableText: string
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
}

function toTitleCase(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ")
}

function parsePermissionName(name: string): { action: string; module: string } {
  const trimmed = name.trim().toLowerCase()

  if (!trimmed) {
    return { action: "", module: "" }
  }

  const [action, ...rest] = trimmed.split(" ")

  return {
    action,
    module: rest.join(" ").trim(),
  }
}

function toModuleLabel(moduleKey: string): string {
  const normalized = moduleKey.toLowerCase()
  return MODULE_LABEL_MAP[normalized] ?? toTitleCase(normalized)
}

function modulePillStyle(moduleLabel: string): string {
  let hash = 0

  for (const char of moduleLabel.toLowerCase()) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  }

  return MODULE_PILL_STYLES[hash % MODULE_PILL_STYLES.length]
}

function formatUpdatedAt(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "Sin fecha"
  }

  return new Intl.DateTimeFormat("es-BO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date)
}

function buildPagination(current: number, total: number): Array<number | "ellipsis"> {
  if (total <= 6) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  if (current <= 3) {
    return [1, 2, 3, 4, "ellipsis", total]
  }

  if (current >= total - 2) {
    return [1, "ellipsis", total - 3, total - 2, total - 1, total]
  }

  return [1, "ellipsis", current - 1, current, current + 1, "ellipsis", total]
}

function parseRoleToRow(role: Role): TableRow {
  const moduleSet = new Set<string>()
  const actionCounts: Record<ActionKey, number> = {
    ver: 0,
    crear: 0,
    editar: 0,
    eliminar: 0,
  }

  for (const permission of role.permissions) {
    const { action, module } = parsePermissionName(permission.name)

    if (ACTION_ORDER.includes(action as ActionKey)) {
      actionCounts[action as ActionKey] += 1
    }

    if (module) {
      moduleSet.add(toModuleLabel(module))
    }
  }

  const modules = [...moduleSet].sort((a, b) => a.localeCompare(b, "es"))
  const searchableText = normalizeText(
    [role.name, ...modules, ...role.permissions.map((permission) => permission.name)].join(" "),
  )

  const updatedAtDate = new Date(role.updatedAt)

  return {
    role,
    modules,
    actionCounts,
    searchableText,
    updatedAtMs: Number.isNaN(updatedAtDate.getTime()) ? 0 : updatedAtDate.getTime(),
  }
}

export function RolesTable({
  roles,
  availablePermissions,
  canCreate,
  canEdit,
  canDelete,
  onRoleCreated,
  onEdit,
  onDelete,
}: RolesTableProps) {
  const [query, setQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortKey>("actualizacion")
  const [filterBy, setFilterBy] = useState<FilterKey>("todos")
  const [page, setPage] = useState(1)
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([])

  const rows = useMemo(() => roles.map(parseRoleToRow), [roles])
  const validRoleIds = useMemo(() => new Set(roles.map((role) => role.id)), [roles])

  const selectedRoleIdsInData = useMemo(
    () => selectedRoleIds.filter((roleId) => validRoleIds.has(roleId)),
    [selectedRoleIds, validRoleIds],
  )

  const filteredRows = useMemo(() => {
    const normalizedQuery = normalizeText(query.trim())

    const filtered = rows.filter((row) => {
      const queryMatches = !normalizedQuery || row.searchableText.includes(normalizedQuery)
      const filterMatches =
        filterBy === "todos" ? true : row.actionCounts[filterBy as ActionKey] > 0

      return queryMatches && filterMatches
    })

    filtered.sort((a, b) => {
      if (sortBy === "nombre") {
        return a.role.name.localeCompare(b.role.name, "es")
      }

      if (sortBy === "modulos") {
        return b.modules.length - a.modules.length || a.role.name.localeCompare(b.role.name, "es")
      }

      return b.updatedAtMs - a.updatedAtMs || a.role.name.localeCompare(b.role.name, "es")
    })

    return filtered
  }, [rows, query, sortBy, filterBy])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)

  const pagedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredRows.slice(start, start + PAGE_SIZE)
  }, [filteredRows, currentPage])

  const pageRoleIds = useMemo(() => pagedRows.map((row) => row.role.id), [pagedRows])

  const selectedInPageCount = useMemo(
    () => pageRoleIds.filter((roleId) => selectedRoleIdsInData.includes(roleId)).length,
    [pageRoleIds, selectedRoleIdsInData],
  )

  const allPageSelected = pageRoleIds.length > 0 && selectedInPageCount === pageRoleIds.length
  const somePageSelected = selectedInPageCount > 0 && !allPageSelected

  const canShowActions = canEdit || canDelete

  const paginationItems = buildPagination(currentPage, totalPages)
  const showingFrom = filteredRows.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const showingTo = Math.min(currentPage * PAGE_SIZE, filteredRows.length)

  function setPageSelection(checked: boolean | "indeterminate") {
    if (checked === true) {
      const merged = new Set([...selectedRoleIdsInData, ...pageRoleIds])
      setSelectedRoleIds([...merged])
      return
    }

    if (checked === false) {
      setSelectedRoleIds((prev) =>
        prev.filter((id) => validRoleIds.has(id) && !pageRoleIds.includes(id)),
      )
    }
  }

  function setRowSelection(roleId: string, checked: boolean | "indeterminate") {
    setSelectedRoleIds((prev) => {
      const normalized = prev.filter((id) => validRoleIds.has(id))

      if (checked === true) {
        if (normalized.includes(roleId)) {
          return normalized
        }

        return [...normalized, roleId]
      }

      return normalized.filter((id) => id !== roleId)
    })
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-4 py-4 sm:px-5">
        <div>
          <h3 className="text-base font-semibold text-foreground">Roles</h3>
          <p className="text-xs text-muted-foreground">Control de módulos y permisos por cada rol</p>
        </div>

        {canCreate ? (
          <RoleCreateDialog
            permissions={availablePermissions}
            onCreated={onRoleCreated}
            triggerLabel="Añadir Rol"
            triggerClassName="h-9 rounded-lg border border-violet-200 bg-violet-50 px-3 text-sm font-semibold text-violet-700 shadow-none hover:bg-violet-100 dark:border-violet-500/35 dark:bg-violet-500/10 dark:text-violet-300 dark:hover:bg-violet-500/20"
          />
        ) : null}
      </div>

      <div className="flex flex-col gap-3 border-b border-border/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="relative w-full sm:max-w-md">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setPage(1)
            }}
            placeholder="Buscar rol o módulo..."
            className="h-9 border-border bg-background pl-9 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-violet-200 dark:focus-visible:ring-violet-500/30"
          />
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="h-9 border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <ArrowUpDownIcon className="mr-2 h-4 w-4" />
                Ordenar
              </Button>
            </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onClick={() => {
                  setSortBy("actualizacion")
                  setPage(1)
                }}
              >
                Más reciente
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSortBy("nombre")
                  setPage(1)
                }}
              >
                Nombre A-Z
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSortBy("modulos")
                  setPage(1)
                }}
              >
                Más módulos
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="h-9 border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <FilterIcon className="mr-2 h-4 w-4" />
                Filtrar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onClick={() => {
                  setFilterBy("todos")
                  setPage(1)
                }}
              >
                Todos
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setFilterBy("ver")
                  setPage(1)
                }}
              >
                Ver
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setFilterBy("crear")
                  setPage(1)
                }}
              >
                Crear
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setFilterBy("editar")
                  setPage(1)
                }}
              >
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setFilterBy("eliminar")
                  setPage(1)
                }}
              >
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full border-collapse">
          <thead className="bg-muted/40">
            <tr>
              <th className="w-12 border-b border-r border-border/70 px-3 py-3 text-left">
                <Checkbox
                  checked={allPageSelected ? true : somePageSelected ? "indeterminate" : false}
                  onCheckedChange={setPageSelection}
                  aria-label="Seleccionar todos los roles de la pagina"
                  className="border-border data-checked:bg-violet-600 data-checked:border-violet-600"
                />
              </th>
              <th className="border-b border-r border-border/70 px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Rol
              </th>
              <th className="border-b border-r border-border/70 px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Módulos Permitidos
              </th>
              <th className="border-b border-r border-border/70 px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Permisos Generales
              </th>
              <th className="border-b border-r border-border/70 px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Última Actualización
              </th>
              <th className="w-16 border-b border-border/70 px-3 py-3 text-center text-sm font-medium text-muted-foreground">
                Acción
              </th>
            </tr>
          </thead>
          <tbody>
            {pagedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-sm text-muted-foreground"
                >
                  No hay roles que coincidan con la búsqueda.
                </td>
              </tr>
            ) : (
              pagedRows.map((row) => {
                const activeActions = ACTION_ORDER.filter(
                  (action) => row.actionCounts[action] > 0,
                )

                return (
                  <tr
                    key={row.role.id}
                    className="border-b border-border/60 transition-colors hover:bg-muted/40"
                  >
                    <td className="border-r border-border/60 px-3 py-3 align-top">
                      <Checkbox
                        checked={selectedRoleIdsInData.includes(row.role.id)}
                        onCheckedChange={(checked) => setRowSelection(row.role.id, checked)}
                        aria-label={`Seleccionar rol ${row.role.name}`}
                        className="border-border data-checked:bg-violet-600 data-checked:border-violet-600"
                      />
                    </td>
                    <td className="border-r border-border/60 px-4 py-3 align-top">
                      <div className="space-y-0.5">
                        <p className="text-sm font-semibold text-foreground">{row.role.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {row.role.permissions.length} permisos asignados
                        </p>
                      </div>
                    </td>
                    <td className="border-r border-border/60 px-4 py-3 align-top">
                      {row.modules.length === 0 ? (
                        <span className="text-xs text-muted-foreground">Sin módulos</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {row.modules.slice(0, 5).map((module) => (
                            <span
                              key={`${row.role.id}-${module}`}
                              className={cn(
                                "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                                modulePillStyle(module),
                              )}
                            >
                              {module}
                            </span>
                          ))}
                          {row.modules.length > 5 ? (
                            <span className="inline-flex items-center rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                              +{row.modules.length - 5}
                            </span>
                          ) : null}
                        </div>
                      )}
                    </td>
                    <td className="border-r border-border/60 px-4 py-3 align-top">
                      {activeActions.length === 0 ? (
                        <span className="text-xs text-muted-foreground">Sin acciones</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {activeActions.map((action) => (
                            <span
                              key={`${row.role.id}-${action}`}
                              className={cn(
                                "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold",
                                ACTION_PILL_STYLES[action],
                              )}
                            >
                              {ACTION_LABELS[action]}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="border-r border-border/60 px-4 py-3 align-top">
                      <span className="text-sm text-muted-foreground">
                        {formatUpdatedAt(row.role.updatedAt)}
                      </span>
                    </td>
                    <td className="px-3 py-3 align-top text-center">
                      {canShowActions ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                              aria-label={`Acciones de ${row.role.name}`}
                            >
                              <MoreVerticalIcon className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            {canEdit ? (
                              <DropdownMenuItem onClick={() => onEdit(row.role)}>
                                Editar rol
                              </DropdownMenuItem>
                            ) : null}
                            {canDelete ? (
                              <DropdownMenuItem
                                onClick={() => onDelete(row.role)}
                                className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-300"
                              >
                                Eliminar rol
                              </DropdownMenuItem>
                            ) : null}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span className="text-sm text-muted-foreground/60">-</span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-border/70 bg-muted/35 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p className="text-xs text-muted-foreground">
          Mostrando {showingFrom} - {showingTo} de {filteredRows.length} roles
        </p>

        <div className="inline-flex overflow-hidden rounded-lg border border-border bg-background">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setPage(Math.max(1, currentPage - 1))}
            className="h-9 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:text-muted-foreground/50"
          >
            Anterior
          </button>

          {paginationItems.map((item, index) =>
            item === "ellipsis" ? (
              <span
                key={`ellipsis-${index}`}
                className="inline-flex h-9 min-w-10 items-center justify-center border-l border-border px-2 text-sm text-muted-foreground/80"
              >
                ...
              </span>
            ) : (
              <button
                key={`page-${item}`}
                type="button"
                onClick={() => setPage(item)}
                className={cn(
                  "h-9 min-w-10 border-l border-border px-3 text-sm transition-colors",
                  currentPage === item
                    ? "bg-muted font-semibold text-foreground"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                {item}
              </button>
            ),
          )}

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
            className="h-9 border-l border-border px-3 text-sm text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:text-muted-foreground/50"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  )
}
