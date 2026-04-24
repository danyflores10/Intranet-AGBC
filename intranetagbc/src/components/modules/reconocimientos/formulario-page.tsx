"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  TrophyIcon,
  UsersIcon,
  MapPinIcon,
  ArrowLeftIcon,
  SaveIcon,
  SendIcon,
  PlusIcon,
  XIcon,
  StarIcon,
  GlobeIcon,
  BuildingIcon,
} from "lucide-react"
import toast from "react-hot-toast"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { UploaderImagen } from "./uploader-imagen"
import {
  actualizarEmpleadoMes,
  actualizarEquipoDestacado,
  actualizarLogroSucursal,
  crearEmpleadoMes,
  crearEquipoDestacado,
  crearLogroSucursal,
  enviarARevisionReconocimiento,
  type ReconocimientoDetalle,
} from "@/actions/reconocimientos"
import {
  empleadoMesSchema,
  equipoDestacadoSchema,
  formatearErrorZod,
  LABEL_TIPO,
  logroSucursalSchema,
  MESES_ES,
  type TipoReconocimiento,
  type EmpleadoMesInput,
  type EquipoDestacadoInput,
  type LogroSucursalInput,
} from "@/lib/validations/reconocimientos"

type Usuario = { id: string; nombre: string; email: string; image: string | null }
type Sucursal = { id: string; nombre: string; departamento: string; capital: string }

interface Props {
  modo: "crear" | "editar"
  tipoInicial: TipoReconocimiento
  detalle?: ReconocimientoDetalle
  usuarios: Usuario[]
  sucursales: Sucursal[]
}

const ICONOS: Record<TipoReconocimiento, typeof TrophyIcon> = {
  empleado_mes: TrophyIcon,
  equipo_destacado: UsersIcon,
  logro_sucursal: MapPinIcon,
}

const TIPOS_LOGRO = ["operativo", "comercial", "atencion", "innovacion", "social"] as const

function hoyIso() {
  return new Date().toISOString().slice(0, 10)
}

