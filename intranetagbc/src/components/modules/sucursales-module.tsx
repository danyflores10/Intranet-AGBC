"use client"

import { useState, useRef, useTransition } from "react"
import {
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  MapPinIcon,
  PhoneIcon,
  ClockIcon,
  UploadIcon,
  XIcon,
  BuildingIcon,
  ExternalLinkIcon,
  SearchIcon,
} from "lucide-react"
import toast from "react-hot-toast"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  crearSucursal,
  actualizarSucursal,
  eliminarSucursal,
} from "@/actions/sucursales"

interface SucursalRow {
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
  activo: boolean
}

interface Props {
  sucursales: SucursalRow[]
}

const DEPARTAMENTOS_BOLIVIA = [
  { depto: "Pando", capital: "Cobija", svgId: "BON", pinX: "21", pinY: "13", color: "#4CAF50" },
  { depto: "La Paz", capital: "La Paz", svgId: "BOL", pinX: "16.7", pinY: "32", color: "#1976D2" },
  { depto: "El Beni", capital: "Trinidad", svgId: "BOB", pinX: "38", pinY: "27", color: "#FF9800" },
  { depto: "Cochabamba", capital: "Cochabamba", svgId: "BOC", pinX: "30.8", pinY: "44.8", color: "#9C27B0" },
  { depto: "Oruro", capital: "Oruro", svgId: "BOO", pinX: "18.8", pinY: "52", color: "#F44336" },
  { depto: "Santa Cruz", capital: "Santa Cruz de la Sierra", svgId: "BOS", pinX: "50", pinY: "42.4", color: "#00ACC1" },
  { depto: "Potosí", capital: "Potosí", svgId: "BOP", pinX: "24.2", pinY: "63.6", color: "#795548" },
  { depto: "Chuquisaca", capital: "Sucre", svgId: "BOH", pinX: "38", pinY: "65", color: "#E91E63" },
  { depto: "Tarija", capital: "Tarija", svgId: "BOT", pinX: "37", pinY: "72.5", color: "#607D8B" },
]

