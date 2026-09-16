"use server"

import { db } from "@/db"
import {
  personal,
  contactosEmergencia,
  directivos,
  users,
  account,
  userRoles,
  session,
  onboardingProgreso,
  notificaciones,
  mensajesSoporte,
  ticketsSoporte,
  solicitudes,
  correspondencia,
  correspondenciaMovimientos,
  correspondenciaAdjuntos,
  documentos,
  solicitudesMaterial,
  comunicados,
  eventosCalendario,
  reconocimientoEmpleadoMes,
  reconocimientoEquipo,
  reconocimientoEquipoIntegrantes,
  reconocimientos,
} from "@/db/schema"
import { eq, desc, asc, or } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { registrarAuditLog } from "@/actions/auditoria"
import { auth } from "@/lib/auth"
import { obtenerSesionConAccesoActual } from "@/lib/auth/session-access"
import {
  sincronizarPersonalConUsuarioIndividual,
  sincronizarTodoPersonalConUsuarios,
} from "@/lib/services/personal-user-sync"
import {
  validarEmail,
  sendWelcomeCredentialsEmail,
  sendTestEmail,
  verifySmtpConnection,
} from "@/lib/email"

/* ═══════════════════════ PERSONAL ═══════════════════════ */

export async function obtenerPersonal() {
  return db.select().from(personal).orderBy(personal.nombre)
}

export async function sincronizarPersonalYUsuariosAction() {
  const res = await sincronizarTodoPersonalConUsuarios()
  revalidatePath("/rrhh")
  revalidatePath("/usuarios")
  return res
}

export async function probarConexionSmtpAction() {
  return verifySmtpConnection()
}

export async function enviarCorreoPruebaAction(to: string) {
  try {
    if (!validarEmail(to)) {
      return {
        success: false,
        message: "La dirección de correo electrónico ingresada no es válida.",
      }
    }
    const res = await sendTestEmail(to)
    return res
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || "Error al enviar correo de prueba.",
    }
  }
}

export async function resetearPasswordsTodosAction() {
  try {
    const authContext = await auth.$context
    const newPasswordHash = await authContext.password.hash("Correos2026!")

    // 1. Actualizar todas las cuentas de usuarios en la tabla account
    const res = await db.update(account).set({
      password: newPasswordHash,
      idToken: "Correos2026!",
      updatedAt: new Date(),
    })

    // 2. Cerrar sesiones activas para forzar nuevo inicio de sesión con clave institucional
    await db.delete(session)

    await registrarAuditLog({
      usuario: "administrador",
      accion: "Restableció contraseñas de todos los usuarios a Correos2026!",
      modulo: "RRHH",
      resultado: "Exitoso",
      detalles: "Se restablecieron las credenciales y se reiniciaron las sesiones activas.",
    })

    revalidatePath("/rrhh")
    revalidatePath("/usuarios")
    revalidatePath("/dashboard")

    return {
      success: true,
      message: "Todas las contraseñas se han restablecido a 'Correos2026!' exitosamente.",
    }
  } catch (error: any) {
    console.error("Error en resetearPasswordsTodosAction:", error)
    return {
      success: false,
      message: error?.message || "Error al restablecer las contraseñas.",
    }
  }
}

