import { redirect } from "next/navigation"
import { obtenerUsuarioRbacActual } from "@/lib/auth/session-access"
import { puedeAccederUsuario } from "@/lib/rbac"
import { PERMISOS } from "@/lib/auth/permisos"
import { obtenerComunicados, obtenerBanners, obtenerAccesosDirectos } from "@/actions/comunicaciones"
import { ComunicacionesModule } from "@/components/modules/comunicaciones-module"

export default async function ComunicacionesPage() {
  const usuario = await obtenerUsuarioRbacActual()
  if (!usuario) redirect("/login")
  if (!puedeAccederUsuario(usuario, { permissions: [PERMISOS.COMUNICADOS.VER, PERMISOS.NOTICIAS.VER, PERMISOS.ACCESOS.VER, PERMISOS.CONTENIDOS.VER] })) redirect("/dashboard")

  const [comunicados, banners, accesosDirectos] = await Promise.all([
    obtenerComunicados(),
    obtenerBanners(),
    obtenerAccesosDirectos(),
  ])

  return <ComunicacionesModule comunicados={comunicados} noticias={banners} accesosDirectos={accesosDirectos} usuario={usuario} />
}
