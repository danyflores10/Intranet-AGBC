"use server"

import { db } from "@/db"
import { comunicados, banners, configuracion } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { registrarAuditLog } from "@/actions/auditoria"

type AccesoDirectoData = {
  titulo: string
  descripcion?: string
  url: string
  activo?: boolean
  imagen?: string
}

type AccesoDirectoRow = {
  clave: string
  titulo: string
  descripcion: string
  url: string
  activo: boolean
  imagen: string
  updatedAt: Date
}

const ACCESOS_DIRECTOS_GRUPO = "accesos_directos"

const ACCESOS_DIRECTOS_DEFAULT: AccesoDirectoRow[] = [
  {
    clave: "default_sigec",
    titulo: "SIGEC - Correspondencia",
    descripcion: "Sistema oficial de gestión, seguimiento y archivo de correspondencia institucional.",
    url: "https://sigec.correos.gob.bo/login?url=",
    activo: true,
    imagen: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=800&auto=format&fit=crop",
    updatedAt: new Date("2026-04-12T00:00:00.000Z"),
  },
  {
    clave: "default_tracking",
    titulo: "TrackingBO - Rastreo Postal",
    descripcion: "Consulta y trazabilidad en tiempo real de encomiendas y paquetes postales.",
    url: "https://trackingbo.correos.gob.bo",
    activo: true,
    imagen: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop",
    updatedAt: new Date("2026-04-12T00:00:00.000Z"),
  },
  {
    clave: "default_portal",
    titulo: "Portal Web Correos Bolivia",
    descripcion: "Sitio web institucional con servicios, sucursales y tarifas oficiales.",
    url: "https://correos.gob.bo/",
    activo: true,
    imagen: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=800&auto=format&fit=crop",
    updatedAt: new Date("2026-04-12T00:00:00.000Z"),
  },
  {
    clave: "default_filatelia",
    titulo: "Filatelia Bolivia",
    descripcion: "Catálogo virtual de sellos postales, historia epistolar y colecciones de sellos.",
    url: "https://correos.gob.bo/filatelia",
    activo: true,
    imagen: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=800&auto=format&fit=crop",
    updatedAt: new Date("2026-04-12T00:00:00.000Z"),
  },
  {
    clave: "default_sigep",
    titulo: "SIGEP - Gestión Pública",
    descripcion: "Sistema Integrado de Gestión Pública del Ministerio de Economía y Finanzas.",
    url: "https://sigep.gob.bo",
    activo: true,
    imagen: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=800&auto=format&fit=crop",
    updatedAt: new Date("2026-04-12T00:00:00.000Z"),
  },
  {
    clave: "default_sicoes",
    titulo: "SICOES - Contrataciones",
    descripcion: "Sistema de Contrataciones Estatales para licitaciones y compras públicas.",
    url: "https://www.sicoes.gob.bo",
    activo: true,
    imagen: "https://images.unsplash.com/photo-1450133064473-71024230f91b?q=80&w=800&auto=format&fit=crop",
    updatedAt: new Date("2026-04-12T00:00:00.000Z"),
  },
  {
    clave: "default_aduana",
    titulo: "Aduana Nacional de Bolivia",
    descripcion: "Plataforma SIDUNEA para control aduanero y nacionalización de paquetería.",
    url: "https://www.aduana.gob.bo",
    activo: true,
    imagen: "https://images.unsplash.com/photo-1586528116493-a029325540fa?q=80&w=800&auto=format&fit=crop",
    updatedAt: new Date("2026-04-12T00:00:00.000Z"),
  },
  {
    clave: "default_upu",
    titulo: "Unión Postal Universal (UPU)",
    descripcion: "Red internacional de intercambio de datos postales y trazabilidad global.",
    url: "https://www.upu.int",
    activo: true,
    imagen: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop",
    updatedAt: new Date("2026-04-12T00:00:00.000Z"),
  },
  {
    clave: "default_att",
    titulo: "ATT - Regulación Postal",
    descripcion: "Autoridad de Regulación y Fiscalización de Telecomunicaciones y Transportes.",
    url: "https://www.att.gob.bo",
    activo: true,
    imagen: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=800&auto=format&fit=crop",
    updatedAt: new Date("2026-04-12T00:00:00.000Z"),
  },
  {
    clave: "default_siat",
    titulo: "SIAT en Línea - Impuestos",
    descripcion: "Servicio de Impuestos Nacionales para facturación electrónica y declaraciones.",
    url: "https://siat.impuestos.gob.bo",
    activo: true,
    imagen: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop",
    updatedAt: new Date("2026-04-12T00:00:00.000Z"),
  },
  {
    clave: "default_gaceta",
    titulo: "Gaceta Oficial de Bolivia",
    descripcion: "Publicación oficial de leyes, decretos supremos y resoluciones normativas.",
    url: "http://www.gacetaoficialdebolivia.gob.bo",
    activo: true,
    imagen: "https://images.unsplash.com/photo-1450133064473-71024230f91b?q=80&w=800&auto=format&fit=crop",
    updatedAt: new Date("2026-04-12T00:00:00.000Z"),
  },
  {
    clave: "default_mopp",
    titulo: "Ministerio de Obras Públicas",
    descripcion: "Órgano matriz para proyectos de infraestructura, comunicaciones y vivienda.",
    url: "https://www.oopp.gob.bo",
    activo: true,
    imagen: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop",
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
  return db.select().from(banners)
    .where(eq(banners.activo, true))
    .orderBy(banners.orden)
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
    activo: data.activo ?? actualParseado.activo,
    imagen: data.imagen ?? actualParseado.imagen,
  }

  const [actualizado] = await db.update(configuracion)
    .set({
      valor: JSON.stringify(payload),
      descripcion: payload.descripcion || `Acceso directo: ${payload.titulo}`,
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
