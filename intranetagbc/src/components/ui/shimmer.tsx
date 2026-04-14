/**
 * Shimmer Skeleton Components
 * Sistema de shimmer profesional para toda la intranet AGBC.
 * Usa la clase CSS `.shimmer` definida en globals.css.
 */

function Shimmer({ className = "" }: { className?: string }) {
  return <div className={`shimmer ${className}`} />
}

/* ── Skeletons reutilizables ── */

export function ShimmerLine({ width = "w-full", height = "h-4" }: { width?: string; height?: string }) {
  return <Shimmer className={`${width} ${height} rounded-md`} />
}

export function ShimmerCircle({ size = "h-10 w-10" }: { size?: string }) {
  return <Shimmer className={`${size} rounded-full shrink-0`} />
}

export function ShimmerCard({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-xl border border-border/50 bg-card p-5 space-y-4 ${className}`}>
      <div className="flex items-center gap-3">
        <ShimmerCircle size="h-10 w-10" />
        <div className="flex-1 space-y-2">
          <ShimmerLine width="w-1/3" height="h-4" />
          <ShimmerLine width="w-1/2" height="h-3" />
        </div>
      </div>
      <ShimmerLine width="w-full" height="h-3" />
      <ShimmerLine width="w-4/5" height="h-3" />
      <ShimmerLine width="w-2/3" height="h-3" />
    </div>
  )
}

export function ShimmerStatCard() {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <ShimmerLine width="w-24" height="h-3" />
        <ShimmerCircle size="h-8 w-8" />
      </div>
      <ShimmerLine width="w-20" height="h-8" />
      <ShimmerLine width="w-32" height="h-3" />
    </div>
  )
}

export function ShimmerTableRow() {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-border/30">
      <ShimmerCircle size="h-8 w-8" />
      <ShimmerLine width="w-1/4" height="h-4" />
      <ShimmerLine width="w-1/5" height="h-4" />
      <ShimmerLine width="w-1/6" height="h-3" />
      <ShimmerLine width="w-16" height="h-6" />
    </div>
  )
}

export function ShimmerTable({ rows = 6 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 px-5 py-3 border-b border-border/50 bg-muted/30">
        <ShimmerLine width="w-1/4" height="h-3" />
        <ShimmerLine width="w-1/5" height="h-3" />
        <ShimmerLine width="w-1/6" height="h-3" />
        <ShimmerLine width="w-16" height="h-3" />
      </div>
      {/* Rows */}
      <div className="px-5">
        {Array.from({ length: rows }).map((_, i) => (
          <ShimmerTableRow key={i} />
        ))}
      </div>
    </div>
  )
}

export function ShimmerModuleHeader() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-2">
        <ShimmerLine width="w-48" height="h-7" />
        <ShimmerLine width="w-72" height="h-4" />
      </div>
      <div className="flex gap-2">
        <Shimmer className="h-10 w-28 rounded-lg" />
        <Shimmer className="h-10 w-10 rounded-lg" />
      </div>
    </div>
  )
}

export function ShimmerTabs() {
  return (
    <div className="flex gap-1 rounded-lg border border-border/50 bg-muted/30 p-1">
      <Shimmer className="h-9 w-28 rounded-md" />
      <Shimmer className="h-9 w-28 rounded-md" />
      <Shimmer className="h-9 w-28 rounded-md" />
    </div>
  )
}

/* ── Skeletons por tipo de módulo ── */

/** Dashboard skeleton */
export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6 animate-fade-in">
      <ShimmerModuleHeader />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ShimmerStatCard key={i} />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ShimmerCard />
        <ShimmerCard />
      </div>
    </div>
  )
}

/** Tabla con header + tabs (comunicaciones, correspondencia, rrhh, etc.) */
export function TableModuleSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6 animate-fade-in">
      <ShimmerModuleHeader />
      <ShimmerTabs />
      <div className="grid gap-4 sm:grid-cols-3">
        <ShimmerStatCard />
        <ShimmerStatCard />
        <ShimmerStatCard />
      </div>
      <ShimmerTable rows={7} />
    </div>
  )
}

/** Módulo tipo galería de cards (usuarios, roles, sucursales) */
export function CardGridSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6 animate-fade-in">
      <ShimmerModuleHeader />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ShimmerCard key={i} />
        ))}
      </div>
    </div>
  )
}

/** Calendario skeleton */
export function CalendarioSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6 animate-fade-in">
      <ShimmerModuleHeader />
      <div className="grid gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <ShimmerStatCard key={i} />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-xl border border-border/50 bg-card p-5 space-y-3">
          {/* Calendar header */}
          <div className="flex items-center justify-between">
            <Shimmer className="h-8 w-8 rounded-lg" />
            <ShimmerLine width="w-40" height="h-6" />
            <Shimmer className="h-8 w-8 rounded-lg" />
          </div>
          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <ShimmerLine key={`h-${i}`} width="w-full" height="h-6" />
            ))}
            {Array.from({ length: 35 }).map((_, i) => (
              <Shimmer key={i} className="h-10 w-full rounded-md" />
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <ShimmerLine width="w-40" height="h-5" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/50 bg-card p-4 space-y-2">
              <ShimmerLine width="w-3/4" height="h-4" />
              <ShimmerLine width="w-1/2" height="h-3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Auditoría skeleton */
export function AuditoriaSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6 animate-fade-in">
      <ShimmerModuleHeader />
      <div className="flex gap-3">
        <Shimmer className="h-10 flex-1 rounded-lg" />
        <Shimmer className="h-10 w-32 rounded-lg" />
      </div>
      <ShimmerTable rows={10} />
    </div>
  )
}

/** Perfil skeleton */
export function PerfilSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6 animate-fade-in">
      <ShimmerModuleHeader />
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="rounded-xl border border-border/50 bg-card p-6 space-y-4 flex flex-col items-center">
          <ShimmerCircle size="h-24 w-24" />
          <ShimmerLine width="w-32" height="h-5" />
          <ShimmerLine width="w-24" height="h-3" />
          <div className="w-full space-y-3 pt-4">
            <ShimmerLine width="w-full" height="h-4" />
            <ShimmerLine width="w-full" height="h-4" />
            <ShimmerLine width="w-3/4" height="h-4" />
          </div>
        </div>
        <div className="space-y-4">
          <ShimmerCard />
          <ShimmerCard />
        </div>
      </div>
    </div>
  )
}

/** Configuración / Secciones skeleton */
export function ConfigSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6 animate-fade-in">
      <ShimmerModuleHeader />
      <div className="rounded-xl border border-border/50 bg-card p-4 flex items-center gap-4">
        <ShimmerCircle size="h-10 w-10" />
        <div className="space-y-2 flex-1">
          <ShimmerLine width="w-48" height="h-4" />
          <ShimmerLine width="w-64" height="h-3" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/50 bg-card p-5 flex items-start gap-4">
            <Shimmer className="h-6 w-11 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <ShimmerLine width="w-1/3" height="h-4" />
              <ShimmerLine width="w-2/3" height="h-3" />
            </div>
            <Shimmer className="h-5 w-14 rounded-full shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Documentos skeleton */
export function DocumentosSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6 animate-fade-in">
      <ShimmerModuleHeader />
      <ShimmerTabs />
      <div className="grid gap-4 sm:grid-cols-3">
        <ShimmerStatCard />
        <ShimmerStatCard />
        <ShimmerStatCard />
      </div>
      <ShimmerTable rows={6} />
    </div>
  )
}

/** Reportes skeleton */
export function ReportesSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6 animate-fade-in">
      <ShimmerModuleHeader />
      <div className="flex gap-3 flex-wrap">
        <Shimmer className="h-10 w-40 rounded-lg" />
        <Shimmer className="h-10 w-40 rounded-lg" />
        <Shimmer className="h-10 w-32 rounded-lg" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
          <ShimmerLine width="w-32" height="h-5" />
          <Shimmer className="h-48 w-full rounded-lg" />
        </div>
        <div className="rounded-xl border border-border/50 bg-card p-5 space-y-4">
          <ShimmerLine width="w-32" height="h-5" />
          <Shimmer className="h-48 w-full rounded-lg" />
        </div>
      </div>
      <ShimmerTable rows={5} />
    </div>
  )
}
