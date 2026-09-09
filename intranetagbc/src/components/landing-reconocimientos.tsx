"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  TrophyIcon,
  UsersIcon,
  MapPinIcon,
  SparklesIcon,
  ArrowRightIcon,
  StarIcon,
  BuildingIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"

import type {
  LandingReconocimientos,
  LandingEquipo,
  LandingLogro,
  LandingEmpleadoMes,
} from "@/actions/reconocimientos"
import { MESES_ES } from "@/lib/validations/reconocimientos"
import { ConfettiBurst } from "@/components/confetti-burst"

const ROTATE_MS = 10_000

interface Props {
  data: LandingReconocimientos
}

// ── Slide unificado para el hero ──
type HeroSlide =
  | { tipo: "empleado_mes"; id: string; data: LandingEmpleadoMes }
  | { tipo: "equipo_destacado"; id: string; data: LandingEquipo }
  | { tipo: "logro_sucursal"; id: string; data: LandingLogro }

function construirSlides(data: LandingReconocimientos): HeroSlide[] {
  const slides: HeroSlide[] = []
  for (const e of data.empleadosMes) slides.push({ tipo: "empleado_mes", id: `emp-${e.id}`, data: e })
  for (const e of data.equipos) slides.push({ tipo: "equipo_destacado", id: `eq-${e.id}`, data: e })
  for (const l of data.logros) slides.push({ tipo: "logro_sucursal", id: `lg-${l.id}`, data: l })
  return slides
}

