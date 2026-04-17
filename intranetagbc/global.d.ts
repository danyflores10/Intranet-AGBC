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

  interface NotificacionSocketPayload {
    id: string
    titulo: string
    mensaje: string
    tipo: string
    leida: boolean
    usuarioId: string
    enlace: string | null
    createdAt: Date | string
  }

  interface NotificationReadPayload {
    id: string
    usuarioId: string
  }

  interface NotificationReadAllPayload {
    usuarioId: string
  }

  interface NotificationDeletePayload {
    id: string
    usuarioId: string
  }

  interface ServerToClientEvents {
    "ticket:message:new": (payload: TicketMessageNewPayload) => void
    "notification:new": (payload: NotificacionSocketPayload) => void
    "notification:read": (payload: NotificationReadPayload) => void
    "notification:read-all": (payload: NotificationReadAllPayload) => void
    "notification:delete": (payload: NotificationDeletePayload) => void
  }

  interface ClientToServerEvents {
    "ticket:join": (ticketId: string) => void
    "ticket:leave": (ticketId: string) => void
    "user:join": (userId: string) => void
    "user:leave": (userId: string) => void
  }

  var io: SocketIOServer<ClientToServerEvents, ServerToClientEvents> | undefined
}

export {}
