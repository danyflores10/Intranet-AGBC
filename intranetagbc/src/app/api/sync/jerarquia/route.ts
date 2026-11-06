import { NextResponse } from "next/server"
import { sincronizarJerarquiaCategorias } from "@/lib/services/jerarquia-sync-service"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const resultado = await sincronizarJerarquiaCategorias(true)
    return NextResponse.json({
      success: true,
      message: "118 Categorías Jerárquicas oficiales (4 Direcciones, 12 Subcategorías, 102 Tipos) sincronizadas con éxito.",
      resultado,
    })
  } catch (error: any) {
    console.error("Error en /api/sync/jerarquia:", error)
    return NextResponse.json(
      { success: false, error: error?.message || "Error al sincronizar jerarquía" },
      { status: 500 }
    )
  }
}

export async function POST() {
  return GET()
}

