"use server"

import { db } from "@/db"
import { auditLogs } from "@/db/schema"
import { desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function obtenerAuditLogs() {
  return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt))
}

export async function registrarAuditLog(data: {
  usuario: string
  accion: string
  modulo: string
  ip?: string
  resultado?: string
  detalles?: string
}) {
  await db.insert(auditLogs).values(data)
}

export async function obtenerStatsAuditoria() {
  const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt))
  return {
    total: logs.length,
    exitosos: logs.filter(l => l.resultado === "Exitoso").length,
    fallidos: logs.filter(l => l.resultado === "Fallido").length,
    modulos: new Set(logs.map(l => l.modulo)).size,
    logs,
  }
}
