import { NextRequest, NextResponse } from "next/server"
import { sincronizarCatalogoExcelAction } from "@/actions/catalogo-import"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, nombreArchivoOrigen, sinCambiosCount, faltanArchivoCount } = body

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: "Lista de items inválida" }, { status: 400 })
    }

    const resultado = await sincronizarCatalogoExcelAction(
      items,
      nombreArchivoOrigen || "catalogo_documentos.xlsx",
      sinCambiosCount || 0,
      faltanArchivoCount || 0
    )

    return NextResponse.json(resultado)
  } catch (err: any) {
    console.error("Error en /api/documentos/sincronizar-catalogo:", err)
    return NextResponse.json(
      { error: err?.message || "Error al sincronizar catálogo" },
      { status: 500 }
    )
  }
}
