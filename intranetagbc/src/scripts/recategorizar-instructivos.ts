import "dotenv/config"
import { db } from "../db"
import { documentos, documentoCategorias } from "../db/schema"
import { eq, ilike, sql, or } from "drizzle-orm"

async function main() {
  console.log("=== INICIANDO RECATEGORIZACIÓN DE DOCUMENTOS & INSTRUCTIVOS ===")

  // 1. Asegurar categorías oficiales
  const CATEGORIAS_OFICIALES = [
    { nombre: "Instructivos", descripcion: "Instructivos operativos, de inducción y directrices oficiales de la AGBC" },
    { nombre: "Reglamentos", descripcion: "Reglamentos internos y normativas operativas de personal" },
    { nombre: "Manuales", descripcion: "Manuales de procedimientos, organizacionales y de sistemas" },
    { nombre: "Formularios", descripcion: "Formularios oficiales, fichas técnicas y reportes" },
    { nombre: "Normativas", descripcion: "Políticas institucionales, código de ética y resoluciones" },
    { nombre: "Circulares", descripcion: "Circulares informativas y avisos institucionales" },
  ]

  const catIdMap: Record<string, string> = {}

  for (const cat of CATEGORIAS_OFICIALES) {
    let [found] = await db
      .select()
      .from(documentoCategorias)
      .where(sql`LOWER(${documentoCategorias.nombre}) = LOWER(${cat.nombre})`)
      .limit(1)

    if (!found) {
      const [creada] = await db
        .insert(documentoCategorias)
        .values({
          nombre: cat.nombre,
          descripcion: cat.descripcion,
        })
        .returning()
      catIdMap[cat.nombre.toLowerCase()] = creada.id
      console.log(`[+] Categoría creada: ${cat.nombre}`)
    } else {
      catIdMap[cat.nombre.toLowerCase()] = found.id
      console.log(`[*] Categoría existente: ${found.nombre} (ID: ${found.id})`)
    }
  }

  // 2. Buscar documentos que corresponden a Instructivos
  const docs = await db.select().from(documentos)
  console.log(`Total documentos en BD: ${docs.length}`)

  let instructivosCount = 0
  for (const doc of docs) {
    const textToAnalyze = `${doc.titulo} ${doc.nombreArchivo || ""} ${doc.archivo || ""}`.toLowerCase()

    if (
      textToAnalyze.includes("instructivo") ||
      textToAnalyze.includes("instructivos") ||
      textToAnalyze.includes("instruccion") ||
      /\b(io|io_\d+|io\-\d+)\b/i.test(textToAnalyze)
    ) {
      if (catIdMap["instructivos"]) {
        await db
          .update(documentos)
          .set({ categoriaId: catIdMap["instructivos"] })
          .where(eq(documentos.id, doc.id))
        console.log(`  -> Reclasificado como Instructivo: "${doc.titulo}"`)
        instructivosCount++
      }
    }
  }

  console.log(`=== RECATEGORIZACIÓN COMPLETADA: ${instructivosCount} instructivos actualizados ===`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
