"use client"

import { useState, useTransition } from "react"
import { PlusIcon, PencilIcon, Trash2Icon } from "lucide-react"
import toast from "react-hot-toast"

import { ModuleHeader } from "@/components/dashboard/module-header"
import { DataTable } from "@/components/dashboard/data-table"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { crearArchivo, actualizarArchivo, eliminarArchivo } from "@/actions/archivo"

interface Props {
  archivos: Array<{ id: string; nombre: string; tipo: string; categoria: string; ubicacion: string | null; descripcion: string | null; estado: string; createdAt: Date }>
}

export function ArchivoModule({ archivos }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<Props["archivos"][number] | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        if (editItem) {
          await actualizarArchivo(editItem.id, {
            nombre: fd.get("nombre") as string,
            tipo: fd.get("tipo") as string,
            categoria: fd.get("categoria") as string,
            ubicacion: fd.get("ubicacion") as string,
            descripcion: (fd.get("descripcion") as string) || undefined,
            estado: fd.get("estado") as string,
          })
          toast.success("Archivo actualizado")
        } else {
          await crearArchivo({
            nombre: fd.get("nombre") as string,
            tipo: fd.get("tipo") as string,
            categoria: fd.get("categoria") as string,
            ubicacion: fd.get("ubicacion") as string,
            descripcion: (fd.get("descripcion") as string) || undefined,
            estado: (fd.get("estado") as string) || "activo",
          })
          toast.success("Archivo registrado")
        }
        setDialogOpen(false); setEditItem(null)
      } catch { toast.error("Error al guardar") }
    })
  }

  const activos = archivos.filter(a => a.estado === "activo").length

  return (
    <>
      <ModuleHeader title="Archivo" />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Gestión de archivo</h2>
            <p className="text-sm text-muted-foreground">Archivos históricos y documentación institucional</p>
          </div>
          <Button className="bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000] border-0 font-semibold shadow-md shadow-[#FFB300]/20"
            onClick={() => { setEditItem(null); setDialogOpen(true) }}>
            <PlusIcon className="mr-2 h-4 w-4" />Nuevo archivo
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="border-border/40"><CardContent className="p-4"><div className="text-2xl font-bold">{archivos.length}</div><div className="text-xs text-muted-foreground">Total archivos</div></CardContent></Card>
          <Card className="border-border/40"><CardContent className="p-4"><div className="text-2xl font-bold text-green-600">{activos}</div><div className="text-xs text-muted-foreground">Activos</div></CardContent></Card>
          <Card className="border-border/40"><CardContent className="p-4"><div className="text-2xl font-bold text-amber-500">{archivos.length - activos}</div><div className="text-xs text-muted-foreground">Inactivos</div></CardContent></Card>
        </div>

        <DataTable data={archivos.map(a => ({ ...a, fecha: a.createdAt.toLocaleDateString("es-BO") }))} searchKey="nombre" searchPlaceholder="Buscar archivo..."
          columns={[
            { key: "nombre", label: "Nombre", render: (row) => <span className="font-medium">{row.nombre}</span> },
            { key: "tipo", label: "Tipo" },
            { key: "categoria", label: "Categoría" },
            { key: "ubicacion", label: "Ubicación" },
            { key: "fecha", label: "Fecha" },
            { key: "estado", label: "Estado", render: (row) => <StatusBadge status={row.estado as "activo" | "inactivo"} /> },
          ]}
          actions={(row) => (
            <div className="flex items-center justify-end gap-2">
              <button type="button" title="Editar" className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-card/80 text-muted-foreground shadow-sm transition-all duration-200 hover:border-[#FFB300]/40 hover:bg-[#FFB300]/10 hover:text-[#FF8800] hover:shadow-md active:scale-95" onClick={() => { setEditItem(row as unknown as Props["archivos"][number]); setDialogOpen(true) }}><PencilIcon className="h-4 w-4" /></button>
              <button type="button" title="Eliminar" disabled={isPending} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-card/80 text-muted-foreground shadow-sm transition-all duration-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 hover:shadow-md dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-400 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
                onClick={() => startTransition(async () => { await eliminarArchivo(row.id); toast.success("Eliminado") })}><Trash2Icon className="h-4 w-4" /></button>
            </div>
          )}
        />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="p-0 gap-0 overflow-hidden rounded-2xl">
          <div className="flex h-1.5 w-full"><div className="flex-1 bg-[#C41E3A]"/><div className="flex-1 bg-[#FFB300]"/><div className="flex-1 bg-[#2E7D32]"/></div>
          <div className="p-6"><DialogHeader><DialogTitle>{editItem ? "Editar archivo" : "Registrar archivo"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label>Nombre *</Label><Input name="nombre" required defaultValue={editItem?.nombre} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Tipo *</Label>
                <select name="tipo" required className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue={editItem?.tipo ?? ""}>
                  <option value="">Seleccionar</option><option value="documento">Documento</option><option value="expediente">Expediente</option><option value="legajo">Legajo</option><option value="otro">Otro</option>
                </select>
              </div>
              <div className="space-y-2"><Label>Categoría *</Label>
                <select name="categoria" required className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue={editItem?.categoria ?? ""}>
                  <option value="">Seleccionar</option><option value="administrativo">Administrativo</option><option value="legal">Legal</option><option value="financiero">Financiero</option><option value="historico">Histórico</option><option value="otro">Otro</option>
                </select>
              </div>
            </div>
            <div className="space-y-2"><Label>Ubicación *</Label><Input name="ubicacion" required defaultValue={editItem?.ubicacion ?? ""} placeholder="Ej: Estante A - Fila 3" /></div>
            <div className="space-y-2"><Label>Descripción</Label><Input name="descripcion" defaultValue={editItem?.descripcion ?? ""} /></div>
            <div className="space-y-2"><Label>Estado</Label>
              <select name="estado" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue={editItem?.estado ?? "activo"}>
                <option value="activo">Activo</option><option value="inactivo">Inactivo</option>
              </select>
            </div>
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
