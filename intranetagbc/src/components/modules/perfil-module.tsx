"use client"

import { useTransition, useRef, useState } from "react"
import {
  SaveIcon,
  CameraIcon,
  UserIcon,
  MailIcon,
  ShieldCheckIcon,
  FingerprintIcon,
  CalendarIcon,
  SparklesIcon,
  CheckCircle2Icon,
  KeyRoundIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  CheckIcon,
  XIcon,
  ArrowLeftIcon,
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
    nationalId: string
    dateOfBirth: string | Date
    avatarUrl: string | null
    roles: string[]
    createdAt: string | Date
  }
}

function getInitials(first: string, paternal: string): string {
  return `${first[0] ?? ""}${paternal[0] ?? ""}`.toUpperCase()
}

/* ── Paleta estilo Google Meet ── */
const AVATAR_COLORS = [
  { bg: "#1A73E8", text: "#FFFFFF" },
  { bg: "#E8453C", text: "#FFFFFF" },
  { bg: "#0B8043", text: "#FFFFFF" },
  { bg: "#F29900", text: "#FFFFFF" },
  { bg: "#8430CE", text: "#FFFFFF" },
  { bg: "#185ABC", text: "#FFFFFF" },
  { bg: "#00897B", text: "#FFFFFF" },
  { bg: "#C2185B", text: "#FFFFFF" },
]

function hashName(name: string): number {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
    hash |= 0
  }
  return Math.abs(hash)
}

function getAvatarColor(name: string) {
  return AVATAR_COLORS[hashName(name) % AVATAR_COLORS.length]
}

