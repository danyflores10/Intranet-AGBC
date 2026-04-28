import { redirect } from "next/navigation"

import { obtenerUsuarioRbacActual } from "@/lib/auth/session-access"
import { puedeAccederUsuario } from "@/lib/rbac"
import { PERMISOS } from "@/lib/auth/permisos"
import {
  obtenerCorrespondenciaPorId,
  obtenerSucursalesBasicas,
  obtenerTiposDocumento,
  obtenerUsuariosBasicos,
} from "@/actions/correspondencia"
import { CorrespondenciaEditar } from "@/components/modules/correspondencia/editar"

export default async function EditarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const usuario = await obtenerUsuarioRbacActual()
  if (!usuario) redirect("/")
  if (!puedeAccederUsuario(usuario, { permissions: [PERMISOS.CORRESPONDENCIA.EDITAR] })) {
    redirect("/correspondencia")
  }

  const { id } = await searchParams
  if (!id) redirect("/correspondencia")

  const [correspondenciaData, tipos, usuariosBasicos, sucursales] = await Promise.all([
    obtenerCorrespondenciaPorId(id),
    obtenerTiposDocumento(),
    obtenerUsuariosBasicos(),
    obtenerSucursalesBasicas(),
  ])

  if (!correspondenciaData) {
    redirect("/correspondencia")
  }

  const {
    movimientos,
    adjuntos,
    ...correspondencia
  } = correspondenciaData

  return (
    <CorrespondenciaEditar
      correspondencia={correspondencia}
      tiposDocumento={tipos}
      usuarios={usuariosBasicos}
      sucursales={sucursales}
    />
  )
}
