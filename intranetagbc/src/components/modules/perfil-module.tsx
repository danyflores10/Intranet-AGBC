"use client"

import { useTransition, useRef, useState, useMemo } from "react"
import {
  SaveIcon,
  CameraIcon,
  UserIcon,
  MailIcon,
  ShieldCheckIcon,
  CalendarIcon,
  SparklesIcon,
  KeyRoundIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  CheckIcon,
  XIcon,
  ArrowLeftIcon,
  Loader2Icon,
  ShieldAlertIcon,
} from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Props {
  perfil: {
    id: string
    firstName: string
    lastNamePaternal: string
    lastNameMaternal: string | null
    email: string
    institutionalEmail: string
    dateOfBirth: string | Date
    avatarUrl: string | null
    roles: string[]
    createdAt: string | Date
  }
}

function getInitials(first: string, paternal: string): string {
  return `${first[0] ?? ""}${paternal[0] ?? ""}`.toUpperCase()
}

function formatDate(d: string | Date): string {
  const date = new Date(d)
  if (isNaN(date.getTime())) return "—"
  return date.toLocaleDateString("es-BO", { year: "numeric", month: "long", day: "numeric" })
}

/**
 * Indicador de seguridad de contraseña de 4 niveles:
 * 🔴 Poco segura
 * 🟡 Algo segura
 * 🟢 Segura
 * 🟣 Muy segura
 */
function calculatePasswordStrength(pwd: string) {
  if (!pwd || pwd.length === 0) {
    return {
      level: 0,
      label: "Sin ingresar",
      colorClass: "bg-slate-200",
      textClass: "text-slate-400",
      badgeClass: "bg-slate-100 text-slate-500 border-slate-200",
      icon: "⚪",
      percent: 0,
      checks: {
        length: false,
        length12: false,
        upperLower: false,
        numbers: false,
        symbols: false,
      },
    }
  }

  const hasUpper = /[A-Z]/.test(pwd)
  const hasLower = /[a-z]/.test(pwd)
  const hasNumber = /[0-9]/.test(pwd)
  const hasSymbol = /[^A-Za-z0-9]/.test(pwd)
  const isMin8 = pwd.length >= 8
  const isMin12 = pwd.length >= 12

  // Detección de patrones repetidos / comunes
  const hasRepeating = /(.)\1{2,}/i.test(pwd) // aaa, 111
  const isCommonPattern = /1234|abcd|qwerty|password|admin|agbc|correos/i.test(pwd)

  let score = 0
  if (isMin8) score += 1
  if (isMin12) score += 1
  if (hasUpper && hasLower) score += 1
  if (hasNumber) score += 0.5
  if (hasSymbol) score += 1

  if (hasRepeating || isCommonPattern) {
    score = Math.max(0.5, score - 1)
  }

  let level: 1 | 2 | 3 | 4 = 1
  let label = "Poco segura"
  let colorClass = "bg-red-500"
  let textClass = "text-red-600"
  let badgeClass = "bg-red-50 text-red-700 border-red-200"
  let icon = "🔴"
  let percent = 25

  if (!isMin8 || score <= 1.5) {
    level = 1
    label = "Poco segura"
    colorClass = "bg-red-500"
    textClass = "text-red-600"
    badgeClass = "bg-red-50 text-red-700 border-red-200"
    icon = "🔴"
    percent = 25
  } else if (score <= 2.5) {
    level = 2
    label = "Algo segura"
    colorClass = "bg-amber-500"
    textClass = "text-amber-600"
    badgeClass = "bg-amber-50 text-amber-700 border-amber-200"
    icon = "🟡"
    percent = 50
  } else if (score <= 3.5 || !isMin12 || !hasSymbol) {
    level = 3
    label = "Segura"
    colorClass = "bg-emerald-500"
    textClass = "text-emerald-600"
    badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200"
    icon = "🟢"
    percent = 75
  } else {
    level = 4
    label = "Muy segura"
    colorClass = "bg-purple-600"
    textClass = "text-purple-600"
    badgeClass = "bg-purple-50 text-purple-700 border-purple-200"
    icon = "🟣"
    percent = 100
  }

  return {
    level,
    label,
    colorClass,
    textClass,
    badgeClass,
    icon,
    percent,
    checks: {
      length: isMin8,
      length12: isMin12,
      upperLower: hasUpper && hasLower,
      numbers: hasNumber,
      symbols: hasSymbol,
    },
  }
}

