import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/db"
import { onboardingProgreso, onboardingConfig } from "@/db/schema"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) {
      return NextResponse.json({ completado: false, usuarioId: null })
    }

    const [progreso] = await db
      .select()
      .from(onboardingProgreso)
      .where(eq(onboardingProgreso.usuarioId, session.user.id))
      .limit(1)

    const completado = progreso?.estado === "completado" || progreso?.estado === "omitido"

    return NextResponse.json({
      completado,
      usuarioId: session.user.id,
      estado: progreso?.estado || "pendiente",
    })
  } catch (err: any) {
    return NextResponse.json({ error: "Error al consultar onboarding" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    const [existente] = await db
      .select()
      .from(onboardingProgreso)
      .where(eq(onboardingProgreso.usuarioId, session.user.id))
      .limit(1)

    if (action === "completar") {
      const ahora = new Date()
      if (existente) {
        await db
          .update(onboardingProgreso)
          .set({ estado: "completado", completadoEn: ahora })
          .where(eq(onboardingProgreso.usuarioId, session.user.id))
      } else {
        await db.insert(onboardingProgreso).values({
          usuarioId: session.user.id,
          estado: "completado",
          version: "2.1",
          completadoEn: ahora,
        })
      }
      return NextResponse.json({ success: true })
    }

    if (action === "reiniciar") {
      if (existente) {
        await db
          .update(onboardingProgreso)
          .set({ estado: "pendiente", completadoEn: null })
          .where(eq(onboardingProgreso.usuarioId, session.user.id))
      }
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: "Error al actualizar onboarding" }, { status: 500 })
  }
}
