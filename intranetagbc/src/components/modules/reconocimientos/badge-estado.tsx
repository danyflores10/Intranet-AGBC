import type { EstadoReconocimiento } from "@/lib/validations/reconocimientos"
import { LABEL_ESTADO } from "@/lib/validations/reconocimientos"

const ESTILOS: Record<EstadoReconocimiento, string> = {
  borrador: "bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-zinc-800/80 dark:text-zinc-300 dark:ring-zinc-700",
  pendiente: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30",
  publicado: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30",
  rechazado: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-500/30",
  archivado: "bg-zinc-900/90 text-zinc-100 ring-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:ring-zinc-700",
}

export function BadgeEstado({ estado }: { estado: EstadoReconocimiento }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ${ESTILOS[estado]}`}
    >
      {LABEL_ESTADO[estado]}
    </span>
  )
}
