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

  const esAdmin = usuario.roles.some((r) =>
    ["administrador", "admin", "super_admin"].includes(r.toLowerCase().trim())
  )

  if (!esAdmin) {
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
