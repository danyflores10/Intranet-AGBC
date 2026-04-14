import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "node:fs/promises"
import { join } from "node:path"
import { createId } from "@paralleldrive/cuid2"

import { auth } from "@/lib/auth"
import { headers } from "next/headers"

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "text/plain": "txt",
  "text/csv": "csv",
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
      return NextResponse.json({ error: "El archivo no puede superar 10MB" }, { status: 400 })
    }

    const ext = ALLOWED_TYPES[file.type]
    if (!ext) {
      return NextResponse.json(
        { error: "Tipo de archivo no permitido. Use PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG, TXT o CSV" },
        { status: 400 },
      )
    }

    const fileName = `${createId()}.${ext}`
    const dir = join(process.cwd(), "public", "documentos")
    await mkdir(dir, { recursive: true })
    const filePath = join(dir, fileName)

    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, buffer)

    const url = `/documentos/${fileName}`

    function formatSize(bytes: number) {
      if (bytes < 1024) return `${bytes} B`
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    return NextResponse.json({
      url,
      nombre: file.name,
      tipo: ext,
      tamano: formatSize(file.size),
    })
  } catch {
    return NextResponse.json({ error: "Error al subir archivo" }, { status: 500 })
  }
}
