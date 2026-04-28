import {
  AlertTriangleIcon,
  ArchiveIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  FlameIcon,
  ForwardIcon,
  InboxIcon,
  RefreshCwIcon,
  SendIcon,
  XCircleIcon,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  colorEstado,
  colorPrioridad,
  etiquetaEstado,
  etiquetaPrioridad,
} from "@/lib/correspondencia-constants"

export type CorrespondenciaRow = {
  id: string
  hojaRuta: string
  asunto: string
  remitente: string
  destinatario: string | null
  destinatarioUserId?: string | null
  destinoArea: string | null
  destinoSucursalId: string | null
  tipo: string
  origen: string
  estado: string
  prioridad: string
  leido: boolean
  observaciones: string | null
  descripcion: string | null
  tipoDocumentoId: string | null
  plazoAtencion: Date | null
  fechaRecepcion: Date
  fechaEnvio: Date | null
  archivadoEn: Date | null
  createdAt: Date
  updatedAt: Date
  creadoPor: string | null
}

export function BadgeEstado({ estado }: { estado: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        colorEstado(estado),
      )}
    >
      {etiquetaEstado(estado)}
    </span>
  )
}

export function BadgePrioridad({ prioridad }: { prioridad: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        colorPrioridad(prioridad),
      )}
    >
      {etiquetaPrioridad(prioridad)}
    </span>
  )
}

export const ICONO_ESTADO: Record<string, LucideIcon> = {
  recibido: InboxIcon,
  registrado: ClipboardListIcon,
  derivado: ForwardIcon,
  en_revision: RefreshCwIcon,
  observado: AlertTriangleIcon,
  atendido: CheckCircle2Icon,
  finalizado: CheckCircle2Icon,
  archivado: ArchiveIcon,
  rechazado: XCircleIcon,
}

export function IconoEstado({ estado, className }: { estado: string; className?: string }) {
  const Icon = ICONO_ESTADO[estado] ?? ClipboardListIcon
  return <Icon className={className} />
}

export function vencido(c: { plazoAtencion: Date | null; estado: string }): boolean {
  if (!c.plazoAtencion) return false
  if (["finalizado", "archivado", "rechazado"].includes(c.estado)) return false
  return new Date(c.plazoAtencion).getTime() < Date.now()
}

export function formatearFecha(fecha: Date | null | undefined): string {
  if (!fecha) return "—"
  return new Date(fecha).toLocaleDateString("es-BO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  })
}

export function formatearFechaHora(fecha: Date | null | undefined): string {
  if (!fecha) return "—"
  return new Date(fecha).toLocaleString("es-BO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function nombreCompleto(u?: {
  firstName?: string | null
  lastNamePaternal?: string | null
  lastNameMaternal?: string | null
}): string {
  if (!u) return "—"
  return `${u.firstName ?? ""} ${u.lastNamePaternal ?? ""}${u.lastNameMaternal ? ` ${u.lastNameMaternal}` : ""}`.trim()
}

export const ICONO_TIPO: Record<string, LucideIcon> = {
  entrada: InboxIcon,
  salida: SendIcon,
  interna: ForwardIcon,
}

export function IconoTipo({ tipo, className }: { tipo: string; className?: string }) {
  const Icon = ICONO_TIPO[tipo] ?? InboxIcon
  return <Icon className={className} />
}

export const COLOR_PRIORIDAD_BORDE: Record<string, string> = {
  baja: "border-l-emerald-400",
  normal: "border-l-sky-400",
  alta: "border-l-amber-400",
  urgente: "border-l-red-500",
}

export function FlameUrgent({ prioridad }: { prioridad: string }) {
  if (prioridad !== "urgente") return null
  return <FlameIcon className="h-3.5 w-3.5 text-red-500" />
}
