"use client"

import { useState, useTransition } from "react"
import { PlusIcon, PencilIcon, Trash2Icon, ClipboardListIcon } from "lucide-react"
import toast from "react-hot-toast"

import { ModuleHeader } from "@/components/dashboard/module-header"
import { DataTable } from "@/components/dashboard/data-table"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { crearTramite, actualizarTramite, eliminarTramite } from "@/actions/tramites"

interface Props {
  tramites: Array<{
    id: string; codigo: string; solicitante: string; tipo: string
    estado: string; prioridad: string; descripcion: string | null; createdAt: Date
  }>
}

export function TramitesModule({ tramites }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<Props["tramites"][0] | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        if (editItem) {
          await actualizarTramite(editItem.id, {
            solicitante: fd.get("solicitante") as string,
            tipo: fd.get("tipo") as string,
            prioridad: fd.get("prioridad") as string,
            estado: fd.get("estado") as string,
            descripcion: (fd.get("descripcion") as string) || undefined,
          })
          toast.success("Trámite actualizado")
        } else {
          const year = new Date().getFullYear()
          const num = String(tramites.length + 1).padStart(4, "0")
          await crearTramite({
            codigo: `TR-${year}-${num}`,
            solicitante: fd.get("solicitante") as string,
            tipo: fd.get("tipo") as string,
            prioridad: (fd.get("prioridad") as string) || "media",
            descripcion: (fd.get("descripcion") as string) || undefined,
          })
          toast.success("Trámite creado")
        }
        setDialogOpen(false)
        setEditItem(null)
      } catch { toast.error("Error al guardar") }
    })
  }

  const pendientes = tramites.filter(t => t.estado === "pendiente").length
  const aprobados = tramites.filter(t => t.estado === "activo").length
  const rechazados = tramites.filter(t => t.estado === "inactivo").length

  return (
    <>
      <ModuleHeader title="Trámites" />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Gestión de trámites</h2>
            <p className="text-sm text-muted-foreground">Seguimiento y administración de trámites internos</p>
          </div>
          <Button className="bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000] border-0 font-semibold shadow-md shadow-[#FFB300]/20"
            onClick={() => { setEditItem(null); setDialogOpen(true) }}>
            <PlusIcon className="mr-2 h-4 w-4" />Nuevo trámite
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Card className="border-border/40"><CardContent className="p-4"><div className="flex items-center gap-3"><ClipboardListIcon className="h-5 w-5 text-[#FFB300]" /><div><div className="text-2xl font-bold">{tramites.length}</div><div className="text-xs text-muted-foreground">Total trámites</div></div></div></CardContent></Card>
          <Card className="border-border/40"><CardContent className="p-4"><div className="text-2xl font-bold text-[#FFB300]">{pendientes}</div><div className="text-xs text-muted-foreground">Pendientes</div></CardContent></Card>
          <Card className="border-border/40"><CardContent className="p-4"><div className="text-2xl font-bold text-green-600">{aprobados}</div><div className="text-xs text-muted-foreground">Aprobados</div></CardContent></Card>
          <Card className="border-border/40"><CardContent className="p-4"><div className="text-2xl font-bold text-red-500">{rechazados}</div><div className="text-xs text-muted-foreground">Rechazados</div></CardContent></Card>
        </div>

        <DataTable data={tramites.map(t => ({ ...t, fecha: t.createdAt.toLocaleDateString("es-BO") }))} searchKey="solicitante" searchPlaceholder="Buscar por solicitante..."
          columns={[
            { key: "codigo", label: "Código", className: "w-36", render: (row) => <span className="font-mono text-xs">{row.codigo}</span> },
            { key: "solicitante", label: "Solicitante", render: (row) => <span className="font-medium">{row.solicitante}</span> },
            { key: "tipo", label: "Tipo de trámite" },
            { key: "fecha", label: "Fecha" },
            { key: "prioridad", label: "Prioridad", render: (row) => <StatusBadge status={row.prioridad as "alta" | "media" | "baja"} /> },
            { key: "estado", label: "Estado", render: (row) => <StatusBadge status={row.estado as "pendiente" | "activo" | "inactivo"} /> },
          ]}
          actions={(row) => (
            <div className="flex items-center justify-end gap-2">
              <button type="button" title="Editar" className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-card/80 text-muted-foreground shadow-sm transition-all duration-200 hover:border-[#FFB300]/40 hover:bg-[#FFB300]/10 hover:text-[#FF8800] hover:shadow-md active:scale-95" onClick={() => { setEditItem(row); setDialogOpen(true) }}><PencilIcon className="h-4 w-4" /></button>
              <button type="button" title="Eliminar" disabled={isPending} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-card/80 text-muted-foreground shadow-sm transition-all duration-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 hover:shadow-md dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-400 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
                onClick={() => startTransition(async () => { await eliminarTramite(row.id); toast.success("Eliminado") })}><Trash2Icon className="h-4 w-4" /></button>
            </div>
          )}
        />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="p-0 gap-0 overflow-hidden rounded-2xl">
          <div className="flex h-1.5 w-full"><div className="flex-1 bg-[#C41E3A]"/><div className="flex-1 bg-[#FFB300]"/><div className="flex-1 bg-[#2E7D32]"/></div>
          <div className="p-6"><DialogHeader><DialogTitle>{editItem ? "Editar trámite" : "Nuevo trámite"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label>Solicitante *</Label><Input name="solicitante" required defaultValue={editItem?.solicitante} /></div>
            <div className="space-y-2"><Label>Tipo de trámite *</Label><Input name="tipo" required defaultValue={editItem?.tipo} /></div>
            <div className="space-y-2"><Label>Prioridad</Label>
              <select name="prioridad" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue={editItem?.prioridad ?? "media"}>
                <option value="baja">Baja</option><option value="media">Media</option><option value="alta">Alta</option>
              </select>
            </div>
            {editItem && <div className="space-y-2"><Label>Estado</Label>
              <select name="estado" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue={editItem.estado}>
                <option value="pendiente">Pendiente</option><option value="activo">Aprobado</option><option value="inactivo">Rechazado</option>
              </select>
            </div>}
            <div className="space-y-2"><Label>Descripción</Label><Input name="descripcion" defaultValue={editItem?.descripcion ?? ""} /></div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isPending} className="bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000]">{isPending ? "Guardando..." : "Guardar"}</Button>
            </div>
          </form></div>
        </DialogContent>
      </Dialog>
    </>
  )
}
