"use client"

import { useMemo, useTransition } from "react"
import { RotateCcwIcon, Trash2Icon } from "lucide-react"
import toast from "react-hot-toast"

import { DataTable } from "@/components/dashboard/data-table"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  eliminarRegistroPapelera,
  restaurarDocumentoDesdePapelera,
} from "@/actions/archivo"

interface PapeleraDocumentoRow {
  papeleraId: string
  documentoId: string
  titulo: string
  categoria: string | null
  autor: string
  estadoOriginal: string
  archivo: string | null
  nombreArchivo: string | null
  tipoArchivo: string | null
  tamano: string | null
  eliminadoAt: Date
  createdAt: Date
}

interface Props {
  papeleraDocumentos: PapeleraDocumentoRow[]
}

const ESTADOS_DOCUMENTO_VALIDOS = new Set(["publicado", "pendiente", "borrador"])

export function ArchivoModule({ papeleraDocumentos }: Props) {
  const [isPending, startTransition] = useTransition()

  const totalPapelera = papeleraDocumentos.length
  const papeleraConArchivo = papeleraDocumentos.filter((d) => Boolean(d.archivo)).length
  const papeleraSinArchivo = totalPapelera - papeleraConArchivo

  const papeleraData = useMemo(
    () =>
      papeleraDocumentos.map((item) => ({
        ...item,
        fechaEliminado: item.eliminadoAt.toLocaleDateString("es-BO"),
        fechaOriginal: item.createdAt.toLocaleDateString("es-BO"),
      })),
    [papeleraDocumentos],
  )

  function handleRestoreFromPapelera(papeleraId: string, titulo: string) {
    startTransition(async () => {
      try {
        await restaurarDocumentoDesdePapelera(papeleraId)
        toast.success(`Restaurado: ${titulo}`)
      } catch {
        toast.error("No se pudo restaurar el documento")
      }
    })
  }

  function handleDeleteFromPapelera(papeleraId: string) {
    startTransition(async () => {
      try {
        await eliminarRegistroPapelera(papeleraId)
        toast.success("Eliminado de la papelera")
      } catch {
        toast.error("No se pudo eliminar de la papelera")
      }
    })
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Papelera</h2>
        <p className="text-sm text-muted-foreground">
          Documentos eliminados desde el módulo de documentos. Puedes restaurarlos.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/40">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{totalPapelera}</div>
            <div className="text-xs text-muted-foreground">Total en papelera</div>
          </CardContent>
        </Card>
        <Card className="border-border/40">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{papeleraConArchivo}</div>
            <div className="text-xs text-muted-foreground">Con archivo adjunto</div>
          </CardContent>
        </Card>
        <Card className="border-border/40">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-amber-500">{papeleraSinArchivo}</div>
            <div className="text-xs text-muted-foreground">Sin archivo adjunto</div>
          </CardContent>
        </Card>
      </div>

      <DataTable
        data={papeleraData}
        searchKey="titulo"
        searchPlaceholder="Buscar en papelera..."
        columns={[
          {
            key: "titulo",
            label: "Documento",
            render: (row) => (
              <div className="min-w-0">
                <p className="font-medium truncate">{row.titulo}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {row.nombreArchivo ?? "Sin archivo"}
                </p>
              </div>
            ),
          },
          {
            key: "categoria",
            label: "Categoría",
            render: (row) => row.categoria || "Sin categoría",
          },
          { key: "autor", label: "Autor" },
          { key: "fechaOriginal", label: "Fecha documento" },
          { key: "fechaEliminado", label: "Eliminado" },
          {
            key: "estadoOriginal",
            label: "Estado original",
            render: (row) =>
              ESTADOS_DOCUMENTO_VALIDOS.has(row.estadoOriginal) ? (
                <StatusBadge
                  status={row.estadoOriginal as "publicado" | "pendiente" | "borrador"}
                />
              ) : (
                <span className="text-xs text-muted-foreground">{row.estadoOriginal}</span>
              ),
          },
        ]}
        actions={(row) => (
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              title="Restaurar"
              disabled={isPending}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-card/80 text-muted-foreground shadow-sm transition-all duration-200 hover:border-green-300 hover:bg-green-50 hover:text-green-600 hover:shadow-md dark:hover:border-green-500/30 dark:hover:bg-green-500/10 dark:hover:text-green-400 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
              onClick={() => handleRestoreFromPapelera(row.papeleraId, row.titulo)}
            >
              <RotateCcwIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Eliminar definitivo"
              disabled={isPending}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/50 bg-card/80 text-muted-foreground shadow-sm transition-all duration-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 hover:shadow-md dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-400 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
              onClick={() => handleDeleteFromPapelera(row.papeleraId)}
            >
              <Trash2Icon className="h-4 w-4" />
            </button>
          </div>
        )}
      />
    </div>
  )
}
