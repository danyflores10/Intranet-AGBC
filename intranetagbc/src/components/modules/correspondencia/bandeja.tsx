"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertTriangleIcon,
  ArchiveIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  EyeIcon,
  FlameIcon,
  ForwardIcon,
  InboxIcon,
  MailIcon,
  MailOpenIcon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  SendIcon,
  Trash2Icon,
  UserIcon,
} from "lucide-react"
import toast from "react-hot-toast"

import { DataTable } from "@/components/dashboard/data-table"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  eliminarCorrespondencia,
  marcarLeidoCorrespondencia,
} from "@/actions/correspondencia"
import {
  BadgeEstado,
  BadgePrioridad,
  CorrespondenciaRow,
  formatearFecha,
  vencido,
} from "./shared"

type FiltroBandeja =
  | "todas"
  | "recibidos"
  | "enviados"
  | "asignadosAMi"
  | "pendientes"
  | "derivados"
  | "urgentes"
  | "vencidos"
  | "archivadas"
  | "finalizados"

const FILTROS: Array<{ key: FiltroBandeja; label: string; icon: React.ElementType }> = [
  { key: "todas", label: "Todas", icon: ClipboardListIcon },
  { key: "recibidos", label: "Recibidos", icon: InboxIcon },
  { key: "enviados", label: "Enviados", icon: SendIcon },
  { key: "asignadosAMi", label: "Asignados a mí", icon: UserIcon },
  { key: "pendientes", label: "Pendientes", icon: RefreshCwIcon },
  { key: "derivados", label: "Derivados", icon: ForwardIcon },
  { key: "urgentes", label: "Urgentes", icon: FlameIcon },
  { key: "vencidos", label: "Vencidos", icon: AlertTriangleIcon },
  { key: "finalizados", label: "Finalizados", icon: CheckCircle2Icon },
  { key: "archivadas", label: "Archivadas", icon: ArchiveIcon },
]

interface Props {
  bandeja: Record<Exclude<FiltroBandeja, "todas">, CorrespondenciaRow[]> & {
    todas: CorrespondenciaRow[]
  }
  conteos: Record<FiltroBandeja, number>
  puedeCrear: boolean
  puedeEditar: boolean
  puedeEliminar: boolean
  puedeDerivar: boolean
}

