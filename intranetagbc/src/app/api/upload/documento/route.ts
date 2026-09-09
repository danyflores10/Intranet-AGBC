import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "node:fs/promises"
import { join } from "node:path"
import { createId } from "@paralleldrive/cuid2"

import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { PERMISOS } from "@/lib/auth/permisos"
 
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

const ROL_SUPER_ADMIN = "super_admin"

function normalizarTexto(value: string): string {
  return value.trim().toLowerCase()
}

function getLegacyPermissionAlias(permission: string): string | null {
  const tokens = normalizarTexto(permission).split(/\s+/).filter(Boolean)

  if (tokens.length < 2) {
    return null
  }

  const [action, ...resourceTokens] = tokens
  const resource = resourceTokens.join("_")

  if (resource.length === 0) {
    return null
  }

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
      if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
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
