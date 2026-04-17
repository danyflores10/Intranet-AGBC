"use server"

import { db } from "@/db"
import { ticketsSoporte, mensajesSoporte } from "@/db/schema/soporte.schema"
import { users } from "@/db/schema/users.schema"
import { eq, desc, or, count } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { crearNotificacionRealtime } from "@/lib/notificaciones-realtime"

function nombreCompletoUsuario(usuario?: {
  firstName: string
  lastNamePaternal: string
  lastNameMaternal: string | null
}) {
  if (!usuario) return "Usuario"
  return [usuario.firstName, usuario.lastNamePaternal, usuario.lastNameMaternal]
    .filter(Boolean)
    .join(" ")
}

async function obtenerNombreUsuario(userId: string) {
  const [usuario] = await db.select({
    firstName: users.firstName,
    lastNamePaternal: users.lastNamePaternal,
    lastNameMaternal: users.lastNameMaternal,
  })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  return nombreCompletoUsuario(usuario)
}

// ─── Obtener usuarios activos ───
export async function obtenerUsuariosSoporte() {
  return db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastNamePaternal: users.lastNamePaternal,
      lastNameMaternal: users.lastNameMaternal,
      institutionalEmail: users.institutionalEmail,
      image: users.image,
    })
    .from(users)
    .where(eq(users.isActive, true))
    .orderBy(users.firstName)
}

// ─── Obtener tickets del usuario ───
export async function obtenerTicketsUsuario(userId: string) {
  return db
    .select()
    .from(ticketsSoporte)
    .where(or(
      eq(ticketsSoporte.solicitanteId, userId),
      eq(ticketsSoporte.agenteId, userId)
    ))
    .orderBy(desc(ticketsSoporte.updatedAt))
}

// ─── Crear ticket de soporte ───
export async function crearTicketSoporte(data: {
  asunto: string
  prioridad?: string
  solicitanteId: string
  agenteId: string
}) {
  const ahora = new Date()
  const anio = ahora.getFullYear()
  const totalTickets = await db.select({ count: count() }).from(ticketsSoporte)
  const numero = (totalTickets[0]?.count ?? 0) + 1
  const codigo = `TK-${anio}-${String(numero).padStart(4, "0")}`

  const [ticket] = await db.insert(ticketsSoporte).values({
    codigo,
    asunto: data.asunto,
    prioridad: data.prioridad ?? "media",
    solicitanteId: data.solicitanteId,
    agenteId: data.agenteId,
  }).returning()

  // Mensaje de sistema inicial
  await db.insert(mensajesSoporte).values({
    ticketId: ticket.id,
    emisorId: data.solicitanteId,
    contenido: `Conversación de soporte iniciada: ${data.asunto}`,
    tipoMensaje: "sistema",
  })

  // Notificación al agente
  const solicitanteNombre = await obtenerNombreUsuario(data.solicitanteId)
  await crearNotificacionRealtime({
    titulo: `Nueva solicitud de ${solicitanteNombre}`,
    mensaje: `${solicitanteNombre} inició un chat de soporte: ${data.asunto}`,
    tipo: "soporte",
    usuarioId: data.agenteId,
    enlace: `/soporte?ticket=${ticket.id}`,
    creadoPor: data.solicitanteId,
  })

  revalidatePath("/soporte")
  return ticket
}

// ─── Obtener mensajes de un ticket ───
export async function obtenerMensajesTicket(ticketId: string) {
  return db
    .select()
    .from(mensajesSoporte)
    .where(eq(mensajesSoporte.ticketId, ticketId))
    .orderBy(mensajesSoporte.createdAt)
}

