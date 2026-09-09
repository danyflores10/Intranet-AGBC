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
import { LandingPersonal } from "@/components/landing-personal"
import { LandingDirectorio } from "@/components/landing-directorio"
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
      <section className="relative pt-[80px] bg-white border-b border-slate-100">
        {/* Clean subtle geometric pattern */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#0E5296_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.035]" />
          <div className="absolute -top-24 right-1/4 h-[350px] w-[350px] rounded-full bg-[#FFB800]/10 blur-[90px]" />
          <div className="absolute top-1/2 -left-20 h-[400px] w-[400px] rounded-full bg-[#0E5296]/6 blur-[100px]" />
        </div>

        <div className="mx-auto max-w-7xl px-6 pb-24 pt-16 md:pb-32 md:pt-24">
          <div className="mx-auto max-w-4xl text-center">
            {/* Badge */}
            <div className="animate-fade-in-up mb-8 inline-flex items-center gap-2.5 rounded-full border border-[#FFB800]/40 bg-[#FFB800]/15 px-5 py-2 text-sm font-bold text-[#0E5296] shadow-sm">
              <Sparkles className="h-4 w-4 text-[#FFB800]" />
              Plataforma de gestión interna v2.0
            </div>

            <h1 className="animate-fade-in-up animation-delay-100 text-5xl font-black tracking-tight sm:text-6xl md:text-7xl lg:text-8xl leading-[1] text-[#0A192F]">
              Todo tu equipo.
              <br />
              <span className="text-[#FFB800]">
                Un solo lugar.
              </span>
            </h1>

            <p className="animate-fade-in-up animation-delay-200 mx-auto mt-8 max-w-2xl text-lg text-slate-600 sm:text-xl leading-relaxed font-medium">
              Centraliza documentos, recursos humanos y gestión institucional
              en una plataforma segura, moderna y eficiente.
            </p>

            <div className="animate-fade-in-up animation-delay-300 mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              {session ? (
                esAdmin ? (
                  <Button size="lg" asChild className="h-14 px-10 text-base font-bold bg-[#0E5296] hover:bg-[#003B73] text-white shadow-xl shadow-[#0E5296]/20 border-0 rounded-2xl transition-all hover:scale-[1.02] cursor-pointer">
                    <Link href="/dashboard">
                      Ir al Panel de Administración
                      <ArrowRight className="ml-2 h-5 w-5 text-[#FFB800]" />
                    </Link>
                  </Button>
                ) : (
                  <Button size="lg" asChild className="h-14 px-10 text-base font-bold bg-[#0E5296] hover:bg-[#003B73] text-white shadow-xl shadow-[#0E5296]/20 border-0 rounded-2xl transition-all hover:scale-[1.02] cursor-pointer">
                    <Link href="/dashboard">
                      Panel de Usuario
                      <ArrowRight className="ml-2 h-5 w-5 text-[#FFB800]" />
                    </Link>
                  </Button>
                )
              ) : (
                <Button size="lg" asChild className="h-14 px-10 text-base font-bold bg-[#0E5296] hover:bg-[#003B73] text-white shadow-xl shadow-[#0E5296]/20 border-0 rounded-2xl transition-all hover:scale-[1.02] cursor-pointer">
                  <Link href="/">
                    Comenzar ahora
                    <ArrowRight className="ml-2 h-5 w-5 text-[#FFB800]" />
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

      {/* ── Directorio Institucional – Carrusel 3D (solo logueados) ── */}
      {estaLogueado && seccionVisible("seccion_directorio") && (() => {
        const dirActivos = directivosDb.filter((d) => d.estado === "activo")
        if (dirActivos.length === 0) return null
        return <LandingDirectorio directivos={dirActivos} />
      })()}

      {/* ── Nuestro Equipo – Carrusel 3D (solo logueados) ── */}
      {estaLogueado && seccionVisible("seccion_equipo") && (() => {
        const equipoActivo = personalDb.filter((p) => p.estado === "activo")
        if (equipoActivo.length === 0) return null
        return <LandingPersonal personal={equipoActivo} />
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
                className="group flex shrink-0 items-start gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm transition-all duration-300 hover:border-[#0E5296]/40 hover:shadow-lg hover:shadow-[#0E5296]/10 hover:-translate-y-0.5 min-w-[300px]"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${sucursal.tipo === "central" ? "bg-[#0E5296] text-[#FFCC00]" : "bg-[#0E5296]/10 text-[#0E5296]"} transition-transform duration-300 group-hover:scale-110`}>
                  {sucursal.tipo === "central" ? <Building2 className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-sm font-bold text-[#002F6C] whitespace-nowrap">{sucursal.nombre}</span>
                  <span className="text-xs text-slate-500 leading-snug line-clamp-2">{sucursal.direccion}</span>
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
                className="group flex shrink-0 items-start gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm transition-all duration-300 hover:border-[#0E5296]/40 hover:shadow-lg hover:shadow-[#0E5296]/10 hover:-translate-y-0.5 min-w-[300px]"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${sucursal.tipo === "central" ? "bg-[#0E5296] text-[#FFCC00]" : "bg-[#0E5296]/10 text-[#0E5296]"} transition-transform duration-300 group-hover:scale-110`}>
                  {sucursal.tipo === "central" ? <Building2 className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-sm font-bold text-[#002F6C] whitespace-nowrap">{sucursal.nombre}</span>
                  <span className="text-xs text-slate-500 leading-snug line-clamp-2">{sucursal.direccion}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ── Footer con Fondo Amarillo Institucional ── */}
      <footer className="bg-[#FFCC00] text-[#0A192F] border-t-2 border-[#002F6C]/20 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 sm:flex-row">
          <div className="flex items-center gap-3">
            <Image
              src="/image/Logooriginal.png"
              alt="Correos de Bolivia"
              width={130}
              height={40}
              className="h-10 w-auto object-contain drop-shadow-sm"
              style={{ width: "auto" }}
            />
            <span className="font-black text-[#002F6C] text-sm uppercase tracking-wide">Intranet AGBC</span>
          </div>
          <p className="text-xs font-bold text-[#002F6C]/90">&copy; {new Date().getFullYear()} Agencia Boliviana de Correos. Todos los derechos reservados.</p>
        </div>
      </footer>
    </main>
  )
}
