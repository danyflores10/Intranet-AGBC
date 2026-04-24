"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeftIcon,
  ClockIcon,
  CheckIcon,
  XIcon,
  TrophyIcon,
  UsersIcon,
  MapPinIcon,
  EyeIcon,
} from "lucide-react"
import toast from "react-hot-toast"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  publicarReconocimiento,
  rechazarReconocimiento,
  type ReconocimientoListItem,
} from "@/actions/reconocimientos"
import {
  LABEL_TIPO,
  type TipoReconocimiento,
} from "@/lib/validations/reconocimientos"

interface Props {
  pendientes: ReconocimientoListItem[]
  puedePublicar: boolean
}

const ICONOS: Record<TipoReconocimiento, typeof TrophyIcon> = {
  empleado_mes: TrophyIcon,
  equipo_destacado: UsersIcon,
  logro_sucursal: MapPinIcon,
}

export function ReconocimientosAprobaciones({ pendientes, puedePublicar }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [rechazandoId, setRechazandoId] = useState<string | null>(null)
  const [motivoRechazo, setMotivoRechazo] = useState("")

  function run(label: string, fn: () => Promise<unknown>) {
    startTransition(async () => {
      try {
        await fn()
        toast.success(label)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al procesar")
      }
    })
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <Card className="border-border/40">
        <CardContent className="flex items-center gap-3 p-5">
          <Link
            href="/reconocimientos"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-card hover:bg-muted transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Link>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md">
            <ClockIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">Aprobaciones pendientes</h1>
            <p className="text-xs text-muted-foreground">
              {pendientes.length} {pendientes.length === 1 ? "reconocimiento por revisar" : "reconocimientos por revisar"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/40 overflow-hidden">
        <CardHeader className="border-b border-border/30 bg-muted/20 py-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ClockIcon className="h-4 w-4 text-amber-500" />
            Cola de revisión
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {pendientes.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20 text-center px-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-500/10">
                <CheckIcon className="h-10 w-10 text-emerald-500" />
              </div>
              <p className="text-base font-semibold">¡Todo al día!</p>
              <p className="text-xs text-muted-foreground/70">No hay reconocimientos esperando aprobación</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {pendientes.map((r) => {
                const Icon = ICONOS[r.tipo as TipoReconocimiento]
                const enRechazo = rechazandoId === r.id
                return (
                  <div key={r.id} className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted/50">
                        {r.imagen ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.imagen} alt={r.titulo} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
                            <Icon className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-bold">{r.titulo}</h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {LABEL_TIPO[r.tipo as TipoReconocimiento]}
                          {r.subtituloA ? ` · ${r.subtituloA}` : ""}
                          {r.subtituloB ? ` · ${r.subtituloB}` : ""}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground/80 line-clamp-2">{r.descripcionCorta}</p>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <Link href={`/reconocimientos/${r.id}`}>
                          <Button variant="outline" size="sm">
                            <EyeIcon className="mr-1.5 h-3.5 w-3.5" />
                            Ver detalle
                          </Button>
                        </Link>
                        {puedePublicar && !enRechazo && (
                          <Button
                            size="sm"
                            onClick={() => run("Publicado", () => publicarReconocimiento(r.id))}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <CheckIcon className="mr-1.5 h-3.5 w-3.5" />
                            Publicar
                          </Button>
                        )}
                        {!enRechazo && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500/40 text-red-600"
                            onClick={() => {
                              setRechazandoId(r.id)
                              setMotivoRechazo("")
                            }}
                          >
                            <XIcon className="mr-1.5 h-3.5 w-3.5" />
                            Rechazar
                          </Button>
                        )}
                      </div>
                    </div>
                    {enRechazo && (
                      <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                        <input
                          value={motivoRechazo}
                          onChange={(e) => setMotivoRechazo(e.target.value)}
                          placeholder="Motivo del rechazo (obligatorio)"
                          className="flex-1 h-9 rounded-md border border-red-500/40 bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setRechazandoId(null)
                            setMotivoRechazo("")
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          className="bg-red-600 hover:bg-red-700 text-white"
                          onClick={() => {
                            if (motivoRechazo.trim().length === 0) {
                              toast.error("El motivo es obligatorio")
                              return
                            }
                            run("Rechazado", () => rechazarReconocimiento(r.id, motivoRechazo.trim()))
                            setRechazandoId(null)
                            setMotivoRechazo("")
                          }}
                        >
                          Confirmar rechazo
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
