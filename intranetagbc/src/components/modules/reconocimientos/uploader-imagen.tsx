"use client"

import { useRef, useState, useTransition } from "react"
import { ImageIcon, UploadCloudIcon, XIcon } from "lucide-react"
import toast from "react-hot-toast"

interface Props {
  value: string | null | undefined
  onChange: (url: string | null) => void
  ratio?: "square" | "landscape" | "portrait"
}

export function UploaderImagen({ value, onChange, ratio = "landscape" }: Props) {
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewLocal, setPreviewLocal] = useState<string | null>(null)

  const src = previewLocal ?? value ?? null
  const aspect =
    ratio === "square" ? "aspect-square" : ratio === "portrait" ? "aspect-[4/5]" : "aspect-[16/9]"

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no puede superar 5MB")
      return
    }
    const url = URL.createObjectURL(file)
    setPreviewLocal(url)

    startTransition(async () => {
      try {
        const fd = new FormData()
        fd.append("imagen", file)
        const res = await fetch("/api/upload/reconocimiento", { method: "POST", body: fd })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data?.error || "Error al subir")
        }
        const data = await res.json()
        onChange(data.url)
        setPreviewLocal(null)
        toast.success("Imagen subida")
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al subir")
        setPreviewLocal(null)
      } finally {
        URL.revokeObjectURL(url)
      }
    })
  }

  function handleQuitar() {
    onChange(null)
    setPreviewLocal(null)
  }

  return (
    <div className="space-y-2">
      <div
        className={`relative ${aspect} w-full overflow-hidden rounded-xl border border-border/60 bg-muted/30`}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="Imagen del reconocimiento" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground/50">
            <ImageIcon className="h-10 w-10" />
            <p className="mt-2 text-xs font-semibold">Sin imagen</p>
          </div>
        )}
        {isPending && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
            <div className="rounded-full bg-[#FFB300]/20 px-4 py-2 text-xs font-bold text-[#FF8800]">
              Subiendo...
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-border/60 bg-card px-3 py-2 text-xs font-semibold transition-colors hover:bg-muted disabled:opacity-50"
        >
          <UploadCloudIcon className="h-4 w-4" />
          {src ? "Cambiar imagen" : "Subir imagen"}
        </button>
        {src && !isPending && (
          <button
            type="button"
            onClick={handleQuitar}
            className="inline-flex items-center gap-1 rounded-lg border border-red-300/40 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20"
          >
            <XIcon className="h-4 w-4" />
            Quitar
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          className="hidden"
          onChange={handleFile}
        />
      </div>
    </div>
  )
}