export function LandingReconocimientos({ data }: Props) {
  const slides = construirSlides(data)
  if (slides.length === 0) return null

  return (
    <section id="reconocimientos" className="border-y border-border/40 bg-muted/5 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center mb-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#FFB800]/30 bg-[#FFB800]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#0E5296] dark:text-[#FFB800]">
            <SparklesIcon className="h-3.5 w-3.5" />
            Reconocimientos
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
            Celebramos el{" "}
            <span className="bg-gradient-to-r from-[#FFB800] via-[#0077EE] to-[#0E5296] bg-clip-text text-transparent">
              compromiso y excelencia
            </span>{" "}
            de nuestra gente
          </h2>
          <p className="mt-3 text-muted-foreground">
            Empleado del mes, equipos destacados y logros territoriales.
          </p>
        </div>

        {/* Hero rotante estilo Noticias */}
        <HeroReconocimientosCarousel slides={slides} />

        {/* Bloque 1 — Empleados del mes (carrusel horizontal) */}
        {data.empleadosMes.length > 0 && (
          <BloqueSeccion
            icono={TrophyIcon}
            gradiente="from-[#FFB800] to-[#0E5296]"
            color="#0E5296"
            titulo="Empleado del Mes"
            subtitulo="Reconocimiento individual a la excelencia y compromiso"
          >
            <FilaHorizontal>
              {data.empleadosMes.slice(0, 12).map((e) => (
                <TarjetaEmpleadoMes key={e.id} empleado={e} />
              ))}
            </FilaHorizontal>
          </BloqueSeccion>
        )}

        {/* Bloque 2 — Equipos destacados (carrusel horizontal) */}
        {data.equipos.length > 0 && (
          <BloqueSeccion
            icono={UsersIcon}
            gradiente="from-blue-500 to-blue-600"
            color="#1976D2"
            titulo="Equipos destacados"
            subtitulo="Reconocimiento al trabajo colaborativo y sus resultados"
          >
            <FilaHorizontal>
              {data.equipos.slice(0, 12).map((e) => (
                <TarjetaEquipo key={e.id} equipo={e} />
              ))}
            </FilaHorizontal>
          </BloqueSeccion>
        )}

        {/* Bloque 3 — Logros de sucursales (carrusel horizontal) */}
        {data.logros.length > 0 && (
          <BloqueSeccion
            icono={MapPinIcon}
            gradiente="from-emerald-500 to-emerald-600"
            color="#2E7D32"
            titulo="Logros de sucursales"
            subtitulo="Resultados y metas alcanzadas en nuestras oficinas a nivel nacional"
          >
            <FilaHorizontal>
              {data.logros.slice(0, 12).map((l) => (
                <TarjetaLogro key={l.id} logro={l} />
              ))}
            </FilaHorizontal>
          </BloqueSeccion>
        )}
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Hero carousel unificado con rotación + confetti
// ─────────────────────────────────────────────────────────────────────────────
function HeroReconocimientosCarousel({ slides }: { slides: HeroSlide[] }) {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const [confettiTick, setConfettiTick] = useState(0)

  const total = slides.length
  const next = useCallback(() => setCurrent((p) => (p + 1) % total), [total])
  const prev = useCallback(() => setCurrent((p) => (p - 1 + total) % total), [total])

  // Rotación cada 10s + confetti recurrente
  useEffect(() => {
    if (paused || total <= 1) {
      return
    }
    const interval = window.setInterval(() => {
      setCurrent((p) => (p + 1) % total)
      setConfettiTick((t) => t + 1)
    }, ROTATE_MS)
    return () => window.clearInterval(interval)
  }, [paused, total])

  // Confetti también cada 10s aunque solo haya 1 slide
  useEffect(() => {
    if (paused) return
    const interval = window.setInterval(() => {
      setConfettiTick((t) => t + 1)
    }, ROTATE_MS)
    return () => window.clearInterval(interval)
  }, [paused])

  const slide = slides[current]

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card shadow-xl">
        {/* Confetti que se dispara cada 10s */}
        <ConfettiBurst trigger={`${current}-${confettiTick}`} count={70} />

        {/* Banda tricolor superior */}
        <div className="h-1.5 bg-gradient-to-r from-[#C41E3A] via-[#FFB300] to-[#2E7D32]" />

        {/* Imagen principal con cross-fade entre slides — fondo difuminado + foto completa */}
        <div className="relative aspect-[16/9] md:aspect-[21/9] w-full overflow-hidden bg-black">
          {slides.map((s, idx) => {
            const img = obtenerImagen(s)
            const titulo = obtenerTitulo(s)
            if (!img) return null
            const visible = idx === current
            return (
              <div
                key={s.id}
                className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                  visible ? "opacity-100 scale-100" : "opacity-0 scale-105"
                }`}
              >
                {/* Fondo borroso de la misma imagen para llenar el espacio sin recortar */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img}
                  alt=""
                  aria-hidden
                  className="absolute inset-0 h-full w-full object-cover scale-110 blur-2xl opacity-60"
                />
                {/* Foto completa centrada, sin recortes y manteniendo nitidez */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img}
                  alt={titulo}
                  loading={visible ? "eager" : "lazy"}
                  decoding="async"
                  className="relative z-[1] h-full w-full object-contain object-center [image-rendering:auto] [image-rendering:high-quality]"
                />
              </div>
            )
          })}

          {/* Overlay sólo en la parte inferior para el texto, sin tapar la foto */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-2/3 bg-gradient-to-t from-black/90 via-black/55 to-transparent" />

          {/* Contenido del slide */}
          <div className="absolute inset-x-0 bottom-0 z-[3] p-6 md:p-10">
            <SlideContenido slide={slide} />
          </div>

          {/* Sello tipo "empleado del mes" si corresponde */}
          <div className="absolute top-4 right-4 z-[3] sm:top-6 sm:right-6">
            <SelloTipo slide={slide} />
          </div>

          {/* Controles laterales */}
          {total > 1 && (
            <>
              <button
                type="button"
                onClick={prev}
                className="absolute left-4 top-1/2 z-[3] -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white transition-all hover:bg-black/60 backdrop-blur-sm"
                aria-label="Anterior"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={next}
                className="absolute right-4 top-1/2 z-[3] -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white transition-all hover:bg-black/60 backdrop-blur-sm"
                aria-label="Siguiente"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {/* Indicadores */}
        {total > 1 && (
          <div className="flex items-center justify-center gap-2 py-4 bg-card">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrent(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === current
                    ? "w-8 bg-gradient-to-r from-[#FFB300] to-[#FF8800]"
                    : "w-2 bg-muted-foreground/25 hover:bg-muted-foreground/45"
                }`}
                aria-label={`Ir a reconocimiento ${idx + 1}`}
              />
            ))}
          </div>
        )}

        {/* Banda tricolor inferior */}
        <div className="h-1.5 bg-gradient-to-r from-[#2E7D32] via-[#FFB300] to-[#C41E3A]" />
      </div>
    </div>
  )
}

