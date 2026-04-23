"use client"

import { useState, useTransition, useRef } from "react"
import {
  PlusIcon, PencilIcon, Trash2Icon, ClipboardListIcon, SearchIcon,
  FileIcon, DownloadIcon, EyeIcon, CheckCircle2Icon, XCircleIcon,
  ClockIcon, SendIcon, PaperclipIcon, UserIcon, MessageSquareIcon,
  FileTextIcon, ImageIcon, XIcon,
} from "lucide-react"
import toast from "react-hot-toast"

import { DataTable } from "@/components/dashboard/data-table"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { crearSolicitud, actualizarSolicitud, eliminarSolicitud } from "@/actions/tramites"
import { TIPOS_SOLICITUD, ESTADOS_SOLICITUD } from "@/lib/tramites-constants"

type Usuario = {
  id: string
  firstName: string
  lastNamePaternal: string
  lastNameMaternal: string | null
  institutionalEmail: string
  image: string | null
}

type Solicitud = {
  id: string
  codigo: string
  tipo: string
  descripcion: string | null
  estado: string
  prioridad: string
  observaciones: string | null
  respuesta: string | null
  solicitanteId: string
  destinatarioId: string | null
  archivoUrl: string | null
  archivoNombre: string | null
  archivoTipo: string | null
  createdAt: Date
  updatedAt: Date
}

interface Props {
  solicitudes: Solicitud[]
  usuarios: Usuario[]
  currentUserId: string
}

function nombreCompleto(u: Usuario) {
  return `${u.firstName} ${u.lastNamePaternal}${u.lastNameMaternal ? ` ${u.lastNameMaternal}` : ""}`
}

function getEstadoIcon(estado: string) {
  switch (estado) {
    case "pendiente": return <ClockIcon className="h-4 w-4 text-yellow-500" />
    case "en_revision": return <SearchIcon className="h-4 w-4 text-blue-500" />
    case "aprobado": return <CheckCircle2Icon className="h-4 w-4 text-green-500" />
    case "rechazado": return <XCircleIcon className="h-4 w-4 text-red-500" />
    default: return <ClockIcon className="h-4 w-4" />
  }
}

function getEstadoLabel(estado: string) {
  return ESTADOS_SOLICITUD.find(e => e.value === estado)?.label ?? estado
}

function getTipoLabel(tipo: string) {
  return TIPOS_SOLICITUD.find(t => t.value === tipo)?.label ?? tipo
}

function getFileViewerIcon(tipo: string | null) {
  if (!tipo) return <FileIcon className="h-10 w-10 text-[#FFB300]" />
  if (tipo === "pdf") return <FileTextIcon className="h-10 w-10 text-red-500" />
  if (["jpg", "png", "webp", "jpeg"].includes(tipo)) return <ImageIcon className="h-10 w-10 text-blue-500" />
  return <FileIcon className="h-10 w-10 text-[#FFB300]" />
}

function canPreview(tipo: string | null) {
  if (!tipo) return false
  return ["pdf", "jpg", "jpeg", "png", "webp"].includes(tipo.toLowerCase())
}

