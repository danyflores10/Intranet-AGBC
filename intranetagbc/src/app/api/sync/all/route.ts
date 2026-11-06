import { NextResponse } from "next/server"
import { sincronizarNoticiasAuto } from "@/lib/services/news-sync-service"
import { sincronizarTodoPersonalConUsuarios } from "@/lib/services/personal-user-sync"
import { sincronizarJerarquiaCategorias } from "@/lib/services/jerarquia-sync-service"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const resJerarquia = await sincronizarJerarquiaCategorias(true)
    const resNoticias = await sincronizarNoticiasAuto(true)
    const resPersonal = await sincronizarTodoPersonalConUsuarios()

    return NextResponse.json({
      success: true,
      message: "Sincronización total de base de datos (jerarquía 118 + noticias + personal + usuarios) completada.",
      jerarquia: resJerarquia,
      noticias: resNoticias,
      personalUsuarios: resPersonal,
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Error en sincronización global" },
      { status: 500 }
    )
  }
}

export async function POST() {
  return GET()
}
