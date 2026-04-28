export const TIPOS_DOCUMENTO_DEFAULT = [
  { nombre: "Carta", plazoDefaultDias: 5 },
  { nombre: "Oficio", plazoDefaultDias: 5 },
  { nombre: "Memorándum", plazoDefaultDias: 3 },
  { nombre: "Informe", plazoDefaultDias: 7 },
  { nombre: "Solicitud", plazoDefaultDias: 5 },
  { nombre: "Circular", plazoDefaultDias: 3 },
  { nombre: "Nota interna", plazoDefaultDias: 2 },
  { nombre: "Otro", plazoDefaultDias: 5 },
] as const

export const PRIORIDADES_CORRESPONDENCIA = [
  { value: "baja", label: "Baja" },
  { value: "normal", label: "Normal" },
  { value: "alta", label: "Alta" },
  { value: "urgente", label: "Urgente" },
] as const

export type PrioridadCorrespondencia =
  (typeof PRIORIDADES_CORRESPONDENCIA)[number]["value"]

export const ESTADOS_CORRESPONDENCIA = [
  { value: "recibido", label: "Recibido" },
  { value: "registrado", label: "Registrado" },
  { value: "derivado", label: "Derivado" },
  { value: "en_revision", label: "En revisión" },
  { value: "observado", label: "Observado" },
  { value: "atendido", label: "Atendido" },
  { value: "finalizado", label: "Finalizado" },
  { value: "archivado", label: "Archivado" },
  { value: "rechazado", label: "Rechazado" },
] as const

export type EstadoCorrespondencia =
  (typeof ESTADOS_CORRESPONDENCIA)[number]["value"]

export const ORIGENES_CORRESPONDENCIA = [
  { value: "interno", label: "Interno" },
  { value: "externo", label: "Externo" },
] as const

export const TIPOS_FLUJO = [
  { value: "entrada", label: "Entrada" },
  { value: "salida", label: "Salida" },
  { value: "interna", label: "Interna" },
] as const

export const ESTADOS_FINALES: EstadoCorrespondencia[] = [
  "finalizado",
  "archivado",
  "rechazado",
]

export const COLORES_PRIORIDAD: Record<string, string> = {
  baja: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  normal: "bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400",
  alta: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  urgente: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
}

export const COLORES_ESTADO: Record<string, string> = {
  recibido: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  registrado: "bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400",
  derivado: "bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400",
  en_revision: "bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400",
  observado: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  atendido: "bg-teal-100 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400",
  finalizado: "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400",
  archivado: "bg-zinc-100 text-zinc-700 dark:bg-zinc-500/10 dark:text-zinc-400",
  rechazado: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
}

export function etiquetaEstado(estado: string): string {
  return ESTADOS_CORRESPONDENCIA.find((e) => e.value === estado)?.label ?? estado
}

export function etiquetaPrioridad(prioridad: string): string {
  return PRIORIDADES_CORRESPONDENCIA.find((p) => p.value === prioridad)?.label ?? prioridad
}

export function colorPrioridad(prioridad: string): string {
  return COLORES_PRIORIDAD[prioridad] ?? COLORES_PRIORIDAD.normal
}

export function colorEstado(estado: string): string {
  return COLORES_ESTADO[estado] ?? COLORES_ESTADO.registrado
}
