"use client"

import { useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type { Permission, RoleUpsertPayload } from "@/types/roles"
import {
  roleUpsertSchema,
  type RoleUpsertInput,
  type RoleUpsertOutput,
} from "@/lib/validations/roles"

type RoleUpsertFormProps = {
  permissions: Permission[]
  defaultName?: string
  defaultPermissionIds?: string[]
  submitLabel: string
  pending?: boolean
  onSubmit: (payload: RoleUpsertPayload) => Promise<void>
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

  const sortedPermissions = useMemo(
    () => [...permissions].sort((a, b) => a.name.localeCompare(b.name, "es")),
    [permissions],
  )

  const selectedPermissionIds = useMemo(
    () => new Set(permissionIds ?? []),
    [permissionIds],
  )

  function togglePermission(permissionId: string) {
    const current = form.getValues("permissionIds")
    const next = new Set(current)

    if (next.has(permissionId)) {
      next.delete(permissionId)
    } else {
      next.add(permissionId)
    }

    form.setValue("permissionIds", [...next], {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  function selectAllPermissions() {
    form.setValue(
      "permissionIds",
      sortedPermissions.map((permission) => permission.id),
      { shouldDirty: true, shouldValidate: true },
    )
  }

  function clearPermissions() {
    form.setValue("permissionIds", [], {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  const handleSubmit = form.handleSubmit(async (values) => {
    const payload: RoleUpsertPayload = {
      name: values.name.trim(),
      permissionIds: values.permissionIds ?? [],
    }

    await onSubmit(payload)
  })

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="role-name">Role name</FieldLabel>
          <Input
            id="role-name"
            placeholder="Ej: jefe_rrhh"
            {...form.register("name")}
            autoFocus
          />
          <FieldError errors={[form.formState.errors.name]} />
        </Field>

        <FieldSet data-slot="checkbox-group" className="space-y-3">
          <div className="flex items-center justify-between">
            <FieldLabel>Permisos</FieldLabel>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={selectAllPermissions}
                disabled={pending || sortedPermissions.length === 0}
              >
                Todos
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearPermissions}
                disabled={pending || selectedPermissionIds.size === 0}
              >
                Limpiar
              </Button>
            </div>
          </div>

          <FieldDescription>
            Selecciona los permisos que estaran disponibles para este role.
          </FieldDescription>

          <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-border/60 p-3">
            {sortedPermissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay permisos registrados todavia.
              </p>
            ) : (
              sortedPermissions.map((permission) => {
                const selected = selectedPermissionIds.has(permission.id)
                const checkboxId = `permission-${permission.id}`

                return (
                  <Field
                    key={permission.id}
                    orientation="horizontal"
                    className="rounded-md border border-border/40 px-3 py-2 hover:bg-muted/30"
                  >
                    <Checkbox
                      id={checkboxId}
                      checked={selected}
                      onCheckedChange={() => togglePermission(permission.id)}
                      disabled={pending}
                    />
                    <FieldLabel htmlFor={checkboxId}>{permission.name}</FieldLabel>
                  </Field>
                )
              })
            )}
          </div>
        </FieldSet>
      </FieldGroup>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={pending}
          className="bg-linear-to-r from-[#FFB300] to-[#FF8800] border-0 font-semibold text-[#1a1000] shadow-md shadow-[#FFB300]/20"
        >
          {pending ? "Guardando..." : submitLabel}
        </Button>
      </div>
    </form>
  )
}
