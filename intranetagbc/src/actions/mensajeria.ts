"use server"

import { db } from "@/db"
import { notificaciones, users, roles, userRoles } from "@/db/schema"
import { eq, desc, and, inArray, isNotNull, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { obtenerUsuarioRbacActual } from "@/lib/auth/session-access"
import {
  crearNotificacionesRealtime,
  emitirNotificacionEliminadaRealtime,
} from "@/lib/notificaciones-realtime"
import { registrarAuditLog } from "@/actions/auditoria"
import { sendMensajeriaMasivaEmail } from "@/lib/email"

export type DestinatarioUsuario = {
  id: string
  nombreCompleto: string
  email: string
  institutionalEmail: string
  image: string | null
  roles: string[]
}

export type InfoDestinatarios = {
  totalUsuariosActivos: number
  usuarios: DestinatarioUsuario[]
}

export type EnviarMensajeMasivoInput = {
  asunto: string
  mensaje: string
  tipo: "comunicado" | "alerta" | "info" | "sistema"
  destinatarioTipo: "todos" | "usuarios"
  usuarioIds?: string[]
  adjunto?: {
    nombre: string
    url: string
    filePath?: string | null
  } | null
}

export type CampanaEnviada = {
  id: string
  asunto: string
  mensaje: string
  tipo: string
  enlace: string | null
  creadoPorId: string | null
  remitente: string
  fecha: string
  totalEnviados: number
  totalLeidos: number
}

// ── Obtener usuarios disponibles para el selector de destinatarios ──
export async function obtenerDestinatariosMensajeria(): Promise<InfoDestinatarios> {
  try {
    // 1. Obtener todos los usuarios activos
    const usuariosActivos = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastNamePaternal: users.lastNamePaternal,
        lastNameMaternal: users.lastNameMaternal,
        email: users.email,
        institutionalEmail: users.institutionalEmail,
        image: users.image,
      })
      .from(users)
      .where(eq(users.isActive, true))
      .orderBy(users.firstName)

    // 2. Obtener asignaciones de roles para mostrar en chips/etiquetas
    const rolesAsignados = await db
      .select({
        userId: userRoles.userId,
        roleName: roles.name,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))

    // Mapear roles por usuario
    const userRoleMap = new Map<string, string[]>()
    for (const r of rolesAsignados) {
      const current = userRoleMap.get(r.userId) || []
      current.push(r.roleName)
      userRoleMap.set(r.userId, current)
    }

    const usuariosDto: DestinatarioUsuario[] = usuariosActivos.map((u) => {
      const apPaterno = u.lastNamePaternal || ""
      const apMaterno = u.lastNameMaternal ? ` ${u.lastNameMaternal}` : ""
      const nombreCompleto = `${u.firstName} ${apPaterno}${apMaterno}`.trim()
      return {
        id: u.id,
        nombreCompleto,
        email: u.email || "",
        institutionalEmail: u.institutionalEmail,
        image: u.image,
        roles: userRoleMap.get(u.id) || ["Funcionario"],
      }
    })

    return {
      totalUsuariosActivos: usuariosDto.length,
      usuarios: usuariosDto,
    }
  } catch (error) {
    console.error("Error al obtener destinatarios de mensajería:", error)
    return {
      totalUsuariosActivos: 0,
      usuarios: [],
    }
  }
}

