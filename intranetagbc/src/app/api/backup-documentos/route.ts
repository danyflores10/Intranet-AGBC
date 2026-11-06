import { NextRequest, NextResponse } from "next/server"
import { generarBackupDocumentosStream } from "@/lib/backup-documentos-service"

export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function GET(request: NextRequest) {
  try {
    const formatParam = request.nextUrl.searchParams.get("format")?.toLowerCase()
    const format = formatParam === "rar" ? "rar" : "zip"

    const { stream, fileName, contentType } = await generarBackupDocumentosStream({ format })

    return new NextResponse(stream as any, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    })
  } catch (error: any) {
    console.error("Error al generar backup documental:", error)
    return NextResponse.json(
      { error: "Error al generar la copia de seguridad documental", details: error?.message },
      { status: 500 }
    )
  }
}

