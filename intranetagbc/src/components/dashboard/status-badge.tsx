import { cn } from "@/lib/utils"

const variants = {
  activo: "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400",
  inactivo: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  pendiente: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  borrador: "bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400",
  publicado: "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400",
  alta: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  media: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  baja: "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400",
} as const

type BadgeVariant = keyof typeof variants

interface StatusBadgeProps {
  status: BadgeVariant
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        variants[status],
        className
      )}
    >
      {status}
    </span>
  )
}
