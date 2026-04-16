import { redirect } from "next/navigation"
import { obtenerUsuarioRbacActual } from "@/lib/auth/session-access"
import { obtenerTicketsUsuario, obtenerUsuariosSoporte } from "@/actions/soporte"
import { SoporteModule } from "@/components/modules/soporte-module"

export default async function SoportePage() {
  const usuario = await obtenerUsuarioRbacActual()
  if (!usuario) redirect("/")

  const [tickets, usuarios] = await Promise.all([
    obtenerTicketsUsuario(usuario.id),
    obtenerUsuariosSoporte(),
  ])

  return (
    <SoporteModule
      tickets={tickets}
      usuarios={usuarios}
      currentUserId={usuario.id}
    />
  )
}
