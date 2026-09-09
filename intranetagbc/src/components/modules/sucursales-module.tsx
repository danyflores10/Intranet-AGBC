"use client"

import { useMemo, useRef, useState, useEffect, useTransition } from "react"
import {
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  MapPinIcon,
  PhoneIcon,
  ClockIcon,
  UploadIcon,
  XIcon,
  Building2Icon,
  ExternalLinkIcon,
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  RotateCwIcon,
  LayoutGridIcon,
  GridIcon,
} from "lucide-react"
import toast from "react-hot-toast"
import Image from "next/image"

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
import { PERMISOS } from "@/lib/auth/permisos"
import { crearContextoAcceso, puedeAcceder, type UsuarioRbac } from "@/lib/rbac"

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
  usuario: UsuarioRbac
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

const MAX_SUCURSALES_POR_CARRUSEL = 6

export function SucursalesModule({ sucursales: sucursalesInit, usuario }: Props) {
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

  const accessContext = useMemo(() => crearContextoAcceso(usuario), [usuario])
  const canCreateSucursal = useMemo(
    () => puedeAcceder({ permissions: [PERMISOS.SUCURSALES.CREAR] }, accessContext),
    [accessContext],
  )
  const canEditSucursal = useMemo(
    () => puedeAcceder({ permissions: [PERMISOS.SUCURSALES.EDITAR] }, accessContext),
    [accessContext],
  )
  const canDeleteSucursal = useMemo(
    () => puedeAcceder({ permissions: [PERMISOS.SUCURSALES.ELIMINAR] }, accessContext),
    [accessContext],
  )

  // Formulario
  const [form, setForm] = useState({
    departamento: "",
    capital: "",
    nombre: "",
    direccion: "",
    telefono: "",
    horario: "Lunes a Viernes 08:00 - 16:00",
    googleMaps: "",
    color: "#0E5296",
    svgId: "",
    pinX: "",
    pinY: "",
    activo: true,
  })

  // Filtrado
  const filtrados = useMemo(() => {
    return items.filter((s) => {
      const q = busqueda.toLowerCase()
      return (
        s.nombre.toLowerCase().includes(q) ||
        s.departamento.toLowerCase().includes(q) ||
        s.direccion.toLowerCase().includes(q) ||
        s.capital.toLowerCase().includes(q)
      )
    })
  }, [items, busqueda])

  function openCreate() {
    setEditando(null)
    setFotoPreview(null)
    setFotoUrl(null)
    const first = DEPARTAMENTOS_BOLIVIA[0]
    setForm({
      departamento: first.depto,
      capital: first.capital,
      nombre: `Oficina Regional ${first.depto}`,
      direccion: "",
      telefono: "",
      horario: "Lunes a Viernes 08:00 - 16:00",
      googleMaps: "",
      color: first.color,
      svgId: first.svgId,
      pinX: first.pinX,
      pinY: first.pinY,
      activo: true,
    })
    setDialogOpen(true)
  }

  function openEdit(s: SucursalRow) {
    setEditando(s)
    setFotoPreview(s.foto)
    setFotoUrl(s.foto)
    setForm({
      departamento: s.departamento,
      capital: s.capital,
      nombre: s.nombre,
      direccion: s.direccion,
      telefono: s.telefono || "",
      horario: s.horario || "Lunes a Viernes 08:00 - 16:00",
      googleMaps: s.googleMaps || "",
      color: s.color || "#0E5296",
      svgId: s.svgId || "",
      pinX: s.pinX || "",
      pinY: s.pinY || "",
      activo: s.activo,
    })
    setDialogOpen(true)
  }

  function handleDeptoChange(deptoName: string) {
    const match = DEPARTAMENTOS_BOLIVIA.find((d) => d.depto === deptoName)
    if (match) {
      setForm((prev) => ({
        ...prev,
        departamento: match.depto,
        capital: match.capital,
        nombre: editando ? prev.nombre : `Oficina Regional ${match.depto}`,
        color: match.color,
        svgId: match.svgId,
        pinX: match.pinX,
        pinY: match.pinY,
      }))
    }
  }

  async function handleFotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingFoto(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      if (!res.ok) throw new Error("Error al subir imagen")
      const data = await res.json()
      setFotoUrl(data.url)
      setFotoPreview(data.url)
      toast.success("Foto subida correctamente")
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
        toast.error("Error al guardar sucursal")
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
      <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 bg-gradient-to-br from-slate-50 via-blue-50/25 to-amber-50/20 min-h-screen">
        {/* ── Cabecera Principal ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0E5296] text-[#FFCC00] shadow-sm">
                <Building2Icon className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-[#002F6C]">
                Administración de Sucursales
              </h1>
            </div>
            <p className="text-xs text-slate-600 font-medium mt-1">
              Gestiona las oficinas regionales de la Agencia Boliviana de Correos en todo el país.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {canCreateSucursal ? (
              <Button
                onClick={openCreate}
                className="bg-[#0E5296] hover:bg-[#002F6C] text-white font-bold shadow-md shadow-[#0E5296]/20 cursor-pointer rounded-xl"
              >
                <PlusIcon className="mr-1.5 h-4 w-4 text-[#FFCC00]" />
                Nueva Sucursal
              </Button>
            ) : null}
          </div>
        </div>

        {/* ── Buscador ── */}
        <div className="rounded-2xl border-2 border-[#002F6C]/15 bg-gradient-to-r from-white via-blue-50/20 to-amber-50/20 p-4 shadow-xs">
          <div className="relative max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por departamento, nombre, dirección..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9 bg-white/90 border-[#002F6C]/20 text-xs font-medium focus:border-[#0E5296]"
            />
          </div>
        </div>

        {/* ── VISTA EXCLUSIVA: CUADRÍCULA INSTITUCIONAL DE SUCURSALES ── */}
        {filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center rounded-3xl border-2 border-[#002F6C]/15 bg-white/80 p-8 shadow-xs">
            <Building2Icon className="h-14 w-14 text-slate-300 mb-3" />
            <p className="text-base font-bold text-slate-700">No se encontraron sucursales</p>
            <p className="text-xs text-slate-400 mt-1">Prueba cambiando los términos de búsqueda.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtrados.map((s) => (
              <Card
                key={s.id}
                className="overflow-hidden border-2 border-[#002F6C]/15 hover:border-[#0E5296]/50 hover:shadow-lg transition-all rounded-3xl bg-white/90 group flex flex-col justify-between"
              >
                <div
                  className="h-2 w-full"
                  style={{ backgroundColor: s.color || "#0E5296" }}
                />
                <CardContent className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span className="inline-block rounded-full bg-[#0E5296] text-[#FFCC00] px-3 py-1 text-[9px] font-black uppercase tracking-wider shadow-2xs">
                          {s.departamento}
                        </span>
                        <h3 className="font-black text-sm text-[#002F6C] mt-2 group-hover:text-[#0E5296] transition-colors line-clamp-1">
                          {s.nombre}
                        </h3>
                        <p className="text-[11px] text-slate-500 font-medium line-clamp-1">
                          {s.capital}
                        </p>
                      </div>

                      {s.foto ? (
                        <div className="relative h-14 w-14 shrink-0 rounded-2xl overflow-hidden border-2 border-amber-300 shadow-sm">
                          <img
                            src={s.foto}
                            alt={s.nombre}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#FFCC00] text-[#002F6C] font-black text-lg shadow-sm border border-amber-300">
                          <Building2Icon className="h-7 w-7 text-[#002F6C]" />
                        </div>
                      )}
                    </div>

                    {/* Datos */}
                    <div className="space-y-2 text-xs text-slate-600 my-3">
                      <div className="flex items-start gap-2">
                        <MapPinIcon className="h-4 w-4 text-[#0E5296] shrink-0 mt-0.5" />
                        <span className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                          {s.direccion}
                        </span>
                      </div>

                      {s.telefono && (
                        <div className="flex items-center gap-2">
                          <PhoneIcon className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span className="text-[11px] font-semibold text-slate-700">
                            {s.telefono}
                          </span>
                        </div>
                      )}

                      {s.horario && (
                        <div className="flex items-center gap-2">
                          <ClockIcon className="h-4 w-4 text-amber-600 shrink-0" />
                          <span className="text-[10px] text-slate-500 font-medium">
                            {s.horario}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Acciones y Mapa */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-2">
                    {s.googleMaps ? (
                      <a
                        href={s.googleMaps}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0E5296] hover:text-[#002F6C] hover:underline"
                      >
                        <ExternalLinkIcon className="h-3.5 w-3.5" />
                        Ver en Maps
                      </a>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-mono">
                        Oficina AGBC
                      </span>
                    )}

                    <div className="flex items-center gap-1">
                      {canEditSucursal && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(s)}
                          className="h-8 w-8 text-[#002F6C] hover:bg-blue-50 rounded-xl cursor-pointer"
                          title="Editar sucursal"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                      )}
                      {canDeleteSucursal && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => confirmDelete(s.id)}
                          className="h-8 w-8 text-red-600 hover:bg-red-50 rounded-xl cursor-pointer"
                          title="Eliminar sucursal"
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ── Dialog Crear / Editar Sucursal ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-[#002F6C]">
              {editando ? "Editar Sucursal" : "Nueva Sucursal"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {editando
                ? "Modifica los datos de la sucursal regional seleccionada."
                : "Registra una nueva oficina regional de Correos de Bolivia."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div>
              <Label className="text-xs font-bold text-slate-700">Departamento *</Label>
              <select
                value={form.departamento}
                onChange={(e) => handleDeptoChange(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-[#002F6C] outline-hidden"
              >
                {DEPARTAMENTOS_BOLIVIA.map((d) => (
                  <option key={d.depto} value={d.depto}>
                    {d.depto} ({d.capital})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-700">Nombre de la sucursal *</Label>
              <Input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej. Oficina Central La Paz"
                className="mt-1 bg-slate-50 text-xs font-medium"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-700">Dirección completa *</Label>
              <Textarea
                value={form.direccion}
                onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                placeholder="Ej. Av. Mariscal Santa Cruz esq. Oruro"
                rows={2}
                className="mt-1 bg-slate-50 text-xs font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-slate-700">Teléfono / Celular</Label>
                <Input
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  placeholder="(+591) 2 123456"
                  className="mt-1 bg-slate-50 text-xs font-medium"
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-700">Horario de atención</Label>
                <Input
                  value={form.horario}
                  onChange={(e) => setForm({ ...form, horario: e.target.value })}
                  placeholder="08:00 - 16:00"
                  className="mt-1 bg-slate-50 text-xs font-medium"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-700">Enlace de Google Maps</Label>
              <Input
                value={form.googleMaps}
                onChange={(e) => setForm({ ...form, googleMaps: e.target.value })}
                placeholder="https://maps.google.com/..."
                className="mt-1 bg-slate-50 text-xs font-medium"
              />
            </div>

            {/* Foto de la sucursal */}
            <div>
              <Label className="text-xs font-bold text-slate-700">Fotografía de la fachada</Label>
              <div className="mt-1 flex items-center gap-3">
                {fotoPreview ? (
                  <div className="relative h-16 w-24 overflow-hidden rounded-xl border border-slate-200">
                    <Image src={fotoPreview} alt="Preview" fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setFotoPreview(null)
                        setFotoUrl(null)
                      }}
                      className="absolute top-1 right-1 rounded-full bg-red-600 p-0.5 text-white"
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </div>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadingFoto}
                  className="text-xs font-bold text-[#002F6C]"
                >
                  <UploadIcon className="mr-1.5 h-3.5 w-3.5 text-[#0E5296]" />
                  {uploadingFoto ? "Subiendo..." : "Seleccionar imagen"}
                </Button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFotoUpload} />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="text-xs font-bold">
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending || uploadingFoto}
              className="bg-[#0E5296] hover:bg-[#002F6C] text-white font-bold text-xs"
            >
              {isPending ? "Guardando..." : editando ? "Guardar cambios" : "Crear sucursal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog Eliminar Sucursal ── */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-red-600">Eliminar Sucursal</DialogTitle>
            <DialogDescription className="text-xs text-slate-600">
              ¿Estás seguro de que deseas eliminar esta sucursal regional? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="text-xs font-bold">
              Cancelar
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
            >
              {isPending ? "Eliminando..." : "Sí, eliminar sucursal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
