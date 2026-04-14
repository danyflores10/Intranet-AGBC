"use client"

import { useState, useTransition } from "react"
import {
  PlusIcon,
  InboxIcon,
  SendIcon,
  BarChart3Icon,
  EyeIcon,
  Trash2Icon,
  MailIcon,
  MailOpenIcon,
  XIcon,
} from "lucide-react"
import toast from "react-hot-toast"

import { ModuleHeader } from "@/components/dashboard/module-header"
import { DataTable } from "@/components/dashboard/data-table"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  crearCorrespondencia,
  actualizarCorrespondencia,
  eliminarCorrespondencia,
} from "@/actions/correspondencia"

type Tab = "bandeja" | "enviados" | "reportes"

const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "bandeja", label: "Bandeja de entrada", icon: InboxIcon },
  { key: "enviados", label: "Enviados", icon: SendIcon },
  { key: "reportes", label: "Reportes", icon: BarChart3Icon },
]

interface CorrespondenciaModuleProps {
  entrada: Array<{
    id: string
    hojaRuta: string
    asunto: string
    remitente: string
    destinatario: string | null
    tipo: string
    estado: string
    leido: boolean
    observaciones: string | null
    createdAt: Date
  }>
  salida: Array<{
    id: string
    hojaRuta: string
    asunto: string
    remitente: string
    destinatario: string | null
    tipo: string
    estado: string
    leido: boolean
    observaciones: string | null
    createdAt: Date
  }>
  stats: {
    total: number
    entrada: number
    salida: number
    sinLeer: number
    pendientes: number
    atendidas: number
  }
}