export async function reenviarCredencialesAction(personalId: string, customEmail?: string) {
  try {
    const idLimpio = personalId.trim()
    let p = (await db.select().from(personal).where(eq(personal.id, idLimpio)).limit(1))[0]
    let u = (await db.select().from(users).where(eq(users.id, idLimpio)).limit(1))[0]

    if (!p && !u) {
      return { success: false, message: "No se encontró el registro del funcionario." }
    }

    const emailDestino = (customEmail || p?.email || u?.institutionalEmail || u?.email || "").trim()
    if (!validarEmail(emailDestino)) {
      return {
        success: false,
        message: `El funcionario "${p?.nombre || u?.firstName}" no cuenta con un correo electrónico válido.`,
      }
    }

    // Si se especificó un nuevo correo, actualizarlo en la tabla personal
    if (p && customEmail && customEmail.trim() !== p.email) {
      await db.update(personal).set({ email: customEmail.trim(), updatedAt: new Date() }).where(eq(personal.id, p.id))
      p.email = customEmail.trim()
    }

    // Asegurar y restablecer clave segura temporal
    const passwordTemporal = "Correos2026!"
    const authContext = await auth.$context
    const hashedPassword = await authContext.password.hash(passwordTemporal)

    // Sincronizar / actualizar usuario
    if (p) {
      await sincronizarPersonalConUsuarioIndividual(p, passwordTemporal)
    } else if (u) {
      const [acc] = await db.select().from(account).where(eq(account.userId, u.id)).limit(1)
      if (acc) {
        await db.update(account).set({ password: hashedPassword, idToken: passwordTemporal, updatedAt: new Date() }).where(eq(account.userId, u.id))
      }
    }

    const nombreMostrar = p?.nombre || `${u?.firstName} ${u?.lastNamePaternal}`

    // Enviar correo
    const emailRes = await sendWelcomeCredentialsEmail({
      to: emailDestino,
      nombre: nombreMostrar,
      usuario: emailDestino,
      emailInstitucional: emailDestino,
      password: passwordTemporal,
      esReenvio: true,
    })

    if (emailRes.success) {
      await registrarAuditLog({
        usuario: "administrador",
        accion: `Reenvió credenciales de acceso a: ${nombreMostrar} (${emailDestino})`,
        modulo: "RRHH",
        resultado: "Exitoso",
      })

      return {
        success: true,
        message: `Credenciales enviadas correctamente a ${emailDestino}.`,
      }
    } else {
      return {
        success: false,
        message: emailRes.error || "No se pudo enviar el correo de credenciales. Revise la configuración SMTP.",
      }
    }
  } catch (error: any) {
    console.error("Error en reenviarCredencialesAction:", error)
    return {
      success: false,
      message: error?.message || "Ocurrió un error al procesar el reenvío de credenciales.",
    }
  }
}

export async function enviarCredencialesMasivasAction(ids?: string[]) {
  try {
    let funcionarios: (typeof personal.$inferSelect)[] = []

    if (ids && ids.length > 0) {
      const todos = await db.select().from(personal)
      funcionarios = todos.filter((p) => ids.includes(p.id))
    } else {
      funcionarios = await db.select().from(personal)
    }

    let enviados = 0
    let fallidos = 0
    let sinCorreo = 0
    const detalles: Array<{
      id: string
      nombre: string
      email: string | null
      estado: "enviado" | "error" | "sin_correo"
      motivo?: string
    }> = []

    for (const p of funcionarios) {
      const emailDestino = p.email ? p.email.trim() : null

      if (!emailDestino || !validarEmail(emailDestino)) {
        sinCorreo++
        detalles.push({
          id: p.id,
          nombre: p.nombre,
          email: emailDestino,
          estado: "sin_correo",
          motivo: "Sin correo registrado o formato inválido",
        })
        continue
      }

      try {
        const res = await sendWelcomeCredentialsEmail({
          to: emailDestino,
          nombre: p.nombre,
          usuario: p.email || emailDestino,
          emailInstitucional: p.email || undefined,
          password: "Correos2026!",
          esReenvio: true,
        })

        if (res.success) {
          enviados++
          detalles.push({
            id: p.id,
            nombre: p.nombre,
            email: emailDestino,
            estado: "enviado",
          })
        } else {
          fallidos++
          detalles.push({
            id: p.id,
            nombre: p.nombre,
            email: emailDestino,
            estado: "error",
            motivo: res.error || "Error al entregar correo",
          })
        }
      } catch (err: any) {
        fallidos++
        detalles.push({
          id: p.id,
          nombre: p.nombre,
          email: emailDestino,
          estado: "error",
          motivo: err?.message || "Error inesperado",
        })
      }
    }

    await registrarAuditLog({
      usuario: "administrador",
      accion: `Ejecutó envío masivo de credenciales: ${enviados} enviados, ${fallidos} errores, ${sinCorreo} sin correo de un total de ${funcionarios.length}`,
      modulo: "RRHH",
      resultado: fallidos === 0 ? "Exitoso" : "Parcial",
    })

    return {
      success: true,
      message: `Proceso finalizado: ${enviados} enviados con éxito, ${fallidos} con error, ${sinCorreo} sin correo registrado.`,
      total: funcionarios.length,
      enviados,
      fallidos,
      sinCorreo,
      detalles,
    }
  } catch (error: any) {
    console.error("Error al enviar credenciales masivas:", error)
    return {
      success: false,
      message: error?.message || "Error al procesar el envío masivo de correos.",
      total: 0,
      enviados: 0,
      fallidos: 0,
      sinCorreo: 0,
      detalles: [],
    }
  }
}

