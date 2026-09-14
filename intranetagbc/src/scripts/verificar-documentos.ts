import "dotenv/config"
import { db } from "../db"
import { documentos, documentoCategorias } from "../db/schema"
import { eq } from "drizzle-orm"
import fs from "fs"
import path from "path"

async function verify() {
  const allDocs = await db.select().from(documentos)
  const allCats = await db.select().from(documentoCategorias)
  
  const catMap = Object.fromEntries(allCats.map((c) => [c.id, c.nombre]))

  console.log(`Total documentos en base de datos: ${allDocs.length}`)
  
  const byCat: Record<string, number> = {}
  const byExt: Record<string, number> = {}
  let missingFiles = 0

  for (const doc of allDocs) {
    const catName = (doc.categoriaId && catMap[doc.categoriaId]) || "Desconocida"
    byCat[catName] = (byCat[catName] || 0) + 1
    const extKey = doc.tipoArchivo || "desconocido"
    byExt[extKey] = (byExt[extKey] || 0) + 1

    if (doc.archivo) {
      const rel = doc.archivo.replace(/^\//, "")
      const fullPath = path.join(process.cwd(), "public", rel)
      if (!fs.existsSync(fullPath)) {
        console.log(`FALTA ARCHIVO: ${doc.id} | ${doc.titulo} | ${doc.archivo}`)
        missingFiles++
      }
    }
  }

  // Eliminar los 7 registros antiguos duplicados asociados a la categoría no estándar "REGLAMENTOS MANUALES"
  const catOld = allCats.find((c) => c.nombre.includes("REGLAMENTOS") && c.nombre.includes("MANUALES"))
  if (catOld) {
    const docsToDelete = allDocs.filter((d) => d.categoriaId === catOld.id)
    for (const d of docsToDelete) {
      if (d.archivo) {
        const rel = d.archivo.replace(/^\//, "")
        const fullPath = path.join(process.cwd(), "public", rel)
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath)
        }
      }
      await db.delete(documentos).where(eq(documentos.id, d.id))
      console.log(`Eliminado registro duplicado anterior: [${d.id}] ${d.titulo}`)
    }
    await db.delete(documentoCategorias).where(eq(documentoCategorias.id, catOld.id))
    console.log(`Eliminada categoría no estándar: ${catOld.nombre}`)
  }

  // Comprobar estado final
  const finalDocs = await db.select().from(documentos)
  const finalCats = await db.select().from(documentoCategorias)
  const finalCatMap = Object.fromEntries(finalCats.map((c) => [c.id, c.nombre]))

  const byCatFinal: Record<string, number> = {}
  for (const doc of finalDocs) {
    const cName = (doc.categoriaId && finalCatMap[doc.categoriaId]) || "Desconocida"
    byCatFinal[cName] = (byCatFinal[cName] || 0) + 1
  }

  console.log("\n==========================================")
  console.log("=== ESTADO FINAL TRAS LIMPIEZA ===")
  console.log("==========================================")
  console.log(`Total documentos en BD: ${finalDocs.length}`)
  console.log("Desglose por categorías:", byCatFinal)
  console.log("Categorías disponibles:", finalCats.map((c) => c.nombre))

  process.exit(0)
}

verify().catch((e) => {
  console.error(e)
  process.exit(1)
})
