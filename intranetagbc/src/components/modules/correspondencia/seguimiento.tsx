"use client"

import { useMemo, useRef, useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArchiveIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  DownloadIcon,
  EyeIcon,
  FileIcon,
  FileTextIcon,
  ImageIcon,
  PaperclipIcon,
  XIcon,
} from "lucide-react"
import toast from "react-hot-toast"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  archivarCorrespondencia,
  cambiarEstadoCorrespondencia,
} from "@/actions/correspondencia"
import {
  ESTADOS_CORRESPONDENCIA,
  type EstadoCorrespondencia,
} from "@/lib/correspondencia-constants"
import {
  BadgeEstado,
  BadgePrioridad,
  CorrespondenciaRow,
  IconoEstado,
  formatearFecha,
  formatearFechaHora,
  nombreCompleto,
} from "./shared"

type Movimiento = {
  id: string
  correspondenciaId: string
  fromUserId: string | null
  toUserId: string | null
  fromArea: string | null
  toArea: string | null
  estadoAnterior: string | null
  estadoNuevo: string
  accion: string
  instrucciones: string | null
  comentario: string | null
  prioridad: string | null
  plazoAtencion: Date | null
  creadoPor: string | null
  createdAt: Date
}

type Adjunto = {
  id: string
  archivoNombre: string
  archivoUrl: string
  archivoTipo: string
  archivoTamano: number
  movimientoId: string | null
  createdAt: Date
}

type Detalle = CorrespondenciaRow & {
  movimientos: Movimiento[]
  adjuntos: Adjunto[]
}

type UsuarioBasico = {
  id: string
  firstName: string
  lastNamePaternal: string
  lastNameMaternal: string | null
  institutionalEmail: string
  image: string | null
}

interface Props {
  items: Detalle[]
  usuarios: UsuarioBasico[]
  puedeArchivar: boolean
  puedeEditar: boolean
}

function iconoArchivo(tipo: string) {
  if (tipo === "pdf") return <FileTextIcon className="h-5 w-5 text-red-500" />
  if (["jpg", "jpeg", "png"].includes(tipo)) return <ImageIcon className="h-5 w-5 text-blue-500" />
  return <FileIcon className="h-5 w-5 text-[#FFB300]" />
}