export async function crearPersonal(
  data: {
    nombre: string
    cargo: string
    unidad?: string
    email?: string
    telefono?: string
    foto?: string
    fechaIngreso?: string
  },
  password?: string
) {
  const passwordFinal = password && password.trim().length >= 6 ? password.trim() : "Correos2026!"
  const emailNorm = data.email ? data.email.trim() : ""
  const payload = {
    ...data,
    email: emailNorm || null,
    unidad: data.unidad || "General",
    fechaIngreso: data.fechaIngreso || new Date().toISOString().split("T")[0],
  }
  const [nuevo] = await db.insert(personal).values(payload).returning()

  let emailEnviado = false
  let mensajeCorreo = ""

  // Sincronizar automáticamente con la cuenta de usuario (users + account + roles)
  if (nuevo) {
    await sincronizarPersonalConUsuarioIndividual(nuevo, passwordFinal)

    // Enviar correo de bienvenida
    if (emailNorm && validarEmail(emailNorm)) {
      try {
        const mailRes = await sendWelcomeCredentialsEmail({
          to: emailNorm,
          nombre: nuevo.nombre,
          usuario: emailNorm,
          emailInstitucional: emailNorm,
          password: passwordFinal,
          esReenvio: false,
        })
        emailEnviado = mailRes.success
        if (mailRes.success) {
          mensajeCorreo = "Usuario creado correctamente. Las credenciales fueron enviadas al correo registrado."
        } else {
          mensajeCorreo = "Usuario creado, pero no se pudo enviar el correo. Puede intentar reenviar las credenciales."
        }
      } catch {
        emailEnviado = false
        mensajeCorreo = "Usuario creado, pero no se pudo enviar el correo. Puede intentar reenviar las credenciales."
      }
    } else {
      mensajeCorreo = "Usuario creado correctamente (sin correo registrado para el envío de credenciales)."
    }
  }

  await registrarAuditLog({
    usuario: "sistema",
    accion: `Registró funcionario: ${data.nombre} (Email enviado: ${emailEnviado ? "Sí" : "No"})`,
    modulo: "RRHH",
    resultado: "Exitoso",
  })

  revalidatePath("/rrhh")
  revalidatePath("/usuarios")
  revalidatePath("/")
  revalidatePath("/dashboard")

  return {
    success: true,
    data: nuevo,
    emailEnviado,
    message: mensajeCorreo,
  }
}

export async function actualizarPersonal(
  id: string,
  data: Partial<{
    nombre: string
    cargo: string
    unidad: string
    email: string
    telefono: string
    foto: string
    fechaIngreso: string
    estado: string
  }>,
  password?: string
) {
  const [actualizado] = await db.update(personal).set(data).where(eq(personal.id, id)).returning()

  // Sincronizar automáticamente con la cuenta de usuario (users + account + roles)
  if (actualizado) {
    await sincronizarPersonalConUsuarioIndividual(actualizado, password)
  }

  await registrarAuditLog({ usuario: "sistema", accion: `Actualizó personal ID: ${id}`, modulo: "RRHH", resultado: "Exitoso" })
  revalidatePath("/rrhh")
  revalidatePath("/usuarios")
  revalidatePath("/")
  revalidatePath("/dashboard")
  return actualizado
}

