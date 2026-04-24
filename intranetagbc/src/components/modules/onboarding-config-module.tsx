"use client"

import { useState, useTransition } from "react"
import {
  SparklesIcon,
  SaveIcon,
  RotateCcwIcon,
  PlayIcon,
  CheckCircle2Icon,
  XCircleIcon,
  ClockIcon,
  UsersIcon,
  UserCheckIcon,
  ShieldIcon,
} from "lucide-react"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { confirmarToast } from "@/components/ui/confirm-toast"
import {
  actualizarConfigOnboarding,
  reiniciarOnboardingGlobal,
  reiniciarOnboardingUsuarioActual,
} from "@/actions/onboarding"

type MostrarA = "todos" | "nuevos" | "rol"

interface Props {
  config: {
    activo: boolean
    mostrarA: MostrarA
    rolObjetivo: string | null
    version: string
  }
  roles: string[]
  stats: { completados: number; pendientes: number; omitidos: number }
}

export function OnboardingConfigModule({ config, roles, stats }: Props) {
  const router = useRouter()
  const [activo, setActivo] = useState(config.activo)
  const [mostrarA, setMostrarA] = useState<MostrarA>(config.mostrarA)
  const [rolObjetivo, setRolObjetivo] = useState<string>(config.rolObjetivo ?? "")
  const [isPending, startTransition] = useTransition()

  function guardar() {
    startTransition(async () => {
      try {
        await actualizarConfigOnboarding({
          activo,
          mostrarA,
          rolObjetivo: mostrarA === "rol" ? (rolObjetivo || null) : null,
        })
        toast.success("Configuración guardada")
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al guardar")
      }
    })
  }

  async function reiniciarGlobal() {
    const ok = await confirmarToast({
      titulo: "¿Reiniciar el onboarding para todos?",
      mensaje: "Todos los usuarios volverán a ver el tour al entrar. El progreso actual quedará obsoleto.",
      confirmarTexto: "Reiniciar",
      tono: "advertencia",
    })
    if (!ok) return
    startTransition(async () => {
      try {
        await reiniciarOnboardingGlobal()
        toast.success("Onboarding reiniciado para todos los usuarios")
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error")
      }
    })
  }

  async function probarAhora() {
    await reiniciarOnboardingUsuarioActual()
    toast.success("Lanzando tour...")
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent("onboarding:start"))
    }, 250)
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <Card className="border-border/40 overflow-hidden relative">
        <div className="relative h-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#FFB300] via-[#FF8800] to-[#C41E3A]" />
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        </div>
        <CardContent className="relative -mt-12 pb-5">
          <div className="flex items-end justify-between gap-4">
            <div className="flex items-end gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-background bg-gradient-to-br from-[#FFB300] to-[#FF8800] text-[#1a1000] shadow-xl ring-4 ring-background">
                <SparklesIcon className="h-8 w-8" />
              </div>
              <div className="pb-1">
                <h1 className="text-xl font-black tracking-tight">Onboarding guiado</h1>
                <p className="text-xs text-muted-foreground">
                  Configura cómo se presenta el tour a los usuarios al entrar a la intranet.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={probarAhora} disabled={isPending}>
                <PlayIcon className="mr-1.5 h-4 w-4" />
                Probar tour
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <StatCard
          icon={activo ? CheckCircle2Icon : XCircleIcon}
          label="Estado"
          value={activo ? "Activo" : "Inactivo"}
          tone={activo ? "green" : "zinc"}
        />
        <StatCard icon={CheckCircle2Icon} label="Completados" value={String(stats.completados)} tone="green" />
        <StatCard icon={ClockIcon} label="Pendientes" value={String(stats.pendientes)} tone="amber" />
        <StatCard icon={XCircleIcon} label="Omitidos" value={String(stats.omitidos)} tone="zinc" />
      </div>

      {/* Config */}
      <Card className="border-border/40">
        <CardHeader className="border-b border-border/30 bg-muted/20">
          <CardTitle className="flex items-center gap-2 text-sm">
            <ShieldIcon className="h-4 w-4 text-[#FFB300]" />
            Configuración global
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {/* Switch activo */}
          <div className="flex items-start justify-between gap-4 rounded-xl border border-border/50 p-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">Activar onboarding</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Si está desactivado, ningún usuario verá el tour al entrar.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActivo((v) => !v)}
              aria-pressed={activo}
              className={`relative flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${
                activo ? "bg-gradient-to-r from-[#FFB300] to-[#FF8800]" : "bg-muted-foreground/20"
              }`}
            >
              <div
                className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  activo ? "translate-x-[22px]" : "translate-x-[2px]"
                }`}
              />
            </button>
          </div>

          {/* Audiencia */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Mostrar a
            </Label>
            <div className="grid gap-2 sm:grid-cols-3">
              <AudienceCard
                activo={mostrarA === "todos"}
                onClick={() => setMostrarA("todos")}
                icon={UsersIcon}
                titulo="Todos los usuarios"
                descripcion="Cualquier usuario verá el tour en su próximo ingreso."
              />
              <AudienceCard
                activo={mostrarA === "nuevos"}
                onClick={() => setMostrarA("nuevos")}
                icon={UserCheckIcon}
                titulo="Solo usuarios nuevos"
                descripcion="Registrados hace 7 días o menos."
              />
              <AudienceCard
                activo={mostrarA === "rol"}
                onClick={() => setMostrarA("rol")}
                icon={ShieldIcon}
                titulo="Por rol específico"
                descripcion="Elige un rol abajo."
              />
            </div>

            {mostrarA === "rol" && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Rol objetivo
                </Label>
                <select
                  value={rolObjetivo}
                  onChange={(e) => setRolObjetivo(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB300]/30"
                >
                  <option value="">— Seleccionar rol —</option>
                  {roles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <Button
              variant="outline"
              onClick={reiniciarGlobal}
              disabled={isPending}
              className="border-amber-500/40 text-amber-700 dark:text-amber-300"
            >
              <RotateCcwIcon className="mr-2 h-4 w-4" />
              Reiniciar para todos
            </Button>
            <Button
              onClick={guardar}
              disabled={isPending}
              className="bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000] font-bold shadow-md"
            >
              <SaveIcon className="mr-2 h-4 w-4" />
              {isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof CheckCircle2Icon
  label: string
  value: string
  tone: "green" | "amber" | "zinc"
}) {
  const tones = {
    green: { bg: "bg-emerald-500/10", text: "text-emerald-600" },
    amber: { bg: "bg-amber-500/10", text: "text-amber-600" },
    zinc: { bg: "bg-zinc-500/10", text: "text-zinc-600 dark:text-zinc-300" },
  }[tone]
  return (
    <Card className="border-border/40">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tones.bg}`}>
          <Icon className={`h-5 w-5 ${tones.text}`} />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
          <p className="text-lg font-black leading-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function AudienceCard({
  activo,
  onClick,
  icon: Icon,
  titulo,
  descripcion,
}: {
  activo: boolean
  onClick: () => void
  icon: typeof UsersIcon
  titulo: string
  descripcion: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all ${
        activo
          ? "border-[#FFB300] bg-gradient-to-br from-[#FFB300]/10 to-transparent ring-1 ring-[#FFB300]/30 shadow-sm"
          : "border-border/50 hover:border-border"
      }`}
    >
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
          activo ? "bg-gradient-to-br from-[#FFB300] to-[#FF8800] text-[#1a1000]" : "bg-muted text-muted-foreground"
        }`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-sm font-bold">{titulo}</p>
      <p className="text-[11px] text-muted-foreground leading-snug">{descripcion}</p>
    </button>
  )
}
