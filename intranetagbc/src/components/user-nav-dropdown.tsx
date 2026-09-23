"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  UserCircle2,
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
import { PerfilDialog } from "@/components/perfil-dialog"

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
  const [isPerfilModalOpen, setIsPerfilModalOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const name = propUser?.name || session?.user?.name || "Funcionario Institucional"
  const email = propUser?.email || session?.user?.email || "funcionario@correos.gob.bo"
  const image = propUser?.image || session?.user?.image || null
  const cargo = propUser?.cargo || propUser?.rol || (session?.user as any)?.role || "Funcionario Público"
  const isAdminUser = propEsAdmin ?? (propUser?.esAdmin || (cargo && /admin|administrador|director/i.test(cargo)))

  const initials = getInitials(name)
  const avatarColor = getAvatarColor(name)
  const cleanImg = cleanImageUrl(image)

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev)
  }

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
    <>
      <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
        {/* ── BOTÓN TRIGGER PRINCIPAL (COMPACTO, ELEGANTE, SOLO CLICK) ── */}
        <button
          type="button"
          onClick={toggleDropdown}
          aria-expanded={isOpen}
          aria-haspopup="true"
          disabled={isSigningOut}
          className={`group relative flex items-center gap-2 rounded-2xl py-1 px-2 sm:pr-3 transition-all duration-200 select-none cursor-pointer border ${
            isOpen
              ? "border-[#002F6C] bg-white shadow-md ring-2 ring-[#FFCC00]/50"
              : "border-slate-200/90 bg-white hover:border-[#002F6C]/40 hover:bg-slate-50 shadow-2xs active:scale-95"
          }`}
        >
          {/* Avatar Compacto con Anillo Dorado y Estado Activo */}
          <div className="relative shrink-0">
            {cleanImg ? (
              <div className="relative h-8 w-8 sm:h-9 sm:w-9 overflow-hidden rounded-xl border-2 border-white shadow-2xs ring-2 ring-[#FFCC00]">
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
                className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl text-[11px] font-black shadow-2xs ring-2 ring-[#FFCC00]"
                style={{ backgroundColor: avatarColor.bg, color: avatarColor.text }}
              >
                {initials}
              </div>
            )}

            {/* Micro Indicador de conexión verde */}
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
            </span>
          </div>

          {/* Datos de Usuario: Nombre + Cargo */}
          <div className="hidden text-left sm:block min-w-0 max-w-[140px] md:max-w-[170px]">
            <p className="truncate text-xs font-black text-[#002F6C] group-hover:text-[#0E5296] transition-colors leading-tight">
              {name}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <Briefcase className="h-2.5 w-2.5 shrink-0 text-[#0E5296]" />
              <p className="truncate text-[10px] font-bold text-slate-500">
                {cargo}
              </p>
            </div>
          </div>

          {/* Chevron */}
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100 group-hover:bg-[#002F6C]/10 transition-colors">
            <ChevronDown
              className={`h-3 w-3 text-[#002F6C] transition-transform duration-200 ${
                isOpen ? "rotate-180 text-[#0E5296]" : ""
              }`}
            />
          </div>
        </button>

        {/* ── DROPDOWN FLOTANTE COMPACTO Y ESTILIZADO ── */}
        {isOpen && (
          <div className="absolute right-0 top-full z-50 mt-2.5 w-76 sm:w-80 origin-top-right rounded-3xl border-2 border-[#002F6C]/15 bg-white shadow-2xl shadow-[#002F6C]/25 overflow-hidden animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-150">
            {/* Barra superior dorada */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#FFB800] via-[#FFCC00] to-[#FFB800]" />

            {/* Encabezado de Perfil */}
            <div className="bg-gradient-to-br from-[#002F6C] via-[#0E5296] to-[#002F6C] p-3.5 text-white">
              <div className="flex items-start gap-3">
                <div className="relative shrink-0">
                  {cleanImg ? (
                    <div className="relative h-12 w-12 overflow-hidden rounded-2xl border-2 border-[#FFCC00] shadow-md">
                      <Image src={cleanImg} alt={name} fill className="object-cover" unoptimized />
                    </div>
                  ) : (
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-black border-2 border-[#FFCC00] shadow-md"
                      style={{ backgroundColor: avatarColor.bg, color: avatarColor.text }}
                    >
                      {initials}
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-[#002F6C] bg-emerald-500" />
                </div>

                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="truncate text-sm font-black tracking-tight text-white leading-tight">
                    {name}
                  </p>
                  <div className="inline-flex items-center gap-1 rounded-full bg-[#FFB800]/20 px-2 py-0.5 text-[10px] font-black text-[#FFCC00] border border-[#FFCC00]/30">
                    <ShieldCheck className="h-2.5 w-2.5 shrink-0" />
                    <span className="truncate">{cargo}</span>
                  </div>
                </div>
              </div>

              {/* Correo institucional */}
              <div className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-black/25 px-2.5 py-1.5 text-[11px] font-medium text-blue-100 border border-white/10">
                <Mail className="h-3 w-3 shrink-0 text-[#FFCC00]" />
                <span className="truncate">{email}</span>
              </div>
            </div>

            {/* Opciones del Dropdown */}
            <div className="p-2 space-y-1 bg-slate-50/50">
              {/* 1. Mi Perfil (Abre Ventana Modal Grande) */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  setIsPerfilModalOpen(true)
                }}
                className="group flex w-full items-center gap-2.5 rounded-2xl p-2 text-left transition-all duration-150 hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 cursor-pointer"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#002F6C]/10 text-[#002F6C] transition-all duration-150 group-hover:bg-[#002F6C] group-hover:text-[#FFCC00] group-hover:scale-105">
                  <UserCircle2 className="h-4.5 w-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-[#002F6C] group-hover:text-[#0E5296]">
                    Mi Perfil
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium truncate">
                    Ver mis datos, foto y credenciales
                  </p>
                </div>
              </button>

              {/* 2. Panel Administrativo (SOLO PARA ADMIN / GESTOR) */}
              {isAdminUser && (
                <Link
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="group flex items-center gap-2.5 rounded-2xl p-2 transition-all duration-150 hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 cursor-pointer"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0E5296]/10 text-[#0E5296] transition-all duration-150 group-hover:bg-[#0E5296] group-hover:text-white group-hover:scale-105">
                    <LayoutDashboard className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-[#002F6C] group-hover:text-[#0E5296]">
                      Panel Administrativo
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium truncate">
                      Gestión y administración
                    </p>
                  </div>
                </Link>
              )}

              <div className="my-1 h-px bg-slate-200/80" />

              {/* 3. Cerrar Sesión */}
              <button
                type="button"
                onClick={handleLogout}
                disabled={isSigningOut}
                className="group flex w-full items-center gap-2.5 rounded-2xl p-2 text-left transition-all duration-150 hover:bg-red-50 hover:border-red-200 border border-transparent cursor-pointer"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 transition-all duration-150 group-hover:bg-red-600 group-hover:text-white group-hover:scale-105">
                  {isSigningOut ? (
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  ) : (
                    <LogOut className="h-4.5 w-4.5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-red-600 group-hover:text-red-700">
                    {isSigningOut ? "Cerrando sesión..." : "Cerrar sesión"}
                  </p>
                  <p className="text-[10px] text-red-500/80 font-medium truncate">
                    Finalizar jornada
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── VENTANA MODAL GRANDE DE MI PERFIL ── */}
      <PerfilDialog
        open={isPerfilModalOpen}
        onOpenChange={setIsPerfilModalOpen}
        usuario={{
          name,
          email,
          image,
          cargo,
          rol: cargo,
          esAdmin: isAdminUser,
        }}
        esAdmin={isAdminUser}
      />
    </>
  )
}
