import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "node:fs/promises"
import { join } from "node:path"
import { createId } from "@paralleldrive/cuid2"

import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { PERMISOS } from "@/lib/auth/permisos"

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
}

const ROL_SUPER_ADMIN = "super_admin"

function normalizar(value: string): string {
  return value.trim().toLowerCase()
}

function aliasLegacy(permiso: string): string | null {
  const tokens = normalizar(permiso).split(/\s+/).filter(Boolean)
  if (tokens.length < 2) return null
  const [accion, ...resto] = tokens
  const recurso = resto.join("_")
  if (!recurso) return null
  return `${recurso}.${accion}`
}

function tienePermiso(permisos: string[], requerido: string): boolean {
  const norm = normalizar(requerido)
  const alias = aliasLegacy(norm)
  return permisos.some((p) => {
    const np = normalizar(p)
    return np === norm || (alias !== null && np === alias)
  })
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    const usuario = session?.user as
      | { id?: string; roles?: string[]; permissions?: string[] }
      | undefined

    if (!usuario?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const roles = usuario.roles ?? []
    const permisos = usuario.permissions ?? []
    const esSuperAdmin = roles.some((r) => normalizar(r) === ROL_SUPER_ADMIN)
    const puedeSubir =
      esSuperAdmin ||
      tienePermiso(permisos, PERMISOS.CORRESPONDENCIA.CREAR) ||
      tienePermiso(permisos, PERMISOS.CORRESPONDENCIA.EDITAR) ||
      tienePermiso(permisos, PERMISOS.CORRESPONDENCIA.DERIVAR)

    if (!puedeSubir) {
      return NextResponse.json(
        { error: "No tienes permisos para subir archivos de correspondencia" },
        { status: 403 },
      )
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
        { error: "Tipo de archivo no permitido. Use PDF, JPG o PNG" },
        { status: 400 },
      )
    }

    const fileName = `${createId()}.${ext}`
    const dir = join(process.cwd(), "public", "correspondencia")
    await mkdir(dir, { recursive: true })
    const filePath = join(dir, fileName)

    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, buffer)

    const url = `/correspondencia/${fileName}`

    return NextResponse.json({
      url,
      nombre: file.name,
      tipo: ext,
      tamano: file.size,
    })
  } catch {
    return NextResponse.json({ error: "Error al subir archivo" }, { status: 500 })
  }
}
