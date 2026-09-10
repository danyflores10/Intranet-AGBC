import { db } from "@/db"
import { banners } from "@/db/schema"
import { eq, sql } from "drizzle-orm"

export interface NoticiaScrapeada {
  id: string
  titulo: string
  descripcion: string
  imagen: string
  enlace: string
  fuente: string
  fecha: string
  palabrasClave: string[]
}

export const KEYWORDS_LA_RAZON = [
  "agbc",
  "correos de bolivia",
  "agencia boliviana de correos",
  "agencia de correos",
  "correos",
]

// Noticia oficial de prueba verificada en La Razón
export const NOTICIA_LA_RAZON_TEST: NoticiaScrapeada = {
  id: "noticia_larazon_1",
  titulo: "Correos detecta sustancias controladas en un paquete hacia Asia",
  descripcion:
    "Personal de la Fuerza Especial de Lucha Contra el Narcotráfico (FELCN) y de la Agencia Boliviana de Correos (AGBC) detectaron en la oficina central una encomienda que contenía sustancias controladas camufladas con destino al continente asiático tras las pruebas de campo correspondientes.",
  imagen: "/image/noticias/noticia_larazon_droga_asia.jpg",
  enlace: "https://larazon.bo/ciudades/2026/07/13/correos-detecta-sustancias-conroladas-en-un-paquete-hacia-asia/",
  fuente: "La Razón (larazon.bo)",
  fecha: "2026-07-13T10:00:00Z",
  palabrasClave: ["agbc", "correos de bolivia", "agencia boliviana de correos", "correos"],
}

/**
 * Servicio de búsqueda y extracción de noticias desde La Razón
 */
export async function scrapeNoticiasLaRazon(searchQuery?: string): Promise<NoticiaScrapeada[]> {
  const query = searchQuery || KEYWORDS_LA_RAZON.join(" OR ")
  console.log(`[Scraper La Razón] Iniciando búsqueda con palabras clave: "${query}"...`)

  const resultados: NoticiaScrapeada[] = [NOTICIA_LA_RAZON_TEST]

  try {
    const rssUrl = `https://news.google.com/rss/search?q=site:larazon.bo+(${encodeURIComponent(
      query
    )})&hl=es-419&gl=BO&ceid=BO:es-419`

    const res = await fetch(rssUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    })

    if (res.ok) {
      const xml = await res.text()
      const itemRegex = /<item>([\s\S]*?)<\/item>/gi
      let match
      let count = 0

      while ((match = itemRegex.exec(xml)) !== null && count < 5) {
        const itemXml = match[1]
        const title = itemXml.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.replace(" - La Razón", "").trim()
        const link = itemXml.match(/<link>([\s\S]*?)<\/link>/i)?.[1]?.trim()
        const pubDate = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim()
        const rawDesc = itemXml.match(/<description>([\s\S]*?)<\/description>/i)?.[1] || ""
        const cleanDesc = rawDesc.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim()

        if (title && (title.toLowerCase().includes("correo") || title.toLowerCase().includes("agbc"))) {
          count++
          resultados.push({
            id: `noticia_larazon_rss_${count}`,
            titulo: title,
            descripcion: cleanDesc || "Reporte informativo de La Razón sobre servicios y operaciones de Correos de Bolivia.",
            imagen: "/image/noticias/noticia_larazon_droga_asia.jpg",
            enlace: link || "https://larazon.bo",
            fuente: "La Razón (larazon.bo)",
            fecha: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
            palabrasClave: KEYWORDS_LA_RAZON.filter((k) => title.toLowerCase().includes(k)),
          })
        }
      }
    }
  } catch (err) {
    console.warn("[Scraper La Razón] Búsqueda externa complementaria omitida, usando noticia principal:", err)
  }

  return resultados
}

/**
 * Sincroniza y reemplaza las noticias institucionales en la base de datos dejando solo la noticia de prueba
 */
export async function sincronizarNoticiasLaRazonEnDb() {
  console.log("-> Sincronizando noticia de La Razón en la base de datos...")

  // 1. Limpiar noticias institucionales anteriores (manteniendo solo Facebook o eliminando según pedido)
  // Las noticias institucionales no tienen prefijo 'noticia_fb_' en el ID
  await db.execute(
    sql`DELETE FROM banners WHERE id NOT LIKE 'noticia_fb_%' AND enlace NOT LIKE '%facebook.com%'`
  )

  // 2. Insertar la noticia de prueba de La Razón
  const noticia = NOTICIA_LA_RAZON_TEST
  const fechaPub = new Date(noticia.fecha)

  await db
    .insert(banners)
    .values({
      id: noticia.id,
      titulo: noticia.titulo,
      descripcion: noticia.descripcion,
      imagen: noticia.imagen,
      imagenes: JSON.stringify([noticia.imagen]),
      enlace: noticia.enlace,
      activo: true,
      orden: "1",
      createdAt: fechaPub,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: banners.id,
      set: {
        titulo: noticia.titulo,
        descripcion: noticia.descripcion,
        imagen: noticia.imagen,
        imagenes: JSON.stringify([noticia.imagen]),
        enlace: noticia.enlace,
        activo: true,
        updatedAt: new Date(),
      },
    })

  console.log(`✅ Noticia institucional de La Razón guardada con éxito: "${noticia.titulo}"`)
  return {
    success: true,
    total: 1,
    noticias: [noticia],
  }
}
