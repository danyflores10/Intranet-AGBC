"use server"

import { db } from "@/db"
import { notificaciones } from "@/db/schema"
import { eq, desc, and, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import {
  emitirNotificacionEliminadaRealtime,
  emitirNotificacionLeidaRealtime,
  emitirNotificacionLeidasTodasRealtime,
} from "@/lib/notificaciones-realtime"

// ── Obtener notificaciones de un usuario ──
export async function obtenerNotificacionesUsuario(usuarioId: string) {
  return db.select().from(notificaciones)
    .where(eq(notificaciones.usuarioId, usuarioId))
    .orderBy(desc(notificaciones.createdAt))
    .limit(50)
}

// ── Contar no leídas ──
export async function contarNotificacionesNoLeidas(usuarioId: string) {
  const [result] = await db.select({ count: sql<number>`count(*)::int` })
    .from(notificaciones)
    .where(and(
      eq(notificaciones.usuarioId, usuarioId),
      eq(notificaciones.leida, false),
    ))
  return result?.count ?? 0
}

// ── Marcar como leída ──
export async function marcarNotificacionLeida(id: string) {
  const [updated] = await db.update(notificaciones)
    .set({ leida: true })
    .where(eq(notificaciones.id, id))
    .returning({ id: notificaciones.id, usuarioId: notificaciones.usuarioId })

  if (updated) {
    emitirNotificacionLeidaRealtime({
      id: updated.id,
      usuarioId: updated.usuarioId,
    })
  }

  revalidatePath("/dashboard")
}

// ── Marcar todas como leídas ──
export async function marcarTodasLeidas(usuarioId: string) {
  await db.update(notificaciones)
    .set({ leida: true })
    .where(and(
      eq(notificaciones.usuarioId, usuarioId),
      eq(notificaciones.leida, false),
    ))

  emitirNotificacionLeidasTodasRealtime({ usuarioId })
  revalidatePath("/dashboard")
}

// ── Marcar notificaciones de soporte como leídas ──
export async function marcarNotificacionesSoporteLeidas(usuarioId: string) {
  const updated = await db.update(notificaciones)
    .set({ leida: true })
    .where(and(
      eq(notificaciones.usuarioId, usuarioId),
      eq(notificaciones.tipo, "soporte"),
      eq(notificaciones.leida, false),
    ))
    .returning({
      id: notificaciones.id,
      usuarioId: notificaciones.usuarioId,
    })

  for (const notif of updated) {
    emitirNotificacionLeidaRealtime({
      id: notif.id,
      usuarioId: notif.usuarioId,
    })
  }

  revalidatePath("/soporte")
  revalidatePath("/dashboard")
  return updated.length
}

// ── Eliminar una notificación ──
export async function eliminarNotificacion(id: string) {
  const [deleted] = await db.delete(notificaciones)
    .where(eq(notificaciones.id, id))
    .returning({ id: notificaciones.id, usuarioId: notificaciones.usuarioId })

  if (deleted) {
    emitirNotificacionEliminadaRealtime({
      id: deleted.id,
      usuarioId: deleted.usuarioId,
    })
  }

  revalidatePath("/dashboard")
}
