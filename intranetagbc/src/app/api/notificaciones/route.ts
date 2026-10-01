import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/db"
import { notificaciones, users, documentos } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { headers } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const [rows, todosDocs] = await Promise.all([
      db
        .select({
          id: notificaciones.id,
          titulo: notificaciones.titulo,
          mensaje: notificaciones.mensaje,
          tipo: notificaciones.tipo,
          leida: notificaciones.leida,
          enlace: notificaciones.enlace,
          createdAt: notificaciones.createdAt,
        })
        .from(notificaciones)
        .where(eq(notificaciones.usuarioId, session.user.id))
        .orderBy(desc(notificaciones.createdAt))
        .limit(40),
      db
        .select({
          id: documentos.id,
          titulo: documentos.titulo,
          archivo: documentos.archivo,
          nombreArchivo: documentos.nombreArchivo,
          tipoArchivo: documentos.tipoArchivo,
          tamano: documentos.tamano,
          categoriaId: documentos.categoriaId,
        })
        .from(documentos),
    ])

    // Formatear items para el frontend
    const notifs = rows.map((r) => {
      const fechaObj = new Date(r.createdAt)
      const diffMin = Math.round((Date.now() - fechaObj.getTime()) / 60000)
      let fechaFormatted = "Reciente"
      if (diffMin < 60) {
        fechaFormatted = diffMin <= 1 ? "Hace un momento" : `Hace ${diffMin} min`
      } else if (diffMin < 1440) {
        fechaFormatted = `Hace ${Math.round(diffMin / 60)} horas`
      } else {
        fechaFormatted = fechaObj.toLocaleDateString("es-BO", { day: "2-digit", month: "short" })
      }

      // Buscar si corresponde a un documento
      const cleanDocTitle = r.titulo.replace(/^(Nuevo Documento:|Documento:|Instructivo:)/i, "").trim().toLowerCase()
      const docMatch = todosDocs.find((d) => {
        if (r.enlace && r.enlace.includes(d.id)) return true
        const dTit = d.titulo.toLowerCase()
        return dTit.includes(cleanDocTitle) || cleanDocTitle.includes(dTit)
      })

      return {
        id: r.id,
        titulo: r.titulo,
        mensaje: r.mensaje,
        tipo: r.tipo as any,
        leida: r.leida,
        fecha: fechaFormatted,
        enlace: r.enlace,
        remitente: "Dirección General AGBC",
        archivoUrl: docMatch?.archivo || null,
        archivoNombre: docMatch?.nombreArchivo || null,
        tamano: docMatch?.tamano || null,
        documentoId: docMatch?.id || null,
      }
    })

    return NextResponse.json({ notificaciones: notifs })
  } catch (err: any) {
    console.error("Error al obtener notificaciones:", err)
    return NextResponse.json({ error: "Error al obtener notificaciones" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { action, id } = body

    if (action === "marcar_leida" && id) {
      await db.update(notificaciones).set({ leida: true }).where(eq(notificaciones.id, id))
      return NextResponse.json({ success: true })
    }

    if (action === "marcar_todas_leidas") {
      await db.update(notificaciones).set({ leida: true }).where(eq(notificaciones.usuarioId, session.user.id))
      return NextResponse.json({ success: true })
    }

    if (action === "eliminar" && id) {
      await db.delete(notificaciones).where(eq(notificaciones.id, id))
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 })
  } catch (err: any) {
    console.error("Error al procesar notificación:", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
