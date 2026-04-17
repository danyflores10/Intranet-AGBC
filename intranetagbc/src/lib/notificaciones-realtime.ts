import "server-only"

import { db } from "@/db"
import { notificaciones } from "@/db/schema/notificaciones.schema"

type CrearNotificacionInput = {
  titulo: string
  mensaje: string
  tipo?: string
  usuarioId: string
  enlace?: string | null
  creadoPor?: string | null
}

type NotificacionDb = typeof notificaciones.$inferSelect

function toSocketPayload(notif: NotificacionDb): NotificacionSocketPayload {
  return {
    id: notif.id,
    titulo: notif.titulo,
    mensaje: notif.mensaje,
    tipo: notif.tipo,
    leida: notif.leida,
    usuarioId: notif.usuarioId,
    enlace: notif.enlace ?? null,
    createdAt: notif.createdAt,
  }
}

function emitNotificacionNueva(payload: NotificacionSocketPayload) {
  global.io?.to(`user:${payload.usuarioId}`).emit("notification:new", payload)
}

function emitNotificacionLeida(payload: NotificationReadPayload) {
  global.io?.to(`user:${payload.usuarioId}`).emit("notification:read", payload)
}

function emitNotificacionLeidasTodas(payload: NotificationReadAllPayload) {
  global.io?.to(`user:${payload.usuarioId}`).emit("notification:read-all", payload)
}

function emitNotificacionEliminada(payload: NotificationDeletePayload) {
  global.io?.to(`user:${payload.usuarioId}`).emit("notification:delete", payload)
}

export async function crearNotificacionRealtime(data: CrearNotificacionInput) {
  const [inserted] = await db.insert(notificaciones).values({
    titulo: data.titulo,
    mensaje: data.mensaje,
    tipo: data.tipo ?? "info",
    usuarioId: data.usuarioId,
    enlace: data.enlace ?? null,
    creadoPor: data.creadoPor ?? null,
  }).returning()

  if (inserted) {
    emitNotificacionNueva(toSocketPayload(inserted))
  }

  return inserted ?? null
}

export async function crearNotificacionesRealtime(items: CrearNotificacionInput[]) {
  if (items.length === 0) return []

  const inserted = await db.insert(notificaciones).values(
    items.map((item) => ({
      titulo: item.titulo,
      mensaje: item.mensaje,
      tipo: item.tipo ?? "info",
      usuarioId: item.usuarioId,
      enlace: item.enlace ?? null,
      creadoPor: item.creadoPor ?? null,
    }))
  ).returning()

  for (const notif of inserted) {
    emitNotificacionNueva(toSocketPayload(notif))
  }

  return inserted
}

export function emitirNotificacionLeidaRealtime(payload: NotificationReadPayload) {
  emitNotificacionLeida(payload)
}

export function emitirNotificacionLeidasTodasRealtime(payload: NotificationReadAllPayload) {
  emitNotificacionLeidasTodas(payload)
}

export function emitirNotificacionEliminadaRealtime(payload: NotificationDeletePayload) {
  emitNotificacionEliminada(payload)
}
