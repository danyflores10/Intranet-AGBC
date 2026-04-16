"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import {
  MapPinIcon,
  ClockIcon,
  PhoneIcon,
  ExternalLinkIcon,
  XIcon,
  BuildingIcon,
  ChevronRightIcon,
} from "lucide-react"

interface DepartmentData {
  id: string
  name: string
  capital: string
  pinX: number
  pinY: number
  color: string
  foto?: string | null
  office: {
    name: string
    address: string
    phone: string
    hours: string
    maps: string
  }
}

/* ── Datos por defecto (fallback si no hay datos en BD) ── */
const defaultDepartments: DepartmentData[] = [
  {
    id: "BON", name: "Pando", capital: "Cobija", pinX: 21, pinY: 13, color: "#4CAF50",
    office: { name: "Oficina Postal Cobija", address: "Calle Beni s/n, Cobija", phone: "(3) 842-2000", hours: "Lun - Vie: 8:00 - 16:00", maps: "https://maps.google.com/?q=-11.0267,-68.7692" },
  },
  {
    id: "BOL", name: "La Paz", capital: "La Paz", pinX: 16.7, pinY: 32, color: "#1976D2",
    office: { name: "Oficina Central La Paz", address: "Av. Mariscal Santa Cruz esq. Oruro, La Paz", phone: "(2) 231-5040", hours: "Lun - Vie: 8:00 - 18:00", maps: "https://maps.google.com/?q=-16.4955,-68.1336" },
  },
  {
    id: "BOB", name: "El Beni", capital: "Trinidad", pinX: 38, pinY: 27, color: "#FF9800",
    office: { name: "Oficina Postal Trinidad", address: "Calle 6 de Agosto, Trinidad", phone: "(3) 462-1000", hours: "Lun - Vie: 8:00 - 16:00", maps: "https://maps.google.com/?q=-14.8333,-64.9000" },
  },
  {
    id: "BOC", name: "Cochabamba", capital: "Cochabamba", pinX: 30.8, pinY: 44.8, color: "#9C27B0",
    office: { name: "Oficina Postal Cochabamba", address: "Calle Ayacucho esq. Heroínas, Cochabamba", phone: "(4) 425-8000", hours: "Lun - Vie: 8:00 - 18:00", maps: "https://maps.google.com/?q=-17.3935,-66.1570" },
  },
  {
    id: "BOO", name: "Oruro", capital: "Oruro", pinX: 18.8, pinY: 52, color: "#F44336",
    office: { name: "Oficina Postal Oruro", address: "Calle Presidente Montes, Oruro", phone: "(2) 525-0100", hours: "Lun - Vie: 8:00 - 16:00", maps: "https://maps.google.com/?q=-17.9647,-67.1064" },
  },
  {
    id: "BOS", name: "Santa Cruz", capital: "Santa Cruz de la Sierra", pinX: 50, pinY: 42.4, color: "#00ACC1",
    office: { name: "Oficina Postal Santa Cruz", address: "Calle Junín esq. Chuquisaca, Santa Cruz", phone: "(3) 336-6000", hours: "Lun - Vie: 8:00 - 18:00", maps: "https://maps.google.com/?q=-17.7833,-63.1821" },
  },
  {
    id: "BOP", name: "Potosí", capital: "Potosí", pinX: 24.2, pinY: 63.6, color: "#795548",
    office: { name: "Oficina Postal Potosí", address: "Calle Lanza esq. Chuquisaca, Potosí", phone: "(2) 622-2000", hours: "Lun - Vie: 8:00 - 16:00", maps: "https://maps.google.com/?q=-19.5836,-65.7531" },
  },
  {
    id: "BOH", name: "Chuquisaca", capital: "Sucre", pinX: 38, pinY: 65, color: "#E91E63",
    office: { name: "Oficina Postal Sucre", address: "Calle Junín, Sucre", phone: "(4) 646-1000", hours: "Lun - Vie: 8:00 - 16:00", maps: "https://maps.google.com/?q=-19.0353,-65.2592" },
  },
  {
    id: "BOT", name: "Tarija", capital: "Tarija", pinX: 37, pinY: 72.5, color: "#607D8B",
    office: { name: "Oficina Postal Tarija", address: "Calle Sucre esq. Gral. Trigo, Tarija", phone: "(4) 664-2000", hours: "Lun - Vie: 8:00 - 16:00", maps: "https://maps.google.com/?q=-21.5355,-64.7296" },
  },
]

