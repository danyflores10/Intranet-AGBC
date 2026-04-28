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
  { label: "Reconocimientos", href: "#reconocimientos", icon: Trophy },
  { label: "Directorio", href: "#directorio", icon: Shield },
  { label: "Personal", href: "#equipo", icon: Users },
  { label: "Documentos", href: "#documentos", icon: FileText },
  { label: "Oficinas", href: "#cobertura", icon: MapPin },
]

export function LandingNavbar({ estaLogueado }: LandingNavbarProps) {
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
          <div className="mx-auto flex h-24 max-w-7xl items-center justify-between gap-2 px-4 lg:px-6">
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

            {/* NAV DESKTOP */}
            <div className="hidden lg:flex flex-1 items-center justify-center gap-0.5 xl:gap-1">
              {navItems.map((item) => {
                const isActive = activeSection === item.href.replace("#", "")

                return (
                  <button
                    key={item.href}
                    onClick={() => scrollToSection(item.href)}
                    className={`group relative flex items-center gap-1.5 rounded-full px-3 py-2.5 text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? "bg-gradient-to-r from-[#FFB300]/25 to-[#FF8800]/20"
                        : "text-foreground/80 hover:bg-[#FFB300]/8 hover:text-[#FF8800]"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="hidden xl:inline">{item.label}</span>
                  </button>
                )
              })}
            </div>

            {/* ACCIONES */}
            <div className="flex shrink-0 items-center gap-2">
              {estaLogueado ? (
                <LogoutButton />
              ) : (
                <>
                  <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
                    <Link href="/">Iniciar sesión</Link>
                  </Button>

                  <Button size="sm" asChild>
                    <Link href="/">
                      Acceder
                      <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Link>
                  </Button>
                </>
              )}

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="flex h-10 w-10 items-center justify-center rounded-full lg:hidden"
              >
                {mobileOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>

        {/* PROGRESO */}
        <div className="relative h-[6px] w-full bg-black/5">
          <div
            className="absolute top-0 left-0 h-full"
            style={{
              width: `${scrollProgress}%`,
              backgroundImage:
                "linear-gradient(to right, #FF0000, #FF8800, #FFD500, #00CC44, #00AAFF, #4400FF, #AA00FF)",
            }}
          />
        </div>
      </nav>

      {/* MOBILE */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />

          <div className="absolute top-[102px] left-0 right-0 bg-background p-4">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => scrollToSection(item.href)}
                className="block w-full text-left py-2"
              >
                {item.label}
              </button>
            ))}

            {!estaLogueado && (
              <Link href="/" className="block mt-4 text-center">
                Acceder
              </Link>
            )}
          </div>
        </div>
      )}

      {/* BOTÓN TOP */}
      {showTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 h-12 w-12 rounded-full bg-[#FFB300]"
        >
          <ChevronUp />
        </button>
      )}
    </>
  )
}