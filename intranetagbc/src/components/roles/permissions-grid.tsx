"use client"

import { useCallback, useMemo, useState, useTransition } from "react"
import {
  CheckIcon,
  XIcon,
  EyeIcon,
  PlusCircleIcon,
  PencilIcon,
  Trash2Icon,
  Loader2Icon,
  ShieldCheckIcon,
  ShieldOffIcon,
  PackageIcon,
  UsersIcon,
  FileTextIcon,
  MailIcon,
  ClipboardListIcon,
  TruckIcon,
  ArchiveIcon,
  CalendarIcon,
  MegaphoneIcon,
  BarChart3Icon,
  SearchIcon,
  SettingsIcon,
  BuildingIcon,
  NewspaperIcon,
  BookOpenIcon,
  ContactIcon,
  BookMarkedIcon,
  Link2Icon,
} from "lucide-react"
import toast from "react-hot-toast"

import { reemplazarPermisosDeRol } from "@/actions/roles"
import type { Permission, Role } from "@/types/roles"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type PermissionsGridProps = {
  roles: Role[]
  permissions: Permission[]
  canEdit: boolean
  onRoleUpdated: (role: Role) => void
}

type PermissionGroup = {
  module: string
  actions: { action: string; permission: Permission }[]
}

const ACTION_ORDER = ["ver", "crear", "editar", "eliminar"]

const ACTION_ICONS: Record<string, typeof EyeIcon> = {
  ver: EyeIcon,
  crear: PlusCircleIcon,
  editar: PencilIcon,
  eliminar: Trash2Icon,
}

const ACTION_LABELS: Record<string, string> = {
  ver: "Ver",
  crear: "Crear",
  editar: "Editar",
  eliminar: "Eliminar",
}

type ModuleTheme = {
  bg: string
  border: string
  headerBg: string
  headerText: string
  accent: string
  icon: typeof PackageIcon
}

