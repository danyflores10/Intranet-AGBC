"use client"

import { useMemo, useState } from "react"
import { EyeIcon, EyeOffIcon } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch, type Resolver } from "react-hook-form"

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
import { userCreateSchema, userUpdateSchema } from "@/lib/validations/usuarios"
import type { RoleOption, UserCreatePayload, UserUpdatePayload } from "@/types/users"

type UserFormValues = {
  firstName: string
  lastNamePaternal: string
  lastNameMaternal: string
  email: string
  institutionalEmail: string
  nationalId: string
  dateOfBirth: string
  isActive: boolean
  password: string
  roleIds: string[]
}

type UserUpsertFormProps = {
  mode: "create" | "edit"
  roles: RoleOption[]
  defaultFirstName?: string
  defaultLastNamePaternal?: string
  defaultLastNameMaternal?: string
  defaultEmail?: string
  defaultInstitutionalEmail?: string
  defaultNationalId?: string
  defaultDateOfBirth?: string
  defaultIsActive?: boolean
  defaultRoleIds?: string[]
  submitLabel: string
  pending?: boolean
  onSubmit: (payload: UserCreatePayload | UserUpdatePayload) => Promise<void>
}

export function UserUpsertForm({
  mode,
  roles,
  defaultFirstName = "",
  defaultLastNamePaternal = "",
  defaultLastNameMaternal = "",
  defaultEmail = "",
  defaultInstitutionalEmail = "",
  defaultNationalId = "",
  defaultDateOfBirth = "",
  defaultIsActive = true,
  defaultRoleIds = [],
  submitLabel,
  pending = false,
  onSubmit,
}: UserUpsertFormProps) {
  const [showPassword, setShowPassword] = useState(false)

  const resolver = zodResolver(mode === "create" ? userCreateSchema : userUpdateSchema) as Resolver<UserFormValues>

  const form = useForm<UserFormValues>({
    resolver,
    defaultValues: {
      firstName: defaultFirstName,
      lastNamePaternal: defaultLastNamePaternal,
      lastNameMaternal: defaultLastNameMaternal,
      email: defaultEmail,
      institutionalEmail: defaultInstitutionalEmail,
      nationalId: defaultNationalId,
      dateOfBirth: defaultDateOfBirth,
      isActive: defaultIsActive,
      password: "",
      roleIds: defaultRoleIds,
    },
  })

  const roleIds = useWatch({
    control: form.control,
    name: "roleIds",
  })

  const isActive = useWatch({
    control: form.control,
    name: "isActive",
  })

  const sortedRoles = useMemo(
    () => [...roles].sort((a, b) => a.name.localeCompare(b.name, "es")),
    [roles],
  )

  const selectedRoleId = useMemo(() => roleIds?.[0] ?? null, [roleIds])

  function toggleRole(roleId: string) {
    const currentRoleId = form.getValues("roleIds")?.[0]
    const next = currentRoleId === roleId ? [] : [roleId]

    form.setValue("roleIds", next, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  function clearRoles() {
    form.setValue("roleIds", [], {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  const handleSubmit = form.handleSubmit(async (values) => {
    const basePayload = {
      firstName: values.firstName.trim(),
      lastNamePaternal: values.lastNamePaternal.trim(),
      lastNameMaternal: values.lastNameMaternal.trim(),
      email: values.email.trim().toLowerCase(),
      institutionalEmail: values.institutionalEmail.trim().toLowerCase(),
      nationalId: values.nationalId.trim().toUpperCase(),
      dateOfBirth: values.dateOfBirth,
      isActive: Boolean(values.isActive),
      roleIds: values.roleIds?.slice(0, 1) ?? [],
    }

    if (mode === "create") {
      await onSubmit({
        ...basePayload,
        password: values.password,
      })
      return
    }

    await onSubmit({
      ...basePayload,
      ...(values.password.trim().length > 0 ? { password: values.password.trim() } : {}),
    })
  })

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* ── Datos personales ── */}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FFB300]/10 text-xs font-bold text-[#FFB300]">1</span>
          Datos personales
        </h3>
        <p className="text-xs text-muted-foreground ml-8">Información básica del usuario</p>
      </div>
      <FieldGroup className="grid grid-cols-1 gap-4 md:grid-cols-3 rounded-lg border border-border/40 p-4 bg-muted/20">
        <Field>
          <FieldLabel htmlFor="user-first-name">Nombre *</FieldLabel>
          <Input
            id="user-first-name"
            placeholder="Ej: Maria"
            autoFocus
            {...form.register("firstName")}
          />
          <FieldError errors={[form.formState.errors.firstName]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="user-last-name-paternal">Apellido paterno *</FieldLabel>
          <Input
            id="user-last-name-paternal"
            placeholder="Ej: Perez"
            {...form.register("lastNamePaternal")}
          />
          <FieldError errors={[form.formState.errors.lastNamePaternal]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="user-last-name-maternal">Apellido materno</FieldLabel>
          <Input
            id="user-last-name-maternal"
            placeholder="Ej: Gomez"
            {...form.register("lastNameMaternal")}
          />
          <FieldError errors={[form.formState.errors.lastNameMaternal]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="user-national-id">CI *</FieldLabel>
          <Input
            id="user-national-id"
            placeholder="Ej: 1234567LP"
            {...form.register("nationalId")}
          />
          <FieldError errors={[form.formState.errors.nationalId]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="user-date-of-birth">Fecha de nacimiento *</FieldLabel>
          <Input
            id="user-date-of-birth"
            type="date"
            {...form.register("dateOfBirth")}
          />
          <FieldError errors={[form.formState.errors.dateOfBirth]} />
        </Field>
      </FieldGroup>

      {/* ── Correos electrónicos ── */}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FFB300]/10 text-xs font-bold text-[#FFB300]">2</span>
          Correos electrónicos
        </h3>
        <p className="text-xs text-muted-foreground ml-8">Correo personal e institucional del usuario</p>
      </div>
      <FieldGroup className="grid grid-cols-1 gap-4 md:grid-cols-2 rounded-lg border border-border/40 p-4 bg-muted/20">
        <Field>
          <FieldLabel htmlFor="user-email">Correo personal</FieldLabel>
          <Input
            id="user-email"
            type="email"
            placeholder="correo.personal@gmail.com"
            {...form.register("email")}
          />
          <FieldError errors={[form.formState.errors.email]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="user-institutional-email">Correo institucional *</FieldLabel>
          <Input
            id="user-institutional-email"
            type="email"
            placeholder="usuario@correos.gob.bo"
            {...form.register("institutionalEmail")}
          />
          <FieldDescription>
            Se aceptan dominios institucionales autorizados.
          </FieldDescription>
          <FieldError errors={[form.formState.errors.institutionalEmail]} />
        </Field>
      </FieldGroup>

      {/* ── Seguridad ── */}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FFB300]/10 text-xs font-bold text-[#FFB300]">3</span>
          Seguridad
        </h3>
        <p className="text-xs text-muted-foreground ml-8">Contraseña y estado de la cuenta</p>
      </div>
      <FieldGroup className="grid grid-cols-1 gap-4 md:grid-cols-2 rounded-lg border border-border/40 p-4 bg-muted/20">
        <Field>
          <FieldLabel htmlFor="user-password">
            {mode === "create" ? "Contraseña temporal *" : "Nueva contraseña (opcional)"}
          </FieldLabel>
          <div className="relative">
            <Input
              id="user-password"
              type={showPassword ? "text" : "password"}
              placeholder={mode === "create" ? "Mínimo 8 caracteres" : "Dejar vacío para no cambiar"}
              {...form.register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              tabIndex={-1}
            >
              {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            </button>
          </div>
          <FieldError errors={[form.formState.errors.password]} />
        </Field>

        <Field className="rounded-lg border border-border/40 px-3 py-3 bg-background">
          <FieldLabel htmlFor="user-is-active" className="cursor-pointer">
            Estado de la cuenta
          </FieldLabel>
          <FieldDescription>
            Si está desactivado, el usuario quedará inhabilitado.
          </FieldDescription>
          <div className="mt-2 flex items-center gap-2">
            <Checkbox
              id="user-is-active"
              checked={Boolean(isActive)}
              onCheckedChange={(checked) => {
                form.setValue("isActive", checked === true, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }}
              disabled={pending}
            />
            <span className={`text-sm font-medium ${isActive ? "text-green-600" : "text-red-500"}`}>
              {isActive ? "Activo" : "Inactivo"}
            </span>
          </div>
          <FieldError errors={[form.formState.errors.isActive]} />
        </Field>
      </FieldGroup>

      {/* ── Rol ── */}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FFB300]/10 text-xs font-bold text-[#FFB300]">4</span>
          Rol del usuario
        </h3>
        <p className="text-xs text-muted-foreground ml-8">Selecciona el nivel de acceso</p>
      </div>
      <FieldSet data-slot="checkbox-group" className="rounded-lg border border-border/40 p-4 bg-muted/20">
          <div className="flex items-center justify-between mb-3">
            <FieldDescription className="text-xs">
              Solo puedes asignar un rol por usuario.
            </FieldDescription>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearRoles}
              disabled={pending || !selectedRoleId}
            >
              Limpiar
            </Button>
          </div>

          <div className="space-y-2">
            {sortedRoles.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay roles registrados todavía.</p>
            ) : (
              sortedRoles.map((role) => {
                const selected = selectedRoleId === role.id
                const checkboxId = `role-${role.id}`

                return (
                  <Field
                    key={role.id}
                    orientation="horizontal"
                    className={`rounded-lg border px-4 py-3 transition-colors cursor-pointer ${selected ? "border-[#FFB300] bg-[#FFB300]/5" : "border-border/40 hover:bg-muted/30"}`}
                  >
                    <Checkbox
                      id={checkboxId}
                      checked={selected}
                      onCheckedChange={() => toggleRole(role.id)}
                      disabled={pending}
                    />
                    <div className="flex flex-col">
                      <FieldLabel htmlFor={checkboxId} className="cursor-pointer font-medium">{role.name}</FieldLabel>
                      <span className="text-xs text-muted-foreground">
                        {role.name.toLowerCase() === "administrador" ? "Acceso total al panel de administración" : "Acceso de lectura a comunicados y eventos"}
                      </span>
                    </div>
                  </Field>
                )
              })
            )}
          </div>
          <FieldError errors={[form.formState.errors.roleIds]} />
        </FieldSet>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={pending}
          className="border-0 bg-linear-to-r from-[#FFB300] to-[#FF8800] font-semibold text-[#1a1000] shadow-md shadow-[#FFB300]/20"
        >
          {pending ? "Guardando..." : submitLabel}
        </Button>
      </div>
    </form>
  )
}
