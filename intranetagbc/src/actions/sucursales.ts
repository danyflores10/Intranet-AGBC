"use server"

import { db } from "@/db"
import { sucursales } from "@/db/schema"
import { eq } from "drizzle-orm"

/* ── Obtener todas las sucursales ── */
export async function obtenerSucursales() {
  return db.select().from(sucursales).orderBy(sucursales.departamento)
}

/* ── Obtener solo las activas ── */
export async function obtenerSucursalesActivas() {
  return db.select().from(sucursales).where(eq(sucursales.activo, true)).orderBy(sucursales.departamento)
}

/* ── Obtener una por ID ── */
export async function obtenerSucursal(id: string) {
  const rows = await db.select().from(sucursales).where(eq(sucursales.id, id)).limit(1)
  return rows[0] ?? null
}

/* ── Crear ── */
export async function crearSucursal(data: {
  departamento: string
  capital: string
  nombre: string
  direccion: string
  telefono?: string
  horario?: string
  foto?: string
  googleMaps?: string
  color?: string
  svgId?: string
  pinX?: string
  pinY?: string
}) {
  const [row] = await db
    .insert(sucursales)
    .values({
      departamento: data.departamento,
      capital: data.capital,
      nombre: data.nombre,
      direccion: data.direccion,
      telefono: data.telefono ?? null,
      horario: data.horario ?? null,
      foto: data.foto ?? null,
      googleMaps: data.googleMaps ?? null,
      color: data.color ?? "#FFB300",
      svgId: data.svgId ?? null,
      pinX: data.pinX ?? null,
      pinY: data.pinY ?? null,
    })
    .returning()
  return row
}

/* ── Actualizar ── */
export async function actualizarSucursal(
  id: string,
  data: {
    departamento?: string
    capital?: string
    nombre?: string
    direccion?: string
    telefono?: string | null
    horario?: string | null
    foto?: string | null
    googleMaps?: string | null
    color?: string
    svgId?: string | null
    pinX?: string | null
    pinY?: string | null
    activo?: boolean
  },
) {
  const [row] = await db.update(sucursales).set(data).where(eq(sucursales.id, id)).returning()
  return row
}

/* ── Eliminar ── */
export async function eliminarSucursal(id: string) {
  await db.delete(sucursales).where(eq(sucursales.id, id))
}
