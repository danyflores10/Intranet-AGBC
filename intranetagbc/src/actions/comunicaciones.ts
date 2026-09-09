"use server"

import { db } from "@/db"
import { comunicados, banners, configuracion } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { registrarAuditLog } from "@/actions/auditoria"

export type AccesoDirectoData = {
  titulo: string
  descripcion?: string
  url: string
  categoria?: string
  activo?: boolean
  imagen?: string
}

export type AccesoDirectoRow = {
  clave: string
  titulo: string
  descripcion: string
  url: string
  categoria: string
  activo: boolean
  imagen: string
  updatedAt: Date
}

const ACCESOS_DIRECTOS_GRUPO = "accesos_directos"

export const ACCESOS_DIRECTOS_DEFAULT: AccesoDirectoRow[] = [
  // ── Links Internos de Correos de Bolivia ──
  {
    clave: "default_sigec",
    titulo: "SIGEC (Correspondencia AGBC)",
    descripcion: "Sistema oficial de gestión, seguimiento y archivo de correspondencia institucional.",
    url: "https://sigec.correos.gob.bo/",
    categoria: "Links Internos",
    activo: true,
    imagen: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=800&auto=format&fit=crop",
    updatedAt: new Date("2026-04-12T00:00:00.000Z"),
  },
  {
    clave: "default_zimbra",
    titulo: "ZIMBRA (Correo Electrónico)",
    descripcion: "Plataforma institucional de mensajería y correo corporativo de la AGBC.",
    url: "https://zimbra.correos.gob.bo/",
    categoria: "Links Internos",
    activo: true,
    imagen: "https://images.unsplash.com/photo-1557200134-90327ee9fafa?q=80&w=800&auto=format&fit=crop",
    updatedAt: new Date("2026-04-12T00:00:00.000Z"),
  },
  {
    clave: "default_intranet",
    titulo: "INTRANET AGBC",
    descripcion: "Portal centralizado de servicios internos, noticias y recursos humanos.",
    url: "https://intranet.correos.gob.bo:8122/",
    categoria: "Links Internos",
    activo: true,
    imagen: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=800&auto=format&fit=crop",
    updatedAt: new Date("2026-04-12T00:00:00.000Z"),
  },

  // ── Links Públicos de Correos de Bolivia ──
  {
    clave: "default_portal",
    titulo: "Página Web Oficial",
    descripcion: "Sitio web oficial de Correos de Bolivia con información y tarifas al usuario.",
    url: "https://correos.gob.bo/",
    categoria: "Links Públicos",
    activo: true,
    imagen: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=800&auto=format&fit=crop",
    updatedAt: new Date("2026-04-12T00:00:00.000Z"),
  },
  {
    clave: "default_institucional",
    titulo: "Página Institucional",
    descripcion: "Portal de transparencia, rendición de cuentas e información de la institución.",
    url: "https://institucional.correos.gob.bo:8007/",
    categoria: "Links Públicos",
    activo: true,
    imagen: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop",
    updatedAt: new Date("2026-04-12T00:00:00.000Z"),
  },

  // ── Links Operativos de la Agencia Boliviana de Correos ──
  {
    clave: "default_facturacion",
    titulo: "Sistema de Facturación",
    descripcion: "Emisión de facturas electrónicas y gestión tributaria de envíos postales.",
    url: "http://172.65.10.55:8116",
    categoria: "Links Operativos",
    activo: true,
    imagen: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=800&auto=format&fit=crop",
    updatedAt: new Date("2026-04-12T00:00:00.000Z"),
  },
  {
    clave: "default_chatbot",
    titulo: "Chatbot AGBC",
    descripcion: "Asistente virtual de atención automatizada y consultas ciudadanas.",
    url: "https://chatbot.correos.gob.bo:5000/",
    categoria: "Links Operativos",
    activo: true,
    imagen: "https://images.unsplash.com/photo-1531746790731-6c087fecd65a?q=80&w=800&auto=format&fit=crop",
    updatedAt: new Date("2026-04-12T00:00:00.000Z"),
  },
  {
    clave: "default_siop",
    titulo: "SIOP (Rastreo Postal)",
    descripcion: "Sistema Integrado de Operaciones Postales y trazabilidad nacional.",
    url: "https://trackingbo.correos.gob.bo:8100/",
    categoria: "Links Operativos",
    activo: true,
    imagen: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop",
    updatedAt: new Date("2026-04-12T00:00:00.000Z"),
  },
  {
    clave: "default_casillas",
    titulo: "Sistema de Casillas",
    descripcion: "Administración, asignación y cobro de casillas postales para usuarios.",
    url: "https://casillas.correos.gob.bo:3001/",
    categoria: "Links Operativos",
    activo: true,
    imagen: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=800&auto=format&fit=crop",
    updatedAt: new Date("2026-04-12T00:00:00.000Z"),
  },
  {
    clave: "default_verificacion_doc",
    titulo: "Sistema de Verificación Documental",
    descripcion: "Validación digital de documentos, cartas y resoluciones emitidas.",
    url: "http://172.65.10.55:8108/",
    categoria: "Links Operativos",
    activo: true,
    imagen: "https://images.unsplash.com/photo-1450133064473-71024230f91b?q=80&w=800&auto=format&fit=crop",
    updatedAt: new Date("2026-04-12T00:00:00.000Z"),
  },
  {
    clave: "default_calculadora",
    titulo: "Calculadora Postal",
    descripcion: "Cotizador en línea de tarifas nacionales e internacionales por peso y destino.",
    url: "https://postar.correos.gob.bo:8104/",
    categoria: "Links Operativos",
    activo: true,
    imagen: "https://images.unsplash.com/photo-1554224154-26032ffc0d07?q=80&w=800&auto=format&fit=crop",
    updatedAt: new Date("2026-04-12T00:00:00.000Z"),
  },
  {
    clave: "default_qcs",
    titulo: "Quality Web System (UPU)",
    descripcion: "Sistema de control de calidad y tiempos de entrega de la Unión Postal Universal.",
    url: "https://qcsmail.ptc.post/login.aspx",
    categoria: "Links Operativos",
    activo: true,
    imagen: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=800&auto=format&fit=crop",
    updatedAt: new Date("2026-04-12T00:00:00.000Z"),
  },
  {
    clave: "default_ips",
    titulo: "IPS Web Client (UPU)",
    descripcion: "International Postal System para intercambio de despachos aduaneros.",
    url: "https://ips.correos.gob.bo/IPSWeb/ES",
    categoria: "Links Operativos",
    activo: true,
    imagen: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=800&auto=format&fit=crop",
    updatedAt: new Date("2026-04-12T00:00:00.000Z"),
  },
  {
    clave: "default_cds",
    titulo: "CDS Web Client (UPU)",
    descripcion: "Customs Declaration System para declaraciones aduaneras postales.",
    url: "https://ips.correos.gob.bo/CDS.Web/LogIn.aspx",
    categoria: "Links Operativos",
    activo: true,
    imagen: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=800&auto=format&fit=crop",
    updatedAt: new Date("2026-04-12T00:00:00.000Z"),
  },
  {
    clave: "default_globaltrack",
    titulo: "Global Track and Trace",
    descripcion: "Seguimiento global de paquetería internacional en la red de la UPU.",
    url: "https://globaltracktrace.ptc.post/gtt.web/",
    categoria: "Links Operativos",
    activo: true,
    imagen: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop",
    updatedAt: new Date("2026-04-12T00:00:00.000Z"),
  },

  // ── Links Consultas y Soporte AGBC ──
  {
    clave: "default_solicitud_acceso",
    titulo: "Solicitud de Acceso a Sistemas",
    descripcion: "Formulario interno para requerir cuentas, accesos o permisos de red.",
    url: "http://172.65.10.55:8128/solicitar-acceso",
    categoria: "Consultas y Soporte",
    activo: true,
    imagen: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop",
    updatedAt: new Date("2026-04-12T00:00:00.000Z"),
  },
  {
    clave: "default_marcaciones",
    titulo: "Verificación de Marcaciones",
    descripcion: "Consulta individual de marcaciones de asistencia y horarios mediante CI.",
    url: "http://172.65.10.55:8129/consulta-carnet",
    categoria: "Consultas y Soporte",
    activo: true,
    imagen: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop",
    updatedAt: new Date("2026-04-12T00:00:00.000Z"),
  },
  {
    clave: "default_reportes_errores",
    titulo: "Reportes de Errores en Sistemas",
    descripcion: "Mesa de ayuda y registro de incidencias técnicas y fallas de software.",
    url: "http://172.65.10.55:8117/reportar/",
    categoria: "Consultas y Soporte",
    activo: true,
    imagen: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=800&auto=format&fit=crop",
    updatedAt: new Date("2026-04-12T00:00:00.000Z"),
  },
]