export async function eliminarPersonal(id: string): Promise<{ success: boolean; message: string }> {
  try {
    const sesion = await obtenerSesionConAccesoActual()
    const idLimpio = id ? id.trim() : ""
    if (!idLimpio) {
      return { success: false, message: "Identificador no proporcionado." }
    }

    // 1. Buscar en personal o en users
    const [pers] = await db.select().from(personal).where(eq(personal.id, idLimpio)).limit(1)
    const [usr] = await db.select().from(users).where(eq(users.id, idLimpio)).limit(1)

    if (!pers && !usr) {
      return { success: false, message: "Funcionario no encontrado." }
    }

    // 2. Comprobar seguridad: no auto-eliminarse
    if (sesion?.id) {
      const curId = sesion.id
      const [currentUser] = await db.select().from(users).where(eq(users.id, curId)).limit(1)
      const curInstEmail = (currentUser?.institutionalEmail || "").trim().toLowerCase()
      const curEmail = (currentUser?.email || "").trim().toLowerCase()

      const persEmail = (pers?.email || "").trim().toLowerCase()
      const usrEmail = (usr?.email || usr?.institutionalEmail || "").trim().toLowerCase()

      if (
        idLimpio === curId ||
        (pers && pers.id === curId) ||
        (usr && usr.id === curId) ||
        (persEmail && (persEmail === curInstEmail || persEmail === curEmail)) ||
        (usrEmail && (usrEmail === curInstEmail || usrEmail === curEmail))
      ) {
        return {
          success: false,
          message: "No puede eliminar la cuenta que está utilizando actualmente.",
        }
      }
    }

    const emailsParaBuscar: string[] = []
    if (pers?.email) emailsParaBuscar.push(pers.email.trim().toLowerCase())
    if (usr?.institutionalEmail) emailsParaBuscar.push(usr.institutionalEmail.trim().toLowerCase())
    if (usr?.email) emailsParaBuscar.push(usr.email.trim().toLowerCase())

    const nombreRegistro = pers?.nombre || (usr ? `${usr.firstName} ${usr.lastNamePaternal}` : idLimpio)

    // 3. Ejecutar eliminación física completa de forma segura
    // Buscar todos los usuarios vinculados por ID o por email
    const userConditions = [eq(users.id, idLimpio)]
    for (const em of emailsParaBuscar) {
      userConditions.push(eq(users.institutionalEmail, em))
      userConditions.push(eq(users.email, em))
    }
    const matchedUsers = await db.select({ id: users.id }).from(users).where(or(...userConditions))

    for (const u of matchedUsers) {
        if (sesion?.id && u.id === sesion.id) {
          throw new Error("No puede eliminar la cuenta que está utilizando actualmente.")
        }
        const uId = u.id

        // Limpiar sesiones, cuentas y roles
        try { await db.delete(session).where(eq(session.userId, uId)) } catch {}
        try { await db.delete(account).where(eq(account.userId, uId)) } catch {}
        try { await db.delete(userRoles).where(eq(userRoles.userId, uId)) } catch {}

        // Tablas dependientes con claves foráneas
        try { await db.delete(onboardingProgreso).where(eq(onboardingProgreso.usuarioId, uId)) } catch {}
        try {
          await db.delete(notificaciones).where(eq(notificaciones.usuarioId, uId))
          await db.update(notificaciones).set({ creadoPor: null }).where(eq(notificaciones.creadoPor, uId))
        } catch {}
        try {
          await db.delete(mensajesSoporte).where(eq(mensajesSoporte.emisorId, uId))
          await db.delete(ticketsSoporte).where(eq(ticketsSoporte.solicitanteId, uId))
          await db.update(ticketsSoporte).set({ agenteId: null }).where(eq(ticketsSoporte.agenteId, uId))
        } catch {}
        try {
          await db.delete(solicitudes).where(eq(solicitudes.solicitanteId, uId))
          await db.update(solicitudes).set({ destinatarioId: null }).where(eq(solicitudes.destinatarioId, uId))
        } catch {}
        try {
          await db.update(correspondencia).set({ remitenteUserId: null }).where(eq(correspondencia.remitenteUserId, uId))
          await db.update(correspondencia).set({ destinatarioUserId: null }).where(eq(correspondencia.destinatarioUserId, uId))
          await db.update(correspondencia).set({ creadoPor: null }).where(eq(correspondencia.creadoPor, uId))
          await db.update(correspondencia).set({ actualizadoPor: null }).where(eq(correspondencia.actualizadoPor, uId))
          await db.update(correspondenciaMovimientos).set({ fromUserId: null }).where(eq(correspondenciaMovimientos.fromUserId, uId))
          await db.update(correspondenciaMovimientos).set({ toUserId: null }).where(eq(correspondenciaMovimientos.toUserId, uId))
          await db.update(correspondenciaMovimientos).set({ creadoPor: null }).where(eq(correspondenciaMovimientos.creadoPor, uId))
          await db.update(correspondenciaAdjuntos).set({ subidoPor: null }).where(eq(correspondenciaAdjuntos.subidoPor, uId))
        } catch {}
        try { await db.update(documentos).set({ creadoPor: null }).where(eq(documentos.creadoPor, uId)) } catch {}
        try { await db.update(solicitudesMaterial).set({ creadoPor: null }).where(eq(solicitudesMaterial.creadoPor, uId)) } catch {}
        try { await db.update(comunicados).set({ creadoPor: null }).where(eq(comunicados.creadoPor, uId)) } catch {}
        try { await db.update(eventosCalendario).set({ creadoPor: null }).where(eq(eventosCalendario.creadoPor, uId)) } catch {}
        try {
          await db.delete(reconocimientoEmpleadoMes).where(eq(reconocimientoEmpleadoMes.empleadoId, uId))
          await db.delete(reconocimientoEquipoIntegrantes).where(eq(reconocimientoEquipoIntegrantes.usuarioId, uId))
          await db.update(reconocimientoEquipo).set({ responsableId: null }).where(eq(reconocimientoEquipo.responsableId, uId))
          await db.update(reconocimientos).set({ creadoPor: null }).where(eq(reconocimientos.creadoPor, uId))
          await db.update(reconocimientos).set({ aprobadoPor: null }).where(eq(reconocimientos.aprobadoPor, uId))
        } catch {}

        await db.delete(users).where(eq(users.id, uId))
      }

      // Eliminar de personal por id o por email
      const persConditions = [eq(personal.id, idLimpio)]
      for (const em of emailsParaBuscar) {
        persConditions.push(eq(personal.email, em))
      }
      try {
        await db.delete(personal).where(or(...persConditions))
      } catch {}

      // Eliminar de directivos si coincide email
      for (const em of emailsParaBuscar) {
        try {
          await db.delete(directivos).where(eq(directivos.email, em))
        } catch {}
      }

    await registrarAuditLog({
      usuario: sesion?.id || "sistema",
      accion: `Eliminó permanentemente funcionario: ${nombreRegistro}`,
      modulo: "RRHH",
      resultado: "Exitoso",
    })

    revalidatePath("/rrhh")
    revalidatePath("/usuarios")
    revalidatePath("/")
    revalidatePath("/dashboard")

    return { success: true, message: "Funcionario eliminado permanentemente." }
  } catch (error: any) {
    console.error("Error en eliminarPersonal:", error)
    return { success: false, message: error?.message || "Error al eliminar funcionario." }
  }
}