// ── Helpers por tipo ──
function obtenerImagen(s: HeroSlide): string | null {
  return s.data.imagen
}
function obtenerTitulo(s: HeroSlide): string {
  if (s.tipo === "empleado_mes") return s.data.nombreCompleto
  if (s.tipo === "equipo_destacado") return s.data.nombreEquipo
  return `${s.data.ciudad}, ${s.data.departamento}`
}

function SelloTipo({ slide }: { slide: HeroSlide }) {
  const cfg = {
    empleado_mes: {
      Icon: TrophyIcon,
      titulo: "Empleado",
      subtitulo: "del Mes",
      gradient: "from-[#FFB300] to-[#FF8800]",
      text: "text-[#1a1000]",
    },
    equipo_destacado: {
      Icon: UsersIcon,
      titulo: "Equipo",
      subtitulo: "Destacado",
      gradient: "from-blue-500 to-blue-600",
      text: "text-white",
    },
    logro_sucursal: {
      Icon: MapPinIcon,
      titulo: "Logro",
      subtitulo: "Sucursal",
      gradient: "from-emerald-500 to-emerald-600",
      text: "text-white",
    },
  }[slide.tipo]
  const Icon = cfg.Icon
  return (
    <div className={`relative flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-gradient-to-br ${cfg.gradient} ${cfg.text} shadow-xl ring-4 ring-background rotate-[-8deg] animate-pulse-glow`}>
      <div className="flex flex-col items-center justify-center text-center">
        <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
        <p className="mt-0.5 text-[8px] sm:text-[9px] font-black uppercase leading-tight">
          {cfg.titulo}<br />{cfg.subtitulo}
        </p>
      </div>
    </div>
  )
}

