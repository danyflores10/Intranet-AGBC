"use server"

import { db } from "@/db"
import { notificaciones } from "@/db/schema"
import { eq, desc, and, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"

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
  await db.update(notificaciones)
    .set({ leida: true })
    .where(eq(notificaciones.id, id))
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
  revalidatePath("/dashboard")
}

// ── Eliminar una notificación ──
export async function eliminarNotificacion(id: string) {
  await db.delete(notificaciones).where(eq(notificaciones.id, id))
  revalidatePath("/dashboard")
}
