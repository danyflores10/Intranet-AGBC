import { redirect } from "next/navigation"
import { obtenerUsuarioRbacActual } from "@/lib/auth/session-access"
import { obtenerConteos } from "@/actions/reportes"
import { obtenerEventosMes } from "@/actions/calendario"
import { obtenerNotificacionesUsuario } from "@/actions/notificaciones"
import {
  obtenerComunicadosPublicados,
  obtenerBannersActivos,
  obtenerAccesosDirectosActivos,
} from "@/actions/comunicaciones"
import { DashboardModule } from "@/components/modules/dashboard-module"

export default async function DashboardPage() {
  const usuario = await obtenerUsuarioRbacActual()
  if (!usuario) redirect("/login")

  const hoy = new Date()
  const [counts, eventos, notificaciones, comunicadosPublicadosDb, bannersActivosDb, accesosDirectosDb] = await Promise.all([
    obtenerConteos(),
    obtenerEventosMes(hoy.getFullYear(), hoy.getMonth() + 1),
    obtenerNotificacionesUsuario(usuario.id),
    obtenerComunicadosPublicados(),
    obtenerBannersActivos(),
    obtenerAccesosDirectosActivos(),
  ])

  return (
    <DashboardModule
      counts={counts}
      user={usuario}
      eventos={eventos}
      notificaciones={notificaciones}
      seccionesPublicas={{
        comunicados: comunicadosPublicadosDb.map((c) => ({
          id: c.id,
          titulo: c.titulo,
          fecha: c.createdAt.toISOString().split("T")[0],
          destacado: c.destacado,
        })),
        banners: bannersActivosDb.map((b) => ({
          id: b.id,
          titulo: b.titulo,
          descripcion: b.descripcion ?? "",
          enlace: b.enlace ?? "",
        })),
        accesos: accesosDirectosDb.map((a) => ({
          clave: a.clave,
          titulo: a.titulo,
          descripcion: a.descripcion,
          url: a.url,
        })),
      }}
    />
  )
}
