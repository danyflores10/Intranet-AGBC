import { redirect } from "next/navigation"
import { obtenerUsuarioRbacActual } from "@/lib/auth/session-access"
import {
  obtenerDestinatariosMensajeria,
  obtenerHistorialMensajeria,
} from "@/actions/mensajeria"
import { MensajeriaModule } from "@/components/modules/mensajeria-module"

export const metadata = {
  title: "Mensajería Masiva | Intranet AGBC",
  description: "Despacho de comunicaciones y notificaciones institucionales a todos los usuarios.",
}

export default async function MensajeriaPage() {
  const usuario = await obtenerUsuarioRbacActual()
  if (!usuario) {
    redirect("/")
  }

  const tieneAccesoMensajeria = usuario.roles.some((r) =>
    ["administrador", "admin", "super_admin", "gestor", "usuario"].includes(r.toLowerCase().trim())
  ) || (usuario.permissions && usuario.permissions.length > 0)

  if (!tieneAccesoMensajeria) {
    redirect("/dashboard")
  }

  const [destinatariosData, historialInicial] = await Promise.all([
    obtenerDestinatariosMensajeria(),
    obtenerHistorialMensajeria(),
  ])

  const nombreAdmin = (usuario.name || "Administrador").trim()

  return (
    <div className="space-y-6">
      <MensajeriaModule
        destinatariosData={destinatariosData}
        historialInicial={historialInicial}
        usuarioActualNombre={nombreAdmin || "Administración Central"}
      />
    </div>
  )
}
