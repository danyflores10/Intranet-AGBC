import "dotenv/config"
import { db } from "../db"
import { documentos, documentoCategorias } from "../db/schema"
import { eq, sql } from "drizzle-orm"
import { createId } from "@paralleldrive/cuid2"

export interface DireccionDef {
  codigo: string
  nombre: string
  descripcion: string
  orden: number
  subcategorias: {
    codigo: string
    nombre: string
    descripcion: string
    orden: number
  }[]
}

export const ESTRUCTURA_JERARQUICA: DireccionDef[] = [
  {
    codigo: "DGE",
    nombre: "Dirección General Ejecutiva",
    descripcion: "Máxima autoridad institucional y dirección estratégica de la AGBC",
    orden: 1,
    subcategorias: [
      {
        codigo: "DGE_PLAN",
        nombre: "Planificación",
        descripcion: "Planificación estratégica, POA, estructura y diseño organizacional",
        orden: 1,
      },
      {
        codigo: "DGE_LEGAL",
        nombre: "Legal",
        descripcion: "Asesoría jurídica, procesos normativos, sumarios y contrataciones",
        orden: 2,
      },
      {
        codigo: "DGE_AUDIT",
        nombre: "Auditoría",
        descripcion: "Control interno, auditoría gubernamental y evaluación de gestión",
        orden: 3,
      },
      {
        codigo: "DGE_TRANSP",
        nombre: "Transparencia",
        descripcion: "Lucha contra la corrupción, ética pública y acceso a la información",
        orden: 4,
      },
    ],
  },
  {
    codigo: "DAF",
    nombre: "Dirección Administrativa Financiera",
    descripcion: "Administración de recursos humanos, gestión presupuestaria, contable y activos",
    orden: 2,
    subcategorias: [
      {
        codigo: "DAF_RRHH",
        nombre: "Recursos Humanos",
        descripcion: "Administración de personal, bienestar social, inducción y reglamentos laborales",
        orden: 1,
      },
      {
        codigo: "DAF_CONTA",
        nombre: "Contabilidad Nacional e Internacional",
        descripcion: "Tesorería, recaudaciones, compras y activos fijos, presupuestos y fondo rotativo",
        orden: 2,
      },
    ],
  },
  {
    codigo: "DO",
    nombre: "Dirección de Operaciones",
    descripcion: "Gestión logística, red postal, casillas y aseguramiento de calidad operativa",
    orden: 3,
    subcategorias: [
      {
        codigo: "DO_CALIDAD",
        nombre: "Desarrollo de Calidad",
        descripcion: "Control y aseguramiento de calidad operativa postal, casillas y seguridad",
        orden: 1,
      },
    ],
  },
  {
    codigo: "DC",
    nombre: "Dirección Comercial",
    descripcion: "Estrategia comercial, marketing, atención al cliente y relaciones institucionales",
    orden: 4,
    subcategorias: [
      {
        codigo: "DC_IMC",
        nombre: "Relaciones I. M. C.",
        descripcion: "Relaciones Institucionales, Marketing y Comercial, atención de quejas y reclamos",
        orden: 1,
      },
    ],
  },
]

export const TIPOS_DOCUMENTALES = [
  "Circulares",
  "Formularios",
  "Instructivos",
  "Manuales",
  "Normativas",
  "Reglamentos",
] as const