const MODULE_THEMES: Record<string, ModuleTheme> = {
  roles: {
    bg: "bg-violet-50/50 dark:bg-violet-950/20",
    border: "border-violet-200 dark:border-violet-800",
    headerBg: "bg-violet-100 dark:bg-violet-900/40",
    headerText: "text-violet-700 dark:text-violet-300",
    accent: "text-violet-600 dark:text-violet-400",
    icon: ShieldCheckIcon,
  },
  usuarios: {
    bg: "bg-blue-50/50 dark:bg-blue-950/20",
    border: "border-blue-200 dark:border-blue-800",
    headerBg: "bg-blue-100 dark:bg-blue-900/40",
    headerText: "text-blue-700 dark:text-blue-300",
    accent: "text-blue-600 dark:text-blue-400",
    icon: UsersIcon,
  },
  documentos: {
    bg: "bg-amber-50/50 dark:bg-amber-950/20",
    border: "border-amber-200 dark:border-amber-800",
    headerBg: "bg-amber-100 dark:bg-amber-900/40",
    headerText: "text-amber-700 dark:text-amber-300",
    accent: "text-amber-600 dark:text-amber-400",
    icon: FileTextIcon,
  },
  correspondencia: {
    bg: "bg-rose-50/50 dark:bg-rose-950/20",
    border: "border-rose-200 dark:border-rose-800",
    headerBg: "bg-rose-100 dark:bg-rose-900/40",
    headerText: "text-rose-700 dark:text-rose-300",
    accent: "text-rose-600 dark:text-rose-400",
    icon: MailIcon,
  },
  tramites: {
    bg: "bg-teal-50/50 dark:bg-teal-950/20",
    border: "border-teal-200 dark:border-teal-800",
    headerBg: "bg-teal-100 dark:bg-teal-900/40",
    headerText: "text-teal-700 dark:text-teal-300",
    accent: "text-teal-600 dark:text-teal-400",
    icon: ClipboardListIcon,
  },
  logistica: {
    bg: "bg-orange-50/50 dark:bg-orange-950/20",
    border: "border-orange-200 dark:border-orange-800",
    headerBg: "bg-orange-100 dark:bg-orange-900/40",
    headerText: "text-orange-700 dark:text-orange-300",
    accent: "text-orange-600 dark:text-orange-400",
    icon: TruckIcon,
  },
  archivo: {
    bg: "bg-stone-50/50 dark:bg-stone-950/20",
    border: "border-stone-200 dark:border-stone-800",
    headerBg: "bg-stone-100 dark:bg-stone-900/40",
    headerText: "text-stone-700 dark:text-stone-300",
    accent: "text-stone-600 dark:text-stone-400",
    icon: ArchiveIcon,
  },
  agenda: {
    bg: "bg-cyan-50/50 dark:bg-cyan-950/20",
    border: "border-cyan-200 dark:border-cyan-800",
    headerBg: "bg-cyan-100 dark:bg-cyan-900/40",
    headerText: "text-cyan-700 dark:text-cyan-300",
    accent: "text-cyan-600 dark:text-cyan-400",
    icon: CalendarIcon,
  },
  calendario: {
    bg: "bg-cyan-50/50 dark:bg-cyan-950/20",
    border: "border-cyan-200 dark:border-cyan-800",
    headerBg: "bg-cyan-100 dark:bg-cyan-900/40",
    headerText: "text-cyan-700 dark:text-cyan-300",
    accent: "text-cyan-600 dark:text-cyan-400",
    icon: CalendarIcon,
  },
  comunicados: {
    bg: "bg-pink-50/50 dark:bg-pink-950/20",
    border: "border-pink-200 dark:border-pink-800",
    headerBg: "bg-pink-100 dark:bg-pink-900/40",
    headerText: "text-pink-700 dark:text-pink-300",
    accent: "text-pink-600 dark:text-pink-400",
    icon: MegaphoneIcon,
  },
  reportes: {
    bg: "bg-indigo-50/50 dark:bg-indigo-950/20",
    border: "border-indigo-200 dark:border-indigo-800",
    headerBg: "bg-indigo-100 dark:bg-indigo-900/40",
    headerText: "text-indigo-700 dark:text-indigo-300",
    accent: "text-indigo-600 dark:text-indigo-400",
    icon: BarChart3Icon,
  },
  auditoria: {
    bg: "bg-slate-50/50 dark:bg-slate-950/20",
    border: "border-slate-200 dark:border-slate-800",
    headerBg: "bg-slate-100 dark:bg-slate-900/40",
    headerText: "text-slate-700 dark:text-slate-300",
    accent: "text-slate-600 dark:text-slate-400",
    icon: SearchIcon,
  },
  configuracion: {
    bg: "bg-gray-50/50 dark:bg-gray-950/20",
    border: "border-gray-200 dark:border-gray-800",
    headerBg: "bg-gray-100 dark:bg-gray-900/40",
    headerText: "text-gray-700 dark:text-gray-300",
    accent: "text-gray-600 dark:text-gray-400",
    icon: SettingsIcon,
  },
  rrhh: {
    bg: "bg-emerald-50/50 dark:bg-emerald-950/20",
    border: "border-emerald-200 dark:border-emerald-800",
    headerBg: "bg-emerald-100 dark:bg-emerald-900/40",
    headerText: "text-emerald-700 dark:text-emerald-300",
    accent: "text-emerald-600 dark:text-emerald-400",
    icon: UsersIcon,
  },
  sucursales: {
    bg: "bg-lime-50/50 dark:bg-lime-950/20",
    border: "border-lime-200 dark:border-lime-800",
    headerBg: "bg-lime-100 dark:bg-lime-900/40",
    headerText: "text-lime-700 dark:text-lime-300",
    accent: "text-lime-600 dark:text-lime-400",
    icon: BuildingIcon,
  },
  banners: {
    bg: "bg-fuchsia-50/50 dark:bg-fuchsia-950/20",
    border: "border-fuchsia-200 dark:border-fuchsia-800",
    headerBg: "bg-fuchsia-100 dark:bg-fuchsia-900/40",
    headerText: "text-fuchsia-700 dark:text-fuchsia-300",
    accent: "text-fuchsia-600 dark:text-fuchsia-400",
    icon: NewspaperIcon,
  },
  contenidos: {
    bg: "bg-sky-50/50 dark:bg-sky-950/20",
    border: "border-sky-200 dark:border-sky-800",
    headerBg: "bg-sky-100 dark:bg-sky-900/40",
    headerText: "text-sky-700 dark:text-sky-300",
    accent: "text-sky-600 dark:text-sky-400",
    icon: BookOpenIcon,
  },
  contactos: {
    bg: "bg-yellow-50/50 dark:bg-yellow-950/20",
    border: "border-yellow-200 dark:border-yellow-800",
    headerBg: "bg-yellow-100 dark:bg-yellow-900/40",
    headerText: "text-yellow-700 dark:text-yellow-300",
    accent: "text-yellow-600 dark:text-yellow-400",
    icon: ContactIcon,
  },
  accesos: {
    bg: "bg-purple-50/50 dark:bg-purple-950/20",
    border: "border-purple-200 dark:border-purple-800",
    headerBg: "bg-purple-100 dark:bg-purple-900/40",
    headerText: "text-purple-700 dark:text-purple-300",
    accent: "text-purple-600 dark:text-purple-400",
    icon: Link2Icon,
  },
  directorio: {
    bg: "bg-zinc-50/50 dark:bg-zinc-950/20",
    border: "border-zinc-200 dark:border-zinc-800",
    headerBg: "bg-zinc-100 dark:bg-zinc-900/40",
    headerText: "text-zinc-700 dark:text-zinc-300",
    accent: "text-zinc-600 dark:text-zinc-400",
    icon: BookMarkedIcon,
  },
  enlaces: {
    bg: "bg-sky-50/50 dark:bg-sky-950/20",
    border: "border-sky-200 dark:border-sky-800",
    headerBg: "bg-sky-100 dark:bg-sky-900/40",
    headerText: "text-sky-700 dark:text-sky-300",
    accent: "text-sky-600 dark:text-sky-400",
    icon: Link2Icon,
  },
}