export function CorrespondenciaBandeja({ bandeja, conteos, puedeCrear, puedeEditar, puedeEliminar, puedeDerivar }: Props) {
  const router = useRouter()
  const [filtro, setFiltro] = useState<FiltroBandeja>("todas")
  const [isPending, startTransition] = useTransition()

  const data = useMemo(() => {
    const list = bandeja[filtro] ?? []
    return list.map((c) => ({
      ...c,
      fecha: formatearFecha(c.createdAt),
      plazo: c.plazoAtencion ? formatearFecha(c.plazoAtencion) : "—",
      isVencido: vencido(c),
    }))
  }, [bandeja, filtro])

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Bandeja de correspondencia</h2>
          <p className="text-sm text-muted-foreground">
            Gestione recepción, derivaciones, urgencias y archivo
          </p>
        </div>
        {puedeCrear && (
          <Link href="/correspondencia/registrar">
            <Button className="gap-2 bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000] shadow-md shadow-[#FFB300]/20">
              <PlusIcon className="h-4 w-4" />
              Registrar correspondencia
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {FILTROS.slice(0, 5).map((f) => (
          <Card
            key={f.key}
            className={`cursor-pointer border-border/40 transition-colors ${
              filtro === f.key ? "border-[#FFB300] bg-[#FFB300]/5" : "hover:bg-muted/30"
            }`}
            onClick={() => setFiltro(f.key)}
          >
            <CardContent className="flex items-center gap-3 p-3">
              <f.icon className="h-4 w-4 text-[#FF8800]" />
              <div>
                <div className="text-lg font-bold">{conteos[f.key]}</div>
                <div className="text-xs text-muted-foreground">{f.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTROS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFiltro(f.key)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              filtro === f.key
                ? "border-[#FFB300] bg-[#FFB300]/10 text-[#FF8800]"
                : "border-border/50 bg-card text-muted-foreground hover:border-[#FFB300]/30"
            }`}
          >
            <f.icon className="h-3.5 w-3.5" />
            {f.label}
            <span className="ml-1 rounded-full bg-muted px-1.5 text-[10px] font-bold">
              {conteos[f.key]}
            </span>
          </button>
        ))}
      </div>

      <DataTable
        data={data}
        searchKey="asunto"
        searchPlaceholder="Buscar por asunto..."
        columns={[
          {
            key: "hojaRuta",
            label: "Hoja de ruta",
            className: "w-40",
            render: (row) => (
              <div className="flex items-center gap-2">
                {row.leido ? (
                  <MailOpenIcon className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <MailIcon className="h-4 w-4 text-[#FFB300]" />
                )}
                <span className={`font-mono text-xs ${!row.leido ? "font-bold" : ""}`}>
                  {row.hojaRuta}
                </span>
              </div>
            ),
          },
          {
            key: "asunto",
            label: "Asunto",
            render: (row) => (
              <div>
                <div className={`max-w-md truncate text-sm ${!row.leido ? "font-semibold" : ""}`}>
                  {row.asunto}
                </div>
                {row.destinoArea && (
                  <div className="text-xs text-muted-foreground">→ {row.destinoArea}</div>
                )}
              </div>
            ),
          },
          { key: "remitente", label: "Remitente" },
          {
            key: "tipo",
            label: "Tipo",
            render: (row) => (
              <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                {row.tipo}
              </span>
            ),
          },
          { key: "fecha", label: "Recepción" },
          {
            key: "plazo",
            label: "Plazo",
            render: (row) => (
              <span className={row.isVencido ? "font-semibold text-red-500" : ""}>
                {row.plazo}
              </span>
            ),
          },
          { key: "prioridad", label: "Prior.", render: (row) => <BadgePrioridad prioridad={row.prioridad} /> },
          { key: "estado", label: "Estado", render: (row) => <BadgeEstado estado={row.estado} /> },
        ]}
        actions={(row) => (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              title="Ver detalle"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-card/80 text-muted-foreground transition-all hover:border-[#FFB300]/40 hover:bg-[#FFB300]/10 hover:text-[#FF8800] active:scale-95"
              onClick={() => router.push(`/correspondencia/seguimiento?id=${row.id}`)}
            >
              <EyeIcon className="h-4 w-4" />
            </button>
            {puedeEditar && row.estado !== "archivado" && row.estado !== "finalizado" && (
              <Link
                href={`/correspondencia/editar?id=${row.id}`}
                title="Editar"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-card/80 text-muted-foreground transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:border-blue-500/30 dark:hover:bg-blue-500/10 dark:hover:text-blue-400 active:scale-95"
              >
                <PencilIcon className="h-4 w-4" />
              </Link>
            )}
            {!row.leido && (
              <button
                type="button"
                title="Marcar como leído"
                disabled={isPending}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-card/80 text-muted-foreground transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:border-blue-500/30 dark:hover:bg-blue-500/10 dark:hover:text-blue-400 active:scale-95 disabled:opacity-50"
                onClick={() =>
                  startTransition(async () => {
                    await marcarLeidoCorrespondencia(row.id)
                    toast.success("Marcado como leído")
                  })
                }
              >
                <MailOpenIcon className="h-4 w-4" />
              </button>
            )}
            {puedeDerivar && row.estado !== "archivado" && row.estado !== "finalizado" && (
              <Link
                href={`/correspondencia/derivaciones?id=${row.id}`}
                title="Derivar"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-card/80 text-muted-foreground transition-all hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600 dark:hover:border-violet-500/30 dark:hover:bg-violet-500/10 dark:hover:text-violet-400 active:scale-95"
              >
                <ForwardIcon className="h-4 w-4" />
              </Link>
            )}
            {puedeEliminar && (
              <button
                type="button"
                title="Eliminar"
                disabled={isPending}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-card/80 text-muted-foreground transition-all hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-400 active:scale-95 disabled:opacity-50"
                onClick={() =>
                  startTransition(async () => {
                    if (!confirm("¿Eliminar esta correspondencia?")) return
                    await eliminarCorrespondencia(row.id)
                    toast.success("Correspondencia eliminada")
                  })
                }
              >
                <Trash2Icon className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      />
    </div>
  )
}