/* ═══════════════════════ DIRECTIVOS ═══════════════════════ */

export async function obtenerDirectivos() {
  return db.select().from(directivos).orderBy(asc(directivos.orden), asc(directivos.nombre))
}

export async function crearDirectivo(data: {
  nombre: string
  cargo?: string
  unidad?: string
  email?: string
  telefono?: string
  foto?: string
  orden?: number
}) {
  const payload = {
    ...data,
    cargo: data.cargo || data.unidad || "Dirección",
    unidad: data.unidad || "Dirección General",
    orden: data.orden ?? 0,
  }
  const [nuevo] = await db.insert(directivos).values(payload).returning()
  await registrarAuditLog({ usuario: "sistema", accion: `Registró directivo: ${data.nombre}`, modulo: "RRHH", resultado: "Exitoso" })
  revalidatePath("/rrhh")
  revalidatePath("/")
  return nuevo
}

export async function actualizarDirectivo(id: string, data: Partial<{
  nombre: string
  cargo: string
  unidad: string
  email: string
  telefono: string
  foto: string
  orden: number
  estado: string
}>) {
  const [actualizado] = await db.update(directivos).set(data).where(eq(directivos.id, id)).returning()
  await registrarAuditLog({ usuario: "sistema", accion: `Actualizó directivo ID: ${id}`, modulo: "RRHH", resultado: "Exitoso" })
  revalidatePath("/rrhh")
  revalidatePath("/")
  return actualizado
}

