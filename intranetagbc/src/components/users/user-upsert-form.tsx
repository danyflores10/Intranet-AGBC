"use client"

import { useMemo, useState, useEffect } from "react"
import { EyeIcon, EyeOffIcon, RefreshCwIcon, LockIcon, ShieldAlertIcon, CheckCircle2Icon, Loader2Icon } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch, type Resolver } from "react-hook-form"
import toast from "react-hot-toast"

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
import { verificarPasswordAdmin, revelarPasswordUsuario } from "@/actions/usuarios"
import type { RoleOption, UserCreatePayload, UserUpdatePayload } from "@/types/users"

function generarPasswordSegura(): string {
  const prefixes = ["Agbc", "Correos", "Bolivia", "Postal", "AdminAGBC"]
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const year = 2026
  const symbols = ["!", "@", "#", "$", "*"]
  const symbol = symbols[Math.floor(Math.random() * symbols.length)]
  const chars = "abcdefghjkmnpqrstuvwxyz23456789ABCDEFGHJKMNPQRSTUVWXYZ"
  let randomSuffix = ""
  for (let i = 0; i < 4; i++) {
    randomSuffix += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `${prefix}${year}${symbol}${randomSuffix}`
}

type UserFormValues = {
  name: string
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
  defaultName?: string
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
  defaultName = "",
  defaultFirstName = "",
  defaultLastNamePaternal = "",
  defaultLastNameMaternal = "",
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
  const [generatedDefaultPass, setGeneratedDefaultPass] = useState(() =>
    mode === "create" ? generarPasswordSegura() : ""
  )

  // Estados para validación de seguridad de administrador al editar
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(mode === "create")
  const [showAdminAuthModal, setShowAdminAuthModal] = useState(false)
  const [adminPasswordInput, setAdminPasswordInput] = useState("")
  const [verifyingAdmin, setVerifyingAdmin] = useState(false)

  const initialName = defaultName || [defaultFirstName, defaultLastNamePaternal, defaultLastNameMaternal].filter(Boolean).join(" ")

  const resolver = zodResolver(mode === "create" ? userCreateSchema : userUpdateSchema) as Resolver<UserFormValues>

  const form = useForm<UserFormValues>({
    resolver,
    defaultValues: {
      name: initialName,
      institutionalEmail: defaultInstitutionalEmail,
      nationalId: defaultNationalId || "AGBC-REG",
      dateOfBirth: defaultDateOfBirth || "1995-01-01",
      isActive: defaultIsActive,
      password: mode === "create" ? generatedDefaultPass : "",
      roleIds: defaultRoleIds,
    },
  })

  function handleRegeneratePassword() {
    const newPass = generarPasswordSegura()
    setGeneratedDefaultPass(newPass)
    form.setValue("password", newPass, { shouldDirty: true, shouldValidate: true })
    toast.success("Nueva contraseña segura generada")
  }

  async function handleVerifyAdminPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!adminPasswordInput.trim()) {
      toast.error("Ingresa tu contraseña de administrador")
      return
    }

    setVerifyingAdmin(true)
    try {
      const res = await revelarPasswordUsuario({
        adminPassword: adminPasswordInput,
        email: defaultInstitutionalEmail || form.getValues("institutionalEmail"),
        ci: defaultNationalId || form.getValues("nationalId"),
      })
      if (res.success && res.data) {
        setIsAdminUnlocked(true)
        setShowAdminAuthModal(false)
        setAdminPasswordInput("")
        const recoveredPassword = res.data.password || "Correos2026*"
        form.setValue("password", recoveredPassword, { shouldDirty: false })
        setShowPassword(true)
        toast.success("Contraseña del usuario revelada")
      } else {
        toast.error(res.message || "Contraseña de administrador incorrecta")
      }
    } catch {
      toast.error("Error al validar la contraseña de administrador")
    } finally {
      setVerifyingAdmin(false)
    }
  }

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
      name: values.name.trim(),
      institutionalEmail: values.institutionalEmail.trim().toLowerCase(),
      nationalId: values.nationalId ? values.nationalId.trim().toUpperCase() : "AGBC-REG",
      dateOfBirth: values.dateOfBirth || "1995-01-01",
      isActive: Boolean(values.isActive),
      roleIds: values.roleIds?.slice(0, 1) ?? [],
    }

    if (mode === "create") {
      await onSubmit({
        ...basePayload,
        password: values.password || generatedDefaultPass,
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
        <h3 className="text-sm font-bold text-[#002F6C] flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FFB800]/20 text-xs font-black text-[#0E5296]">1</span>
          Datos del Usuario / Funcionario
        </h3>
        <p className="text-xs text-slate-500 ml-8">Información básica para la cuenta institucional</p>
      </div>
      <FieldGroup className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200/80 p-4 bg-slate-50/50">
        <Field>
          <FieldLabel htmlFor="user-name">Nombres y Apellidos Completos *</FieldLabel>
          <Input
            id="user-name"
            placeholder="Ej: Juan Carlos Pérez Morales"
            autoFocus
            className="h-10 text-xs"
            {...form.register("name")}
          />
          <FieldError errors={[form.formState.errors.name]} />
        </Field>
      </FieldGroup>

      {/* ── Correo Institucional ── */}
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-[#002F6C] flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FFB800]/20 text-xs font-black text-[#0E5296]">2</span>
          Correo Institucional
        </h3>
        <p className="text-xs text-slate-500 ml-8">Cuenta oficial para acceso y notificaciones</p>
      </div>
      <FieldGroup className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200/80 p-4 bg-slate-50/50">
        <Field>
          <FieldLabel htmlFor="user-institutional-email">Correo Electrónico Institucional *</FieldLabel>
          <Input
            id="user-institutional-email"
            type="email"
            placeholder="usuario@correos.gob.bo"
            className="h-10 text-xs"
            {...form.register("institutionalEmail")}
          />
          <FieldDescription className="text-[11px] text-slate-400">
            Se aceptan dominios autorizados de la institución (@correos.gob.bo, @agbc.gob.bo, @gmail.com).
          </FieldDescription>
          <FieldError errors={[form.formState.errors.institutionalEmail]} />
        </Field>
      </FieldGroup>

      {/* ── Seguridad y Contraseña ── */}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FFB800]/15 text-xs font-bold text-[#0E5296] dark:text-[#FFB800]">3</span>
          Seguridad y Contraseña
        </h3>
        <p className="text-xs text-muted-foreground ml-8">Credenciales de acceso y estado de la cuenta</p>
      </div>

      {mode === "create" && (
        <div className="rounded-2xl border-2 border-[#0E5296]/20 bg-gradient-to-r from-blue-50/80 via-white to-amber-50/80 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#002F6C]">Contraseña Predeterminada Asignada:</span>
              <span className="rounded-lg bg-[#0E5296] text-[#FFCC00] px-3 py-1 text-xs font-mono font-black tracking-wider shadow-2xs">
                {generatedDefaultPass}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Generada con mayúsculas, minúsculas, números y caracteres para máxima seguridad.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRegeneratePassword}
            className="rounded-xl border-slate-300 text-xs font-bold text-[#002F6C] hover:bg-white cursor-pointer"
          >
            <RefreshCwIcon className="mr-1.5 h-3.5 w-3.5 text-[#0E5296]" />
            Generar Otra Clave
          </Button>
        </div>
      )}

      {/* ── Si está en modo EDITAR y no está desbloqueado por el admin ── */}
      {mode === "edit" && !isAdminUnlocked && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <LockIcon className="h-4 w-4 text-[#0E5296]" />
            <span className="text-xs font-bold text-[#002F6C]">Contraseña de Acceso:</span>
            <span className="rounded-md bg-slate-200/80 px-2.5 py-0.5 font-mono text-xs text-slate-600 tracking-widest font-black">
              ••••••••••••••••
            </span>
          </div>
          <Button
            type="button"
            onClick={() => setShowAdminAuthModal(true)}
            className="bg-[#0E5296] hover:bg-[#002F6C] text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <EyeIcon className="h-3.5 w-3.5 text-[#FFCC00]" />
            Ver Contraseña
          </Button>
        </div>
      )}

      {/* ── Verificación de Administrador ── */}
      {showAdminAuthModal && !isAdminUnlocked && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/90 p-3.5 space-y-2 animate-in fade-in">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#002F6C]">
            <ShieldAlertIcon className="h-4 w-4 text-amber-600" />
            Clave de Administrador requerida
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              type="password"
              placeholder="Ingresa tu clave de admin..."
              value={adminPasswordInput}
              onChange={(e) => setAdminPasswordInput(e.target.value)}
              className="h-9 bg-white text-xs rounded-xl flex-1 border-amber-300 focus:border-[#0E5296]"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleVerifyAdminPassword(e)
                }
              }}
            />
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowAdminAuthModal(false)
                  setAdminPasswordInput("")
                }}
                className="h-9 px-3 rounded-xl text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={verifyingAdmin}
                onClick={handleVerifyAdminPassword}
                className="h-9 px-3.5 rounded-xl bg-[#0E5296] hover:bg-[#002F6C] text-white text-xs font-bold"
              >
                {verifyingAdmin ? <Loader2Icon className="h-3.5 w-3.5 animate-spin" /> : "Verificar"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Si está desbloqueado (o en modo creación), muestra los campos de edición ── */}
      {(mode === "create" || isAdminUnlocked) && (
        <FieldGroup className="grid grid-cols-1 gap-4 md:grid-cols-2 rounded-2xl border border-slate-200/80 p-4 bg-slate-50/50">
          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="user-password">
                {mode === "create" ? "Contraseña *" : "Nueva contraseña (opcional)"}
              </FieldLabel>
              {mode === "edit" && (
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2Icon className="h-3 w-3" /> Acceso Admin Desbloqueado
                </span>
              )}
            </div>
            <div className="relative mt-1">
              <Input
                id="user-password"
                type={showPassword ? "text" : "password"}
                placeholder={mode === "create" ? generatedDefaultPass : "Escribe una nueva contraseña..."}
                className="h-10 text-xs pr-10"
                {...form.register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-700 cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </button>
            </div>
            {mode === "edit" && (
              <div className="mt-1.5 flex items-center justify-between">
                <p className="text-[10px] text-slate-400">Deja en blanco si deseas mantener la actual.</p>
                <button
                  type="button"
                  onClick={() => {
                    const pass = generarPasswordSegura()
                    form.setValue("password", pass, { shouldDirty: true, shouldValidate: true })
                    setShowPassword(true)
                    toast.success("Nueva clave generada")
                  }}
                  className="text-[10px] font-bold text-[#0E5296] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <RefreshCwIcon className="h-2.5 w-2.5" /> Generar aleatoria
                </button>
              </div>
            )}
            <FieldError errors={[form.formState.errors.password]} />
          </Field>

          <Field className="rounded-xl border border-slate-200 px-3.5 py-3 bg-white">
            <FieldLabel htmlFor="user-is-active" className="cursor-pointer text-xs font-bold text-[#002F6C]">
              Estado de la cuenta
            </FieldLabel>
            <FieldDescription className="text-[11px] text-slate-400">
              Si está desactivado, el usuario quedará inhabilitado para iniciar sesión.
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
              <span className={`text-xs font-bold ${isActive ? "text-emerald-600" : "text-rose-500"}`}>
                {isActive ? "Activo (Habilitado)" : "Inactivo (Bloqueado)"}
              </span>
            </div>
            <FieldError errors={[form.formState.errors.isActive]} />
          </Field>
        </FieldGroup>
      )}

      {/* ── Rol ── */}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FFB800]/15 text-xs font-bold text-[#0E5296] dark:text-[#FFB800]">4</span>
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
                    className={`rounded-lg border px-4 py-3 transition-colors cursor-pointer ${selected ? "border-[#FFB800] bg-[#FFB800]/10" : "border-border/40 hover:bg-muted/30"}`}
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
          className="border-0 bg-[#0E5296] hover:bg-[#002F6C] font-bold text-white shadow-md shadow-[#0E5296]/20 cursor-pointer"
        >
          {pending ? "Guardando..." : submitLabel}
        </Button>
      </div>
    </form>
  )
}
