"use client"

import { useState, useTransition, useRef } from "react"
import Image from "next/image"
import {
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  UsersIcon,
  MailIcon,
  PhoneIcon,
  BuildingIcon,
  SearchIcon,
  BadgeCheckIcon,
  CameraIcon,
  XIcon,
  Crown,
} from "lucide-react"
import toast from "react-hot-toast"

import { DataTable } from "@/components/dashboard/data-table"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import {
  crearPersonal,
  actualizarPersonal,
  eliminarPersonal,
  crearDirectivo,
  actualizarDirectivo,
  eliminarDirectivo,
} from "@/actions/rrhh"

type Tab = "personal" | "directorio"

/* ── Colores de avatar estilo Google Meet ── */
const AVATAR_COLORS = [
  "#1A73E8", "#E8453C", "#0B8043", "#F29900", "#8430CE",
  "#D93025", "#1E8E3E", "#185ABC", "#E37400", "#A142F4",
  "#00897B", "#C2185B",
]

function hashName(name: string): number {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
    hash |= 0
  }
  return Math.abs(hash)
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
}

function getColor(name: string) {
  return AVATAR_COLORS[hashName(name) % AVATAR_COLORS.length]
}

interface PersonalRow {
  id: string
  nombre: string
  ci: string
  cargo: string
  unidad: string
  email: string | null
  telefono: string | null
  foto: string | null
  fechaIngreso: string
  estado: string
}

interface DirectivoRow {
  id: string
  nombre: string
  cargo: string
  unidad: string
  email: string | null
  telefono: string | null
  foto: string | null
  orden: number
  estado: string
}

interface Props {
  personal: PersonalRow[]
  directivos: DirectivoRow[]
}

function FotoUploader({
  fotoUrl,
  onUploaded,
  onRemove,
  nombre,
}: {
  fotoUrl: string | null
  onUploaded: (url: string) => void
  onRemove: () => void
  nombre?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFile(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no puede superar 5MB")
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("archivo", file)
      const res = await fetch("/api/upload/personal", { method: "POST", body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      onUploaded(json.url)
      toast.success("Foto subida")
    } catch {
      toast.error("Error al subir foto")
    } finally {
      setUploading(false)
    }
  }

  const color = nombre ? getColor(nombre) : "#888"
  const initials = nombre ? getInitials(nombre) : "?"

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative group">
        {fotoUrl ? (
          <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-border shadow-lg">
            <Image src={fotoUrl} alt="Foto" fill className="object-cover" />
            <button
              type="button"
              onClick={onRemove}
              className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
            >
              <XIcon className="h-5 w-5 text-white" />
            </button>
          </div>
        ) : (
          <div
            className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-border text-2xl font-bold text-white shadow-lg cursor-pointer transition-transform hover:scale-105"
            style={{ backgroundColor: color }}
            onClick={() => inputRef.current?.click()}
          >
            {initials}
          </div>
        )}

        {!fotoUrl && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#FFB300] text-white shadow-md hover:bg-[#FF8800] transition-colors disabled:opacity-50"
          >
            <CameraIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
          e.target.value = ""
        }}
      />

      {uploading && <span className="text-xs text-muted-foreground animate-pulse">Subiendo...</span>}

      {fotoUrl && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-xs text-[#FF8800] hover:underline"
        >
          Cambiar foto
        </button>
      )}
    </div>
  )
}

