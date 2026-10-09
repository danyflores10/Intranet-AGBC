import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "node:fs/promises"
import { join } from "node:path"
import { createId } from "@paralleldrive/cuid2"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { obtenerUsuarioRbacActual } from "@/lib/auth/session-access"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// Límite estricto de 20 MB solicitado por DevOps
const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20 MB

// Extensiones y tipos permitidos
const ALLOWED_EXTENSIONS = new Set([
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "txt",
  "csv",
  "zip",
  "rar",
  "7z",
  "jpg",
  "jpeg",
  "png",
  "webp",
])

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export async function POST(request: NextRequest) {
  try {
    // 1. Verificación de autenticación y rol administrativo
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const usuarioRbac = await obtenerUsuarioRbacActual()
    const roles = (usuarioRbac?.roles || []).map((r) => r.toLowerCase())
    const esAdmin = roles.some((r) =>
      ["administrador", "admin", "super_admin", "gestor", "director"].includes(r)
    )

    if (!esAdmin) {
      return NextResponse.json(
        { error: "Acceso restringido: Solo los administradores pueden adjuntar documentos para envíos masivos" },
        { status: 403 }
      )
    }

    // 2. Extracción de archivo
    const formData = await request.formData()
    const file = formData.get("archivo") as File | null

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No se envió ningún archivo válido" }, { status: 400 })
    }

    // 3. Validación de tamaño máximo (20 MB)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `El archivo supera el tamaño máximo permitido de 20 MB (Tamaño actual: ${formatSize(file.size)})`,
        },
        { status: 400 }
      )
    }

    // 4. Validación de tipo/extensión permitida
    const originalName = file.name
    const extParts = originalName.split(".")
    const ext = extParts.length > 1 ? extParts.pop()!.toLowerCase() : "bin"

    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        {
          error: `Tipo de archivo (.${ext}) no permitido. Formatos admitidos: PDF, Word (DOC/DOCX), Excel (XLS/XLSX), PPT, Imágenes (JPG/PNG/WEBP), Texto (TXT/CSV) o Comprimidos (ZIP/RAR).`,
        },
        { status: 400 }
      )
    }

    // 5. Guardado seguro en disco
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