function formatDate(d: string | Date): string {
  const date = new Date(d)
  if (isNaN(date.getTime())) return "—"
  return date.toLocaleDateString("es-BO", { year: "numeric", month: "long", day: "numeric" })
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
      } catch { toast.error("Error al actualizar") }
    })
  }

  const fullName = `${perfil.firstName} ${perfil.lastNamePaternal} ${perfil.lastNameMaternal}`.trim()
  const initials = getInitials(perfil.firstName, perfil.lastNamePaternal)

  return (
    <>
      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* ── Barra superior con botón volver al dashboard ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#002F6C]">Mi Perfil</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Gestiona tu información personal, correo institucional y seguridad
            </p>
          </div>
          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-[#0E5296]/30 px-4 py-2 text-xs font-bold text-[#002F6C] shadow-xs hover:shadow-md transition-all cursor-pointer"
          >
            <ArrowLeftIcon className="h-3.5 w-3.5 text-[#0E5296] transition-transform group-hover:-translate-x-0.5" />
            <span>Volver al Dashboard</span>
          </Link>
        </div>

        {/* ── Header hero con avatar ── */}
        <Card className="border-border/40 overflow-hidden relative">
          <div className="relative h-36 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#002F6C] via-[#0E5296] to-[#003B73]" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2260%22%20height%3D%2260%22%3E%3Cpath%20d%3D%22M0%2030h60M30%200v60%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.08)%22%20stroke-width%3D%221%22%2F%3E%3C%2Fsvg%3E')] opacity-50" />
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-[#FFB800]/20 blur-2xl" />
            <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-[#0077EE]/20 blur-2xl" />
          </div>

          <CardContent className="relative px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-5 -mt-16">
              <div className="relative group">
                <div className={`h-28 w-28 rounded-2xl border-4 border-white bg-[#FFCC00] flex items-center justify-center overflow-hidden shadow-xl ring-4 ring-slate-100 transition-transform group-hover:scale-105 ${uploadingAvatar ? "animate-pulse" : ""}`}>
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
                >
                  <CameraIcon className="h-4 w-4" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>

              <div className="sm:mb-2 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black tracking-tight text-black">{fullName}</h2>
                </div>
                <p className="text-sm text-black font-bold flex items-center gap-1.5 mt-0.5">
                  <MailIcon className="h-3.5 w-3.5 text-[#0E5296]" />
                  {perfil.institutionalEmail}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {perfil.roles.length > 0 ? perfil.roles.map(r => (
                    <span key={r} className="inline-flex items-center gap-1.5 rounded-lg bg-[#0E5296]/10 px-3 py-1 text-xs font-bold text-[#0E5296] ring-1 ring-[#0E5296]/20">
                      <ShieldCheckIcon className="h-3 w-3 text-[#FFCC00]" />
                      {r}
                    </span>
                  )) : <span className="text-xs text-muted-foreground">Sin rol asignado</span>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
          {/* ── Datos personales ── */}
          <Card className="border-border/40 overflow-hidden">
            <CardHeader className="border-b border-border/30 bg-muted/20">
              <CardTitle className="flex items-center gap-2.5 text-[#002F6C]">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0E5296]/10 text-[#0E5296]">
                  <UserIcon className="h-4 w-4" />
                </div>
                Datos personales
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nombre</Label>
                    <Input name="firstName" defaultValue={perfil.firstName} className="font-medium" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Apellido Paterno</Label>
                    <Input name="lastNamePaternal" defaultValue={perfil.lastNamePaternal} className="font-medium" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Apellido Materno</Label>
                    <Input name="lastNameMaternal" defaultValue={perfil.lastNameMaternal ?? ""} className="font-medium" />
                  </div>
                </div>

                <div className="h-px bg-border/40" />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <MailIcon className="h-3 w-3" /> Email Personal
                    </Label>
                    <Input value={perfil.email} disabled className="opacity-50 bg-muted/30" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <MailIcon className="h-3 w-3" /> Email Institucional
                    </Label>
                    <Input value={perfil.institutionalEmail} disabled className="opacity-50 bg-muted/30" />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <FingerprintIcon className="h-3 w-3" /> CI
                    </Label>
                    <Input value={perfil.nationalId} disabled className="opacity-50 bg-muted/30" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <CalendarIcon className="h-3 w-3" /> Fecha de nacimiento
                    </Label>
                    <Input value={perfil.dateOfBirth ? (typeof perfil.dateOfBirth === "string" ? perfil.dateOfBirth : perfil.dateOfBirth.toISOString().split("T")[0]) : ""} disabled className="opacity-50 bg-muted/30" />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={isPending} className="bg-[#0E5296] hover:bg-[#002F6C] text-white font-bold shadow-lg shadow-[#0E5296]/20 transition-all cursor-pointer">
                    <SaveIcon className="mr-2 h-4 w-4 text-[#FFB800]" />{isPending ? "Guardando..." : "Guardar cambios"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* ── Seguridad: cambio de contraseña ── */}
          <Card className="border-border/40 overflow-hidden" data-tour="perfil-seguridad">
            <CardHeader className="border-b border-border/30 bg-muted/20">
              <CardTitle className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#C41E3A]/20 to-[#FF8800]/10">
                  <KeyRoundIcon className="h-4 w-4 text-[#C41E3A]" />
                </div>
                Seguridad
              </CardTitle>
              <p className="text-xs text-muted-foreground pl-11 -mt-1">
                Cambia tu contraseña. Necesitas ingresar tu contraseña actual.
              </p>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleChangePassword} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <LockIcon className="h-3 w-3" /> Contraseña actual
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
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showCurrent ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <KeyRoundIcon className="h-3 w-3" /> Nueva contraseña
                    </Label>
                    <div className="relative">
                      <Input
                        type={showNew ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        autoComplete="new-password"
                        placeholder="Mínimo 8 caracteres"
                        className="pr-10 font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew((s) => !s)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                      >
                        {showNew ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                      </button>
                    </div>
                    {newPassword.length > 0 && (
                      <p className={`text-[11px] font-medium flex items-center gap-1 ${newMeetsLength ? "text-green-600" : "text-amber-600"}`}>
                        {newMeetsLength ? <CheckIcon className="h-3 w-3" /> : <XIcon className="h-3 w-3" />}
                        {newMeetsLength ? "Longitud válida" : "Al menos 8 caracteres"}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <CheckIcon className="h-3 w-3" /> Confirmar contraseña
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
                              ? "border-green-500/60 focus-visible:ring-green-500/20"
                              : "border-red-500/60 focus-visible:ring-red-500/20"
                            : ""
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((s) => !s)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        tabIndex={-1}
                      >
                        {showConfirm ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                      </button>
                    </div>
                    {confirmTouched && (
                      <p className={`text-[11px] font-medium flex items-center gap-1 ${confirmMatches ? "text-green-600" : "text-red-600"}`}>
                        {confirmMatches ? <CheckIcon className="h-3 w-3" /> : <XIcon className="h-3 w-3" />}
                        {confirmMatches ? "Las contraseñas coinciden" : "Las contraseñas no coinciden"}
                      </p>
                    )}
                  </div>
                </div>

                {currentPassword.length > 0 && newPassword.length > 0 && !newDiffFromCurrent && (
                  <p className="text-[11px] font-medium text-amber-600 flex items-center gap-1">
                    <XIcon className="h-3 w-3" />
                    La nueva contraseña debe ser diferente a la actual
                  </p>
                )}

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={!canSubmitPwd}
                    className="bg-gradient-to-r from-[#C41E3A] to-[#FF8800] text-white font-bold shadow-lg shadow-[#C41E3A]/20 hover:shadow-xl hover:shadow-[#C41E3A]/30 transition-all disabled:opacity-50"
                  >
                    <KeyRoundIcon className="mr-2 h-4 w-4" />
                    {isChangingPwd ? "Cambiando..." : "Cambiar contraseña"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          </div>

          {/* ── Info lateral ── */}
          <div className="space-y-6">
            {/* Tarjeta de rol */}
            <Card className="border border-slate-200 bg-white shadow-sm overflow-hidden">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-[#002F6C]">
                  <ShieldCheckIcon className="h-4 w-4 text-[#0E5296]" />
                  Nivel de acceso
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {perfil.roles.length > 0 ? perfil.roles.map(r => (
                  <div key={r} className="flex items-center gap-3 rounded-xl bg-[#0E5296]/5 p-3 ring-1 ring-[#0E5296]/20">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0E5296] text-[#FFCC00] shadow-sm">
                      <ShieldCheckIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#002F6C] capitalize">{r}</p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {r.toLowerCase() === "administrador" ? "Acceso total al sistema" : "Acceso institucional"}
                      </p>
                    </div>
                  </div>
                )) : <p className="text-sm text-slate-500">Sin roles asignados</p>}
              </CardContent>
            </Card>

            {/* Tarjeta info rápida */}
            <Card className="border border-slate-200 bg-white shadow-sm overflow-hidden">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-[#002F6C]">
                  <SparklesIcon className="h-4 w-4 text-[#0E5296]" />
                  Información rápida
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0E5296]/10 text-[#0E5296]">
                    <MailIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Email</p>
                    <p className="text-xs font-semibold text-[#002F6C] truncate">{perfil.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0E5296]/10 text-[#0E5296]">
                    <FingerprintIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">CI</p>
                    <p className="text-xs font-mono font-semibold text-[#002F6C]">{perfil.nationalId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0E5296]/10 text-[#0E5296]">
                    <CalendarIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Nacimiento</p>
                    <p className="text-xs font-semibold text-[#002F6C]">{formatDate(perfil.dateOfBirth)}</p>
                  </div>
                </div>
                <div className="h-px bg-slate-200" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">ID de usuario</p>
                  <p className="mt-1 text-[10px] font-mono text-slate-500 break-all select-all">{perfil.id}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}
