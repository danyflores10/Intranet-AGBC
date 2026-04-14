import Link from "next/link"
import Image from "next/image"
import { headers } from "next/headers"
import {
  Shield,
  Users,
  FileText,
  BarChart3,
  Mail,
  Clock,
  ArrowRight,
  Zap,
  Lock,
  Globe,
  ChevronRight,
  Sparkles,
  MapPin,
  Building2,
  CalendarDays,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { auth } from "@/lib/auth"
import { LandingComunicados } from "@/components/landing-comunicados"
import { LandingDocumentos } from "@/components/landing-documentos"
import { LandingNoticias } from "@/components/landing-noticias"
import { LandingNavbar } from "@/components/landing-navbar"
import { BoliviaMap } from "@/components/bolivia-map"
import { obtenerComunicadosPublicados, obtenerAccesosDirectosActivos, obtenerBannersActivos } from "@/actions/comunicaciones"
import { obtenerUsuarioRbacActual } from "@/lib/auth/session-access"
import { obtenerSucursalesActivas } from "@/actions/sucursales"
import { obtenerPersonal, obtenerDirectivos } from "@/actions/rrhh"
import { obtenerConfigPorGrupo } from "@/actions/configuracion"
import { obtenerDocumentos } from "@/actions/documentos"

const features = [
  {
    icon: Users,
    title: "Gestión de Personal",
    description: "Administra empleados, asistencia, vacaciones y nómina desde un solo lugar.",
    color: "from-[#FFB300] to-[#FF8800]",
  },
  {
    icon: FileText,
    title: "Documentos Digitales",
    description: "Crea, firma y archiva documentos con trazabilidad completa.",
    color: "from-[#FF8800] to-[#F5061D]",
  },
  {
    icon: Mail,
    title: "Correspondencia",
    description: "Control total del flujo de correspondencia interna y externa.",
    color: "from-[#FFB300] to-[#FF8800]",
  },
  {
    icon: BarChart3,
    title: "Reportes en Tiempo Real",
    description: "Dashboards interactivos con métricas clave de tu organización.",
    color: "from-[#FF8800] to-[#F5061D]",
  },
  {
    icon: Clock,
    title: "Trámites Ágiles",
    description: "Digitaliza y acelera los procesos burocráticos internos.",
    color: "from-[#FFB300] to-[#FF8800]",
  },
  {
    icon: Shield,
    title: "Auditoría y Seguridad",
    description: "Registro detallado de cada acción con control de acceso por roles.",
    color: "from-[#940533] to-[#C0012A]",
  },
]

const defaultSucursales = [
  {
    nombre: "Oficina Central — La Paz",
    direccion: "Av. Mariscal Santa Cruz Esq. Calle Oruro, Edificio Telecomunicaciones",
    tipo: "central" as const,
  },
  {
    nombre: "Regional Cochabamba",
    direccion: "Calle Ayacucho Esq. Av. Heroínas N° 113",
    tipo: "regional" as const,
  },
  {
    nombre: "Regional Santa Cruz",
    direccion: "Calle Cobija Entre Sucre y Ballivián N° 24",
    tipo: "regional" as const,
  },
  {
    nombre: "Regional Oruro",
    direccion: "Calle Presidente Montes Esq. Junín N° 1456",
    tipo: "regional" as const,
  },
  {
    nombre: "Regional Potosí",
    direccion: "Calle Hoyos Esq. Topater, Villa Imperial de Potosí",
    tipo: "regional" as const,
  },
  {
    nombre: "Regional Tarija",
    direccion: "Calle Mariscal Sucre Esq. Virginio Lema N° 397",
    tipo: "regional" as const,
  },
  {
    nombre: "Regional Sucre",
    direccion: "Calle Junín Esq. Ayacucho N° 699",
    tipo: "regional" as const,
  },
  {
    nombre: "Regional Beni",
    direccion: "Calle Cipriano Barace N° 10 Entre Manuel Limpias y Calle Sucre",
    tipo: "regional" as const,
  },
  {
    nombre: "Regional Pando",
    direccion: "Av. Bruno Racua N° 59",
    tipo: "regional" as const,
  },
]

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  const usuario = await obtenerUsuarioRbacActual()
  const esAdmin = usuario?.roles.includes("administrador") ?? false
  const estaLogueado = !!session

  const [comunicadosDb, bannersDb, accesosDirectos, sucursalesDb, personalDb, directivosDb, seccionesConfig, documentosDb] = await Promise.all([
    obtenerComunicadosPublicados(),
    obtenerBannersActivos(),
    obtenerAccesosDirectosActivos(),
    obtenerSucursalesActivas(),
    obtenerPersonal(),
    obtenerDirectivos(),
    obtenerConfigPorGrupo("secciones_landing"),
    obtenerDocumentos(),
  ])

  // Mapear configuración de secciones (por defecto todas visibles)
  const seccionVisible = (clave: string) => {
    const config = seccionesConfig.find((c) => c.clave === clave)
    return config ? config.valor === "true" : true
  }

  // Carrusel: datos de BD o fallback a los hardcoded
  const sucursales = sucursalesDb.length > 0
    ? sucursalesDb.map((s) => ({
        nombre: s.nombre,
        direccion: s.direccion,
        tipo: s.departamento === "La Paz" ? ("central" as const) : ("regional" as const),
      }))
    : defaultSucursales

  return (
    <main className="flex min-h-svh flex-col overflow-hidden">
      {/* ── Navbar ── */}
      <LandingNavbar
        estaLogueado={estaLogueado}
        esAdmin={esAdmin}
        usuario={usuario ? { name: usuario.name, image: usuario.image } : null}
      />

      {/* ── Hero ── */}
      <section className="relative pt-[70px]">
        {/* Animated background — dynamic amber aurora */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          {/* Grid pattern */}
          <div className="absolute inset-0 hero-grid-pattern animate-grid-pulse" />

          {/* Aurora gradient base */}
          <div className="absolute inset-0 animate-aurora bg-gradient-to-br from-[#FFB300]/15 via-transparent to-[#FF8800]/10" />

          {/* Main blobs */}
          <div className="animate-landing-blob absolute -top-32 -left-32 h-[600px] w-[600px] rounded-full bg-[#FFB300]/12 blur-[100px]" />
          <div className="animate-landing-blob-delay absolute -right-24 top-10 h-[500px] w-[500px] rounded-full bg-[#FF8800]/10 blur-[90px]" />
          <div className="animate-landing-blob-slow absolute bottom-10 left-1/4 h-[450px] w-[450px] rounded-full bg-[#FFB300]/8 blur-[110px]" />
          <div className="animate-landing-blob absolute top-1/3 right-1/4 h-[300px] w-[300px] rounded-full bg-[#FF8800]/6 blur-[80px]" />

          {/* Accent blob */}
          <div className="animate-landing-blob-delay absolute -bottom-20 right-1/3 h-[350px] w-[350px] rounded-full bg-[#940533]/5 blur-[100px]" />

          {/* Shimmer line */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="animate-shimmer absolute top-1/3 left-0 h-[1px] w-[400px] bg-gradient-to-r from-transparent via-[#FFB300]/30 to-transparent" />
          </div>

          {/* Floating particles */}
          <div className="animate-particle absolute top-[20%] left-[15%] h-2 w-2 rounded-full bg-[#FFB300]/40" style={{ animationDelay: '0s' }} />
          <div className="animate-particle absolute top-[40%] left-[70%] h-1.5 w-1.5 rounded-full bg-[#FF8800]/30" style={{ animationDelay: '2s' }} />
          <div className="animate-particle absolute top-[60%] left-[30%] h-1 w-1 rounded-full bg-[#FFB300]/50" style={{ animationDelay: '4s' }} />
          <div className="animate-particle absolute top-[30%] left-[85%] h-2.5 w-2.5 rounded-full bg-[#FFB300]/20" style={{ animationDelay: '1s' }} />
          <div className="animate-particle absolute top-[70%] left-[55%] h-1.5 w-1.5 rounded-full bg-[#FF8800]/35" style={{ animationDelay: '3s' }} />

          {/* Bottom gradient fade */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent" />
        </div>

        <div className="mx-auto max-w-7xl px-6 pb-24 pt-20 md:pb-36 md:pt-32">
          <div className="mx-auto max-w-4xl text-center">
            {/* Badge */}
            <div className="animate-fade-in-up mb-8 inline-flex items-center gap-2.5 rounded-full border border-[#FFB300]/20 bg-[#FFB300]/5 px-5 py-2 text-sm font-medium text-foreground backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-[#FFB300]" />
              Plataforma de gestión interna v2.0
            </div>

            <h1 className="animate-fade-in-up animation-delay-100 text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl leading-[0.95]">
              Todo tu equipo.
              <br />
              <span className="bg-gradient-to-r from-[#FFB300] via-[#FF8800] to-[#F5061D] bg-clip-text text-transparent">
                Un solo lugar.
              </span>
            </h1>

            <p className="animate-fade-in-up animation-delay-200 mx-auto mt-8 max-w-2xl text-lg text-muted-foreground sm:text-xl leading-relaxed">
              Centraliza documentos, correspondencia, trámites y recursos humanos
              en una plataforma segura, moderna e intuitiva.
            </p>

            <div className="animate-fade-in-up animation-delay-300 mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              {session ? (
                esAdmin ? (
                  <Button size="lg" asChild className="h-13 px-10 text-base font-semibold bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000] shadow-lg shadow-[#FFB300]/25 hover:shadow-xl hover:shadow-[#FFB300]/30 border-0">
                    <Link href="/dashboard">
                      Ir al Panel de Administración
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                ) : (
                  <Button size="lg" asChild className="h-13 px-10 text-base font-semibold bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000] shadow-lg shadow-[#FFB300]/25 hover:shadow-xl hover:shadow-[#FFB300]/30 border-0">
                    <Link href="/dashboard">
                      Panel de Usuario
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                )
              ) : (
                <Button size="lg" asChild className="h-13 px-10 text-base font-semibold bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000] shadow-lg shadow-[#FFB300]/25 hover:shadow-xl hover:shadow-[#FFB300]/30 border-0">
                  <Link href="/login">
                    Comenzar ahora
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              )}
              <Button variant="outline" size="lg" className="h-13 px-10 text-base font-semibold" asChild>
                <Link href="#features">
                  Explorar módulos
                  <ChevronRight className="ml-1 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Noticias Institucionales (solo logueados) ── */}
      {estaLogueado && seccionVisible("seccion_banners") && bannersDb.length > 0 && (
        <LandingNoticias noticias={bannersDb.map((n) => ({
          id: n.id,
          titulo: n.titulo,
          descripcion: n.descripcion,
          imagen: n.imagen,
          imagenes: n.imagenes,
          enlace: n.enlace,
          createdAt: n.createdAt.toISOString(),
        }))} />
      )}

      {/* ── Aplicaciones (solo para usuarios logueados) ── */}
      {estaLogueado && seccionVisible("seccion_aplicaciones") && (
      <section id="aplicaciones" className="border-y border-border/40 bg-muted/20 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#FFB300]/20 bg-[#FFB300]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#FF8800]">
              <Globe className="h-3.5 w-3.5" />
              Aplicaciones
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Acceso Rápido a Sistemas</h2>
            <p className="mt-3 text-muted-foreground">
              Enlaces institucionales administrados desde el panel de comunicaciones.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {accesosDirectos.map((acceso) => (
              <a
                key={acceso.clave}
                href={acceso.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#FFB300]/40 hover:shadow-lg hover:shadow-[#FFB300]/10"
              >
                {acceso.imagen?.trim() ? (
                  <div className="relative aspect-[16/8] w-full overflow-hidden border-b border-border/40 bg-muted/30">
                    <img
                      src={acceso.imagen}
                      alt={acceso.titulo}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      loading="lazy"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
                    <div className="absolute bottom-2 left-2 rounded-md bg-black/55 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                      Aplicación
                    </div>
                  </div>
                ) : (
                  <div className="relative flex aspect-[16/8] w-full items-center justify-center border-b border-border/40 bg-gradient-to-br from-[#FFB300]/25 via-[#FF8800]/15 to-[#F5061D]/20">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFB300] to-[#FF8800] text-[#1a1000] shadow-lg shadow-[#FFB300]/30">
                      <Lock className="h-6 w-6" />
                    </div>
                  </div>
                )}
                <div className="p-5">
                  <p className="text-sm font-bold tracking-tight group-hover:text-[#FF8800]">{acceso.titulo}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{acceso.descripcion || "Enlace institucional"}</p>
                  <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#FF8800]">
                    Abrir sistema
                    <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ── Sucursales Carrusel (solo logueados) ── */}
      {estaLogueado && seccionVisible("seccion_sucursales") && (
      <section id="sucursales" className="border-b border-border/40 bg-muted/30 py-16 overflow-hidden scroll-mt-20">
        <div className="mx-auto max-w-7xl px-6 mb-10">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFB300] to-[#FF8800] text-[#1a1000] shadow-lg shadow-[#FFB300]/25">
              <MapPin className="h-5 w-5" />
            </div>
            <h3 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Nuestras Sucursales</h3>
            <p className="max-w-md text-sm text-muted-foreground">
              Correos de Bolivia presente en todo el territorio nacional con 9 oficinas regionales
            </p>
          </div>
        </div>

        {/* Fila 1 — izquierda a derecha */}
        <div className="relative mb-5">
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-32 bg-gradient-to-r from-muted/30 via-muted/20 to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-32 bg-gradient-to-l from-muted/30 via-muted/20 to-transparent" />
          <div className="animate-marquee flex w-max gap-5">
            {[...sucursales, ...sucursales].map((sucursal, i) => (
              <div
                key={`row1-${i}`}
                className="group flex shrink-0 items-start gap-4 rounded-2xl border border-border/50 bg-card px-6 py-5 shadow-sm transition-all duration-300 hover:border-[#FFB300]/40 hover:shadow-lg hover:shadow-[#FFB300]/10 hover:-translate-y-0.5 min-w-[300px]"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${sucursal.tipo === "central" ? "bg-gradient-to-br from-[#FFB300] to-[#FF8800] text-[#1a1000]" : "bg-[#FFB300]/10 text-[#FFB300]"} transition-transform duration-300 group-hover:scale-110`}>
                  {sucursal.tipo === "central" ? <Building2 className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-sm font-bold whitespace-nowrap">{sucursal.nombre}</span>
                  <span className="text-xs text-muted-foreground leading-snug line-clamp-2">{sucursal.direccion}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fila 2 — derecha a izquierda */}
        <div className="relative">
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-32 bg-gradient-to-r from-muted/30 via-muted/20 to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-32 bg-gradient-to-l from-muted/30 via-muted/20 to-transparent" />
          <div className="animate-marquee-reverse flex w-max gap-5">
            {[...sucursales.slice().reverse(), ...sucursales.slice().reverse()].map((sucursal, i) => (
              <div
                key={`row2-${i}`}
                className="group flex shrink-0 items-start gap-4 rounded-2xl border border-border/50 bg-card px-6 py-5 shadow-sm transition-all duration-300 hover:border-[#FF8800]/40 hover:shadow-lg hover:shadow-[#FF8800]/10 hover:-translate-y-0.5 min-w-[300px]"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${sucursal.tipo === "central" ? "bg-gradient-to-br from-[#FF8800] to-[#F5061D] text-white" : "bg-[#FF8800]/10 text-[#FF8800]"} transition-transform duration-300 group-hover:scale-110`}>
                  {sucursal.tipo === "central" ? <Building2 className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-sm font-bold whitespace-nowrap">{sucursal.nombre}</span>
                  <span className="text-xs text-muted-foreground leading-snug line-clamp-2">{sucursal.direccion}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ── Comunicados ── */}
      {seccionVisible("seccion_comunicados") && <LandingComunicados estaLogueado={estaLogueado} comunicados={comunicadosDb.map(c => ({
        id: c.id,
        titulo: c.titulo,
        contenido: c.contenido,
        fecha: c.createdAt.toISOString().split("T")[0],
        estado: c.estado as "publicado",
        destacado: c.destacado,
        archivoUrl: c.archivoUrl,
        archivoNombre: c.archivoNombre,
        archivoTipo: c.archivoTipo,
      }))} />}

      {/* ── Directorio Institucional (solo logueados) ── */}
      {estaLogueado && seccionVisible("seccion_directorio") && (() => {
        const dirActivos = directivosDb.filter((d) => d.estado === "activo")
        if (dirActivos.length === 0) return null

        const AVATAR_COLORS = [
          "#1A73E8", "#E8453C", "#0B8043", "#F29900", "#8430CE",
          "#D93025", "#1E8E3E", "#185ABC", "#E37400", "#A142F4",
          "#00897B", "#C2185B",
        ]
        function hashN(n: string) {
          let h = 0
          for (let i = 0; i < n.length; i++) { h = n.charCodeAt(i) + ((h << 5) - h); h |= 0 }
          return Math.abs(h)
        }
        function initials(n: string) {
          return n.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("")
        }

        return (
          <section id="directorio" className="border-y border-border/40 bg-gradient-to-b from-muted/10 to-muted/25 scroll-mt-20">
            <div className="mx-auto max-w-7xl px-6 py-20 md:py-24">
              <div className="mx-auto max-w-2xl text-center mb-14">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#C41E3A]/20 bg-[#C41E3A]/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#C41E3A]">
                  <Shield className="h-3.5 w-3.5" />
                  Autoridades
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
                  Directorio Institucional
                </h2>
                <p className="mt-4 text-muted-foreground text-lg">
                  Jefes y directores que lideran nuestra institución
                </p>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {dirActivos.map((d) => {
                  const color = AVATAR_COLORS[hashN(d.nombre) % AVATAR_COLORS.length]
                  return (
                    <div
                      key={d.id}
                      className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card transition-all duration-300 hover:border-[#C41E3A]/30 hover:shadow-xl hover:shadow-[#C41E3A]/5 hover:-translate-y-1"
                    >
                      {/* Banner con gradiente institucional */}
                      <div className="h-24 w-full bg-gradient-to-br from-[#C41E3A] via-[#a01830] to-[#940533]" />

                      {/* Foto o avatar */}
                      <div className="flex justify-center -mt-12">
                        {d.foto ? (
                          <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-card shadow-xl transition-transform duration-300 group-hover:scale-105">
                            <Image src={d.foto} alt={d.nombre} fill className="object-cover" />
                          </div>
                        ) : (
                          <div
                            className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-card text-2xl font-bold text-white shadow-xl transition-transform duration-300 group-hover:scale-105"
                            style={{ backgroundColor: color }}
                          >
                            {initials(d.nombre)}
                          </div>
                        )}
                      </div>

                      <div className="p-5 pt-3 text-center">
                        <h3 className="font-bold text-base">{d.nombre}</h3>
                        <p className="text-sm font-medium text-[#C41E3A] mt-1">{d.cargo}</p>

                        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#FFB300]/10 px-3 py-1 text-xs font-semibold text-[#FF8800]">
                          <Building2 className="h-3 w-3" />
                          {d.unidad}
                        </div>

                        {(d.email || d.telefono) && (
                          <div className="mt-4 space-y-2 text-left mx-auto max-w-[220px]">
                            {d.email && (
                              <a
                                href={`mailto:${d.email}`}
                                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-[#C41E3A] transition-colors"
                                title={d.email}
                              >
                                <Mail className="h-3.5 w-3.5 shrink-0 text-[#C41E3A]" />
                                <span className="truncate">{d.email}</span>
                              </a>
                            )}
                            {d.telefono && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-3.5 w-3.5 shrink-0 text-[#C41E3A]" />
                                <span>{d.telefono}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )
      })()}

      {/* ── Nuestro Equipo (solo logueados) ── */}
      {estaLogueado && seccionVisible("seccion_equipo") && (() => {
        const equipoActivo = personalDb.filter((p) => p.estado === "activo")
        if (equipoActivo.length === 0) return null

        const AVATAR_COLORS2 = [
          "#1A73E8", "#E8453C", "#0B8043", "#F29900", "#8430CE",
          "#D93025", "#1E8E3E", "#185ABC", "#E37400", "#A142F4",
          "#00897B", "#C2185B",
        ]
        function hashN2(n: string) {
          let h = 0
          for (let i = 0; i < n.length; i++) { h = n.charCodeAt(i) + ((h << 5) - h); h |= 0 }
          return Math.abs(h)
        }
        function initials2(n: string) {
          return n.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("")
        }

        return (
          <section id="equipo" className="border-y border-border/40 bg-muted/15 scroll-mt-20">
            <div className="mx-auto max-w-7xl px-6 py-20 md:py-24">
              <div className="mx-auto max-w-2xl text-center mb-14">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#FFB300]/20 bg-[#FFB300]/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#FF8800]">
                  <Users className="h-3.5 w-3.5" />
                  Nuestro Equipo
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
                  Personal Institucional
                </h2>
                <p className="mt-4 text-muted-foreground text-lg">
                  Los profesionales que hacen posible nuestro servicio día a día
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {equipoActivo.map((p) => {
                  const color = AVATAR_COLORS2[hashN2(p.nombre) % AVATAR_COLORS2.length]
                  return (
                    <div
                      key={p.id}
                      className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card transition-all duration-300 hover:border-[#FFB300]/30 hover:shadow-xl hover:shadow-[#FFB300]/5 hover:-translate-y-1"
                    >
                      {/* Banner */}
                      <div
                        className="h-20 w-full"
                        style={{ background: `linear-gradient(135deg, ${color}33, ${color}55)` }}
                      />

                      {/* Foto o avatar */}
                      <div className="flex justify-center -mt-10">
                        {p.foto ? (
                          <div className="relative h-20 w-20 overflow-hidden rounded-full border-4 border-card shadow-xl transition-transform duration-300 group-hover:scale-105">
                            <Image src={p.foto} alt={p.nombre} fill className="object-cover" />
                          </div>
                        ) : (
                          <div
                            className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-card text-xl font-bold text-white shadow-xl transition-transform duration-300 group-hover:scale-105"
                            style={{ backgroundColor: color }}
                          >
                            {initials2(p.nombre)}
                          </div>
                        )}
                      </div>

                      <div className="p-5 pt-3 text-center">
                        <h3 className="font-bold text-base">{p.nombre}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{p.cargo}</p>

                        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#FFB300]/10 px-3 py-1 text-xs font-semibold text-[#FF8800]">
                          <Shield className="h-3 w-3" />
                          {p.unidad}
                        </div>

                        {(p.email || p.telefono) && (
                          <div className="mt-4 space-y-2 text-left mx-auto max-w-[200px]">
                            {p.email && (
                              <a
                                href={`mailto:${p.email}`}
                                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-[#FF8800] transition-colors"
                                title={p.email}
                              >
                                <Mail className="h-3.5 w-3.5 shrink-0 text-[#FF8800]" />
                                <span className="truncate">{p.email}</span>
                              </a>
                            )}
                            {p.telefono && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-3.5 w-3.5 shrink-0 text-[#FF8800]" />
                                <span>{p.telefono}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )
      })()}

      {/* ── Mapa de Oficinas (solo logueados) ── */}
      {estaLogueado && seccionVisible("seccion_mapa") && <BoliviaMap sucursalesDb={sucursalesDb} />}

      {/* ── Documentos Institucionales (solo logueados) ── */}
      {estaLogueado && seccionVisible("seccion_documentos") && (
        <LandingDocumentos documentos={documentosDb} />
      )}

      {/* ── Features ── */}
      {seccionVisible("seccion_features") && (
      <section id="features" className="scroll-mt-20">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#FFB300]/20 bg-[#FFB300]/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#FF8800]">
              <Zap className="h-3.5 w-3.5" />
              Módulos
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
              Todo lo que necesitas
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Herramientas integradas para optimizar cada proceso de tu institución.
            </p>
          </div>

          <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-7 transition-all duration-300 hover:border-[#FFB300]/30 hover:shadow-xl hover:shadow-[#FFB300]/5 hover:-translate-y-1"
              >
                <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.color} text-white shadow-md transition-transform duration-300 group-hover:scale-110`}>
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
                <div className="pointer-events-none absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-gradient-to-br from-[#FFB300]/5 to-transparent blur-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ── Security banner ── */}
      <section className="border-t border-border/40">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#1a1000] via-[#2a1800] to-[#1a1000] p-10 md:p-16">
            {/* Decorative */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[#FFB300]/15 blur-[100px]" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-60 w-60 rounded-full bg-[#FF8800]/10 blur-[80px]" />
            <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-40 w-40 rounded-full bg-[#940533]/10 blur-[60px]" />

            <div className="relative grid items-center gap-12 md:grid-cols-2">
              <div>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#FFB300]/20 bg-[#FFB300]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#FFB300]">
                  <Shield className="h-3.5 w-3.5" />
                  Seguridad
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
                  Seguridad de nivel empresarial
                </h2>
                <p className="mt-5 text-white/60 text-base leading-relaxed">
                  Encriptación de extremo a extremo, autenticación multifactor y registro
                  completo de auditoría para los más altos estándares.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Lock, text: "Encriptación AES-256" },
                  { icon: Shield, text: "Control por roles" },
                  { icon: Globe, text: "Acceso seguro remoto" },
                  { icon: Clock, text: "Auditoría 24/7" },
                ].map((item) => (
                  <div
                    key={item.text}
                    className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/5 p-5 backdrop-blur-sm"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFB300] to-[#FF8800] text-[#1a1000]">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-semibold text-white/90 leading-snug">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-border/40">
        <div className="mx-auto max-w-7xl px-6 py-24 text-center md:py-32">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            ¿Listo para transformar tu
            <br />
            <span className="bg-gradient-to-r from-[#FFB300] via-[#FF8800] to-[#F5061D] bg-clip-text text-transparent">gestión interna?</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-muted-foreground text-lg">
            Accede a la plataforma y optimiza los procesos de tu institución.
          </p>
          <div className="mt-10">
            {session ? (
              esAdmin ? (
                <Button size="lg" asChild className="h-13 px-10 text-base font-semibold bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000] shadow-lg shadow-[#FFB300]/25 hover:shadow-xl hover:shadow-[#FFB300]/30 border-0">
                  <Link href="/dashboard">
                    Ir al Panel
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <Button size="lg" asChild className="h-13 px-10 text-base font-semibold bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000] shadow-lg shadow-[#FFB300]/25 hover:shadow-xl hover:shadow-[#FFB300]/30 border-0">
                  <Link href="/dashboard">
                    Panel de Usuario
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              )
            ) : (
              <Button size="lg" asChild className="h-13 px-10 text-base font-semibold bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000] shadow-lg shadow-[#FFB300]/25 hover:shadow-xl hover:shadow-[#FFB300]/30 border-0">
                <Link href="/login">
                  Acceder a la plataforma
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/40">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-3">
            <Image
              src="/image/Logooriginal.png"
              alt="Correos de Bolivia"
              width={100}
              height={28}
              className="h-7 w-auto object-contain dark:hidden"
              style={{ width: "auto" }}
            />
            <Image
              src="/image/LogoAmarillo.png"
              alt="Correos de Bolivia"
              width={100}
              height={28}
              className="hidden h-7 w-auto object-contain dark:block"
              style={{ width: "auto" }}
            />
            <span className="font-medium">Intranet AGBC</span>
          </div>
          <p>&copy; {new Date().getFullYear()} Agencia Boliviana de Correos. Todos los derechos reservados.</p>
        </div>
      </footer>
    </main>
  )
}
