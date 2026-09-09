"use client"

import toast from "react-hot-toast"
import { AlertTriangleIcon, CheckIcon, XIcon, Trash2Icon, ArchiveIcon } from "lucide-react"

type Tono = "peligro" | "advertencia" | "info"

type Opciones = {
  titulo: string
  mensaje?: string
  confirmarTexto?: string
  cancelarTexto?: string
  tono?: Tono
  icon?: "alerta" | "eliminar" | "archivar"
}

const TONOS: Record<Tono, { bg: string; ring: string; btn: string }> = {
  peligro: {
    bg: "bg-red-50 dark:bg-red-500/10",
    ring: "ring-red-200 dark:ring-red-500/30",
    btn: "bg-red-600 hover:bg-red-700 text-white shadow-red-600/20",
  },
  advertencia: {
    bg: "bg-amber-50 dark:bg-amber-500/10",
    ring: "ring-amber-200 dark:ring-amber-500/30",
    btn: "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20",
  },
  info: {
    bg: "bg-[#FFB800]/10",
    ring: "ring-[#FFB800]/30",
    btn: "bg-[#0E5296] hover:bg-[#002F6C] text-white shadow-[#0E5296]/25",
  },
}

const ICONS = {
  alerta: AlertTriangleIcon,
  eliminar: Trash2Icon,
  archivar: ArchiveIcon,
}

/**
 * Muestra un toast de confirmación y devuelve una Promise<boolean>.
 * Reemplazo profesional de window.confirm().
 */
export function confirmarToast(opciones: Opciones): Promise<boolean> {
  const {
    titulo,
    mensaje,
    confirmarTexto = "Aceptar",
    cancelarTexto = "Cancelar",
    tono = "peligro",
    icon = "alerta",
  } = opciones

  const estilos = TONOS[tono]
  const Icon = ICONS[icon] ?? AlertTriangleIcon

  return new Promise<boolean>((resolve) => {
    const id = toast.custom(
      (t) => (
        <div
          className={`pointer-events-auto flex w-full max-w-md overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl shadow-black/15 ring-1 ${estilos.ring} ${
            t.visible
              ? "animate-in fade-in zoom-in-95 slide-in-from-top-3"
              : "animate-out fade-out zoom-out-95 slide-out-to-top-3"
          }`}
        >
          <div className="flex flex-1 items-start gap-3 p-4">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${estilos.bg}`}
            >
              <Icon
                className={`h-5 w-5 ${
                  tono === "peligro"
                    ? "text-red-600"
                    : tono === "advertencia"
                      ? "text-amber-600"
                      : "text-[#FF8800]"
                }`}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-foreground">{titulo}</p>
              {mensaje && (
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{mensaje}</p>
              )}
              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    toast.dismiss(id)
                    resolve(false)
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  <XIcon className="h-3.5 w-3.5" />
                  {cancelarTexto}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    toast.dismiss(id)
                    resolve(true)
                  }}
                  className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold shadow-md transition-all hover:shadow-lg ${estilos.btn}`}
                >
                  <CheckIcon className="h-3.5 w-3.5" />
                  {confirmarTexto}
                </button>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        position: "top-center",
      },
    )
  })
}
