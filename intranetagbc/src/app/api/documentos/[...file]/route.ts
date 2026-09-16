import { NextRequest, NextResponse } from "next/server"
import { join } from "node:path"
import { existsSync } from "node:fs"
import { readFile, stat } from "node:fs/promises"

const MIME_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  txt: "text/plain; charset=utf-8",
  csv: "text/csv; charset=utf-8",
}

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

    // Decode URL component safely
    const decodedPath = decodeURIComponent(rawPath).replace(/\.\./g, "").replace(/^\/+/, "")
    
    // Path resolution: search in public/documentos or public
    let filePath = join(process.cwd(), "public", "documentos", decodedPath)
    if (!existsSync(filePath)) {
      filePath = join(process.cwd(), "public", decodedPath)
    }

    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: "Archivo no encontrado", path: decodedPath },
        { status: 404 }
      )
    }

    const fileStat = await stat(filePath)
    if (!fileStat.isFile()) {
      return NextResponse.json({ error: "Ruta no válida" }, { status: 400 })
    }

    const ext = decodedPath.split(".").pop()?.toLowerCase() || ""
    const contentType = MIME_TYPES[ext] || "application/octet-stream"

    const isDownload = request.nextUrl.searchParams.get("download") === "1"
    const fileNameOnly = decodedPath.split("/").pop() || "documento"

    // Range requests handling for PDF streaming / media
    const rangeHeader = request.headers.get("range")
    const fileSize = fileStat.size

    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, "").split("-")
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1

      if (start >= fileSize || end >= fileSize || start > end) {
        return new NextResponse(null, {
          status: 416,
          headers: {
            "Content-Range": `bytes */${fileSize}`,
          },
        })
      }

      const chunkSize = end - start + 1
      const fileBuffer = await readFile(filePath)
      const chunk = fileBuffer.subarray(start, end + 1)

      const disposition = isDownload
        ? `attachment; filename="${encodeURIComponent(fileNameOnly)}"`
        : `inline; filename="${encodeURIComponent(fileNameOnly)}"`

      return new NextResponse(chunk, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize.toString(),
          "Content-Type": contentType,
          "Content-Disposition": disposition,
          "Cache-Control": "public, max-age=3600, must-revalidate",
        },
      })
    }

    const fileBuffer = await readFile(filePath)
    const disposition = isDownload
      ? `attachment; filename="${encodeURIComponent(fileNameOnly)}"`
      : `inline; filename="${encodeURIComponent(fileNameOnly)}"`

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": fileSize.toString(),
        "Accept-Ranges": "bytes",
        "Content-Disposition": disposition,
        "Cache-Control": "public, max-age=3600, must-revalidate",
      },
    })
  } catch (error: any) {
    console.error("Error al servir documento:", error)
    return NextResponse.json({ error: "Error interno al obtener documento" }, { status: 500 })
  }
}
