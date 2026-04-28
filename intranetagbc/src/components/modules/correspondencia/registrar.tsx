"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  CalendarIcon,
  FileIcon,
  FileTextIcon,
  PaperclipIcon,
  SendIcon,
  UserIcon,
  XIcon,
} from "lucide-react"
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
import { crearCorrespondencia } from "@/actions/correspondencia"
import {
  ORIGENES_CORRESPONDENCIA,
  PRIORIDADES_CORRESPONDENCIA,
  TIPOS_FLUJO,
} from "@/lib/correspondencia-constants"
import { nombreCompleto } from "./shared"

type UsuarioBasico = {
  id: string
  firstName: string
  lastNamePaternal: string
  lastNameMaternal: string | null
  institutionalEmail: string
  image: string | null
}

type Sucursal = { id: string; nombre: string; departamento: string }
type TipoDocumento = { id: string; nombre: string; plazoDefaultDias: number; activo: boolean }

interface Props {
  hojaRutaSugerida: string
  tiposDocumento: TipoDocumento[]
  usuarios: UsuarioBasico[]
  sucursales: Sucursal[]
}

export function CorrespondenciaRegistrar({
  hojaRutaSugerida,
  tiposDocumento,
  usuarios,
  sucursales,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [tipoFlujo, setTipoFlujo] = useState<"entrada" | "salida" | "interna">("entrada")
  const [origen, setOrigen] = useState<"interno" | "externo">("externo")
  const [tipoDocId, setTipoDocId] = useState("")
  const [prioridad, setPrioridad] = useState("normal")
  const [destinoSucursalId, setDestinoSucursalId] = useState<string>("")
  const [destinatarioUser, setDestinatarioUser] = useState<UsuarioBasico | null>(null)
  const [searchUser, setSearchUser] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  const [archivo, setArchivo] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filtrados = usuarios.filter(
    (u) =>
      searchUser === "" ||
      nombreCompleto(u).toLowerCase().includes(searchUser.toLowerCase()) ||
      u.institutionalEmail.toLowerCase().includes(searchUser.toLowerCase()),
  )

  function plazoDeTipo() {
    const t = tiposDocumento.find((x) => x.id === tipoDocId)
    return t?.plazoDefaultDias ?? 5
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const asunto = (fd.get("asunto") as string)?.trim()
    const remitente = (fd.get("remitente") as string)?.trim()
    const descripcion = (fd.get("descripcion") as string)?.trim()
    const observaciones = (fd.get("observaciones") as string)?.trim()
    const destinoArea = (fd.get("destinoArea") as string)?.trim()
    const destinatarioRaw = (fd.get("destinatario") as string)?.trim()
    const plazoStr = fd.get("plazoAtencion") as string

    if (!asunto) {
      toast.error("El asunto es obligatorio")
      return
    }
    if (!remitente) {
      toast.error("El remitente es obligatorio")
      return
    }
    if (!tipoDocId) {
      toast.error("Seleccione el tipo de documento")
      return
    }

    startTransition(async () => {
      try {
        let adjuntos:
          | Array<{ url: string; nombre: string; tipo: string; tamano: number }>
          | undefined

        if (archivo) {
          const upload = new FormData()
          upload.append("archivo", archivo)
          const resp = await fetch("/api/upload/correspondencia", {
            method: "POST",
            body: upload,
          })
          if (!resp.ok) {
            const err = await resp.json().catch(() => ({}))
            toast.error(err?.error ?? "Error al subir archivo")
            return
          }
          const r = await resp.json()
          adjuntos = [{ url: r.url, nombre: r.nombre, tipo: r.tipo, tamano: r.tamano }]
        }

        const plazo = plazoStr ? new Date(plazoStr) : computePlazoFromDays(plazoDeTipo())

        await crearCorrespondencia({
          hojaRuta: hojaRutaSugerida,
          tipoDocumentoId: tipoDocId,
          origen,
          tipo: tipoFlujo,
          prioridad,
          remitente,
          destinatario: destinatarioUser ? nombreCompleto(destinatarioUser) : destinatarioRaw || undefined,
          destinatarioUserId: destinatarioUser?.id,
          destinoArea: destinoArea || undefined,
          destinoSucursalId: destinoSucursalId || undefined,
          asunto,
          descripcion: descripcion || undefined,
          observaciones: observaciones || undefined,
          plazoAtencion: plazo,
          adjuntos,
        })

        toast.success("Correspondencia registrada")
        router.push("/correspondencia")
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error al registrar"
        toast.error(msg)
      }
    })
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Registrar correspondencia</h2>
          <p className="text-sm text-muted-foreground">
            Hoja de ruta sugerida:{" "}
            <span className="font-mono font-semibold text-[#FF8800]">{hojaRutaSugerida}</span>
          </p>
        </div>
      </div>

      <Card className="border-border/40">
        <CardContent className="p-0">
          <div className="flex h-1.5 w-full">
            <div className="flex-1 bg-[#C41E3A]" />
            <div className="flex-1 bg-[#FFB300]" />
            <div className="flex-1 bg-[#2E7D32]" />
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4 p-6 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tipo de flujo *
              </Label>
              <Select value={tipoFlujo} onValueChange={(v) => setTipoFlujo(v as typeof tipoFlujo)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_FLUJO.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Origen *
              </Label>
              <Select value={origen} onValueChange={(v) => setOrigen(v as typeof origen)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORIGENES_CORRESPONDENCIA.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tipo de documento *
              </Label>
              <Select value={tipoDocId} onValueChange={setTipoDocId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  {tiposDocumento
                    .filter((t) => t.activo)
                    .map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.nombre}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Prioridad *
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

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="asunto" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Asunto *
              </Label>
              <Input id="asunto" name="asunto" required maxLength={300} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="remitente" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Remitente *
              </Label>
              <Input id="remitente" name="remitente" required maxLength={200} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="destinatario" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Destinatario
              </Label>
              <Input id="destinatario" name="destinatario" maxLength={200} />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Asignar usuario destinatario (opcional)
              </Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Buscar usuario por nombre o email..."
                  value={searchUser}
                  onChange={(e) => {
                    setSearchUser(e.target.value)
                    setShowDropdown(true)
                    if (!e.target.value) setDestinatarioUser(null)
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
                          setDestinatarioUser(u)
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
                {destinatarioUser && (
                  <div className="mt-2 flex items-center gap-2 rounded-lg border border-[#FFB300]/20 bg-[#FFB300]/10 px-3 py-2 text-sm">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FFB300]/30 text-xs font-bold text-[#FF8800]">
                      {destinatarioUser.firstName[0]}
                      {destinatarioUser.lastNamePaternal[0]}
                    </div>
                    <span className="font-medium">{nombreCompleto(destinatarioUser)}</span>
                    <button
                      type="button"
                      className="ml-auto text-muted-foreground hover:text-red-500"
                      onClick={() => {
                        setDestinatarioUser(null)
                        setSearchUser("")
                      }}
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="destinoArea" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Área destino
              </Label>
              <Input id="destinoArea" name="destinoArea" placeholder="Ej. Recursos Humanos" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Sucursal destino
              </Label>
              <Select value={destinoSucursalId} onValueChange={setDestinoSucursalId}>
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

            <div className="space-y-1.5">
              <Label htmlFor="plazoAtencion" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Plazo de atención
              </Label>
              <div className="relative">
                <CalendarIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="plazoAtencion" name="plazoAtencion" type="date" className="pl-9" />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Si lo deja vacío se usará el plazo por defecto del tipo de documento ({plazoDeTipo()} días).
              </p>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="descripcion" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Descripción
              </Label>
              <textarea
                id="descripcion"
                name="descripcion"
                rows={3}
                className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#FFB300] focus:ring-1 focus:ring-[#FFB300]/30"
                placeholder="Detalle del contenido de la correspondencia..."
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="observaciones" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Observaciones
              </Label>
              <textarea
                id="observaciones"
                name="observaciones"
                rows={2}
                className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#FFB300] focus:ring-1 focus:ring-[#FFB300]/30"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Documento adjunto (PDF, JPG, PNG · 10MB máx.)
              </Label>
              <div
                className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border/60 bg-muted/30 p-4 transition-colors hover:border-[#FFB300]/40 hover:bg-[#FFB300]/5"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                />
                <PaperclipIcon className="mb-1 h-6 w-6 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {archivo ? archivo.name : "Clic para adjuntar archivo"}
                </span>
              </div>
              {archivo && (
                <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm dark:border-blue-800 dark:bg-blue-950/30">
                  <FileIcon className="h-4 w-4 text-blue-500" />
                  <span className="flex-1 truncate">{archivo.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setArchivo(null)
                      if (fileInputRef.current) fileInputRef.current.value = ""
                    }}
                    className="text-muted-foreground hover:text-red-500"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t pt-4 md:col-span-2">
              <Button type="button" variant="outline" onClick={() => router.push("/correspondencia")}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="gap-2 bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000] shadow-md shadow-[#FFB300]/20"
              >
                {isPending ? (
                  <>
                    <FileTextIcon className="h-4 w-4" /> Guardando...
                  </>
                ) : (
                  <>
                    <SendIcon className="h-4 w-4" /> Registrar correspondencia
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function computePlazoFromDays(dias: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  return d
}
