"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import {
  UsersIcon,
  MailIcon,
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"

interface PersonalItem {
  id: string
  nombre: string
  cargo: string
  unidad?: string
  email?: string | null
  telefono?: string | null
  foto?: string | null
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase() || "AG"
}

function buildPhoneHref(phone?: string | null) {
  if (!phone) return null
  const compact = phone.trim()
  if (compact.length === 0 || compact === "—" || compact.toLowerCase().includes("sin asignar")) return null
  const normalized = compact.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "")
  if (!/\d{6,}/.test(normalized)) return null
  return `tel:${normalized}`
}

export function LandingPersonal({ personal }: { personal: PersonalItem[] }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 8

  // Filtrado reactivo en tiempo real
  const filteredPersonal = useMemo(() => {
    const q = searchTerm.toLowerCase().trim()
    if (!q) return personal

    return personal.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        (p.cargo && p.cargo.toLowerCase().includes(q)) ||
        (p.email && p.email.toLowerCase().includes(q)) ||
        (p.telefono && p.telefono.includes(q))
    )
  }, [personal, searchTerm])

  const totalPages = Math.max(1, Math.ceil(filteredPersonal.length / pageSize))
  const paginatedList = filteredPersonal.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  if (personal.length === 0) return null

  return (
    <section
      id="equipo"
      className="scroll-mt-20 overflow-hidden py-16 md:py-24 bg-gradient-to-b from-slate-50/50 via-white to-blue-50/30"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        {/* ── Encabezado de Sección ── */}
        <div className="mx-auto max-w-2xl text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FFCC00]/40 bg-[#FFCC00]/15 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-[#002F6C]">
            <UsersIcon className="h-3.5 w-3.5 text-[#0E5296]" />
            NUESTRO EQUIPO
          </div>
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl text-[#002F6C]">
            Personal Institucional
          </h2>
          <p className="text-sm sm:text-base text-slate-500 font-medium">
            Directorio del personal y servidores públicos de la Agencia Boliviana de Correos
          </p>
        </div>

        {/* ── Tarjeta Contenedora Principal ── */}
        <div className="rounded-3xl border-2 border-[#002F6C]/15 bg-white p-5 sm:p-7 shadow-lg shadow-[#002F6C]/5 space-y-5">
          {/* Barra Superior: Buscador y Contador */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-2">
            <div className="relative w-full sm:w-80">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, cargo o correo..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 outline-hidden focus:border-[#0E5296] focus:ring-2 focus:ring-[#0E5296]/10 transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#0E5296] bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-200 shadow-2xs">
                Total Funcionarios: {filteredPersonal.length}
              </span>
            </div>
          </div>

          {/* ── Tabla de Personal Institucional ── */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-200/80 bg-gradient-to-r from-blue-50/80 via-white to-amber-50/60 text-[11px] font-black uppercase tracking-wider text-[#002F6C]">
                  <th className="py-3.5 px-5">FUNCIONARIO / CARGO</th>
                  <th className="py-3.5 px-5">CORREO INSTITUCIONAL</th>
                  <th className="py-3.5 px-5 text-right sm:text-left">TELÉFONO / CONTACTO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedList.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-12 text-center text-slate-400 font-medium">
                      No se encontraron funcionarios que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  paginatedList.map((p) => {
                    const initials = getInitials(p.nombre)
                    const phoneHref = buildPhoneHref(p.telefono)

                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-blue-50/40 transition-colors group"
                      >
                        {/* 1. Funcionario / Cargo */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3.5">
                            <div className="relative shrink-0">
                              {p.foto ? (
                                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-amber-300 shadow-xs">
                                  <Image
                                    src={p.foto}
                                    alt={p.nombre}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FFCC00] text-[#002F6C] font-black text-xs shadow-xs border border-amber-300">
                                  {initials}
                                </div>
                              )}
                              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
                            </div>
                            <div className="min-w-0 space-y-0.5">
                              <p className="font-black text-[#002F6C] text-sm truncate max-w-[280px]">
                                {p.nombre}
                              </p>
                              <p className="text-xs truncate max-w-[280px]">
                                <span className="text-slate-400 font-medium">Cargo: </span>
                                <span className="text-[#0E5296] font-bold">
                                  {p.cargo || "Funcionario Institucional"}
                                </span>
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* 2. Correo Institucional */}
                        <td className="py-3.5 px-5">
                          {p.email ? (
                            <a
                              href={`mailto:${p.email}`}
                              className="inline-flex items-center gap-2 text-xs font-bold text-[#002F6C] hover:text-[#0E5296] hover:underline transition-colors"
                            >
                              <MailIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span>{p.email}</span>
                            </a>
                          ) : (
                            <span className="text-slate-400 font-medium text-xs">—</span>
                          )}
                        </td>

                        {/* 3. Teléfono / Contacto */}
                        <td className="py-3.5 px-5 text-right sm:text-left">
                          {p.telefono && p.telefono !== "—" && !p.telefono.toLowerCase().includes("sin asignar") ? (
                            phoneHref ? (
                              <a
                                href={phoneHref}
                                className="inline-block rounded-full bg-slate-100 hover:bg-blue-100 border border-slate-200 px-3.5 py-1 text-xs font-bold text-slate-700 hover:text-[#002F6C] transition-all shadow-2xs"
                              >
                                {p.telefono}
                              </a>
                            ) : (
                              <span className="inline-block rounded-full bg-slate-100 border border-slate-200 px-3.5 py-1 text-xs font-bold text-slate-700">
                                {p.telefono}
                              </span>
                            )
                          ) : (
                            <span className="text-slate-400 font-medium text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ── Paginación Centrada ── */}
          {totalPages > 1 && (
            <div className="flex flex-col items-center justify-center gap-2 pt-3 border-t border-[#002F6C]/10 text-center">
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#002F6C] shadow-xs hover:bg-slate-50 disabled:opacity-30 cursor-pointer transition-colors"
                  title="Página anterior"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPage(idx + 1)}
                      className={`h-7 w-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        currentPage === idx + 1
                          ? "bg-[#0E5296] text-white shadow-xs"
                          : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#002F6C] shadow-xs hover:bg-slate-50 disabled:opacity-30 cursor-pointer transition-colors"
                  title="Siguiente página"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>

              <span className="text-[11px] font-medium text-slate-400">
                Página {currentPage} de {totalPages} • Mostrando{" "}
                {Math.min(filteredPersonal.length, (currentPage - 1) * pageSize + 1)} -{" "}
                {Math.min(filteredPersonal.length, currentPage * pageSize)} de{" "}
                {filteredPersonal.length} funcionarios
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}