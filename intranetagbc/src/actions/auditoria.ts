"use server"

import { db, pool } from "@/db"
import {
  auditLogs,
  users,
  roles,
  permissions,
  userRoles,
  rolePermissions,
  personal,
  directivos,
  contactosEmergencia,
  documentos,
  documentoCategorias,
  comunicados,
  banners,
  configuracion,
  sucursales,
  eventosCalendario,
  solicitudes,
  ticketsSoporte,
  reconocimientos,
  onboardingProgreso,
  onboardingConfig,
  notificaciones,
  emailLogs,
  session,
  intranetVisitasSeccion,
} from "@/db/schema"
import { createId } from "@paralleldrive/cuid2"
import { desc, inArray } from "drizzle-orm"
import { getAuditRequestContext, type AuditRequestContext } from "@/lib/auditoria-context"
import { obtenerSesionConAccesoActual } from "@/lib/auth/session-access"

export type AuditUserDirectoryEntry = {
  id: string
  nombre: string
  email: string
  avatar: string | null
}

export type TopDocumentoItem = {
  id: string
  titulo: string
  categoria: string
  descargas: number
  vistas: number
  tipoArchivo: string | null
  tamano: string | null
  ultimaDescarga: string | null
  ultimaVista: string | null
}

export type TopModuloItem = {
  modulo: string
  visitas: number
  porcentaje: number
  icono: string
  descripcion: string
  categoria: string
}

export type CeoAnalytics = {
  visitasTotales: number
  totalDescargas: number
  totalVisualizaciones: number
  porcentajeLectura: number
  totalDocumentos: number
  totalFuncionarios: number
  lecturaConfirmada: number
  lecturaPendiente: number
  topModulos: TopModuloItem[]
  topDocumentos: TopDocumentoItem[]
  horariosPico: { rango: string; periodo: string; actividad: number; porcentaje: number }[]
}