function parseAccesoDirectoValor(
  row: { clave: string; valor: string; descripcion: string | null; updatedAt: Date }
): AccesoDirectoRow {
  try {
    const parsed = JSON.parse(row.valor) as Partial<AccesoDirectoData>
    return {
      clave: row.clave,
      titulo: typeof parsed.titulo === "string" ? parsed.titulo : row.clave,
      descripcion:
        typeof parsed.descripcion === "string"
          ? parsed.descripcion
          : (row.descripcion ?? ""),
      url: typeof parsed.url === "string" ? parsed.url : "",
      categoria: typeof parsed.categoria === "string" && parsed.categoria.trim().length > 0 ? parsed.categoria : "Links Operativos",
      activo: typeof parsed.activo === "boolean" ? parsed.activo : true,
      imagen: typeof parsed.imagen === "string" ? parsed.imagen : "",
      updatedAt: row.updatedAt,
    }
  } catch {
    return {
      clave: row.clave,
      titulo: row.clave,
      descripcion: row.descripcion ?? "",
      url: "",
      categoria: "Links Operativos",
      activo: true,
      imagen: "",
      updatedAt: row.updatedAt,
    }
  }
}

// ── Comunicados ──
export async function obtenerComunicados() {
  return db.select().from(comunicados).orderBy(desc(comunicados.createdAt))
}

