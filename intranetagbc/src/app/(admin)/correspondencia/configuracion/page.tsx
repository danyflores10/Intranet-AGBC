import { redirect } from "next/navigation"

import { obtenerUsuarioRbacActual } from "@/lib/auth/session-access"
import { puedeAccederUsuario } from "@/lib/rbac"
import { PERMISOS, PERMISOS_CORRESPONDENCIA } from "@/lib/auth/permisos"
import { obtenerTiposDocumento } from "@/actions/correspondencia"
import { CorrespondenciaConfiguracion } from "@/components/modules/correspondencia/configuracion"

export default async function ConfiguracionPage() {
  const usuario = await obtenerUsuarioRbacActual()
  if (!usuario) redirect("/")
  if (!puedeAccederUsuario(usuario, { permissions: [PERMISOS.CORRESPONDENCIA.CONFIGURAR] })) {
    redirect("/correspondencia")
  }

  const tipos = await obtenerTiposDocumento()
  const permisos = Object.values(PERMISOS_CORRESPONDENCIA)

  return <CorrespondenciaConfiguracion tipos={tipos} permisos={permisos} />
}