export function ReconocimientoFormularioPage({
  modo,
  tipoInicial,
  detalle,
  usuarios,
  sucursales,
}: Props) {
  const router = useRouter()
  const [tipo, setTipo] = useState<TipoReconocimiento>(tipoInicial)
  const [isPending, startTransition] = useTransition()

  const Icon = ICONOS[tipo]
  const esEdicion = modo === "editar"

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <Card className="border-border/40">
        <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/reconocimientos"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-card hover:bg-muted transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </Link>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFB300] to-[#FF8800] text-[#1a1000] shadow-md">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight">
                {esEdicion ? "Editar" : "Nuevo"} — {LABEL_TIPO[tipo]}
              </h1>
              <p className="text-xs text-muted-foreground">
                {esEdicion
                  ? "Actualiza la información del reconocimiento"
                  : "Completa los datos y envía a revisión para publicar"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selector de tipo (solo en crear) */}
      {!esEdicion && (
        <Card className="border-border/40">
          <CardHeader className="border-b border-border/30 bg-muted/20 py-3">
            <CardTitle className="text-sm">Tipo de reconocimiento</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 p-4 sm:grid-cols-3">
            {(["empleado_mes", "equipo_destacado", "logro_sucursal"] as TipoReconocimiento[]).map((t) => {
              const I = ICONOS[t]
              const activo = tipo === t
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipo(t)}
                  className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${
                    activo
                      ? "border-[#FFB300] bg-gradient-to-br from-[#FFB300]/15 to-[#FF8800]/5 shadow-md ring-1 ring-[#FFB300]/30"
                      : "border-border/50 hover:border-border"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                      activo
                        ? "bg-gradient-to-br from-[#FFB300] to-[#FF8800] text-[#1a1000]"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <I className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-bold ${activo ? "text-foreground" : ""}`}>
                      {LABEL_TIPO[t]}
                    </p>
                  </div>
                </button>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Formulario por tipo */}
      {tipo === "empleado_mes" && (
        <FormularioEmpleadoMes
          detalle={esEdicion ? detalle : undefined}
          sucursales={sucursales}
          usuarios={usuarios}
          isPending={isPending}
          onSubmit={(input, enviar) => {
            const valid = empleadoMesSchema.safeParse(input)
            if (!valid.success) {
              toast.error(formatearErrorZod(valid.error))
              return
            }
            startTransition(async () => {
              try {
                const res = esEdicion && detalle
                  ? (await actualizarEmpleadoMes(detalle.base.id, valid.data), { id: detalle.base.id })
                  : await crearEmpleadoMes(valid.data)
                toast.success(esEdicion ? "Reconocimiento actualizado" : "Reconocimiento creado")
                if (enviar) {
                  await enviarARevisionReconocimiento(res.id)
                  toast.success("Enviado a revisión")
                }
                router.push(`/reconocimientos/${res.id}`)
                router.refresh()
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Error al guardar")
              }
            })
          }}
        />
      )}

      {tipo === "equipo_destacado" && (
        <FormularioEquipo
          detalle={esEdicion ? detalle : undefined}
          usuarios={usuarios}
          isPending={isPending}
          onSubmit={(input, enviar) => {
            const valid = equipoDestacadoSchema.safeParse(input)
            if (!valid.success) {
              toast.error(formatearErrorZod(valid.error))
              return
            }
            startTransition(async () => {
              try {
                const res = esEdicion && detalle
                  ? (await actualizarEquipoDestacado(detalle.base.id, valid.data), { id: detalle.base.id })
                  : await crearEquipoDestacado(valid.data)
                toast.success(esEdicion ? "Actualizado" : "Creado")
                if (enviar) {
                  await enviarARevisionReconocimiento(res.id)
                  toast.success("Enviado a revisión")
                }
                router.push(`/reconocimientos/${res.id}`)
                router.refresh()
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Error al guardar")
              }
            })
          }}
        />
      )}

      {tipo === "logro_sucursal" && (
        <FormularioLogroSucursal
          detalle={esEdicion ? detalle : undefined}
          sucursales={sucursales}
          isPending={isPending}
          onSubmit={(input, enviar) => {
            const valid = logroSucursalSchema.safeParse(input)
            if (!valid.success) {
              toast.error(formatearErrorZod(valid.error))
              return
            }
            startTransition(async () => {
              try {
                const res = esEdicion && detalle
                  ? (await actualizarLogroSucursal(detalle.base.id, valid.data), { id: detalle.base.id })
                  : await crearLogroSucursal(valid.data)
                toast.success(esEdicion ? "Actualizado" : "Creado")
                if (enviar) {
                  await enviarARevisionReconocimiento(res.id)
                  toast.success("Enviado a revisión")
                }
                router.push(`/reconocimientos/${res.id}`)
                router.refresh()
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Error al guardar")
              }
            })
          }}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared base block
// ─────────────────────────────────────────────────────────────────────────────
function BaseCamposBasicos({
  titulo,
  setTitulo,
  descCorta,
  setDescCorta,
  descCompleta,
  setDescCompleta,
  motivo,
  setMotivo,
  fechaReconocimiento,
  setFechaReconocimiento,
  periodoDesde,
  setPeriodoDesde,
  periodoHasta,
  setPeriodoHasta,
  imagen,
  setImagen,
  destacado,
  setDestacado,
  mostrarEnLanding,
  setMostrarEnLanding,
  mostrarPeriodo = true,
}: {
  titulo: string
  setTitulo: (v: string) => void
  descCorta: string
  setDescCorta: (v: string) => void
  descCompleta: string
  setDescCompleta: (v: string) => void
  motivo: string
  setMotivo: (v: string) => void
  fechaReconocimiento: string
  setFechaReconocimiento: (v: string) => void
  periodoDesde: string
  setPeriodoDesde: (v: string) => void
  periodoHasta: string
  setPeriodoHasta: (v: string) => void
  imagen: string | null
  setImagen: (v: string | null) => void
  destacado: boolean
  setDestacado: (v: boolean) => void
  mostrarEnLanding: boolean
  setMostrarEnLanding: (v: boolean) => void
  mostrarPeriodo?: boolean
}) {
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Título *
            </Label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej: Reconocimiento al compromiso y excelencia" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Descripción corta * <span className="ml-1 text-[10px] text-muted-foreground/60">(máx. 280)</span>
            </Label>
            <Textarea
              value={descCorta}
              onChange={(e) => setDescCorta(e.target.value)}
              maxLength={280}
              rows={2}
              placeholder="Resumen breve que se mostrará en tarjetas y landing"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Descripción completa *
            </Label>
            <Textarea
              value={descCompleta}
              onChange={(e) => setDescCompleta(e.target.value)}
              rows={4}
              placeholder="Texto completo que aparecerá en el detalle"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Motivo del reconocimiento *
            </Label>
            <Textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              placeholder="Ej: Por su compromiso, excelencia y aporte a la institución"
            />
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
              Imagen *
            </Label>
            <UploaderImagen value={imagen} onChange={setImagen} ratio="landscape" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Fecha del reconocimiento *
            </Label>
            <Input
              type="date"
              value={fechaReconocimiento}
              onChange={(e) => setFechaReconocimiento(e.target.value)}
            />
          </div>
          {mostrarPeriodo && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Periodo desde
                </Label>
                <Input type="date" value={periodoDesde} onChange={(e) => setPeriodoDesde(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Periodo hasta
                </Label>
                <Input type="date" value={periodoHasta} onChange={(e) => setPeriodoHasta(e.target.value)} />
              </div>
            </div>
          )}
          <div className="space-y-2 rounded-xl border border-border/50 p-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={destacado} onCheckedChange={(v) => setDestacado(v === true)} />
              <span className="text-xs font-semibold flex items-center gap-1.5">
                <StarIcon className="h-3.5 w-3.5 text-red-500" />
                Marcar como destacado
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={mostrarEnLanding} onCheckedChange={(v) => setMostrarEnLanding(v === true)} />
              <span className="text-xs font-semibold flex items-center gap-1.5">
                <GlobeIcon className="h-3.5 w-3.5 text-blue-500" />
                Mostrar en landing (solo efectivo si está publicado)
              </span>
            </label>
          </div>
        </div>
      </div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FORM: Empleado del mes
// ─────────────────────────────────────────────────────────────────────────────
function FormularioEmpleadoMes({
  detalle,
  sucursales,
  usuarios,
  isPending,
  onSubmit,
}: {
  detalle?: ReconocimientoDetalle
  sucursales: Sucursal[]
  usuarios: Usuario[]
  isPending: boolean
  onSubmit: (input: EmpleadoMesInput, enviar: boolean) => void
}) {
  const base = detalle?.tipo === "empleado_mes" ? detalle.base : null
  const emp = detalle?.tipo === "empleado_mes" ? detalle.empleado : null
  const ahora = new Date()

  const [titulo, setTitulo] = useState(base?.titulo ?? "")
  const [descCorta, setDescCorta] = useState(base?.descripcionCorta ?? "")
  const [descCompleta, setDescCompleta] = useState(base?.descripcionCompleta ?? "")
  const [motivo, setMotivo] = useState(base?.motivo ?? "")
  const [fechaReconocimiento, setFechaReconocimiento] = useState(base?.fechaReconocimiento ?? hoyIso())
  const [periodoDesde, setPeriodoDesde] = useState(base?.periodoDesde ?? "")
  const [periodoHasta, setPeriodoHasta] = useState(base?.periodoHasta ?? "")
  const [imagen, setImagen] = useState<string | null>(base?.imagen ?? null)
  const [destacado, setDestacado] = useState(base?.destacado ?? false)
  const [mostrarEnLanding, setMostrarEnLanding] = useState(base?.mostrarEnLanding ?? false)

  const [empleadoId, setEmpleadoId] = useState<string>(emp?.empleadoId ?? "")
  const [nombreCompleto, setNombreCompleto] = useState(emp?.nombreCompleto ?? "")
  const [cargo, setCargo] = useState(emp?.cargo ?? "")
  const [area, setArea] = useState(emp?.area ?? "")
  const [sucursalId, setSucursalId] = useState<string>(emp?.sucursalId ?? "")
  const [mes, setMes] = useState<number>(emp?.mes ?? ahora.getMonth() + 1)
  const [gestion, setGestion] = useState<number>(emp?.gestion ?? ahora.getFullYear())
  const [logrosDestacados, setLogrosDestacados] = useState(emp?.logrosDestacados ?? "")

  function build(): EmpleadoMesInput {
    return {
      tipo: "empleado_mes",
      titulo,
      descripcionCorta: descCorta,
      descripcionCompleta: descCompleta,
      motivo,
      imagen: imagen ?? null,
      fechaReconocimiento,
      periodoDesde: periodoDesde || null,
      periodoHasta: periodoHasta || null,
      destacado,
      mostrarEnLanding,
      empleadoId: empleadoId || null,
      nombreCompleto,
      cargo,
      area,
      sucursalId: sucursalId || null,
      mes,
      gestion,
      logrosDestacados: logrosDestacados || null,
    }
  }

  function cuandoSeleccionaEmpleado(id: string) {
    setEmpleadoId(id)
    const u = usuarios.find((x) => x.id === id)
    if (u) setNombreCompleto(u.nombre)
  }

  return (
    <Card className="border-border/40">
      <CardHeader className="border-b border-border/30 bg-muted/20">
        <CardTitle className="flex items-center gap-2">
          <TrophyIcon className="h-5 w-5 text-[#FFB300]" />
          Datos del reconocimiento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <BaseCamposBasicos
          titulo={titulo} setTitulo={setTitulo}
          descCorta={descCorta} setDescCorta={setDescCorta}
          descCompleta={descCompleta} setDescCompleta={setDescCompleta}
          motivo={motivo} setMotivo={setMotivo}
          fechaReconocimiento={fechaReconocimiento} setFechaReconocimiento={setFechaReconocimiento}
          periodoDesde={periodoDesde} setPeriodoDesde={setPeriodoDesde}
          periodoHasta={periodoHasta} setPeriodoHasta={setPeriodoHasta}
          imagen={imagen} setImagen={setImagen}
          destacado={destacado} setDestacado={setDestacado}
          mostrarEnLanding={mostrarEnLanding} setMostrarEnLanding={setMostrarEnLanding}
          mostrarPeriodo={false}
        />

        <div className="h-px bg-border/50" />

        <div className="space-y-4">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <TrophyIcon className="h-4 w-4 text-[#FFB300]" />
            Datos del empleado reconocido
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Empleado del sistema (opcional)
              </Label>
              <select
                value={empleadoId}
                onChange={(e) => cuandoSeleccionaEmpleado(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB300]/30"
              >
                <option value="">— Sin vincular —</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Nombre completo *
              </Label>
              <Input value={nombreCompleto} onChange={(e) => setNombreCompleto(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Cargo *
              </Label>
              <Input value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="Ej: Analista de Sistemas" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Área / Unidad *
              </Label>
              <Input value={area} onChange={(e) => setArea(e.target.value)} placeholder="Ej: TIC" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Sucursal
              </Label>
              <select
                value={sucursalId}
                onChange={(e) => setSucursalId(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB300]/30"
              >
                <option value="">— Sin sucursal —</option>
                {sucursales.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre} ({s.departamento})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Mes *
              </Label>
              <select
                value={mes}
                onChange={(e) => setMes(Number(e.target.value))}
                className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB300]/30"
              >
                {MESES_ES.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Gestión *
              </Label>
              <Input
                type="number"
                min={2020}
                max={2100}
                value={gestion}
                onChange={(e) => setGestion(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Logros destacados
            </Label>
            <Textarea
              value={logrosDestacados}
              onChange={(e) => setLogrosDestacados(e.target.value)}
              rows={3}
              placeholder="Lista breve de logros concretos"
            />
          </div>
        </div>

        <BotonesFormulario isPending={isPending} onGuardar={() => onSubmit(build(), false)} onEnviar={() => onSubmit(build(), true)} />
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FORM: Equipo destacado
// ─────────────────────────────────────────────────────────────────────────────
function FormularioEquipo({
  detalle,
  usuarios,
  isPending,
  onSubmit,
}: {
  detalle?: ReconocimientoDetalle
  usuarios: Usuario[]
  isPending: boolean
  onSubmit: (input: EquipoDestacadoInput, enviar: boolean) => void
}) {
  const base = detalle?.tipo === "equipo_destacado" ? detalle.base : null
  const eq = detalle?.tipo === "equipo_destacado" ? detalle.equipo : null
  const integrantesInit = detalle?.tipo === "equipo_destacado" ? detalle.integrantes : []

  const [titulo, setTitulo] = useState(base?.titulo ?? "")
  const [descCorta, setDescCorta] = useState(base?.descripcionCorta ?? "")
  const [descCompleta, setDescCompleta] = useState(base?.descripcionCompleta ?? "")
  const [motivo, setMotivo] = useState(base?.motivo ?? "")
  const [fechaReconocimiento, setFechaReconocimiento] = useState(base?.fechaReconocimiento ?? hoyIso())
  const [periodoDesde, setPeriodoDesde] = useState(base?.periodoDesde ?? "")
  const [periodoHasta, setPeriodoHasta] = useState(base?.periodoHasta ?? "")
  const [imagen, setImagen] = useState<string | null>(base?.imagen ?? null)
  const [destacado, setDestacado] = useState(base?.destacado ?? false)
  const [mostrarEnLanding, setMostrarEnLanding] = useState(base?.mostrarEnLanding ?? false)

  const [nombreEquipo, setNombreEquipo] = useState(eq?.nombreEquipo ?? "")
  const [area, setArea] = useState(eq?.area ?? "")
  const [responsableId, setResponsableId] = useState(eq?.responsableId ?? "")
  const [responsableNombre, setResponsableNombre] = useState(eq?.responsableNombre ?? "")
  const [resultadosAlcanzados, setResultadosAlcanzados] = useState(eq?.resultadosAlcanzados ?? "")
  const [integrantes, setIntegrantes] = useState<Array<{ usuarioId: string | null; nombre: string; rolEquipo: string }>>(
    integrantesInit.map((i) => ({
      usuarioId: i.usuarioId ?? null,
      nombre: i.nombre,
      rolEquipo: i.rolEquipo ?? "",
    })),
  )

  function cuandoSeleccionaResponsable(id: string) {
    setResponsableId(id)
    const u = usuarios.find((x) => x.id === id)
    if (u) setResponsableNombre(u.nombre)
  }

  function agregarIntegrante() {
    setIntegrantes((prev) => [...prev, { usuarioId: null, nombre: "", rolEquipo: "" }])
  }

  function quitarIntegrante(idx: number) {
    setIntegrantes((prev) => prev.filter((_, i) => i !== idx))
  }

  function build(): EquipoDestacadoInput {
    return {
      tipo: "equipo_destacado",
      titulo,
      descripcionCorta: descCorta,
      descripcionCompleta: descCompleta,
      motivo,
      imagen: imagen ?? null,
      fechaReconocimiento,
      periodoDesde: periodoDesde || null,
      periodoHasta: periodoHasta || null,
      destacado,
      mostrarEnLanding,
      nombreEquipo,
      area,
      responsableId: responsableId || null,
      responsableNombre,
      resultadosAlcanzados,
      integrantes: integrantes.map((i) => ({
        usuarioId: i.usuarioId || null,
        nombre: i.nombre,
        rolEquipo: i.rolEquipo || null,
      })),
    }
  }

  return (
    <Card className="border-border/40">
      <CardHeader className="border-b border-border/30 bg-muted/20">
        <CardTitle className="flex items-center gap-2">
          <UsersIcon className="h-5 w-5 text-[#FFB300]" />
          Datos del equipo destacado
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <BaseCamposBasicos
          titulo={titulo} setTitulo={setTitulo}
          descCorta={descCorta} setDescCorta={setDescCorta}
          descCompleta={descCompleta} setDescCompleta={setDescCompleta}
          motivo={motivo} setMotivo={setMotivo}
          fechaReconocimiento={fechaReconocimiento} setFechaReconocimiento={setFechaReconocimiento}
          periodoDesde={periodoDesde} setPeriodoDesde={setPeriodoDesde}
          periodoHasta={periodoHasta} setPeriodoHasta={setPeriodoHasta}
          imagen={imagen} setImagen={setImagen}
          destacado={destacado} setDestacado={setDestacado}
          mostrarEnLanding={mostrarEnLanding} setMostrarEnLanding={setMostrarEnLanding}
        />

        <div className="h-px bg-border/50" />

        <div className="space-y-4">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <UsersIcon className="h-4 w-4 text-[#FFB300]" />
            Información del equipo
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Nombre del equipo *
              </Label>
              <Input value={nombreEquipo} onChange={(e) => setNombreEquipo(e.target.value)} placeholder="Ej: Equipo de Transformación Digital" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Área / Unidad *
              </Label>
              <Input value={area} onChange={(e) => setArea(e.target.value)} placeholder="Ej: TIC" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Responsable (usuario del sistema)
              </Label>
              <select
                value={responsableId}
                onChange={(e) => cuandoSeleccionaResponsable(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB300]/30"
              >
                <option value="">— Sin vincular —</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Nombre del responsable *
              </Label>
              <Input value={responsableNombre} onChange={(e) => setResponsableNombre(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Resultados alcanzados *
            </Label>
            <Textarea
              value={resultadosAlcanzados}
              onChange={(e) => setResultadosAlcanzados(e.target.value)}
              rows={4}
              placeholder="Descripción de los resultados clave"
            />
          </div>
        </div>

        <div className="h-px bg-border/50" />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <UsersIcon className="h-4 w-4 text-[#FFB300]" />
              Integrantes ({integrantes.length})
            </h3>
            <Button type="button" variant="outline" size="sm" onClick={agregarIntegrante}>
              <PlusIcon className="mr-1.5 h-3.5 w-3.5" />
              Agregar integrante
            </Button>
          </div>
          {integrantes.length === 0 ? (
            <p className="text-xs text-muted-foreground/70 italic py-4 text-center border border-dashed border-border/50 rounded-lg">
              Todavía no hay integrantes. Puedes agregarlos ahora o dejarlo vacío.
            </p>
          ) : (
            <div className="space-y-2">
              {integrantes.map((i, idx) => (
                <div key={idx} className="grid gap-2 rounded-lg border border-border/50 p-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
                  <select
                    value={i.usuarioId ?? ""}
                    onChange={(e) => {
                      const id = e.target.value
                      const u = usuarios.find((x) => x.id === id)
                      setIntegrantes((prev) => {
                        const copy = [...prev]
                        copy[idx] = { ...copy[idx], usuarioId: id || null, nombre: u?.nombre ?? copy[idx].nombre }
                        return copy
                      })
                    }}
                    className="h-9 rounded-md border border-input bg-transparent px-2 text-xs"
                  >
                    <option value="">— Externo/manual —</option>
                    {usuarios.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nombre}
                      </option>
                    ))}
                  </select>
                  <Input
                    value={i.nombre}
                    onChange={(e) =>
                      setIntegrantes((prev) => {
                        const copy = [...prev]
                        copy[idx] = { ...copy[idx], nombre: e.target.value }
                        return copy
                      })
                    }
                    placeholder="Nombre"
                    className="h-9 text-xs"
                  />
                  <Input
                    value={i.rolEquipo}
                    onChange={(e) =>
                      setIntegrantes((prev) => {
                        const copy = [...prev]
                        copy[idx] = { ...copy[idx], rolEquipo: e.target.value }
                        return copy
                      })
                    }
                    placeholder="Rol en el equipo"
                    className="h-9 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => quitarIntegrante(idx)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-red-500/10 hover:text-red-600"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <BotonesFormulario isPending={isPending} onGuardar={() => onSubmit(build(), false)} onEnviar={() => onSubmit(build(), true)} />
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FORM: Logro de sucursal
// ─────────────────────────────────────────────────────────────────────────────
function FormularioLogroSucursal({
  detalle,
  sucursales,
  isPending,
  onSubmit,
}: {
  detalle?: ReconocimientoDetalle
  sucursales: Sucursal[]
  isPending: boolean
  onSubmit: (input: LogroSucursalInput, enviar: boolean) => void
}) {
  const base = detalle?.tipo === "logro_sucursal" ? detalle.base : null
  const lg = detalle?.tipo === "logro_sucursal" ? detalle.logro : null
  const indicadoresInit = (lg?.indicadores as Array<{ nombre: string; valor: string; unidad?: string | null }> | null) ?? []

  const [titulo, setTitulo] = useState(base?.titulo ?? "")
  const [descCorta, setDescCorta] = useState(base?.descripcionCorta ?? "")
  const [descCompleta, setDescCompleta] = useState(base?.descripcionCompleta ?? "")
  const [motivo, setMotivo] = useState(base?.motivo ?? "")
  const [fechaReconocimiento, setFechaReconocimiento] = useState(base?.fechaReconocimiento ?? hoyIso())
  const [periodoDesde, setPeriodoDesde] = useState(base?.periodoDesde ?? "")
  const [periodoHasta, setPeriodoHasta] = useState(base?.periodoHasta ?? "")
  const [imagen, setImagen] = useState<string | null>(base?.imagen ?? null)
  const [destacado, setDestacado] = useState(base?.destacado ?? false)
  const [mostrarEnLanding, setMostrarEnLanding] = useState(base?.mostrarEnLanding ?? false)

  const [sucursalId, setSucursalId] = useState(lg?.sucursalId ?? "")
  const [ciudad, setCiudad] = useState(lg?.ciudad ?? "")
  const [departamento, setDepartamento] = useState(lg?.departamento ?? "")
  const [responsableNombre, setResponsableNombre] = useState(lg?.responsableNombre ?? "")
  const [tipoLogro, setTipoLogro] = useState(lg?.tipoLogro ?? "operativo")
  const [indicadores, setIndicadores] = useState<Array<{ nombre: string; valor: string; unidad: string }>>(
    indicadoresInit.map((i) => ({ nombre: i.nombre, valor: i.valor, unidad: i.unidad ?? "" })),
  )

  function cuandoSeleccionaSucursal(id: string) {
    setSucursalId(id)
    const s = sucursales.find((x) => x.id === id)
    if (s) {
      setCiudad(s.capital)
      setDepartamento(s.departamento)
    }
  }

  function build(): LogroSucursalInput {
    return {
      tipo: "logro_sucursal",
      titulo,
      descripcionCorta: descCorta,
      descripcionCompleta: descCompleta,
      motivo,
      imagen: imagen ?? null,
      fechaReconocimiento,
      periodoDesde: periodoDesde || null,
      periodoHasta: periodoHasta || null,
      destacado,
      mostrarEnLanding,
      sucursalId,
      ciudad,
      departamento,
      responsableNombre,
      tipoLogro,
      indicadores: indicadores.map((i) => ({
        nombre: i.nombre,
        valor: i.valor,
        unidad: i.unidad || null,
      })),
    }
  }

  return (
    <Card className="border-border/40">
      <CardHeader className="border-b border-border/30 bg-muted/20">
        <CardTitle className="flex items-center gap-2">
          <MapPinIcon className="h-5 w-5 text-[#FFB300]" />
          Datos del logro de sucursal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <BaseCamposBasicos
          titulo={titulo} setTitulo={setTitulo}
          descCorta={descCorta} setDescCorta={setDescCorta}
          descCompleta={descCompleta} setDescCompleta={setDescCompleta}
          motivo={motivo} setMotivo={setMotivo}
          fechaReconocimiento={fechaReconocimiento} setFechaReconocimiento={setFechaReconocimiento}
          periodoDesde={periodoDesde} setPeriodoDesde={setPeriodoDesde}
          periodoHasta={periodoHasta} setPeriodoHasta={setPeriodoHasta}
          imagen={imagen} setImagen={setImagen}
          destacado={destacado} setDestacado={setDestacado}
          mostrarEnLanding={mostrarEnLanding} setMostrarEnLanding={setMostrarEnLanding}
        />

        <div className="h-px bg-border/50" />

        <div className="space-y-4">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <BuildingIcon className="h-4 w-4 text-[#FFB300]" />
            Información de la sucursal
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Sucursal *
              </Label>
              <select
                value={sucursalId}
                onChange={(e) => cuandoSeleccionaSucursal(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB300]/30"
              >
                <option value="">— Seleccionar sucursal —</option>
                {sucursales.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre} ({s.departamento})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tipo de logro *
              </Label>
              <select
                value={tipoLogro}
                onChange={(e) => setTipoLogro(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB300]/30"
              >
                {TIPOS_LOGRO.map((t) => (
                  <option key={t} value={t}>
                    {t[0].toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Ciudad *
              </Label>
              <Input value={ciudad} onChange={(e) => setCiudad(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Departamento *
              </Label>
              <Input value={departamento} onChange={(e) => setDepartamento(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Responsable *
              </Label>
              <Input value={responsableNombre} onChange={(e) => setResponsableNombre(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="h-px bg-border/50" />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <MapPinIcon className="h-4 w-4 text-[#FFB300]" />
              Indicadores de resultado ({indicadores.length})
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIndicadores((prev) => [...prev, { nombre: "", valor: "", unidad: "" }])}
            >
              <PlusIcon className="mr-1.5 h-3.5 w-3.5" />
              Agregar indicador
            </Button>
          </div>
          {indicadores.length === 0 ? (
            <p className="text-xs text-muted-foreground/70 italic py-4 text-center border border-dashed border-border/50 rounded-lg">
              Sin indicadores. El primero aparece como resultado destacado en la landing.
            </p>
          ) : (
            <div className="space-y-2">
              {indicadores.map((ind, idx) => (
                <div key={idx} className="grid gap-2 rounded-lg border border-border/50 p-3 sm:grid-cols-[1fr_1fr_auto_auto]">
                  <Input
                    value={ind.nombre}
                    onChange={(e) =>
                      setIndicadores((prev) => {
                        const copy = [...prev]
                        copy[idx] = { ...copy[idx], nombre: e.target.value }
                        return copy
                      })
                    }
                    placeholder="Nombre (Ej: Atenciones)"
                    className="h-9 text-xs"
                  />
                  <Input
                    value={ind.valor}
                    onChange={(e) =>
                      setIndicadores((prev) => {
                        const copy = [...prev]
                        copy[idx] = { ...copy[idx], valor: e.target.value }
                        return copy
                      })
                    }
                    placeholder="Valor (Ej: +32%)"
                    className="h-9 text-xs"
                  />
                  <Input
                    value={ind.unidad}
                    onChange={(e) =>
                      setIndicadores((prev) => {
                        const copy = [...prev]
                        copy[idx] = { ...copy[idx], unidad: e.target.value }
                        return copy
                      })
                    }
                    placeholder="Unidad"
                    className="h-9 text-xs w-24"
                  />
                  <button
                    type="button"
                    onClick={() => setIndicadores((prev) => prev.filter((_, i) => i !== idx))}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-red-500/10 hover:text-red-600"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <BotonesFormulario isPending={isPending} onGuardar={() => onSubmit(build(), false)} onEnviar={() => onSubmit(build(), true)} />
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Botones compartidos
// ─────────────────────────────────────────────────────────────────────────────
function BotonesFormulario({
  isPending,
  onGuardar,
  onEnviar,
}: {
  isPending: boolean
  onGuardar: () => void
  onEnviar: () => void
}) {
  return (
    <div className="flex flex-wrap justify-end gap-2 pt-2">
      <Button type="button" variant="outline" disabled={isPending} onClick={onGuardar}>
        <SaveIcon className="mr-2 h-4 w-4" />
        Guardar borrador
      </Button>
      <Button
        type="button"
        disabled={isPending}
        onClick={onEnviar}
        className="bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000] font-bold shadow-md"
      >
        <SendIcon className="mr-2 h-4 w-4" />
        {isPending ? "Procesando..." : "Guardar y enviar a revisión"}
      </Button>
    </div>
  )
}
