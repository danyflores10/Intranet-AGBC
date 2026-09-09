"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import toast from "react-hot-toast"
import { HandIcon, SparklesIcon } from "lucide-react"

import { authClient } from "@/lib/auth-client"
import type { UsuarioRbac } from "@/lib/rbac"

function mostrarDespedida(nombre?: string | null) {
  toast.custom(
    (t) => (
      <div
        className={`pointer-events-auto flex w-full max-w-md items-center gap-4 overflow-hidden rounded-2xl border-2 border-[#002F6C]/20 bg-white p-4 shadow-2xl shadow-[#0E5296]/20 ${
          t.visible
            ? "animate-in fade-in zoom-in-95 slide-in-from-top-3 duration-500"
            : "animate-out fade-out zoom-out-95 slide-out-to-top-3 duration-300"
        }`}
      >
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#0E5296] text-[#FFB800] shadow-lg shadow-[#0E5296]/25">
          <HandIcon className="h-7 w-7" />
          <SparklesIcon className="absolute -top-1 -right-1 h-4 w-4 text-[#FFB800]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-black tracking-tight text-[#002F6C]">
            ¡Vuelve pronto{nombre ? `, ${nombre.split(" ")[0]}` : ""}!
          </p>
          <p className="mt-0.5 text-xs text-slate-600 font-medium">
            Gracias por tu trabajo hoy. Sesión cerrada correctamente.
          </p>
        </div>
      </div>
    ),
    { position: "top-center", duration: 3200 },
  )
}
import {
  ChevronsUpDownIcon,
  BadgeCheckIcon,
  BellIcon,
  LogOutIcon,
  Loader2,
  HomeIcon,
} from "lucide-react"

/* ── Paleta de colores estilo Google Meet ── */
const AVATAR_COLORS = [
  { bg: "#1A73E8", text: "#FFFFFF" }, // Azul Google
  { bg: "#E8453C", text: "#FFFFFF" }, // Rojo
  { bg: "#0B8043", text: "#FFFFFF" }, // Verde
  { bg: "#F29900", text: "#FFFFFF" }, // Naranja
  { bg: "#8430CE", text: "#FFFFFF" }, // Púrpura
  { bg: "#D93025", text: "#FFFFFF" }, // Rojo oscuro
  { bg: "#1E8E3E", text: "#FFFFFF" }, // Verde esmeralda
  { bg: "#185ABC", text: "#FFFFFF" }, // Azul marino
  { bg: "#E37400", text: "#FFFFFF" }, // Ámbar
  { bg: "#A142F4", text: "#FFFFFF" }, // Violeta
  { bg: "#00897B", text: "#FFFFFF" }, // Teal
  { bg: "#C2185B", text: "#FFFFFF" }, // Rosa oscuro
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

function getInitials(name: string | null | undefined): string {
  const words = (name ?? "")
    .split(" ")
    .map((word) => word.trim())
    .filter(Boolean)
    .slice(0, 2)

  if (words.length === 0) {
    return "US"
  }

  return words.map((word) => word[0]?.toUpperCase() ?? "").join("")
}

function formatearRol(roles: string[]): string {
  const principal = roles[0]?.trim()

  if (!principal) {
    return "Sin rol"
  }

  return principal
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ")
}

export function NavUser({ usuario }: { usuario: UsuarioRbac }) {
  const router = useRouter()
  const { isMobile } = useSidebar()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const displayName = usuario.name?.trim() || "Usuario"
  const displayEmail = usuario.email?.trim() || "Sin correo"
  const roleLabel = formatearRol(usuario.roles)
  const avatar = usuario.image ?? ""
  const initials = getInitials(displayName || displayEmail)

  async function handleLogout() {
    if (isSigningOut) {
      return
    }

    setIsSigningOut(true)

    try {
      await authClient.signOut()
      mostrarDespedida(displayName)
      window.setTimeout(() => {
        router.push("/")
        router.refresh()
      }, 900)
    } catch {
      setIsSigningOut(false)
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem data-tour="perfil">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-white/15 data-[state=open]:text-white hover:bg-white/10 text-white"
            >
              <Avatar className="h-8 w-8 rounded-lg shadow-sm">
                <AvatarImage src={avatar} alt={displayName} />
                <AvatarFallback
                  className="rounded-lg text-xs font-black bg-[#FFB800] text-[#002F6C]"
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-bold text-white">{displayName}</span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4 text-[#FFB800]" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={avatar} alt={displayName} />
                  <AvatarFallback
                    className="rounded-lg text-xs font-black bg-[#FFB800] text-[#002F6C]"
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  <span className="truncate text-xs">{displayEmail}</span>
                  <span className="truncate text-[11px] text-muted-foreground">{roleLabel}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={() => router.push("/perfil")}>
                <BadgeCheckIcon />
                Mi Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => router.push("/notificaciones")}>
                <BellIcon />
                Notificaciones
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => router.push("/")}>
              <HomeIcon />
              Ir al inicio
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={isSigningOut}
              onSelect={(event) => {
                event.preventDefault()
                void handleLogout()
              }}
            >
              {isSigningOut ? <Loader2 className="animate-spin" /> : <LogOutIcon />}
              {isSigningOut ? "Cerrando sesión..." : "Cerrar sesión"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
