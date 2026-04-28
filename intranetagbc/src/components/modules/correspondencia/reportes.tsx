"use client"

import { useState, useTransition } from "react"
import { BarChart3Icon, DownloadIcon, FileTextIcon, FilterIcon } from "lucide-react"
import toast from "react-hot-toast"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DataTable } from "@/components/dashboard/data-table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { generarReporte } from "@/actions/correspondencia"
import {
  ESTADOS_CORRESPONDENCIA,
  PRIORIDADES_CORRESPONDENCIA,
} from "@/lib/correspondencia-constants"
import { BadgeEstado, BadgePrioridad, CorrespondenciaRow, formatearFecha, nombreCompleto } from "./shared"

type UsuarioBasico = {
  id: string
  firstName: string
  lastNamePaternal: string
  lastNameMaternal: string | null
  institutionalEmail: string
  image: string | null
}

type Sucursal = { id: string; nombre: string; departamento: string }

interface Props {
  iniciales: CorrespondenciaRow[]
  productividadInicial: Array<{ area: string; total: number; finalizados: number; productividad: number }>
  usuarios: UsuarioBasico[]
  sucursales: Sucursal[]
  areas: string[]
}

export function CorrespondenciaReportes({
  iniciales,
  productividadInicial,
  usuarios,
  sucursales,
  areas,
}: Props) {
  const [items, setItems] = useState<CorrespondenciaRow[]>(iniciales)
  const [productividad, setProductividad] = useState(productividadInicial)
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")
  const [area, setArea] = useState("")
  const [sucursalId, setSucursalId] = useState("")
  const [responsableId, setResponsableId] = useState("")
  const [estado, setEstado] = useState("")
  const [prioridad, setPrioridad] = useState("")
  const [vencidos, setVencidos] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleGenerar() {
    startTransition(async () => {
      try {
        const r = await generarReporte({
          desde: desde ? new Date(desde) : undefined,
          hasta: hasta ? new Date(hasta) : undefined,
          area: area || undefined,
          sucursalId: sucursalId || undefined,
          responsableId: responsableId || undefined,
          estado: estado || undefined,
          prioridad: prioridad || undefined,
          vencidos,
        })
        setItems(r.items as CorrespondenciaRow[])
        setProductividad(r.productividadArea)
        toast.success(`${r.items.length} resultado(s)`)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al generar reporte")
      }
    })
  }

  function exportarCSV() {
    if (items.length === 0) {
      toast.error("No hay datos para exportar")
      return
    }
    const cols: Array<keyof CorrespondenciaRow> = [
      "hojaRuta",
      "asunto",
      "remitente",
      "destinatario",
      "destinoArea",
      "tipo",
      "origen",
      "estado",
      "prioridad",
      "fechaRecepcion",
      "plazoAtencion",
    ]
    const header = cols.join(",")
    const rows = items.map((c) =>
      cols
        .map((k) => {
          const v = c[k]
          if (v instanceof Date) return v.toISOString()
          const s = String(v ?? "").replace(/"/g, '""')
          return `"${s}"`
        })
        .join(","),
    )
    const csv = [header, ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `reporte-correspondencia-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const data = items.map((c) => ({
    ...c,
    fecha: formatearFecha(c.createdAt),
    plazo: formatearFecha(c.plazoAtencion),
  }))

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <BarChart3Icon className="h-5 w-5 text-[#FF8800]" />
            Reportes de correspondencia
          </h2>
          <p className="text-sm text-muted-foreground">
            Filtra por fechas, área, sucursal, responsable, estado y prioridad
          </p>
        </div>
        <Button variant="outline" onClick={exportarCSV} className="gap-2">
          <DownloadIcon className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      <Card className="border-border/40">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <FilterIcon className="h-4 w-4" />
            Filtros del reporte
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Desde</Label>
              <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Hasta</Label>
              <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Área</Label>
              <Select value={area || "__all__"} onValueChange={(v) => setArea(v === "__all__" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todas</SelectItem>
                  {areas.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Sucursal</Label>
              <Select value={sucursalId || "__all__"} onValueChange={(v) => setSucursalId(v === "__all__" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todas</SelectItem>
                  {sucursales.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nombre} — {s.departamento}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Responsable</Label>
              <Select
                value={responsableId || "__all__"}
                onValueChange={(v) => setResponsableId(v === "__all__" ? "" : v)}
              >
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos</SelectItem>
                  {usuarios.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {nombreCompleto(u)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Estado</Label>
              <Select value={estado || "__all__"} onValueChange={(v) => setEstado(v === "__all__" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos</SelectItem>
                  {ESTADOS_CORRESPONDENCIA.map((e) => (
                    <SelectItem key={e.value} value={e.value}>
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Prioridad</Label>
              <Select value={prioridad || "__all__"} onValueChange={(v) => setPrioridad(v === "__all__" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todas</SelectItem>
                  {PRIORIDADES_CORRESPONDENCIA.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={vencidos}
                  onChange={(e) => setVencidos(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                Sólo vencidos
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t pt-3">
            <Button
              onClick={handleGenerar}
              disabled={isPending}
              className="gap-2 bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000]"
            >
              <FileTextIcon className="h-4 w-4" />
              {isPending ? "Generando..." : "Generar reporte"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {productividad.length > 0 && (
        <Card className="border-border/40">
          <CardContent className="p-5">
            <h3 className="mb-3 text-sm font-semibold">Productividad por área</h3>
            <div className="space-y-3">
              {productividad.map((p) => (
                <div key={p.area} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{p.area}</span>
                    <span className="text-muted-foreground">
                      {p.finalizados} / {p.total}{" "}
                      <span className="ml-1 font-bold text-emerald-600">{p.productividad}%</span>
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-600"
                      style={{ width: `${p.productividad}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <DataTable
        data={data}
        columns={[
          {
            key: "hojaRuta",
            label: "Hoja de ruta",
            render: (row) => <span className="font-mono text-xs font-bold">{row.hojaRuta}</span>,
          },
          {
            key: "asunto",
            label: "Asunto",
            render: (row) => <div className="max-w-md truncate font-medium">{row.asunto}</div>,
          },
          { key: "remitente", label: "Remitente" },
          { key: "destinoArea", label: "Área", render: (row) => row.destinoArea ?? "—" },
          { key: "fecha", label: "Recepción" },
          { key: "plazo", label: "Plazo" },
          { key: "prioridad", label: "Prior.", render: (row) => <BadgePrioridad prioridad={row.prioridad} /> },
          { key: "estado", label: "Estado", render: (row) => <BadgeEstado estado={row.estado} /> },
        ]}
      />
    </div>
  )
}
