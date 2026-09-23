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
  ShieldCheck,
  Loader2,
  Mail,
  User,
} from "lucide-react"
import toast from "react-hot-toast"
import { authClient } from "@/lib/auth-client"

export interface UserNavProfile {
  id?: string | null
  name?: string | null
  email?: string | null
  image?: string | null
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
  if (!name || typeof name !== "string") return "US"
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase() || "US"
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
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Combinar datos de props con sesión activa
  const name = propUser?.name || session?.user?.name || "Usuario Institucional"
  const email = propUser?.email || session?.user?.email || "funcionario@correos.gob.bo"
  const image = propUser?.image || session?.user?.image || null
  const rol = propUser?.rol || (session?.user as any)?.role || "Funcionario"
  const isAdminUser = propEsAdmin ?? (propUser?.esAdmin || (rol && /admin|director|gestor/i.test(rol)))

  const initials = getInitials(name)
  const avatarColor = getAvatarColor(name)
  const cleanImg = cleanImageUrl(image)

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsOpen(true)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false)
    }, 180) // Pequeño margen para movimiento diagonal del mouse
  }

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev)
  }

  // Cerrar al hacer click afuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
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
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative inline-block text-left ${className}`}
    >
      {/* ── BOTÓN TRIGGER PRINCIPAL (CHIP INTERACTIVO CON FOTO Y ROL) ── */}
      <button
        type="button"
        onClick={toggleDropdown}
        aria-expanded={isOpen}
        aria-haspopup="true"
        disabled={isSigningOut}
        className={`group relative flex items-center gap-2.5 rounded-full p-1 pr-3.5 transition-all duration-300 select-none cursor-pointer border shadow-sm ${
          isOpen
            ? "border-[#002F6C]/40 bg-gradient-to-r from-blue-50 via-white to-amber-50/60 shadow-md shadow-[#002F6C]/10 ring-2 ring-[#FFCC00]/50"
            : "border-slate-200/80 bg-white/90 hover:border-[#002F6C]/30 hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50/40 hover:shadow-md"
        }`}
      >
        {/* Avatar con Anillo y Estado Activo */}
        <div className="relative shrink-0">
          {cleanImg ? (
            <div className="relative h-9 w-9 sm:h-10 sm:w-10 overflow-hidden rounded-full border-2 border-white shadow-xs ring-2 ring-[#FFCC00]">
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
              className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full text-xs font-black shadow-xs ring-2 ring-[#FFCC00]"
              style={{ backgroundColor: avatarColor.bg, color: avatarColor.text }}
            >
              {initials}
            </div>
          )}

          {/* Indicador de conexión verde con micro pulso */}
          <span className="absolute bottom-0 right-0 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
          </span>
        </div>

        {/* Datos de Usuario (Nombre + Rol) */}
        <div className="hidden text-left sm:block min-w-0 max-w-[150px] lg:max-w-[180px]">
          <p className="truncate text-xs font-black text-[#002F6C] group-hover:text-[#0E5296] transition-colors leading-tight">
            {name}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="truncate text-[10px] font-bold text-slate-500 uppercase tracking-tight">
              {rol}
            </span>
          </div>
        </div>

        {/* Chevron Animado con rotación suave */}
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 group-hover:bg-[#002F6C]/10 transition-colors">
          <ChevronDown
            className={`h-3.5 w-3.5 text-[#002F6C] transition-transform duration-300 ease-out ${
              isOpen ? "rotate-180 text-[#0E5296]" : "group-hover:translate-y-0.5"
            }`}
          />
        </div>
      </button>

      {/* ── BARRIDO DE OPCIONES (DROPDOWN MENU ANIMADO HACIA ABAJO) ── */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2.5 w-72 sm:w-80 origin-top-right rounded-3xl border border-[#002F6C]/15 bg-white/95 p-3 shadow-2xl shadow-[#002F6C]/20 backdrop-blur-xl animate-in fade-in-0 zoom-in-95 slide-in-from-top-3 duration-200">
          {/* Header del Menú: Perfil Completo */}
          <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-[#002F6C] via-[#0E5296] to-[#002F6C] p-3.5 text-white shadow-md">
            <div className="relative shrink-0">
              {cleanImg ? (
                <div className="relative h-12 w-12 overflow-hidden rounded-2xl border-2 border-[#FFCC00] shadow-sm">
                  <Image src={cleanImg} alt={name} fill className="object-cover" unoptimized />
                </div>
              ) : (
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-black border-2 border-[#FFCC00]"
                  style={{ backgroundColor: avatarColor.bg, color: avatarColor.text }}
                >
                  {initials}
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-[#002F6C] bg-emerald-500" />
            </div>

            <div className="min-w-0 flex-1 space-y-0.5">
              <p className="truncate text-sm font-black tracking-tight text-white">{name}</p>
              <p className="truncate text-[11px] font-medium text-white/70 flex items-center gap-1">
                <Mail className="h-3 w-3 shrink-0 text-[#FFCC00]" />
                <span className="truncate">{email}</span>
              </p>
              <div className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#FFCC00] backdrop-blur-xs">
                <ShieldCheck className="h-3 w-3" />
                <span>{rol}</span>
              </div>
            </div>
          </div>

          {/* Línea Divisoria Sutil */}
          <div className="my-2 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

          {/* Opciones con Efecto de Barrido Suave */}
          <div className="space-y-1">
            {/* Opción 1: Mi Perfil */}
            <Link
              href="/perfil"
              onClick={() => setIsOpen(false)}
              className="group/item relative flex items-center gap-3 overflow-hidden rounded-2xl p-2.5 transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50 hover:via-amber-50/40 hover:to-transparent cursor-pointer"
            >
              {/* Barra lateral de barrido visual */}
              <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#002F6C] opacity-0 transition-all duration-200 group-hover/item:opacity-100 group-hover/item:scale-y-100" />

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#002F6C] transition-all duration-200 group-hover/item:bg-[#002F6C] group-hover/item:text-[#FFCC00] group-hover/item:scale-105 shadow-2xs">
                <UserCircle2 className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-[#002F6C] group-hover/item:text-[#0E5296] transition-colors">
                  Mi Perfil
                </p>
                <p className="text-[11px] text-slate-500 font-medium truncate">
                  Mis datos, cargo y credenciales
                </p>
              </div>
            </Link>

            {/* Opción 2: Notificaciones */}
            <Link
              href="/notificaciones"
              onClick={() => setIsOpen(false)}
              className="group/item relative flex items-center gap-3 overflow-hidden rounded-2xl p-2.5 transition-all duration-200 hover:bg-gradient-to-r hover:from-amber-50 hover:via-blue-50/40 hover:to-transparent cursor-pointer"
            >
              <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#FFB800] opacity-0 transition-all duration-200 group-hover/item:opacity-100 group-hover/item:scale-y-100" />

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 transition-all duration-200 group-hover/item:bg-[#FFB800] group-hover/item:text-[#002F6C] group-hover/item:scale-105 shadow-2xs">
                <Bell className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-[#002F6C] group-hover/item:text-amber-800 transition-colors">
                  Notificaciones
                </p>
                <p className="text-[11px] text-slate-500 font-medium truncate">
                  Alertas y avisos institucionales
                </p>
              </div>
            </Link>

            {/* Opción 3 (Opcional si tiene acceso a administración): Panel Administrativo */}
            {isAdminUser && (
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="group/item relative flex items-center gap-3 overflow-hidden rounded-2xl p-2.5 transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50 hover:via-indigo-50/40 hover:to-transparent cursor-pointer"
              >
                <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#0E5296] opacity-0 transition-all duration-200 group-hover/item:opacity-100 group-hover/item:scale-y-100" />

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[#0E5296] transition-all duration-200 group-hover/item:bg-[#0E5296] group-hover/item:text-white group-hover/item:scale-105 shadow-2xs">
                  <LayoutDashboard className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-[#002F6C] group-hover/item:text-[#0E5296] transition-colors">
                    Panel Administrativo
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium truncate">
                    Gestión y herramientas del sistema
                  </p>
                </div>
              </Link>
            )}

            {/* Separador antes de salir */}
            <div className="my-1.5 h-px bg-slate-100" />

            {/* Opción 4: Cerrar Sesión */}
            <button
              type="button"
              onClick={handleLogout}
              disabled={isSigningOut}
              className="group/item relative flex w-full items-center gap-3 overflow-hidden rounded-2xl p-2.5 text-left transition-all duration-200 hover:bg-red-50 cursor-pointer"
            >
              <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-red-600 opacity-0 transition-all duration-200 group-hover/item:opacity-100 group-hover/item:scale-y-100" />

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 transition-all duration-200 group-hover/item:bg-red-600 group-hover/item:text-white group-hover/item:scale-105 shadow-2xs">
                {isSigningOut ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <LogOut className="h-5 w-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-red-600 group-hover/item:text-red-700 transition-colors">
                  {isSigningOut ? "Cerrando sesión..." : "Cerrar sesión"}
                </p>
                <p className="text-[11px] text-red-500/80 font-medium truncate">
                  Finalizar jornada de forma segura
                </p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
