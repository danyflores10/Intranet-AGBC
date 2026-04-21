"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import Image from "next/image"
import {
  Users,
  Mail,
  Phone,
  Building2,
  Shield,
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
  XIcon,
} from "lucide-react"

/* ── Types ── */
interface PersonalItem {
  id: string
  nombre: string
  cargo: string
  unidad: string
  email?: string | null
  telefono?: string | null
  foto?: string | null
}

/* ── Helpers ── */
const AVATAR_COLORS = [
  "#E91E63", "#1A73E8", "#0B8043", "#F29900", "#8430CE",
  "#D93025", "#1E8E3E", "#185ABC", "#E37400", "#A142F4",
  "#00897B", "#C2185B",
]

function hashN(n: string) {
  let h = 0
  for (let i = 0; i < n.length; i++) {
    h = n.charCodeAt(i) + ((h << 5) - h)
    h |= 0
  }
  return Math.abs(h)
}

function initials(n: string) {
  return n
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
}

/* ── Component ── */
export function LandingPersonal({ personal }: { personal: PersonalItem[] }) {
  const [active, setActive] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [search, setSearch] = useState("")
  const touchStartX = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  if (personal.length === 0) return null

  const normalizar = (s: string) =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()

  const filtered = search.trim()
    ? personal.filter((p) => {
        const q = normalizar(search)
        return (
          normalizar(p.nombre).includes(q) ||
          normalizar(p.cargo).includes(q) ||
          normalizar(p.unidad).includes(q) ||
          (p.email && normalizar(p.email).includes(q))
        )
      })
    : personal

  const total = filtered.length
  const safeActive = total > 0 ? Math.min(active, total - 1) : 0

  const go = useCallback(
    (dir: number) => {
      if (isAnimating || total === 0) return
      setIsAnimating(true)
      setActive((prev) => {
        const safe = Math.min(prev, total - 1)
        const next = safe + dir
        if (next < 0) return total - 1
        if (next >= total) return 0
        return next
      })
      setTimeout(() => setIsAnimating(false), 500)
    },
    [isAnimating, total],
  )

  const goTo = useCallback(
    (idx: number) => {
      if (isAnimating || idx === safeActive || total === 0) return
      setIsAnimating(true)
      setActive(idx)
      setTimeout(() => setIsAnimating(false), 500)
    },
    [isAnimating, safeActive, total],
  )

  /* Keyboard navigation */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(-1)
      if (e.key === "ArrowRight") go(1)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [go])

  /* Touch / swipe */
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) go(diff > 0 ? 1 : -1)
  }

  /* Autoplay */
  useEffect(() => {
    const id = setInterval(() => go(1), 6000)
    return () => clearInterval(id)
  }, [go])

  /* ── Card position math ── */
  function getCardStyle(index: number) {
    let offset = index - safeActive
    // Wrap around for circular feel
    if (offset > Math.floor(total / 2)) offset -= total
    if (offset < -Math.floor(total / 2)) offset += total

    const absOffset = Math.abs(offset)

    // Only show 5 cards max (center ± 2)
    if (absOffset > 2) {
      return {
        opacity: 0,
        transform: `translateX(${offset > 0 ? 600 : -600}px) translateZ(-600px) rotateY(0deg)`,
        zIndex: 0,
        pointerEvents: "none" as const,
        visibility: "hidden" as const,
      }
    }

    const translateX = offset * 220
    const translateZ = -absOffset * 150
    const rotateY = offset * -25
    const scale = 1 - absOffset * 0.12
    const opacity = 1 - absOffset * 0.25

    return {
      transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
      zIndex: 10 - absOffset,
      opacity,
      pointerEvents: (absOffset === 0 ? "auto" : "none") as React.CSSProperties["pointerEvents"],
      visibility: "visible" as const,
    }
  }

  /* ── Pagination dots (show max 7 around active) ── */
  const maxDots = Math.min(total, 7)
  let dotStart = Math.max(0, safeActive - Math.floor(maxDots / 2))
  if (dotStart + maxDots > total) dotStart = Math.max(0, total - maxDots)
  const dots = Array.from({ length: maxDots }, (_, i) => dotStart + i)

  return (
    <section
      id="equipo"
      className="scroll-mt-20 overflow-hidden"
      style={{ background: "var(--landing-neumo-bg)" }}
    >
      <div className="mx-auto max-w-7xl px-6 py-20 md:py-28">
        {/* ── Header ── */}
        <div className="mx-auto max-w-2xl text-center mb-14">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#FFB300]/20 bg-[#FFB300]/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#FF8800]">
            <Users className="h-3.5 w-3.5" />
            Nuestro Equipo
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl text-gray-800 dark:text-gray-100">
            Personal Institucional
          </h2>
          <p className="mt-4 text-gray-500 text-lg dark:text-gray-300">
            Los profesionales que hacen posible nuestro servicio día a día
          </p>
        </div>

        {/* ── Search bar ── */}
        <div className="mx-auto max-w-md mb-10">
          <div
            className="relative flex items-center rounded-full px-5 py-3"
            style={{
              background: "var(--landing-neumo-bg)",
              boxShadow: "inset 3px 3px 6px var(--landing-neumo-shadow-dark), inset -3px -3px 6px var(--landing-neumo-shadow-light)",
            }}
          >
            <SearchIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setActive(0) }}
              placeholder="Buscar por nombre, cargo o unidad..."
              className="ml-3 w-full bg-transparent text-sm text-gray-700 placeholder:text-gray-400 dark:text-gray-100 dark:placeholder:text-gray-500 focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(""); setActive(0) }}
                className="ml-2 flex h-6 w-6 items-center justify-center rounded-full text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-300/40 dark:hover:bg-gray-700/35 transition-colors"
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {search && (
            <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-2">
              {total} resultado{total !== 1 ? "s" : ""} encontrado{total !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* ── Carousel wrapper ── */}
        <div className="relative flex items-center justify-center">
          {/* Left arrow */}
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Anterior"
            className="absolute left-2 sm:left-4 md:left-8 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-[#101010] text-gray-700 dark:text-gray-100 shadow-lg transition-all duration-200 hover:scale-110 hover:shadow-xl active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB300]"
            style={{
              boxShadow: "4px 4px 12px var(--landing-neumo-shadow-dark), -4px -4px 12px var(--landing-neumo-shadow-light)",
            }}
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>

          {/* 3D stage */}
          <div
            ref={containerRef}
            className="relative mx-auto w-full max-w-4xl"
            style={{
              perspective: "1200px",
              perspectiveOrigin: "50% 50%",
              height: "440px",
            }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <div
              className="relative h-full w-full"
              style={{ transformStyle: "preserve-3d" }}
            >
              {filtered.map((p, index) => {
                const cardStyle = getCardStyle(index)
                const color =
                  AVATAR_COLORS[hashN(p.nombre) % AVATAR_COLORS.length]
                const isActive = index === safeActive

                return (
                  <div
                    key={p.id}
                    className="absolute left-1/2 top-1/2"
                    style={{
                      width: "280px",
                      marginLeft: "-140px",
                      marginTop: "-200px",
                      transition:
                        "transform 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.55s ease",
                      ...cardStyle,
                    }}
                    onClick={() => {
                      if (!isActive) goTo(index)
                    }}
                  >
                    {/* Neumorphic card */}
                    <div
                      className={`flex flex-col items-center rounded-3xl pt-8 pb-6 px-5 transition-shadow duration-500 ${
                        isActive ? "ring-2 ring-[#FFB300]/30" : ""
                      }`}
                      style={{
                        background: "var(--landing-neumo-bg)",
                        boxShadow: isActive
                          ? "12px 12px 24px var(--landing-neumo-shadow-deep), -12px -12px 24px var(--landing-neumo-shadow-high), 0 0 30px rgba(255,179,0,0.08)"
                          : "8px 8px 16px var(--landing-neumo-shadow-dark), -8px -8px 16px var(--landing-neumo-shadow-light)",
                        height: "400px",
                      }}
                    >
                      {/* Avatar */}
                      <div
                        className="relative rounded-full p-1.5 mb-4 transition-transform duration-300"
                        style={{
                          background: "var(--landing-neumo-bg)",
                          boxShadow:
                            "4px 4px 10px var(--landing-neumo-shadow-dark), -4px -4px 10px var(--landing-neumo-shadow-light), inset 2px 2px 5px var(--landing-neumo-shadow-dark), inset -2px -2px 5px var(--landing-neumo-shadow-light)",
                        }}
                      >
                        {p.foto ? (
                          <div className="relative h-24 w-24 overflow-hidden rounded-full">
                            <Image
                              src={p.foto}
                              alt={p.nombre}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div
                            className="flex h-24 w-24 items-center justify-center rounded-full text-3xl font-bold text-white"
                            style={{ backgroundColor: color }}
                          >
                            {initials(p.nombre)}
                          </div>
                        )}
                      </div>

                      {/* Name */}
                      <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 text-center leading-tight mt-1">
                        {p.nombre}
                      </h3>

                      {/* Cargo */}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center uppercase tracking-wide font-semibold">
                        {p.cargo}
                      </p>

                      {/* Contact icons row */}
                      <div className="flex items-center justify-center gap-3 mt-4">
                        {p.email && (
                          <a
                            href={`mailto:${p.email}`}
                            title={p.email}
                            className="flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 hover:scale-110"
                            style={{
                              background: "var(--landing-neumo-soft-bg)",
                              boxShadow:
                                "3px 3px 6px var(--landing-neumo-shadow-dark), -3px -3px 6px var(--landing-neumo-shadow-light)",
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
                              background: "var(--landing-neumo-soft-bg)",
                              boxShadow:
                                "3px 3px 6px var(--landing-neumo-shadow-dark), -3px -3px 6px var(--landing-neumo-shadow-light)",
                            }}
                          >
                            <Phone className="h-3.5 w-3.5 text-[#1A73E8]" />
                          </div>
                        )}
                        <div
                          className="flex h-9 w-9 items-center justify-center rounded-full"
                          style={{
                            background: "var(--landing-neumo-soft-bg)",
                            boxShadow:
                              "3px 3px 6px var(--landing-neumo-shadow-dark), -3px -3px 6px var(--landing-neumo-shadow-light)",
                          }}
                        >
                          <Building2 className="h-3.5 w-3.5 text-[#0B8043]" />
                        </div>
                      </div>

                      {/* Unit badge */}
                      <div
                        className="mt-4 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300"
                        style={{
                          background: "var(--landing-neumo-bg)",
                          boxShadow:
                            "inset 2px 2px 5px var(--landing-neumo-shadow-dark), inset -2px -2px 5px var(--landing-neumo-shadow-light)",
                        }}
                      >
                        <Shield className="h-3 w-3 text-[#FF8800]" />
                        {p.unidad}
                      </div>

                      {/* Divider */}
                      <div
                        className="w-full mt-4 mb-3 border-t"
                        style={{ borderColor: "var(--landing-neumo-divider)" }}
                      />

                      {/* Contact info footer */}
                      <div className="flex items-center justify-center gap-4 text-[11px] text-gray-500 dark:text-gray-400 w-full flex-wrap">
                        {p.email && (
                          <a
                            href={`mailto:${p.email}`}
                            className="flex items-center gap-1 hover:text-[#FF8800] transition-colors truncate max-w-[120px]"
                            title={p.email}
                          >
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{p.email}</span>
                          </a>
                        )}
                        {p.telefono && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3 shrink-0" />
                            {p.telefono}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right arrow */}
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Siguiente"
            className="absolute right-2 sm:right-4 md:right-8 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-[#101010] text-gray-700 dark:text-gray-100 shadow-lg transition-all duration-200 hover:scale-110 hover:shadow-xl active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB300]"
            style={{
              boxShadow: "4px 4px 12px var(--landing-neumo-shadow-dark), -4px -4px 12px var(--landing-neumo-shadow-light)",
            }}
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>

        {/* ── Pagination dots ── */}
        <div className="flex items-center justify-center gap-2 mt-10">
          {dots.map((dotIdx) => (
            <button
              key={dotIdx}
              type="button"
              onClick={() => goTo(dotIdx)}
              aria-label={`Ir a ${filtered[dotIdx]?.nombre ?? dotIdx + 1}`}
              className={`rounded-full transition-all duration-300 focus:outline-none ${
                dotIdx === safeActive
                  ? "h-3.5 w-3.5 bg-[#1A73E8] shadow-md shadow-[#1A73E8]/40"
                  : "h-2.5 w-2.5 bg-gray-400/50 hover:bg-gray-400 dark:bg-gray-600/60 dark:hover:bg-gray-500"
              }`}
            />
          ))}
        </div>

        {/* Active person name below dots */}
        {total > 0 && (
          <p className="text-center mt-4 text-sm font-semibold text-gray-600 dark:text-gray-300 transition-all duration-300">
            {filtered[safeActive]?.nombre}
            <span className="ml-2 text-xs font-normal text-gray-400 dark:text-gray-500">
              {safeActive + 1} / {total}
            </span>
          </p>
        )}

        {/* No results message */}
        {total === 0 && search && (
          <p className="text-center mt-4 text-sm text-gray-400 dark:text-gray-500">
            No se encontraron resultados para &ldquo;{search}&rdquo;
          </p>
        )}
      </div>
    </section>
  )
}
