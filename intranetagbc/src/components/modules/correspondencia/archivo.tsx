"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArchiveIcon, EyeIcon, FilterIcon, SearchIcon } from "lucide-react"

import { DataTable } from "@/components/dashboard/data-table"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ESTADOS_CORRESPONDENCIA,
  PRIORIDADES_CORRESPONDENCIA,
} from "@/lib/correspondencia-constants"
import { BadgeEstado, BadgePrioridad, CorrespondenciaRow, formatearFecha } from "./shared"

interface Props {
  archivadas: CorrespondenciaRow[]
  areas: string[]
}

export function CorrespondenciaArchivo({ archivadas, areas }: Props) {
  const [search, setSearch] = useState("")
  const [area, setArea] = useState<string>("")
  const [prioridad, setPrioridad] = useState<string>("")
  const [estado, setEstado] = useState<string>("")
  const [desde, setDesde] = useState<string>("")
  const [hasta, setHasta] = useState<string>("")

  const filtradas = useMemo(() => {
    const q = search.trim().toLowerCase()
    return archivadas.filter((c) => {
      if (q) {
        const matches =
          c.hojaRuta.toLowerCase().includes(q) ||
          c.asunto.toLowerCase().includes(q) ||
          c.remitente.toLowerCase().includes(q) ||
          (c.destinatario ?? "").toLowerCase().includes(q)
        if (!matches) return false
      }
      if (area && c.destinoArea !== area) return false
      if (prioridad && c.prioridad !== prioridad) return false
      if (estado && c.estado !== estado) return false
      if (desde && new Date(c.createdAt) < new Date(desde)) return false
      if (hasta) {
        const end = new Date(hasta)
        end.setHours(23, 59, 59, 999)
        if (new Date(c.createdAt) > end) return false
      }
      return true
    })
  }, [archivadas, search, area, prioridad, estado, desde, hasta])

  const data = filtradas.map((c) => ({
    ...c,
    fecha: formatearFecha(c.createdAt),
    archivadoEnFmt: formatearFecha(c.archivadoEn),
  }))

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <ArchiveIcon className="h-5 w-5 text-[#FF8800]" />
            Archivo digital
          </h2>
          <p className="text-sm text-muted-foreground">
            {archivadas.length} correspondencia(s) archivada(s)
          </p>
        </div>
      </div>

      <Card className="border-border/40">
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <FilterIcon className="h-4 w-4" />
            Filtros de búsqueda
          </div>
          <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
            <div className="relative md:col-span-2">
              <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código, asunto, remitente o destinatario..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={area || "__all__"} onValueChange={(v) => setArea(v === "__all__" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Área" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas las áreas</SelectItem>
                {areas.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={prioridad || "__all__"} onValueChange={(v) => setPrioridad(v === "__all__" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas</SelectItem>
                {PRIORIDADES_CORRESPONDENCIA.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={estado || "__all__"} onValueChange={(v) => setEstado(v === "__all__" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos</SelectItem>
                {ESTADOS_CORRESPONDENCIA.map((e) => (
                  <SelectItem key={e.value} value={e.value}>
                    {e.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-2 md:col-span-2 lg:col-span-1">
              <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} aria-label="Desde" />
              <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} aria-label="Hasta" />
            </div>
          </div>
        </CardContent>
      </Card>

      <DataTable
        data={data}
        columns={[
          {
            key: "hojaRuta",
            label: "Hoja de ruta",
            className: "w-40",
            render: (row) => <span className="font-mono text-xs font-bold">{row.hojaRuta}</span>,
          },
          {
            key: "asunto",
            label: "Asunto",
            render: (row) => (
              <div className="max-w-md truncate text-sm font-medium">{row.asunto}</div>
            ),
          },
          { key: "remitente", label: "Remitente" },
          {
            key: "destinatario",
            label: "Destinatario",
            render: (row) => row.destinatario ?? row.destinoArea ?? "—",
          },
          { key: "fecha", label: "Recepción" },
          { key: "archivadoEnFmt", label: "Archivado" },
          { key: "prioridad", label: "Prior.", render: (row) => <BadgePrioridad prioridad={row.prioridad} /> },
          { key: "estado", label: "Estado", render: (row) => <BadgeEstado estado={row.estado} /> },
        ]}
        actions={(row) => (
          <Link
            href={`/correspondencia/seguimiento?id=${row.id}`}
            title="Ver detalle"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-card/80 text-muted-foreground transition-all hover:border-[#FFB300]/40 hover:bg-[#FFB300]/10 hover:text-[#FF8800]"
          >
            <EyeIcon className="h-4 w-4" />
          </Link>
        )}
      />
    </div>
  )
}