export async function crearComunicado(data: {
  titulo: string
  contenido: string
  tipo?: string
  estado?: string
  fechaPublicacion?: string
  fechaExpiracion?: string
  destacado?: boolean
  archivoUrl?: string
  archivoNombre?: string
  archivoTipo?: string
}) {
  const [nuevo] = await db.insert(comunicados).values(data).returning()
  await registrarAuditLog({ usuario: "sistema", accion: `Creó comunicado: ${data.titulo}`, modulo: "Comunicaciones", resultado: "Exitoso" })
  revalidatePath("/comunicaciones")
  revalidatePath("/")
  return nuevo
}

export async function actualizarComunicado(id: string, data: Partial<{
  titulo: string
  contenido: string
  tipo: string
  estado: string
  fechaPublicacion: string
  fechaExpiracion: string
  destacado: boolean
  archivoUrl: string | null
  archivoNombre: string | null
  archivoTipo: string | null
}>) {
  const [actualizado] = await db.update(comunicados).set(data).where(eq(comunicados.id, id)).returning()
  await registrarAuditLog({ usuario: "sistema", accion: `Actualizó comunicado ID: ${id}`, modulo: "Comunicaciones", resultado: "Exitoso" })
  revalidatePath("/comunicaciones")
  revalidatePath("/")
  return actualizado
}

export async function eliminarComunicado(id: string) {
  await db.delete(comunicados).where(eq(comunicados.id, id))
  await registrarAuditLog({ usuario: "sistema", accion: `Eliminó comunicado ID: ${id}`, modulo: "Comunicaciones", resultado: "Exitoso" })
  revalidatePath("/comunicaciones")
  revalidatePath("/")
}

// ── Banners ──
export async function obtenerBanners() {
  return db.select().from(banners).orderBy(banners.orden)
}

export async function crearBanner(data: {
  titulo: string
  descripcion?: string
  imagen?: string
  imagenes?: string
  enlace?: string
  activo?: boolean
}) {
  const [nuevo] = await db.insert(banners).values(data).returning()
  revalidatePath("/comunicaciones")
  revalidatePath("/")
  return nuevo
}

export async function actualizarBanner(id: string, data: Partial<{
  titulo: string
  descripcion: string
  imagen: string
  imagenes: string
  enlace: string
  activo: boolean
  orden: string
}>) {
  const [actualizado] = await db.update(banners).set(data).where(eq(banners.id, id)).returning()
  revalidatePath("/comunicaciones")
  revalidatePath("/")
  return actualizado
}

export async function eliminarBanner(id: string) {
  await db.delete(banners).where(eq(banners.id, id))
  revalidatePath("/comunicaciones")
  revalidatePath("/")
}

export async function obtenerComunicadosPublicados() {
  return db.select().from(comunicados)
    .where(eq(comunicados.estado, "publicado"))
    .orderBy(desc(comunicados.createdAt))
}

export async function obtenerBannersActivos() {
  let items = await db.select().from(banners)
    .where(eq(banners.activo, true))
    .orderBy(banners.orden)

  if (items.length < 24) {
    const { sincronizarNoticiasAuto } = await import("@/lib/services/news-sync-service")
    await sincronizarNoticiasAuto()
    items = await db.select().from(banners)
      .where(eq(banners.activo, true))
      .orderBy(banners.orden)
  }

  return items
}