export function TramitesModule({ solicitudes, usuarios, currentUserId }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [respondOpen, setRespondOpen] = useState(false)
  const [fileViewerOpen, setFileViewerOpen] = useState(false)
  const [fileViewerUrl, setFileViewerUrl] = useState("")
  const [fileViewerName, setFileViewerName] = useState("")
  const [fileViewerType, setFileViewerType] = useState("")
  const [editItem, setEditItem] = useState<Solicitud | null>(null)
  const [detailItem, setDetailItem] = useState<Solicitud | null>(null)
  const [respondItem, setRespondItem] = useState<Solicitud | null>(null)
  const [respondEstado, setRespondEstado] = useState<string>("en_revision")
  const [isPending, startTransition] = useTransition()
  const [archivo, setArchivo] = useState<File | null>(null)
  const [searchDestinatario, setSearchDestinatario] = useState("")
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [selectedDestinatario, setSelectedDestinatario] = useState<Usuario | null>(null)
  const [filtro, setFiltro] = useState<"todas" | "enviadas" | "recibidas">("todas")
  const [tipoSolicitud, setTipoSolicitud] = useState("")
  const [prioridadSolicitud, setPrioridadSolicitud] = useState("media")
  const [estadoSolicitud, setEstadoSolicitud] = useState("pendiente")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const usuariosMap = new Map(usuarios.map(u => [u.id, u]))

  const solicitudesFiltradas = solicitudes.filter(s => {
    if (filtro === "enviadas") return s.solicitanteId === currentUserId
    if (filtro === "recibidas") return s.destinatarioId === currentUserId
    return true
  })

  const pendientes = solicitudes.filter(s => s.estado === "pendiente").length
  const enRevision = solicitudes.filter(s => s.estado === "en_revision").length
  const aprobados = solicitudes.filter(s => s.estado === "aprobado").length
  const rechazados = solicitudes.filter(s => s.estado === "rechazado").length

  const filteredUsuarios = usuarios.filter(u =>
    u.id !== currentUserId &&
    (searchDestinatario === "" ||
      nombreCompleto(u).toLowerCase().includes(searchDestinatario.toLowerCase()) ||
      u.institutionalEmail.toLowerCase().includes(searchDestinatario.toLowerCase()))
  )

  function openNew() {
    setEditItem(null)
    setArchivo(null)
    setSelectedDestinatario(null)
    setSearchDestinatario("")
    setTipoSolicitud("")
    setPrioridadSolicitud("media")
    setEstadoSolicitud("pendiente")
    setDialogOpen(true)
  }

  function openEdit(item: Solicitud) {
    setEditItem(item)
    setArchivo(null)
    const dest = item.destinatarioId ? usuariosMap.get(item.destinatarioId) ?? null : null
    setSelectedDestinatario(dest)
    setSearchDestinatario(dest ? nombreCompleto(dest) : "")
    setTipoSolicitud(item.tipo)
    setPrioridadSolicitud(item.prioridad)
    setEstadoSolicitud(item.estado)
    setDialogOpen(true)
  }

  function openDetail(item: Solicitud) {
    setDetailItem(item)
    setDetailOpen(true)
  }

  function openRespond(item: Solicitud) {
    setRespondItem(item)
    setRespondEstado("en_revision")
    setRespondOpen(true)
  }

  function openFileViewer(url: string, nombre: string, tipo: string) {
    setFileViewerUrl(url)
    setFileViewerName(nombre)
    setFileViewerType(tipo)
    setFileViewerOpen(true)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const tipo = tipoSolicitud
    const prioridad = prioridadSolicitud || "media"
    const estado = estadoSolicitud
    const destinatarioId = selectedDestinatario?.id
    const descripcionRaw = (fd.get("descripcion") as string | null)?.trim()
    const observacionesRaw = (fd.get("observaciones") as string | null)?.trim()
    const descripcion = descripcionRaw ? descripcionRaw : undefined
    const observaciones = observacionesRaw ? observacionesRaw : undefined

    startTransition(async () => {
      try {
        let archivoUrl: string | undefined
        let archivoNombre: string | undefined
        let archivoTipo: string | undefined

        if (archivo) {
          const uploadFd = new FormData()
          uploadFd.append("archivo", archivo)
          const resp = await fetch("/api/upload/documento", { method: "POST", body: uploadFd })
          if (!resp.ok) {
            let errorMsg = "Error al subir archivo"
            try {
              const err = await resp.json()
              if (typeof err?.error === "string" && err.error.trim()) {
                errorMsg = err.error
              }
            } catch {
              // Ignorar errores de parseo de respuesta y usar mensaje por defecto
            }
            toast.error(errorMsg)
            return
          }
          const result = await resp.json()
          archivoUrl = result.url
          archivoNombre = result.nombre
          archivoTipo = result.tipo
        }

        if (!tipo) {
          toast.error("Seleccione un tipo de solicitud")
          return
        }

        if (editItem) {
          await actualizarSolicitud(editItem.id, {
            tipo,
            prioridad,
            estado,
            descripcion,
            observaciones,
            destinatarioId,
            ...(archivoUrl ? { archivoUrl, archivoNombre, archivoTipo } : {}),
          }, currentUserId)
          toast.success("Solicitud actualizada")
        } else {
          await crearSolicitud({
            solicitanteId: currentUserId,
            destinatarioId,
            tipo,
            prioridad,
            descripcion,
            ...(archivoUrl ? { archivoUrl, archivoNombre, archivoTipo } : {}),
          })
          toast.success("Solicitud creada y enviada")
        }

        setDialogOpen(false)
        setEditItem(null)
        setArchivo(null)
        setSelectedDestinatario(null)
        setTipoSolicitud("")
        setPrioridadSolicitud("media")
        setEstadoSolicitud("pendiente")
      } catch (error) {
        const message =
          typeof error === "object" &&
          error !== null &&
          "message" in error &&
          typeof (error as { message?: unknown }).message === "string"
            ? (error as { message: string }).message
            : "Error al guardar"

        const normalizedMessage = message.toLowerCase()
        if (normalizedMessage.includes("duplicate key") || normalizedMessage.includes("solicitudes_codigo")) {
          toast.error("No se pudo crear la solicitud. Intenta nuevamente.")
          return
        }

        toast.error(message)
      }
    })
  }

  async function handleRespond(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!respondItem) return
    const fd = new FormData(e.currentTarget)

    startTransition(async () => {
      try {
        await actualizarSolicitud(respondItem.id, {
          estado: fd.get("estado") as string,
          respuesta: (fd.get("respuesta") as string) || undefined,
          observaciones: (fd.get("observaciones") as string) || undefined,
        }, currentUserId)
        toast.success("Solicitud respondida")
        setRespondOpen(false)
        setRespondItem(null)
      } catch {
        toast.error("Error al responder")
      }
    })
  }

  return (
    <>
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Solicitudes y Trámites</h2>
            <p className="text-sm text-muted-foreground">
              Gestiona solicitudes internas: vacaciones, permisos, licencias, materiales y más
            </p>
          </div>
          <Button
            className="bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000] border-0 font-semibold shadow-md shadow-[#FFB300]/20"
            onClick={openNew}
          >
            <PlusIcon className="mr-2 h-4 w-4" />Nueva solicitud
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <Card className="border-border/40">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <ClipboardListIcon className="h-5 w-5 text-[#FFB300]" />
                <div>
                  <div className="text-2xl font-bold">{solicitudes.length}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/40">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4 text-yellow-500" />
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{pendientes}</div>
                  <div className="text-xs text-muted-foreground">Pendientes</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/40">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <SearchIcon className="h-4 w-4 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">{enRevision}</div>
                  <div className="text-xs text-muted-foreground">En revisión</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/40">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2Icon className="h-4 w-4 text-green-500" />
                <div>
                  <div className="text-2xl font-bold text-green-600">{aprobados}</div>
                  <div className="text-xs text-muted-foreground">Aprobados</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/40">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircleIcon className="h-4 w-4 text-red-500" />
                <div>
                  <div className="text-2xl font-bold text-red-500">{rechazados}</div>
                  <div className="text-xs text-muted-foreground">Rechazados</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2">
          {(["todas", "enviadas", "recibidas"] as const).map(f => (
            <Button
              key={f}
              variant={filtro === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltro(f)}
              className={filtro === f ? "bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000]" : ""}
            >
              {f === "todas" ? "Todas" : f === "enviadas" ? "Mis solicitudes" : "Recibidas"}
            </Button>
          ))}
        </div>

        <DataTable
          data={solicitudesFiltradas.map(s => ({
            ...s,
            fecha: s.createdAt.toLocaleDateString("es-BO"),
            solicitanteNombre: usuariosMap.get(s.solicitanteId)
              ? nombreCompleto(usuariosMap.get(s.solicitanteId)!)
              : "—",
            destinatarioNombre: s.destinatarioId && usuariosMap.get(s.destinatarioId)
              ? nombreCompleto(usuariosMap.get(s.destinatarioId)!)
              : "—",
            tipoLabel: getTipoLabel(s.tipo),
          }))}
          searchKey="codigo"
          searchPlaceholder="Buscar por código..."
          columns={[
            {
              key: "codigo", label: "Código", className: "w-32",
              render: (row) => <span className="font-mono text-xs">{row.codigo}</span>
            },
            {
              key: "tipoLabel", label: "Tipo",
              render: (row) => (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFB300]/10 px-2.5 py-0.5 text-xs font-medium text-[#FF8800]">
                  {row.tipoLabel}
                </span>
              )
            },
            {
              key: "solicitanteNombre", label: "Solicitante",
              render: (row) => <span className="font-medium text-sm">{row.solicitanteNombre}</span>
            },
            {
              key: "destinatarioNombre", label: "Dirigido a",
              render: (row) => <span className="text-sm text-muted-foreground">{row.destinatarioNombre}</span>
            },
            { key: "fecha", label: "Fecha" },
            {
              key: "prioridad", label: "Prior.",
              render: (row) => <StatusBadge status={row.prioridad as "alta" | "media" | "baja"} />
            },
            {
              key: "estado", label: "Estado",
              render: (row) => (
                <div className="flex items-center gap-1.5">
                  {getEstadoIcon(row.estado)}
                  <span className="text-xs font-medium">{getEstadoLabel(row.estado)}</span>
                </div>
              )
            },
          ]}
          actions={(row) => (
            <div className="flex items-center justify-end gap-1">
              {row.destinatarioId === currentUserId && (row.estado === "pendiente" || row.estado === "en_revision") && (
                <button
                  type="button"
                  title="Responder / Revisar"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000] shadow-sm transition-all hover:shadow-md active:scale-95"
                  onClick={() => openRespond(row)}
                >
                  <MessageSquareIcon className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                title="Ver detalle"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 bg-card/80 text-muted-foreground transition-all hover:border-[#FFB300]/40 hover:bg-[#FFB300]/10 hover:text-[#FF8800]"
                onClick={() => openDetail(row)}
              >
                <EyeIcon className="h-4 w-4" />
              </button>
              {row.estado !== "aprobado" && row.estado !== "rechazado" && (
                <>
                  <button
                    type="button"
                    title="Editar"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 bg-card/80 text-muted-foreground transition-all hover:border-[#FFB300]/40 hover:bg-[#FFB300]/10 hover:text-[#FF8800]"
                    onClick={() => openEdit(row)}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    title="Eliminar"
                    disabled={isPending}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 bg-card/80 text-muted-foreground transition-all hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-400 disabled:pointer-events-none disabled:opacity-50"
                    onClick={() => startTransition(async () => { await eliminarSolicitud(row.id); toast.success("Solicitud eliminada") })}
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          )}
        />
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="p-0 gap-0 overflow-hidden rounded-2xl w-[95vw] sm:w-[92vw] md:w-[88vw] lg:w-[920px] !max-w-[920px] border-0 shadow-2xl">
          <div className="flex h-1.5 w-full">
            <div className="flex-1 bg-[#C41E3A]" />
            <div className="flex-1 bg-[#FFB300]" />
            <div className="flex-1 bg-[#2E7D32]" />
          </div>
          <div className="max-h-[84vh] overflow-y-auto p-6 md:p-7">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFB300]/20 to-[#FF8800]/20">
                  <SendIcon className="h-5 w-5 text-[#FF8800]" />
                </div>
                {editItem ? "Editar solicitud" : "Nueva solicitud"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-1">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipo de solicitud *</Label>
                <Select value={tipoSolicitud} onValueChange={setTipoSolicitud}>
                  <SelectTrigger className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm">
                    <SelectValue placeholder="Seleccione un tipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_SOLICITUD.map(t => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 md:col-span-1">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Prioridad</Label>
                <Select value={prioridadSolicitud} onValueChange={setPrioridadSolicitud}>
                  <SelectTrigger className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm">
                    <SelectValue placeholder="Seleccione prioridad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baja">Baja</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dirigido a</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar usuario por nombre o email..."
                    className="pl-9 rounded-lg"
                    value={searchDestinatario}
                    onChange={(e) => {
                      setSearchDestinatario(e.target.value)
                      setShowUserDropdown(true)
                      if (e.target.value === "") setSelectedDestinatario(null)
                    }}
                    onFocus={() => setShowUserDropdown(true)}
                    onBlur={() => setTimeout(() => setShowUserDropdown(false), 200)}
                  />
                  {showUserDropdown && searchDestinatario.length > 0 && filteredUsuarios.length > 0 && (
                    <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover shadow-xl max-h-48 overflow-y-auto">
                      {filteredUsuarios.slice(0, 8).map(u => (
                        <button
                          key={u.id}
                          type="button"
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-sm hover:bg-accent transition-colors text-left"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setSelectedDestinatario(u)
                            setSearchDestinatario(nombreCompleto(u))
                            setShowUserDropdown(false)
                          }}
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#FFB300]/30 to-[#FF8800]/30 text-xs font-bold text-[#FF8800]">
                            {u.firstName[0]}{u.lastNamePaternal[0]}
                          </div>
                          <div>
                            <div className="font-medium">{nombreCompleto(u)}</div>
                            <div className="text-xs text-muted-foreground">{u.institutionalEmail}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedDestinatario && (
                    <div className="mt-2 flex items-center gap-2 rounded-lg bg-[#FFB300]/10 border border-[#FFB300]/20 px-3 py-2 text-sm">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FFB300]/30 text-xs font-bold text-[#FF8800]">
                        {selectedDestinatario.firstName[0]}{selectedDestinatario.lastNamePaternal[0]}
                      </div>
                      <span className="font-medium">{nombreCompleto(selectedDestinatario)}</span>
                      <button
                        type="button"
                        className="ml-auto text-muted-foreground hover:text-red-500 transition-colors"
                        onClick={() => { setSelectedDestinatario(null); setSearchDestinatario("") }}
                      >
                        <XIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {editItem && (
                <div className="space-y-1.5 md:col-span-1">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estado</Label>
                  <Select value={estadoSolicitud} onValueChange={setEstadoSolicitud}>
                    <SelectTrigger className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm">
                      <SelectValue placeholder="Seleccione estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS_SOLICITUD.map(e => (
                        <SelectItem key={e.value} value={e.value}>
                          {e.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Descripción / Motivo</Label>
                <textarea
                  name="descripcion"
                  rows={4}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm resize-none transition-colors focus:border-[#FFB300] focus:ring-1 focus:ring-[#FFB300]/30 outline-none"
                  placeholder="Describa el motivo de su solicitud..."
                  defaultValue={editItem?.descripcion ?? ""}
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Documento adjunto</Label>
                <div
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border/60 bg-muted/30 p-4 transition-colors hover:border-[#FFB300]/40 hover:bg-[#FFB300]/5 cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.png,.webp,.txt,.csv"
                    onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                  />
                  <PaperclipIcon className="h-6 w-6 text-muted-foreground mb-1" />
                  <span className="text-sm text-muted-foreground">
                    {archivo ? archivo.name : "Clic para adjuntar archivo"}
                  </span>
                  <span className="text-xs text-muted-foreground/60 mt-0.5">PDF, DOC, XLS, JPG, PNG — Máx. 10MB</span>
                </div>
                {archivo && (
                  <div className="flex items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-3 py-2 text-sm">
                    <FileIcon className="h-4 w-4 text-blue-500" />
                    <span className="truncate flex-1">{archivo.name}</span>
                    <button
                      type="button"
                      onClick={() => { setArchivo(null); if (fileInputRef.current) fileInputRef.current.value = "" }}
                      className="text-muted-foreground hover:text-red-500"
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
                {!archivo && editItem?.archivoNombre && (
                  <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
                    <FileIcon className="h-4 w-4 text-[#FFB300]" />
                    <span className="text-xs">{editItem.archivoNombre}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t md:col-span-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="rounded-lg">
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000] gap-2 rounded-lg font-semibold shadow-md shadow-[#FFB300]/20"
                >
                  <SendIcon className="h-4 w-4" />
                  {isPending ? "Enviando..." : editItem ? "Actualizar" : "Enviar solicitud"}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={respondOpen} onOpenChange={setRespondOpen}>
        <DialogContent className="p-0 gap-0 overflow-hidden rounded-2xl max-w-md border-0 shadow-2xl">
          <div className="flex h-1.5 w-full">
            <div className="flex-1 bg-[#C41E3A]" />
            <div className="flex-1 bg-[#FFB300]" />
            <div className="flex-1 bg-[#2E7D32]" />
          </div>
          {respondItem && (
            <div className="p-6">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFB300]/20 to-[#FF8800]/20">
                    <MessageSquareIcon className="h-5 w-5 text-[#FF8800]" />
                  </div>
                  Responder solicitud
                </DialogTitle>
              </DialogHeader>

              <div className="mt-4 rounded-lg bg-muted/50 border p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold">{respondItem.codigo}</span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFB300]/10 px-2 py-0.5 text-xs font-medium text-[#FF8800]">
                    {getTipoLabel(respondItem.tipo)}
                  </span>
                </div>
                <p className="text-sm font-medium">
                  De: {usuariosMap.get(respondItem.solicitanteId) ? nombreCompleto(usuariosMap.get(respondItem.solicitanteId)!) : "—"}
                </p>
                {respondItem.descripcion && (
                  <p className="text-sm text-muted-foreground">{respondItem.descripcion}</p>
                )}
                {respondItem.archivoUrl && (
                  <button
                    type="button"
                    className="flex items-center gap-2 text-sm text-[#FF8800] hover:underline"
                    onClick={() => openFileViewer(respondItem.archivoUrl!, respondItem.archivoNombre ?? "Archivo", respondItem.archivoTipo ?? "")}
                  >
                    <PaperclipIcon className="h-3.5 w-3.5" />
                    {respondItem.archivoNombre ?? "Ver adjunto"}
                  </button>
                )}
              </div>

              <form onSubmit={handleRespond} className="space-y-4 mt-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Decisión *</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { value: "en_revision", label: "En revisión", icon: SearchIcon },
                      { value: "aprobado", label: "Aprobar", icon: CheckCircle2Icon },
                      { value: "rechazado", label: "Rechazar", icon: XCircleIcon },
                    ] as const).map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`flex flex-col items-center gap-1 rounded-lg border-2 p-3 cursor-pointer transition-all hover:bg-accent ${
                          respondEstado === opt.value
                            ? opt.value === "en_revision"
                              ? "border-blue-400 bg-blue-50 text-blue-700 shadow-sm dark:border-blue-600 dark:bg-blue-950/40 dark:text-blue-300"
                              : opt.value === "aprobado"
                                ? "border-green-400 bg-green-50 text-green-700 shadow-sm dark:border-green-600 dark:bg-green-950/40 dark:text-green-300"
                                : "border-red-400 bg-red-50 text-red-700 shadow-sm dark:border-red-600 dark:bg-red-950/40 dark:text-red-300"
                            : "border-border"
                        }`}
                        onClick={() => setRespondEstado(opt.value)}
                      >
                        <opt.icon className={`h-5 w-5 transition-transform ${respondEstado === opt.value ? "scale-110" : ""}`} />
                        <span className="text-xs font-medium">{opt.label}</span>
                      </button>
                    ))}
                    <input type="hidden" name="estado" value={respondEstado} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Respuesta</Label>
                  <textarea
                    name="respuesta"
                    rows={3}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm resize-none transition-colors focus:border-[#FFB300] focus:ring-1 focus:ring-[#FFB300]/30 outline-none"
                    placeholder="Escriba su respuesta..."
                    defaultValue={respondItem.respuesta ?? ""}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Observaciones</Label>
                  <textarea
                    name="observaciones"
                    rows={2}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm resize-none transition-colors focus:border-[#FFB300] focus:ring-1 focus:ring-[#FFB300]/30 outline-none"
                    placeholder="Observaciones adicionales..."
                    defaultValue={respondItem.observaciones ?? ""}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <Button type="button" variant="outline" onClick={() => setRespondOpen(false)} className="rounded-lg">Cancelar</Button>
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000] gap-2 rounded-lg font-semibold shadow-md shadow-[#FFB300]/20"
                  >
                    <MessageSquareIcon className="h-4 w-4" />
                    {isPending ? "Enviando..." : "Enviar respuesta"}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="p-0 gap-0 overflow-hidden rounded-2xl max-w-lg border-0 shadow-2xl">
          <div className="flex h-1.5 w-full">
            <div className="flex-1 bg-[#C41E3A]" />
            <div className="flex-1 bg-[#FFB300]" />
            <div className="flex-1 bg-[#2E7D32]" />
          </div>
          {detailItem && (
            <div className="max-h-[80vh] overflow-y-auto">
              <div className="p-6 pb-4">
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <DialogTitle className="flex items-center gap-2 text-lg">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFB300]/20 to-[#FF8800]/20">
                        <ClipboardListIcon className="h-5 w-5 text-[#FF8800]" />
                      </div>
                      {detailItem.codigo}
                    </DialogTitle>
                    <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold bg-muted border">
                      {getEstadoIcon(detailItem.estado)}
                      {getEstadoLabel(detailItem.estado)}
                    </div>
                  </div>
                </DialogHeader>
              </div>

              <div className="px-6 pb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-muted/40 p-3">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Tipo</span>
                    <p className="font-semibold text-sm mt-0.5">{getTipoLabel(detailItem.tipo)}</p>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-3">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Prioridad</span>
                    <div className="mt-1"><StatusBadge status={detailItem.prioridad as "alta" | "media" | "baja"} /></div>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-3">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Solicitante</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FFB300]/20 text-[10px] font-bold text-[#FF8800]">
                        {usuariosMap.get(detailItem.solicitanteId) ? `${usuariosMap.get(detailItem.solicitanteId)!.firstName[0]}${usuariosMap.get(detailItem.solicitanteId)!.lastNamePaternal[0]}` : "?"}
                      </div>
                      <span className="font-medium text-sm">
                        {usuariosMap.get(detailItem.solicitanteId) ? nombreCompleto(usuariosMap.get(detailItem.solicitanteId)!) : "—"}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-3">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Dirigido a</span>
                    <div className="flex items-center gap-2 mt-1">
                      {detailItem.destinatarioId && usuariosMap.get(detailItem.destinatarioId) ? (
                        <>
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-[10px] font-bold text-blue-600">
                            {`${usuariosMap.get(detailItem.destinatarioId)!.firstName[0]}${usuariosMap.get(detailItem.destinatarioId)!.lastNamePaternal[0]}`}
                          </div>
                          <span className="font-medium text-sm">{nombreCompleto(usuariosMap.get(detailItem.destinatarioId)!)}</span>
                        </>
                      ) : <span className="text-sm text-muted-foreground">Sin asignar</span>}
                    </div>
                  </div>
                </div>

                <div className="mt-3 rounded-lg bg-muted/40 p-3">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Fecha de creación</span>
                  <p className="text-sm mt-0.5">
                    {detailItem.createdAt.toLocaleDateString("es-BO", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>

              {detailItem.descripcion && (
                <div className="px-6 pb-4">
                  <div className="rounded-lg border p-3">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Descripción / Motivo</span>
                    <p className="text-sm mt-1.5 whitespace-pre-wrap leading-relaxed">{detailItem.descripcion}</p>
                  </div>
                </div>
              )}

              {detailItem.observaciones && (
                <div className="px-6 pb-4">
                  <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-3">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600">Observaciones</span>
                    <p className="text-sm mt-1.5 whitespace-pre-wrap">{detailItem.observaciones}</p>
                  </div>
                </div>
              )}

              {detailItem.respuesta && (
                <div className="px-6 pb-4">
                  <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20 p-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <MessageSquareIcon className="h-3.5 w-3.5 text-green-600" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-green-600">Respuesta</span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{detailItem.respuesta}</p>
                  </div>
                </div>
              )}

              {detailItem.archivoUrl && (
                <div className="px-6 pb-6">
                  <div className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50">
                    {getFileViewerIcon(detailItem.archivoTipo)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{detailItem.archivoNombre}</p>
                      <p className="text-xs text-muted-foreground uppercase">{detailItem.archivoTipo}</p>
                    </div>
                    <div className="flex gap-1">
                      {canPreview(detailItem.archivoTipo) && (
                        <button
                          type="button"
                          title="Visualizar"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-all hover:bg-[#FFB300]/10 hover:border-[#FFB300]/40 hover:text-[#FF8800]"
                          onClick={() => openFileViewer(detailItem.archivoUrl!, detailItem.archivoNombre ?? "Archivo", detailItem.archivoTipo ?? "")}
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                      )}
                      <a
                        href={detailItem.archivoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Descargar"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-all hover:bg-accent"
                      >
                        <DownloadIcon className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {detailItem.destinatarioId === currentUserId && (detailItem.estado === "pendiente" || detailItem.estado === "en_revision") && (
                <div className="px-6 pb-6">
                  <Button
                    className="w-full bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000] gap-2 rounded-lg font-semibold shadow-md shadow-[#FFB300]/20"
                    onClick={() => { setDetailOpen(false); openRespond(detailItem) }}
                  >
                    <MessageSquareIcon className="h-4 w-4" />
                    Responder esta solicitud
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={fileViewerOpen} onOpenChange={setFileViewerOpen}>
        <DialogContent className="p-0 gap-0 overflow-hidden rounded-2xl max-w-4xl w-[90vw] h-[85vh] border-0 shadow-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>{fileViewerName || "Visor de archivos"}</DialogTitle>
          </DialogHeader>
          <div className="flex h-1.5 w-full">
            <div className="flex-1 bg-[#C41E3A]" />
            <div className="flex-1 bg-[#FFB300]" />
            <div className="flex-1 bg-[#2E7D32]" />
          </div>
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
              <div className="flex items-center gap-2 min-w-0">
                {getFileViewerIcon(fileViewerType)}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{fileViewerName}</p>
                  <p className="text-xs text-muted-foreground uppercase">{fileViewerType}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <a
                  href={fileViewerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors hover:bg-accent"
                >
                  <DownloadIcon className="h-4 w-4" />
                  Descargar
                </a>
              </div>
            </div>
            <div className="flex-1 overflow-hidden bg-muted/20">
              {fileViewerType === "pdf" ? (
                <iframe src={fileViewerUrl} className="w-full h-full border-0" title={fileViewerName} />
              ) : ["jpg", "jpeg", "png", "webp"].includes(fileViewerType.toLowerCase()) ? (
                <div className="flex items-center justify-center h-full p-4">
                  <img src={fileViewerUrl} alt={fileViewerName} className="max-w-full max-h-full object-contain rounded-lg shadow-lg" />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  {getFileViewerIcon(fileViewerType)}
                  <p className="text-sm text-muted-foreground">Vista previa no disponible para este tipo de archivo</p>
                  <a
                    href={fileViewerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000] px-4 py-2 text-sm font-semibold"
                  >
                    <DownloadIcon className="h-4 w-4" />
                    Descargar archivo
                  </a>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
