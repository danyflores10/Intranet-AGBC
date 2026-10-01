import "dotenv/config"
import { db } from "../db"
import { comunicados, documentos } from "../db/schema"
import { eq, desc } from "drizzle-orm"

async function main() {
  console.log("=== ACTUALIZANDO COMUNICADOS OFICIALES CON DOCUMENTOS REALES ===")

  // Obtener documentos de referencia (como el Reglamento Interno o Instructivo)
  const docs = await db.select().from(documentos)
  const docReglamento = docs.find((d) => d.titulo.toLowerCase().includes("reglamento interno de personal"))
  const docInstructivo = docs.find((d) => d.titulo.toLowerCase().includes("resoluciones administrativas") || d.titulo.toLowerCase().includes("instructivo"))

  // Limpiar comunicados de prueba
  await db.delete(comunicados)

  // Crear Comunicado Oficial 1: Reglamento Interno de Personal (el mismo del primer ingreso)
  await db.insert(comunicados).values({
    titulo: docReglamento ? docReglamento.titulo : "Reglamento Interno de Personal - AGBC",
    contenido: "La Dirección General Ejecutiva de la Agencia Boliviana de Correos recuerda a todo el personal institucional la vigencia y estricto cumplimiento del Reglamento Interno de Personal. Este documento establece los deberes, derechos, régimen disciplinario y normativo aplicable a todos los servidores públicos de la entidad.",
    tipo: "comunicado",
    estado: "publicado",
    fechaPublicacion: new Date().toISOString().split("T")[0],
    destacado: true,
    archivoUrl: docReglamento?.archivo || "/documentos/doc_026_reglamento_interno_de_personal.pdf",
    archivoNombre: docReglamento?.nombreArchivo || "doc_026_reglamento_interno_de_personal.pdf",
    archivoTipo: "pdf",
  })

  // Crear Comunicado Oficial 2: Instructivo Operativo de Resoluciones
  if (docInstructivo) {
    await db.insert(comunicados).values({
      titulo: docInstructivo.titulo,
      contenido: "Se comunica a todas las direcciones y unidades desconcentradas el procedimiento obligatorio para la elaboración, revisión y emisión de Resoluciones Administrativas institucionales.",
      tipo: "comunicado",
      estado: "publicado",
      fechaPublicacion: new Date().toISOString().split("T")[0],
      destacado: false,
      archivoUrl: docInstructivo.archivo || "/documentos/doc_037_instructivo_operativo_para_la_emision_de_resoluciones_admini.pdf",
      archivoNombre: docInstructivo.nombreArchivo || "doc_037_instructivo_operativo_para_la_emision_de_resoluciones_admini.pdf",
      archivoTipo: "pdf",
    })
  }

  console.log("[+] Comunicados oficiales actualizados con PDFs reales.")
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
