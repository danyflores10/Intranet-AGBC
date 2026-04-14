"use server"

import { db } from "@/db"
import { configuracion } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function obtenerConfiguracion() {
  return db.select().from(configuracion).orderBy(configuracion.grupo, configuracion.clave)
}

export async function obtenerConfigPorGrupo(grupo: string) {
  return db.select().from(configuracion).where(eq(configuracion.grupo, grupo))
}

export async function obtenerConfigPorClave(clave: string) {
  const [config] = await db.select().from(configuracion).where(eq(configuracion.clave, clave))
  return config
}

export async function guardarConfiguracion(clave: string, valor: string, grupo: string = "general", descripcion?: string) {
  const existente = await obtenerConfigPorClave(clave)
  if (existente) {
    const [actualizado] = await db.update(configuracion)
      .set({ valor, grupo, descripcion })
      .where(eq(configuracion.id, existente.id))
      .returning()
    revalidatePath("/configuracion")
    return actualizado
  }
  const [nuevo] = await db.insert(configuracion)
    .values({ clave, valor, grupo, descripcion })
    .returning()
  revalidatePath("/configuracion")
  return nuevo
}

export async function guardarMultipleConfiguracion(configs: { clave: string; valor: string; grupo?: string; descripcion?: string }[]) {
  for (const c of configs) {
    await guardarConfiguracion(c.clave, c.valor, c.grupo ?? "general", c.descripcion)
  }
  revalidatePath("/configuracion")
}
