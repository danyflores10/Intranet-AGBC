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
  Trophy,
  ArrowRight,
  Menu,
  X,
  ChevronUp,
  ChevronDown,
  LayoutGrid,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { LogoutButton } from "@/components/logout-button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

const NAV_ITEMS_MAIN: NavItem[] = [
  { label: "Noticias", href: "#noticias", icon: Newspaper },
  { label: "Comunicados", href: "#comunicados", icon: MegaphoneIcon },
  { label: "Documentos", href: "#documentos", icon: FileText },
  { label: "Oficinas", href: "#cobertura", icon: MapPin },
]

const SUBMENU_ITEMS = [
  {
    label: "Aplicaciones",
    description: "Acceso rápido a sistemas",
    href: "#aplicaciones",
    icon: Globe,
  },
  {
    label: "Directorio",
    description: "Directorio institucional y teléfonos",
    href: "#directorio",
    icon: Shield,
  },
  {
    label: "Personal",
    description: "Nómina y equipo de trabajo",
    href: "#equipo",
    icon: Users,
  },
]

export function LandingNavbar({ estaLogueado }: LandingNavbarProps) {
  const [scrolled, setScrolled] = useState(false)
  const [showTop, setShowTop] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [activeSection, setActiveSection] = useState("")
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const allSectionHrefs = estaLogueado
    ? ["#noticias", "#aplicaciones", "#comunicados", "#directorio", "#equipo", "#documentos", "#cobertura"]
    : ["#comunicados"]

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 20)
      setShowTop(window.scrollY > 400)

      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0
      setScrollProgress(Math.min(100, Math.max(0, progress)))

      const sections = allSectionHrefs.map((href) => href.replace("#", ""))
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
  }, [allSectionHrefs])

  const scrollToSection = useCallback((href: string) => {
    const id = href.replace("#", "")
    const el = document.getElementById(id)
    if (el) {
      const topOffset = 80
      const elementPosition = el.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - topOffset
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      })
    }
    setMobileOpen(false)
  }, [])

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  const isSubmenuActive = ["aplicaciones", "directorio", "equipo"].includes(activeSection)

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "shadow-lg shadow-[#0E5296]/10" : ""
        }`}
      >
        {/* Top Institutional Header Bar */}
        <div className="bg-[#002F6C] text-white text-xs font-semibold py-1.5 px-4 hidden md:block border-b border-white/10">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="flex items-center gap-4 text-[11px]">
              <span className="bg-[#FFCC00] text-[#002F6C] px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide">Intranet Institucional</span>
              <span className="text-white/90 font-medium">AGENCIA BOLIVIANA DE CORREOS — AGBC</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-white/80">
              <span>🇧🇴 Estado Plurinacional de Bolivia</span>
            </div>
          </div>
        </div>

        <div className="border-b-2 border-[#002F6C]/20 bg-[#FFCC00] shadow-md shadow-[#FFCC00]/20">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-2 px-4 lg:px-6">
            <Link href="/" className="flex shrink-0 items-center gap-2 py-1.5" onClick={scrollToTop}>
              <Image
                src="/image/Logooriginal.png"
                alt="Correos de Bolivia"
                width={180}
                height={60}
                className="h-11 w-auto object-contain drop-shadow-sm"
                style={{ width: "auto" }}
                priority
              />
            </Link>

            {/* NAV DESKTOP */}
            <div className="hidden lg:flex flex-1 items-center justify-center gap-1.5 xl:gap-2">
              {!estaLogueado ? (
                NAV_ITEMS_PUBLICOS.map((item) => {
                  const isActive = activeSection === item.href.replace("#", "")
                  return (
                    <button
                      key={item.href}
                      onClick={() => scrollToSection(item.href)}
                      className={`group relative flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-all duration-200 cursor-pointer ${
                        isActive
                          ? "bg-[#0E5296] text-white shadow-md shadow-[#0E5296]/25"
                          : "text-[#002F6C] hover:bg-[#002F6C]/10 hover:text-[#002F6C]"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </button>
                  )
                })
              ) : (
                <>
                  {/* Noticias */}
                  <button
                    onClick={() => scrollToSection("#noticias")}
                    className={`group relative flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-all duration-200 cursor-pointer ${
                      activeSection === "noticias"
                        ? "bg-[#0E5296] text-white shadow-md shadow-[#0E5296]/25"
                        : "text-[#002F6C] hover:bg-[#002F6C]/10 hover:text-[#002F6C]"
                    }`}
                  >
                    <Newspaper className="h-4 w-4" />
                    <span>Noticias</span>
                  </button>

                  {/* Dropdown unificado: Aplicaciones, Directorio y Personal */}
                  <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={`group relative flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-black transition-all duration-200 outline-none cursor-pointer ${
                          isSubmenuActive
                            ? "bg-[#0E5296] text-white shadow-md shadow-[#0E5296]/25"
                            : "text-[#002F6C] hover:bg-[#002F6C]/10 hover:text-[#002F6C]"
                        }`}
                      >
                        <LayoutGrid className={`h-4 w-4 ${isSubmenuActive ? "text-[#FFB800]" : "text-[#002F6C]"}`} />
                        <span>Gestión & Accesos</span>
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="center"
                      className="w-64 rounded-2xl border-2 border-[#002F6C]/20 bg-white p-2 shadow-xl shadow-[#0E5296]/20 animate-in fade-in-0 zoom-in-95"
                    >
                      {SUBMENU_ITEMS.map((subItem) => {
                        const isCurrentActive = activeSection === subItem.href.replace("#", "")
                        return (
                          <DropdownMenuItem
                            key={subItem.href}
                            onClick={() => scrollToSection(subItem.href)}
                            className={`flex items-center gap-3 rounded-xl p-2.5 cursor-pointer transition-colors ${
                              isCurrentActive
                                ? "bg-[#0E5296] text-white font-bold"
                                : "hover:bg-[#FFB800]/20 text-[#002F6C] focus:bg-[#FFB800]/20 focus:text-[#002F6C]"
                            }`}
                          >
                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                              isCurrentActive
                                ? "bg-[#FFB800] text-[#002F6C]"
                                : "bg-[#0E5296]/10 text-[#0E5296]"
                            }`}>
                              <subItem.icon className="h-4.5 w-4.5" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold">{subItem.label}</span>
                              <span className={`text-[11px] leading-tight ${isCurrentActive ? "text-white/80" : "text-slate-500"}`}>{subItem.description}</span>
                            </div>
                          </DropdownMenuItem>
                        )
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Resto de items: Comunicados, Reconocimientos, Documentos, Oficinas */}
                  {NAV_ITEMS_MAIN.slice(1).map((item) => {
                    const isActive = activeSection === item.href.replace("#", "")
                    return (
                      <button
                        key={item.href}
                        onClick={() => scrollToSection(item.href)}
                        className={`group relative flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-all duration-200 cursor-pointer ${
                          isActive
                            ? "bg-[#0E5296] text-white shadow-md shadow-[#0E5296]/25"
                            : "text-[#002F6C] hover:bg-[#002F6C]/10 hover:text-[#002F6C]"
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="hidden xl:inline">{item.label}</span>
                      </button>
                    )
                  })}
                </>
              )}
            </div>

            {/* ACCIONES */}
            <div className="flex shrink-0 items-center gap-2">
              {estaLogueado ? (
                <LogoutButton />
              ) : (
                <>
                  <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex text-[#0E5296] hover:bg-[#FFB800]/10 dark:text-[#FFB800]">
                    <Link href="/">Iniciar sesión</Link>
                  </Button>

                  <Button size="sm" asChild className="bg-[#0E5296] hover:bg-[#002F6C] font-bold text-white shadow-md shadow-[#0E5296]/20">
                    <Link href="/">
                      Acceder
                      <ArrowRight className="ml-1.5 h-4 w-4 text-[#FFB800]" />
                    </Link>
                  </Button>
                </>
              )}

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="flex h-10 w-10 items-center justify-center rounded-full lg:hidden text-foreground hover:bg-muted cursor-pointer"
                aria-label="Abrir menú"
              >
                {mobileOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>

        {/* BARRA DE PROGRESO */}
        <div className="relative h-[3px] w-full bg-slate-200">
          <div
            className="absolute top-0 left-0 h-full transition-all duration-150 bg-[#0E5296]"
            style={{
              width: `${scrollProgress}%`,
            }}
          />
        </div>
      </nav>

      {/* MENÚ MÓVIL */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />

          <div className="absolute top-[100px] left-0 right-0 max-h-[calc(100vh-110px)] overflow-y-auto border-b border-slate-200 bg-white p-5 shadow-2xl space-y-1">
            {!estaLogueado ? (
              NAV_ITEMS_PUBLICOS.map((item) => (
                <button
                  key={item.href}
                  onClick={() => scrollToSection(item.href)}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-bold text-[#002F6C] hover:bg-[#FFB800]/15"
                >
                  <item.icon className="h-5 w-5 text-[#0E5296]" />
                  <span>{item.label}</span>
                </button>
              ))
            ) : (
              <>
                <button
                  onClick={() => scrollToSection("#noticias")}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-bold text-[#002F6C] hover:bg-[#FFB800]/15"
                >
                  <Newspaper className="h-5 w-5 text-[#0E5296]" />
                  <span>Noticias</span>
                </button>

                {/* Subgrupo desplegable en móvil */}
                <div className="my-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 space-y-1">
                  <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-[#002F6C]">
                    <LayoutGrid className="h-3.5 w-3.5 text-[#0E5296]" />
                    <span>Gestión & Accesos</span>
                  </div>
                  {SUBMENU_ITEMS.map((sub) => (
                    <button
                      key={sub.href}
                      onClick={() => scrollToSection(sub.href)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-bold text-[#002F6C] hover:bg-[#FFB800]/20"
                    >
                      <sub.icon className="h-4 w-4 text-[#0E5296]" />
                      <span>{sub.label}</span>
                    </button>
                  ))}
                </div>

                {NAV_ITEMS_MAIN.slice(1).map((item) => (
                  <button
                    key={item.href}
                    onClick={() => scrollToSection(item.href)}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-bold text-[#002F6C] hover:bg-[#FFB800]/15"
                  >
                    <item.icon className="h-5 w-5 text-[#0E5296]" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </>
            )}

            {!estaLogueado && (
              <div className="pt-4 border-t border-slate-200">
                <Button asChild className="w-full bg-[#0E5296] hover:bg-[#002F6C] font-bold text-white">
                  <Link href="/">Acceder al Sistema</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BOTÓN SCROLL TO TOP */}
      {showTop && (
        <button
          onClick={scrollToTop}
          aria-label="Volver arriba"
          className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#0E5296] hover:bg-[#002F6C] text-[#FFB800] border-2 border-[#FFB800] shadow-xl shadow-[#0E5296]/30 transition-transform duration-200 hover:scale-110 active:scale-95 cursor-pointer"
        >
          <ChevronUp className="h-6 w-6 stroke-[3]" />
        </button>
      )}
    </>
  )
}