"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  TrophyIcon,
  UsersIcon,
  MapPinIcon,
  PlusIcon,
  SearchIcon,
  StarIcon,
  GlobeIcon,
  EyeIcon,
  EditIcon,
  TrashIcon,
  SendIcon,
  CheckIcon,
  ArchiveIcon,
  ArrowLeftIcon,
} from "lucide-react"
import toast from "react-hot-toast"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { confirmarToast } from "@/components/ui/confirm-toast"
import { BadgeEstado } from "./badge-estado"
import {
  archivarReconocimiento,
  eliminarReconocimiento,
  enviarARevisionReconocimiento,
  publicarReconocimiento,
  toggleDestacadoReconocimiento,
  toggleMostrarEnLanding,
  type ReconocimientoListItem,
} from "@/actions/reconocimientos"
import {
  LABEL_TIPO,
  type EstadoReconocimiento,
  type TipoReconocimiento,
} from "@/lib/validations/reconocimientos"

interface Props {
  titulo: string
  tipo: TipoReconocimiento
  items: ReconocimientoListItem[]
  puedeCrear: boolean
  puedeAprobar: boolean
  puedePublicar: boolean
  puedeArchivar: boolean
  puedeDestacar: boolean
  puedeLanding: boolean
  puedeEliminar: boolean
}

const ICONOS: Record<TipoReconocimiento, typeof TrophyIcon> = {
  empleado_mes: TrophyIcon,
  equipo_destacado: UsersIcon,
  logro_sucursal: MapPinIcon,
}

const FILTROS_ESTADO: Array<{ value: "todos" | EstadoReconocimiento; label: string }> = [
  { value: "todos", label: "Todos" },
  { value: "borrador", label: "Borradores" },
  { value: "pendiente", label: "Pendientes" },
  { value: "publicado", label: "Publicados" },
  { value: "rechazado", label: "Rechazados" },
  { value: "archivado", label: "Archivados" },
]

