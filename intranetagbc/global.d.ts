import type { Server as SocketIOServer } from "socket.io"

declare global {
  type SoporteSocketMessage = {
    id: string
    ticketId: string
    emisorId: string
    contenido: string | null
    tipoMensaje: string
    archivoUrl: string | null
    archivoNombre: string | null
    archivoTipo: string | null
    createdAt: Date | string
  }

  interface TicketMessageNewPayload {
    message: SoporteSocketMessage
    ticketUpdatedAt: Date | string
  }

  interface ServerToClientEvents {
    "ticket:message:new": (payload: TicketMessageNewPayload) => void
  }

  interface ClientToServerEvents {
    "ticket:join": (ticketId: string) => void
    "ticket:leave": (ticketId: string) => void
  }

  var io: SocketIOServer<ClientToServerEvents, ServerToClientEvents> | undefined
}

export {}
