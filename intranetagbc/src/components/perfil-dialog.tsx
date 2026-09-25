"use client"

import { useState, useRef, useMemo } from "react"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  UserCircle2,
  Mail,
  Briefcase,
  ShieldCheck,
  Calendar,
  Lock,
  Eye,
  EyeOff,
  Camera,
  Loader2,
  CheckCircle2,
  KeyRound,
  Sparkles,
  Info,
} from "lucide-react"
import toast from "react-hot-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { UserNavProfile } from "@/components/user-nav-dropdown"

interface PerfilDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  usuario?: UserNavProfile | null
  esAdmin?: boolean
}

function calculatePasswordStrength(pwd: string) {
  if (!pwd) {
    return {
      level: 0,
      label: "Sin ingresar",
      colorClass: "bg-slate-200",
      textClass: "text-slate-400",
      percent: 0,
    }
  }

  const hasUpper = /[A-Z]/.test(pwd)
  const hasLower = /[a-z]/.test(pwd)
  const hasNumber = /[0-9]/.test(pwd)
  const hasSymbol = /[^A-Za-z0-9]/.test(pwd)
  const isMin8 = pwd.length >= 8
  const isMin12 = pwd.length >= 12

  let score = 0
  if (isMin8) score += 1
  if (isMin12) score += 1
  if (hasUpper && hasLower) score += 1
  if (hasNumber) score += 0.5
  if (hasSymbol) score += 1

  if (score <= 1.5) {
    return { level: 1, label: "Poco segura", colorClass: "bg-red-500", textClass: "text-red-600", percent: 25 }
  } else if (score <= 2.5) {
    return { level: 2, label: "Aceptable", colorClass: "bg-amber-500", textClass: "text-amber-600", percent: 50 }
  } else if (score <= 3.5) {
    return { level: 3, label: "Segura", colorClass: "bg-emerald-500", textClass: "text-emerald-600", percent: 75 }
  } else {
    return { level: 4, label: "Muy segura", colorClass: "bg-indigo-600", textClass: "text-indigo-600", percent: 100 }
  }
}

