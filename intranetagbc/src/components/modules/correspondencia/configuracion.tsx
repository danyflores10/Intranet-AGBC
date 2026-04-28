"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  CheckIcon,
  PencilIcon,
  PlusIcon,
  SettingsIcon,
  ShieldIcon,
  Trash2Icon,
} from "lucide-react"
import toast from "react-hot-toast"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  actualizarTipoDocumento,
  crearTipoDocumento,
  eliminarTipoDocumento,
} from "@/actions/correspondencia"
import {
  ESTADOS_CORRESPONDENCIA,
  PRIORIDADES_CORRESPONDENCIA,
  colorEstado,
  colorPrioridad,
} from "@/lib/correspondencia-constants"
import { cn } from "@/lib/utils"

type TipoDocumento = {
  id: string
  nombre: string
  descripcion: string | null
  plazoDefaultDias: number
  activo: boolean
}

interface Props {
  tipos: TipoDocumento[]
  permisos: string[]
}

export function CorrespondenciaConfiguracion({ tipos, permisos }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState<TipoDocumento | null>(null)
  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [plazo, setPlazo] = useState("5")
  const [isPending, startTransition] = useTransition()

  function reset() {
    setEditing(null)
    setNombre("")
    setDescripcion("")
    setPlazo("5")
  }

  function startEdit(t: TipoDocumento) {
    setEditing(t)
    setNombre(t.nombre)
    setDescripcion(t.descripcion ?? "")
    setPlazo(String(t.plazoDefaultDias))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!nombre.trim()) {
      toast.error("El nombre es obligatorio")
      return
    }
    const dias = Number(plazo)
    if (Number.isNaN(dias) || dias < 0) {
      toast.error("Plazo inválido")
      return
    }
    startTransition(async () => {
      try {
        if (editing) {
          await actualizarTipoDocumento(editing.id, {
            nombre: nombre.trim(),
            descripcion: descripcion.trim() || undefined,
            plazoDefaultDias: dias,
          })
          toast.success("Tipo de documento actualizado")
        } else {
          await crearTipoDocumento({
            nombre: nombre.trim(),
            descripcion: descripcion.trim() || undefined,
            plazoDefaultDias: dias,
          })
          toast.success("Tipo de documento creado")
        }
        reset()
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al guardar")
      }
    })
  }

  async function toggleActivo(t: TipoDocumento) {
    startTransition(async () => {
      await actualizarTipoDocumento(t.id, { activo: !t.activo })
      toast.success(!t.activo ? "Activado" : "Desactivado")
      router.refresh()
    })
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este tipo de documento?")) return
    startTransition(async () => {
      try {
        await eliminarTipoDocumento(id)
        toast.success("Eliminado")
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "No se pudo eliminar")
      }
    })
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <SettingsIcon className="h-5 w-5 text-[#FF8800]" />
          Configuración del módulo
        </h2>
        <p className="text-sm text-muted-foreground">
          Tipos de documento, prioridades, estados y permisos
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="border-border/40">
          <CardContent className="p-0">
            <div className="border-b p-4">
              <h3 className="text-sm font-semibold">Tipos de documento</h3>
              <p className="text-xs text-muted-foreground">
                Carta, oficio, memorándum, informe, etc. con plazo por defecto
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3 text-left">Nombre</th>
                    <th className="px-4 py-3 text-left">Descripción</th>
                    <th className="px-4 py-3 text-left">Plazo</th>
                    <th className="px-4 py-3 text-left">Estado</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {tipos.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                        Sin tipos registrados.
                      </td>
                    </tr>
                  ) : (
                    tipos.map((t) => (
                      <tr key={t.id} className="border-b transition-colors hover:bg-muted/20">
                        <td className="px-4 py-3 font-medium">{t.nombre}</td>
                        <td className="px-4 py-3 text-muted-foreground">{t.descripcion ?? "—"}</td>
                        <td className="px-4 py-3">{t.plazoDefaultDias} días</td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => toggleActivo(t)}
                            className={cn(
                              "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                              t.activo
                                ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                                : "bg-zinc-100 text-zinc-700 dark:bg-zinc-500/10 dark:text-zinc-400",
                            )}
                          >
                            {t.activo ? "Activo" : "Inactivo"}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              title="Editar"
                              onClick={() => startEdit(t)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-all hover:border-[#FFB300]/40 hover:bg-[#FFB300]/10 hover:text-[#FF8800]"
                            >
                              <PencilIcon className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              title="Eliminar"
                              disabled={isPending}
                              onClick={() => handleDelete(t.id)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-all hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:hover:border-red-500/30 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                            >
                              <Trash2Icon className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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
            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              <h3 className="text-sm font-semibold">
                {editing ? `Editar: ${editing.nombre}` : "Nuevo tipo de documento"}
              </h3>
              <div className="space-y-1.5">
                <Label className="text-xs">Nombre *</Label>
                <Input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={80} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Descripción</Label>
                <Input
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  maxLength={200}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Plazo por defecto (días)</Label>
                <Input
                  type="number"
                  min={0}
                  value={plazo}
                  onChange={(e) => setPlazo(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 border-t pt-3">
                {editing && (
                  <Button type="button" variant="outline" onClick={reset}>
                    Cancelar
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={isPending}
                  className="gap-2 bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000]"
                >
                  {editing ? <CheckIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
                  {isPending ? "Guardando..." : editing ? "Actualizar" : "Crear"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="border-border/40">
          <CardContent className="space-y-3 p-5">
            <h3 className="text-sm font-semibold">Prioridades</h3>
            <div className="flex flex-wrap gap-2">
              {PRIORIDADES_CORRESPONDENCIA.map((p) => (
                <span
                  key={p.value}
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                    colorPrioridad(p.value),
                  )}
                >
                  {p.label}
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Los niveles de prioridad son fijos y forman parte de la trazabilidad institucional.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardContent className="space-y-3 p-5">
            <h3 className="text-sm font-semibold">Estados</h3>
            <div className="flex flex-wrap gap-2">
              {ESTADOS_CORRESPONDENCIA.map((e) => (
                <span
                  key={e.value}
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                    colorEstado(e.value),
                  )}
                >
                  {e.label}
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Flujo: registrado → derivado → en revisión → atendido → finalizado / archivado.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardContent className="space-y-3 p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <ShieldIcon className="h-4 w-4 text-[#FF8800]" />
              Permisos del módulo
            </h3>
            <ul className="space-y-1.5 text-xs">
              {permisos.map((p) => (
                <li key={p} className="flex items-center gap-2">
                  <CheckIcon className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="font-mono">{p}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">
              Asigne estos permisos en el módulo de Roles para controlar el acceso por perfil.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
