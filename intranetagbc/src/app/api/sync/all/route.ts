import { NextResponse } from "next/server"
import { sincronizarNoticiasAuto } from "@/lib/services/news-sync-service"
import { sincronizarTodoPersonalConUsuarios } from "@/lib/services/personal-user-sync"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const resNoticias = await sincronizarNoticiasAuto(true)
    const resPersonal = await sincronizarTodoPersonalConUsuarios()

    return NextResponse.json({
      success: true,
      message: "Sincronización total de base de datos (noticias + personal + usuarios) completada.",
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