// ─── Enviar mensaje ───
export async function enviarMensaje(data: {
  ticketId: string
  emisorId: string
  contenido?: string
  tipoMensaje?: string
  archivoUrl?: string
  archivoNombre?: string
  archivoTipo?: string
}) {
  const [mensaje] = await db.insert(mensajesSoporte).values({
    ticketId: data.ticketId,
    emisorId: data.emisorId,
    contenido: data.contenido ?? null,
    tipoMensaje: data.tipoMensaje ?? "texto",
    archivoUrl: data.archivoUrl ?? null,
    archivoNombre: data.archivoNombre ?? null,
    archivoTipo: data.archivoTipo ?? null,
  }).returning()

  // Actualizar timestamp del ticket
  const updatedAt = new Date()
  await db.update(ticketsSoporte)
    .set({ updatedAt })
    .where(eq(ticketsSoporte.id, data.ticketId))

  // Notificar al otro participante
  const ticket = await db.select().from(ticketsSoporte).where(eq(ticketsSoporte.id, data.ticketId)).then(r => r[0])
  if (ticket) {
    const destinatarioId = data.emisorId === ticket.solicitanteId
      ? ticket.agenteId
      : ticket.solicitanteId
    if (destinatarioId) {
      const emisorNombre = await obtenerNombreUsuario(data.emisorId)
      await crearNotificacionRealtime({
        titulo: `Mensaje de ${emisorNombre}`,
        mensaje: data.contenido
          ? `${emisorNombre}: ${data.contenido.substring(0, 180)}`
          : data.archivoNombre
            ? `${emisorNombre} envió un archivo: ${data.archivoNombre}`
            : `${emisorNombre} envió un mensaje`,
        tipo: "soporte",
        usuarioId: destinatarioId,
        enlace: `/soporte?ticket=${data.ticketId}`,
        creadoPor: data.emisorId,
      })
    }
  }

  const payload: TicketMessageNewPayload = {
    message: {
      id: mensaje.id,
      ticketId: mensaje.ticketId,
      emisorId: mensaje.emisorId,
      contenido: mensaje.contenido,
      tipoMensaje: mensaje.tipoMensaje,
      archivoUrl: mensaje.archivoUrl,
      archivoNombre: mensaje.archivoNombre,
      archivoTipo: mensaje.archivoTipo,
      createdAt: mensaje.createdAt,
    },
    ticketUpdatedAt: updatedAt,
  }

  global.io?.to(`ticket:${data.ticketId}`).emit("ticket:message:new", payload)

  revalidatePath("/soporte")
  return mensaje
}

// ─── Actualizar estado del ticket ───
export async function actualizarEstadoTicket(
  ticketId: string,
  estado: string,
  userId: string
) {
  await db.update(ticketsSoporte).set({
    estado,
    ...(estado === "cerrado" ? { cerradoAt: new Date() } : {}),
  }).where(eq(ticketsSoporte.id, ticketId))

  // Mensaje de sistema
  const estadoLabel: Record<string, string> = {
    abierto: "reabierto",
    en_atencion: "en atención",
    resuelto: "marcado como resuelto",
    cerrado: "cerrado",
  }
  await db.insert(mensajesSoporte).values({
    ticketId,
    emisorId: userId,
    contenido: `Ticket ${estadoLabel[estado] ?? estado}`,
    tipoMensaje: "sistema",
  })

  // Notificar al otro participante
  const ticket = await db.select().from(ticketsSoporte).where(eq(ticketsSoporte.id, ticketId)).then(r => r[0])
  if (ticket) {
    const destinatarioId = userId === ticket.solicitanteId
      ? ticket.agenteId
      : ticket.solicitanteId
    if (destinatarioId) {
      const actorNombre = await obtenerNombreUsuario(userId)
      await crearNotificacionRealtime({
        titulo: `Ticket ${ticket.codigo} actualizado`,
        mensaje: `${actorNombre} cambió el estado a: ${estadoLabel[estado] ?? estado}`,
        tipo: "soporte",
        usuarioId: destinatarioId,
        enlace: `/soporte?ticket=${ticketId}`,
        creadoPor: userId,
      })
    }
  }

  revalidatePath("/soporte")
}

// ─── Obtener ticket por ID ───
export async function obtenerTicketPorId(ticketId: string) {
  return db.select().from(ticketsSoporte).where(eq(ticketsSoporte.id, ticketId)).then(r => r[0] ?? null)
}
