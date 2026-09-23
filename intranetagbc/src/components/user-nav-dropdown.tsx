"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  UserCircle2,
  Bell,
  LogOut,
  LayoutDashboard,
  ChevronDown,
  Sparkles,
  Hand,
  Briefcase,
  Loader2,
  Mail,
  ShieldCheck,
} from "lucide-react"
import toast from "react-hot-toast"
import { authClient } from "@/lib/auth-client"

export interface UserNavProfile {
  id?: string | null
  name?: string | null
  email?: string | null
  image?: string | null
  cargo?: string | null
  rol?: string | null
  esAdmin?: boolean
}

interface UserNavDropdownProps {
  usuario?: UserNavProfile | null
  esAdmin?: boolean
  className?: string
}

function cleanImageUrl(url?: string | null): string {
  if (!url || typeof url !== "string") return ""
  return url.split("?")[0].trim()
}

/* ── Paleta de colores estilo Google Meet para avatares sin foto ── */
const AVATAR_COLORS = [
  { bg: "#1A73E8", text: "#FFFFFF" },
  { bg: "#002F6C", text: "#FFCC00" },
  { bg: "#0B8043", text: "#FFFFFF" },
  { bg: "#F29900", text: "#FFFFFF" },
  { bg: "#8430CE", text: "#FFFFFF" },
  { bg: "#0E5296", text: "#FFFFFF" },
  { bg: "#1E8E3E", text: "#FFFFFF" },
  { bg: "#185ABC", text: "#FFCC00" },
  { bg: "#E37400", text: "#FFFFFF" },
  { bg: "#00897B", text: "#FFFFFF" },
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
  return AVATAR_COLORS[hashName(name || "Usuario") % AVATAR_COLORS.length]
}

function getInitials(name?: string | null): string {
  if (!name || typeof name !== "string") return "FP"
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase() || "FP"
}

