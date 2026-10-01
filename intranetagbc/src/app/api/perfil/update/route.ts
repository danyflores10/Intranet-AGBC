import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/db"
import { users, personal, directivos } from "@/db/schema"
import { eq, ilike } from "drizzle-orm"
import { headers } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { telefono, image } = body

    const email = session.user.email?.toLowerCase().trim()
    const name = session.user.name?.trim()

    // 1. Actualizar users (image)
    if (image !== undefined) {
      await db
        .update(users)
        .set({ image: image || null, updatedAt: new Date() })
        .where(eq(users.id, session.user.id))
    }

    // 2. Actualizar personal (telefono y foto)
    if (email) {
      const updateData: Record<string, any> = { updatedAt: new Date() }
      if (telefono !== undefined) updateData.telefono = telefono?.trim() || null
      if (image !== undefined) updateData.foto = image || null

      await db
        .update(personal)
        .set(updateData)
        .where(ilike(personal.email, email))
    } else if (name) {
      const updateData: Record<string, any> = { updatedAt: new Date() }
      if (telefono !== undefined) updateData.telefono = telefono?.trim() || null
      if (image !== undefined) updateData.foto = image || null

      await db
        .update(personal)
        .set(updateData)
        .where(ilike(personal.nombre, `%${name}%`))
    }

    // 3. Actualizar directivos si corresponde
    if (email) {
      const updateData: Record<string, any> = { updatedAt: new Date() }
      if (telefono !== undefined) updateData.telefono = telefono?.trim() || null
      if (image !== undefined) updateData.foto = image || null

      await db
        .update(directivos)
        .set(updateData)
        .where(ilike(directivos.email, email))
    }

    return NextResponse.json({
      success: true,
      message: "Perfil actualizado correctamente en el sistema",
      telefono: telefono?.trim() || "",
      image: image || null,
    })
  } catch (err: any) {
    console.error("Error al actualizar perfil:", err)
    return NextResponse.json(
      { error: err.message || "Error al actualizar perfil" },
      { status: 500 }
    )
  }
}