export async function eliminarDirectivo(id: string): Promise<{ success: boolean; message: string }> {
  try {
    const sesion = await obtenerSesionConAccesoActual()
    const [d] = await db.select().from(directivos).where(eq(directivos.id, id)).limit(1)
    if (!d) return { success: false, message: "Directivo no encontrado." }

    if (sesion?.id) {
      const [currentUser] = await db.select().from(users).where(eq(users.id, sesion.id)).limit(1)
      if (currentUser && d.email) {
        const dEmail = d.email.trim().toLowerCase()
        const curInstEmail = (currentUser.institutionalEmail || "").trim().toLowerCase()
        const curEmail = (currentUser.email || "").trim().toLowerCase()
        if (dEmail === curInstEmail || dEmail === curEmail) {
          return {
            success: false,
            message: "No puede eliminar la cuenta que está utilizando actualmente.",
          }
        }
      }
    }

    await db.delete(directivos).where(eq(directivos.id, id))
    await registrarAuditLog({
      usuario: sesion?.id || "sistema",
      accion: `Eliminó directivo: ${d.nombre}`,
      modulo: "RRHH",
      resultado: "Exitoso",
    })
    revalidatePath("/rrhh")
    revalidatePath("/")

    return { success: true, message: "Directivo eliminado permanentemente." }
  } catch (error: any) {
    return { success: false, message: error?.message || "Error al eliminar directivo." }
  }
}


/* ═══════════════════════ CONTACTOS EMERGENCIA ═══════════════════════ */
export async function obtenerContactosEmergencia(personalId: string) {
  return db.select().from(contactosEmergencia).where(eq(contactosEmergencia.personalId, personalId))
}

export async function crearContactoEmergencia(data: {
  personalId: string
  nombre: string
  parentesco: string
  telefono: string
}) {
  const [nuevo] = await db.insert(contactosEmergencia).values(data).returning()
  revalidatePath("/rrhh")
  return nuevo
}

export async function eliminarContactoEmergencia(id: string) {
  await db.delete(contactosEmergencia).where(eq(contactosEmergencia.id, id))
  revalidatePath("/rrhh")
}

/* ═══════════════════════ IMPORTACIÓN EXCEL RRHH ═══════════════════════ */

export type ImportPersonalRecord = {
  id?: string
  nombre: string
  ci?: string
  cargo?: string
  unidad?: string
  email?: string
  telefono?: string
  fechaIngreso?: string
  estado?: string
}