function mostrarDespedida(nombre?: string | null) {
  const firstName = nombre ? nombre.trim().split(/\s+/)[0] : ""
  toast.custom(
    (t) => (
      <div
        className={`pointer-events-auto flex w-full max-w-md items-center gap-4 overflow-hidden rounded-3xl border-2 border-[#002F6C]/20 bg-white p-4 shadow-2xl shadow-[#0E5296]/20 ${
          t.visible
            ? "animate-in fade-in zoom-in-95 slide-in-from-top-3 duration-500"
            : "animate-out fade-out zoom-out-95 slide-out-to-top-3 duration-300"
        }`}
      >
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#002F6C] to-[#0E5296] text-[#FFB800] shadow-lg shadow-[#0E5296]/25">
          <Hand className="h-7 w-7" />
          <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-[#FFCC00] animate-pulse" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-base sm:text-lg font-black tracking-tight text-[#002F6C]">
            ¡Hasta pronto{firstName ? `, ${firstName}` : ""}!
          </p>
          <p className="mt-0.5 text-xs text-slate-600 font-medium">
            Tu sesión ha sido cerrada de forma segura. Gracias por tu labor.
          </p>
        </div>
      </div>
    ),
    { position: "top-center", duration: 3200 },
  )
}

export function UserNavDropdown({ usuario: propUser, esAdmin: propEsAdmin, className = "" }: UserNavDropdownProps) {
  const router = useRouter()
  const { data: session } = authClient.useSession()

  const [isOpen, setIsOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Nombre, email, cargo y foto
  const name = propUser?.name || session?.user?.name || "Funcionario Institucional"
  const email = propUser?.email || session?.user?.email || "funcionario@correos.gob.bo"
  const image = propUser?.image || session?.user?.image || null
  const cargo = propUser?.cargo || propUser?.rol || (session?.user as any)?.role || "Funcionario Público"

  // Solo es admin si tiene rol de administrador o permiso de dashboard explícito
  const isAdminUser = propEsAdmin ?? (propUser?.esAdmin || (cargo && /admin|administrador|director/i.test(cargo)))

  const initials = getInitials(name)
  const avatarColor = getAvatarColor(name)
  const cleanImg = cleanImageUrl(image)

  // Apertura y cierre estrictamente por CLICK
  const toggleDropdown = () => {
    setIsOpen((prev) => !prev)
  }

  // Cerrar al hacer click afuera o con Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  const handleLogout = useCallback(async () => {
    setIsSigningOut(true)
    setIsOpen(false)
    try {
      await authClient.signOut()
      mostrarDespedida(name)
      setTimeout(() => {
        router.replace("/")
        router.refresh()
      }, 850)
    } catch {
      setIsSigningOut(false)
    }
  }, [name, router])

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      {/* ── BOTÓN TRIGGER PRINCIPAL (SOLO CLICK) ── */}
      <button
        type="button"
        onClick={toggleDropdown}
        aria-expanded={isOpen}
        aria-haspopup="true"
        disabled={isSigningOut}
        className={`group relative flex items-center gap-3 rounded-2xl py-1.5 px-2.5 sm:pr-3.5 transition-all duration-200 select-none cursor-pointer border ${
          isOpen
            ? "border-[#002F6C] bg-white shadow-lg ring-2 ring-[#FFCC00]/60 scale-[1.01]"
            : "border-slate-200/90 bg-white/95 hover:border-[#002F6C]/40 hover:bg-slate-50/90 hover:shadow-md active:scale-95"
        }`}
      >
        {/* Avatar con Anillo Institucional Dorado y Estado Activo */}
        <div className="relative shrink-0">
          {cleanImg ? (
            <div className="relative h-10 w-10 sm:h-11 sm:w-11 overflow-hidden rounded-xl border-2 border-white shadow-xs ring-2 ring-[#FFCC00]">
              <Image
                src={cleanImg}
                alt={name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                unoptimized
              />
            </div>
          ) : (
            <div
              className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl text-xs font-black shadow-xs ring-2 ring-[#FFCC00]"
              style={{ backgroundColor: avatarColor.bg, color: avatarColor.text }}
            >
              {initials}
            </div>
          )}

          {/* Indicador de conexión verde con micro pulso */}
          <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
          </span>
        </div>

        {/* Datos de Usuario: Nombre Real + Cargo Institucional Real */}
        <div className="hidden text-left sm:block min-w-0 max-w-[160px] md:max-w-[200px]">
          <p className="truncate text-xs font-black text-[#002F6C] group-hover:text-[#0E5296] transition-colors leading-tight">
            {name}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <Briefcase className="h-3 w-3 shrink-0 text-[#0E5296]" />
            <p className="truncate text-[11px] font-bold text-slate-600">
              {cargo}
            </p>
          </div>
        </div>

        {/* Chevron con rotación fluida al abrir */}
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-100 group-hover:bg-[#002F6C]/10 transition-colors">
          <ChevronDown
            className={`h-3.5 w-3.5 text-[#002F6C] transition-transform duration-200 ${
              isOpen ? "rotate-180 text-[#0E5296]" : ""
            }`}
          />
        </div>
      </button>

      {/* ── DROPDOWN FLOTANTE ELEGANTE CON IDENTIDAD AGBC ── */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2.5 w-80 sm:w-88 origin-top-right rounded-3xl border-2 border-[#002F6C]/15 bg-white shadow-2xl shadow-[#002F6C]/25 overflow-hidden animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-150">
          {/* Barra superior de acento dorado */}
          <div className="h-1.5 w-full bg-gradient-to-r from-[#FFB800] via-[#FFCC00] to-[#FFB800]" />

          {/* Encabezado Institucional con Datos Completos */}
          <div className="bg-gradient-to-br from-[#002F6C] via-[#0E5296] to-[#002F6C] p-4 text-white">
            <div className="flex items-start gap-3.5">
              {/* Foto o Iniciales en el Card */}
              <div className="relative shrink-0">
                {cleanImg ? (
                  <div className="relative h-14 w-14 overflow-hidden rounded-2xl border-2 border-[#FFCC00] shadow-md">
                    <Image src={cleanImg} alt={name} fill className="object-cover" unoptimized />
                  </div>
                ) : (
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl text-base font-black border-2 border-[#FFCC00] shadow-md"
                    style={{ backgroundColor: avatarColor.bg, color: avatarColor.text }}
                  >
                    {initials}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-[#002F6C] bg-emerald-500 shadow-xs" />
              </div>

              {/* Nombre y Cargo */}
              <div className="min-w-0 flex-1 space-y-1">
                <p className="truncate text-base font-black tracking-tight text-white leading-tight">
                  {name}
                </p>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FFB800]/20 px-2.5 py-0.5 text-[11px] font-black text-[#FFCC00] border border-[#FFCC00]/30 shadow-xs">
                  <ShieldCheck className="h-3 w-3 shrink-0" />
                  <span className="truncate">{cargo}</span>
                </div>
              </div>
            </div>

            {/* Pastilla Elegante del Correo Institucional */}
            <div className="mt-3.5 flex items-center gap-2 rounded-xl bg-black/25 px-3 py-2 text-xs font-medium text-blue-100 border border-white/10 backdrop-blur-xs">
              <Mail className="h-3.5 w-3.5 shrink-0 text-[#FFCC00]" />
              <span className="truncate tracking-wide">{email}</span>
            </div>
          </div>

          {/* Cuerpo del Menú de Opciones */}
          <div className="p-2.5 space-y-1 bg-slate-50/50">
            {/* 1. Mi Perfil (Disponible para todos los usuarios) */}
            <Link
              href="/perfil"
              onClick={() => setIsOpen(false)}
              className="group flex items-center gap-3 rounded-2xl p-2.5 transition-all duration-150 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200/80 cursor-pointer"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#002F6C]/10 text-[#002F6C] transition-all duration-150 group-hover:bg-[#002F6C] group-hover:text-[#FFCC00] group-hover:scale-105 shadow-2xs">
                <UserCircle2 className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-[#002F6C] group-hover:text-[#0E5296] transition-colors">
                  Mi Perfil
                </p>
                <p className="text-[11px] text-slate-500 font-medium truncate">
                  Consultar y actualizar mis datos personales
                </p>
              </div>
            </Link>

            {/* 2. Notificaciones (Disponible para todos los usuarios) */}
            <Link
              href="/notificaciones"
              onClick={() => setIsOpen(false)}
              className="group flex items-center gap-3 rounded-2xl p-2.5 transition-all duration-150 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200/80 cursor-pointer"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-[#002F6C] transition-all duration-150 group-hover:bg-[#FFB800] group-hover:text-[#002F6C] group-hover:scale-105 shadow-2xs">
                <Bell className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-[#002F6C] group-hover:text-amber-800 transition-colors">
                  Notificaciones
                </p>
                <p className="text-[11px] text-slate-500 font-medium truncate">
                  Avisos institucionales y comunicados
                </p>
              </div>
            </Link>

            {/* 3. Panel Administrativo (SOLO PARA ADMINISTRADORES / GESTORES) */}
            {isAdminUser && (
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="group flex items-center gap-3 rounded-2xl p-2.5 transition-all duration-150 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200/80 cursor-pointer"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0E5296]/10 text-[#0E5296] transition-all duration-150 group-hover:bg-[#0E5296] group-hover:text-white group-hover:scale-105 shadow-2xs">
                  <LayoutDashboard className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-[#002F6C] group-hover:text-[#0E5296] transition-colors">
                    Panel Administrativo
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium truncate">
                    Gestión integral de la Intranet
                  </p>
                </div>
              </Link>
            )}

            {/* Línea divisoria antes de cerrar sesión */}
            <div className="my-1.5 h-px bg-slate-200/80" />

            {/* 4. Cerrar Sesión */}
            <button
              type="button"
              onClick={handleLogout}
              disabled={isSigningOut}
              className="group flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition-all duration-150 hover:bg-red-50 hover:border-red-200 border border-transparent cursor-pointer"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 transition-all duration-150 group-hover:bg-red-600 group-hover:text-white group-hover:scale-105 shadow-2xs">
                {isSigningOut ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <LogOut className="h-5 w-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-red-600 group-hover:text-red-700 transition-colors">
                  {isSigningOut ? "Cerrando sesión..." : "Cerrar sesión"}
                </p>
                <p className="text-[11px] text-red-500/80 font-medium truncate">
                  Finalizar sesión de forma segura
                </p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
