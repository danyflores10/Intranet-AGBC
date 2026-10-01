import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/db"
import { users, personal, directivos } from "@/db/schema"
import { eq, or, ilike } from "drizzle-orm"
import { headers } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const email = session.user.email?.toLowerCase().trim()
    const name = session.user.name?.trim()

    // 1. Obtener datos de users
    const [userData] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1)

    // 2. Buscar en personal por email o nombre para obtener telefono y foto
    let personalMatch = null
    if (email) {
      const matches = await db
        .select()
        .from(personal)
        .where(ilike(personal.email, email))
        .limit(1)
      if (matches.length > 0) personalMatch = matches[0]
    }

    if (!personalMatch && name) {
      const matches = await db
        .select()
        .from(personal)
        .where(ilike(personal.nombre, `%${name}%`))
        .limit(1)
      if (matches.length > 0) personalMatch = matches[0]
    }

    // 3. Buscar en directivos si no está en personal
    let directivoMatch = null
    if (!personalMatch && email) {
      const matches = await db
        .select()
        .from(directivos)
        .where(ilike(directivos.email, email))
        .limit(1)
      if (matches.length > 0) directivoMatch = matches[0]
    }

    const telefono = personalMatch?.telefono || directivoMatch?.telefono || ""
    const foto = userData?.image || personalMatch?.foto || directivoMatch?.foto || session.user.image || null
    const cargo = personalMatch?.cargo || directivoMatch?.cargo || (session.user as any)?.role || "Funcionario Institucional"

    return NextResponse.json({
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      institutionalEmail: userData?.institutionalEmail || session.user.email,
      telefono,
      image: foto,
      cargo,
    })
  } catch (err: any) {
    console.error("Error al obtener perfil:", err)
    return NextResponse.json({ error: "Error al obtener perfil" }, { status: 500 })
  }
}
