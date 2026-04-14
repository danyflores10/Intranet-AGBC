"use client"

import { useState, useRef, useEffect } from "react"
import {
  XIcon,
  UploadIcon,
  ImageIcon,
  FileTextIcon,
  Trash2Icon,
} from "lucide-react"
import toast from "react-hot-toast"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Comunicado } from "@/hooks/use-comunicados"

interface ComunicadoModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: Omit<Comunicado, "id">) => void
  onUpdate?: (id: string, data: Partial<Comunicado>) => void
  comunicado?: Comunicado | null
}

export function ComunicadoModal({
  open,
  onClose,
  onSave,
  onUpdate,
  comunicado,
}: ComunicadoModalProps) {
  const isEdit = !!comunicado
  const fileRef = useRef<HTMLInputElement>(null)

  const [titulo, setTitulo] = useState("")
  const [contenido, setContenido] = useState("")
  const [fecha, setFecha] = useState("")
  const [prioridad, setPrioridad] = useState<"alta" | "media" | "baja">("media")
  const [estado, setEstado] = useState<"publicado" | "borrador">("borrador")
  const [archivoNombre, setArchivoNombre] = useState<string | null>(null)
  const [archivoTipo, setArchivoTipo] = useState<"imagen" | "pdf" | null>(null)
  const [archivoData, setArchivoData] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && comunicado) {
      setTitulo(comunicado.titulo)
      setContenido(comunicado.contenido)
      setFecha(comunicado.fecha)
      setPrioridad(comunicado.prioridad)
      setEstado(comunicado.estado)
      setArchivoNombre(comunicado.archivoNombre)
      setArchivoTipo(comunicado.archivoTipo)
      setArchivoData(comunicado.archivoData)
    } else if (open) {
      setTitulo("")
      setContenido("")
      setFecha(new Date().toISOString().split("T")[0])
      setPrioridad("media")
      setEstado("borrador")
      setArchivoNombre(null)
      setArchivoTipo(null)
      setArchivoData(null)
    }
  }, [open, comunicado])

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const isImage = file.type.startsWith("image/")
    const isPdf = file.type === "application/pdf"

    if (!isImage && !isPdf) {
      toast.error("Solo se permiten imágenes (JPG, PNG, GIF, WebP) y archivos PDF")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("El archivo no debe superar los 5 MB")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setArchivoData(reader.result as string)
      setArchivoNombre(file.name)
      setArchivoTipo(isImage ? "imagen" : "pdf")
    }
    reader.readAsDataURL(file)
  }

  const removeFile = () => {
    setArchivoData(null)
    setArchivoNombre(null)
    setArchivoTipo(null)
    if (fileRef.current) fileRef.current.value = ""
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!titulo.trim()) {
      toast.error("El título es obligatorio")
      return
    }
    if (!contenido.trim()) {
      toast.error("El contenido es obligatorio")
      return
    }

    setSaving(true)
    await new Promise((r) => setTimeout(r, 400))

    const data = {
      titulo: titulo.trim(),
      contenido: contenido.trim(),
      fecha,
      prioridad,
      estado,
      archivoNombre,
      archivoTipo,
      archivoData,
    }

    if (isEdit && onUpdate && comunicado) {
      onUpdate(comunicado.id, data)
      toast.success("Comunicado actualizado")
    } else {
      onSave(data)
      toast.success("Comunicado creado exitosamente")
    }

    setSaving(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl border-border/50">
        {/* Top color bar */}
        <div className="flex h-1.5 w-full rounded-t-2xl overflow-hidden"><div className="flex-1 bg-[#C41E3A]"/><div className="flex-1 bg-[#FFB300]"/><div className="flex-1 bg-[#2E7D32]"/></div>

        <DialogHeader className="px-6 pt-5 pb-0">
          <DialogTitle className="text-xl font-bold tracking-tight">
            {isEdit ? "Editar comunicado" : "Nuevo comunicado"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {isEdit
              ? "Modifica la información del comunicado"
              : "Completa los datos para publicar un comunicado institucional"}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-4 space-y-5">
          {/* Titulo */}
          <div className="space-y-2">
            <Label htmlFor="modal-titulo" className="text-sm font-semibold">
              Título del comunicado *
            </Label>
            <Input
              id="modal-titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Rendición Pública de Cuentas Final 2025"
              className="h-11 rounded-xl"
              required
            />
          </div>

          {/* Contenido */}
          <div className="space-y-2">
            <Label htmlFor="modal-contenido" className="text-sm font-semibold">
              Contenido *
            </Label>
            <Textarea
              id="modal-contenido"
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              placeholder="Escribe el contenido del comunicado..."
              className="min-h-[120px] rounded-xl resize-y"
              required
            />
          </div>

          {/* Fecha + Prioridad + Estado */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="modal-fecha" className="text-sm font-semibold">Fecha</Label>
              <Input
                id="modal-fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modal-prioridad" className="text-sm font-semibold">Prioridad</Label>
              <select
                id="modal-prioridad"
                value={prioridad}
                onChange={(e) => setPrioridad(e.target.value as "alta" | "media" | "baja")}
                className="flex h-11 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="modal-estado" className="text-sm font-semibold">Estado</Label>
              <select
                id="modal-estado"
                value={estado}
                onChange={(e) => setEstado(e.target.value as "publicado" | "borrador")}
                className="flex h-11 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="borrador">Borrador</option>
                <option value="publicado">Publicado</option>
              </select>
            </div>
          </div>

          {/* File upload */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Imagen o PDF adjunto</Label>
            <p className="text-xs text-muted-foreground">
              Sube una imagen (JPG, PNG, WebP) o un archivo PDF. Máximo 5 MB.
            </p>

            {!archivoData ? (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border/60 bg-muted/20 p-8 transition-colors hover:border-[#FFB300]/50 hover:bg-muted/40"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFB300]/10">
                  <UploadIcon className="h-6 w-6 text-[#FFB300]" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">
                    Haz clic para seleccionar un archivo
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG, WebP, GIF o PDF
                  </p>
                </div>
              </button>
            ) : (
              <div className="rounded-xl border border-border/50 bg-muted/20 overflow-hidden">
                {/* Preview */}
                {archivoTipo === "imagen" && (
                  <div className="relative bg-muted/30 flex items-center justify-center p-4">
                    <img
                      src={archivoData}
                      alt={archivoNombre ?? "Preview"}
                      className="max-h-[250px] rounded-lg object-contain shadow-md"
                    />
                  </div>
                )}

                {archivoTipo === "pdf" && (
                  <div className="flex items-center justify-center gap-3 bg-muted/30 p-8">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-red-500/10">
                      <FileTextIcon className="h-7 w-7 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{archivoNombre}</p>
                      <p className="text-xs text-muted-foreground">Documento PDF</p>
                    </div>
                  </div>
                )}

                {/* File info bar */}
                <div className="flex items-center justify-between border-t border-border/40 px-4 py-3">
                  <div className="flex items-center gap-2 min-w-0">
                    {archivoTipo === "imagen" ? (
                      <ImageIcon className="h-4 w-4 text-[#FFB300] shrink-0" />
                    ) : (
                      <FileTextIcon className="h-4 w-4 text-red-500 shrink-0" />
                    )}
                    <span className="text-sm truncate">{archivoNombre}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => fileRef.current?.click()}
                      className="h-8 text-xs"
                    >
                      Reemplazar
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeFile}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
              onChange={handleFile}
              className="hidden"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/40">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000] border-0 font-semibold shadow-md shadow-[#FFB300]/20 hover:shadow-lg hover:shadow-[#FFB300]/25"
            >
              {saving
                ? "Guardando..."
                : isEdit
                  ? "Guardar cambios"
                  : "Publicar comunicado"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
