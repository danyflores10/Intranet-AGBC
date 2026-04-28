"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CalendarIcon, ForwardIcon, UserIcon, XIcon } from "lucide-react"
import toast from "react-hot-toast"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { derivarCorrespondencia } from "@/actions/correspondencia"
import { PRIORIDADES_CORRESPONDENCIA } from "@/lib/correspondencia-constants"
import {
  BadgeEstado,
  BadgePrioridad,
  CorrespondenciaRow,
  formatearFecha,
  nombreCompleto,
} from "./shared"

type UsuarioBasico = {
  id: string
  firstName: string
  lastNamePaternal: string
  lastNameMaternal: string | null
  institutionalEmail: string
  image: string | null
}

type Sucursal = { id: string; nombre: string; departamento: string }

interface Props {
  pendientes: CorrespondenciaRow[]
  usuarios: UsuarioBasico[]
  sucursales: Sucursal[]
}

export function CorrespondenciaDerivaciones({ pendientes, usuarios, sucursales }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const idParam = searchParams.get("id")
  const [overrideId, setOverrideId] = useState<string | null>(null)
  const seleccionadaId = overrideId ?? idParam ?? pendientes[0]?.id ?? ""
  const [searchUser, setSearchUser] = useState("")
  const [destUser, setDestUser] = useState<UsuarioBasico | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [destArea, setDestArea] = useState("")
  const [destSucursalId, setDestSucursalId] = useState("")
  const [prioridad, setPrioridad] = useState("normal")
  const [isPending, startTransition] = useTransition()

  const seleccionada = useMemo(
    () => pendientes.find((p) => p.id === seleccionadaId) ?? null,
    [pendientes, seleccionadaId],
  )

  const filtrados = usuarios.filter(
    (u) =>
      searchUser === "" ||
      nombreCompleto(u).toLowerCase().includes(searchUser.toLowerCase()) ||
      u.institutionalEmail.toLowerCase().includes(searchUser.toLowerCase()),
  )

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!seleccionada) {
      toast.error("Seleccione una correspondencia")
      return
    }

    if (!destUser && !destArea.trim() && !destSucursalId) {
      toast.error("Indique al menos un destinatario (usuario, área o sucursal)")
      return
    }

    const fd = new FormData(e.currentTarget)
    const instrucciones = (fd.get("instrucciones") as string)?.trim()
    const comentario = (fd.get("comentario") as string)?.trim()
    const plazoStr = fd.get("plazoAtencion") as string
    const plazo = plazoStr ? new Date(plazoStr) : undefined

    startTransition(async () => {
      try {
        await derivarCorrespondencia({
          correspondenciaId: seleccionada.id,
          toUserId: destUser?.id,
          toArea: destArea.trim() || undefined,
          toSucursalId: destSucursalId || undefined,
          prioridad,
          plazoAtencion: plazo,
          instrucciones: instrucciones || undefined,
          comentario: comentario || undefined,
        })
        toast.success("Correspondencia derivada")
        router.push("/correspondencia")
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al derivar")
      }
    })
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Derivaciones</h2>
        <p className="text-sm text-muted-foreground">
          Derive correspondencia a usuarios, áreas o sucursales
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[420px_1fr]">
        <Card className="border-border/40">
          <CardContent className="p-0">
            <div className="border-b p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pendientes de derivar ({pendientes.length})
            </div>
            <div className="max-h-[70vh] divide-y overflow-y-auto">
              {pendientes.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">
                  No hay correspondencia pendiente.
                </p>
              ) : (
                pendientes.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setOverrideId(c.id)}
                    className={`w-full p-3 text-left text-sm transition-colors hover:bg-muted/40 ${
                      seleccionadaId === c.id ? "bg-[#FFB300]/10" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold">{c.hojaRuta}</span>
                      <BadgePrioridad prioridad={c.prioridad} />
                    </div>
                    <p className="mt-1 line-clamp-2 font-medium">{c.asunto}</p>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{c.remitente}</span>
                      <BadgeEstado estado={c.estado} />
                    </div>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardContent className="p-0">
            <div className="flex h-1.5 w-full">
              <div className="flex-1 bg-[#C41E3A]" />
              <div className="flex-1 bg-[#FFB300]" />
              <div className="flex-1 bg-[#2E7D32]" />
            </div>
            {seleccionada ? (
              <form onSubmit={handleSubmit} className="space-y-5 p-6">
                <div className="rounded-xl bg-muted/40 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold">{seleccionada.hojaRuta}</span>
                    <BadgeEstado estado={seleccionada.estado} />
                  </div>
                  <h3 className="mt-1 text-base font-semibold">{seleccionada.asunto}</h3>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <span>De: {seleccionada.remitente}</span>
                    <span>Recepción: {formatearFecha(seleccionada.fechaRecepcion)}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Usuario destinatario
                  </Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      placeholder="Buscar por nombre o email..."
                      value={searchUser}
                      onChange={(e) => {
                        setSearchUser(e.target.value)
                        setShowDropdown(true)
                        if (!e.target.value) setDestUser(null)
                      }}
                      onFocus={() => setShowDropdown(true)}
                      onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                    />
                    {showDropdown && searchUser.length > 0 && filtrados.length > 0 && (
                      <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border bg-popover shadow-xl">
                        {filtrados.slice(0, 8).map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setDestUser(u)
                              setSearchUser(nombreCompleto(u))
                              setShowDropdown(false)
                            }}
                          >
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#FFB300]/30 to-[#FF8800]/30 text-xs font-bold text-[#FF8800]">
                              {u.firstName[0]}
                              {u.lastNamePaternal[0]}
                            </div>
                            <div>
                              <div className="font-medium">{nombreCompleto(u)}</div>
                              <div className="text-xs text-muted-foreground">{u.institutionalEmail}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {destUser && (
                      <div className="mt-2 flex items-center gap-2 rounded-lg border border-[#FFB300]/20 bg-[#FFB300]/10 px-3 py-2 text-sm">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FFB300]/30 text-xs font-bold text-[#FF8800]">
                          {destUser.firstName[0]}
                          {destUser.lastNamePaternal[0]}
                        </div>
                        <span className="font-medium">{nombreCompleto(destUser)}</span>
                        <button
                          type="button"
                          className="ml-auto text-muted-foreground hover:text-red-500"
                          onClick={() => {
                            setDestUser(null)
                            setSearchUser("")
                          }}
                        >
                          <XIcon className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Área destino
                    </Label>
                    <Input
                      value={destArea}
                      onChange={(e) => setDestArea(e.target.value)}
                      placeholder="Ej. Recursos Humanos"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Sucursal destino
                    </Label>
                    <Select value={destSucursalId} onValueChange={setDestSucursalId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="(Opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {sucursales.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.nombre} — {s.departamento}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Prioridad
                    </Label>
                    <Select value={prioridad} onValueChange={setPrioridad}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORIDADES_CORRESPONDENCIA.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Plazo de atención
                    </Label>
                    <div className="relative">
                      <CalendarIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input name="plazoAtencion" type="date" className="pl-9" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Instrucciones
                  </Label>
                  <textarea
                    name="instrucciones"
                    rows={3}
                    className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-[#FFB300] focus:ring-1 focus:ring-[#FFB300]/30"
                    placeholder="Ej. Atender en un plazo de 5 días hábiles, responder por escrito..."
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Comentario
                  </Label>
                  <textarea
                    name="comentario"
                    rows={2}
                    className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-[#FFB300] focus:ring-1 focus:ring-[#FFB300]/30"
                  />
                </div>

                <div className="flex justify-end gap-2 border-t pt-4">
                  <Button type="button" variant="outline" onClick={() => router.push("/correspondencia")}>
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="gap-2 bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000] shadow-md shadow-[#FFB300]/20"
                  >
                    <ForwardIcon className="h-4 w-4" />
                    {isPending ? "Derivando..." : "Derivar correspondencia"}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="p-12 text-center text-sm text-muted-foreground">
                Seleccione una correspondencia del listado para derivarla.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
