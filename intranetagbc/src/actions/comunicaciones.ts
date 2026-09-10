"use server"

import { db } from "@/db"
import { comunicados, banners, configuracion } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { registrarAuditLog } from "@/actions/auditoria"

import {
  type AccesoDirectoData,
  type AccesoDirectoRow,
  ACCESOS_DIRECTOS_GRUPO,
  ACCESOS_DIRECTOS_DEFAULT,
} from "@/lib/constants/accesos"

export type { AccesoDirectoData, AccesoDirectoRow }

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
