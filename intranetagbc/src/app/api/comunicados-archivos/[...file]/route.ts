import { NextRequest, NextResponse } from "next/server"
import { join } from "node:path"
import { existsSync } from "node:fs"
import { readFile, stat } from "node:fs/promises"

const MIME_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
  svg: "image/svg+xml",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  doc: "application/msword",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls: "application/vnd.ms-excel",
}

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ file: string[] }> }
) {
  try {
    const resolvedParams = await params
    const rawPath = Array.isArray(resolvedParams.file)
      ? resolvedParams.file.join("/")
      : resolvedParams.file || ""

    if (!rawPath) {
      return NextResponse.json({ error: "Ruta no especificada" }, { status: 400 })
    }

    const decodedPath = decodeURIComponent(rawPath).replace(/\.\./g, "").replace(/^\/+/, "")
    const cleanPath = decodedPath.replace(/^(image\/)?(comunicados\/)?/, "")

    // Resoluciones de ruta posibles en disco
    const candidates = [
      join(process.cwd(), "public", "image", "comunicados", cleanPath),
      join(process.cwd(), "public", "documentos", cleanPath),
      join(process.cwd(), "public", "image", "comunicados", decodedPath),
      join(process.cwd(), "public", decodedPath),
      join(process.cwd(), "public", "image", decodedPath),
    ]

    let targetPath = ""
    for (const c of candidates) {
      if (existsSync(c)) {
        targetPath = c
        break
      }
    }

    if (!targetPath) {
      return NextResponse.json(
        { error: "Archivo de comunicado no encontrado", path: decodedPath },
        { status: 404 }
      )
    }

    const fileStat = await stat(targetPath)
    if (!fileStat.isFile()) {
      return NextResponse.json({ error: "Ruta no válida" }, { status: 400 })
    }

    const ext = targetPath.split(".").pop()?.toLowerCase() || ""
    const contentType = MIME_TYPES[ext] || "application/octet-stream"
    const isDownload = request.nextUrl.searchParams.get("download") === "1"
    const fileNameOnly = targetPath.split(/[\/\\]/).pop() || "archivo"

    const rangeHeader = request.headers.get("range")
    const fileSize = fileStat.size

    const disposition = isDownload
      ? `attachment; filename="${encodeURIComponent(fileNameOnly)}"`
      : `inline; filename="${encodeURIComponent(fileNameOnly)}"`

    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, "").split("-")
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1

      if (start >= fileSize || end >= fileSize || start > end) {
        return new NextResponse(null, {
          status: 416,
          headers: { "Content-Range": `bytes */${fileSize}` },
        })
      }

      const chunkBuffer = Buffer.alloc(end - start + 1)
      const fileBuffer = await readFile(targetPath)
      fileBuffer.copy(chunkBuffer, 0, start, end + 1)

      return new NextResponse(chunkBuffer, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": String(chunkBuffer.length),
          "Content-Type": contentType,
          "Content-Disposition": disposition,
          "Cache-Control": "public, max-age=3600",
        },
      })
    }

    const data = await readFile(targetPath)
    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(fileSize),
        "Content-Disposition": disposition,
        "Cache-Control": "public, max-age=3600",
        "Accept-Ranges": "bytes",
      },
    })
  } catch (e: any) {
    console.error("Error sirviendo archivo de comunicado:", e)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
