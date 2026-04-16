"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileTextIcon, UsersIcon, MailIcon, ClipboardListIcon, MegaphoneIcon } from "lucide-react"

interface Props {
  counts: {
    documentos: number
    correspondencia: number
    tramites: number
    personal: number
    comunicados: number
    usuarios: number
  }
}

export function ReportesModule({ counts }: Props) {
  const items = [
    { label: "Documentos", count: counts.documentos, icon: FileTextIcon, color: "text-blue-600" },
    { label: "Correspondencia", count: counts.correspondencia, icon: MailIcon, color: "text-green-600" },
    { label: "Trámites", count: counts.tramites, icon: ClipboardListIcon, color: "text-purple-600" },
    { label: "Personal", count: counts.personal, icon: UsersIcon, color: "text-teal-600" },
    { label: "Comunicados", count: counts.comunicados, icon: MegaphoneIcon, color: "text-amber-600" },
    { label: "Usuarios", count: counts.usuarios, icon: UsersIcon, color: "text-indigo-600" },
  ]

  return (
    <>
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Reportes del sistema</h2>
          <p className="text-sm text-muted-foreground">Resumen general de registros en la base de datos</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <Card key={item.label} className="border-border/40">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{item.label}</CardTitle>
                <item.icon className={`h-5 w-5 ${item.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{item.count}</div>
                <p className="text-xs text-muted-foreground">registros totales</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  )
}