function normalizarTextoBusqueda(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function generarPasswordAleatoria(): string {
  const prefixes = ["Agbc", "Correos", "Bolivia", "Postal", "AdminAGBC"]
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const year = 2026
  const symbols = ["!", "@", "#", "$", "*"]
  const symbol = symbols[Math.floor(Math.random() * symbols.length)]
  const chars = "abcdefghjkmnpqrstuvwxyz23456789ABCDEFGHJKMNPQRSTUVWXYZ"
  let randomSuffix = ""
  for (let i = 0; i < 4; i++) {
    randomSuffix += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `${prefix}${year}${symbol}${randomSuffix}`
}

let snapshotPersonalAntesDeImportacion: (typeof personal.$inferSelect)[] | null = null

export async function importarPersonalLote(registros: ImportPersonalRecord[]) {
  try {
    let totalImportados = 0
    let totalActualizados = 0
    let totalOmitidos = 0
    const hoy = new Date().toISOString().slice(0, 10)

    // Guardar snapshot de seguridad antes de procesar cambios para permitir revertir
    const personalPrevio = await db.select().from(personal)
    snapshotPersonalAntesDeImportacion = personalPrevio.map((p) => ({ ...p }))

    // Cargar todo el personal existente para cruce y deduplicación inteligente
    const todosPersonal = [...personalPrevio]
    const authContext = await auth.$context

    for (const r of registros) {
      const nombreLimpio = r.nombre ? r.nombre.trim() : ""
      if (!nombreLimpio) {
        totalOmitidos++
        continue
      }

      // Descartar si el nombre es solo números (ej. el N° 1, 2, 3...) o es demasiado corto o es un encabezado/banner
      const esNumero = /^[0-9]+$/.test(nombreLimpio)
      const esBanner =
        nombreLimpio === "N°" ||
        nombreLimpio.toLowerCase().startsWith("fecha de") ||
        /reporte oficial|planilla|nomina|agencia boliviana|fecha de emision|total funcionarios/i.test(nombreLimpio)

      if (esNumero || esBanner || nombreLimpio.length < 3) {
        totalOmitidos++
        continue
      }

      const idLimpio = r.id && r.id.trim().length > 5 ? r.id.trim() : undefined
      const cargoLimpio = (r.cargo || "Personal").trim()
      const unidadLimpia = (r.unidad || "Administración Central").trim()
      const emailLimpio = r.email && r.email.trim() !== "Sin asignar" && r.email.includes("@")
        ? r.email.trim().toLowerCase()
        : undefined
      const telefonoLimpio = r.telefono && r.telefono.trim() !== "Sin asignar" && r.telefono.trim() !== "—"
        ? r.telefono.trim()
        : undefined
      const fechaIngresoLimpia = r.fechaIngreso && /^\d{4}-\d{2}-\d{2}$/.test(r.fechaIngreso) ? r.fechaIngreso : hoy
      const estadoLimpio = r.estado?.toLowerCase() === "inactivo" ? "inactivo" : "activo"

      const nombreNorm = normalizarTextoBusqueda(nombreLimpio)

      // ── Búsqueda inteligente de duplicados / coincidencias ──
      let indexExistente = -1

      // 1. Coincidencia por ID explícito
      if (idLimpio) {
        indexExistente = todosPersonal.findIndex((p) => p.id === idLimpio)
      }

      // 2. Coincidencia por Correo Electrónico
      if (indexExistente === -1 && emailLimpio) {
        indexExistente = todosPersonal.findIndex(
          (p) => p.email && p.email.trim().toLowerCase() === emailLimpio
        )
      }

      // 3. Coincidencia por Nombre Completo Normalizado (permite variaciones leves, mayúsculas y acentos)
      if (indexExistente === -1 && nombreNorm.length >= 3) {
        // 3a. Coincidencia exacta normalizada
        indexExistente = todosPersonal.findIndex(
          (p) => normalizarTextoBusqueda(p.nombre) === nombreNorm
        )

        // 3b. Coincidencia por inclusión de nombres o palabras clave
        if (indexExistente === -1 && nombreNorm.length >= 4) {
          indexExistente = todosPersonal.findIndex((p) => {
            const dbNorm = normalizarTextoBusqueda(p.nombre)
            if (dbNorm.length >= 4 && (nombreNorm.includes(dbNorm) || dbNorm.includes(nombreNorm))) {
              return true
            }
            const tokens1 = nombreNorm.split(" ").filter((w) => w.length > 2)
            const tokens2 = dbNorm.split(" ").filter((w) => w.length > 2)
            if (tokens1.length >= 2 && tokens2.length >= 2) {
              const matches = tokens1.filter((t) => tokens2.includes(t))
              if (matches.length >= Math.min(tokens1.length, tokens2.length)) {
                return true
              }
            }
            return false
          })
        }
      }

      if (indexExistente !== -1) {
        // ── ACTUALIZAR REGISTRO EXISTENTE (UPSERT) ──
        // Refleja exactamente las nuevas mayúsculas, minúsculas, acentos y textos del Excel
        const existente = todosPersonal[indexExistente]
        const updateData: Partial<typeof personal.$inferInsert> = {
          nombre: nombreLimpio,
          cargo: cargoLimpio || existente.cargo,
          unidad: unidadLimpia || existente.unidad,
          estado: estadoLimpio,
        }

        if (emailLimpio) updateData.email = emailLimpio
        if (telefonoLimpio) updateData.telefono = telefonoLimpio
        if (fechaIngresoLimpia && fechaIngresoLimpia !== hoy) {
          updateData.fechaIngreso = fechaIngresoLimpia
        }

        const [actualizado] = await db.update(personal).set(updateData).where(eq(personal.id, existente.id)).returning()
        if (actualizado) {
          await sincronizarPersonalConUsuarioIndividual(actualizado)
        }

        todosPersonal[indexExistente] = {
          ...existente,
          ...updateData,
        }
        totalActualizados++
      } else {
        // ── INSERTAR NUEVO REGISTRO ──
        const insertData = {
          nombre: nombreLimpio,
          cargo: cargoLimpio,
          unidad: unidadLimpia,
          email: emailLimpio || null,
          telefono: telefonoLimpio || null,
          fechaIngreso: fechaIngresoLimpia,
          estado: estadoLimpio,
        }

        const [nuevo] = await db.insert(personal).values(insertData).returning()
        if (nuevo) {
          todosPersonal.push(nuevo)
          // Sincronizar automáticamente con users, account y roles
          await sincronizarPersonalConUsuarioIndividual(nuevo)
        }
        totalImportados++
      }
    }

    // Sincronización de seguridad bidireccional
    await sincronizarTodoPersonalConUsuarios()

    await registrarAuditLog({
      usuario: "sistema",
      accion: `Importó nómina Excel RRHH: ${totalImportados} nuevos, ${totalActualizados} actualizados`,
      modulo: "RRHH",
      resultado: "Exitoso",
    })

    revalidatePath("/rrhh")
    revalidatePath("/usuarios")
    revalidatePath("/dashboard")
    revalidatePath("/")

    return {
      success: true,
      data: {
        totalImportados,
        totalActualizados,
        totalOmitidos,
      },
    }
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Error al procesar la planilla de personal.",
    }
  }
}

export async function revertirUltimaImportacionRRHH() {
  try {
    if (snapshotPersonalAntesDeImportacion && snapshotPersonalAntesDeImportacion.length > 0) {
      await db.delete(personal)
      for (const p of snapshotPersonalAntesDeImportacion) {
        await db.insert(personal).values({
          id: p.id,
          nombre: p.nombre,
          cargo: p.cargo,
          unidad: p.unidad,
          email: p.email,
          telefono: p.telefono,
          fechaIngreso: p.fechaIngreso,
          estado: p.estado,
          foto: p.foto,
          createdAt: p.createdAt ? (p.createdAt instanceof Date ? p.createdAt : new Date(p.createdAt)) : new Date(),
          updatedAt: p.updatedAt ? (p.updatedAt instanceof Date ? p.updatedAt : new Date(p.updatedAt)) : new Date(),
        })
      }
      snapshotPersonalAntesDeImportacion = null
    } else {
      // Si no hay snapshot en memoria, limpiar automáticamente todos los registros inválidos/corruptos
      const all = await db.select().from(personal)
      for (const p of all) {
        const nombreTrim = p.nombre ? p.nombre.trim() : ""
        const isBogus =
          /^[0-9]+$/.test(nombreTrim) ||
          nombreTrim.length < 3 ||
          nombreTrim.toLowerCase().startsWith("fecha de") ||
          nombreTrim === "N°" ||
          /reporte oficial|planilla|nomina|agencia boliviana|total funcionarios/i.test(nombreTrim)

        if (isBogus) {
          await db.delete(personal).where(eq(personal.id, p.id))
        }
      }
    }

    // Sincronizar bidireccionalmente el personal restaurado con las cuentas de usuario
    await sincronizarTodoPersonalConUsuarios()

    await registrarAuditLog({
      usuario: "sistema",
      accion: "Revirtió importación de Excel en RRHH",
      modulo: "RRHH",
      resultado: "Exitoso",
    })

    revalidatePath("/rrhh")
    revalidatePath("/usuarios")
    revalidatePath("/dashboard")
    revalidatePath("/")

    return {
      success: true,
      message: "Cambios revertidos exitosamente. El padrón ha sido restaurado.",
    }
  } catch (err: unknown) {
    console.error("Error en revertirUltimaImportacionRRHH:", err)
    return {
      success: false,
      message: err instanceof Error ? err.message : "Error al revertir los cambios.",
    }
  }
}

export async function confirmarCambiosImportacionRRHH() {
  try {
    snapshotPersonalAntesDeImportacion = null

    await registrarAuditLog({
      usuario: "sistema",
      accion: "Confirmó y consolidó cambios de importación Excel RRHH",
      modulo: "RRHH",
      resultado: "Exitoso",
    })

    return {
      success: true,
      message: "Cambios fijados y consolidados permanentemente en el padrón.",
    }
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Error al confirmar los cambios.",
    }
  }
}