/** Display name overrides for modules (DB name → UI name) */
const MODULE_DISPLAY_NAMES: Record<string, string> = {
  banners: "Noticias",
  rrhh: "RRHH",
  accesos: "Accesos Directos",
}

const DEFAULT_THEME: ModuleTheme = {
  bg: "bg-gray-50/50 dark:bg-gray-950/20",
  border: "border-gray-200 dark:border-gray-800",
  headerBg: "bg-gray-100 dark:bg-gray-900/40",
  headerText: "text-gray-700 dark:text-gray-300",
  accent: "text-gray-600 dark:text-gray-400",
  icon: PackageIcon,
}

function getModuleTheme(module: string): ModuleTheme {
  return MODULE_THEMES[module.toLowerCase()] ?? DEFAULT_THEME
}

function getModuleDisplayName(module: string): string {
  const lower = module.toLowerCase()
  return MODULE_DISPLAY_NAMES[lower] ?? capitalizeFirst(module)
}

function parsePermissionName(name: string): { action: string; module: string } {
  const lower = name.trim().toLowerCase()
  const spaceIndex = lower.indexOf(" ")

  if (spaceIndex === -1) {
    return { action: lower, module: "general" }
  }

  return {
    action: lower.slice(0, spaceIndex),
    module: lower.slice(spaceIndex + 1),
  }
}

