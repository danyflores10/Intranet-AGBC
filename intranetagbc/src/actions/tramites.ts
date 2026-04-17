"use server"

import { db } from "@/db"
import { solicitudes } from "@/db/schema/tramites.schema"
import { users } from "@/db/schema/users.schema"
import { eq, desc, or } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { registrarAuditLog } from "@/actions/auditoria"
import { crearNotificacionRealtime } from "@/lib/notificaciones-realtime"

export async function obtenerSolicitudes() {
  return db
    .select({
      id: solicitudes.id,
      codigo: solicitudes.codigo,
      tipo: solicitudes.tipo,
      descripcion: solicitudes.descripcion,
      estado: solicitudes.estado,
      prioridad: solicitudes.prioridad,
      observaciones: solicitudes.observaciones,
      respuesta: solicitudes.respuesta,
      solicitanteId: solicitudes.solicitanteId,
      destinatarioId: solicitudes.destinatarioId,
      archivoUrl: solicitudes.archivoUrl,
      archivoNombre: solicitudes.archivoNombre,
      archivoTipo: solicitudes.archivoTipo,
      createdAt: solicitudes.createdAt,
      updatedAt: solicitudes.updatedAt,
    })
    .from(solicitudes)
    .orderBy(desc(solicitudes.createdAt))
}

export async function obtenerSolicitudesPorUsuario(userId: string) {
  return db
    .select({
      id: solicitudes.id,
      codigo: solicitudes.codigo,
      tipo: solicitudes.tipo,
      descripcion: solicitudes.descripcion,
      estado: solicitudes.estado,
      prioridad: solicitudes.prioridad,
      observaciones: solicitudes.observaciones,
      respuesta: solicitudes.respuesta,
      solicitanteId: solicitudes.solicitanteId,
      destinatarioId: solicitudes.destinatarioId,
      archivoUrl: solicitudes.archivoUrl,
      archivoNombre: solicitudes.archivoNombre,
      archivoTipo: solicitudes.archivoTipo,
      createdAt: solicitudes.createdAt,
      updatedAt: solicitudes.updatedAt,
    })
    .from(solicitudes)
    .where(or(eq(solicitudes.solicitanteId, userId), eq(solicitudes.destinatarioId, userId)))
    .orderBy(desc(solicitudes.createdAt))
}

export async function obtenerUsuariosActivos() {
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

export async function crearSolicitud(data: {
  solicitanteId: string
  destinatarioId?: string
  tipo: string
  descripcion?: string
  prioridad?: string
  archivoUrl?: string
  archivoNombre?: string
  archivoTipo?: string
}) {
  const year = new Date().getFullYear()
  const count = await db.select({ id: solicitudes.id }).from(solicitudes)
  const num = String(count.length + 1).padStart(4, "0")
  const codigo = `SOL-${year}-${num}`

  const [nuevo] = await db.insert(solicitudes).values({
    codigo,
    ...data,
    prioridad: data.prioridad || "media",
  }).returning()

  // Notificar al destinatario
  if (data.destinatarioId) {
    const solicitante = await db.select({ firstName: users.firstName, lastNamePaternal: users.lastNamePaternal })
      .from(users).where(eq(users.id, data.solicitanteId)).limit(1)
    const nombre = solicitante[0] ? `${solicitante[0].firstName} ${solicitante[0].lastNamePaternal}` : "Un usuario"
    await crearNotificacionRealtime({
      titulo: `Nueva solicitud: ${codigo}`,
      mensaje: `${nombre} te envió una solicitud de ${data.tipo.replace(/_/g, " ")}`,
      tipo: "solicitud",
      usuarioId: data.destinatarioId,
      creadoPor: data.solicitanteId,
      enlace: "/tramites",
    })
  }

  await registrarAuditLog({
    usuario: data.solicitanteId,
    accion: `Creó solicitud: ${codigo} (${data.tipo})`,
    modulo: "Trámites",
    resultado: "Exitoso",
  })
  revalidatePath("/tramites")
  return nuevo
}

export async function actualizarSolicitud(id: string, data: Partial<{
  tipo: string
  descripcion: string
  estado: string
  prioridad: string
  observaciones: string
  respuesta: string
  destinatarioId: string
  archivoUrl: string
  archivoNombre: string
  archivoTipo: string
}>, respondidoPor?: string) {
  // Obtener solicitud antes de actualizar para las notificaciones
  const [original] = await db.select().from(solicitudes).where(eq(solicitudes.id, id)).limit(1)

  const [actualizado] = await db.update(solicitudes).set(data).where(eq(solicitudes.id, id)).returning()

  // Notificar al solicitante si hay respuesta nueva o cambio de estado
  if (original && actualizado) {
    const estadoCambio = data.estado && data.estado !== original.estado
    const respuestaNueva = data.respuesta && data.respuesta !== (original.respuesta ?? "")

    if (estadoCambio || respuestaNueva) {
      const estadoLabel = data.estado === "aprobado" ? "aprobada" : data.estado === "rechazado" ? "rechazada" : data.estado === "en_revision" ? "en revisión" : data.estado

      if (respuestaNueva) {
        // Notificar al solicitante de la respuesta
        await crearNotificacionRealtime({
          titulo: `Respuesta a tu solicitud ${actualizado.codigo}`,
          mensaje: `Tu solicitud fue respondida${estadoCambio ? ` y marcada como ${estadoLabel}` : ""}`,
          tipo: "solicitud",
          usuarioId: original.solicitanteId,
          creadoPor: respondidoPor ?? null,
          enlace: "/tramites",
        })
      } else if (estadoCambio) {
        // Solo cambio de estado
        await crearNotificacionRealtime({
          titulo: `Solicitud ${actualizado.codigo} ${estadoLabel}`,
          mensaje: `El estado de tu solicitud cambió a: ${estadoLabel}`,
          tipo: "solicitud",
          usuarioId: original.solicitanteId,
          creadoPor: respondidoPor ?? null,
          enlace: "/tramites",
        })
      }
    }
  }

  await registrarAuditLog({
    usuario: "sistema",
    accion: `Actualizó solicitud ID: ${id}${data.estado ? ` → ${data.estado}` : ""}`,
    modulo: "Trámites",
    resultado: "Exitoso",
  })
  revalidatePath("/tramites")
  return actualizado
}

export async function eliminarSolicitud(id: string) {
  await db.delete(solicitudes).where(eq(solicitudes.id, id))
  await registrarAuditLog({
    usuario: "sistema",
    accion: `Eliminó solicitud ID: ${id}`,
    modulo: "Trámites",
    resultado: "Exitoso",
  })
  revalidatePath("/tramites")
}