export function RrhhModule({ personal, directivos }: Props) {
  const [tab, setTab] = useState<Tab>("personal")
  const [isPending, startTransition] = useTransition()

  const [pDialogOpen, setPDialogOpen] = useState(false)
  const [pEditItem, setPEditItem] = useState<PersonalRow | null>(null)
  const [pFotoUrl, setPFotoUrl] = useState<string | null>(null)

  const [dDialogOpen, setDDialogOpen] = useState(false)
  const [dEditItem, setDEditItem] = useState<DirectivoRow | null>(null)
  const [dFotoUrl, setDFotoUrl] = useState<string | null>(null)
  const [dirBusqueda, setDirBusqueda] = useState("")

  async function handlePersonalSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        const payload = {
          nombre: fd.get("nombre") as string,
          ci: fd.get("ci") as string,
          cargo: fd.get("cargo") as string,
          unidad: fd.get("unidad") as string,
          email: (fd.get("email") as string) || undefined,
          telefono: (fd.get("telefono") as string) || undefined,
          foto: pFotoUrl || undefined,
          fechaIngreso: fd.get("fechaIngreso") as string,
        }
        if (pEditItem) {
          await actualizarPersonal(pEditItem.id, {
            ...payload,
            estado: fd.get("estado") as string,
          })
          toast.success("Actualizado")
        } else {
          await crearPersonal(payload)
          toast.success("Personal registrado")
        }
        setPDialogOpen(false)
        setPEditItem(null)
        setPFotoUrl(null)
      } catch {
        toast.error("Error al guardar")
      }
    })
  }

  /* ── Directivo form submit ── */
  async function handleDirectivoSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        const payload = {
          nombre: fd.get("nombre") as string,
          cargo: fd.get("cargo") as string,
          unidad: fd.get("unidad") as string,
          email: (fd.get("email") as string) || undefined,
          telefono: (fd.get("telefono") as string) || undefined,
          foto: dFotoUrl || undefined,
          orden: parseInt((fd.get("orden") as string) || "0", 10),
        }
        if (dEditItem) {
          await actualizarDirectivo(dEditItem.id, {
            ...payload,
            estado: fd.get("estado") as string,
          })
          toast.success("Directivo actualizado")
        } else {
          await crearDirectivo(payload)
          toast.success("Directivo registrado")
        }
        setDDialogOpen(false)
        setDEditItem(null)
        setDFotoUrl(null)
      } catch {
        toast.error("Error al guardar")
      }
    })
  }

  const activos = personal.filter((p) => p.estado === "activo").length
  const dirActivos = directivos.filter((d) => d.estado === "activo")
  const dirFiltrados = dirActivos.filter(
    (d) =>
      d.nombre.toLowerCase().includes(dirBusqueda.toLowerCase()) ||
      d.cargo.toLowerCase().includes(dirBusqueda.toLowerCase()) ||
      d.unidad.toLowerCase().includes(dirBusqueda.toLowerCase()),
  )

  return (
    <>
      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* ── Tabs ── */}
        <div className="flex items-center gap-2 border-b border-border/40 pb-0">
          {([
            { key: "personal" as Tab, label: "Personal", icon: UsersIcon },
            { key: "directorio" as Tab, label: "Directorio / Jefes", icon: Crown },
          ] as const).map((t) => (
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
            </button>
          ))}
        </div>

        {tab === "personal" && (
          <>
            {/* Header + botón */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Gestión de Personal</h2>
                <p className="text-sm text-muted-foreground">Administración de funcionarios</p>
              </div>
              <Button
                className="bg-gradient-to-r from-[#C41E3A] to-[#a01830] text-white border-0 font-semibold shadow-md shadow-[#C41E3A]/20"
                onClick={() => {
                  setPEditItem(null)
                  setPFotoUrl(null)
                  setPDialogOpen(true)
                }}
              >
                <PlusIcon className="mr-2 h-4 w-4" />
                Nuevo personal
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Card className="border-border/40 overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFB300]/10 text-[#FF8800]">
                      <UsersIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{personal.length}</div>
                      <div className="text-xs text-muted-foreground">Total personal</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/40 overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 text-green-600">
                      <BadgeCheckIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{activos}</div>
                      <div className="text-xs text-muted-foreground">Activos</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/40 overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                      <UsersIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-500">{personal.length - activos}</div>
                      <div className="text-xs text-muted-foreground">Inactivos</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <DataTable
              data={personal as unknown as Record<string, unknown>[]}
              searchKey="nombre"
              searchPlaceholder="Buscar personal..."
              columns={[
                {
                  key: "nombre",
                  label: "Nombre",
                  render: (row) => {
                    const nombre = row.nombre as string
                    const cargo = row.cargo as string
                    const foto = row.foto as string | null
                    return (
                      <div className="flex items-center gap-3">
                        {foto ? (
                          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full shadow-sm">
                            <Image src={foto} alt={nombre} fill className="object-cover" />
                          </div>
                        ) : (
                          <div
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm"
                            style={{ backgroundColor: getColor(nombre) }}
                          >
                            {getInitials(nombre)}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-sm">{nombre}</div>
                          <div className="text-[11px] text-muted-foreground">{cargo}</div>
                        </div>
                      </div>
                    )
                  },
                },
                { key: "ci", label: "CI" },
                {
                  key: "unidad",
                  label: "Unidad",
                  render: (row) => (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#FFB300]/10 px-2.5 py-0.5 text-xs font-medium text-[#FF8800]">
                      <BuildingIcon className="h-3 w-3" />
                      {row.unidad as string}
                    </span>
                  ),
                },
                { key: "fechaIngreso", label: "Fecha ingreso" },
                {
                  key: "estado",
                  label: "Estado",
                  render: (row) => <StatusBadge status={row.estado as "activo" | "inactivo"} />,
                },
              ]}
              actions={(row) => (
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    title="Editar"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-card/80 text-muted-foreground shadow-sm transition-all duration-200 hover:border-[#FFB300]/40 hover:bg-[#FFB300]/10 hover:text-[#FF8800] hover:shadow-md active:scale-95"
                    onClick={() => {
                      const item = row as unknown as PersonalRow
                      setPEditItem(item)
                      setPFotoUrl(item.foto)
                      setPDialogOpen(true)
                    }}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    title="Eliminar"
                    disabled={isPending}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-card/80 text-muted-foreground shadow-sm transition-all duration-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 hover:shadow-md dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-400 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
                    onClick={() =>
                      startTransition(async () => {
                        await eliminarPersonal(row.id as string)
                        toast.success("Eliminado")
                      })
                    }
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </button>
                </div>
              )}
            />
          </>
        )}

        {tab === "directorio" && (
          <>
            {/* Header + botón */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Directorio Institucional</h2>
                <p className="text-sm text-muted-foreground">Jefes, directores y autoridades de la institución</p>
              </div>
              <Button
                className="bg-gradient-to-r from-[#C41E3A] to-[#a01830] text-white border-0 font-semibold shadow-md shadow-[#C41E3A]/20"
                onClick={() => {
                  setDEditItem(null)
                  setDFotoUrl(null)
                  setDDialogOpen(true)
                }}
              >
                <PlusIcon className="mr-2 h-4 w-4" />
                Nuevo directivo
              </Button>
            </div>

            {/* Stats directorio */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Card className="border-border/40 overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFB300]/10 text-[#FF8800]">
                      <Crown className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{directivos.length}</div>
                      <div className="text-xs text-muted-foreground">Total directivos</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/40 overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 text-green-600">
                      <BadgeCheckIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{dirActivos.length}</div>
                      <div className="text-xs text-muted-foreground">Activos</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="relative max-w-md">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar directivo, cargo o unidad..."
                value={dirBusqueda}
                onChange={(e) => setDirBusqueda(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {dirFiltrados.map((d) => {
                const color = getColor(d.nombre)
                return (
                  <div
                    key={d.id}
                    className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card transition-all duration-300 hover:border-[#FFB300]/30 hover:shadow-lg hover:shadow-[#FFB300]/5 hover:-translate-y-0.5"
                  >
                    <div
                      className="h-20 w-full"
                      style={{ background: `linear-gradient(135deg, ${color}22, ${color}55)` }}
                    />

                    <div className="flex justify-center -mt-10">
                      {d.foto ? (
                        <div className="relative h-20 w-20 overflow-hidden rounded-full border-4 border-card shadow-xl">
                          <Image src={d.foto} alt={d.nombre} fill className="object-cover" />
                        </div>
                      ) : (
                        <div
                          className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-card text-xl font-bold text-white shadow-xl"
                          style={{ backgroundColor: color }}
                        >
                          {getInitials(d.nombre)}
                        </div>
                      )}
                    </div>

                    <div className="p-5 pt-3 text-center">
                      <h3 className="font-bold text-base">{d.nombre}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{d.cargo}</p>

                      <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#FFB300]/10 px-3 py-1 text-xs font-semibold text-[#FF8800]">
                        <BuildingIcon className="h-3 w-3" />
                        {d.unidad}
                      </div>

                      <div className="mt-4 space-y-2 text-left">
                        {d.email && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <MailIcon className="h-3.5 w-3.5 shrink-0 text-[#FF8800]" />
                            <span className="truncate">{d.email}</span>
                          </div>
                        )}
                        {d.telefono && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <PhoneIcon className="h-3.5 w-3.5 shrink-0 text-[#FF8800]" />
                            <span>{d.telefono}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <button
                        type="button"
                        title="Editar"
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/80 text-muted-foreground opacity-0 shadow-sm backdrop-blur transition-all group-hover:opacity-100 hover:text-[#FF8800]"
                        onClick={() => {
                          setDEditItem(d)
                          setDFotoUrl(d.foto)
                          setDDialogOpen(true)
                        }}
                      >
                        <PencilIcon className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Eliminar"
                        disabled={isPending}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/80 text-muted-foreground opacity-0 shadow-sm backdrop-blur transition-all group-hover:opacity-100 hover:text-red-500 disabled:opacity-50"
                        onClick={() =>
                          startTransition(async () => {
                            await eliminarDirectivo(d.id)
                            toast.success("Directivo eliminado")
                          })
                        }
                      >
                        <Trash2Icon className="h-3.5 w-3.5" />
                      </button>
                      <span
                        className="flex h-3 w-3 rounded-full shadow-sm"
                        style={{
                          backgroundColor: d.estado === "activo" ? "#22c55e" : "#ef4444",
                          boxShadow: `0 0 6px ${d.estado === "activo" ? "#22c55e80" : "#ef444480"}`,
                        }}
                        title={d.estado === "activo" ? "Activo" : "Inactivo"}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {dirFiltrados.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Crown className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No se encontraron directivos</p>
              </div>
            )}
          </>
        )}
      </div>

      <Dialog
        open={pDialogOpen}
        onOpenChange={(o) => {
          setPDialogOpen(o)
          if (!o) { setPEditItem(null); setPFotoUrl(null) }
        }}
      >
        <DialogContent className="p-0 gap-0 overflow-hidden rounded-2xl max-w-lg">
          <div className="flex h-1.5 w-full">
            <div className="flex-1 bg-[#C41E3A]" />
            <div className="flex-1 bg-[#FFB300]" />
            <div className="flex-1 bg-[#2E7D32]" />
          </div>
          <div className="p-6">
            <DialogHeader>
              <DialogTitle>{pEditItem ? "Editar personal" : "Nuevo personal"}</DialogTitle>
              <DialogDescription>
                {pEditItem ? "Modifique la información del funcionario" : "Complete los datos del nuevo funcionario"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handlePersonalSubmit} className="mt-4 space-y-4">
              {/* ── Foto ── */}
              <div className="flex justify-center">
                <FotoUploader
                  fotoUrl={pFotoUrl}
                  onUploaded={(url) => setPFotoUrl(url)}
                  onRemove={() => setPFotoUrl(null)}
                  nombre={(pEditItem?.nombre) || "Nuevo Personal"}
                />
              </div>

              <div className="space-y-2">
                <Label>Nombre completo *</Label>
                <Input name="nombre" required defaultValue={pEditItem?.nombre} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>CI *</Label>
                  <Input name="ci" required defaultValue={pEditItem?.ci} />
                </div>
                <div className="space-y-2">
                  <Label>Fecha ingreso *</Label>
                  <Input name="fechaIngreso" type="date" required defaultValue={pEditItem?.fechaIngreso} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Cargo *</Label>
                <Input name="cargo" required defaultValue={pEditItem?.cargo} />
              </div>
              <div className="space-y-2">
                <Label>Unidad *</Label>
                <Input name="unidad" required defaultValue={pEditItem?.unidad} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input name="email" type="email" defaultValue={pEditItem?.email ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input name="telefono" defaultValue={pEditItem?.telefono ?? ""} />
                </div>
              </div>
              {pEditItem && (
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <select
                    name="estado"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    defaultValue={pEditItem.estado}
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setPDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000] font-semibold"
                >
                  {isPending ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={dDialogOpen}
        onOpenChange={(o) => {
          setDDialogOpen(o)
          if (!o) { setDEditItem(null); setDFotoUrl(null) }
        }}
      >
        <DialogContent className="p-0 gap-0 overflow-hidden rounded-2xl max-w-lg">
          <div className="flex h-1.5 w-full">
            <div className="flex-1 bg-[#C41E3A]" />
            <div className="flex-1 bg-[#FFB300]" />
            <div className="flex-1 bg-[#2E7D32]" />
          </div>
          <div className="p-6">
            <DialogHeader>
              <DialogTitle>{dEditItem ? "Editar directivo" : "Nuevo directivo"}</DialogTitle>
              <DialogDescription>
                {dEditItem ? "Actualice la información del directivo" : "Registre un nuevo jefe o director"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleDirectivoSubmit} className="mt-4 space-y-4">
              {/* ── Foto ── */}
              <div className="flex justify-center">
                <FotoUploader
                  fotoUrl={dFotoUrl}
                  onUploaded={(url) => setDFotoUrl(url)}
                  onRemove={() => setDFotoUrl(null)}
                  nombre={(dEditItem?.nombre) || "Nuevo Directivo"}
                />
              </div>

              <div className="space-y-2">
                <Label>Nombre completo *</Label>
                <Input name="nombre" required defaultValue={dEditItem?.nombre} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cargo *</Label>
                  <Input name="cargo" required defaultValue={dEditItem?.cargo} />
                </div>
                <div className="space-y-2">
                  <Label>Orden de aparición</Label>
                  <Input name="orden" type="number" min="0" defaultValue={dEditItem?.orden ?? 0} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Unidad / Dirección *</Label>
                <Input name="unidad" required defaultValue={dEditItem?.unidad} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input name="email" type="email" defaultValue={dEditItem?.email ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input name="telefono" defaultValue={dEditItem?.telefono ?? ""} />
                </div>
              </div>
              {dEditItem && (
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <select
                    name="estado"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    defaultValue={dEditItem.estado}
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setDDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000] font-semibold"
                >
                  {isPending ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
