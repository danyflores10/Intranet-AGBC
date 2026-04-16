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
  Zap,
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
  { label: "Módulos", href: "#features", icon: Zap },
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

      // Progreso de scroll
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0
      setScrollProgress(Math.min(100, Math.max(0, progress)))

      // Detectar sección activa
      const sections = navItems.map((item) => item.href.replace("#", ""))
      let found = ""
      for (const id of sections) {
        const el = document.getElementById(id)
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.top <= 120 && rect.bottom > 120) {
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
      const top = el.getBoundingClientRect().top + window.scrollY - 80
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
          scrolled
            ? "shadow-lg shadow-[#FFB300]/8"
            : ""
        }`}
      >
        {/* Barra principal */}
        <div className="bg-background border-b border-[#FFB300]/15">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-6">
            {/* Logo */}
            <Link href="/" className="flex shrink-0 items-center gap-2" onClick={scrollToTop}>
              <Image
                src="/image/Logooriginal.png"
                alt="Correos de Bolivia"
                width={140}
                height={40}
                className="h-10 w-auto object-contain dark:hidden"
                style={{ width: "auto" }}
                priority
              />
              <Image
                src="/image/LogoAmarillo.png"
                alt="Correos de Bolivia"
                width={140}
                height={40}
                className="hidden h-10 w-auto object-contain dark:block"
                style={{ width: "auto" }}
                priority
              />
            </Link>

            {/* Nav links desktop */}
            <div className="hidden lg:flex items-center gap-0.5">
              {navItems.map((item) => {
                const isActive = activeSection === item.href.replace("#", "")
                return (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => scrollToSection(item.href)}
                    className={`group relative flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? "text-[#1a1000] bg-gradient-to-r from-[#FFB300]/25 to-[#FF8800]/20 shadow-sm shadow-[#FFB300]/10"
                        : "text-foreground/70 hover:text-[#FF8800] hover:bg-[#FFB300]/8"
                    }`}
                  >
                    <item.icon className={`h-4 w-4 transition-transform duration-300 group-hover:scale-110 ${isActive ? "text-[#FF8800]" : ""}`} />
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="absolute -bottom-[11px] left-1/2 -translate-x-1/2 h-[3px] w-8 rounded-full bg-gradient-to-r from-[#FFB300] to-[#FF8800]" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {estaLogueado ? (
                <>
                  <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex h-9 text-sm font-semibold rounded-full hover:bg-[#FFB300]/10 hover:text-[#FF8800] transition-colors duration-300">
                    <Link href="/dashboard">
                      {esAdmin ? "Panel Admin" : "Mi Panel"}
                    </Link>
                  </Button>
                  <div className="flex items-center gap-2.5">
                    <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#FFB300]/40 bg-gradient-to-br from-[#FFB300]/20 to-[#FF8800]/20 shadow-sm ring-2 ring-[#FFB300]/10 ring-offset-1 ring-offset-background">
                      {usuario?.image ? (
                        <img
                          src={usuario.image}
                          alt={usuario?.name ?? ""}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-bold text-[#FF8800]">
                          {usuario?.name?.charAt(0)?.toUpperCase() ?? "U"}
                        </span>
                      )}
                      <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-emerald-500" />
                    </div>
                    <span className="text-sm font-medium text-foreground hidden md:inline max-w-[120px] truncate">
                      {usuario?.name}
                    </span>
                  </div>
                  <LogoutButton />
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex h-9 text-sm font-medium rounded-full hover:bg-[#FFB300]/10 hover:text-[#FF8800] transition-colors duration-300">
                    <Link href="/">Iniciar sesión</Link>
                  </Button>
                  <Button size="sm" asChild className="h-10 px-6 text-sm font-bold bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000] shadow-lg shadow-[#FFB300]/30 hover:shadow-xl hover:shadow-[#FFB300]/40 hover:scale-105 border-0 rounded-full transition-all duration-300">
                    <Link href="/">
                      Acceder
                      <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Link>
                  </Button>
                </>
              )}

              {/* Hamburger mobile */}
              <button
                type="button"
                onClick={() => setMobileOpen(!mobileOpen)}
                className="flex lg:hidden h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-[#FFB300]/10 transition-colors"
                aria-label="Menú"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Barra de progreso dinámica — arcoíris */}
        <div className="relative h-[5px] w-full bg-black/5 overflow-hidden">
          <div
            className="absolute top-0 left-0 h-full transition-[width] duration-150 ease-out"
            style={{
              width: `${scrollProgress}%`,
              backgroundImage: "linear-gradient(to right, #FF0000, #FF8800, #FFD500, #00CC44, #00AAFF, #4400FF, #AA00FF)",
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

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-[74px] left-0 right-0 max-h-[70vh] overflow-y-auto border-b border-[#FFB300]/20 bg-background/98 backdrop-blur-xl shadow-xl shadow-[#FFB300]/10">
            <div className="p-4 space-y-1">
              {navItems.map((item) => {
                const isActive = activeSection === item.href.replace("#", "")
                return (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => scrollToSection(item.href)}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? "text-[#FF8800] bg-gradient-to-r from-[#FFB300]/15 to-transparent"
                        : "text-foreground hover:bg-[#FFB300]/5 hover:text-[#FF8800]"
                    }`}
                  >
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300 ${
                      isActive
                        ? "bg-gradient-to-br from-[#FFB300] to-[#FF8800] text-[#1a1000] shadow-md shadow-[#FFB300]/25"
                        : "bg-muted/50 text-muted-foreground"
                    }`}>
                      <item.icon className="h-4 w-4" />
                    </div>
                    <span>{item.label}</span>
                    {isActive && (
                      <div className="ml-auto h-1.5 w-1.5 rounded-full bg-[#FF8800]" />
                    )}
                  </button>
                )
              })}

              <div className="border-t border-[#FFB300]/15 pt-3 mt-3">
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
        className={`fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#FFB300] to-[#FF8800] text-[#1a1000] shadow-xl shadow-[#FFB300]/30 transition-all duration-500 hover:shadow-2xl hover:shadow-[#FFB300]/40 hover:scale-110 active:scale-95 ${
          showTop
            ? "translate-y-0 opacity-100"
            : "translate-y-16 opacity-0 pointer-events-none"
        }`}
      >
        <ChevronUp className="h-5 w-5" strokeWidth={3} />
      </button>
    </>
  )
}
