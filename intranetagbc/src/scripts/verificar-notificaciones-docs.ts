import "dotenv/config"
import { db } from "../db"
import { notificaciones, documentos } from "../db/schema"
import { eq, inArray, or, ilike, sql } from "drizzle-orm"

async function main() {
  console.log("=== VERIFICANDO NOTIFICACIONES Y DOCUMENTOS ===")
  const todasNotifs = await db.select().from(notificaciones)
  console.log(`Total notificaciones en BD: ${todasNotifs.length}`)
  for (const n of todasNotifs) {
    console.log(`- [ID: ${n.id}] [User: ${n.usuarioId}] [Tipo: ${n.tipo}] [Titulo: ${n.titulo}] [Enlace: ${n.enlace}]`)
  }

  const todosDocs = await db.select().from(documentos)
  console.log(`\nTotal documentos activos en BD: ${todosDocs.length}`)
  for (const d of todosDocs) {
    console.log(`- [ID: ${d.id}] [Titulo: ${d.titulo}]`)
  }

  // Identificar notificaciones de documentos que ya no existen en `documentos`
  const notifsDeDoc = todasNotifs.filter(
    (n) =>
      n.titulo.toLowerCase().includes("nuevo documento") ||
      (n.enlace && n.enlace.includes("#documentos")) ||
      (n.mensaje && n.mensaje.toLowerCase().includes("documento"))
  )

  console.log(`\nNotificaciones relacionadas a documentos encontradas: ${notifsDeDoc.length}`)

  let huerfanasAEliminar: string[] = []
  for (const notif of notifsDeDoc) {
    // Verificar si algún documento activo coincide
    const coincide = todosDocs.some(
      (doc) =>
        (notif.enlace && notif.enlace.includes(doc.id)) ||
        notif.titulo.toLowerCase().includes(doc.titulo.toLowerCase()) ||
        doc.titulo.toLowerCase().includes(notif.titulo.replace("Nuevo Documento:", "").trim().toLowerCase())
    )

    if (!coincide) {
      console.log(`[HUÉRFANA DETECTADA] "${notif.titulo}" (ID: ${notif.id}) -> El documento ya no existe. Se marcará para eliminar.`)
      huerfanasAEliminar.push(notif.id)
    }
  }

  if (huerfanasAEliminar.length > 0) {
    await db.delete(notificaciones).where(inArray(notificaciones.id, huerfanasAEliminar))
    console.log(`\n[+] ${huerfanasAEliminar.length} notificaciones huérfanas eliminadas exitosamente.`)
  } else {
    console.log("\n[OK] No se encontraron notificaciones huérfanas desactualizadas.")
  }

  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