export function CorrespondenciaSeguimiento({ items, usuarios, puedeArchivar, puedeEditar }: Props) {
  const router = useRouter()
  const params = useSearchParams()
  const idParam = params.get("id")
  const [overrideId, setOverrideId] = useState<string | null>(null)
  const seleccionadaId = overrideId ?? idParam ?? items[0]?.id ?? ""
  const [nuevoEstado, setNuevoEstado] = useState<EstadoCorrespondencia>("en_revision")
  const [comentario, setComentario] = useState("")
  const [archivo, setArchivo] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()

  const usuariosMap = useMemo(() => new Map(usuarios.map((u) => [u.id, u])), [usuarios])

  const seleccionada = useMemo(
    () => items.find((i) => i.id === seleccionadaId) ?? null,
    [items, seleccionadaId],
  )

  function nombrePor(id: string | null): string {
    if (!id) return "—"
    return nombreCompleto(usuariosMap.get(id))
  }

  async function handleCambioEstado() {
    if (!seleccionada) return
    if (nuevoEstado === "finalizado" && !comentario.trim()) {
      toast.error("Para finalizar debe dejar un comentario")
      return
    }
    startTransition(async () => {
      try {
        let adjuntoData: { url: string; nombre: string; tipo: string; tamano: number } | undefined
        if (archivo) {
          const upload = new FormData()
          upload.append("archivo", archivo)
          const resp = await fetch("/api/upload/correspondencia", {
            method: "POST",
            body: upload,
          })
          if (!resp.ok) {
            const err = await resp.json().catch(() => ({}))
            toast.error(err?.error ?? "Error al subir archivo")
            return
          }
          const r = await resp.json()
          adjuntoData = { url: r.url, nombre: r.nombre, tipo: r.tipo, tamano: r.tamano }
        }

        await cambiarEstadoCorrespondencia({
          correspondenciaId: seleccionada.id,
          nuevoEstado,
          comentario: comentario.trim() || undefined,
          adjunto: adjuntoData,
        })
        toast.success("Estado actualizado")
        setComentario("")
        setArchivo(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al actualizar")
      }
    })
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Seguimiento y trazabilidad</h2>
        <p className="text-sm text-muted-foreground">
          Cambie estados, adjunte respuestas y revise el historial completo
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
        <Card className="border-border/40">
          <CardContent className="p-0">
            <div className="border-b p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Correspondencia ({items.length})
            </div>
            <div className="max-h-[75vh] divide-y overflow-y-auto">
              {items.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">No hay registros.</p>
              ) : (
                items.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setOverrideId(c.id)}
                    className={`w-full p-3 text-left text-sm transition-colors hover:bg-muted/40 ${
                      seleccionadaId === c.id ? "bg-[#FFB300]/10" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold">{c.hojaRuta}</span>
                      <BadgeEstado estado={c.estado} />
                    </div>
                    <p className="mt-1 line-clamp-2 font-medium">{c.asunto}</p>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{formatearFecha(c.createdAt)}</span>
                      <BadgePrioridad prioridad={c.prioridad} />
                    </div>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {seleccionada ? (
            <>
              <Card className="border-border/40">
                <CardContent className="p-0">
                  <div className="flex h-1.5 w-full">
                    <div className="flex-1 bg-[#C41E3A]" />
                    <div className="flex-1 bg-[#FFB300]" />
                    <div className="flex-1 bg-[#2E7D32]" />
                  </div>
                  <div className="space-y-4 p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-xs font-bold">{seleccionada.hojaRuta}</span>
                        <h3 className="mt-1 text-lg font-bold">{seleccionada.asunto}</h3>
                      </div>
                      <BadgeEstado estado={seleccionada.estado} />
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-lg bg-muted/40 p-3">
                        <div className="text-[10px] font-semibold uppercase text-muted-foreground">
                          Remitente
                        </div>
                        <div className="font-medium">{seleccionada.remitente}</div>
                      </div>
                      <div className="rounded-lg bg-muted/40 p-3">
                        <div className="text-[10px] font-semibold uppercase text-muted-foreground">
                          Destinatario
                        </div>
                        <div className="font-medium">
                          {seleccionada.destinatario ?? nombrePor(seleccionada.destinatarioUserId ?? null)}
                        </div>
                      </div>
                      <div className="rounded-lg bg-muted/40 p-3">
                        <div className="text-[10px] font-semibold uppercase text-muted-foreground">
                          Área destino
                        </div>
                        <div className="font-medium">{seleccionada.destinoArea ?? "—"}</div>
                      </div>
                      <div className="rounded-lg bg-muted/40 p-3">
                        <div className="text-[10px] font-semibold uppercase text-muted-foreground">
                          Prioridad
                        </div>
                        <div>
                          <BadgePrioridad prioridad={seleccionada.prioridad} />
                        </div>
                      </div>
                      <div className="rounded-lg bg-muted/40 p-3">
                        <div className="text-[10px] font-semibold uppercase text-muted-foreground">
                          Recepción
                        </div>
                        <div className="font-medium">{formatearFecha(seleccionada.fechaRecepcion)}</div>
                      </div>
                      <div className="rounded-lg bg-muted/40 p-3">
                        <div className="text-[10px] font-semibold uppercase text-muted-foreground">
                          Plazo
                        </div>
                        <div className="font-medium">{formatearFecha(seleccionada.plazoAtencion)}</div>
                      </div>
                    </div>

                    {seleccionada.descripcion && (
                      <div className="rounded-lg border p-3">
                        <div className="text-[10px] font-semibold uppercase text-muted-foreground">
                          Descripción
                        </div>
                        <p className="mt-1 whitespace-pre-wrap text-sm">{seleccionada.descripcion}</p>
                      </div>
                    )}

                    {seleccionada.adjuntos.length > 0 && (
                      <div>
                        <div className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">
                          Adjuntos ({seleccionada.adjuntos.length})
                        </div>
                        <div className="grid gap-2">
                          {seleccionada.adjuntos.map((a) => (
                            <div
                              key={a.id}
                              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/40"
                            >
                              {iconoArchivo(a.archivoTipo)}
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">{a.archivoNombre}</p>
                                <p className="text-xs text-muted-foreground uppercase">{a.archivoTipo}</p>
                              </div>
                              <a
                                href={a.archivoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Ver"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-all hover:bg-[#FFB300]/10 hover:text-[#FF8800]"
                              >
                                <EyeIcon className="h-4 w-4" />
                              </a>
                              <a
                                href={a.archivoUrl}
                                download
                                title="Descargar"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-all hover:bg-accent"
                              >
                                <DownloadIcon className="h-4 w-4" />
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {puedeEditar && (
                <Card className="border-border/40">
                  <CardContent className="space-y-4 p-6">
                    <h4 className="text-sm font-semibold">Actualizar estado</h4>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Nuevo estado
                        </Label>
                        <Select
                          value={nuevoEstado}
                          onValueChange={(v) => setNuevoEstado(v as EstadoCorrespondencia)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ESTADOS_CORRESPONDENCIA.filter((e) => e.value !== "registrado" && e.value !== "derivado").map((e) => (
                              <SelectItem key={e.value} value={e.value}>
                                {e.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Adjuntar archivo (opcional)
                        </Label>
                        <div
                          className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-border/60 bg-muted/30 px-3 py-2 text-sm hover:border-[#FFB300]/40"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <PaperclipIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="flex-1 truncate text-muted-foreground">
                            {archivo ? archivo.name : "PDF, JPG, PNG"}
                          </span>
                          {archivo && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setArchivo(null)
                                if (fileInputRef.current) fileInputRef.current.value = ""
                              }}
                              className="text-muted-foreground hover:text-red-500"
                            >
                              <XIcon className="h-4 w-4" />
                            </button>
                          )}
                          <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Comentario {nuevoEstado === "finalizado" && <span className="text-red-500">*</span>}
                      </Label>
                      <textarea
                        value={comentario}
                        onChange={(e) => setComentario(e.target.value)}
                        rows={3}
                        className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-[#FFB300] focus:ring-1 focus:ring-[#FFB300]/30"
                        placeholder="Detalle el avance, observación o respuesta..."
                      />
                    </div>
                    <div className="flex justify-end gap-2 border-t pt-3">
                      {puedeArchivar && seleccionada.estado !== "archivado" && (
                        <Button
                          type="button"
                          variant="outline"
                          className="gap-2"
                          disabled={isPending}
                          onClick={() =>
                            startTransition(async () => {
                              try {
                                await archivarCorrespondencia(seleccionada.id, comentario.trim() || "Archivado")
                                toast.success("Correspondencia archivada")
                              } catch (err) {
                                toast.error(err instanceof Error ? err.message : "Error al archivar")
                              }
                            })
                          }
                        >
                          <ArchiveIcon className="h-4 w-4" />
                          Archivar
                        </Button>
                      )}
                      <Button
                        type="button"
                        disabled={isPending}
                        onClick={handleCambioEstado}
                        className="gap-2 bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000] shadow-md shadow-[#FFB300]/20"
                      >
                        <CheckCircle2Icon className="h-4 w-4" />
                        {isPending ? "Guardando..." : "Aplicar cambio"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="border-border/40">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <ClipboardListIcon className="h-4 w-4 text-[#FF8800]" />
                    <h4 className="text-sm font-semibold">Historial de movimientos</h4>
                  </div>
                  {seleccionada.movimientos.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin movimientos registrados.</p>
                  ) : (
                    <ol className="relative ml-3 space-y-5 border-l border-border pl-6">
                      {seleccionada.movimientos.map((m) => (
                        <li key={m.id} className="relative">
                          <span className="absolute -left-[34px] flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#FFB300] to-[#FF8800] text-white shadow">
                            <IconoEstado estado={m.estadoNuevo} className="h-3.5 w-3.5" />
                          </span>
                          <div className="rounded-lg border p-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                              <div className="flex items-center gap-2">
                                {m.estadoAnterior && (
                                  <>
                                    <BadgeEstado estado={m.estadoAnterior} />
                                    <span className="text-muted-foreground">→</span>
                                  </>
                                )}
                                <BadgeEstado estado={m.estadoNuevo} />
                              </div>
                              <span className="text-muted-foreground">{formatearFechaHora(m.createdAt)}</span>
                            </div>
                            <div className="mt-2 grid gap-1 text-sm">
                              {(m.fromUserId || m.fromArea) && (
                                <span className="text-xs text-muted-foreground">
                                  De: {m.fromArea ?? nombrePor(m.fromUserId)}
                                </span>
                              )}
                              {(m.toUserId || m.toArea) && (
                                <span className="text-xs text-muted-foreground">
                                  Hacia: {m.toArea ?? nombrePor(m.toUserId)}
                                </span>
                              )}
                              {m.creadoPor && (
                                <span className="text-xs text-muted-foreground">
                                  Por: {nombrePor(m.creadoPor)}
                                </span>
                              )}
                              {m.instrucciones && (
                                <p className="mt-1 whitespace-pre-wrap text-sm">
                                  <span className="font-semibold">Instrucciones: </span>
                                  {m.instrucciones}
                                </p>
                              )}
                              {m.comentario && (
                                <p className="mt-1 whitespace-pre-wrap text-sm">
                                  <span className="font-semibold">Comentario: </span>
                                  {m.comentario}
                                </p>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="border-border/40">
              <CardContent className="p-12 text-center text-sm text-muted-foreground">
                Seleccione una correspondencia del listado para ver su seguimiento.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
