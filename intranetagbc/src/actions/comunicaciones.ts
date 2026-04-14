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
    titulo: "Sistema de Gestión SIGEC",
    descripcion: "Enlace institucional SIGEC",
    url: "https://sigec.correos.gob.bo/login?url=",
    activo: true,
    imagen: "",
    updatedAt: new Date("2026-04-12T00:00:00.000Z"),
  },
  {
    clave: "default_portal",
    titulo: "Portal Correos de Bolivia",
    descripcion: "Sitio web institucional",
    url: "https://correos.gob.bo/",
    activo: true,
    imagen: "",
    updatedAt: new Date("2026-04-12T00:00:00.000Z"),
  },
  {
    clave: "default_agencia",
    titulo: "Agencia Boliviana de Correos",
    descripcion: "Portal de la agencia",
    url: "https://correos.gob.bo/",
    activo: true,
    imagen: "",
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