export async function sincronizarNoticiasManual() {
  const { sincronizarNoticiasAuto } = await import("@/lib/services/news-sync-service")
  const result = await sincronizarNoticiasAuto()
  revalidatePath("/")
  revalidatePath("/comunicaciones")
  return result
}

// ── Accesos directos (modelo key/value en configuracion) ──
export async function obtenerAccesosDirectos() {
  const rows = await db.select({
    clave: configuracion.clave,
    valor: configuracion.valor,
    descripcion: configuracion.descripcion,
    updatedAt: configuracion.updatedAt,
  })
    .from(configuracion)
    .where(eq(configuracion.grupo, ACCESOS_DIRECTOS_GRUPO))
    .orderBy(desc(configuracion.updatedAt))

  return rows.map(parseAccesoDirectoValor)
}

export async function obtenerAccesosDirectosActivos() {
  const accesos = await obtenerAccesosDirectos()
  const activos = accesos.filter((a) => a.activo && a.url.trim().length > 0)
  if (activos.length > 0) return activos
  return ACCESOS_DIRECTOS_DEFAULT
}

export async function crearAccesoDirecto(data: AccesoDirectoData) {
  const clave = `acceso_directo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const payload = {
    titulo: data.titulo,
    descripcion: data.descripcion ?? "",
    url: data.url,
    categoria: data.categoria ?? "Links Operativos",
    activo: data.activo ?? true,
    imagen: data.imagen ?? "",
  }

  const [nuevo] = await db.insert(configuracion)
    .values({
      clave,
      grupo: ACCESOS_DIRECTOS_GRUPO,
      descripcion: data.descripcion ?? `Acceso directo: ${data.titulo}`,
      valor: JSON.stringify(payload),
    })
    .returning({
      clave: configuracion.clave,
      valor: configuracion.valor,
      descripcion: configuracion.descripcion,
      updatedAt: configuracion.updatedAt,
    })

  await registrarAuditLog({
    usuario: "sistema",
    accion: `Creó acceso directo: ${data.titulo}`,
    modulo: "Comunicaciones",
    resultado: "Exitoso",
  })
  revalidatePath("/comunicaciones")
  revalidatePath("/")
  return parseAccesoDirectoValor(nuevo)
}

export async function actualizarAccesoDirecto(
  clave: string,
  data: Partial<AccesoDirectoData>
) {
  const [actual] = await db.select({
    clave: configuracion.clave,
    valor: configuracion.valor,
    descripcion: configuracion.descripcion,
    updatedAt: configuracion.updatedAt,
  })
    .from(configuracion)
    .where(eq(configuracion.clave, clave))

  if (!actual) {
    throw new Error("Acceso directo no encontrado")
  }

  const actualParseado = parseAccesoDirectoValor(actual)
  const payload: AccesoDirectoData = {
    titulo: data.titulo ?? actualParseado.titulo,
    descripcion: data.descripcion ?? actualParseado.descripcion,
    url: data.url ?? actualParseado.url,
    categoria: data.categoria ?? actualParseado.categoria,
    activo: typeof data.activo === "boolean" ? data.activo : actualParseado.activo,
    imagen: data.imagen ?? actualParseado.imagen,
  }

  const [actualizado] = await db.update(configuracion)
    .set({
      valor: JSON.stringify(payload),
      descripcion: payload.descripcion ?? actual.descripcion,
      updatedAt: new Date(),
    })
    .where(eq(configuracion.clave, clave))
    .returning({
      clave: configuracion.clave,
      valor: configuracion.valor,
      descripcion: configuracion.descripcion,
      updatedAt: configuracion.updatedAt,
    })

  await registrarAuditLog({
    usuario: "sistema",
    accion: `Actualizó acceso directo: ${payload.titulo}`,
    modulo: "Comunicaciones",
    resultado: "Exitoso",
  })
  revalidatePath("/comunicaciones")
  revalidatePath("/")
  return parseAccesoDirectoValor(actualizado)
}

export async function eliminarAccesoDirecto(clave: string) {
  await db.delete(configuracion).where(eq(configuracion.clave, clave))
  await registrarAuditLog({
    usuario: "sistema",
    accion: `Eliminó acceso directo: ${clave}`,
    modulo: "Comunicaciones",
    resultado: "Exitoso",
  })
  revalidatePath("/comunicaciones")
  revalidatePath("/")
}
