"use client"

import { useState, useTransition } from "react"
import { SaveIcon } from "lucide-react"
import toast from "react-hot-toast"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { guardarMultipleConfiguracion } from "@/actions/configuracion"

interface ConfigItem {
  id: string
  clave: string
  valor: string
  descripcion: string | null
  grupo: string
}

interface Props {
  configs: ConfigItem[]
}

const defaultConfigs = [
  { clave: "sitio_nombre", grupo: "general", descripcion: "Nombre del sitio" },
  { clave: "sitio_descripcion", grupo: "general", descripcion: "Descripción del sitio" },
  { clave: "sitio_email", grupo: "general", descripcion: "Email de contacto" },
  { clave: "sitio_telefono", grupo: "general", descripcion: "Teléfono de contacto" },
  { clave: "sitio_direccion", grupo: "general", descripcion: "Dirección de la institución" },
  { clave: "landing_titulo", grupo: "landing", descripcion: "Título de la página principal" },
  { clave: "landing_subtitulo", grupo: "landing", descripcion: "Subtítulo de la página principal" },
  { clave: "mantenimiento_activo", grupo: "sistema", descripcion: "Modo mantenimiento (true/false)" },
]

export function ConfiguracionModule({ configs }: Props) {
  const [isPending, startTransition] = useTransition()
  const configMap = new Map(configs.map(c => [c.clave, c.valor]))

  const groups = new Map<string, typeof defaultConfigs>()
  for (const dc of defaultConfigs) {
    const arr = groups.get(dc.grupo) ?? []
    arr.push(dc)
    groups.set(dc.grupo, arr)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        const items = defaultConfigs.map(dc => ({
          clave: dc.clave,
          valor: (fd.get(dc.clave) as string) ?? "",
          grupo: dc.grupo,
          descripcion: dc.descripcion,
        }))
        await guardarMultipleConfiguracion(items)
        toast.success("Configuración guardada")
      } catch { toast.error("Error al guardar") }
    })
  }

  const groupLabels: Record<string, string> = {
    general: "Información general",
    landing: "Página principal",
    sistema: "Sistema",
  }

  return (
    <>
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Configuración del sistema</h2>
            <p className="text-sm text-muted-foreground">Ajustes generales de la intranet</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {[...groups.entries()].map(([grupo, items]) => (
            <Card key={grupo} className="border-border/40">
              <CardHeader><CardTitle className="text-lg">{groupLabels[grupo] ?? grupo}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {items.map(dc => (
                  <div key={dc.clave} className="space-y-1">
                    <Label htmlFor={dc.clave}>{dc.descripcion}</Label>
                    <Input id={dc.clave} name={dc.clave} defaultValue={configMap.get(dc.clave) ?? ""} placeholder={dc.descripcion ?? ""} />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending} className="bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000] font-semibold shadow-md shadow-[#FFB300]/20">
              <SaveIcon className="mr-2 h-4 w-4" />
              {isPending ? "Guardando..." : "Guardar configuración"}
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}
