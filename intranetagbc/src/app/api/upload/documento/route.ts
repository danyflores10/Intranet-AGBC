import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "node:fs/promises"
import { join } from "node:path"
import { createId } from "@paralleldrive/cuid2"

import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { PERMISOS } from "@/lib/auth/permisos"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const ALLOWED_TYPES_MIME: Record<string, string> = {
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

const ALLOWED_EXTENSIONS = new Set([
  "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "jpg", "jpeg", "png", "webp", "txt", "csv"
])

const ROL_SUPER_ADMIN = "super_admin"

function normalizarTexto(value: string): string {
  return value.trim().toLowerCase()
}

function getLegacyPermissionAlias(permission: string): string | null {
  const tokens = normalizarTexto(permission).split(/\s+/).filter(Boolean)
  if (tokens.length < 2) return null
  const [action, ...resourceTokens] = tokens
  const resource = resourceTokens.join("_")
  if (resource.length === 0) return null
  return `${resource}.${action}`
}

function tienePermiso(permissions: string[], permisoRequerido: string): boolean {
  const permisoNormalizado = normalizarTexto(permisoRequerido)
  const alias = getLegacyPermissionAlias(permisoNormalizado)

  return permissions.some((permiso) => {
    const normalizedPermission = normalizarTexto(permiso)
    return (
      normalizedPermission === permisoNormalizado
      || (alias !== null && normalizedPermission === alias)
    )
  })
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function obtenerExtension(file: File): string | null {
  if (file.type && ALLOWED_TYPES_MIME[file.type]) {
    return ALLOWED_TYPES_MIME[file.type]
  }
  const ext = file.name.split(".").pop()?.toLowerCase()
  if (ext && ALLOWED_EXTENSIONS.has(ext)) {
    return ext === "jpeg" ? "jpg" : ext
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    const usuario = session?.user as {
      id?: string
      roles?: string[]
      permissions?: string[]
    } | undefined

    if (!usuario?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const roles = usuario.roles ?? []
    const permissions = usuario.permissions ?? []
    const esSuperAdmin = roles.some((rol) => normalizarTexto(rol) === ROL_SUPER_ADMIN)
    const puedeSubir =
      esSuperAdmin
      || tienePermiso(permissions, PERMISOS.DOCUMENTOS.CREAR)
      || tienePermiso(permissions, PERMISOS.DOCUMENTOS.EDITAR)

    if (!puedeSubir) {
      return NextResponse.json(
        { error: "No tienes permisos para subir archivos de documentos" },
        { status: 403 },
      )
    }

    const formData = await request.formData()
    const file = formData.get("archivo") as File | null

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No se envió archivo" }, { status: 400 })
    }

    const ext = obtenerExtension(file)
    if (!ext) {
      return NextResponse.json(
        { error: "Tipo de archivo no permitido. Use PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG, TXT o CSV" },
        { status: 400 },
      )
    }

    const safeBaseName = file.name
      .replace(/\.[^/.]+$/, "")
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
      url,
      nombre: file.name,
      tipo: ext,
      tamano: formatSize(file.size),
    })
  } catch (error: any) {
    console.error("Error al subir archivo:", error)
    return NextResponse.json({ error: error?.message || "Error al subir archivo" }, { status: 500 })
  }
}