export async function registrarVisitaSeccionAction(params: {
  seccion: string
  detalles?: string
}) {
  try {
    const [sessionUser, requestContext] = await Promise.all([
      obtenerSesionConAccesoActual().catch(() => null),
      getAuditRequestContext().catch<AuditRequestContext>(() => ({})),
    ])

    const ip = cleanText(requestContext.ip) || null
    const usuarioId = sessionUser?.id || null

    // 1. Guardar en tabla intranet_visitas_seccion
    try {
      await db.insert(intranetVisitasSeccion).values({
        id: createId(),
        usuarioId,
        seccion: params.seccion,
        ip,
        detalles: params.detalles || null,
      })
    } catch {
      await pool.query(
        `INSERT INTO "intranet_visitas_seccion" ("id", "usuario_id", "seccion", "ip", "detalles", "created_at")
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [createId(), usuarioId, params.seccion, ip, params.detalles || null]
      ).catch(() => null)
    }

    // 2. Registrar en auditoría para trazabilidad institucional
    await registrarAuditLog({
      usuario: usuarioId || "sistema",
      accion: `Visitó sección: ${params.seccion}`,
      modulo: "Navegación",
      ip,
      resultado: "Exitoso",
      detalles: { seccion: params.seccion, detalle: params.detalles, tipo: "visita_seccion" },
    })

    return { success: true }
  } catch (error) {
    console.error("Error al registrar visita de sección:", error)
    return { success: false }
  }
}

export async function registrarAccionDocumentoAction(params: {
  documentoId: string
  titulo: string
  accion?: "Descargó documento" | "Visualizó documento"
  tipo?: "descarga" | "vista" | "visualizacion"
}) {
  try {
    const isVista =
      params.tipo === "vista" ||
      params.tipo === "visualizacion" ||
      (params.accion ? params.accion.toLowerCase().includes("visualiz") : false)
    const accionTexto = isVista ? "Visualizó documento" : "Descargó documento"

    await registrarAuditLog({
      modulo: "Documentos",
      accion: `${accionTexto}: ${params.titulo}`,
      detalles: {
        documentoId: params.documentoId,
        titulo: params.titulo,
        tipo: isVista ? "visualizacion" : "descarga",
      },
    })
    return { success: true }
  } catch (error) {
    console.error("Error al registrar accion de documento:", error)
    return { success: false }
  }
}

export async function obtenerAuditLogs() {
  return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt))
}

export async function registrarAuditLog(data: {
  usuario?: string
  accion: string
  modulo: string
  ip?: string | null
  ubicacionCiudad?: string | null
  ubicacionPais?: string | null
  ubicacionCodigoPais?: string | null
  resultado?: string
  detalles?: string | Record<string, unknown> | null
}) {
  const [sessionUser, requestContext] = await Promise.all([
    obtenerSesionConAccesoActual().catch(() => null),
    getAuditRequestContext().catch<AuditRequestContext>(() => ({})),
  ])

  const usuarioInput = cleanText(data.usuario)
  const usuarioFinal =
    !usuarioInput || normalizeText(usuarioInput) === "sistema"
      ? sessionUser?.id ?? usuarioInput ?? "sistema"
      : usuarioInput

  const ipFinal = cleanText(data.ip) ?? cleanText(requestContext.ip) ?? null
  const ubicacionCiudad =
    cleanText(data.ubicacionCiudad) ??
    cleanText(requestContext.ubicacion?.ciudad) ??
    null
  const ubicacionPais =
    cleanText(data.ubicacionPais) ??
    cleanText(requestContext.ubicacion?.pais) ??
    null
  const ubicacionCodigoPais =
    cleanText(data.ubicacionCodigoPais) ??
    cleanText(requestContext.ubicacion?.countryCode) ??
    null

  const detalles = mergeDetalles(data.detalles, {
    usuario: sessionUser?.id ? { id: sessionUser.id } : undefined,
    ubicacion:
      ubicacionCiudad || ubicacionPais || ubicacionCodigoPais
        ? {
            ciudad: ubicacionCiudad ?? undefined,
            pais: ubicacionPais ?? undefined,
            countryCode: ubicacionCodigoPais ?? undefined,
          }
        : undefined,
  })

  await db.insert(auditLogs).values({
    usuario: usuarioFinal,
    accion: data.accion,
    modulo: data.modulo,
    ip: ipFinal,
    ubicacionCiudad,
    ubicacionPais,
    ubicacionCodigoPais,
    resultado: data.resultado ?? "Exitoso",
    detalles: detalles ?? null,
  })
}

export async function obtenerStatsAuditoria(): Promise<{
  total: number
  exitosos: number
  fallidos: number
  modulos: number
  logs: (typeof auditLogs.$inferSelect)[]
  userDirectory: Record<string, AuditUserDirectoryEntry>
  ceoAnalytics: CeoAnalytics
}> {
  const [logs, usuariosDb, personalDb, documentosDb, categoriasDb, sesionesDb, progresoDb] = await Promise.all([
    db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)),
    db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastNamePaternal: users.lastNamePaternal,
        lastNameMaternal: users.lastNameMaternal,
        institutionalEmail: users.institutionalEmail,
        image: users.image,
      })
      .from(users),
    db.select().from(personal),
    db.select().from(documentos),
    db.select().from(documentoCategorias),
    db.select().from(session),
    db.select().from(onboardingProgreso),
  ])

  const userDirectory: Record<string, AuditUserDirectoryEntry> = {}
  for (const usuario of usuariosDb) {
    userDirectory[usuario.id] = {
      id: usuario.id,
      nombre: `${usuario.firstName} ${usuario.lastNamePaternal}${usuario.lastNameMaternal ? ` ${usuario.lastNameMaternal}` : ""}`.trim(),
      email: usuario.institutionalEmail,
      avatar: usuario.image,
    }
  }

  // Mapa de categorías de documentos
  const catMap = new Map<string, string>()
  for (const c of categoriasDb) {
    catMap.set(c.id, c.nombre)
  }

  // 1. Conteo exacto y real de Documentos: Descargas y Visualizaciones
  const descargasPorDoc = new Map<string, { count: number; ultimaFecha: Date | null }>()
  const vistasPorDoc = new Map<string, { count: number; ultimaFecha: Date | null }>()

  for (const log of logs) {
    const mod = (log.modulo || "").toLowerCase()
    const acc = (log.accion || "").toLowerCase()
    const det = (log.detalles || "").toLowerCase()

    const esDoc = mod.includes("doc") || acc.includes("documento") || det.includes("documento")
    if (!esDoc) continue

    const esDescarga = acc.includes("descarg") || det.includes('"tipo":"descarga"') || det.includes("descargó")
    const esVista = acc.includes("visualiz") || det.includes('"tipo":"visualizacion"') || acc.includes("leyó") || acc.includes("abrió")

    for (const doc of documentosDb) {
      const coincide =
        (log.detalles && log.detalles.includes(doc.id)) ||
        acc.includes(doc.titulo.toLowerCase().slice(0, 25)) ||
        (log.detalles && det.includes(doc.titulo.toLowerCase().slice(0, 25)))

      if (coincide) {
        const f = new Date(log.createdAt)
        if (esDescarga) {
          const prev = descargasPorDoc.get(doc.id) || { count: 0, ultimaFecha: null }
          descargasPorDoc.set(doc.id, {
            count: prev.count + 1,
            ultimaFecha: !prev.ultimaFecha || f > prev.ultimaFecha ? f : prev.ultimaFecha,
          })
        } else if (esVista) {
          const prev = vistasPorDoc.get(doc.id) || { count: 0, ultimaFecha: null }
          vistasPorDoc.set(doc.id, {
            count: prev.count + 1,
            ultimaFecha: !prev.ultimaFecha || f > prev.ultimaFecha ? f : prev.ultimaFecha,
          })
        }
      }
    }
  }

  const topDocumentos: TopDocumentoItem[] = documentosDb
    .map((doc) => {
      const regDesc = descargasPorDoc.get(doc.id)
      const regVista = vistasPorDoc.get(doc.id)
      const descargas = regDesc?.count || 0
      const vistas = regVista?.count || 0
      const catNombre = doc.categoriaId ? (catMap.get(doc.categoriaId) || "Normativa") : "Institucional"

      return {
        id: doc.id,
        titulo: doc.titulo,
        categoria: catNombre,
        descargas,
        vistas,
        tipoArchivo: doc.tipoArchivo || "pdf",
        tamano: doc.tamano || null,
        ultimaDescarga: regDesc?.ultimaFecha ? regDesc.ultimaFecha.toISOString() : null,
        ultimaVista: regVista?.ultimaFecha ? regVista.ultimaFecha.toISOString() : null,
      }
    })
    .sort((a, b) => b.descargas - a.descargas || b.vistas - a.vistas)

  const totalDescargas = topDocumentos.reduce((acc, d) => acc + d.descargas, 0)
  const totalVisualizaciones = topDocumentos.reduce((acc, d) => acc + d.vistas, 0)

  // 2. Lugares donde más entran (Ranking de las 10 Secciones Institucionales de Usuarios)
  const moduloVisitas: Record<string, { visitas: number; icono: string; desc: string; categoria: string }> = {
    "Documentos Institucionales": {
      visitas: 0,
      icono: "BookOpen",
      desc: "Consultas, descargas y lecturas de reglamentos, manuales y normativas oficiales",
      categoria: "Documentos",
    },
    "Noticias Institucionales": {
      visitas: 0,
      icono: "Newspaper",
      desc: "Boletines informativos, notas destacadas y novedades de prensa institucional",
      categoria: "Noticias",
    },
    "Comunicados Oficiales": {
      visitas: 0,
      icono: "Bell",
      desc: "Circulares oficiales, avisos urgentes y disposiciones emitidas por dirección",
      categoria: "Comunicados",
    },
    "Personal Institucional (Directorio)": {
      visitas: 0,
      icono: "Users",
      desc: "Directorio de funcionarios, cargos, unidades y teléfonos de contacto interno",
      categoria: "Directorio",
    },
    "Accesos Rápidos a Sistemas": {
      visitas: 0,
      icono: "ExternalLink",
      desc: "Ingreso directo a plataformas institucionales (SIGEP, Correspondencia, Correo)",
      categoria: "Sistemas",
    },
    "Redes Sociales Institucionales": {
      visitas: 0,
      icono: "Share2",
      desc: "Seguimiento a canales corporativos de Facebook, X, YouTube y redes oficiales",
      categoria: "Redes",
    },
    "Oficinas & Sucursales Postales": {
      visitas: 0,
      icono: "MapPin",
      desc: "Directorio zonal de oficinas, agencias regionales y puntos de atención postal",
      categoria: "Oficinas",
    },
    "Centro de Notificaciones": {
      visitas: 0,
      icono: "Inbox",
      desc: "Alertas institucionales, avisos de lectura obligatoria y recordatorios personales",
      categoria: "Notificaciones",
    },
    "Cumpleaños & Efemérides": {
      visitas: 0,
      icono: "Cake",
      desc: "Felicitaciones a funcionarios del día, agenda cívica y calendario de efemérides",
      categoria: "Eventos",
    },
    "Mi Perfil Institucional": {
      visitas: 0,
      icono: "UserCheck",
      desc: "Consulta de ficha del funcionario, credenciales y configuración personal",
      categoria: "Perfil",
    },
  }

  // A. Conteo desde la tabla dedicada intranet_visitas_seccion
  let visitasSeccionesDb: { seccion: string; createdAt: Date }[] = []
  try {
    const rows = await db
      .select({
        seccion: intranetVisitasSeccion.seccion,
        createdAt: intranetVisitasSeccion.createdAt,
      })
      .from(intranetVisitasSeccion)
    visitasSeccionesDb = rows
    for (const v of rows) {
      if (moduloVisitas[v.seccion]) {
        moduloVisitas[v.seccion].visitas += 1
      }
    }
  } catch {
    // Si la tabla estuviera recién creándose o sin registros
  }

  // B. Conteo desde logs de auditoría (para capturar eventos de navegación)
  for (const log of logs) {
    const mod = (log.modulo || "").toLowerCase()
    const acc = (log.accion || "").toLowerCase()
    const det = (log.detalles || "").toLowerCase()

    if (mod.includes("navega") || det.includes("visita_seccion") || acc.includes("visitó sección") || acc.includes("ingresó a:")) {
      for (const nombreSeccion of Object.keys(moduloVisitas)) {
        if (acc.includes(nombreSeccion.toLowerCase()) || det.includes(nombreSeccion.toLowerCase())) {
          // Solo sumamos si la tabla dedicada no tiene ya este log
          if (visitasSeccionesDb.length === 0) {
            moduloVisitas[nombreSeccion].visitas += 1
          }
        }
      }
    }
  }

  const totalVisitasModulos = Object.values(moduloVisitas).reduce((a, b) => a + b.visitas, 0)

  const topModulos: TopModuloItem[] = Object.entries(moduloVisitas)
    .map(([modulo, item]) => ({
      modulo,
      visitas: item.visitas,
      porcentaje: totalVisitasModulos > 0 ? Math.round((item.visitas / totalVisitasModulos) * 100) : 0,
      icono: item.icono,
      descripcion: item.desc,
      categoria: item.categoria,
    }))
    .sort((a, b) => b.visitas - a.visitas)

  // 3. Tráfico General y Visitas Totales (cada vez que ingresan al sistema en tiempo real)
  const loginEvents = logs.filter((l) => {
    const acc = l.accion.toLowerCase()
    const mod = l.modulo.toLowerCase()
    return mod.includes("autentica") || acc.includes("inició sesión") || acc.includes("inicio sesion") || acc.includes("login")
  }).length
  const visitasTotales = Math.max(sesionesDb.length, loginEvents)

  // 4. Cumplimiento de Lectura Obligatoria
  const totalFuncionarios = usuariosDb.length || personalDb.length || 1
  const lecturaConfirmada = progresoDb.filter((p) => p.estado === "completado" || p.completadoEn).length
  const lecturaPendiente = Math.max(0, totalFuncionarios - lecturaConfirmada)
  const porcentajeLectura = Math.round((lecturaConfirmada / Math.max(1, totalFuncionarios)) * 100)

  // 5. Horarios Pico según la jornada oficial de AGBC (tiempo real):
  // Mañana: 08:30 a 12:30 (510 a 750 min)
  // Almuerzo / Receso: 12:30 a 13:00 (750 a 780 min)
  // Tarde (hasta salida): 13:00 a 16:30 (780 a 990 min)
  // Horas Extra: 16:30 a 20:00 (990 a 1200 min)
  // Guardia / Nocturno: 20:00 a 08:30 (>= 1200 o < 510 min)
  const peakBuckets = [
    {
      rango: "08:30 - 12:30",
      periodo: "Jornada Mañana (Ingreso y Operación Laboral)",
      match: (mins: number) => mins >= 510 && mins < 750,
      count: 0,
    },
    {
      rango: "12:30 - 13:00",
      periodo: "Receso / Almuerzo Institucional",
      match: (mins: number) => mins >= 750 && mins < 780,
      count: 0,
    },
    {
      rango: "13:00 - 16:30",
      periodo: "Jornada Tarde (Operación Laboral y Salida)",
      match: (mins: number) => mins >= 780 && mins < 990,
      count: 0,
    },
    {
      rango: "16:30 - 20:00",
      periodo: "Horas Extra / Salida Tardía",
      match: (mins: number) => mins >= 990 && mins < 1200,
      count: 0,
    },
    {
      rango: "20:00 - 08:30",
      periodo: "Guardia / Turno Nocturno",
      match: (mins: number) => mins >= 1200 || mins < 510,
      count: 0,
    },
  ]

  for (const log of logs) {
    const d = new Date(log.createdAt)
    const boliviaHour = (d.getUTCHours() - 4 + 24) % 24
    const boliviaMin = d.getUTCMinutes()
    const totalMins = boliviaHour * 60 + boliviaMin

    const bucket = peakBuckets.find((b) => b.match(totalMins))
    if (bucket) bucket.count++
  }

  for (const s of sesionesDb) {
    const d = new Date(s.createdAt)
    const boliviaHour = (d.getUTCHours() - 4 + 24) % 24
    const boliviaMin = d.getUTCMinutes()
    const totalMins = boliviaHour * 60 + boliviaMin

    const bucket = peakBuckets.find((b) => b.match(totalMins))
    if (bucket) bucket.count++
  }

  for (const v of visitasSeccionesDb) {
    const d = new Date(v.createdAt)
    const boliviaHour = (d.getUTCHours() - 4 + 24) % 24
    const boliviaMin = d.getUTCMinutes()
    const totalMins = boliviaHour * 60 + boliviaMin

    const bucket = peakBuckets.find((b) => b.match(totalMins))
    if (bucket) bucket.count++
  }

  const totalActividadPico = peakBuckets.reduce((acc, b) => acc + b.count, 0)
  const horariosPico = peakBuckets.map((b) => ({
    rango: b.rango,
    periodo: b.periodo,
    actividad: b.count,
    porcentaje: totalActividadPico > 0 ? Math.round((b.count / totalActividadPico) * 100) : 0,
  }))

  const ceoAnalytics: CeoAnalytics = {
    visitasTotales,
    totalDescargas,
    totalVisualizaciones,
    porcentajeLectura,
    totalDocumentos: documentosDb.length,
    totalFuncionarios,
    lecturaConfirmada,
    lecturaPendiente,
    topModulos,
    topDocumentos,
    horariosPico,
  }

  return {
    total: logs.length,
    exitosos: logs.filter((l) => l.resultado === "Exitoso").length,
    fallidos: logs.filter((l) => l.resultado === "Fallido").length,
    modulos: new Set(logs.map((l) => l.modulo)).size,
    logs,
    userDirectory,
    ceoAnalytics,
  }
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase()
}

function cleanText(value: string | null | undefined): string | undefined {
  if (!value) {
    return undefined
  }

  const clean = value.trim()
  return clean.length > 0 ? clean : undefined
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function mergeNestedRecord(
  base: unknown,
  extra: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  const baseRecord = isObjectRecord(base) ? base : undefined

  if (!baseRecord && !extra) {
    return undefined
  }

  return {
    ...(extra ?? {}),
    ...(baseRecord ?? {}),
  }
}

function mergeDetalles(
  input: string | Record<string, unknown> | null | undefined,
  extras: {
    usuario?: Record<string, unknown>
    ubicacion?: Record<string, unknown>
  },
): string | undefined {
  if (typeof input === "string") {
    const trimmed = input.trim()

    if (trimmed.length === 0) {
      return buildDetailsFromRecord({}, extras)
    }

    try {
      const parsed = JSON.parse(trimmed) as unknown

      if (isObjectRecord(parsed)) {
        return buildDetailsFromRecord(parsed, extras)
      }
    } catch {
      return buildDetailsFromRecord({ mensaje: trimmed }, extras) ?? trimmed
    }

    return buildDetailsFromRecord({ mensaje: trimmed }, extras) ?? trimmed
  }

  if (isObjectRecord(input)) {
    return buildDetailsFromRecord(input, extras)
  }

  return buildDetailsFromRecord({}, extras)
}

function buildDetailsFromRecord(
  record: Record<string, unknown>,
  extras: {
    usuario?: Record<string, unknown>
    ubicacion?: Record<string, unknown>
  },
): string | undefined {
  const merged: Record<string, unknown> = {
    ...record,
  }

  const usuario = mergeNestedRecord(record.usuario, extras.usuario)
  const ubicacion = mergeNestedRecord(record.ubicacion, extras.ubicacion)

  if (usuario) {
    merged.usuario = usuario
  }

  if (ubicacion) {
    merged.ubicacion = ubicacion
  }

  if (Object.keys(merged).length === 0) {
    return undefined
  }

  return JSON.stringify(merged)
}

// ── Generar Copia de Seguridad Completa de la Base de Datos ──
export async function generarBackupBaseDatosAction(): Promise<{
  success: boolean
  message: string
  backup?: any
  filename?: string
}> {
  try {
    const session = await obtenerSesionConAccesoActual()
    if (!session?.id) {
      return { success: false, message: "No autorizado para generar respaldos de base de datos" }
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const filename = `backup_agbc_db_${timestamp}.json`

    const [
      u, r, p, ur, rp,
      pers, dir, conEmerg,
      docs, docCats,
      coms, bans, configs,
      sucs, evCal,
      solics, ticks,
      recs, onbProg, onbConf,
      notifs, eLogs, aLogs,
    ] = await Promise.all([
      db.select().from(users).catch(() => []),
      db.select().from(roles).catch(() => []),
      db.select().from(permissions).catch(() => []),
      db.select().from(userRoles).catch(() => []),
      db.select().from(rolePermissions).catch(() => []),
      db.select().from(personal).catch(() => []),
      db.select().from(directivos).catch(() => []),
      db.select().from(contactosEmergencia).catch(() => []),
      db.select().from(documentos).catch(() => []),
      db.select().from(documentoCategorias).catch(() => []),
      db.select().from(comunicados).catch(() => []),
      db.select().from(banners).catch(() => []),
      db.select().from(configuracion).catch(() => []),
      db.select().from(sucursales).catch(() => []),
      db.select().from(eventosCalendario).catch(() => []),
      db.select().from(solicitudes).catch(() => []),
      db.select().from(ticketsSoporte).catch(() => []),
      db.select().from(reconocimientos).catch(() => []),
      db.select().from(onboardingProgreso).catch(() => []),
      db.select().from(onboardingConfig).catch(() => []),
      db.select().from(notificaciones).limit(2000).catch(() => []),
      db.select().from(emailLogs).limit(2000).catch(() => []),
      db.select().from(auditLogs).limit(5000).catch(() => []),
    ])

    const conteoPorTabla: Record<string, number> = {
      usuarios: u.length,
      roles: r.length,
      permisos: p.length,
      usuario_roles: ur.length,
      rol_permisos: rp.length,
      personal_rrhh: pers.length,
      directivos: dir.length,
      contactos_emergencia: conEmerg.length,
      documentos: docs.length,
      categorias_documentos: docCats.length,
      comunicados: coms.length,
      noticias_banners: bans.length,
      configuracion: configs.length,
      sucursales: sucs.length,
      eventos_calendario: evCal.length,
      solicitudes_tramites: solics.length,
      tickets_soporte: ticks.length,
      reconocimientos: recs.length,
      onboarding_progreso: onbProg.length,
      onboarding_config: onbConf.length,
      notificaciones: notifs.length,
      email_logs: eLogs.length,
      logs_auditoria: aLogs.length,
    }

    const totalRegistros = Object.values(conteoPorTabla).reduce((acc, curr) => acc + curr, 0)

    const backupData = {
      metadata: {
        sistema: "Intranet AGBC - Agencia Boliviana de Correos",
        version: "2.0",
        fechaGeneracion: new Date().toISOString(),
        usuarioId: session.id,
        totalTablas: Object.keys(conteoPorTabla).length,
        totalRegistros,
        conteoPorTabla,
      },
      tablas: {
        users: u,
        roles: r,
        permissions: p,
        userRoles: ur,
        rolePermissions: rp,
        personal: pers,
        directivos: dir,
        contactosEmergencia: conEmerg,
        documentos: docs,
        documentoCategorias: docCats,
        comunicados: coms,
        banners: bans,
        configuracion: configs,
        sucursales: sucs,
        eventosCalendario: evCal,
        solicitudes: solics,
        ticketsSoporte: ticks,
        reconocimientos: recs,
        onboardingProgreso: onbProg,
        onboardingConfig: onbConf,
        notificaciones: notifs,
        emailLogs: eLogs,
        auditLogs: aLogs,
      },
    }

    await registrarAuditLog({
      usuario: session.id,
      accion: `Generó Copia de Seguridad completa de la Base de Datos (${totalRegistros} registros en ${Object.keys(conteoPorTabla).length} tablas)`,
      modulo: "Auditoría",
      resultado: "Exitoso",
      detalles: {
        archivo: filename,
        totalRegistros,
        totalTablas: Object.keys(conteoPorTabla).length,
      },
    })

    return {
      success: true,
      message: `Respaldo generado con éxito: ${totalRegistros} registros en ${Object.keys(conteoPorTabla).length} tablas.`,
      backup: backupData,
      filename,
    }
  } catch (error: any) {
    console.error("Error al generar backup de base de datos:", error)
    return {
      success: false,
      message: error?.message || "Error al generar la copia de seguridad de la base de datos",
    }
  }
}