export interface SucursalFromDb {
  id: string
  departamento: string
  capital: string
  nombre: string
  direccion: string
  telefono: string | null
  horario: string | null
  foto: string | null
  googleMaps: string | null
  color: string | null
  svgId: string | null
  pinX: string | null
  pinY: string | null
}

interface BoliviaMapProps {
  sucursalesDb?: SucursalFromDb[]
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function BoliviaMap({ sucursalesDb }: BoliviaMapProps) {
  const departments = useMemo<DepartmentData[]>(() => {
    if (sucursalesDb && sucursalesDb.length > 0) {
      return sucursalesDb.map((s) => ({
        id: s.svgId ?? s.id,
        name: s.departamento,
        capital: s.capital,
        pinX: parseFloat(s.pinX ?? "0"),
        pinY: parseFloat(s.pinY ?? "0"),
        color: s.color ?? "#FFB300",
        foto: s.foto,
        office: {
          name: s.nombre,
          address: s.direccion,
          phone: s.telefono ?? "",
          hours: s.horario ?? "",
          maps: s.googleMaps ?? "",
        },
      }))
    }

    return defaultDepartments
  }, [sucursalesDb])

  // Dependencia estable para efectos que solo necesitan id/color.
  const departmentsStyleKey = useMemo(
    () => departments.map((dept) => `${dept.id}:${dept.color}`).join("|"),
    [departments]
  )

  const containerRef = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const [svgReady, setSvgReady] = useState(false)

  const selectedDept = departments.find((d) => d.id === selected)

  /* ── Cargar SVG e inyectar estilos interactivos ── */
  useEffect(() => {
    fetch("/image/bolivia-dept-map.svg")
      .then((r) => r.text())
      .then((svgText) => {
        if (!containerRef.current) return
        containerRef.current.innerHTML = svgText

        const svgEl = containerRef.current.querySelector("svg")
        if (!svgEl) return

        svgEl.style.width = "100%"
        svgEl.style.height = "auto"
        svgEl.style.display = "block"

        const old = svgEl.querySelector("style")
        if (old) old.remove()

        const style = document.createElementNS("http://www.w3.org/2000/svg", "style")
        style.textContent = `
          .cb-bolivia-dept {
            stroke-linecap: round;
            stroke-linejoin: round;
            cursor: pointer;
            transition: all 0.35s cubic-bezier(.4,0,.2,1);
          }
        `
        svgEl.prepend(style)
        svgEl.querySelectorAll(".is-active").forEach((el) => el.classList.remove("is-active"))

        /* Aplicar color único por departamento */
        departments.forEach((dept) => {
          const path = svgEl.querySelector(`path[data-id="${dept.id}"]`) as SVGPathElement | null
          if (path) {
            path.style.fill = hexToRgba(dept.color, 0.12)
            path.style.stroke = dept.color + "70"
            path.style.strokeWidth = "2"
          }
        })

        setSvgReady(true)
      })
  }, [])

  /* ── Sincronizar estilos por departamento (hover / selección) ── */
  useEffect(() => {
    if (!svgReady || !containerRef.current) return
    departments.forEach((dept) => {
      const el = containerRef.current!.querySelector(`path[data-id="${dept.id}"]`) as SVGPathElement | null
      if (!el) return
      if (dept.id === selected) {
        el.style.fill = hexToRgba(dept.color, 0.32)
        el.style.stroke = dept.color
        el.style.strokeWidth = "4"
        el.style.filter = `drop-shadow(0 0 10px ${hexToRgba(dept.color, 0.4)})`
      } else if (dept.id === hovered) {
        el.style.fill = hexToRgba(dept.color, 0.25)
        el.style.stroke = dept.color
        el.style.strokeWidth = "3"
        el.style.filter = `drop-shadow(0 0 8px ${hexToRgba(dept.color, 0.3)})`
      } else {
        el.style.fill = hexToRgba(dept.color, 0.12)
        el.style.stroke = dept.color + "70"
        el.style.strokeWidth = "2"
        el.style.filter = "none"
      }
    })
  }, [selected, hovered, svgReady, departmentsStyleKey])

  /* ── Event handlers en los paths SVG ── */
  useEffect(() => {
    if (!svgReady || !containerRef.current) return
    const paths = containerRef.current.querySelectorAll("path[data-id]")
    const cleanups: Array<() => void> = []

    paths.forEach((path) => {
      const id = path.getAttribute("data-id")!
      const click = () => setSelected((p) => (p === id ? null : id))
      const enter = () => setHovered(id)
      const leave = () => setHovered(null)
      path.addEventListener("click", click)
      path.addEventListener("mouseenter", enter)
      path.addEventListener("mouseleave", leave)
      cleanups.push(
        () => path.removeEventListener("click", click),
        () => path.removeEventListener("mouseenter", enter),
        () => path.removeEventListener("mouseleave", leave),
      )
    })

    return () => cleanups.forEach((fn) => fn())
  }, [svgReady])

  return (
    <section id="cobertura" className="border-y border-border/40 bg-muted/20">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#FFB300]/20 bg-[#FFB300]/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#FF8800]">
            <MapPinIcon className="h-3.5 w-3.5" />
            Cobertura Nacional
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
            Nuestras Oficinas
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Presentes en los 9 departamentos de Bolivia
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
          {/* Mapa */}
          <div className="relative rounded-2xl border border-border/50 bg-white dark:bg-zinc-900 p-4 sm:p-6 shadow-lg overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-amber-50/30 dark:from-blue-950/20 dark:to-amber-950/10 rounded-2xl" />

            <div className="relative">
              <div ref={containerRef} className="[&>svg]:w-full [&>svg]:h-auto" />

              {/* Pines sobre el mapa */}
              {svgReady && (
                <div className="absolute inset-0 pointer-events-none">
                  {departments.map((dept) => (
                    <button
                      key={dept.id}
                      onClick={() => setSelected((p) => (p === dept.id ? null : dept.id))}
                      className={`absolute pointer-events-auto -translate-x-1/2 -translate-y-full transition-all duration-300 ${
                        selected === dept.id ? "z-20 scale-125" : hovered === dept.id ? "z-10 scale-110" : "z-0"
                      }`}
                      style={{ left: `${dept.pinX}%`, top: `${dept.pinY}%` }}
                      title={dept.name}
                    >
                      <div className="relative">
                        <MapPinIcon
                          className="h-7 w-7 drop-shadow-lg transition-all duration-300"
                          style={{ color: dept.color }}
                          fill="currentColor"
                          strokeWidth={1.5}
                          stroke="white"
                        />
                        {selected === dept.id && (
                          <span className="absolute -inset-1 animate-ping rounded-full" style={{ backgroundColor: dept.color + "33" }} />
                        )}
                      </div>
                      <div
                        className={`absolute left-1/2 -translate-x-1/2 top-full mt-0.5 whitespace-nowrap text-[10px] font-bold px-1.5 py-0.5 rounded-md transition-all duration-300 ${
                          selected === dept.id
                            ? "text-white shadow-md"
                            : "bg-white/90 dark:bg-zinc-800/90 text-foreground shadow-sm border border-border/30"
                        }`}
                        style={selected === dept.id ? { backgroundColor: dept.color } : undefined}
                      >
                        {dept.capital}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tooltip hover */}
            {hovered && !selected && (() => {
              const h = departments.find((d) => d.id === hovered)
              if (!h) return null
              return (
                <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-xl bg-white/95 dark:bg-zinc-800/95 backdrop-blur-sm border border-border/50 p-3 shadow-lg">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-md" style={{ background: h.color }}>
                    <BuildingIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm">{h.name}</p>
                    <p className="text-xs text-muted-foreground">Click para ver información de la oficina</p>
                  </div>
                </div>
              )
            })()}
          </div>

          {/* Panel lateral */}
          <div className="space-y-3">
            {selectedDept ? (
              <div className="rounded-2xl border border-[#FFB300]/30 bg-white dark:bg-zinc-900 shadow-xl shadow-[#FFB300]/5 overflow-hidden">
                <div className="flex h-1 w-full">
                  <div className="flex-1 bg-[#C41E3A]" />
                  <div className="flex-1 bg-[#FFB300]" />
                  <div className="flex-1 bg-[#2E7D32]" />
                </div>
                <div className="p-5 border-b border-border/30">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-lg"
                        style={{ background: `linear-gradient(135deg, ${selectedDept.color}, ${selectedDept.color}dd)` }}
                      >
                        <BuildingIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-lg">{selectedDept.name}</h3>
                        <p className="text-sm text-muted-foreground">{selectedDept.capital}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelected(null)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 hover:bg-muted transition-colors"
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  {/* Foto de la sucursal */}
                  {selectedDept.foto && (
                    <div className="relative overflow-hidden rounded-xl border border-border/30 bg-muted/20">
                      <div className="flex h-44 w-full items-center justify-center p-1.5">
                        <img src={selectedDept.foto} alt={selectedDept.name} className="h-full w-full object-contain" />
                      </div>
                    </div>
                  )}
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPinIcon className="h-4 w-4 shrink-0 mt-0.5 text-[#FF8800]" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Dirección</p>
                        <p className="text-sm font-medium">{selectedDept.office.address}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <PhoneIcon className="h-4 w-4 shrink-0 mt-0.5 text-[#FF8800]" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Teléfono</p>
                        <p className="text-sm font-medium">{selectedDept.office.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <ClockIcon className="h-4 w-4 shrink-0 mt-0.5 text-[#FF8800]" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Horario</p>
                        <p className="text-sm font-medium">{selectedDept.office.hours}</p>
                      </div>
                    </div>
                  </div>
                  <a
                    href={selectedDept.office.maps}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-[#FFB300] to-[#FF8800] hover:from-[#FF8800] hover:to-[#FFB300] text-white font-semibold py-3 px-4 transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    <ExternalLinkIcon className="h-4 w-4" />
                    Ver en Google Maps
                  </a>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-border/50 bg-white dark:bg-zinc-900 shadow-lg overflow-hidden">
                <div className="p-4 border-b border-border/30 bg-gradient-to-r from-zinc-50 to-white dark:from-zinc-800/50 dark:to-zinc-900">
                  <h3 className="font-bold text-sm">Departamentos</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Seleccione un departamento</p>
                </div>
                <div className="divide-y divide-border/30">
                  {departments.map((dept) => (
                    <button
                      key={dept.id}
                      onClick={() => setSelected(dept.id)}
                      onMouseEnter={() => setHovered(dept.id)}
                      onMouseLeave={() => setHovered(null)}
                      className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-[#FFB300]/5 transition-all duration-200 group"
                    >
                      <div
                        className="h-3 w-3 rounded-full shrink-0 group-hover:scale-125 transition-transform"
                        style={{ background: dept.color, boxShadow: `0 0 0 2px white, 0 0 0 4px ${dept.color}40` }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{dept.name}</p>
                        <p className="text-xs text-muted-foreground">{dept.capital}</p>
                      </div>
                      <ChevronRightIcon className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