export function PerfilModule({ perfil }: Props) {
  const [isPending, startTransition] = useTransition()
  const [avatarPreview, setAvatarPreview] = useState<string | null>(perfil.avatarUrl)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // ── Estado de cambio de contraseña ──
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isChangingPwd, setIsChangingPwd] = useState(false)

  // Cálculo en tiempo real de seguridad
  const passwordStrength = useMemo(() => calculatePasswordStrength(newPassword), [newPassword])

  const confirmTouched = confirmPassword.length > 0
  const confirmMatches = confirmTouched && newPassword === confirmPassword
  const newMeetsLength = newPassword.length >= 8
  const newDiffFromCurrent =
    newPassword.length > 0 && currentPassword.length > 0 && newPassword !== currentPassword
  const canSubmitPwd =
    currentPassword.length > 0 &&
    newMeetsLength &&
    confirmMatches &&
    newDiffFromCurrent &&
    !isChangingPwd

  async function handleChangePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!canSubmitPwd) return

    setIsChangingPwd(true)
    try {
      const res = await fetch("/api/perfil/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al cambiar contraseña")

      toast.success("Contraseña actualizada con éxito")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setShowCurrent(false)
      setShowNew(false)
      setShowConfirm(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al cambiar contraseña")
    } finally {
      setIsChangingPwd(false)
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("userId", perfil.id)

      const res = await fetch("/api/perfil/avatar", { method: "POST", body: formData })
      if (!res.ok) throw new Error("Error al subir avatar")

      const data = await res.json()
      setAvatarPreview(data.url)
      toast.success("Foto de perfil actualizada")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al actualizar avatar")
    } finally {
      setUploadingAvatar(false)
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        const res = await fetch("/api/perfil", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `${fd.get("firstName")} ${fd.get("lastNamePaternal")} ${fd.get("lastNameMaternal")}`.trim(),
          }),
        })
        if (!res.ok) throw new Error()
        toast.success("Perfil actualizado correctamente")
      } catch {
        toast.error("Error al actualizar")
      }
    })
  }

  const fullName = `${perfil.firstName} ${perfil.lastNamePaternal} ${perfil.lastNameMaternal || ""}`.trim()
  const initials = getInitials(perfil.firstName, perfil.lastNamePaternal)

  return (
    <>
      <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 bg-gradient-to-br from-slate-50 via-blue-50/20 to-amber-50/15 min-h-screen">
        {/* ── Barra superior con botón volver al dashboard ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#002F6C]">Mi Perfil</h1>
            <p className="text-xs text-slate-600 font-medium mt-0.5">
              Gestiona tu información personal, correo institucional y seguridad de cuenta
            </p>
          </div>
          <div className="flex items-center gap-2">
            {perfil.roles && perfil.roles.some((r) => /admin|gestor|director/i.test(r)) ? (
              <Link
                href="/dashboard"
                className="group inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-[#0E5296]/40 px-4 py-2 text-xs font-bold text-[#002F6C] shadow-xs hover:shadow-md transition-all cursor-pointer"
              >
                <ArrowLeftIcon className="h-3.5 w-3.5 text-[#0E5296] transition-transform group-hover:-translate-x-0.5" />
                <span>Volver al Dashboard</span>
              </Link>
            ) : (
              <Link
                href="/"
                className="group inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-[#0E5296]/40 px-4 py-2 text-xs font-bold text-[#002F6C] shadow-xs hover:shadow-md transition-all cursor-pointer"
              >
                <ArrowLeftIcon className="h-3.5 w-3.5 text-[#0E5296] transition-transform group-hover:-translate-x-0.5" />
                <span>Volver a la Intranet</span>
              </Link>
            )}
          </div>
        </div>

        {/* ── Header hero con avatar y datos principales ── */}
        <Card className="border-2 border-[#002F6C]/15 overflow-hidden relative shadow-sm">
          <div className="relative h-36 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#002F6C] via-[#0E5296] to-[#003B73]" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2260%22%20height%3D%2260%22%3E%3Cpath%20d%3D%22M0%2030h60M30%200v60%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.08)%22%20stroke-width%3D%221%22%2F%3E%3C%2Fsvg%3E')] opacity-50" />
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-[#FFCC00]/20 blur-2xl" />
            <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-[#0077EE]/20 blur-2xl" />
          </div>

          <CardContent className="relative px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-5 -mt-16">
              <div className="relative group">
                <div
                  className={`h-28 w-28 rounded-2xl border-4 border-white bg-[#FFCC00] flex items-center justify-center overflow-hidden shadow-xl ring-4 ring-slate-100 transition-transform group-hover:scale-105 ${
                    uploadingAvatar ? "animate-pulse" : ""
                  }`}
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt={fullName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#FFCC00]">
                      <span className="text-3xl font-black text-[#002F6C]">{initials}</span>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-xl bg-[#0E5296] hover:bg-[#002F6C] text-[#FFCC00] border-2 border-white shadow-lg transition-all hover:scale-110 active:scale-95 disabled:opacity-50 cursor-pointer"
                  title="Cambiar foto de perfil"
                >
                  <CameraIcon className="h-4 w-4" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>

              <div className="sm:mb-2 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black tracking-tight text-[#002F6C]">{fullName}</h2>
                </div>
                <p className="text-sm text-slate-700 font-bold flex items-center gap-1.5 mt-0.5">
                  <MailIcon className="h-3.5 w-3.5 text-[#0E5296]" />
                  {perfil.institutionalEmail}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {perfil.roles.length > 0 ? (
                    perfil.roles.map((r) => (
                      <span
                        key={r}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#0E5296]/10 px-3 py-1 text-xs font-bold text-[#0E5296] ring-1 ring-[#0E5296]/20"
                      >
                        <ShieldCheckIcon className="h-3 w-3 text-[#FFCC00]" />
                        {r}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">Sin rol asignado</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* ── Datos personales ── */}
            <Card className="border-2 border-[#002F6C]/15 overflow-hidden shadow-sm">
              <CardHeader className="border-b border-slate-100 bg-slate-50/70">
                <CardTitle className="flex items-center gap-2.5 text-sm font-black text-[#002F6C]">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0E5296]/10 text-[#0E5296]">
                    <UserIcon className="h-4 w-4" />
                  </div>
                  Datos Personales
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">Nombre</Label>
                      <Input name="firstName" defaultValue={perfil.firstName} className="font-semibold text-slate-800" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">Apellido Paterno</Label>
                      <Input name="lastNamePaternal" defaultValue={perfil.lastNamePaternal} className="font-semibold text-slate-800" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">Apellido Materno</Label>
                      <Input name="lastNameMaternal" defaultValue={perfil.lastNameMaternal ?? ""} className="font-semibold text-slate-800" />
                    </div>
                  </div>

                  <div className="h-px bg-slate-200" />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                        <MailIcon className="h-3 w-3 text-[#0E5296]" /> Email Institucional
                      </Label>
                      <Input value={perfil.institutionalEmail} disabled className="opacity-70 bg-slate-100 font-semibold text-slate-700 cursor-not-allowed" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                        <CalendarIcon className="h-3 w-3 text-[#0E5296]" /> Fecha de nacimiento
                      </Label>
                      <Input
                        value={
                          perfil.dateOfBirth
                            ? typeof perfil.dateOfBirth === "string"
                              ? perfil.dateOfBirth
                              : perfil.dateOfBirth.toISOString().split("T")[0]
                            : ""
                        }
                        disabled
                        className="opacity-70 bg-slate-100 font-semibold text-slate-700 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="bg-[#0E5296] hover:bg-[#002F6C] text-white font-bold shadow-md shadow-[#0E5296]/20 transition-all cursor-pointer"
                    >
                      <SaveIcon className="mr-2 h-4 w-4 text-[#FFCC00]" />
                      {isPending ? "Guardando..." : "Guardar cambios"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* ── Seguridad: cambio de contraseña ── */}
            <Card className="border-2 border-[#002F6C]/15 overflow-hidden shadow-sm" data-tour="perfil-seguridad">
              <CardHeader className="border-b border-slate-100 bg-slate-50/70">
                <CardTitle className="flex items-center gap-2.5 text-sm font-black text-[#002F6C]">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0E5296]/10 text-[#0E5296]">
                    <KeyRoundIcon className="h-4 w-4" />
                  </div>
                  Seguridad y Cambio de Contraseña
                </CardTitle>
                <p className="text-xs text-slate-500 pl-10.5 -mt-1 font-medium">
                  Actualiza tu clave de acceso. Ingresa tu contraseña actual y escribe libremente la nueva contraseña.
                </p>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleChangePassword} className="space-y-5">
                  {/* Contraseña actual con visor seguro de texto tipeado */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                      <LockIcon className="h-3 w-3 text-[#0E5296]" /> Contraseña actual
                    </Label>
                    <div className="relative">
                      <Input
                        type={showCurrent ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        className="pr-10 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrent((s) => !s)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer"
                        tabIndex={-1}
                        title={showCurrent ? "Ocultar contraseña actual" : "Mostrar contraseña actual"}
                      >
                        {showCurrent ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Nueva contraseña libre */}
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                        <KeyRoundIcon className="h-3 w-3 text-[#0E5296]" /> Nueva contraseña
                      </Label>
                      <div className="relative">
                        <Input
                          type={showNew ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          autoComplete="new-password"
                          placeholder="Escribe tu nueva contraseña"
                          className="pr-10 font-medium"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNew((s) => !s)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer"
                          tabIndex={-1}
                          title={showNew ? "Ocultar contraseña" : "Mostrar contraseña"}
                        >
                          {showNew ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                        </button>
                      </div>

                      {/* Indicador de Seguridad en Tiempo Real (4 Niveles) */}
                      {newPassword.length > 0 && (
                        <div className="mt-2 space-y-2 rounded-xl bg-slate-50 p-2.5 border border-slate-200/80 animate-in fade-in duration-200">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-700 flex items-center gap-1">
                              Seguridad:
                            </span>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-black border ${passwordStrength.badgeClass}`}>
                              {passwordStrength.icon} {passwordStrength.label}
                            </span>
                          </div>

                          {/* Barra de progreso de 4 segmentos */}
                          <div className="grid grid-cols-4 gap-1 h-1.5 w-full">
                            <div className={`h-full rounded-full transition-all ${passwordStrength.level >= 1 ? passwordStrength.colorClass : "bg-slate-200"}`} />
                            <div className={`h-full rounded-full transition-all ${passwordStrength.level >= 2 ? passwordStrength.colorClass : "bg-slate-200"}`} />
                            <div className={`h-full rounded-full transition-all ${passwordStrength.level >= 3 ? passwordStrength.colorClass : "bg-slate-200"}`} />
                            <div className={`h-full rounded-full transition-all ${passwordStrength.level >= 4 ? passwordStrength.colorClass : "bg-slate-200"}`} />
                          </div>

                          {/* Requisitos clave */}
                          <div className="grid grid-cols-2 gap-1 pt-1 text-[10px] text-slate-500 font-medium">
                            <span className={`flex items-center gap-1 ${passwordStrength.checks.length ? "text-emerald-600 font-bold" : "text-slate-400"}`}>
                              {passwordStrength.checks.length ? "✓" : "○"} Mínimo 8 caracteres
                            </span>
                            <span className={`flex items-center gap-1 ${passwordStrength.checks.upperLower ? "text-emerald-600 font-bold" : "text-slate-400"}`}>
                              {passwordStrength.checks.upperLower ? "✓" : "○"} Mayúsculas y minúsculas
                            </span>
                            <span className={`flex items-center gap-1 ${passwordStrength.checks.numbers ? "text-emerald-600 font-bold" : "text-slate-400"}`}>
                              {passwordStrength.checks.numbers ? "✓" : "○"} Números
                            </span>
                            <span className={`flex items-center gap-1 ${passwordStrength.checks.symbols ? "text-emerald-600 font-bold" : "text-slate-400"}`}>
                              {passwordStrength.checks.symbols ? "✓" : "○"} Símbolos especiales
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Confirmar contraseña */}
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                        <CheckIcon className="h-3 w-3 text-[#0E5296]" /> Confirmar contraseña
                      </Label>
                      <div className="relative">
                        <Input
                          type={showConfirm ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          autoComplete="new-password"
                          placeholder="Repite la nueva contraseña"
                          className={`pr-10 font-medium ${
                            confirmTouched
                              ? confirmMatches
                                ? "border-emerald-500 focus-visible:ring-emerald-500/20"
                                : "border-red-500 focus-visible:ring-red-500/20"
                              : ""
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm((s) => !s)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer"
                          tabIndex={-1}
                          title={showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"}
                        >
                          {showConfirm ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                        </button>
                      </div>
                      {confirmTouched && (
                        <p
                          className={`text-[11px] font-bold flex items-center gap-1 mt-1 ${
                            confirmMatches ? "text-emerald-600" : "text-red-600"
                          }`}
                        >
                          {confirmMatches ? <CheckIcon className="h-3 w-3" /> : <XIcon className="h-3 w-3" />}
                          {confirmMatches ? "Las contraseñas coinciden" : "Las contraseñas no coinciden"}
                        </p>
                      )}
                    </div>
                  </div>

                  {currentPassword.length > 0 && newPassword.length > 0 && !newDiffFromCurrent && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2 text-xs font-bold text-amber-800">
                      <ShieldAlertIcon className="h-4 w-4 text-amber-600 shrink-0" />
                      La nueva contraseña debe ser diferente a la actual.
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <Button
                      type="submit"
                      disabled={!canSubmitPwd}
                      className="bg-[#0E5296] hover:bg-[#002F6C] text-white font-bold shadow-md shadow-[#0E5296]/20 transition-all disabled:opacity-50 cursor-pointer h-10 px-5"
                    >
                      {isChangingPwd ? (
                        <>
                          <Loader2Icon className="mr-2 h-4 w-4 animate-spin text-[#FFCC00]" />
                          Cambiando contraseña...
                        </>
                      ) : (
                        <>
                          <KeyRoundIcon className="mr-2 h-4 w-4 text-[#FFCC00]" />
                          Cambiar contraseña
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* ── Info lateral ── */}
          <div className="space-y-6">
            {/* Tarjeta de rol */}
            <Card className="border-2 border-[#002F6C]/15 bg-white shadow-sm overflow-hidden">
              <CardHeader className="border-b border-slate-100 bg-slate-50/70">
                <CardTitle className="text-sm font-black flex items-center gap-2 text-[#002F6C]">
                  <ShieldCheckIcon className="h-4 w-4 text-[#0E5296]" />
                  Nivel de Acceso y Roles
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {perfil.roles.length > 0 ? (
                  perfil.roles.map((r) => (
                    <div
                      key={r}
                      className="flex items-center gap-3 rounded-xl bg-[#0E5296]/5 p-3 ring-1 ring-[#0E5296]/15"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0E5296] text-[#FFCC00] shadow-xs">
                        <ShieldCheckIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-[#002F6C] capitalize">{r}</p>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {r.toLowerCase() === "administrador"
                            ? "Control total del sistema institucional"
                            : "Acceso asignado según perfil"}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 font-medium">Sin roles asignados</p>
                )}
              </CardContent>
            </Card>

            {/* Tarjeta info rápida */}
            <Card className="border-2 border-[#002F6C]/15 bg-white shadow-sm overflow-hidden">
              <CardHeader className="border-b border-slate-100 bg-slate-50/70">
                <CardTitle className="text-sm font-black flex items-center gap-2 text-[#002F6C]">
                  <SparklesIcon className="h-4 w-4 text-[#0E5296]" />
                  Información Institucional
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0E5296]/10 text-[#0E5296]">
                    <MailIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Email Institucional</p>
                    <p className="text-xs font-bold text-[#002F6C] truncate">{perfil.institutionalEmail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0E5296]/10 text-[#0E5296]">
                    <CalendarIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Fecha de Nacimiento</p>
                    <p className="text-xs font-bold text-[#002F6C]">{formatDate(perfil.dateOfBirth)}</p>
                  </div>
                </div>
                <div className="h-px bg-slate-200" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Identificador de Usuario</p>
                  <p className="mt-1 text-[10px] font-mono text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-200 break-all select-all">
                    {perfil.id}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}
