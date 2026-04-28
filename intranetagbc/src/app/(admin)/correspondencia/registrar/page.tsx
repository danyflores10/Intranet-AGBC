import { redirect } from "next/navigation"

import { obtenerUsuarioRbacActual } from "@/lib/auth/session-access"
import { puedeAccederUsuario } from "@/lib/rbac"
import { PERMISOS } from "@/lib/auth/permisos"
import {
  generarHojaRuta,
  obtenerSucursalesBasicas,
  obtenerTiposDocumento,
  obtenerUsuariosBasicos,
} from "@/actions/correspondencia"
import { CorrespondenciaRegistrar } from "@/components/modules/correspondencia/registrar"

export default async function RegistrarPage() {
  const usuario = await obtenerUsuarioRbacActual()
  if (!usuario) redirect("/")
  if (!puedeAccederUsuario(usuario, { permissions: [PERMISOS.CORRESPONDENCIA.CREAR] })) {
    redirect("/correspondencia")
  }

  const [hojaRuta, tipos, usuarios, sucursales] = await Promise.all([
    generarHojaRuta(),
    obtenerTiposDocumento(),
    obtenerUsuariosBasicos(),
    obtenerSucursalesBasicas(),
  ])

  return (
    <CorrespondenciaRegistrar
      hojaRutaSugerida={hojaRuta}
      tiposDocumento={tipos}
      usuarios={usuarios}
      sucursales={sucursales}
    />
  )
}