function capitalizeFirst(s: string): string {
  if (s.length === 0) return s
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function groupPermissions(permissions: Permission[]): PermissionGroup[] {
  const map = new Map<string, { action: string; permission: Permission }[]>()

  for (const perm of permissions) {
    const { action, module } = parsePermissionName(perm.name)

    if (!map.has(module)) {
      map.set(module, [])
    }

    map.get(module)!.push({ action, permission: perm })
  }

  const groups: PermissionGroup[] = []

  for (const [module, actions] of map) {
    actions.sort((a, b) => {
      const ai = ACTION_ORDER.indexOf(a.action)
      const bi = ACTION_ORDER.indexOf(b.action)
      const aIdx = ai === -1 ? 999 : ai
      const bIdx = bi === -1 ? 999 : bi

      return aIdx - bIdx
    })

    groups.push({ module, actions })
  }

  groups.sort((a, b) => a.module.localeCompare(b.module, "es"))

  return groups
}

function PermissionCell({
  hasPermission,
  canEdit,
  loading,
  onToggle,
  tooltip,
}: {
  hasPermission: boolean
  canEdit: boolean
  loading: boolean
  onToggle: () => void
  tooltip: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          disabled={!canEdit || loading}
          onClick={onToggle}
          className={cn(
            "inline-flex h-9 w-9 items-center justify-center rounded-lg border-2 transition-all duration-200 shadow-sm",
            canEdit && "cursor-pointer hover:scale-110 hover:shadow-md active:scale-95",
            !canEdit && "cursor-default",
            loading && "opacity-50",
            hasPermission
              ? "border-emerald-400 bg-emerald-100 text-emerald-600 dark:border-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
              : "border-red-300 bg-red-50 text-red-400 dark:border-red-700 dark:bg-red-950/30 dark:text-red-500",
          )}
        >
          {loading ? (
            <Loader2Icon className="h-4 w-4 animate-spin" />
          ) : hasPermission ? (
            <CheckIcon className="h-4 w-4" strokeWidth={3} />
          ) : (
            <XIcon className="h-4 w-4" strokeWidth={2.5} />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">{tooltip}</TooltipContent>
    </Tooltip>
  )
}

function ModuleCard({
  group,
  roles,
  rolePermissionSets,
  canEdit,
  loadingCells,
  onToggle,
}: {
  group: PermissionGroup
  roles: Role[]
  rolePermissionSets: Map<string, Set<string>>
  canEdit: boolean
  loadingCells: Set<string>
  onToggle: (role: Role, permissionId: string) => void
}) {
  const theme = getModuleTheme(group.module)
  const ModuleIcon = theme.icon

  return (
    <div className={cn("rounded-xl border-2 overflow-hidden shadow-sm", theme.border, theme.bg)}>
      {/* Module header */}
      <div className={cn("flex items-center gap-2.5 px-4 py-3", theme.headerBg)}>
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-white/60 dark:bg-black/20 shadow-sm")}>
          <ModuleIcon className={cn("h-4.5 w-4.5", theme.accent)} />
        </div>
        <div>
          <h4 className={cn("text-sm font-bold uppercase tracking-wide", theme.headerText)}>
            {getModuleDisplayName(group.module)}
          </h4>
          <p className="text-[10px] text-muted-foreground">
            {group.actions.length} {group.actions.length === 1 ? "permiso" : "permisos"}
          </p>
        </div>
      </div>

      {/* Permissions table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border/30">
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[140px]">
                Rol
              </th>
              {group.actions.map(({ action, permission }) => {
                const Icon = ACTION_ICONS[action]
                const label = ACTION_LABELS[action] ?? capitalizeFirst(action)

                return (
                  <th key={permission.id} className="px-3 py-2.5 text-center min-w-[70px]">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="inline-flex flex-col items-center gap-1">
                          {Icon ? (
                            <Icon className={cn("h-4 w-4", theme.accent)} />
                          ) : null}
                          <span className={cn("text-[10px] font-semibold leading-none", theme.accent)}>
                            {label}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>{capitalizeFirst(permission.name)}</TooltipContent>
                    </Tooltip>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {roles.map((role, idx) => {
              const permSet = rolePermissionSets.get(role.id) ?? new Set<string>()

              return (
                <tr
                  key={role.id}
                  className={cn(
                    "border-b border-border/15 transition-colors",
                    idx % 2 === 1 && "bg-white/40 dark:bg-white/5",
                    "hover:bg-white/70 dark:hover:bg-white/10",
                  )}
                >
                  <td className="px-4 py-2.5">
                    <span className="font-semibold capitalize text-foreground/90">{role.name}</span>
                  </td>
                  {group.actions.map(({ permission }) => {
                    const hasPerm = permSet.has(permission.id)
                    const cellKey = `${role.id}:${permission.id}`
                    const isLoading =
                      loadingCells.has(cellKey) ||
                      loadingCells.has(`${role.id}:all`) ||
                      loadingCells.has(`${role.id}:none`)

                    return (
                      <td key={permission.id} className="px-3 py-2.5 text-center">
                        <div className="flex items-center justify-center">
                          <PermissionCell
                            hasPermission={hasPerm}
                            canEdit={canEdit}
                            loading={isLoading}
                            onToggle={() => onToggle(role, permission.id)}
                            tooltip={`${hasPerm ? "Quitar" : "Asignar"}: ${capitalizeFirst(permission.name)}`}
                          />
                        </div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function PermissionsGrid({
  roles,
  permissions,
  canEdit,
  onRoleUpdated,
}: PermissionsGridProps) {
  const [loadingCells, setLoadingCells] = useState<Set<string>>(new Set())
  const [, startTransition] = useTransition()

  const groups = useMemo(() => groupPermissions(permissions), [permissions])

  const rolePermissionSets = useMemo(() => {
    const map = new Map<string, Set<string>>()

    for (const role of roles) {
      map.set(role.id, new Set(role.permissions.map((p) => p.id)))
    }

    return map
  }, [roles])

  const togglePermission = useCallback(
    (role: Role, permissionId: string) => {
      const cellKey = `${role.id}:${permissionId}`

      if (loadingCells.has(cellKey)) return

      setLoadingCells((prev) => new Set(prev).add(cellKey))

      const currentIds = new Set(role.permissions.map((p) => p.id))
      const newIds = new Set(currentIds)

      if (newIds.has(permissionId)) {
        newIds.delete(permissionId)
      } else {
        newIds.add(permissionId)
      }

      startTransition(async () => {
        try {
          const result = await reemplazarPermisosDeRol(role.id, [...newIds])

          if (!result.success || !result.data) {
            toast.error(result.message)
            return
          }

          onRoleUpdated(result.data as Role)
        } catch {
          toast.error("Error al actualizar permisos.")
        } finally {
          setLoadingCells((prev) => {
            const next = new Set(prev)
            next.delete(cellKey)
            return next
          })
        }
      })
    },
    [loadingCells, onRoleUpdated],
  )

  const handleSelectAll = useCallback(
    (role: Role) => {
      const allIds = permissions.map((p) => p.id)
      const cellKey = `${role.id}:all`

      if (loadingCells.has(cellKey)) return
      setLoadingCells((prev) => new Set(prev).add(cellKey))

      startTransition(async () => {
        try {
          const result = await reemplazarPermisosDeRol(role.id, allIds)

          if (!result.success || !result.data) {
            toast.error(result.message)
            return
          }

          onRoleUpdated(result.data as Role)
          toast.success(`Todos los permisos asignados a "${role.name}".`)
        } catch {
          toast.error("Error al actualizar permisos.")
        } finally {
          setLoadingCells((prev) => {
            const next = new Set(prev)
            next.delete(cellKey)
            return next
          })
        }
      })
    },
    [permissions, loadingCells, onRoleUpdated],
  )

  const handleClearAll = useCallback(
    (role: Role) => {
      const cellKey = `${role.id}:none`

      if (loadingCells.has(cellKey)) return
      setLoadingCells((prev) => new Set(prev).add(cellKey))

      startTransition(async () => {
        try {
          const result = await reemplazarPermisosDeRol(role.id, [])

          if (!result.success || !result.data) {
            toast.error(result.message)
            return
          }

          onRoleUpdated(result.data as Role)
          toast.success(`Permisos removidos de "${role.name}".`)
        } catch {
          toast.error("Error al actualizar permisos.")
        } finally {
          setLoadingCells((prev) => {
            const next = new Set(prev)
            next.delete(cellKey)
            return next
          })
        }
      })
    },
    [loadingCells, onRoleUpdated],
  )

  if (roles.length === 0) {
    return (
      <div className="rounded-xl border border-border/40 bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">No hay roles registrados.</p>
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-5">
        {/* Header & legend */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Matriz de permisos por modulo
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg border-2 border-emerald-400 bg-emerald-100 dark:border-emerald-600 dark:bg-emerald-950/50">
                  <CheckIcon className="h-3 w-3 text-emerald-600 dark:text-emerald-400" strokeWidth={3} />
                </span>
                Permitido
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg border-2 border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950/30">
                  <XIcon className="h-3 w-3 text-red-400 dark:text-red-500" strokeWidth={2.5} />
                </span>
                Denegado
              </span>
            </div>

            {/* Quick actions for all roles */}
            {canEdit && (
              <div className="flex items-center gap-1 border-l border-border/40 pl-4">
                {roles.map((role) => {
                  const permSet = rolePermissionSets.get(role.id) ?? new Set<string>()
                  const allAssigned = permSet.size === permissions.length

                  return (
                    <div key={role.id} className="flex items-center gap-1">
                      <span className="text-[10px] font-semibold capitalize text-muted-foreground mr-1">
                        {role.name}:
                      </span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                            disabled={allAssigned}
                            onClick={() => handleSelectAll(role)}
                          >
                            <ShieldCheckIcon className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Asignar todos a {role.name}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                            disabled={permSet.size === 0}
                            onClick={() => handleClearAll(role)}
                          >
                            <ShieldOffIcon className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Quitar todos de {role.name}</TooltipContent>
                      </Tooltip>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Module cards grid */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {groups.map((group) => (
            <ModuleCard
              key={group.module}
              group={group}
              roles={roles}
              rolePermissionSets={rolePermissionSets}
              canEdit={canEdit}
              loadingCells={loadingCells}
              onToggle={togglePermission}
            />
          ))}
        </div>
      </div>
    </TooltipProvider>
  )
}
