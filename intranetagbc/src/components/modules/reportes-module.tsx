"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  FileTextIcon,
  UsersIcon,
  MailIcon,
  ClipboardListIcon,
  MegaphoneIcon,
  BarChart3Icon,
} from "lucide-react"

interface Props {
  counts: {
    documentos: number
    correspondencia: number
    tramites: number
    personal: number
    comunicados: number
    usuarios: number
  }
}

export function ReportesModule({ counts }: Props) {
  const items = [
    { label: "Documentos", count: counts.documentos, icon: FileTextIcon, color: "text-[#0E5296]", bg: "bg-blue-50 border-blue-200/80" },
    { label: "Correspondencia", count: counts.correspondencia, icon: MailIcon, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200/80" },
    { label: "Trámites", count: counts.tramites, icon: ClipboardListIcon, color: "text-purple-600", bg: "bg-purple-50 border-purple-200/80" },
    { label: "Personal AGBC", count: counts.personal, icon: UsersIcon, color: "text-[#002F6C]", bg: "bg-amber-50 border-amber-200/80" },
    { label: "Comunicados", count: counts.comunicados, icon: MegaphoneIcon, color: "text-[#FF8800]", bg: "bg-yellow-50 border-yellow-200/80" },
    { label: "Usuarios del Sistema", count: counts.usuarios, icon: UsersIcon, color: "text-[#0E5296]", bg: "bg-sky-50 border-sky-200/80" },
  ]

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 bg-gradient-to-br from-slate-50 via-blue-50/25 to-amber-50/20 min-h-screen">
      {/* ── Encabezado Institucional ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-3xl border-2 border-[#002F6C]/15 bg-gradient-to-r from-white via-blue-50/30 to-amber-50/30 p-6 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0E5296] text-[#FFCC00] shadow-md ring-2 ring-[#0E5296]/20">
            <BarChart3Icon className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-[#002F6C]">
                Reportes y Métricas Globales
              </h1>
              <span className="rounded-full bg-[#0E5296] text-[#FFCC00] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
                AGBC
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Resumen consolidado de registros en la base de datos institucional
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.label}
            className={`rounded-3xl border-2 ${item.bg} p-6 shadow-xs flex items-center justify-between transition-all hover:shadow-md`}
          >
            <div>
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">{item.label}</p>
              <div className="text-3xl font-black text-[#002F6C] mt-1">{item.count}</div>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Registros totales</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-xs border border-slate-200/60">
              <item.icon className={`h-6 w-6 ${item.color}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