// Función para determinar Dirección, Subcategoría y Tipo Documental para cada uno de los 89 documentos
export function clasificarDocumento(archivo: string, titulo: string): {
  direccionNombre: string
  subcategoriaNombre: string
  tipoDocumental: string
} {
  const norm = `${archivo} ${titulo}`.toLowerCase()

  // 1. Tipo Documental
  let tipoDocumental = "Normativas"
  if (/reglamento/i.test(norm)) {
    tipoDocumental = "Reglamentos"
  } else if (/instructivo/i.test(norm)) {
    tipoDocumental = "Instructivos"
  } else if (/manual|procedimiento|guia/i.test(norm)) {
    tipoDocumental = "Manuales"
  } else if (/formulario|ficha|kardex|acta|recibo|matriz|notificacion|reporte/i.test(norm)) {
    tipoDocumental = "Formularios"
  } else if (/circular/i.test(norm)) {
    tipoDocumental = "Circulares"
  } else if (/politica|codigo|organigrama|catalogo|chapas/i.test(norm)) {
    tipoDocumental = "Normativas"
  }

  // 2. Dirección y Subcategoría
  // Transparencia (DGE)
  if (/transparencia|denuncia|etica|declaracion.*jurada/i.test(norm)) {
    return {
      direccionNombre: "Dirección General Ejecutiva",
      subcategoriaNombre: "Transparencia",
      tipoDocumental,
    }
  }

  // Auditoría (DGE)
  if (/auditoria/i.test(norm)) {
    return {
      direccionNombre: "Dirección General Ejecutiva",
      subcategoriaNombre: "Auditoría",
      tipoDocumental,
    }
  }

  // Legal (DGE)
  if (/legal|sumario|resoluciones.*admini|gescon/i.test(norm)) {
    return {
      direccionNombre: "Dirección General Ejecutiva",
      subcategoriaNombre: "Legal",
      tipoDocumental: /instructivo/i.test(norm) ? "Instructivos" : tipoDocumental,
    }
  }

  // Recursos Humanos (DAF)
  if (
    /personal|pasantia|refrigerio|ropa.*trabajo|fondo.*social|pasajes.*viaticos|administracion.*de.*perso/i.test(
      norm
    )
  ) {
    return {
      direccionNombre: "Dirección Administrativa Financiera",
      subcategoriaNombre: "Recursos Humanos",
      tipoDocumental,
    }
  }

  // Comercial / Relaciones IMC (DC)
  if (
    /queja|reclama|sireco|sigec|comercial|cn.*08|correspondencia|comite.*de.*reclamaciones/i.test(
      norm
    )
  ) {
    return {
      direccionNombre: "Dirección Comercial",
      subcategoriaNombre: "Relaciones I. M. C.",
      tipoDocumental,
    }
  }

  // Operaciones / Desarrollo de Calidad (DO)
  if (
    /casilla|senca|calidad|paqueteria|sellos.*postales|felcn|aduanero|rezagos|articulos.*peligrosos|chapas|llaves.*blancas|incautacion.*envio/i.test(
      norm
    )
  ) {
    return {
      direccionNombre: "Dirección de Operaciones",
      subcategoriaNombre: "Desarrollo de Calidad",
      tipoDocumental,
    }
  }

  // Planificación (DGE)
  if (
    /planificacion|diagnostico|rediseno|organigrama|proceso.*organi|poa|programacion.*operaci|organizacion.*administra|aprobacion.*de.*manuales/i.test(
      norm
    )
  ) {
    return {
      direccionNombre: "Dirección General Ejecutiva",
      subcategoriaNombre: "Planificación",
      tipoDocumental,
    }
  }

  // Contabilidad y Finanzas (DAF) - por defecto para formularios de caja, fondos, vehicular, pagos, etc.
  if (
    /fondo.*rotativo|recaudacion|tributaria|vehicul|telefonia|orden.*de.*pago|cobranza|contratacion.*excepcion|contabilidad|presupuesto|tesoreria|cargos.*de.*cuenta|bienes.*y.*servicios|sabs|administrativa.*financiera/i.test(
      norm
    )
  ) {
    return {
      direccionNombre: "Dirección Administrativa Financiera",
      subcategoriaNombre: "Contabilidad Nacional e Internacional",
      tipoDocumental,
    }
  }

  // Fallback si algo no coincidió específicamente
  if (/seguridad.*informacion/i.test(norm)) {
    return {
      direccionNombre: "Dirección General Ejecutiva",
      subcategoriaNombre: "Planificación",
      tipoDocumental,
    }
  }

  return {
    direccionNombre: "Dirección Administrativa Financiera",
    subcategoriaNombre: "Contabilidad Nacional e Internacional",
    tipoDocumental,
  }
}

