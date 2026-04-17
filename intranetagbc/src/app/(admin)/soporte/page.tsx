import { redirect } from "next/navigation"
import { obtenerUsuarioRbacActual } from "@/lib/auth/session-access"
import { obtenerTicketsUsuario, obtenerUsuariosSoporte } from "@/actions/soporte"
import { SoporteModule } from "@/components/modules/soporte-module"

type SoportePageProps = {
  searchParams?: Promise<{ ticket?: string | string[] }> | { ticket?: string | string[] }
}

export default async function SoportePage({ searchParams }: SoportePageProps) {
  const usuario = await obtenerUsuarioRbacActual()
  if (!usuario) redirect("/")

  const params = await searchParams
  const ticketParam = params?.ticket
  const ticketInicialId = Array.isArray(ticketParam) ? (ticketParam[0] ?? null) : (ticketParam ?? null)

  const [tickets, usuarios] = await Promise.all([
    obtenerTicketsUsuario(usuario.id),
    obtenerUsuariosSoporte(),
  ])

  return (
    <SoporteModule
      tickets={tickets}
      usuarios={usuarios}
      currentUserId={usuario.id}
      ticketInicialId={ticketInicialId}
    />
  )
}
