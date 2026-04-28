import { redirect } from "next/navigation"

import { obtenerUsuarioRbacActual } from "@/lib/auth/session-access"
import { puedeAccederUsuario } from "@/lib/rbac"
import { PERMISOS } from "@/lib/auth/permisos"
import {
  generarReporte,
  obtenerSucursalesBasicas,
  obtenerUsuariosBasicos,
} from "@/actions/correspondencia"
import { CorrespondenciaReportes } from "@/components/modules/correspondencia/reportes"
import type { CorrespondenciaRow } from "@/components/modules/correspondencia/shared"

export default async function ReportesPage() {
  const usuario = await obtenerUsuarioRbacActual()
  if (!usuario) redirect("/")
  if (
    !puedeAccederUsuario(usuario, {
      permissions: [PERMISOS.CORRESPONDENCIA.REPORTAR, PERMISOS.CORRESPONDENCIA.VER],
    })
  ) {
    redirect("/dashboard")
  }

  const [reporte, usuarios, sucursales] = await Promise.all([
    generarReporte({}),
    obtenerUsuariosBasicos(),
    obtenerSucursalesBasicas(),
  ])

  const areas = Array.from(
    new Set(reporte.items.map((c) => c.destinoArea).filter((a): a is string => Boolean(a))),
  ).sort()

  return (
    <CorrespondenciaReportes
      iniciales={reporte.items as unknown as CorrespondenciaRow[]}
      productividadInicial={reporte.productividadArea}
      usuarios={usuarios}
      sucursales={sucursales}
      areas={areas}
    />
  )
}