export function ReconocimientosListado({
  titulo,
  tipo,
  items,
  puedeCrear,
  puedePublicar,
  puedeArchivar,
  puedeDestacar,
  puedeLanding,
  puedeEliminar,
}: Props) {
  const router = useRouter()
  const [q, setQ] = useState("")
  const [estado, setEstado] = useState<(typeof FILTROS_ESTADO)[number]["value"]>("todos")
  const [, startTransition] = useTransition()
  const Icon = ICONOS[tipo]

  const filtrados = useMemo(() => {
    const text = q.trim().toLowerCase()
    return items.filter((r) => {
      if (estado !== "todos" && r.estado !== estado) return false
      if (text.length > 0) {
        const hay = [r.titulo, r.subtituloA, r.subtituloB, r.descripcionCorta]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
        if (!hay.includes(text)) return false
      }
      return true
    })
  }, [items, estado, q])

  function run(label: string, fn: () => Promise<unknown>) {
    startTransition(async () => {
      try {
        await fn()
        toast.success(label)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al procesar")
      }
    })
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <Card className="border-border/40">
        <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/reconocimientos"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-card hover:bg-muted transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </Link>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFB300] to-[#FF8800] text-[#1a1000] shadow-md">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight">{titulo}</h1>
              <p className="text-xs text-muted-foreground">
                {items.length} {items.length === 1 ? "registro" : "registros"}
              </p>
            </div>
          </div>
          {puedeCrear && (
            <Link href={`/reconocimientos/nuevo?tipo=${tipo}`}>
              <Button className="bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000] font-bold shadow-md">
                <PlusIcon className="mr-2 h-4 w-4" />
                Nuevo
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card className="border-border/40">
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
          <div className="relative max-w-md flex-1">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, nombre o descripción..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="inline-flex flex-wrap gap-1 rounded-lg bg-muted/50 p-1 text-xs font-semibold">
            {FILTROS_ESTADO.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setEstado(f.value)}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  estado === f.value
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      <Card className="border-border/40 overflow-hidden">
        <CardHeader className="border-b border-border/30 bg-muted/20 py-3">
          <CardTitle className="text-sm">
            {filtrados.length} {filtrados.length === 1 ? "resultado" : "resultados"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filtrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center px-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/50">
                <Icon className="h-10 w-10 text-muted-foreground/25" />
              </div>
              <p className="text-base font-semibold text-muted-foreground">Sin resultados</p>
              <p className="text-xs text-muted-foreground/60">
                {items.length === 0
                  ? "Aún no se ha registrado ningún reconocimiento"
                  : "Prueba cambiando los filtros"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {filtrados.map((r) => (
                <div key={r.id} className="flex items-start gap-4 p-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted/50">
                    {r.imagen ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.imagen} alt={r.titulo} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                        <Icon className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-bold">{r.titulo}</h3>
                      <BadgeEstado estado={r.estado as EstadoReconocimiento} />
                      {r.destacado && (
                        <span className="inline-flex items-center gap-0.5 rounded-md bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold text-red-600 ring-1 ring-red-500/30">
                          <StarIcon className="h-2.5 w-2.5" />
                          Destacado
                        </span>
                      )}
                      {r.mostrarEnLanding && r.estado === "publicado" && (
                        <span className="inline-flex items-center gap-0.5 rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-bold text-blue-600 ring-1 ring-blue-500/30">
                          <GlobeIcon className="h-2.5 w-2.5" />
                          Landing
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {LABEL_TIPO[r.tipo as keyof typeof LABEL_TIPO]}
                      {r.subtituloA ? ` · ${r.subtituloA}` : ""}
                      {r.subtituloB ? ` · ${r.subtituloB}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground/70 line-clamp-2">
                      {r.descripcionCorta}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-1">
                    <Link
                      href={`/reconocimientos/${r.id}`}
                      className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-[11px] font-semibold text-muted-foreground hover:bg-muted"
                      title="Ver detalle"
                    >
                      <EyeIcon className="h-3.5 w-3.5" />
                      Ver
                    </Link>
                    <Link
                      href={`/reconocimientos/${r.id}/editar`}
                      className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-[11px] font-semibold text-[#FF8800] hover:bg-[#FFB300]/10"
                      title="Editar"
                    >
                      <EditIcon className="h-3.5 w-3.5" />
                      Editar
                    </Link>
                    {r.estado === "borrador" && (
                      <button
                        type="button"
                        onClick={() => run("Enviado a revisión", () => enviarARevisionReconocimiento(r.id))}
                        className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-[11px] font-semibold text-amber-600 hover:bg-amber-500/10"
                      >
                        <SendIcon className="h-3.5 w-3.5" />
                        A revisión
                      </button>
                    )}
                    {r.estado === "pendiente" && puedePublicar && (
                      <button
                        type="button"
                        onClick={() => run("Publicado", () => publicarReconocimiento(r.id))}
                        className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-[11px] font-semibold text-emerald-600 hover:bg-emerald-500/10"
                      >
                        <CheckIcon className="h-3.5 w-3.5" />
                        Publicar
                      </button>
                    )}
                    {puedeDestacar && r.estado === "publicado" && (
                      <button
                        type="button"
                        onClick={() => run(r.destacado ? "Quitado de destacados" : "Marcado como destacado", () => toggleDestacadoReconocimiento(r.id))}
                        className={`inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-[11px] font-semibold hover:bg-red-500/10 ${
                          r.destacado ? "text-red-600" : "text-muted-foreground"
                        }`}
                        title="Destacar"
                      >
                        <StarIcon className={`h-3.5 w-3.5 ${r.destacado ? "fill-current" : ""}`} />
                      </button>
                    )}
                    {puedeLanding && r.estado === "publicado" && (
                      <button
                        type="button"
                        onClick={() => run(
                          r.mostrarEnLanding ? "Ocultado en landing" : "Visible en landing",
                          () => toggleMostrarEnLanding(r.id),
                        )}
                        className={`inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-[11px] font-semibold hover:bg-blue-500/10 ${
                          r.mostrarEnLanding ? "text-blue-600" : "text-muted-foreground"
                        }`}
                        title="Mostrar en landing"
                      >
                        <GlobeIcon className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {puedeArchivar && (r.estado === "publicado" || r.estado === "pendiente" || r.estado === "rechazado" || r.estado === "borrador") && (
                      <button
                        type="button"
                        onClick={async () => {
                          const ok = await confirmarToast({
                            titulo: "¿Archivar este reconocimiento?",
                            mensaje: "Dejará de verse en la landing y pasará al histórico.",
                            confirmarTexto: "Archivar",
                            tono: "advertencia",
                            icon: "archivar",
                          })
                          if (!ok) return
                          run("Archivado", () => archivarReconocimiento(r.id))
                        }}
                        className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-[11px] font-semibold text-zinc-600 hover:bg-zinc-500/10"
                      >
                        <ArchiveIcon className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {puedeEliminar && (r.estado === "borrador" || r.estado === "rechazado") && (
                      <button
                        type="button"
                        onClick={async () => {
                          const ok = await confirmarToast({
                            titulo: "¿Eliminar este reconocimiento?",
                            mensaje: "Esta acción es permanente y no se puede deshacer.",
                            confirmarTexto: "Eliminar",
                            tono: "peligro",
                            icon: "eliminar",
                          })
                          if (!ok) return
                          run("Eliminado", () => eliminarReconocimiento(r.id))
                        }}
                        className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-[11px] font-semibold text-red-600 hover:bg-red-500/10"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