export function CorrespondenciaModule({ entrada, salida, stats }: CorrespondenciaModuleProps) {
  const [tab, setTab] = useState<Tab>("bandeja")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogTipo, setDialogTipo] = useState<"entrada" | "salida">("entrada")
  const [isPending, startTransition] = useTransition()

  function handleNueva(tipo: "entrada" | "salida") {
    setDialogTipo(tipo)
    setDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        const year = new Date().getFullYear()
        const num = String((dialogTipo === "entrada" ? entrada.length : salida.length) + 1).padStart(4, "0")
        await crearCorrespondencia({
          hojaRuta: `HR-${year}-${num}`,
          asunto: fd.get("asunto") as string,
          remitente: fd.get("remitente") as string,
          destinatario: (fd.get("destinatario") as string) || undefined,
          tipo: dialogTipo,
          observaciones: (fd.get("observaciones") as string) || undefined,
        })
        toast.success("Hoja de ruta creada")
        setDialogOpen(false)
      } catch {
        toast.error("Error al crear")
      }
    })
  }

  async function handleMarcarLeido(id: string) {
    startTransition(async () => {
      await actualizarCorrespondencia(id, { leido: true })
      toast.success("Marcado como leído")
    })
  }

  async function handleEliminar(id: string) {
    startTransition(async () => {
      await eliminarCorrespondencia(id)
      toast.success("Eliminado")
    })
  }

  const bandejaData = entrada.map(c => ({
    ...c,
    fecha: c.createdAt.toLocaleDateString("es-BO"),
  }))

  const enviadosData = salida.map(c => ({
    ...c,
    fecha: c.createdAt.toLocaleDateString("es-BO"),
  }))

  return (
    <>
      <ModuleHeader title="Correspondencia" />

      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex items-center gap-2 border-b border-border/40 pb-0">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                tab === t.key
                  ? "border-[#FFB300] text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
              {t.key === "bandeja" && stats.sinLeer > 0 && (
                <span className="ml-1 rounded-full bg-[#FFB300]/20 px-2 py-0.5 text-xs font-bold text-[#FFB300]">
                  {stats.sinLeer}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              {tab === "bandeja" && "Bandeja de entrada"}
              {tab === "enviados" && "Correspondencia enviada"}
              {tab === "reportes" && "Reportes de correspondencia"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {tab === "bandeja" && "Hojas de ruta recibidas"}
              {tab === "enviados" && "Hojas de ruta enviadas a otras unidades"}
              {tab === "reportes" && "Estadísticas y métricas"}
            </p>
          </div>
          {tab !== "reportes" && (
            <Button
              className="bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000] border-0 font-semibold shadow-md shadow-[#FFB300]/20"
              onClick={() => handleNueva(tab === "bandeja" ? "entrada" : "salida")}
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              Nueva hoja de ruta
            </Button>
          )}
        </div>

        {tab === "bandeja" && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <Card className="border-border/40"><CardContent className="p-4"><div className="text-2xl font-bold">{stats.entrada}</div><div className="text-xs text-muted-foreground">Recibidas</div></CardContent></Card>
              <Card className="border-border/40"><CardContent className="p-4"><div className="text-2xl font-bold text-[#FFB300]">{stats.sinLeer}</div><div className="text-xs text-muted-foreground">Sin leer</div></CardContent></Card>
              <Card className="border-border/40"><CardContent className="p-4"><div className="text-2xl font-bold">{stats.pendientes}</div><div className="text-xs text-muted-foreground">Pendientes</div></CardContent></Card>
              <Card className="border-border/40"><CardContent className="p-4"><div className="text-2xl font-bold">{stats.atendidas}</div><div className="text-xs text-muted-foreground">Atendidas</div></CardContent></Card>
            </div>
            <DataTable
              data={bandejaData}
              searchKey="asunto"
              searchPlaceholder="Buscar por asunto..."
              columns={[
                { key: "hojaRuta", label: "Hoja de ruta", className: "w-36", render: (row) => (
                  <div className="flex items-center gap-2">
                    {row.leido ? <MailOpenIcon className="h-4 w-4 text-muted-foreground" /> : <MailIcon className="h-4 w-4 text-[#FFB300]" />}
                    <span className={`text-xs font-mono ${!row.leido ? "font-bold" : ""}`}>{row.hojaRuta}</span>
                  </div>
                )},
                { key: "asunto", label: "Asunto", render: (row) => <span className={!row.leido ? "font-semibold" : ""}>{row.asunto}</span> },
                { key: "remitente", label: "Remitente" },
                { key: "fecha", label: "Fecha" },
                { key: "estado", label: "Estado", render: (row) => <StatusBadge status={row.estado as "pendiente" | "activo"} /> },
              ]}
              actions={(row) => (
                <div className="flex items-center justify-end gap-2">
                  {!row.leido && (
                    <button type="button" title="Marcar leído" disabled={isPending} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-card/80 text-muted-foreground shadow-sm transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 hover:shadow-md dark:hover:border-blue-500/30 dark:hover:bg-blue-500/10 dark:hover:text-blue-400 active:scale-95 disabled:pointer-events-none disabled:opacity-50" onClick={() => handleMarcarLeido(row.id)}>
                      <EyeIcon className="h-4 w-4" />
                    </button>
                  )}
                  <button type="button" title="Eliminar" disabled={isPending} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-card/80 text-muted-foreground shadow-sm transition-all duration-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 hover:shadow-md dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-400 active:scale-95 disabled:pointer-events-none disabled:opacity-50" onClick={() => handleEliminar(row.id)}>
                    <Trash2Icon className="h-4 w-4" />
                  </button>
                </div>
              )}
            />
          </>
        )}

        {tab === "enviados" && (
          <DataTable
            data={enviadosData}
            searchKey="asunto"
            searchPlaceholder="Buscar enviado..."
            columns={[
              { key: "hojaRuta", label: "Hoja de ruta", render: (row) => <span className="text-xs font-mono">{row.hojaRuta}</span> },
              { key: "asunto", label: "Asunto", render: (row) => <span className="font-medium">{row.asunto}</span> },
              { key: "destinatario", label: "Destinatario" },
              { key: "fecha", label: "Fecha" },
              { key: "estado", label: "Estado", render: (row) => <StatusBadge status={row.estado as "pendiente" | "activo"} /> },
            ]}
            actions={(row) => (
              <div className="flex items-center justify-end gap-2">
                <button type="button" title="Eliminar" disabled={isPending} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-card/80 text-muted-foreground shadow-sm transition-all duration-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 hover:shadow-md dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-400 active:scale-95 disabled:pointer-events-none disabled:opacity-50" onClick={() => handleEliminar(row.id)}>
                  <Trash2Icon className="h-4 w-4" />
                </button>
              </div>
            )}
          />
        )}

        {tab === "reportes" && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card className="border-border/40">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Resumen general</h3>
                <div className="space-y-3">
                  {[
                    { label: "Total", value: stats.total, color: "bg-[#FFB300]" },
                    { label: "Recibidas", value: stats.entrada, color: "bg-blue-500" },
                    { label: "Enviadas", value: stats.salida, color: "bg-[#FF8800]" },
                    { label: "Pendientes", value: stats.pendientes, color: "bg-yellow-400" },
                    { label: "Atendidas", value: stats.atendidas, color: "bg-green-500" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full ${item.color}`} />
                      <span className="text-sm flex-1">{item.label}</span>
                      <span className="text-sm font-bold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="p-0 gap-0 overflow-hidden rounded-2xl">
          <div className="flex h-1.5 w-full"><div className="flex-1 bg-[#C41E3A]"/><div className="flex-1 bg-[#FFB300]"/><div className="flex-1 bg-[#2E7D32]"/></div>
          <div className="p-6"><DialogHeader>
            <DialogTitle>Nueva hoja de ruta ({dialogTipo === "entrada" ? "Entrada" : "Salida"})</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="asunto">Asunto *</Label>
              <Input id="asunto" name="asunto" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="remitente">Remitente *</Label>
              <Input id="remitente" name="remitente" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destinatario">Destinatario</Label>
              <Input id="destinatario" name="destinatario" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Input id="observaciones" name="observaciones" />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isPending} className="bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000]">
                {isPending ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </form></div>
        </DialogContent>
      </Dialog>
    </>
  )
}