export function PerfilDialog({ open, onOpenChange, usuario, esAdmin }: PerfilDialogProps) {
  const [activeTab, setActiveTab] = useState<"general" | "seguridad">("general")
  const [avatarPreview, setAvatarPreview] = useState<string | null>(usuario?.image || null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cambio de contraseña
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isChangingPwd, setIsChangingPwd] = useState(false)

  const passwordStrength = useMemo(() => calculatePasswordStrength(newPassword), [newPassword])

  // Subir avatar
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no puede exceder los 5MB")
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append("avatar", file)

    try {
      const res = await fetch("/api/upload/avatar", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al subir la fotografía")

      const newUrl = `${data.url}?t=${Date.now()}`
      setAvatarPreview(newUrl)
      toast.success("Foto de perfil actualizada con éxito")
    } catch (err: any) {
      toast.error(err.message || "No se pudo actualizar la foto de perfil")
    } finally {
      setIsUploading(false)
    }
  }

  // Cambiar contraseña
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden")
      return
    }
    if (newPassword.length < 8) {
      toast.error("La nueva contraseña debe tener al menos 8 caracteres")
      return
    }

    setIsChangingPwd(true)
    try {
      const res = await fetch("/api/perfil/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al cambiar la contraseña")

      toast.success("Contraseña actualizada correctamente")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: any) {
      toast.error(err.message || "No se pudo actualizar la contraseña")
    } finally {
      setIsChangingPwd(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl sm:max-w-5xl w-[96vw] max-h-[90vh] overflow-y-auto p-0 rounded-3xl border-2 border-[#002F6C]/20 shadow-2xl bg-white">
        {/* Accesibilidad Radix UI Dialog Header */}
        <DialogHeader className="sr-only">
          <DialogTitle>Mi Perfil Institucional - {usuario?.name || "Funcionario"}</DialogTitle>
          <DialogDescription>
            Gestión de datos personales, fotografía de perfil y seguridad de cuenta en la Intranet AGBC.
          </DialogDescription>
        </DialogHeader>

        {/* Banner de Cabecera Institucional AGBC */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#002F6C] via-[#0E5296] to-[#002F6C] p-6 sm:p-8 text-white">
          <div className="h-1.5 w-full absolute top-0 left-0 bg-gradient-to-r from-[#FFB800] via-[#FFCC00] to-[#FFB800]" />
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pt-2">
            {/* Foto con Botón de Carga Rápida */}
            <div className="relative shrink-0 group">
              <div className="relative h-24 w-24 sm:h-28 sm:w-28 overflow-hidden rounded-3xl border-3 border-[#FFCC00] shadow-2xl bg-[#002F6C]">
                {avatarPreview ? (
                  <Image src={avatarPreview} alt={usuario?.name || "Usuario"} fill className="object-cover" unoptimized />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl font-black text-[#FFCC00]">
                    {(usuario?.name || "US").slice(0, 2).toUpperCase()}
                  </div>
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 className="h-7 w-7 text-white animate-spin" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute -bottom-1.5 -right-1.5 flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFB800] text-[#002F6C] shadow-lg border-2 border-white hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                title="Cambiar foto de perfil"
              >
                <Camera className="h-4.5 w-4.5" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>

            {/* Información Principal del Usuario */}
            <div className="text-center sm:text-left flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  {usuario?.name || "Funcionario Institucional"}
                </h2>
                <span className="rounded-full bg-[#FFB800]/20 px-3.5 py-1 text-xs font-black text-[#FFCC00] border border-[#FFCC00]/30 shadow-xs">
                  {usuario?.cargo || usuario?.rol || "Funcionario Público"}
                </span>
              </div>
              <p className="text-sm text-blue-100/90 mt-1.5 flex items-center justify-center sm:justify-start gap-2 font-medium">
                <Mail className="h-4 w-4 text-[#FFCC00]" />
                <span>{usuario?.email || "funcionario@correos.gob.bo"}</span>
              </p>
              <p className="text-xs text-white/70 mt-1 flex items-center justify-center sm:justify-start gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-[#FFCC00]" />
                <span>Agencia Boliviana de Correos • Intranet Institucional</span>
              </p>
            </div>
          </div>

          {/* Selector de Pestañas */}
          <div className="flex gap-4 mt-8 border-b border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab("general")}
              className={`pb-3 px-4 text-xs sm:text-sm font-black transition-colors border-b-2 cursor-pointer ${
                activeTab === "general"
                  ? "border-[#FFCC00] text-[#FFCC00]"
                  : "border-transparent text-white/70 hover:text-white"
              }`}
            >
              Datos del Funcionario
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("seguridad")}
              className={`pb-3 px-4 text-xs sm:text-sm font-black transition-colors border-b-2 cursor-pointer ${
                activeTab === "seguridad"
                  ? "border-[#FFCC00] text-[#FFCC00]"
                  : "border-transparent text-white/70 hover:text-white"
              }`}
            >
              Seguridad & Contraseña
            </button>
          </div>
        </div>

        {/* Contenido de las Pestañas */}
        <div className="p-6 sm:p-8">
          {activeTab === "general" ? (
            <div className="space-y-6">
              <div className="rounded-2xl bg-blue-50/70 p-4 border border-blue-200/80 flex items-start gap-3">
                <Info className="h-5 w-5 text-[#0E5296] shrink-0 mt-0.5" />
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  Los datos oficiales de identidad, nombre, cargo y correos son administrados de forma centralizada por la Unidad de Recursos Humanos y Tecnologías de la Información. Si requieres rectificar algún dato, comunícate con el área correspondiente.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase tracking-wider text-[#002F6C]">Nombre y Apellidos Oficiales</Label>
                  <Input
                    value={usuario?.name || ""}
                    disabled
                    className="h-11 rounded-xl bg-slate-100/90 border-slate-200 text-slate-800 font-bold cursor-not-allowed text-sm"
                  />
                  <p className="text-[11px] text-slate-500 font-medium">Registrado según documento de identidad y nómina</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase tracking-wider text-[#002F6C]">Cargo Institucional Asignado</Label>
                  <Input
                    value={usuario?.cargo || usuario?.rol || "Funcionario Público"}
                    disabled
                    className="h-11 rounded-xl bg-slate-100/90 border-slate-200 text-slate-800 font-bold cursor-not-allowed text-sm"
                  />
                  <p className="text-[11px] text-slate-500 font-medium">Posición formal en el organigrama de AGBC</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase tracking-wider text-[#002F6C]">Correo Electrónico Institucional</Label>
                  <Input
                    value={usuario?.email || "funcionario@correos.gob.bo"}
                    disabled
                    className="h-11 rounded-xl bg-slate-100/90 border-slate-200 text-slate-800 font-bold cursor-not-allowed text-sm"
                  />
                  <p className="text-[11px] text-slate-500 font-medium">Canal oficial para notificaciones y accesos</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase tracking-wider text-[#002F6C]">Estado de Verificación y Acceso</Label>
                  <div className="flex h-11 items-center gap-2.5 rounded-xl bg-emerald-50 px-4 border border-emerald-200 text-xs font-black text-emerald-700">
                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
                    <span>Funcionario Activo • Cuenta Verificada</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">Sesión institucional activa con permisos vigentes</p>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="rounded-xl font-bold text-slate-600 hover:bg-slate-100 h-10 px-5"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-5">
              <div className="rounded-2xl bg-amber-50 p-4 border border-amber-200/80 flex items-start gap-3">
                <KeyRound className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                  Por seguridad institucional de la Agencia Boliviana de Correos, utiliza una contraseña robusta de al menos 8 caracteres que combine letras mayúsculas, minúsculas, números y símbolos.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#002F6C]">Contraseña Actual</Label>
                <div className="relative">
                  <Input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Ingresa tu contraseña actual"
                    required
                    className="h-11 rounded-xl pr-10 border-slate-200 focus:border-[#0E5296] text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#002F6C]">Nueva Contraseña</Label>
                  <div className="relative">
                    <Input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nueva contraseña"
                      required
                      className="h-11 rounded-xl pr-10 border-slate-200 focus:border-[#0E5296] text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#002F6C]">Confirmar Nueva Contraseña</Label>
                  <div className="relative">
                    <Input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repite la nueva contraseña"
                      required
                      className="h-11 rounded-xl pr-10 border-slate-200 focus:border-[#0E5296] text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Medidor de Seguridad */}
              {newPassword.length > 0 && (
                <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-600">Nivel de seguridad de contraseña:</span>
                    <span className={passwordStrength.textClass}>{passwordStrength.label}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${passwordStrength.colorClass}`}
                      style={{ width: `${passwordStrength.percent}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="rounded-xl font-bold text-slate-600 hover:bg-slate-100 h-10 px-5"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isChangingPwd || !newPassword || newPassword !== confirmPassword}
                  className="rounded-xl bg-[#002F6C] hover:bg-[#0E5296] font-bold text-white shadow-md shadow-[#002F6C]/20 gap-2 h-10 px-5"
                >
                  {isChangingPwd ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                  <span>Actualizar Contraseña</span>
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
