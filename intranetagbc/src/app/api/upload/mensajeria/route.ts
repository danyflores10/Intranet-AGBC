import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "node:fs/promises"
import { join } from "node:path"
import { createId } from "@paralleldrive/cuid2"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
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
      return NextResponse.json({ error: "No se envió ningún archivo válido" }, { status: 400 })
    }

    const originalName = file.name
    const extParts = originalName.split(".")
    const ext = extParts.length > 1 ? extParts.pop()!.toLowerCase() : "bin"

    const safeBaseName = extParts
      .join(".")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .slice(0, 40)

    const fileName = `${createId()}_${safeBaseName}.${ext}`
    const dir = join(process.cwd(), "public", "documentos")
    await mkdir(dir, { recursive: true })
    const filePath = join(dir, fileName)

    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, buffer)

    const url = `/documentos/${fileName}`

    return NextResponse.json({
      success: true,
      url,
      nombre: originalName,
      tamano: formatSize(file.size),
      tipo: ext,
      filePath,
    })
  } catch (error: any) {
    console.error("Error al subir archivo de mensajería:", error)
    return NextResponse.json(
      { error: error?.message || "Error al subir archivo adjunto" },
      { status: 500 }
    )
  }
}
