"use server"

import { db } from "@/db"
import { eventosCalendario, notificaciones, users } from "@/db/schema"
import { eq, desc, gte, lte, and } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { registrarAuditLog } from "@/actions/auditoria"

export type EventoCalendarioData = {
  titulo: string
  descripcion?: string
  tipo: string
  fechaInicio: string
  fechaFin?: string
  color?: string
  notificar?: boolean
}

// ── Obtener todos los eventos ──
export async function obtenerEventos() {
  return db.select().from(eventosCalendario).orderBy(desc(eventosCalendario.fechaInicio))
}

// ── Obtener eventos de un mes ──
export async function obtenerEventosMes(anio: number, mes: number) {
  const inicio = `${anio}-${String(mes).padStart(2, "0")}-01`
  const ultimoDia = new Date(anio, mes, 0).getDate()
  const fin = `${anio}-${String(mes).padStart(2, "0")}-${ultimoDia}`

  return db.select().from(eventosCalendario)
    .where(and(
      gte(eventosCalendario.fechaInicio, inicio),
      lte(eventosCalendario.fechaInicio, fin),
    ))
    .orderBy(eventosCalendario.fechaInicio)
}

// ── Crear evento ──
export async function crearEvento(data: EventoCalendarioData) {
  const [nuevo] = await db.insert(eventosCalendario).values({
    titulo: data.titulo,
    descripcion: data.descripcion ?? null,
    tipo: data.tipo,
    fechaInicio: data.fechaInicio,
    fechaFin: data.fechaFin ?? null,
    color: data.color ?? "#FFB300",
    notificar: data.notificar ?? true,
  }).returning()

  await registrarAuditLog({
    usuario: "sistema",
    accion: `Creó evento: ${data.titulo}`,
    modulo: "Calendario",
    resultado: "Exitoso",
  })

  // Si debe notificar, enviar notificación a todos los usuarios activos
  if (data.notificar !== false) {
    await notificarEventoATodos(nuevo.id, data.titulo, data.descripcion ?? "", data.tipo, data.fechaInicio)
  }

  revalidatePath("/calendario")
  revalidatePath("/dashboard")
  return nuevo
}

// ── Actualizar evento ──
export async function actualizarEvento(id: string, data: Partial<EventoCalendarioData>) {
  const [actualizado] = await db.update(eventosCalendario)
    .set({
      ...(data.titulo !== undefined && { titulo: data.titulo }),
      ...(data.descripcion !== undefined && { descripcion: data.descripcion }),
      ...(data.tipo !== undefined && { tipo: data.tipo }),
      ...(data.fechaInicio !== undefined && { fechaInicio: data.fechaInicio }),
      ...(data.fechaFin !== undefined && { fechaFin: data.fechaFin }),
      ...(data.color !== undefined && { color: data.color }),
      ...(data.notificar !== undefined && { notificar: data.notificar }),
    })
    .where(eq(eventosCalendario.id, id))
    .returning()

  await registrarAuditLog({
    usuario: "sistema",
    accion: `Actualizó evento ID: ${id}`,
    modulo: "Calendario",
    resultado: "Exitoso",
  })

  revalidatePath("/calendario")
  revalidatePath("/dashboard")
  return actualizado
}

// ── Eliminar evento ──
export async function eliminarEvento(id: string) {
  await db.delete(eventosCalendario).where(eq(eventosCalendario.id, id))
  await registrarAuditLog({
    usuario: "sistema",
    accion: `Eliminó evento ID: ${id}`,
    modulo: "Calendario",
    resultado: "Exitoso",
  })
  revalidatePath("/calendario")
  revalidatePath("/dashboard")
}

// ── Notificar a todos los usuarios activos ──
async function notificarEventoATodos(
  eventoId: string,
  titulo: string,
  descripcion: string,
  tipo: string,
  fecha: string,
) {
  const tipoLabel: Record<string, string> = {
    feriado: "🎉 Feriado",
    no_laboral: "🏠 Día no laboral",
    reunion: "📋 Reunión",
    evento: "📅 Evento",
    capacitacion: "📚 Capacitación",
  }

  const todosUsuarios = await db.select({ id: users.id })
    .from(users)
    .where(eq(users.isActive, true))

  if (todosUsuarios.length === 0) return

  const fechaFormateada = new Date(fecha + "T12:00:00").toLocaleDateString("es-BO", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  })

  const mensaje = `${tipoLabel[tipo] ?? "📅 Evento"}: ${titulo}${descripcion ? ` — ${descripcion}` : ""}. Fecha: ${fechaFormateada}.`

  const inserts = todosUsuarios.map((u) => ({
    titulo: `${tipoLabel[tipo] ?? "Evento"}: ${titulo}`,
    mensaje,
    tipo: "calendario" as const,
    usuarioId: u.id,
    enlace: "/calendario",
  }))

  // Insert en lotes de 100
  for (let i = 0; i < inserts.length; i += 100) {
    await db.insert(notificaciones).values(inserts.slice(i, i + 100))
  }
}
