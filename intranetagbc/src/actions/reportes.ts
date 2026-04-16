"use server"

import { db } from "@/db"
import { documentos, correspondencia, tramites, personal, comunicados } from "@/db/schema"
import { users } from "@/db/schema"
import { count } from "drizzle-orm"

export async function obtenerConteos() {
  const [[d], [c], [t], [p], [com], [u]] = await Promise.all([
    db.select({ count: count() }).from(documentos),
    db.select({ count: count() }).from(correspondencia),
    db.select({ count: count() }).from(tramites),
    db.select({ count: count() }).from(personal),
    db.select({ count: count() }).from(comunicados),
    db.select({ count: count() }).from(users),
  ])
  return {
    documentos: d.count,
    correspondencia: c.count,
    tramites: t.count,
    personal: p.count,
    comunicados: com.count,
    usuarios: u.count,
  }
}
