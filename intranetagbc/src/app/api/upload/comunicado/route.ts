import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "node:fs/promises"
import { join } from "node:path"
import { createId } from "@paralleldrive/cuid2"

import { auth } from "@/lib/auth"
import { headers } from "next/headers"

const MAX_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/avif": "avif",
  "application/pdf": "pdf",
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("archivo") as File | null

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No se envió archivo" }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "El archivo no puede superar 5MB" }, { status: 400 })
    }

    const ext = ALLOWED_TYPES[file.type]
    if (!ext) {
      return NextResponse.json({ error: "Tipo de archivo no permitido. Use JPG, PNG, GIF, WebP o PDF" }, { status: 400 })
    }

    const tipo = file.type === "application/pdf" ? "pdf" : "imagen"
    const fileName = `${createId()}.${ext}`
    const dir = join(process.cwd(), "public", "image", "comunicados")
    await mkdir(dir, { recursive: true })
    const filePath = join(dir, fileName)

    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, buffer)

    // Si es PDF, también dejamos copia en public/documentos para compatibilidad total
    if (ext === "pdf") {
      try {
        const dirDocs = join(process.cwd(), "public", "documentos")
        await mkdir(dirDocs, { recursive: true })
        await writeFile(join(dirDocs, fileName), buffer)
      } catch (errCopy) {
        console.warn("No se pudo duplicar PDF a public/documentos:", errCopy)
      }
    }

    const url = `/api/comunicados-archivos/${fileName}`

    return NextResponse.json({
      url,
      nombre: file.name,
      tipo,
    })
  } catch {
    return NextResponse.json({ error: "Error al subir archivo" }, { status: 500 })
  }
}
