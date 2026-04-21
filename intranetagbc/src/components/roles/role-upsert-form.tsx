"use client"

import { useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import {
  CalendarIcon,
  CheckCheckIcon,
  EraserIcon,
  FileArchiveIcon,
  FilesIcon,
  FolderIcon,
  FolderKeyIcon,
  MegaphoneIcon,
  ShieldCheckIcon,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { Permission, RoleUpsertPayload } from "@/types/roles"
import {
  roleUpsertSchema,
  type RoleUpsertInput,
  type RoleUpsertOutput,
} from "@/lib/validations/roles"

const ACTION_ORDER = ["ver", "crear", "editar", "eliminar"] as const
type ActionKey = (typeof ACTION_ORDER)[number]

const ACTION_LABELS: Record<ActionKey, string> = {
  ver: "Ver",
  crear: "Crear",
  editar: "Editar",
  eliminar: "Eliminar",
}

const ACTION_BADGE_STYLES: Record<ActionKey, string> = {
  ver: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/35 dark:bg-emerald-500/10 dark:text-emerald-300",
  crear: "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-500/35 dark:bg-cyan-500/10 dark:text-cyan-300",
  editar: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/35 dark:bg-amber-500/10 dark:text-amber-300",
  eliminar: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/35 dark:bg-rose-500/10 dark:text-rose-300",
}

const MODULE_LABELS: Record<string, string> = {
  accesos: "Accesos Directos",
  agenda: "Agenda",
  archivo: "Archivo",
  auditoria: "Auditoria",
  banners: "Noticias",
  calendario: "Calendario",
  comunicados: "Comunicados",
  configuracion: "Configuracion",
  contenidos: "Contenidos",
  correspondencia: "Correspondencia",
  directorio: "Directorio",
  documentos: "Documentos",
  enlaces: "Enlaces",
  logistica: "Logistica",
  reportes: "Reportes",
  roles: "Roles",
  rrhh: "RRHH",
  soporte: "Soporte",
  sucursales: "Sucursales",
  tramites: "Tramites",
  usuarios: "Usuarios",
}

const MODULE_ICONS: Record<string, LucideIcon> = {
  accesos: FolderKeyIcon,
  agenda: CalendarIcon,
  archivo: FileArchiveIcon,
  auditoria: ShieldCheckIcon,
  banners: MegaphoneIcon,
  calendario: CalendarIcon,
  comunicados: MegaphoneIcon,
  documentos: FilesIcon,
}

type ModuleGroup = {
  moduleKey: string
  moduleLabel: string
  permissions: Permission[]
}

type PermissionMockGroup = {
  moduleKey: string
  moduleLabel: string
  permissions: Array<{ id: string; action: ActionKey; name: string }>
}

export const mockData: PermissionMockGroup[] = [
  {
    moduleKey: "accesos",
    moduleLabel: "Accesos Directos",
    permissions: [
      { id: "mock-accesos-ver", action: "ver", name: "ver accesos" },
      { id: "mock-accesos-crear", action: "crear", name: "crear accesos" },
      { id: "mock-accesos-editar", action: "editar", name: "editar accesos" },
      { id: "mock-accesos-eliminar", action: "eliminar", name: "eliminar accesos" },
    ],
  },
  {
    moduleKey: "agenda",
    moduleLabel: "Agenda",
    permissions: [
      { id: "mock-agenda-ver", action: "ver", name: "ver agenda" },
      { id: "mock-agenda-crear", action: "crear", name: "crear agenda" },
      { id: "mock-agenda-editar", action: "editar", name: "editar agenda" },
      { id: "mock-agenda-eliminar", action: "eliminar", name: "eliminar agenda" },
    ],
  },
  {
    moduleKey: "archivo",
    moduleLabel: "Archivo",
    permissions: [
      { id: "mock-archivo-ver", action: "ver", name: "ver archivo" },
      { id: "mock-archivo-crear", action: "crear", name: "crear archivo" },
      { id: "mock-archivo-editar", action: "editar", name: "editar archivo" },
      { id: "mock-archivo-eliminar", action: "eliminar", name: "eliminar archivo" },
    ],
  },
  {
    moduleKey: "banners",
    moduleLabel: "Noticias",
    permissions: [
      { id: "mock-noticias-ver", action: "ver", name: "ver banners" },
      { id: "mock-noticias-crear", action: "crear", name: "crear banners" },
      { id: "mock-noticias-editar", action: "editar", name: "editar banners" },
      { id: "mock-noticias-eliminar", action: "eliminar", name: "eliminar banners" },
    ],
  },
]

type RoleUpsertFormProps = {
  permissions: Permission[]
  defaultName?: string
  defaultPermissionIds?: string[]
  submitLabel: string
  pending?: boolean
  onSubmit: (payload: RoleUpsertPayload) => Promise<void>
}

function parsePermissionName(name: string): { action: string; module: string } {
  const normalized = name.trim().toLowerCase()

  if (!normalized) {
    return { action: "", module: "general" }
  }

  const [action, ...rest] = normalized.split(" ")
  const moduleName = rest.join(" ").trim() || "general"

  return { action, module: moduleName }
}

function toTitleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ")
}

function getModuleLabel(moduleKey: string): string {
  return MODULE_LABELS[moduleKey] ?? toTitleCase(moduleKey)
}

function getActionLabel(action: string): string {
  if (ACTION_ORDER.includes(action as ActionKey)) {
    return ACTION_LABELS[action as ActionKey]
  }

  return toTitleCase(action)
}

function getActionBadgeClass(action: string): string {
  if (ACTION_ORDER.includes(action as ActionKey)) {
    return ACTION_BADGE_STYLES[action as ActionKey]
  }

  return "border-border bg-muted text-muted-foreground"
}

function sortPermissionsByAction(a: Permission, b: Permission): number {
  const aAction = parsePermissionName(a.name).action
  const bAction = parsePermissionName(b.name).action

  const aOrder = ACTION_ORDER.indexOf(aAction as ActionKey)
  const bOrder = ACTION_ORDER.indexOf(bAction as ActionKey)
  const normalizedAOrder = aOrder === -1 ? 99 : aOrder
  const normalizedBOrder = bOrder === -1 ? 99 : bOrder

  if (normalizedAOrder !== normalizedBOrder) {
    return normalizedAOrder - normalizedBOrder
  }

  return a.name.localeCompare(b.name, "es")
}

function groupPermissionsByModule(permissions: Permission[]): ModuleGroup[] {
  const modules = new Map<string, Permission[]>()

  for (const permission of permissions) {
    const { module } = parsePermissionName(permission.name)

    if (!modules.has(module)) {
      modules.set(module, [])
    }

    modules.get(module)!.push(permission)
  }

  return [...modules.entries()]
    .map(([moduleKey, modulePermissions]) => ({
      moduleKey,
      moduleLabel: getModuleLabel(moduleKey),
      permissions: modulePermissions.sort(sortPermissionsByAction),
    }))
    .sort((a, b) => a.moduleLabel.localeCompare(b.moduleLabel, "es"))
}

export function RoleUpsertForm({
  permissions,
  defaultName = "",
  defaultPermissionIds = [],
  submitLabel,
  pending = false,
  onSubmit,
}: RoleUpsertFormProps) {
  const form = useForm<RoleUpsertInput, unknown, RoleUpsertOutput>({
    resolver: zodResolver(roleUpsertSchema),
    defaultValues: {
      name: defaultName,
      permissionIds: defaultPermissionIds,
    },
  })

  const permissionIds = useWatch({
    control: form.control,
    name: "permissionIds",
  })

  const groupedPermissions = useMemo(
    () => groupPermissionsByModule(permissions),
    [permissions],
  )

  const selectedPermissionIds = useMemo(
    () => new Set(permissionIds ?? []),
    [permissionIds],
  )

  const selectedCount = selectedPermissionIds.size
  const totalPermissions = permissions.length

  function togglePermission(permissionId: string, checked: boolean) {
    const current = form.getValues("permissionIds")
    const next = new Set(current)

    if (checked) {
      next.add(permissionId)
    } else {
      next.delete(permissionId)
    }

    form.setValue("permissionIds", [...next], {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  function applyPermissionSelection(permissionIdsToChange: string[], checked: boolean) {
    const current = form.getValues("permissionIds")
    const next = new Set(current)

    if (checked) {
      for (const permissionId of permissionIdsToChange) {
        next.add(permissionId)
      }
    } else {
      for (const permissionId of permissionIdsToChange) {
        next.delete(permissionId)
      }
    }

    form.setValue("permissionIds", [...next], {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  function selectAllPermissions() {
    form.setValue(
      "permissionIds",
      permissions.map((permission) => permission.id),
      { shouldDirty: true, shouldValidate: true },
    )
  }

  function clearPermissions() {
    form.setValue("permissionIds", [], {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  function selectModulePermissions(modulePermissionIds: string[]) {
    applyPermissionSelection(modulePermissionIds, true)
  }

  function clearModulePermissions(modulePermissionIds: string[]) {
    applyPermissionSelection(modulePermissionIds, false)
  }

  const handleSubmit = form.handleSubmit(async (values) => {
    const payload: RoleUpsertPayload = {
      name: values.name.trim(),
      permissionIds: values.permissionIds ?? [],
    }

    await onSubmit(payload)
  })

  return (
    <form onSubmit={handleSubmit} className="mt-5 flex max-h-[68vh] flex-col">
      <div className="space-y-5 overflow-y-auto pr-1">
        <div className="space-y-2">
          <label htmlFor="role-name" className="text-sm font-semibold text-foreground">
            Nombre del rol
          </label>
          <Input
            id="role-name"
            placeholder="Ej: jefe_rrhh"
            {...form.register("name")}
            autoFocus
            className="h-11 rounded-xl border-border bg-background px-3.5 text-sm shadow-sm transition-all focus-visible:border-[#FFB300] focus-visible:ring-4 focus-visible:ring-[#FFB300]/25"
          />
          {form.formState.errors.name ? (
            <p className="text-xs font-medium text-red-600">
              {form.formState.errors.name.message}
            </p>
          ) : null}
        </div>

        <section className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-foreground">Permisos</h4>
              <p className="text-sm text-muted-foreground">
                Selecciona los permisos que estaran disponibles para este rol.
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedCount} de {totalPermissions} permisos seleccionados
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 rounded-lg border-border bg-background text-foreground hover:bg-muted"
                onClick={selectAllPermissions}
                disabled={pending || permissions.length === 0}
              >
                <CheckCheckIcon className="mr-1.5 h-3.5 w-3.5" />
                Todos
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={clearPermissions}
                disabled={pending || selectedCount === 0}
              >
                <EraserIcon className="mr-1.5 h-3.5 w-3.5" />
                Limpiar
              </Button>
            </div>
          </div>

          {groupedPermissions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
              <p className="text-sm text-muted-foreground">No hay permisos registrados todavia.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {groupedPermissions.map((group) => {
                const Icon = MODULE_ICONS[group.moduleKey] ?? FolderIcon
                const modulePermissionIds = group.permissions.map((permission) => permission.id)
                const selectedInModule = modulePermissionIds.filter((id) =>
                  selectedPermissionIds.has(id),
                ).length
                const allModuleSelected = selectedInModule === modulePermissionIds.length

                return (
                  <div
                    key={group.moduleKey}
                    className="rounded-xl border border-border bg-muted/30 p-3.5 shadow-xs"
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground">
                          <Icon className="h-4 w-4" />
                        </span>
                        <div>
                          <h5 className="text-sm font-semibold text-foreground">
                            {group.moduleLabel}
                          </h5>
                          <p className="text-xs text-muted-foreground">
                            {selectedInModule} de {modulePermissionIds.length} seleccionados
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 rounded-md px-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                          onClick={() => selectModulePermissions(modulePermissionIds)}
                          disabled={pending || allModuleSelected}
                        >
                          Todo
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 rounded-md px-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                          onClick={() => clearModulePermissions(modulePermissionIds)}
                          disabled={pending || selectedInModule === 0}
                        >
                          Limpiar
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {group.permissions.map((permission) => {
                        const { action } = parsePermissionName(permission.name)
                        const checked = selectedPermissionIds.has(permission.id)
                        const checkboxId = `permission-${permission.id}`

                        return (
                          <label
                            key={permission.id}
                            htmlFor={checkboxId}
                            className={cn(
                              "flex cursor-pointer items-center gap-2.5 rounded-lg border px-2.5 py-2 transition-colors",
                              checked
                                ? "border-[#FFB300]/40 bg-[#FFB300]/10"
                                : "border-border bg-background hover:border-border/80 hover:bg-muted/60",
                            )}
                          >
                            <Checkbox
                              id={checkboxId}
                              checked={checked}
                              onCheckedChange={(value) =>
                                togglePermission(permission.id, value === true)
                              }
                              disabled={pending}
                              className="border-border data-checked:border-[#FFB300] data-checked:bg-[#FFB300] data-checked:text-[#1a1000]"
                            />
                            <div className="min-w-0 space-y-1">
                              <span
                                className={cn(
                                  "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                                  getActionBadgeClass(action),
                                )}
                              >
                                {getActionLabel(action)}
                              </span>
                              <p className="truncate text-[11px] text-muted-foreground">
                                {permission.name}
                              </p>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>

      <div className="sticky bottom-0 mt-5 border-t border-border bg-background/95 px-1 pt-4 backdrop-blur supports-[backdrop-filter]:bg-background/85">
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={pending}
            className="h-10 rounded-xl bg-linear-to-r from-[#FFB300] to-[#FF8800] border-0 px-5 font-semibold text-[#1a1000] shadow-md shadow-[#FFB300]/20"
          >
            {pending ? "Guardando..." : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  )
}