function SlideContenido({ slide }: { slide: HeroSlide }) {
  if (slide.tipo === "empleado_mes") {
    const d = slide.data
    return (
      <div className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-widest text-[#FFB300] mb-2">
          Felicitamos a nuestro · {MESES_ES[d.mes - 1]} {d.gestion}
        </p>
        <h3 className="text-2xl md:text-4xl font-black text-white leading-tight mb-2">
          {d.nombreCompleto}
        </h3>
        <p className="text-sm md:text-base text-white/85 flex flex-wrap items-center gap-x-3 gap-y-1 mb-3">
          <span className="flex items-center gap-1.5 font-semibold">
            <BuildingIcon className="h-3.5 w-3.5" />
            {d.cargo}
          </span>
          <span className="text-white/60">·</span>
          <span>{d.area}</span>
          {d.sucursalNombre && (
            <>
              <span className="text-white/60">·</span>
              <span className="flex items-center gap-1">
                <MapPinIcon className="h-3 w-3" />
                {d.sucursalNombre}
              </span>
            </>
          )}
        </p>
        <p className="text-sm md:text-base italic text-white/90 max-w-2xl line-clamp-2 mb-4">
          &ldquo;{d.motivo}&rdquo;
        </p>
        <Link
          href={`/reconocimientos/${d.id}`}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FFB300] to-[#FF8800] px-5 py-2.5 text-sm font-bold text-[#1a1000] shadow-lg shadow-[#FFB300]/30 transition-all hover:shadow-xl hover:brightness-105"
        >
          Ver reconocimiento
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
    )
  }
  if (slide.tipo === "equipo_destacado") {
    const d = slide.data
    return (
      <div className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-widest text-blue-300 mb-2">
          Equipo destacado · {d.area}
        </p>
        <h3 className="text-2xl md:text-4xl font-black text-white leading-tight mb-2">
          {d.nombreEquipo}
        </h3>
        <p className="text-sm md:text-base text-white/85 mb-3">
          <span className="font-semibold">Responsable:</span> {d.responsableNombre} ·{" "}
          {d.integrantesCount} {d.integrantesCount === 1 ? "integrante" : "integrantes"}
        </p>
        <p className="text-sm md:text-base text-white/90 max-w-2xl line-clamp-2 mb-4">
          {d.descripcionCorta}
        </p>
        <Link
          href={`/reconocimientos/${d.id}`}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:shadow-xl hover:brightness-105"
        >
          Ver reconocimiento
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
    )
  }
  const d = slide.data
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-bold uppercase tracking-widest text-emerald-300 mb-2">
        Logro de sucursal · {d.tipoLogro}
      </p>
      <h3 className="text-2xl md:text-4xl font-black text-white leading-tight mb-2">
        {d.ciudad}, {d.departamento}
      </h3>
      {d.indicadorPrincipal && (
        <p className="text-sm md:text-base text-white/90 mb-3">
          <span className="font-semibold">{d.indicadorPrincipal.nombre}:</span>{" "}
          <span className="text-lg md:text-xl font-black text-emerald-300">
            {d.indicadorPrincipal.valor}
            {d.indicadorPrincipal.unidad && ` ${d.indicadorPrincipal.unidad}`}
          </span>
        </p>
      )}
      <p className="text-sm md:text-base text-white/90 max-w-2xl line-clamp-2 mb-4">
        {d.descripcionCorta}
      </p>
      <Link
        href={`/reconocimientos/${d.id}`}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:shadow-xl hover:brightness-105"
      >
        Ver reconocimiento
        <ArrowRightIcon className="h-4 w-4" />
      </Link>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Carrusel horizontal con flechas y scroll-snap (todas las tarjetas en fila)
// ─────────────────────────────────────────────────────────────────────────────
function FilaHorizontal({ children }: { children: React.ReactNode }) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const updateButtons = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    setCanPrev(el.scrollLeft > 8)
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 8)
  }, [])

  useEffect(() => {
    updateButtons()
    const el = scrollerRef.current
    if (!el) return
    el.addEventListener("scroll", updateButtons, { passive: true })
    window.addEventListener("resize", updateButtons)
    return () => {
      el.removeEventListener("scroll", updateButtons)
      window.removeEventListener("resize", updateButtons)
    }
  }, [updateButtons])

  function scrollBy(direction: 1 | -1) {
    const el = scrollerRef.current
    if (!el) return
    const amount = Math.max(320, Math.round(el.clientWidth * 0.85))
    el.scrollBy({ left: amount * direction, behavior: "smooth" })
  }

  return (
    <div className="relative -mx-4 sm:-mx-6">
      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-4 sm:px-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>

      {canPrev && (
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          aria-label="Anterior"
          className="hidden md:flex absolute left-1 top-1/2 -translate-y-1/2 h-11 w-11 items-center justify-center rounded-full bg-card/90 border border-border/60 text-foreground shadow-lg backdrop-blur-sm transition-all hover:bg-card hover:scale-105 active:scale-95"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
      )}
      {canNext && (
        <button
          type="button"
          onClick={() => scrollBy(1)}
          aria-label="Siguiente"
          className="hidden md:flex absolute right-1 top-1/2 -translate-y-1/2 h-11 w-11 items-center justify-center rounded-full bg-card/90 border border-border/60 text-foreground shadow-lg backdrop-blur-sm transition-all hover:bg-card hover:scale-105 active:scale-95"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Wrapper reusable para cada bloque debajo del hero
// ─────────────────────────────────────────────────────────────────────────────
function BloqueSeccion({
  icono: Icon,
  gradiente,
  color,
  titulo,
  subtitulo,
  children,
}: {
  icono: typeof TrophyIcon
  gradiente: string
  color: string
  titulo: string
  subtitulo: string
  children: React.ReactNode
}) {
  return (
    <div className="mt-14">
      <div className="mb-6 flex items-center gap-3">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradiente} text-white shadow-md`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color }}>
            {titulo}
          </h3>
          <p className="text-xs text-muted-foreground">{subtitulo}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tarjetas individuales
// ─────────────────────────────────────────────────────────────────────────────
function TarjetaEmpleadoMes({ empleado: e }: { empleado: LandingEmpleadoMes }) {
  return (
    <Link
      href={`/reconocimientos/${e.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl snap-start shrink-0 w-[280px] sm:w-[320px] lg:w-[360px]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {e.imagen ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={e.imagen} alt={e.nombreCompleto} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#FFB300]/20 to-[#FF8800]/10 text-[#FF8800]">
            <TrophyIcon className="h-16 w-16" />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent" />
        <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-[#FFB300] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#1a1000] shadow-lg">
          <TrophyIcon className="h-3 w-3" />
          {MESES_ES[e.mes - 1]} {e.gestion}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h4 className="text-base font-black tracking-tight leading-tight line-clamp-2">
          {e.nombreCompleto}
        </h4>
        <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-1.5">
          <BuildingIcon className="h-3 w-3" /> {e.cargo}
          <span>·</span>
          {e.area}
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {e.descripcionCorta}
        </p>
        <div className="mt-auto pt-2 inline-flex items-center gap-1 text-xs font-bold text-[#FF8800] group-hover:gap-2 transition-all">
          Ver más <ArrowRightIcon className="h-3.5 w-3.5" />
        </div>
      </div>
    </Link>
  )
}

function TarjetaEquipo({ equipo: e }: { equipo: LandingEquipo }) {
  return (
    <Link
      href={`/reconocimientos/${e.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl snap-start shrink-0 w-[300px] sm:w-[340px] lg:w-[380px]"
    >
      {e.destacado && (
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-[#FFB300] to-[#FF8800] z-10" />
      )}
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {e.imagen ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={e.imagen} alt={e.nombreEquipo} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500/10 to-blue-500/5 text-blue-500">
            <UsersIcon className="h-16 w-16" />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent" />
        {e.destacado && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-[#FFB300] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#1a1000] shadow-lg">
            <StarIcon className="h-3 w-3 fill-current" />
            Destacado
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">{e.area}</p>
        <h4 className="text-base font-black tracking-tight leading-tight line-clamp-2">
          {e.nombreEquipo}
        </h4>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {e.descripcionCorta}
        </p>
        <div className="mt-auto pt-2 flex items-center justify-between text-xs">
          <div className="text-muted-foreground">
            <span className="font-semibold">{e.integrantesCount}</span>{" "}
            {e.integrantesCount === 1 ? "integrante" : "integrantes"}
          </div>
          <div className="inline-flex items-center gap-1 font-bold text-[#FF8800] group-hover:gap-2 transition-all">
            Ver más <ArrowRightIcon className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </Link>
  )
}

const COLOR_TIPO_LOGRO: Record<string, string> = {
  operativo: "from-blue-500 to-blue-600",
  comercial: "from-[#FF8800] to-[#C41E3A]",
  atencion: "from-emerald-500 to-emerald-600",
  innovacion: "from-purple-500 to-purple-600",
  social: "from-rose-500 to-rose-600",
}

function TarjetaLogro({ logro: l }: { logro: LandingLogro }) {
  const gradient = COLOR_TIPO_LOGRO[l.tipoLogro] ?? "from-zinc-500 to-zinc-600"
  return (
    <Link
      href={`/reconocimientos/${l.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl snap-start shrink-0 w-[260px] sm:w-[300px] lg:w-[320px]"
    >
      <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        {l.imagen ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={l.imagen} alt={l.ciudad} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 text-emerald-500">
            <MapPinIcon className="h-14 w-14" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          <MapPinIcon className="h-3 w-3" />
          {l.ciudad} · {l.departamento}
        </div>
        <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600">{l.tipoLogro}</p>
        {l.indicadorPrincipal && (
          <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700/80 dark:text-emerald-400/80">
              {l.indicadorPrincipal.nombre}
            </p>
            <p className="text-xl font-black tracking-tight text-emerald-700 dark:text-emerald-400">
              {l.indicadorPrincipal.valor}
              {l.indicadorPrincipal.unidad && (
                <span className="ml-1 text-xs font-semibold">{l.indicadorPrincipal.unidad}</span>
              )}
            </p>
          </div>
        )}
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {l.descripcionCorta}
        </p>
        <div className="mt-auto pt-2 inline-flex items-center gap-1 text-xs font-bold text-[#FF8800] group-hover:gap-2 transition-all">
          Ver más <ArrowRightIcon className="h-3.5 w-3.5" />
        </div>
      </div>
    </Link>
  )
}
