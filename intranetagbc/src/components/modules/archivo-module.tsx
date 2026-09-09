"use client"

import { useMemo, useTransition } from "react"
import {
  RotateCcwIcon,
  Trash2Icon,
  ArchiveIcon,
  FileTextIcon,
  CheckCircle2Icon,
  SparklesIcon,
} from "lucide-react"
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
        toast.success("Eliminado definitivamente")
      } catch {
        toast.error("No se pudo eliminar de la papelera")
      }
    })
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 bg-gradient-to-br from-slate-50 via-blue-50/25 to-amber-50/20 min-h-screen">
      {/* ── Encabezado Institucional ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-3xl border-2 border-[#002F6C]/15 bg-gradient-to-r from-white via-blue-50/30 to-amber-50/30 p-6 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0E5296] text-[#FFCC00] shadow-md ring-2 ring-[#0E5296]/20">
            <ArchiveIcon className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-[#002F6C]">
                Papelera de Documentos
              </h1>
              <span className="rounded-full bg-[#0E5296] text-[#FFCC00] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
                AGBC
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Documentos eliminados del repositorio. Puedes restaurarlos a su estado original o purgarlos definitivamente.
            </p>
          </div>
        </div>
      </div>

      {/* ── Tarjetas Métricas Pastel Amarillo y Azul ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3.5 rounded-2xl border-2 border-sky-200/90 bg-gradient-to-br from-sky-50 via-blue-50/60 to-white p-4 shadow-xs">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0E5296] text-[#FFCC00]">
            <ArchiveIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#002F6C]">{totalPapelera}</div>
            <div className="text-xs text-slate-600 font-bold">Total en Papelera</div>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border-2 border-amber-200/90 bg-gradient-to-br from-amber-50 via-yellow-50/60 to-white p-4 shadow-xs">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFCC00] text-[#002F6C]">
            <CheckCircle2Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#002F6C]">{papeleraConArchivo}</div>
            <div className="text-xs text-slate-600 font-bold">Con Archivo Adjunto</div>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border-2 border-blue-200/90 bg-gradient-to-br from-blue-50 via-sky-50/50 to-white p-4 shadow-xs">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-200 text-[#002F6C]">
            <SparklesIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#002F6C]">{papeleraSinArchivo}</div>
            <div className="text-xs text-slate-600 font-bold">Sin Archivo Adjunto</div>
          </div>
        </div>
      </div>

      {/* ── Tabla Estructurada ── */}
      <div className="rounded-3xl border-2 border-[#002F6C]/15 bg-white p-4 shadow-sm overflow-hidden">
        <DataTable
          data={papeleraData}
          searchKey="titulo"
          searchPlaceholder="Buscar en papelera..."
          columns={[
            {
              key: "titulo",
              label: "Documento",
              render: (row) => (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFCC00] text-[#002F6C] font-black shadow-xs">
                    <FileTextIcon className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[#002F6C] truncate">{row.titulo}</p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {row.nombreArchivo ?? "Sin archivo adjunto"}
                    </p>
                  </div>
                </div>
              ),
            },
            {
              key: "categoria",
              label: "Categoría",
              render: (row) => (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                  {row.categoria || "Sin categoría"}
                </span>
              ),
            },
            { key: "autor", label: "Autor" },
            { key: "fechaOriginal", label: "Fecha Creación" },
            { key: "fechaEliminado", label: "Fecha Eliminación" },
            {
              key: "estadoOriginal",
              label: "Estado Previo",
              render: (row) =>
                ESTADOS_DOCUMENTO_VALIDOS.has(row.estadoOriginal) ? (
                  <StatusBadge
                    status={row.estadoOriginal as "publicado" | "pendiente" | "borrador"}
                  />
                ) : (
                  <span className="text-xs text-slate-500 font-bold">{row.estadoOriginal}</span>
                ),
            },
          ]}
          actions={(row) => (
            <div className="flex items-center justify-end gap-1.5">
              <button
                type="button"
                title="Restaurar documento"
                disabled={isPending}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                onClick={() => handleRestoreFromPapelera(row.papeleraId, row.titulo)}
              >
                <RotateCcwIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                title="Eliminar definitivamente"
                disabled={isPending}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                onClick={() => handleDeleteFromPapelera(row.papeleraId)}
              >
                <Trash2Icon className="h-4 w-4" />
              </button>
            </div>
          )}
        />
      </div>
    </div>
  )
}

