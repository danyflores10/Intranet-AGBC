"use server"

import { db } from "@/db"
import { notificaciones, users } from "@/db/schema"
import { eq, desc, and, or, ilike, sql } from "drizzle-orm"
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

// ── Crear notificación masiva para todos los usuarios activos ──
export async function crearNotificacionParaTodos(data: {
  titulo: string
  mensaje: string
  tipo?: string
  enlace?: string
  creadoPor?: string
}) {
  try {
    const todosUsuarios = await db.select({ id: users.id }).from(users)
    if (todosUsuarios.length === 0) return

    const rows = todosUsuarios.map((u) => ({
      titulo: data.titulo,
      mensaje: data.mensaje,
      tipo: data.tipo || "info",
      usuarioId: u.id,
      enlace: data.enlace || null,
      creadoPor: data.creadoPor || null,
      leida: false,
    }))

    await db.insert(notificaciones).values(rows)
    revalidatePath("/dashboard")
    revalidatePath("/")
  } catch (error) {
    console.error("Error al crear notificación para todos:", error)
  }
}

// ── Crear notificación para un usuario específico ──
export async function crearNotificacionUsuario(data: {
  usuarioId: string
  titulo: string
  mensaje: string
  tipo?: string
  enlace?: string
  creadoPor?: string
}) {
  try {
    await db.insert(notificaciones).values({
      usuarioId: data.usuarioId,
      titulo: data.titulo,
      mensaje: data.mensaje,
      tipo: data.tipo || "info",
      enlace: data.enlace || null,
      creadoPor: data.creadoPor || null,
      leida: false,
    })
    revalidatePath("/dashboard")
    revalidatePath("/")
  } catch (error) {
    console.error("Error al crear notificación para usuario:", error)
  }
}

// ── Eliminar notificaciones asociadas a un documento eliminado (para todos los usuarios) ──
export async function eliminarNotificacionesDeDocumento(tituloDocumento?: string, documentoId?: string) {
  try {
    const conditions = []
    if (documentoId && documentoId.trim().length > 0) {
      conditions.push(ilike(notificaciones.enlace, `%${documentoId.trim()}%`))
    }
    if (tituloDocumento && tituloDocumento.trim().length > 0) {
      const limpio = tituloDocumento.replace(/[“”"']/g, "").trim()
      conditions.push(ilike(notificaciones.titulo, `%${tituloDocumento.trim()}%`))
      conditions.push(ilike(notificaciones.mensaje, `%${tituloDocumento.trim()}%`))
      if (limpio && limpio !== tituloDocumento.trim()) {
        conditions.push(ilike(notificaciones.titulo, `%${limpio}%`))
        conditions.push(ilike(notificaciones.mensaje, `%${limpio}%`))
      }
    }

    if (conditions.length > 0) {
      await db.delete(notificaciones).where(or(...conditions))
      revalidatePath("/dashboard")
      revalidatePath("/")
    }
  } catch (error) {
    console.error("Error al eliminar notificaciones de documento:", error)
  }
}

// ── Eliminar notificaciones asociadas a múltiples documentos eliminados ──
export async function eliminarNotificacionesDeDocumentosLote(docs: Array<{ titulo?: string; id?: string } | string>) {
  try {
    for (const item of docs) {
      const titulo = typeof item === "string" ? item : item.titulo
      const id = typeof item === "string" ? undefined : item.id

      const conditions = []
      if (id && id.trim().length > 0) {
        conditions.push(ilike(notificaciones.enlace, `%${id.trim()}%`))
      }
      if (titulo && titulo.trim().length > 0) {
        const limpio = titulo.replace(/[“”"']/g, "").trim()
        conditions.push(ilike(notificaciones.titulo, `%${titulo.trim()}%`))
        conditions.push(ilike(notificaciones.mensaje, `%${titulo.trim()}%`))
        if (limpio && limpio !== titulo.trim()) {
          conditions.push(ilike(notificaciones.titulo, `%${limpio}%`))
          conditions.push(ilike(notificaciones.mensaje, `%${limpio}%`))
        }
      }

      if (conditions.length > 0) {
        await db.delete(notificaciones).where(or(...conditions))
      }
    }
    revalidatePath("/dashboard")
    revalidatePath("/")
  } catch (error) {
    console.error("Error al eliminar notificaciones de lote de documentos:", error)
  }
}