// ── Enviar Mensaje Masivo (Interno + Externo SMTP @correos.gob.bo / Gmail) ──
export async function enviarMensajeMasivo(data: EnviarMensajeMasivoInput): Promise<{
  success: boolean
  message: string
  count?: number
}> {
  try {
    const usuarioActual = await obtenerUsuarioRbacActual()
    if (!usuarioActual) {
      return { success: false, message: "Sesión no válida o expirada." }
    }

    const esAdmin = usuarioActual.roles.some((r) =>
      ["administrador", "admin", "super_admin"].includes(r.toLowerCase().trim())
    )

    if (!esAdmin) {
      return { success: false, message: "Solo los administradores pueden enviar mensajes masivos." }
    }

    const asunto = (data.asunto || "").trim()
    const mensaje = (data.mensaje || "").trim()
    if (asunto.length < 3) {
      return { success: false, message: "El asunto debe tener al menos 3 caracteres." }
    }
    if (mensaje.length < 5) {
      return { success: false, message: "El mensaje debe tener al menos 5 caracteres." }
    }

    // Resolver registros de usuarios destinatarios
    let targetUsers: Array<{
      id: string
      firstName: string
      lastNamePaternal: string | null
      email: string | null
      institutionalEmail: string
    }> = []

    if (data.destinatarioTipo === "todos") {
      targetUsers = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastNamePaternal: users.lastNamePaternal,
          email: users.email,
          institutionalEmail: users.institutionalEmail,
        })
        .from(users)
        .where(eq(users.isActive, true))
    } else if (data.destinatarioTipo === "usuarios" && data.usuarioIds && data.usuarioIds.length > 0) {
      targetUsers = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastNamePaternal: users.lastNamePaternal,
          email: users.email,
          institutionalEmail: users.institutionalEmail,
        })
        .from(users)
        .where(and(inArray(users.id, data.usuarioIds), eq(users.isActive, true)))
    }

    if (targetUsers.length === 0) {
      return { success: false, message: "No se encontraron destinatarios activos para el envío." }
    }

    let enlaceAdjunto: string | null = null
    if (data.adjunto?.url) {
      const rawUrl = data.adjunto.url.trim()
      enlaceAdjunto = rawUrl.startsWith("/api/documentos/")
        ? rawUrl
        : `/api/documentos/${rawUrl.replace(/^\/?(documentos\/)?/, "")}`
    }

    // 1. Inserción interna en base de datos para la campana de notificaciones
    const rows = targetUsers.map((u) => ({
      titulo: asunto,
      mensaje: mensaje,
      tipo: data.tipo || "comunicado",
      usuarioId: u.id,
      enlace: enlaceAdjunto,
      creadoPor: usuarioActual.id,
    }))

    // Inserción en lote y emisión en tiempo real vía socket
    await crearNotificacionesRealtime(rows)

    // 2. Envío externo masivo vía SMTP institucional (@correos.gob.bo / Gmail)
    const destinatariosEmail = targetUsers.map((u) => {
      const nombreCompleto = `${u.firstName} ${u.lastNamePaternal || ""}`.trim()
      return {
        nombre: nombreCompleto,
        email: u.email,
        institutionalEmail: u.institutionalEmail,
      }
    })

    // Despacho de correos electrónicos
    let emailAviso = ""
    try {
      const resEmail = await sendMensajeriaMasivaEmail({
        destinatarios: destinatariosEmail,
        asunto,
        mensaje,
        tipo: data.tipo,
        remitenteNombre: usuarioActual.name || "Dirección General AGBC",
        adjunto: data.adjunto,
      })
      if (resEmail?.sinCredenciales) {
        emailAviso = " (Aviso: Credenciales SMTP de Zimbra no configuradas en el servidor. Configure SMTP_USER y SMTP_PASS para correos externos)."
      }
    } catch (err: any) {
      console.error("Error al procesar envío masivo de correos:", err)
      emailAviso = " (Aviso: Inconveniente temporal con el servidor SMTP externo)."
    }

    // 3. Auditoría institucional
    await registrarAuditLog({
      usuario: usuarioActual.id,
      accion: "ENVIAR_MENSAJERIA_MASIVA",
      modulo: "MENSAJERIA",
      detalles: {
        asunto,
        tipo: data.tipo,
        destinatarioTipo: data.destinatarioTipo,
        totalDestinatarios: targetUsers.length,
        adjunto: data.adjunto?.nombre || null,
      },
      resultado: "EXITO",
    })

    // Revalidar rutas para actualizar bandejas de notificaciones
    revalidatePath("/dashboard")
    revalidatePath("/")
    revalidatePath("/notificaciones")
    revalidatePath("/mensajeria")

    return {
      success: true,
      message: `Mensaje masivo despachado exitosamente a ${targetUsers.length} usuario(s) por notificación interna.${emailAviso}`,
      count: targetUsers.length,
    }
  } catch (error) {
    console.error("Error al enviar mensaje masivo:", error)
    return {
      success: false,
      message: "Ocurrió un error inesperado al despachar los mensajes masivos.",
    }
  }
}

