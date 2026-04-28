import { redirect } from "next/navigation"

import { obtenerUsuarioRbacActual } from "@/lib/auth/session-access"
import { puedeAccederUsuario } from "@/lib/rbac"
import { PERMISOS } from "@/lib/auth/permisos"
import {
  obtenerCorrespondencia,
  obtenerSucursalesBasicas,
  obtenerUsuariosBasicos,
} from "@/actions/correspondencia"
import { CorrespondenciaDerivaciones } from "@/components/modules/correspondencia/derivaciones"
import type { CorrespondenciaRow } from "@/components/modules/correspondencia/shared"

export default async function DerivacionesPage() {
  const usuario = await obtenerUsuarioRbacActual()
  if (!usuario) redirect("/")
  if (
    !puedeAccederUsuario(usuario, {
      permissions: [PERMISOS.CORRESPONDENCIA.DERIVAR, PERMISOS.CORRESPONDENCIA.EDITAR],
    })
  ) {
    redirect("/correspondencia")
  }

  const [todas, usuarios, sucursales] = await Promise.all([
    obtenerCorrespondencia(),
    obtenerUsuariosBasicos(),
    obtenerSucursalesBasicas(),
  ])

  const pendientes = todas.filter(
    (c) => !["finalizado", "archivado", "rechazado"].includes(c.estado),
  ) as unknown as CorrespondenciaRow[]

  return (
    <CorrespondenciaDerivaciones
      pendientes={pendientes}
      usuarios={usuarios}
      sucursales={sucursales}
    />
  )
}