async function sincronizarCategoriasYDocumentos() {
  console.log("=== POBLANDO ESTRUCTURA JERÁRQUICA DE CATEGORÍAS ===")

  // 1. Crear / Asegurar Direcciones (Nivel 1)
  const dirMap: Record<string, string> = {}
  for (const dir of ESTRUCTURA_JERARQUICA) {
    let [found] = await db
      .select()
      .from(documentoCategorias)
      .where(sql`LOWER(${documentoCategorias.nombre}) = LOWER(${dir.nombre})`)
      .limit(1)

    if (!found) {
      ;[found] = await db
        .insert(documentoCategorias)
        .values({
          id: createId(),
          nombre: dir.nombre,
          descripcion: dir.descripcion,
          parentId: null,
          nivel: 1,
          orden: dir.orden,
        })
        .returning()
    } else {
      await db
        .update(documentoCategorias)
        .set({
          descripcion: dir.descripcion,
          parentId: null,
          nivel: 1,
          orden: dir.orden,
        })
        .where(eq(documentoCategorias.id, found.id))
    }
    dirMap[dir.nombre] = found.id
  }

  // 2. Crear / Asegurar Subcategorías (Nivel 2)
  const subMap: Record<string, string> = {}
  for (const dir of ESTRUCTURA_JERARQUICA) {
    const parentId = dirMap[dir.nombre]
    for (const sub of dir.subcategorias) {
      let [found] = await db
        .select()
        .from(documentoCategorias)
        .where(
          sql`LOWER(${documentoCategorias.nombre}) = LOWER(${sub.nombre}) AND ${documentoCategorias.parentId} = ${parentId}`
        )
        .limit(1)

      if (!found) {
        ;[found] = await db
          .insert(documentoCategorias)
          .values({
            id: createId(),
            nombre: sub.nombre,
            descripcion: sub.descripcion,
            parentId,
            nivel: 2,
            orden: sub.orden,
          })
          .returning()
      } else {
        await db
          .update(documentoCategorias)
          .set({
            descripcion: sub.descripcion,
            nivel: 2,
            orden: sub.orden,
          })
          .where(eq(documentoCategorias.id, found.id))
      }
      subMap[`${dir.nombre}::${sub.nombre}`] = found.id
    }
  }

  // 3. Crear / Asegurar Tipos Documentales (Nivel 3) dentro de cada Subcategoría
  const tipoMap: Record<string, string> = {}
  for (const dir of ESTRUCTURA_JERARQUICA) {
    for (const sub of dir.subcategorias) {
      const parentSubId = subMap[`${dir.nombre}::${sub.nombre}`]
      for (let i = 0; i < TIPOS_DOCUMENTALES.length; i++) {
        const tipo = TIPOS_DOCUMENTALES[i]
        let [found] = await db
          .select()
          .from(documentoCategorias)
          .where(
            sql`LOWER(${documentoCategorias.nombre}) = LOWER(${tipo}) AND ${documentoCategorias.parentId} = ${parentSubId}`
          )
          .limit(1)

        if (!found) {
          ;[found] = await db
            .insert(documentoCategorias)
            .values({
              id: createId(),
              nombre: tipo,
              descripcion: `${tipo} del área de ${sub.nombre} (${dir.nombre})`,
              parentId: parentSubId,
              nivel: 3,
              orden: i + 1,
            })
            .returning()
        }
        tipoMap[`${dir.nombre}::${sub.nombre}::${tipo}`] = found.id
      }
    }
  }

  console.log("Categorías jerárquicas creadas:")
  console.log(`- Direcciones (Nivel 1): ${Object.keys(dirMap).length}`)
  console.log(`- Subcategorías (Nivel 2): ${Object.keys(subMap).length}`)
  console.log(`- Tipos Documentales (Nivel 3): ${Object.keys(tipoMap).length}`)

  // 4. Actualizar todos los documentos en base de datos con su direccionId, subcategoriaId, tipoDocumental y categoriaId
  console.log("\n=== CLASIFICANDO Y ACTUALIZANDO DOCUMENTOS ===")
  const allDocs = await db.select().from(documentos)
  let updatedCount = 0

  for (const doc of allDocs) {
    const classification = clasificarDocumento(doc.archivo || "", doc.titulo)
    const dirId = dirMap[classification.direccionNombre]
    const subId = subMap[`${classification.direccionNombre}::${classification.subcategoriaNombre}`]
    const catLeafId = tipoMap[`${classification.direccionNombre}::${classification.subcategoriaNombre}::${classification.tipoDocumental}`]

    await db
      .update(documentos)
      .set({
        direccionId: dirId,
        subcategoriaId: subId,
        tipoDocumental: classification.tipoDocumental,
        categoriaId: catLeafId || doc.categoriaId,
      })
      .where(eq(documentos.id, doc.id))

    updatedCount++
  }

  console.log(`¡${updatedCount} documentos actualizados con jerarquía completa!`)

  // 5. Limpiar categorías obsoletas sin documentos ni hijos si quedaran
  const oldFlatCats = await db.select().from(documentoCategorias).where(sql`${documentoCategorias.parentId} IS NULL AND ${documentoCategorias.nivel} IS NULL`)
  for (const oldCat of oldFlatCats) {
    const docsUsing = await db.select().from(documentos).where(eq(documentos.categoriaId, oldCat.id))
    if (docsUsing.length === 0) {
      await db.delete(documentoCategorias).where(eq(documentoCategorias.id, oldCat.id))
      console.log(`Eliminada categoría plana antigua sin uso: ${oldCat.nombre}`)
    }
  }

  console.log("\n¡Sincronización terminada exitosamente!")
  process.exit(0)
}

if (process.argv[1]?.includes("sincronizar-jerarquia")) {
  sincronizarCategoriasYDocumentos().catch((err) => {
    console.error("Error al sincronizar jerarquía:", err)
    process.exit(1)
  })
}
