"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Newspaper,
  MegaphoneIcon,
  Globe,
  MapPin,
  Shield,
  Users,
  FileText,
  ArrowRight,
  Menu,
  X,
  ChevronUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { LogoutButton } from "@/components/logout-button"

interface NavItem {
  label: string
  href: string
  icon: typeof Newspaper
}

interface LandingNavbarProps {
  estaLogueado: boolean
  esAdmin: boolean
  usuario: { name: string; image?: string | null } | null
}

const NAV_ITEMS_PUBLICOS: NavItem[] = [
  { label: "Comunicados", href: "#comunicados", icon: MegaphoneIcon },
]

const NAV_ITEMS_LOGUEADO: NavItem[] = [
  { label: "Noticias", href: "#noticias", icon: Newspaper },
  { label: "Aplicaciones", href: "#aplicaciones", icon: Globe },
  { label: "Comunicados", href: "#comunicados", icon: MegaphoneIcon },
  { label: "Directorio", href: "#directorio", icon: Shield },
  { label: "Personal", href: "#equipo", icon: Users },
  { label: "Documentos", href: "#documentos", icon: FileText },
  { label: "Oficinas", href: "#cobertura", icon: MapPin },
]

export function LandingNavbar({ estaLogueado, esAdmin, usuario }: LandingNavbarProps) {
  const [scrolled, setScrolled] = useState(false)
  const [showTop, setShowTop] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [activeSection, setActiveSection] = useState("")
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems = estaLogueado ? NAV_ITEMS_LOGUEADO : NAV_ITEMS_PUBLICOS

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 20)
      setShowTop(window.scrollY > 400)

      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0
      setScrollProgress(Math.min(100, Math.max(0, progress)))

      const sections = navItems.map((item) => item.href.replace("#", ""))
      let found = ""

      for (const id of sections) {
        const el = document.getElementById(id)
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.top <= 140 && rect.bottom > 140) {
            found = id
            break
          }
        }
      }

      setActiveSection(found)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener("scroll", handleScroll)
  }, [navItems])

  const scrollToSection = useCallback((href: string) => {
    setMobileOpen(false)
    const id = href.replace("#", "")
    const el = document.getElementById(id)

    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 100
      window.scrollTo({ top, behavior: "smooth" })
    }
  }, [])

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "shadow-lg shadow-[#FFB300]/8" : ""
        }`}
      >
        <div className="border-b border-[#FFB300]/15 bg-background">
          {/* Grid 3 columnas iguales: logo | nav centrado | acciones */}
          <div className="mx-auto flex h-24 max-w-7xl items-center justify-between gap-2 px-4 lg:px-6">

            {/* Logo — columna izquierda */}
            <Link href="/" className="flex shrink-0 items-center gap-2" onClick={scrollToTop}>
              <Image
                src="/image/Logooriginal.png"
                alt="Correos de Bolivia"
                width={180}
                height={60}
                className="h-14 w-auto object-contain dark:hidden"
                style={{ width: "auto" }}
                priority
              />
              <Image
                src="/image/LogoAmarillo.png"
                alt="Correos de Bolivia"
                width={180}
                height={60}
                className="hidden h-14 w-auto object-contain dark:block"
                style={{ width: "auto" }}
                priority
              />
            </Link>

            {/* Nav desktop — columna central, centrado */}
            <div className="hidden lg:flex flex-1 items-center justify-center gap-0.5 xl:gap-1">
              {navItems.map((item) => {
                const isActive = activeSection === item.href.replace("#", "")

                return (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => scrollToSection(item.href)}
                    className={`group relative flex items-center gap-1.5 rounded-full px-3 py-2.5 text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? "bg-gradient-to-r from-[#FFB300]/25 to-[#FF8800]/20 text-[#1a1000] dark:text-[#FFE8A3] dark:from-[#FFB300]/20 dark:to-[#FF8800]/15"
                        : "text-foreground/80 hover:bg-[#FFB300]/8 hover:text-[#FF8800] dark:text-white/90 dark:hover:bg-[#FFB300]/10 dark:hover:text-[#FFD166]"
                    }`}
                  >
                    <item.icon
                      className={`h-4 w-4 transition-transform duration-300 group-hover:scale-110 ${
                        isActive ? "text-[#FF8800] dark:text-[#FFD166]" : "text-current"
                      }`}
                    />
                    <span className="hidden xl:inline">{item.label}</span>

                    {isActive && (
                      <span className="absolute -bottom-[11px] left-1/2 h-[3px] w-8 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#FFB300] to-[#FF8800]" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Acciones — derecha */}
            <div className="flex shrink-0 items-center gap-2">
              {estaLogueado ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="hidden h-9 rounded-full text-xs font-semibold transition-colors duration-300 hover:bg-[#FFB300]/10 hover:text-[#FF8800] xl:inline-flex"
                  >
                    <Link href="/dashboard">
                      {esAdmin ? "Panel Admin" : "Mi Panel"}
                    </Link>
                  </Button>

                  <div className="flex items-center gap-2.5">
                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#FFB300]/40 bg-gradient-to-br from-[#FFB300]/20 to-[#FF8800]/20 shadow-sm ring-2 ring-[#FFB300]/10 ring-offset-1 ring-offset-background">
                      {usuario?.image ? (
                        <img
                          src={usuario.image}
                          alt={usuario?.name ?? ""}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-bold text-[#FF8800] dark:text-[#FFD166]">
                          {usuario?.name?.charAt(0)?.toUpperCase() ?? "U"}
                        </span>
                      )}
                      <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-emerald-500" />
                    </div>

                    <span className="hidden max-w-[90px] truncate text-xs font-medium text-foreground xl:inline">
                      {usuario?.name}
                    </span>
                  </div>

                  <LogoutButton />
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="hidden h-10 rounded-full text-sm font-medium transition-colors duration-300 hover:bg-[#FFB300]/10 hover:text-[#FF8800] sm:inline-flex"
                  >
                    <Link href="/">Iniciar sesión</Link>
                  </Button>

                  <Button
                    size="sm"
                    asChild
                    className="h-10 rounded-full border-0 bg-gradient-to-r from-[#FFB300] to-[#FF8800] px-6 text-sm font-bold text-[#1a1000] shadow-lg shadow-[#FFB300]/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#FFB300]/40"
                  >
                    <Link href="/">
                      Acceder
                      <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Link>
                  </Button>
                </>
              )}

              <button
                type="button"
                onClick={() => setMobileOpen(!mobileOpen)}
                className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-[#FFB300]/10 lg:hidden"
                aria-label="Menú"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="relative h-[6px] w-full overflow-hidden bg-black/5 dark:bg-white/5">
          <div
            className="absolute top-0 left-0 h-full transition-[width] duration-150 ease-out"
            style={{
              width: `${scrollProgress}%`,
              backgroundImage:
                "linear-gradient(to right, #FF0000, #FF8800, #FFD500, #00CC44, #00AAFF, #4400FF, #AA00FF)",
            }}
          />
          {scrollProgress > 0 && scrollProgress < 100 && (
            <div
              className="absolute top-0 h-full w-6 bg-gradient-to-r from-white/0 via-white/60 to-white/0 blur-[1px] transition-[left] duration-150 ease-out"
              style={{ left: `calc(${scrollProgress}% - 12px)` }}
            />
          )}
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute top-[102px] left-0 right-0 max-h-[70vh] overflow-y-auto border-b border-[#FFB300]/20 bg-background/98 shadow-xl shadow-[#FFB300]/10 backdrop-blur-xl">
            <div className="space-y-1 p-4">
              {navItems.map((item) => {
                const isActive = activeSection === item.href.replace("#", "")

                return (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => scrollToSection(item.href)}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? "bg-gradient-to-r from-[#FFB300]/15 to-transparent text-[#FF8800] dark:text-[#FFD166]"
                        : "text-foreground hover:bg-[#FFB300]/5 hover:text-[#FF8800] dark:text-white/90 dark:hover:text-[#FFD166]"
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300 ${
                        isActive
                          ? "bg-gradient-to-br from-[#FFB300] to-[#FF8800] text-[#1a1000] shadow-md shadow-[#FFB300]/25"
                          : "bg-muted/50 text-muted-foreground dark:bg-white/10 dark:text-white/70"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                    </div>

                    <span className="inline">{item.label}</span>

                    {isActive && (
                      <div className="ml-auto h-1.5 w-1.5 rounded-full bg-[#FF8800] dark:bg-[#FFD166]" />
                    )}
                  </button>
                )
              })}

              <div className="mt-3 border-t border-[#FFB300]/15 pt-3">
                {estaLogueado ? (
                  <Link
                    href="/dashboard"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FFB300] to-[#FF8800] px-4 py-3 text-sm font-bold text-[#1a1000] shadow-lg shadow-[#FFB300]/25"
                  >
                    {esAdmin ? "Panel de Administración" : "Mi Panel"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <Link
                    href="/"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FFB300] to-[#FF8800] px-4 py-3 text-sm font-bold text-[#1a1000] shadow-lg shadow-[#FFB300]/25"
                  >
                    Acceder a la plataforma
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botón volver arriba */}
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Volver arriba"
        className={`fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#FFB300] to-[#FF8800] text-[#1a1000] shadow-xl shadow-[#FFB300]/30 transition-all duration-500 hover:scale-110 hover:shadow-2xl hover:shadow-[#FFB300]/40 active:scale-95 ${
          showTop
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-16 opacity-0"
        }`}
      >
        <ChevronUp className="h-5 w-5" strokeWidth={3} />
      </button>
    </>
  )
}
