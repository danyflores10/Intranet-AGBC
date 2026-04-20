import Link from "next/link"
import Image from "next/image"
import { headers } from "next/headers"
import {
  Shield,
  Users,
  Mail,
  Clock,
  ArrowRight,
  Sparkles,
  MapPin,
  Building2,
  CalendarDays,
  Phone,
  Briefcase,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { auth } from "@/lib/auth"
import { LandingComunicados } from "@/components/landing-comunicados"
import { LandingDocumentos } from "@/components/landing-documentos"
import { LandingNoticias } from "@/components/landing-noticias"
import { LandingNavbar } from "@/components/landing-navbar"
import { BoliviaMap } from "@/components/bolivia-map"
import { LandingAccesos } from "@/components/landing-accesos"
import { obtenerComunicadosPublicados, obtenerAccesosDirectosActivos, obtenerBannersActivos } from "@/actions/comunicaciones"
import { obtenerUsuarioRbacActual } from "@/lib/auth/session-access"
import { obtenerSucursalesActivas } from "@/actions/sucursales"
import { obtenerPersonal, obtenerDirectivos } from "@/actions/rrhh"
import { obtenerConfigPorGrupo } from "@/actions/configuracion"
import { obtenerDocumentos } from "@/actions/documentos"
import { LoginForm } from "@/components/login-form"

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

  // Si no hay sesión, mostrar el formulario de login
  if (!session) {
    return <LoginForm />
  }

  const usuario = await obtenerUsuarioRbacActual()
  const esAdmin = usuario?.roles.includes("administrador") ?? false
  const estaLogueado = true

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
                  <Link href="/">
                    Comenzar ahora
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              )}
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
        <LandingAccesos accesos={accesosDirectos.map(a => ({
          clave: a.clave,
          titulo: a.titulo,
          descripcion: a.descripcion,
          url: a.url,
          imagen: a.imagen,
        }))} />
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
          <section id="directorio" className="scroll-mt-20" style={{ background: "#e8e8e8" }}>
            <div className="mx-auto max-w-7xl px-6 py-20 md:py-24">
              <div className="mx-auto max-w-2xl text-center mb-14">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#C41E3A]/20 bg-[#C41E3A]/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#C41E3A]">
                  <Shield className="h-3.5 w-3.5" />
                  Autoridades
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl text-gray-800">
                  Directorio Institucional
                </h2>
                <p className="mt-4 text-gray-500 text-lg">
                  Jefes y directores que lideran nuestra institución
                </p>
              </div>

              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {dirActivos.map((d) => {
                  const color = AVATAR_COLORS[hashN(d.nombre) % AVATAR_COLORS.length]
                  return (
                    <div
                      key={d.id}
                      className="group relative flex flex-col items-center rounded-3xl pt-10 pb-8 px-6 transition-all duration-300 hover:-translate-y-1"
                      style={{
                        background: "#e8e8e8",
                        boxShadow: "8px 8px 16px #c5c5c5, -8px -8px 16px #ffffff",
                      }}
                    >
                      {/* Avatar con ring neumórfico */}
                      <div
                        className="relative rounded-full p-1.5 mb-5 transition-transform duration-300 group-hover:scale-105"
                        style={{
                          background: "#e8e8e8",
                          boxShadow: "4px 4px 10px #c5c5c5, -4px -4px 10px #ffffff, inset 2px 2px 5px #c5c5c5, inset -2px -2px 5px #ffffff",
                        }}
                      >
                        {d.foto ? (
                          <div className="relative h-28 w-28 overflow-hidden rounded-full">
                            <Image src={d.foto} alt={d.nombre} fill className="object-cover" />
                          </div>
                        ) : (
                          <div
                            className="flex h-28 w-28 items-center justify-center rounded-full text-3xl font-bold text-white"
                            style={{ backgroundColor: color }}
                          >
                            {initials(d.nombre)}
                          </div>
                        )}
                      </div>

                      {/* Nombre y cargo */}
                      <h3 className="text-lg font-bold text-gray-800 text-center">{d.nombre}</h3>
                      <p className="text-sm text-gray-500 mt-1 text-center">{d.cargo}</p>

                      {/* Iconos de contacto en fila (estilo redes sociales) */}
                      <div className="flex items-center justify-center gap-3 mt-5">
                        {d.email && (
                          <a
                            href={`mailto:${d.email}`}
                            title={d.email}
                            className="flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 hover:scale-110"
                            style={{
                              background: "#e8e8e8",
                              boxShadow: "3px 3px 8px #c5c5c5, -3px -3px 8px #ffffff",
                            }}
                          >
                            <Mail className="h-4 w-4 text-[#C41E3A]" />
                          </a>
                        )}
                        {d.telefono && (
                          <div
                            title={d.telefono}
                            className="flex h-10 w-10 items-center justify-center rounded-full"
                            style={{
                              background: "#e8e8e8",
                              boxShadow: "3px 3px 8px #c5c5c5, -3px -3px 8px #ffffff",
                            }}
                          >
                            <Phone className="h-4 w-4 text-[#1A73E8]" />
                          </div>
                        )}
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-full"
                          style={{
                            background: "#e8e8e8",
                            boxShadow: "3px 3px 8px #c5c5c5, -3px -3px 8px #ffffff",
                          }}
                        >
                          <Building2 className="h-4 w-4 text-[#F29900]" />
                        </div>
                      </div>

                      {/* Departamento badge */}
                      <div
                        className="mt-5 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold text-gray-600"
                        style={{
                          background: "#e8e8e8",
                          boxShadow: "inset 2px 2px 5px #c5c5c5, inset -2px -2px 5px #ffffff",
                        }}
                      >
                        <Briefcase className="h-3 w-3 text-[#C41E3A]" />
                        {d.unidad}
                      </div>

                      {/* Divider */}
                      <div className="w-full mt-6 mb-4 border-t" style={{ borderColor: "#d5d5d5" }} />

                      {/* Info de contacto al pie */}
                      <div className="flex items-center justify-center gap-6 text-xs text-gray-500 w-full">
                        {d.email && (
                          <a href={`mailto:${d.email}`} className="flex items-center gap-1.5 hover:text-[#C41E3A] transition-colors truncate max-w-[140px]" title={d.email}>
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{d.email}</span>
                          </a>
                        )}
                        {d.telefono && (
                          <span className="flex items-center gap-1.5">
                            <Phone className="h-3 w-3 shrink-0" />
                            {d.telefono}
                          </span>
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
          <section id="equipo" className="scroll-mt-20" style={{ background: "#e8e8e8" }}>
            <div className="mx-auto max-w-7xl px-6 py-20 md:py-24">
              <div className="mx-auto max-w-2xl text-center mb-14">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#FFB300]/20 bg-[#FFB300]/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#FF8800]">
                  <Users className="h-3.5 w-3.5" />
                  Nuestro Equipo
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl text-gray-800">
                  Personal Institucional
                </h2>
                <p className="mt-4 text-gray-500 text-lg">
                  Los profesionales que hacen posible nuestro servicio día a día
                </p>
              </div>

              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {equipoActivo.map((p) => {
                  const color = AVATAR_COLORS2[hashN2(p.nombre) % AVATAR_COLORS2.length]
                  return (
                    <div
                      key={p.id}
                      className="group relative flex flex-col items-center rounded-3xl pt-10 pb-8 px-6 transition-all duration-300 hover:-translate-y-1"
                      style={{
                        background: "#e8e8e8",
                        boxShadow: "8px 8px 16px #c5c5c5, -8px -8px 16px #ffffff",
                      }}
                    >
                      {/* Avatar con ring neumórfico */}
                      <div
                        className="relative rounded-full p-1.5 mb-5 transition-transform duration-300 group-hover:scale-105"
                        style={{
                          background: "#e8e8e8",
                          boxShadow: "4px 4px 10px #c5c5c5, -4px -4px 10px #ffffff, inset 2px 2px 5px #c5c5c5, inset -2px -2px 5px #ffffff",
                        }}
                      >
                        {p.foto ? (
                          <div className="relative h-24 w-24 overflow-hidden rounded-full">
                            <Image src={p.foto} alt={p.nombre} fill className="object-cover" />
                          </div>
                        ) : (
                          <div
                            className="flex h-24 w-24 items-center justify-center rounded-full text-2xl font-bold text-white"
                            style={{ backgroundColor: color }}
                          >
                            {initials2(p.nombre)}
                          </div>
                        )}
                      </div>

                      {/* Nombre y cargo */}
                      <h3 className="text-base font-bold text-gray-800 text-center">{p.nombre}</h3>
                      <p className="text-sm text-gray-500 mt-1 text-center">{p.cargo}</p>

                      {/* Iconos de contacto en fila */}
                      <div className="flex items-center justify-center gap-3 mt-5">
                        {p.email && (
                          <a
                            href={`mailto:${p.email}`}
                            title={p.email}
                            className="flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 hover:scale-110"
                            style={{
                              background: "#e8e8e8",
                              boxShadow: "3px 3px 8px #c5c5c5, -3px -3px 8px #ffffff",
                            }}
                          >
                            <Mail className="h-3.5 w-3.5 text-[#FF8800]" />
                          </a>
                        )}
                        {p.telefono && (
                          <div
                            title={p.telefono}
                            className="flex h-9 w-9 items-center justify-center rounded-full"
                            style={{
                              background: "#e8e8e8",
                              boxShadow: "3px 3px 8px #c5c5c5, -3px -3px 8px #ffffff",
                            }}
                          >
                            <Phone className="h-3.5 w-3.5 text-[#1A73E8]" />
                          </div>
                        )}
                        <div
                          className="flex h-9 w-9 items-center justify-center rounded-full"
                          style={{
                            background: "#e8e8e8",
                            boxShadow: "3px 3px 8px #c5c5c5, -3px -3px 8px #ffffff",
                          }}
                        >
                          <Building2 className="h-3.5 w-3.5 text-[#0B8043]" />
                        </div>
                      </div>

                      {/* Departamento badge */}
                      <div
                        className="mt-5 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold text-gray-600"
                        style={{
                          background: "#e8e8e8",
                          boxShadow: "inset 2px 2px 5px #c5c5c5, inset -2px -2px 5px #ffffff",
                        }}
                      >
                        <Shield className="h-3 w-3 text-[#FF8800]" />
                        {p.unidad}
                      </div>

                      {/* Divider */}
                      <div className="w-full mt-6 mb-4 border-t" style={{ borderColor: "#d5d5d5" }} />

                      {/* Info de contacto al pie */}
                      <div className="flex items-center justify-center gap-5 text-xs text-gray-500 w-full flex-wrap">
                        {p.email && (
                          <a href={`mailto:${p.email}`} className="flex items-center gap-1.5 hover:text-[#FF8800] transition-colors truncate max-w-[130px]" title={p.email}>
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{p.email}</span>
                          </a>
                        )}
                        {p.telefono && (
                          <span className="flex items-center gap-1.5">
                            <Phone className="h-3 w-3 shrink-0" />
                            {p.telefono}
                          </span>
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

      {/* ── Documentos Institucionales (solo logueados) ── */}
      {estaLogueado && seccionVisible("seccion_documentos") && (
        <LandingDocumentos documentos={documentosDb} />
      )}

      {/* ── Mapa de Oficinas (solo logueados) ── */}
      {estaLogueado && seccionVisible("seccion_mapa") && <BoliviaMap sucursalesDb={sucursalesDb} />}

      {/* ── Carrusel de Oficinas debajo del mapa (solo logueados) ── */}
      {estaLogueado && seccionVisible("seccion_sucursales") && (
      <section id="sucursales" className="bg-muted/30 pb-16 overflow-hidden scroll-mt-20">
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
                <Link href="/">
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
