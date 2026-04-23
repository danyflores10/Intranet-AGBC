import { redirect } from "next/navigation"

import { obtenerUsuarioRbacActual } from "@/lib/auth/session-access"
import { obtenerNotificacionesUsuario, contarNotificacionesNoLeidas } from "@/actions/notificaciones"
import { NotificacionesModule } from "@/components/modules/notificaciones-module"

export default async function NotificacionesPage() {
  const usuario = await obtenerUsuarioRbacActual()
  if (!usuario) redirect("/")

  const [notificaciones, noLeidasCount] = await Promise.all([
    obtenerNotificacionesUsuario(usuario.id),
    contarNotificacionesNoLeidas(usuario.id),
  ])

  return (
    <NotificacionesModule
      usuarioId={usuario.id}
      notificacionesIniciales={notificaciones}
      noLeidasCount={noLeidasCount}
    />
  )
}
