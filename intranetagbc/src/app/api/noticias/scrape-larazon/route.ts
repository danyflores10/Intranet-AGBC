import { NextRequest, NextResponse } from "next/server"
import {
  scrapeNoticiasLaRazon,
  sincronizarNoticiasLaRazonEnDb,
  KEYWORDS_LA_RAZON,
  NOTICIA_LA_RAZON_TEST,
} from "@/lib/services/scraper-larazon"

/**
 * GET /api/noticias/scrape-larazon
 * Permite consultar o previsualizar las noticias obtenidas de La Razón
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q") || KEYWORDS_LA_RAZON.join(" OR ")
    const syncDb = searchParams.get("sync") === "true"

    if (syncDb) {
      const syncResult = await sincronizarNoticiasLaRazonEnDb()
      return NextResponse.json({
        ok: true,
        message: "Noticia de La Razón sincronizada en la base de datos con éxito.",
        ...syncResult,
      })
    }

    const noticias = await scrapeNoticiasLaRazon(q)
    return NextResponse.json({
      ok: true,
      query: q,
      total: noticias.length,
      noticias,
    })
  } catch (error: any) {
    console.error("[API Scrape La Razón Error]:", error)
    return NextResponse.json(
      { ok: false, error: error.message || "Error al raspar noticias de La Razón" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/noticias/scrape-larazon
 * Ejecuta el scraping y guarda en la base de datos reemplazando las anteriores noticias institucionales
 */
export async function POST(req: NextRequest) {
  try {
    const syncResult = await sincronizarNoticiasLaRazonEnDb()
    return NextResponse.json({
      ok: true,
      message: "Scraping y sincronización completados. Solo la noticia de La Razón está activa.",
      data: syncResult,
    })
  } catch (error: any) {
    console.error("[API Scrape La Razón POST Error]:", error)
    return NextResponse.json(
      { ok: false, error: error.message || "Error al procesar la solicitud" },
      { status: 500 }
    )
  }
}
