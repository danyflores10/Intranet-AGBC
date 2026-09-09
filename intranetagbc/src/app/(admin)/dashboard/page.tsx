import { redirect } from "next/navigation"
import { obtenerUsuarioRbacActual } from "@/lib/auth/session-access"
import { obtenerConteos } from "@/actions/reportes"
import { obtenerNotificacionesUsuario } from "@/actions/notificaciones"
import {
  obtenerComunicadosPublicados,
  obtenerBannersActivos,
  obtenerAccesosDirectosActivos,
} from "@/actions/comunicaciones"
import { obtenerPersonal } from "@/actions/rrhh"
import { obtenerDocumentos } from "@/actions/documentos"
import { obtenerUsuarios } from "@/actions/usuarios"
import { obtenerSucursalesActivas } from "@/actions/sucursales"
import { DashboardModule } from "@/components/modules/dashboard-module"

export default async function DashboardPage() {
  const usuario = await obtenerUsuarioRbacActual()
  if (!usuario) redirect("/")

  const [
    counts,
    notificaciones,
    comunicadosPublicadosDb,
    bannersActivosDb,
    accesosDirectosDb,
    personalDb,
    documentosDb,
    usuariosResult,
    sucursalesDb,
  ] = await Promise.all([
    obtenerConteos(),
    obtenerNotificacionesUsuario(usuario.id),
    obtenerComunicadosPublicados(),
    obtenerBannersActivos(),
    obtenerAccesosDirectosActivos(),
    obtenerPersonal(),
    obtenerDocumentos(),
    obtenerUsuarios(),
    obtenerSucursalesActivas(),
  ])

  const usuariosList = usuariosResult.success && usuariosResult.data
    ? usuariosResult.data
    : []

  return (
    <DashboardModule
      counts={counts}
      user={usuario}
      notificaciones={notificaciones}
      personal={personalDb}
      documentos={documentosDb}
      usuarios={usuariosList}
      comunicados={comunicadosPublicadosDb}
      sucursales={sucursalesDb}
    />
  )
}