// ── Eliminar Campaña de Mensaje Masivo (Elimina de todos los destinatarios) ──
export async function eliminarMensajeMasivoCampana(params: {
  asunto: string
  creadoPorId?: string | null
  fechaTimestamp?: string | null
}): Promise<{ success: boolean; message: string; count: number }> {
  try {
    const usuarioActual = await obtenerUsuarioRbacActual()
    if (!usuarioActual) {
      return { success: false, message: "Sesión no válida o expirada.", count: 0 }
    }

    const esAdmin = usuarioActual.roles.some((r) =>
      ["administrador", "admin", "super_admin"].includes(r.toLowerCase().trim())
    )

    if (!esAdmin) {
      return {
        success: false,
        message: "Solo los administradores pueden eliminar mensajes masivos.",
        count: 0,
      }
    }

    // Buscar notificaciones que correspondan al asunto emitido
    const conditions = [eq(notificaciones.titulo, params.asunto)]
    if (params.creadoPorId) {
      conditions.push(eq(notificaciones.creadoPor, params.creadoPorId))
    }

    const notifsAEliminar = await db
      .select({
        id: notificaciones.id,
        usuarioId: notificaciones.usuarioId,
      })
      .from(notificaciones)
      .where(and(...conditions))

    if (notifsAEliminar.length === 0) {
      return {
        success: false,
        message: "No se encontraron mensajes activos para eliminar.",
        count: 0,
      }
    }

    const ids = notifsAEliminar.map((n) => n.id)
    await db.delete(notificaciones).where(inArray(notificaciones.id, ids))

    // Notificar en tiempo real a cada usuario para remover de su campana de notificaciones
    for (const notif of notifsAEliminar) {
      emitirNotificacionEliminadaRealtime({
        id: notif.id,
        usuarioId: notif.usuarioId,
      })
    }

    // Auditoría
    await registrarAuditLog({
      usuario: usuarioActual.id,
      accion: "ELIMINAR_MENSAJERIA_MASIVA",
      modulo: "MENSAJERIA",
      detalles: {
        asunto: params.asunto,
        totalEliminados: ids.length,
      },
      resultado: "EXITO",
    })

    revalidatePath("/dashboard")
    revalidatePath("/")
    revalidatePath("/notificaciones")
    revalidatePath("/mensajeria")

    return {
      success: true,
      message: `Mensaje masivo eliminado de la bandeja de todos los ${ids.length} usuarios.`,
      count: ids.length,
    }
  } catch (error) {
    console.error("Error al eliminar mensaje masivo:", error)
    return {
      success: false,
      message: "Ocurrió un error al eliminar el mensaje masivo.",
      count: 0,
    }
  }
}

// ── Historial de Mensajes Masivos Enviados ──
export async function obtenerHistorialMensajeria(): Promise<CampanaEnviada[]> {
  try {
    const rows = await db
      .select({
        titulo: notificaciones.titulo,
        mensaje: notificaciones.mensaje,
        tipo: notificaciones.tipo,
        enlace: notificaciones.enlace,
        creadoPor: notificaciones.creadoPor,
        creadorNombre: sql<string>`coalesce(concat(${users.firstName}, ' ', ${users.lastNamePaternal}), 'Administrador')`,
        fechaTimestamp: sql<string>`to_char(date_trunc('minute', ${notificaciones.createdAt}), 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`,
        totalEnviados: sql<number>`count(*)::int`,
        totalLeidos: sql<number>`count(case when ${notificaciones.leida} = true then 1 end)::int`,
      })
      .from(notificaciones)
      .leftJoin(users, eq(notificaciones.creadoPor, users.id))
      .where(isNotNull(notificaciones.creadoPor))
      .groupBy(
        notificaciones.titulo,
        notificaciones.mensaje,
        notificaciones.tipo,
        notificaciones.enlace,
        notificaciones.creadoPor,
        sql`date_trunc('minute', ${notificaciones.createdAt})`,
        users.firstName,
        users.lastNamePaternal
      )
      .orderBy(desc(sql`date_trunc('minute', ${notificaciones.createdAt})`))
      .limit(40)

    return rows.map((r, idx) => ({
      id: `campana-${idx}-${r.fechaTimestamp}`,
      asunto: r.titulo,
      mensaje: r.mensaje,
      tipo: r.tipo,
      enlace: r.enlace,
      creadoPorId: r.creadoPor,
      remitente: r.creadorNombre,
      fecha: r.fechaTimestamp,
      totalEnviados: r.totalEnviados,
      totalLeidos: r.totalLeidos,
    }))
  } catch (error) {
    console.error("Error al obtener historial de mensajería:", error)
    return []
  }
}