export function SucursalesModule({ sucursales: sucursalesInit }: Props) {
  const [items, setItems] = useState(sucursalesInit)
  const [busqueda, setBusqueda] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editando, setEditando] = useState<SucursalRow | null>(null)
  const [eliminandoId, setEliminandoId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [fotoUrl, setFotoUrl] = useState<string | null>(null)
  const [uploadingFoto, setUploadingFoto] = useState(false)

  // Formulario
  const [form, setForm] = useState({
    departamento: "",
    capital: "",
    nombre: "",
    direccion: "",
    telefono: "",
    horario: "",
    googleMaps: "",
    color: "#FFB300",
    svgId: "",
    pinX: "",
    pinY: "",
  })

  const filtrados = items.filter(
    (s) =>
      s.departamento.toLowerCase().includes(busqueda.toLowerCase()) ||
      s.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      s.capital.toLowerCase().includes(busqueda.toLowerCase()),
  )

  function openCreate() {
    setEditando(null)
    setForm({
      departamento: "",
      capital: "",
      nombre: "",
      direccion: "",
      telefono: "",
      horario: "Lun - Vie: 8:00 - 16:00",
      googleMaps: "",
      color: "#FFB300",
      svgId: "",
      pinX: "",
      pinY: "",
    })
    setFotoPreview(null)
    setFotoUrl(null)
    setDialogOpen(true)
  }

  function openEdit(row: SucursalRow) {
    setEditando(row)
    setForm({
      departamento: row.departamento,
      capital: row.capital,
      nombre: row.nombre,
      direccion: row.direccion,
      telefono: row.telefono ?? "",
      horario: row.horario ?? "",
      googleMaps: row.googleMaps ?? "",
      color: row.color ?? "#FFB300",
      svgId: row.svgId ?? "",
      pinX: row.pinX ?? "",
      pinY: row.pinY ?? "",
    })
    setFotoPreview(row.foto)
    setFotoUrl(row.foto)
    setDialogOpen(true)
  }

  function handleDeptoChange(depto: string) {
    const info = DEPARTAMENTOS_BOLIVIA.find((d) => d.depto === depto)
    if (info) {
      setForm((f) => ({
        ...f,
        departamento: info.depto,
        capital: info.capital,
        svgId: info.svgId,
        pinX: info.pinX,
        pinY: info.pinY,
        color: info.color,
        nombre: `Oficina Postal ${info.capital}`,
      }))
    } else {
      setForm((f) => ({ ...f, departamento: depto }))
    }
  }

  async function handleFotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingFoto(true)
    try {
      const fd = new FormData()
      fd.append("archivo", file)
      const res = await fetch("/api/upload/sucursal", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setFotoUrl(data.url)
      setFotoPreview(data.url)
      toast.success("Foto subida")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al subir foto")
    } finally {
      setUploadingFoto(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  function handleSubmit() {
    if (!form.departamento || !form.nombre || !form.direccion) {
      toast.error("Complete los campos obligatorios")
      return
    }
    startTransition(async () => {
      try {
        if (editando) {
          const updated = await actualizarSucursal(editando.id, {
            ...form,
            telefono: form.telefono || null,
            horario: form.horario || null,
            googleMaps: form.googleMaps || null,
            foto: fotoUrl,
          })
          if (updated) {
            setItems((prev) => prev.map((s) => (s.id === editando.id ? updated : s)))
            toast.success("Sucursal actualizada")
          }
        } else {
          const created = await crearSucursal({
            ...form,
            foto: fotoUrl ?? undefined,
          })
          if (created) {
            setItems((prev) => [...prev, created])
            toast.success("Sucursal creada")
          }
        }
        setDialogOpen(false)
      } catch {
        toast.error("Error al guardar")
      }
    })
  }

  function confirmDelete(id: string) {
    setEliminandoId(id)
    setDeleteDialogOpen(true)
  }

  function handleDelete() {
    if (!eliminandoId) return
    startTransition(async () => {
      try {
        await eliminarSucursal(eliminandoId)
        setItems((prev) => prev.filter((s) => s.id !== eliminandoId))
        toast.success("Sucursal eliminada")
        setDeleteDialogOpen(false)
      } catch {
        toast.error("Error al eliminar")
      }
    })
  }

  return (
    <>
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Administración de Sucursales</h2>
            <p className="text-sm text-muted-foreground">Gestiona las oficinas regionales mostradas en el mapa</p>
          </div>
          <Button
            onClick={openCreate}
            className="bg-gradient-to-r from-[#C41E3A] to-[#a01830] text-white font-semibold shadow-md shadow-[#C41E3A]/20 hover:shadow-lg"
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Nueva sucursal
          </Button>
        </div>

        {/* Búsqueda */}
        <div className="relative max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar sucursal..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Grid de tarjetas */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((s) => (
            <Card key={s.id} className="group overflow-hidden border-border/40 transition-all hover:shadow-lg hover:border-[#FFB300]/30">
              {/* Foto o placeholder */}
              {s.foto ? (
                <div className="relative aspect-video w-full overflow-hidden bg-muted/30 p-1">
                  <img src={s.foto} alt={s.nombre} className="h-full w-full rounded-md object-contain bg-muted/20" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute bottom-2 left-2 rounded-md bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white uppercase tracking-wide">
                    {s.departamento}
                  </div>
                </div>
              ) : (
                <div className="relative flex aspect-video w-full items-center justify-center bg-gradient-to-br from-[#FFB300]/15 to-[#FF8800]/10">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg text-white" style={{ background: s.color ?? "#FFB300" }}>
                    <BuildingIcon className="h-6 w-6" />
                  </div>
                  <div className="absolute bottom-2 left-2 rounded-md bg-black/40 px-2 py-0.5 text-[10px] font-semibold text-white uppercase tracking-wide">
                    {s.departamento}
                  </div>
                </div>
              )}
              <CardContent className="p-4 space-y-2">
                <h3 className="font-bold text-sm truncate">{s.nombre}</h3>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <MapPinIcon className="h-3.5 w-3.5 shrink-0 mt-0.5 text-[#FF8800]" />
                    <span className="line-clamp-2">{s.direccion}</span>
                  </div>
                  {s.telefono && (
                    <div className="flex items-center gap-2">
                      <PhoneIcon className="h-3.5 w-3.5 shrink-0 text-[#FF8800]" />
                      <span>{s.telefono}</span>
                    </div>
                  )}
                  {s.horario && (
                    <div className="flex items-center gap-2">
                      <ClockIcon className="h-3.5 w-3.5 shrink-0 text-[#FF8800]" />
                      <span>{s.horario}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border/30">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${s.activo ? "text-green-600" : "text-red-500"}`}>
                    {s.activo ? "Activo" : "Inactivo"}
                  </span>
                  <div className="flex items-center gap-1">
                    {s.googleMaps && (
                      <a href={s.googleMaps} target="_blank" rel="noopener noreferrer" className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" title="Ver en Google Maps">
                        <ExternalLinkIcon className="h-3.5 w-3.5" />
                      </a>
                    )}
                    <button onClick={() => openEdit(s)} className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-[#FFB300]/10 hover:text-[#FF8800] transition-colors" title="Editar">
                      <PencilIcon className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => confirmDelete(s.id)} className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 transition-colors" title="Eliminar">
                      <Trash2Icon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filtrados.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MapPinIcon className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No se encontraron sucursales</p>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="!w-[94vw] !max-w-[94vw] sm:!max-w-[860px] lg:!max-w-[980px] max-h-[92vh] overflow-y-auto overflow-x-hidden p-0">
          <div className="flex h-1.5 w-full rounded-t-lg overflow-hidden">
            <div className="flex-1 bg-[#C41E3A]" />
            <div className="flex-1 bg-[#FFB300]" />
            <div className="flex-1 bg-[#2E7D32]" />
          </div>
          <div className="p-6 space-y-5">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">
                {editando ? "Editar sucursal" : "Nueva sucursal"}
              </DialogTitle>
              <DialogDescription>
                {editando ? "Modifique la información de la oficina regional" : "Complete los datos de la nueva oficina regional"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-1.5">
              <Label>Departamento *</Label>
              <select
                value={form.departamento}
                onChange={(e) => handleDeptoChange(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Seleccione un departamento</option>
                {DEPARTAMENTOS_BOLIVIA.map((d) => (
                  <option key={d.svgId} value={d.depto}>
                    {d.depto} — {d.capital}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Nombre de la oficina *</Label>
                <Input value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} placeholder="Oficina Postal La Paz" />
              </div>
              <div className="space-y-1.5">
                <Label>Capital</Label>
                <Input value={form.capital} onChange={(e) => setForm((f) => ({ ...f, capital: e.target.value }))} placeholder="La Paz" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Dirección *</Label>
              <Textarea value={form.direccion} onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))} placeholder="Av. Mariscal Santa Cruz esq. Oruro" rows={2} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Teléfono</Label>
                <Input value={form.telefono} onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))} placeholder="(2) 231-5040" />
              </div>
              <div className="space-y-1.5">
                <Label>Horario</Label>
                <Input value={form.horario} onChange={(e) => setForm((f) => ({ ...f, horario: e.target.value }))} placeholder="Lun - Vie: 8:00 - 16:00" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Enlace Google Maps</Label>
              <Input value={form.googleMaps} onChange={(e) => setForm((f) => ({ ...f, googleMaps: e.target.value }))} placeholder="https://maps.google.com/?q=..." />
            </div>

            {/* Foto de la sucursal */}
            <div className="space-y-2">
              <Label>Foto de la sucursal</Label>
              {fotoPreview ? (
                <div className="relative rounded-xl overflow-hidden border border-border/40 bg-muted/20">
                  <div className="flex h-64 w-full items-center justify-center p-2 sm:h-72">
                    <img src={fotoPreview} alt="Foto sucursal" className="h-full w-full object-contain" />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFotoPreview(null)
                      setFotoUrl(null)
                    }}
                    className="absolute top-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadingFoto}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/50 bg-muted/30 py-8 text-sm text-muted-foreground transition-colors hover:border-[#FFB300]/40 hover:bg-[#FFB300]/5"
                >
                  {uploadingFoto ? (
                    <span className="animate-pulse">Subiendo...</span>
                  ) : (
                    <>
                      <UploadIcon className="h-5 w-5" />
                      Subir foto de la sucursal (max 5MB)
                    </>
                  )}
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFotoUpload} className="hidden" />
            </div>

            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors font-medium">
                Parámetros del mapa (avanzado)
              </summary>
              <div className="mt-3 grid gap-3 sm:grid-cols-4">
                <div className="space-y-1">
                  <Label className="text-xs">SVG ID</Label>
                  <Input value={form.svgId} onChange={(e) => setForm((f) => ({ ...f, svgId: e.target.value }))} placeholder="BOL" className="text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Pin X (%)</Label>
                  <Input value={form.pinX} onChange={(e) => setForm((f) => ({ ...f, pinX: e.target.value }))} placeholder="16.7" className="text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Pin Y (%)</Label>
                  <Input value={form.pinY} onChange={(e) => setForm((f) => ({ ...f, pinY: e.target.value }))} placeholder="32" className="text-xs" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Color</Label>
                  <Input type="color" value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} className="h-9 p-1" />
                </div>
              </div>
            </details>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isPending}
                className="bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000] font-semibold shadow-md shadow-[#FFB300]/20"
              >
                {isPending ? "Guardando..." : editando ? "Actualizar" : "Crear sucursal"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm p-0">
          <div className="flex h-1.5 w-full rounded-t-lg overflow-hidden">
            <div className="flex-1 bg-[#C41E3A]" />
            <div className="flex-1 bg-[#FFB300]" />
            <div className="flex-1 bg-[#2E7D32]" />
          </div>
          <div className="p-6 space-y-4">
            <DialogHeader>
              <DialogTitle>¿Eliminar sucursal?</DialogTitle>
              <DialogDescription>Esta acción no se puede deshacer.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
                {isPending ? "Eliminando..." : "Eliminar"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
