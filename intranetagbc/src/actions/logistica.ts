"use server"

import { db } from "@/db"
import { inventario, solicitudesMaterial, proveedores } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { registrarAuditLog } from "@/actions/auditoria"

// ── Inventario ──
export async function obtenerInventario() {
  return db.select().from(inventario).orderBy(inventario.codigo)
}

export async function crearItemInventario(data: {
  codigo: string
  item: string
  categoria: string
  stock?: number
  stockMinimo?: number
  unidad?: string
}) {
  const [nuevo] = await db.insert(inventario).values(data).returning()
  await registrarAuditLog({ usuario: "sistema", accion: `Creó item inventario: ${data.item}`, modulo: "Logística", resultado: "Exitoso" })
  revalidatePath("/logistica")
  return nuevo
}

export async function actualizarItemInventario(id: string, data: Partial<{
  item: string
  categoria: string
  stock: number
  stockMinimo: number
  unidad: string
  estado: string
}>) {
  const [actualizado] = await db.update(inventario).set(data).where(eq(inventario.id, id)).returning()
  await registrarAuditLog({ usuario: "sistema", accion: `Actualizó item inventario ID: ${id}`, modulo: "Logística", resultado: "Exitoso" })
  revalidatePath("/logistica")
  return actualizado
}

export async function eliminarItemInventario(id: string) {
  await db.delete(inventario).where(eq(inventario.id, id))
  await registrarAuditLog({ usuario: "sistema", accion: `Eliminó item inventario ID: ${id}`, modulo: "Logística", resultado: "Exitoso" })
  revalidatePath("/logistica")
}

// ── Solicitudes ──
export async function obtenerSolicitudes() {
  return db.select().from(solicitudesMaterial).orderBy(desc(solicitudesMaterial.createdAt))
}

export async function crearSolicitud(data: {
  numero: string
  solicitante: string
  items: string
  observaciones?: string
}) {
  const [nueva] = await db.insert(solicitudesMaterial).values(data).returning()
  await registrarAuditLog({ usuario: "sistema", accion: `Creó solicitud: ${data.numero}`, modulo: "Logística", resultado: "Exitoso" })
  revalidatePath("/logistica")
  return nueva
}

export async function actualizarSolicitud(id: string, data: Partial<{
  items: string
  estado: string
  observaciones: string
}>) {
  const [actualizada] = await db.update(solicitudesMaterial).set(data).where(eq(solicitudesMaterial.id, id)).returning()
  revalidatePath("/logistica")
  return actualizada
}

export async function eliminarSolicitud(id: string) {
  await db.delete(solicitudesMaterial).where(eq(solicitudesMaterial.id, id))
  await registrarAuditLog({ usuario: "sistema", accion: `Eliminó solicitud ID: ${id}`, modulo: "Logística", resultado: "Exitoso" })
  revalidatePath("/logistica")
}

// ── Proveedores ──
export async function obtenerProveedores() {
  return db.select().from(proveedores).orderBy(proveedores.nombre)
}

export async function crearProveedor(data: {
  nombre: string
  rubro: string
  nit: string
  telefono?: string
  contacto?: string
  email?: string
}) {
  const [nuevo] = await db.insert(proveedores).values(data).returning()
  await registrarAuditLog({ usuario: "sistema", accion: `Creó proveedor: ${data.nombre}`, modulo: "Logística", resultado: "Exitoso" })
  revalidatePath("/logistica")
  return nuevo
}

export async function actualizarProveedor(id: string, data: Partial<{
  nombre: string
  rubro: string
  nit: string
  telefono: string
  contacto: string
  email: string
  estado: string
}>) {
  const [actualizado] = await db.update(proveedores).set(data).where(eq(proveedores.id, id)).returning()
  revalidatePath("/logistica")
  return actualizado
}

export async function eliminarProveedor(id: string) {
  await db.delete(proveedores).where(eq(proveedores.id, id))
  await registrarAuditLog({ usuario: "sistema", accion: `Eliminó proveedor ID: ${id}`, modulo: "Logística", resultado: "Exitoso" })
  revalidatePath("/logistica")
}
