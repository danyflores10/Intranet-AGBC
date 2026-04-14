"use client"

import { useState, useTransition } from "react"
import { PlusIcon, PencilIcon, Trash2Icon, PackageIcon, TruckIcon, WarehouseIcon, EyeIcon } from "lucide-react"
import toast from "react-hot-toast"

import { ModuleHeader } from "@/components/dashboard/module-header"
import { DataTable } from "@/components/dashboard/data-table"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  crearItemInventario, actualizarItemInventario, eliminarItemInventario,
  crearSolicitud, actualizarSolicitud, eliminarSolicitud,
  crearProveedor, actualizarProveedor, eliminarProveedor,
} from "@/actions/logistica"

type Tab = "inventario" | "solicitudes" | "proveedores"

interface Props {
  inventario: Array<{ id: string; codigo: string; item: string; categoria: string; stock: number; stockMinimo: number; unidad: string; estado: string }>
  solicitudes: Array<{ id: string; numero: string; solicitante: string; items: string; estado: string; createdAt: Date }>
  proveedores: Array<{ id: string; nombre: string; rubro: string; nit: string; telefono: string | null; contacto: string | null; estado: string }>
}

export function LogisticaModule({ inventario, solicitudes, proveedores }: Props) {
  const [tab, setTab] = useState<Tab>("inventario")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<Record<string, unknown> | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleInvSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        if (editItem) {
          await actualizarItemInventario(editItem.id as string, {
            item: fd.get("item") as string,
            categoria: fd.get("categoria") as string,
            stock: Number(fd.get("stock")),
            stockMinimo: Number(fd.get("stockMinimo")),
            unidad: fd.get("unidad") as string,
          })
          toast.success("Ítem actualizado")
        } else {
          const num = String(inventario.length + 1).padStart(3, "0")
          await crearItemInventario({
            codigo: `INV-${num}`,
            item: fd.get("item") as string,
            categoria: fd.get("categoria") as string,
            stock: Number(fd.get("stock")),
            stockMinimo: Number(fd.get("stockMinimo")),
            unidad: (fd.get("unidad") as string) || "Unidad",
          })
          toast.success("Ítem creado")
        }
        setDialogOpen(false); setEditItem(null)
      } catch { toast.error("Error al guardar") }
    })
  }

  async function handleSolSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        if (editItem) {
          await actualizarSolicitud(editItem.id as string, {
            items: fd.get("items") as string,
            estado: fd.get("estado") as string,
          })
          toast.success("Solicitud actualizada")
        } else {
          const year = new Date().getFullYear()
          const num = String(solicitudes.length + 1).padStart(3, "0")
          await crearSolicitud({
            numero: `SOL-${year}-${num}`,
            solicitante: fd.get("solicitante") as string,
            items: fd.get("items") as string,
          })
          toast.success("Solicitud creada")
        }
        setDialogOpen(false); setEditItem(null)
      } catch { toast.error("Error al guardar") }
    })
  }

  async function handleProvSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        if (editItem) {
          await actualizarProveedor(editItem.id as string, {
            nombre: fd.get("nombre") as string,
            rubro: fd.get("rubro") as string,
            nit: fd.get("nit") as string,
            telefono: (fd.get("telefono") as string) || undefined,
            contacto: (fd.get("contacto") as string) || undefined,
          })
          toast.success("Proveedor actualizado")
        } else {
          await crearProveedor({
            nombre: fd.get("nombre") as string,
            rubro: fd.get("rubro") as string,
            nit: fd.get("nit") as string,
            telefono: (fd.get("telefono") as string) || undefined,
            contacto: (fd.get("contacto") as string) || undefined,
          })
          toast.success("Proveedor creado")
        }
        setDialogOpen(false); setEditItem(null)
      } catch { toast.error("Error al guardar") }
    })
  }

  const tabs = [
    { key: "inventario" as Tab, label: "Inventario", icon: PackageIcon },
    { key: "solicitudes" as Tab, label: "Solicitudes", icon: TruckIcon },
    { key: "proveedores" as Tab, label: "Proveedores", icon: WarehouseIcon },
  ]

  return (
    <>
      <ModuleHeader title="Logística" />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex items-center gap-2 border-b border-border/40 pb-0">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${tab === t.key ? "border-[#FFB300] text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              <t.icon className="h-4 w-4" />{t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">{tab === "inventario" ? "Control de inventario" : tab === "solicitudes" ? "Solicitudes de material" : "Proveedores"}</h2>
            <p className="text-sm text-muted-foreground">{tab === "inventario" ? "Gestión de existencias" : tab === "solicitudes" ? "Requerimientos de material" : "Directorio de proveedores"}</p>
          </div>
          <Button className="bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000] border-0 font-semibold shadow-md shadow-[#FFB300]/20"
            onClick={() => { setEditItem(null); setDialogOpen(true) }}>
            <PlusIcon className="mr-2 h-4 w-4" />Nuevo
          </Button>
        </div>

        {tab === "inventario" && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Card className="border-border/40"><CardContent className="p-4"><div className="text-2xl font-bold">{inventario.length}</div><div className="text-xs text-muted-foreground">Ítems registrados</div></CardContent></Card>
              <Card className="border-border/40"><CardContent className="p-4"><div className="text-2xl font-bold text-green-600">{inventario.filter(i => i.stock >= i.stockMinimo).length}</div><div className="text-xs text-muted-foreground">Stock OK</div></CardContent></Card>
              <Card className="border-border/40"><CardContent className="p-4"><div className="text-2xl font-bold text-red-500">{inventario.filter(i => i.stock < i.stockMinimo).length}</div><div className="text-xs text-muted-foreground">Stock bajo</div></CardContent></Card>
            </div>
            <DataTable data={inventario} searchKey="item" searchPlaceholder="Buscar ítem..."
              columns={[
                { key: "codigo", label: "Código", className: "w-24", render: (row) => <span className="font-mono text-xs">{row.codigo}</span> },
                { key: "item", label: "Ítem", render: (row) => <span className="font-medium">{row.item}</span> },
                { key: "categoria", label: "Categoría" },
                { key: "stock", label: "Stock", className: "text-center", render: (row) => <span className={`font-bold ${row.stock < row.stockMinimo ? "text-red-500" : "text-green-600"}`}>{row.stock}</span> },
                { key: "stockMinimo", label: "Mínimo", className: "text-center" },
              ]}
              actions={(row) => (
                <div className="flex items-center justify-end gap-2">
                  <button type="button" title="Editar" className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-card/80 text-muted-foreground shadow-sm transition-all duration-200 hover:border-[#FFB300]/40 hover:bg-[#FFB300]/10 hover:text-[#FF8800] hover:shadow-md active:scale-95" onClick={() => { setEditItem(row as unknown as Record<string, unknown>); setDialogOpen(true) }}><PencilIcon className="h-4 w-4" /></button>
                  <button type="button" title="Eliminar" disabled={isPending} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-card/80 text-muted-foreground shadow-sm transition-all duration-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 hover:shadow-md dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-400 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
                    onClick={() => startTransition(async () => { await eliminarItemInventario(row.id); toast.success("Eliminado") })}><Trash2Icon className="h-4 w-4" /></button>
                </div>
              )}
            />
          </>
        )}

        {tab === "solicitudes" && (
          <DataTable data={solicitudes.map(s => ({ ...s, fecha: s.createdAt.toLocaleDateString("es-BO") }))} searchKey="solicitante" searchPlaceholder="Buscar solicitud..."
            columns={[
              { key: "numero", label: "N° Solicitud", render: (row) => <span className="font-mono text-xs">{row.numero}</span> },
              { key: "solicitante", label: "Solicitante", render: (row) => <span className="font-medium">{row.solicitante}</span> },
              { key: "items", label: "Ítems solicitados" },
              { key: "fecha", label: "Fecha" },
              { key: "estado", label: "Estado", render: (row) => <StatusBadge status={row.estado as "pendiente" | "activo" | "inactivo"} /> },
            ]}
            actions={(row) => (
              <div className="flex items-center justify-end gap-2">
                <button type="button" title="Editar" className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-card/80 text-muted-foreground shadow-sm transition-all duration-200 hover:border-[#FFB300]/40 hover:bg-[#FFB300]/10 hover:text-[#FF8800] hover:shadow-md active:scale-95" onClick={() => { setEditItem(row as unknown as Record<string, unknown>); setDialogOpen(true) }}><PencilIcon className="h-4 w-4" /></button>
                <button type="button" title="Eliminar" disabled={isPending} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-card/80 text-muted-foreground shadow-sm transition-all duration-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 hover:shadow-md dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-400 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => startTransition(async () => { await eliminarSolicitud(row.id); toast.success("Eliminada") })}><Trash2Icon className="h-4 w-4" /></button>
              </div>
            )}
          />
        )}

        {tab === "proveedores" && (
          <DataTable data={proveedores} searchKey="nombre" searchPlaceholder="Buscar proveedor..."
            columns={[
              { key: "nombre", label: "Proveedor", render: (row) => <span className="font-medium">{row.nombre}</span> },
              { key: "rubro", label: "Rubro" },
              { key: "nit", label: "NIT", render: (row) => <span className="font-mono text-xs">{row.nit}</span> },
              { key: "telefono", label: "Teléfono" },
              { key: "contacto", label: "Contacto" },
              { key: "estado", label: "Estado", render: (row) => <StatusBadge status={row.estado as "activo" | "inactivo"} /> },
            ]}
            actions={(row) => (
              <div className="flex items-center justify-end gap-2">
                <button type="button" title="Editar" className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-card/80 text-muted-foreground shadow-sm transition-all duration-200 hover:border-[#FFB300]/40 hover:bg-[#FFB300]/10 hover:text-[#FF8800] hover:shadow-md active:scale-95" onClick={() => { setEditItem(row as unknown as Record<string, unknown>); setDialogOpen(true) }}><PencilIcon className="h-4 w-4" /></button>
                <button type="button" title="Eliminar" disabled={isPending} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-card/80 text-muted-foreground shadow-sm transition-all duration-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 hover:shadow-md dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-400 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => startTransition(async () => { await eliminarProveedor(row.id); toast.success("Eliminado") })}><Trash2Icon className="h-4 w-4" /></button>
              </div>
            )}
          />
        )}
      </div>

      {/* Dialogs */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="p-0 gap-0 overflow-hidden rounded-2xl">
          <div className="flex h-1.5 w-full"><div className="flex-1 bg-[#C41E3A]"/><div className="flex-1 bg-[#FFB300]"/><div className="flex-1 bg-[#2E7D32]"/></div>
          <div className="p-6"><DialogHeader><DialogTitle>
            {tab === "inventario" ? (editItem ? "Editar ítem" : "Nuevo ítem") :
             tab === "solicitudes" ? (editItem ? "Editar solicitud" : "Nueva solicitud") :
             (editItem ? "Editar proveedor" : "Nuevo proveedor")}
          </DialogTitle></DialogHeader>

          {tab === "inventario" && (
            <form onSubmit={handleInvSubmit} className="space-y-4">
              <div className="space-y-2"><Label>Ítem *</Label><Input name="item" required defaultValue={editItem?.item as string} /></div>
              <div className="space-y-2"><Label>Categoría *</Label><Input name="categoria" required defaultValue={editItem?.categoria as string} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Stock *</Label><Input name="stock" type="number" required defaultValue={editItem?.stock as number ?? 0} /></div>
                <div className="space-y-2"><Label>Stock mínimo *</Label><Input name="stockMinimo" type="number" required defaultValue={editItem?.stockMinimo as number ?? 0} /></div>
              </div>
              <div className="space-y-2"><Label>Unidad</Label><Input name="unidad" defaultValue={(editItem?.unidad as string) ?? "Unidad"} /></div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={isPending} className="bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000]">{isPending ? "Guardando..." : "Guardar"}</Button>
              </div>
            </form>
          )}

          {tab === "solicitudes" && (
            <form onSubmit={handleSolSubmit} className="space-y-4">
              {!editItem && <div className="space-y-2"><Label>Solicitante *</Label><Input name="solicitante" required /></div>}
              <div className="space-y-2"><Label>Ítems solicitados *</Label><Input name="items" required defaultValue={editItem?.items as string} /></div>
              {editItem && <div className="space-y-2"><Label>Estado</Label>
                <select name="estado" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue={editItem.estado as string}>
                  <option value="pendiente">Pendiente</option><option value="activo">Aprobada</option><option value="inactivo">Rechazada</option>
                </select>
              </div>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={isPending} className="bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000]">{isPending ? "Guardando..." : "Guardar"}</Button>
              </div>
            </form>
          )}

          {tab === "proveedores" && (
            <form onSubmit={handleProvSubmit} className="space-y-4">
              <div className="space-y-2"><Label>Nombre *</Label><Input name="nombre" required defaultValue={editItem?.nombre as string} /></div>
              <div className="space-y-2"><Label>Rubro *</Label><Input name="rubro" required defaultValue={editItem?.rubro as string} /></div>
              <div className="space-y-2"><Label>NIT *</Label><Input name="nit" required defaultValue={editItem?.nit as string} /></div>
              <div className="space-y-2"><Label>Teléfono</Label><Input name="telefono" defaultValue={editItem?.telefono as string} /></div>
              <div className="space-y-2"><Label>Contacto</Label><Input name="contacto" defaultValue={editItem?.contacto as string} /></div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={isPending} className="bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000]">{isPending ? "Guardando..." : "Guardar"}</Button>
              </div>
            </form>
          )}</div>
        </DialogContent>
      </Dialog>
    </>
  )
}
