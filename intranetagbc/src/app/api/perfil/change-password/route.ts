import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { eq } from "drizzle-orm"

import { auth } from "@/lib/auth"
import { db } from "@/db"
import { auditLogs, users } from "@/db/schema"

export async function POST(request: Request) {
  const hdrs = await headers()
  const sesion = await auth.api.getSession({ headers: hdrs })

  if (!sesion?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  let body: { currentPassword?: string; newPassword?: string; confirmPassword?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 })
  }

  const currentPassword = String(body.currentPassword ?? "")
  const newPassword = String(body.newPassword ?? "")
  const confirmPassword = String(body.confirmPassword ?? "")

  if (!currentPassword || !newPassword || !confirmPassword) {
    return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 })
  }

  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "La nueva contraseña debe tener al menos 8 caracteres" },
      { status: 400 },
    )
  }

  if (newPassword.length > 128) {
    return NextResponse.json(
      { error: "La contraseña no puede superar los 128 caracteres" },
      { status: 400 },
    )
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.json(
      { error: "La nueva contraseña y su confirmación no coinciden" },
      { status: 400 },
    )
  }

  if (newPassword === currentPassword) {
    return NextResponse.json(
      { error: "La nueva contraseña debe ser diferente a la actual" },
      { status: 400 },
    )
  }

  try {
    await auth.api.changePassword({
      headers: hdrs,
      body: {
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      },
    })

    const [userRow] = await db
      .select({ email: users.email, institutionalEmail: users.institutionalEmail })
      .from(users)
      .where(eq(users.id, sesion.user.id))
      .limit(1)

    await db.insert(auditLogs).values({
      usuario: sesion.user.id,
      accion: "Cambió su contraseña",
      modulo: "Perfil",
      resultado: "Exitoso",
      detalles: userRow?.email ? `Email: ${userRow.email}` : undefined,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : ""
    const lower = message.toLowerCase()
    if (lower.includes("invalid") || lower.includes("password")) {
      return NextResponse.json(
        { error: "La contraseña actual es incorrecta" },
        { status: 400 },
      )
    }
    return NextResponse.json(
      { error: "No se pudo cambiar la contraseña. Inténtalo de nuevo." },
      { status: 500 },
    )
  }
}
