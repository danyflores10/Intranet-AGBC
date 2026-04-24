import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "node:fs/promises"
import { join } from "node:path"
import { createId } from "@paralleldrive/cuid2"

import { auth } from "@/lib/auth"
import { headers } from "next/headers"

const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/avif": "avif",
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("imagen") as File | null
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No se envió imagen" }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "La imagen no puede superar 5MB" }, { status: 400 })
    }
    const ext = ALLOWED_TYPES[file.type]
    if (!ext) {
      return NextResponse.json({ error: "Tipo no permitido. Usa JPG, PNG, WebP, GIF o AVIF" }, { status: 400 })
    }

    const fileName = `${createId()}.${ext}`
    const dir = join(process.cwd(), "public", "image", "reconocimientos")
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, fileName), Buffer.from(await file.arrayBuffer()))

    return NextResponse.json({ url: `/image/reconocimientos/${fileName}`, nombre: file.name })
  } catch {
    return NextResponse.json({ error: "Error al subir imagen" }, { status: 500 })
  }
}
