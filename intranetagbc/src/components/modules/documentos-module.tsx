"use client"

import { useState, useTransition, useRef, useMemo, useEffect } from "react"
import {
  PlusIcon,
  FileTextIcon,
  FolderIcon,
  EyeIcon,
  PencilIcon,
  Trash2Icon,
  UploadIcon,
  DownloadIcon,
  FileIcon,
  FileSpreadsheetIcon,
  ImageIcon,
  XIcon,
  Loader2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircle2Icon,
  SparklesIcon,
  LayersIcon,
  CheckSquareIcon,
  SquareIcon,
  AlertTriangleIcon,
  Building2Icon,
  BriefcaseIcon,
  PackageIcon,
  HandshakeIcon,
  RotateCcwIcon,
  SlidersHorizontalIcon,
  FolderOpenIcon,
  ArrowLeftIcon,
  ExternalLinkIcon,
  UploadCloudIcon,
} from "lucide-react"
import toast from "react-hot-toast"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  crearDocumento, actualizarDocumento, eliminarDocumento,
  crearCategoria, actualizarCategoria, eliminarCategoria,
  enviarDocumentosAPapeleraLote, eliminarDocumentosPermanenteLote,
  eliminarCategoriasLote,
} from "@/actions/documentos"
import { registrarAccionDocumentoAction } from "@/actions/auditoria"
import { PERMISOS } from "@/lib/auth/permisos"
import { crearContextoAcceso, puedeAcceder, type UsuarioRbac } from "@/lib/rbac"
import { DocumentContentViewer } from "@/components/modules/document-content-viewer"
import { ImportarCatalogoDialog } from "@/components/modules/importar-catalogo-dialog"
import * as XLSX from "xlsx"
import { LISTA_DOCUMENTOS_OFICIALES, obtenerFechaOficialDocumento } from "@/lib/documentos-fechas-map"
import { ESTRUCTURA_JERARQUICA, TIPOS_DOCUMENTALES, clasificarDocumento } from "@/lib/documentos-jerarquia"

export function getDocumentUrl(archivo: string | null): string {
  if (!archivo) return ""
  if (archivo.startsWith("http://") || archivo.startsWith("https://")) return archivo
  if (archivo.startsWith("/api/documentos/")) return archivo
  const clean = archivo.replace(/^\/?(documentos\/)?/, "")
  return `/api/documentos/${clean}`
}

type Tab = "todos" | "categorias"

interface DocRow {
  id: string
  titulo: string
  categoria: string | null
  categoriaId: string | null
  direccionId?: string | null
  direccion?: string | null
  subcategoriaId?: string | null
  subcategoria?: string | null
  tipoDocumental?: string | null
  autor: string
  estado: string
  archivo: string | null
  nombreArchivo: string | null
  tipoArchivo: string | null
  tamano: string | null
  descripcion: string | null
  createdAt: Date
}

interface CategoriaRow {
  id: string
  nombre: string
  descripcion: string | null
  parentId?: string | null
  nivel?: number | null
  orden?: number | null
  createdAt: Date
}

interface Props {
  documentos: DocRow[]
  categorias: CategoriaRow[]
  usuario: UsuarioRbac
}

function getFileIcon(tipo: string | null) {
  const t = (tipo || "").toLowerCase()
  if (t.includes("pdf")) return FileTextIcon
  if (t.includes("xls") || t.includes("csv") || t.includes("spreadsheet") || t.includes("sheet") || t.includes("excel")) return FileSpreadsheetIcon
  if (t.includes("doc") || t.includes("word")) return FileTextIcon
  if (t.includes("image") || t.includes("jpg") || t.includes("png") || t.includes("webp")) return ImageIcon
  return FileIcon
}

function getFileColor(tipo: string | null) {
  const t = (tipo || "").toLowerCase()
  if (t.includes("pdf")) return "#C41E3A"
  if (t.includes("doc") || t.includes("word")) return "#1976D2"
  if (t.includes("xls") || t.includes("csv") || t.includes("spreadsheet") || t.includes("sheet") || t.includes("excel")) return "#2E7D32"
  if (t.includes("ppt") || t.includes("presentation")) return "#FF8800"
  if (t.includes("image") || t.includes("jpg") || t.includes("png") || t.includes("webp")) return "#7B1FA2"
  return "#6B7280"
}

function buildPagination(current: number, total: number): Array<number | "ellipsis"> {
  if (total <= 6) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  if (current <= 3) {
    return [1, 2, 3, 4, "ellipsis", total]
  }

  if (current >= total - 2) {
    return [1, "ellipsis", total - 3, total - 2, total - 1, total]
  }

  return [1, "ellipsis", current - 1, current, current + 1, "ellipsis", total]
}

export function DocumentosModule({ documentos, categorias, usuario }: Props) {
  const [tab, setTab] = useState<Tab>("todos")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  // Filtros jerárquicos de tabla
  const [direccionFiltro, setDireccionFiltro] = useState<string | null>(null)
  const [subcategoriaFiltro, setSubcategoriaFiltro] = useState<string | null>(null)
  const [tipoDocumentalFiltro, setTipoDocumentalFiltro] = useState<string | null>(null)
  const [nivelCatFiltro, setNivelCatFiltro] = useState<number | null>(null)

  // Exploración por carpetas para Tab Categorías Jerárquicas (Nivel 1 -> Nivel 2 -> Nivel 3 -> Documentos)
  const [catFolderDirId, setCatFolderDirId] = useState<string | null>(null)
  const [catFolderSubId, setCatFolderSubId] = useState<string | null>(null)
  const [catFolderTipoId, setCatFolderTipoId] = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [importCatalogOpen, setImportCatalogOpen] = useState(false)
  const [catDialogOpen, setCatDialogOpen] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<DocRow | null>(null)
  const [editDoc, setEditDoc] = useState<DocRow | null>(null)
  const [editCat, setEditCat] = useState<CategoriaRow | null>(null)
  const [isPending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<{ url: string; nombre: string; tipo: string; tamano: string } | null>(null)
  
  // Formulario de documento: selección jerárquica
  const [docDireccion, setDocDireccion] = useState<string>("")
  const [docSubcategoria, setDocSubcategoria] = useState<string>("")
  const [docTipoDocumental, setDocTipoDocumental] = useState<string>("")
  const [estado, setEstado] = useState("borrador")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Formulario de categoría: selección jerárquica
  const [catNivel, setCatNivel] = useState<number>(1)
  const [catParentId, setCatParentId] = useState<string>("")

  const accessContext = useMemo(() => crearContextoAcceso(usuario), [usuario])

  const canCreateDocumento = useMemo(
    () => puedeAcceder({ permissions: [PERMISOS.DOCUMENTOS.CREAR] }, accessContext),
    [accessContext],
  )

  const canEditDocumento = useMemo(
    () => puedeAcceder({ permissions: [PERMISOS.DOCUMENTOS.EDITAR] }, accessContext),
    [accessContext],
  )

  const canDeleteDocumento = useMemo(
    () => puedeAcceder({ permissions: [PERMISOS.DOCUMENTOS.ELIMINAR] }, accessContext),
    [accessContext],
  )

  // Enriquecer documentos con jerarquía si viene vacía
  const docsEnriquecidos = useMemo(() => {
    return documentos.map((d) => {
      const j = clasificarDocumento(d.archivo || d.nombreArchivo, d.titulo)
      return {
        ...d,
        direccion: d.direccion || j.direccionNombre,
        subcategoria: d.subcategoria || j.subcategoriaNombre,
        tipoDocumental: d.tipoDocumental || j.tipoDocumental,
      }
    })
  }, [documentos])

  const docsConArchivo = useMemo(() => docsEnriquecidos.filter((d) => d.archivo), [docsEnriquecidos])

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showPermanentDeleteModal, setShowPermanentDeleteModal] = useState(false)
  const [isProcessingBulk, setIsProcessingBulk] = useState(false)

  const handleTabChange = (t: Tab) => {
    setTab(t)
    setSearchQuery("")
    setDireccionFiltro(null)
    setSubcategoriaFiltro(null)
    setTipoDocumentalFiltro(null)
    setNivelCatFiltro(null)
    setCatFolderDirId(null)
    setCatFolderSubId(null)
    setCatFolderTipoId(null)
    setCurrentPage(1)
    setSelectedIds([])
  }

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const handleSelectAll = (itemsToSelect: Array<{ id: string }>) => {
    if (selectedIds.length === itemsToSelect.length && itemsToSelect.length > 0) {
      setSelectedIds([])
    } else {
      setSelectedIds(itemsToSelect.map((d) => d.id))
    }
  }

  const handleBulkEnviarPapelera = async () => {
    if (selectedIds.length === 0) return
    setIsProcessingBulk(true)
    try {
      const res = await enviarDocumentosAPapeleraLote(selectedIds)
      if (res.success) {
        toast.success(`${res.count} documento(s) movido(s) a papelera`)
        setSelectedIds([])
      } else {
        toast.error("Error al mover documentos a papelera")
      }
    } catch {
      toast.error("Error al procesar la acción masiva")
    } finally {
      setIsProcessingBulk(false)
    }
  }

  const handleBulkEliminarPermanente = async () => {
    if (selectedIds.length === 0) return
    setIsProcessingBulk(true)
    try {
      if (tab === "categorias") {
        const res = await eliminarCategoriasLote(selectedIds)
        if (res.success) {
          toast.success(`${res.count} categoría(s) eliminada(s) permanentemente`)
          setSelectedIds([])
          setShowPermanentDeleteModal(false)
        } else {
          toast.error("Error al eliminar categorías")
        }
      } else {
        const res = await eliminarDocumentosPermanenteLote(selectedIds)
        if (res.success) {
          toast.success(`${res.count} documento(s) eliminado(s) permanentemente`)
          setSelectedIds([])
          setShowPermanentDeleteModal(false)
        } else {
          toast.error("Error al eliminar documentos permanentemente")
        }
      }
    } catch {
      toast.error("Error al procesar la eliminación permanente")
    } finally {
      setIsProcessingBulk(false)
    }
  }

  useEffect(() => {
    if (dialogOpen) {
      if (editDoc) {
        const j = clasificarDocumento(editDoc.archivo || editDoc.nombreArchivo, editDoc.titulo)
        setDocDireccion(editDoc.direccion || j.direccionNombre)
        setDocSubcategoria(editDoc.subcategoria || j.subcategoriaNombre)
        setDocTipoDocumental(editDoc.tipoDocumental || j.tipoDocumental)
        setEstado(editDoc.estado ?? "borrador")
      } else {
        setDocDireccion("")
        setDocSubcategoria("")
        setDocTipoDocumental("")
        setEstado("borrador")
      }
    }
  }, [dialogOpen, editDoc])

  useEffect(() => {
    if (catDialogOpen) {
      if (editCat) {
        setCatNivel(editCat.nivel ?? 1)
        setCatParentId(editCat.parentId ?? "")
      } else {
        setCatNivel(1)
        setCatParentId("")
      }
    }
  }, [catDialogOpen, editCat])

  async function handleFileUpload(file: File) {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("archivo", file)
      const res = await fetch("/api/upload/documento", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Error al subir archivo")
        return
      }
      setUploadedFile({
        url: data.url,
        nombre: data.nombre,
        tipo: data.tipo,
        tamano: data.tamano,
      })
      toast.success("Archivo subido con éxito")
    } catch {
      toast.error("Error al subir archivo")
    } finally {
      setUploading(false)
    }
  }

  async function handleDocSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)

    if (editDoc && !canEditDocumento) {
      toast.error("No tienes permiso para editar documentos")
      return
    }

    if (!editDoc && !canCreateDocumento) {
      toast.error("No tienes permiso para crear documentos")
      return
    }

    startTransition(async () => {
      try {
        const titulo = fd.get("titulo") as string
        const deduccion = clasificarDocumento(uploadedFile?.nombre || editDoc?.nombreArchivo, titulo)
        
        const finalDireccion = docDireccion || deduccion.direccionNombre
        const finalSubcategoria = docSubcategoria || deduccion.subcategoriaNombre
        const finalTipoDoc = docTipoDocumental || deduccion.tipoDocumental

        // Encontrar IDs correspondientes en categorías
        const dirRow = categorias.find((c) => c.nivel === 1 && c.nombre.toLowerCase() === finalDireccion.toLowerCase())
        const subRow = categorias.find(
          (c) => c.nivel === 2 && c.nombre.toLowerCase() === finalSubcategoria.toLowerCase()
        )
        const tipoRow = categorias.find(
          (c) => c.nivel === 3 && c.nombre.toLowerCase() === finalTipoDoc.toLowerCase() && (subRow ? c.parentId === subRow.id : true)
        )

        const payload: Record<string, any> = {
          titulo,
          direccionId: dirRow?.id || undefined,
          subcategoriaId: subRow?.id || undefined,
          tipoDocumental: finalTipoDoc,
          categoriaId: tipoRow?.id || subRow?.id || undefined,
          estado,
          descripcion: ((fd.get("descripcion") as string) || "").trim() || undefined,
        }

        if (uploadedFile) {
          payload.archivo = uploadedFile.url
          payload.nombreArchivo = uploadedFile.nombre
          payload.tipoArchivo = uploadedFile.tipo
          payload.tamano = uploadedFile.tamano
        }

        if (editDoc) {
          await actualizarDocumento(editDoc.id, payload)
          toast.success("Documento actualizado")
        } else {
          await crearDocumento(payload as Parameters<typeof crearDocumento>[0])
          toast.success("Documento creado")
        }

        setDialogOpen(false)
        setEditDoc(null)
        setUploadedFile(null)
        setDocDireccion("")
        setDocSubcategoria("")
        setDocTipoDocumental("")
        setEstado("borrador")
      } catch {
        toast.error("Error al guardar")
      }
    })
  }

  async function handleCatSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)

    if (editCat && !canEditDocumento) {
      toast.error("No tienes permiso para editar categorías")
      return
    }

    if (!editCat && !canCreateDocumento) {
      toast.error("No tienes permiso para crear categorías")
      return
    }

    startTransition(async () => {
      try {
        const nombre = (fd.get("nombre") as string).trim()
        const descripcion = ((fd.get("descripcion") as string) || "").trim() || undefined
        const orden = parseInt(fd.get("orden") as string) || 0
        const parentId = catParentId || null

        if (editCat) {
          await actualizarCategoria(editCat.id, {
            nombre,
            descripcion,
            parentId,
            nivel: catNivel,
            orden,
          })
          toast.success("Categoría actualizada")
        } else {
          await crearCategoria({
            nombre,
            descripcion,
            parentId,
            nivel: catNivel,
            orden,
          })
          toast.success("Categoría creada")
        }
        setCatDialogOpen(false)
        setEditCat(null)
      } catch {
        toast.error("Error al guardar categoría")
      }
    })
  }

  function openCreateDoc() {
    if (!canCreateDocumento) return
    setEditDoc(null)
    setUploadedFile(null)
    setDocDireccion("")
    setDocSubcategoria("")
    setDocTipoDocumental("")
    setEstado("borrador")
    setDialogOpen(true)
  }

  function openEditDoc(doc: DocRow) {
    if (!canEditDocumento) return
    setEditDoc(doc)
    setUploadedFile(null)
    const j = clasificarDocumento(doc.archivo || doc.nombreArchivo, doc.titulo)
    setDocDireccion(doc.direccion || j.direccionNombre)
    setDocSubcategoria(doc.subcategoria || j.subcategoriaNombre)
    setDocTipoDocumental(doc.tipoDocumental || j.tipoDocumental)
    setEstado(doc.estado)
    setDialogOpen(true)
  }

  function handleDeleteDoc(documentId: string) {
    if (!canDeleteDocumento) {
      toast.error("No tienes permiso para eliminar documentos")
      return
    }

    startTransition(async () => {
      try {
        await eliminarDocumento(documentId)
        toast.success("Movido a papelera")
      } catch {
        toast.error("Error al eliminar")
      }
    })
  }

  function handleDeleteCategory(categoryId: string) {
    if (!canDeleteDocumento) {
      toast.error("No tienes permiso para eliminar categorías")
      return
    }

    startTransition(async () => {
      try {
        await eliminarCategoria(categoryId)
        toast.success("Categoría eliminada")
      } catch {
        toast.error("Error al eliminar categoría")
      }
    })
  }

  // Filtrado de documentos con filtros jerárquicos
  const filteredDocs = useMemo(() => {
    return docsEnriquecidos.filter((d) => {
      const matchSearch =
        !searchQuery ||
        d.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.descripcion && d.descripcion.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (d.categoria && d.categoria.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (d.direccion && d.direccion.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (d.subcategoria && d.subcategoria.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (d.tipoDocumental && d.tipoDocumental.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (d.nombreArchivo && d.nombreArchivo.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchDir = !direccionFiltro || d.direccion === direccionFiltro
      const matchSub = !subcategoriaFiltro || d.subcategoria === subcategoriaFiltro
      const matchTipo = !tipoDocumentalFiltro || d.tipoDocumental === tipoDocumentalFiltro

      return matchSearch && matchDir && matchSub && matchTipo
    })
  }, [docsEnriquecidos, searchQuery, direccionFiltro, subcategoriaFiltro, tipoDocumentalFiltro])

  const selectedDir = useMemo(
    () => (catFolderDirId ? categorias.find((c) => c.id === catFolderDirId) : null),
    [catFolderDirId, categorias]
  )

  const selectedSub = useMemo(
    () => (catFolderSubId ? categorias.find((c) => c.id === catFolderSubId) : null),
    [catFolderSubId, categorias]
  )

  const selectedTipo = useMemo(
    () => (catFolderTipoId ? categorias.find((c) => c.id === catFolderTipoId) : null),
    [catFolderTipoId, categorias]
  )

  // Documentos dentro del tipo documental seleccionado
  const docsEnCategoriaSeleccionada = useMemo(() => {
    if (!selectedTipo) return []
    return docsEnriquecidos.filter((d) => {
      const matchDir = !selectedDir || d.direccion?.toLowerCase() === selectedDir.nombre.toLowerCase()
      const matchSub = !selectedSub || d.subcategoria?.toLowerCase() === selectedSub.nombre.toLowerCase()
      const matchTipo =
        d.tipoDocumental?.toLowerCase() === selectedTipo.nombre.toLowerCase() ||
        d.categoriaId === selectedTipo.id
      return matchDir && matchSub && matchTipo
    })
  }, [selectedDir, selectedSub, selectedTipo, docsEnriquecidos])

  const filteredCategorias = useMemo(() => {
    // Si hay búsqueda activa: buscar en todas las categorías
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim()
      return categorias.filter((c) => {
        return (
          c.nombre.toLowerCase().includes(q) ||
          (c.descripcion && c.descripcion.toLowerCase().includes(q))
        )
      })
    }

    // Modo exploración de carpetas jerárquicas:
    // Nivel 1: Sin dirección seleccionada -> SOLO LAS 4 DIRECCIONES
    if (!catFolderDirId) {
      return categorias.filter((c) => c.nivel === 1)
    }

    // Nivel 2: Con dirección seleccionada -> Subcategorías de esta Dirección
    if (catFolderDirId && !catFolderSubId) {
      return categorias.filter((c) => c.nivel === 2 && c.parentId === catFolderDirId)
    }

    // Nivel 3: Con subcategoría seleccionada -> Las 6 categorías estándar de esta Subcategoría
    if (catFolderDirId && catFolderSubId && !catFolderTipoId) {
      return categorias.filter((c) => c.nivel === 3 && c.parentId === catFolderSubId)
    }

    // Nivel 4: Dentro del tipo documental -> Devolver documentos de esta categoría
    return docsEnCategoriaSeleccionada
  }, [categorias, searchQuery, catFolderDirId, catFolderSubId, catFolderTipoId, docsEnCategoriaSeleccionada])

  const handleDrillDown = (cat: any) => {
    if (cat.nivel === 1) {
      setCatFolderDirId(cat.id)
      setCatFolderSubId(null)
      setCatFolderTipoId(null)
    } else if (cat.nivel === 2) {
      if (!catFolderDirId && cat.parentId) {
        setCatFolderDirId(cat.parentId)
      }
      setCatFolderSubId(cat.id)
      setCatFolderTipoId(null)
    } else if (cat.nivel === 3) {
      if (cat.parentId) {
        setCatFolderSubId(cat.parentId)
        const parentSub = categorias.find((c) => c.id === cat.parentId)
        if (parentSub && parentSub.parentId) {
          setCatFolderDirId(parentSub.parentId)
        }
      }
      setCatFolderTipoId(cat.id)
    }
    setSearchQuery("")
    setCurrentPage(1)
    setSelectedIds([])
  }

  const currentList = tab === "todos" ? filteredDocs : filteredCategorias
  const totalPages = Math.max(1, Math.ceil(currentList.length / pageSize))
  const paginatedList = currentList.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // Subcategorías disponibles en el modal según dirección seleccionada
  const subcategoriasDialogDisponibles = useMemo(() => {
    if (!docDireccion) {
      return ESTRUCTURA_JERARQUICA.flatMap((d) => d.subcategorias)
    }
    const dir = ESTRUCTURA_JERARQUICA.find((d) => d.nombre === docDireccion)
    return dir ? dir.subcategorias : []
  }, [docDireccion])

  // Subcategorías disponibles para el filtro superior
  const subcategoriasFiltroDisponibles = useMemo(() => {
    if (!direccionFiltro) {
      return ESTRUCTURA_JERARQUICA.flatMap((d) => d.subcategorias)
    }
    const dir = ESTRUCTURA_JERARQUICA.find((d) => d.nombre === direccionFiltro)
    return dir ? dir.subcategorias : []
  }, [direccionFiltro])

  // ══════════════════════════════════════════════════════════════
  // EXPORTACIÓN A EXCEL: CATÁLOGO OFICIAL CON ENLACES CLIQUEABLES
  // ══════════════════════════════════════════════════════════════
  function handleExportarExcelDocumentos() {
    try {
      const wb = XLSX.utils.book_new()
      const fechaHoy = new Date().toISOString().slice(0, 10)

      if (tab === "categorias") {
        const rowsCat = [
          ["AGENCIA BOLIVIANA DE CORREOS - CORREOS DE BOLIVIA (AGBC)"],
          ["REPORTE OFICIAL DE CATEGORÍAS DOCUMENTALES JERÁRQUICAS"],
          ["Fecha de emisión:", new Date().toLocaleDateString("es-BO", { day: "2-digit", month: "long", year: "numeric" })],
          ["Total Categorías:", categorias.length],
          [],
          ["Nº", "NIVEL", "NOMBRE DE CATEGORÍA", "CATEGORÍA PADRE", "DESCRIPCIÓN", "FECHA DE CREACIÓN"]
        ]
        categorias.forEach((c: any, idx: number) => {
          const nivelLabel = c.nivel === 1 ? "1 - Dirección" : c.nivel === 2 ? "2 - Subcategoría / Área" : "3 - Tipo Documental"
          const parentCat = categorias.find((p) => p.id === c.parentId)
          rowsCat.push([
            idx + 1,
            nivelLabel,
            c.nombre,
            parentCat ? parentCat.nombre : "— (Principal)",
            c.descripcion || "—",
            c.createdAt ? new Date(c.createdAt).toLocaleDateString("es-BO") : "—"
          ])
        })
        const ws = XLSX.utils.aoa_to_sheet(rowsCat)
        ws["!cols"] = [{ wch: 6 }, { wch: 22 }, { wch: 35 }, { wch: 35 }, { wch: 45 }, { wch: 18 }]
        XLSX.utils.book_append_sheet(wb, ws, "Categorías AGBC")
        XLSX.writeFile(wb, `Categorias_Documentales_AGBC_${fechaHoy}.xlsx`)
        toast.success("Excel de categorías exportado con éxito")
        return
      }

      // Catálogo General de Documentos:
      // Excluye "TIPO DE FECHA", "RESOLUCIÓN ADMINISTRATIVA", "NOMBRE DEL ARCHIVO", "ESTADO"
      // Incluye hipervínculos cliqueables en el Excel para ver/descargar directamente
      const docsToExport = docsEnriquecidos.length > 0 ? docsEnriquecidos : (LISTA_DOCUMENTOS_OFICIALES as any[])
      const rows = [
        ["AGENCIA BOLIVIANA DE CORREOS - CORREOS DE BOLIVIA (AGBC)"],
        ["CATÁLOGO GENERAL DE DOCUMENTOS, NORMATIVAS Y REGLAMENTOS OFICIALES"],
        ["Fecha de generación del reporte:", new Date().toLocaleDateString("es-BO", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })],
        ["Total Documentos Registrados:", docsToExport.length],
        [],
        [
          "Nº",
          "TÍTULO DEL DOCUMENTO",
          "DIRECCIÓN",
          "SUB-ÁREA",
          "CATEGORÍA / TIPO",
          "FECHA DE EMISIÓN / OFICIAL",
          "FORMATO",
          "TAMAÑO",
          "ENLACE AL ARCHIVO"
        ]
      ]

      // Base URL fija de producción para que el archivo Excel funcione globalmente al hacer clic
      const PROD_BASE_URL = "https://intranet.correos.gob.bo"

      docsToExport.forEach((d: any, idx: number) => {
        const fechaOficial = obtenerFechaOficialDocumento(d.archivo, d.titulo, d.nombreArchivo, d.createdAt)
        const relPath = d.archivo?.startsWith("/") ? d.archivo : `/documentos/${d.archivo}`
        const fullUrl = d.archivo ? (d.archivo.startsWith("http") ? d.archivo : `${PROD_BASE_URL}${relPath}`) : ""

        const jerarquia = clasificarDocumento(d.archivo || d.nombreArchivo, d.titulo)
        const direccion = d.direccion || jerarquia.direccionNombre
        const subcategoria = d.subcategoria || jerarquia.subcategoriaNombre
        const tipoDoc = d.tipoDocumental || d.categoria || jerarquia.tipoDocumental

        const ext = d.tipoArchivo ? d.tipoArchivo.toUpperCase() : (d.archivo?.split(".").pop()?.toUpperCase() || "PDF")

        rows.push([
          idx + 1,
          d.titulo,
          direccion,
          subcategoria,
          tipoDoc,
          fechaOficial || "Sin fecha fija",
          ext,
          d.tamano || "—",
          fullUrl ? "Ver / Descargar Documento" : "—"
        ])
      })

      const ws = XLSX.utils.aoa_to_sheet(rows)
      ws["!cols"] = [
        { wch: 6 },   // Nº
        { wch: 55 },  // Título
        { wch: 34 },  // Dirección
        { wch: 32 },  // Sub-área
        { wch: 22 },  // Tipo / Categoría
        { wch: 28 },  // Fecha Oficial
        { wch: 10 },  // Formato
        { wch: 12 },  // Tamaño
        { wch: 32 },  // Enlace
      ]

      // Enriquecer cada celda de enlace con hipervínculo nativo cliqueable en Excel apuntando a producción
      docsToExport.forEach((d: any, idx: number) => {
        if (d.archivo) {
          const relPath = d.archivo?.startsWith("/") ? d.archivo : `/documentos/${d.archivo}`
          const fullUrl = d.archivo.startsWith("http") ? d.archivo : `${PROD_BASE_URL}${relPath}`
          const cellAddress = XLSX.utils.encode_cell({ r: 6 + idx, c: 8 })
          ws[cellAddress] = {
            t: "s",
            f: `HYPERLINK("${fullUrl}", "Ver / Descargar Documento")`,
            v: "Ver / Descargar Documento",
            l: {
              Target: fullUrl,
              Tooltip: "Haga clic para abrir o descargar el documento oficial de la AGBC"
            }
          }
        }
      })

      XLSX.utils.book_append_sheet(wb, ws, "Catálogo AGBC")
      XLSX.writeFile(wb, `Catalogo_Documentos_Normativas_AGBC_${fechaHoy}.xlsx`)
      toast.success("Catálogo oficial exportado exitosamente a Excel con enlaces interactivos")
    } catch (error) {
      console.error("Error al exportar a Excel:", error)
      toast.error("Ocurrió un error al generar el archivo Excel")
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 bg-gradient-to-br from-slate-50 via-blue-50/25 to-amber-50/20 min-h-screen">
      {/* ── Encabezado Institucional ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-3xl border-2 border-[#002F6C]/15 bg-gradient-to-r from-white via-blue-50/30 to-amber-50/30 p-6 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0E5296] text-[#FFCC00] shadow-md ring-2 ring-[#0E5296]/20">
            <FileTextIcon className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-[#002F6C]">
                Gestión Documental y Archivos
              </h1>
              <span className="rounded-full bg-[#0E5296] text-[#FFCC00] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
                AGBC
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Estructura jerárquica por Direcciones, Subcategorías y Tipos Documentales
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canCreateDocumento && (
            <Button
              className="bg-[#0E5296] hover:bg-[#002F6C] text-white font-bold rounded-2xl shadow-md shadow-[#0E5296]/20 cursor-pointer text-xs"
              onClick={() => {
                if (tab === "categorias") {
                  if (catFolderTipoId) {
                    setDocDireccion(selectedDir?.nombre || "")
                    setDocSubcategoria(selectedSub?.nombre || "")
                    setDocTipoDocumental(selectedTipo?.nombre || "")
                    openCreateDoc()
                  } else {
                    setEditCat(null)
                    if (!catFolderDirId) {
                      setCatNivel(1)
                      setCatParentId("")
                    } else if (catFolderDirId && !catFolderSubId) {
                      setCatNivel(2)
                      setCatParentId(catFolderDirId)
                    } else if (catFolderSubId) {
                      setCatNivel(3)
                      setCatParentId(catFolderSubId)
                    }
                    setCatDialogOpen(true)
                  }
                } else {
                  openCreateDoc()
                }
              }}
            >
              <PlusIcon className="mr-1.5 h-4 w-4 text-[#FFCC00]" />
              {tab === "categorias"
                ? catFolderTipoId
                  ? "Subir documento aquí"
                  : catFolderSubId
                  ? "Nueva Categoría (Nivel 3)"
                  : catFolderDirId
                  ? "Nueva Subcategoría (Nivel 2)"
                  : "Nueva Dirección (Nivel 1)"
                : "Subir nuevo documento"}
            </Button>
          )}
        </div>
      </div>

      {/* ── Tabs de Navegación ── */}
      <div className="flex items-center gap-2 rounded-2xl bg-slate-100/80 p-1.5 border border-[#002F6C]/10 w-fit">
        {([
          { key: "todos" as Tab, label: "Todos los Documentos", icon: FileTextIcon, count: docsEnriquecidos.length },
          { key: "categorias" as Tab, label: "Categorías Jerárquicas", icon: FolderIcon, count: categorias.length },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => handleTabChange(t.key)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all cursor-pointer ${
              tab === t.key
                ? "bg-[#0E5296] text-[#FFCC00] shadow-md shadow-[#0E5296]/20"
                : "text-slate-600 hover:text-[#002F6C] hover:bg-white/60"
            }`}
          >
            <t.icon className="h-4 w-4" />
            <span>{t.label}</span>
            <span className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
              tab === t.key ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
            }`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Tarjetas Métricas ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3.5 rounded-2xl border-2 border-sky-200/90 bg-gradient-to-br from-sky-50 via-blue-50/60 to-white p-4 shadow-xs">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0E5296] text-[#FFCC00]">
            {tab === "categorias" ? <Building2Icon className="h-5 w-5" /> : <FileTextIcon className="h-5 w-5" />}
          </div>
          <div>
            <div className="text-2xl font-black text-[#002F6C]">
              {tab === "categorias" ? categorias.filter((c) => c.nivel === 1).length : docsEnriquecidos.length}
            </div>
            <div className="text-xs text-slate-600 font-bold">
              {tab === "categorias" ? "4 Direcciones (Nivel 1)" : "Total Documentos Registrados"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border-2 border-amber-200/90 bg-gradient-to-br from-amber-50 via-yellow-50/60 to-white p-4 shadow-xs">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFCC00] text-[#002F6C]">
            {tab === "categorias" ? <BriefcaseIcon className="h-5 w-5" /> : <CheckCircle2Icon className="h-5 w-5" />}
          </div>
          <div>
            <div className="text-2xl font-black text-[#002F6C]">
              {tab === "categorias"
                ? categorias.filter((c) => c.nivel === 2).length
                : docsEnriquecidos.filter((d) => d.estado === "publicado").length}
            </div>
            <div className="text-xs text-slate-600 font-bold">
              {tab === "categorias" ? `${categorias.filter((c) => c.nivel === 2).length} Subcategorías (Nivel 2)` : "Publicados / Vigentes"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border-2 border-blue-200/90 bg-gradient-to-br from-blue-50 via-sky-50/50 to-white p-4 shadow-xs">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-200 text-[#002F6C]">
            <FolderIcon className="h-5 w-5 text-[#002F6C]" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#002F6C]">
              {tab === "categorias"
                ? categorias.filter((c) => c.nivel === 3).length
                : categorias.length}
            </div>
            <div className="text-xs text-slate-600 font-bold">
              {tab === "categorias" ? `${categorias.filter((c) => c.nivel === 3).length} Tipos Documentales (6 por área)` : "Categorías Jerárquicas Totales"}
            </div>
          </div>
        </div>
      </div>

      {/* ── Buscador y Filtros Jerárquicos ── */}
      <div className="rounded-2xl border-2 border-[#002F6C]/15 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Input
              type="text"
              placeholder={`Buscar en ${tab === "categorias" ? "categorías" : "documentos"}...`}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="bg-slate-50 border-slate-200 text-xs font-medium focus:border-[#0E5296] focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {/* BOTÓN: "Exportar Catálogo" */}
            <Button
              type="button"
              onClick={handleExportarExcelDocumentos}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs gap-1.5 h-9 cursor-pointer shadow-xs flex items-center px-3.5 transition-all"
              title="Exportar catálogo oficial con hipervínculos interactivos a Excel"
            >
              <FileSpreadsheetIcon className="h-4 w-4 text-[#FFCC00]" />
              <span>Exportar Catálogo</span>
            </Button>

            {/* BOTÓN: "Importar Catálogo" */}
            {canCreateDocumento && (
              <Button
                type="button"
                onClick={() => setImportCatalogOpen(true)}
                className="bg-[#0E5296] hover:bg-[#002F6C] text-white font-bold rounded-xl text-xs gap-1.5 h-9 cursor-pointer shadow-xs flex items-center px-3.5 transition-all"
                title="Importar catálogo desde Excel y sincronizar documentos o cambios"
              >
                <UploadCloudIcon className="h-4 w-4 text-[#FFCC00]" />
                <span>Importar Catálogo</span>
              </Button>
            )}

            <span className="text-xs font-bold text-[#0E5296] bg-blue-50/80 border border-[#0E5296]/20 px-3 py-1.5 rounded-xl shadow-2xs">
              {currentList.length} encontrados
            </span>
          </div>
        </div>

        {/* Filtros Jerárquicos para Documentos */}
        {tab !== "categorias" && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
            {/* Dirección */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#002F6C] text-[11px]">Dirección:</span>
              <Select
                value={direccionFiltro || "__all__"}
                onValueChange={(val) => {
                  setDireccionFiltro(val === "__all__" ? null : val)
                  setSubcategoriaFiltro(null)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="h-8 w-44 rounded-lg border-slate-200 text-xs bg-slate-50">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todas las Direcciones</SelectItem>
                  {ESTRUCTURA_JERARQUICA.map((dir) => (
                    <SelectItem key={dir.codigo} value={dir.nombre}>
                      {dir.codigo} - {dir.nombre.replace("Dirección ", "")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subcategoría */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#002F6C] text-[11px]">Subcategoría:</span>
              <Select
                value={subcategoriaFiltro || "__all__"}
                onValueChange={(val) => {
                  setSubcategoriaFiltro(val === "__all__" ? null : val)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="h-8 w-48 rounded-lg border-slate-200 text-xs bg-slate-50">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todas las Áreas</SelectItem>
                  {subcategoriasFiltroDisponibles.map((sub) => (
                    <SelectItem key={sub.codigo} value={sub.nombre}>
                      {sub.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo Documental */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#002F6C] text-[11px]">Tipo:</span>
              <Select
                value={tipoDocumentalFiltro || "__all__"}
                onValueChange={(val) => {
                  setTipoDocumentalFiltro(val === "__all__" ? null : val)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="h-8 w-36 rounded-lg border-slate-200 text-xs bg-slate-50">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos los Tipos</SelectItem>
                  {TIPOS_DOCUMENTALES.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(direccionFiltro || subcategoriaFiltro || tipoDocumentalFiltro || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setDireccionFiltro(null)
                  setSubcategoriaFiltro(null)
                  setTipoDocumentalFiltro(null)
                  setSearchQuery("")
                  setCurrentPage(1)
                }}
                className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
              >
                <RotateCcwIcon className="h-3 w-3" />
                Limpiar filtros
              </button>
            )}
          </div>
        )}

        {/* Explorador de Navegación por Carpetas Jerárquicas */}
        {tab === "categorias" && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Ruta Jerárquica de Carpetas (Breadcrumbs) */}
            <div className="flex flex-wrap items-center gap-1.5 font-bold">
              <button
                type="button"
                onClick={() => {
                  setCatFolderDirId(null)
                  setCatFolderSubId(null)
                  setCatFolderTipoId(null)
                  setCurrentPage(1)
                  setSelectedIds([])
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  !catFolderDirId
                    ? "bg-[#0E5296] text-[#FFCC00] shadow-sm shadow-[#0E5296]/20 font-black"
                    : "bg-slate-100 text-[#002F6C] hover:bg-blue-50"
                }`}
              >
                <FolderIcon className="h-4 w-4 text-amber-500" />
                <span>4 Direcciones</span>
              </button>

              {selectedDir && (
                <>
                  <ChevronRightIcon className="h-4 w-4 text-slate-400" />
                  <button
                    type="button"
                    onClick={() => {
                      setCatFolderSubId(null)
                      setCatFolderTipoId(null)
                      setCurrentPage(1)
                      setSelectedIds([])
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      catFolderDirId && !catFolderSubId
                        ? "bg-[#0E5296] text-[#FFCC00] shadow-sm shadow-[#0E5296]/20 font-black"
                        : "bg-slate-100 text-[#002F6C] hover:bg-blue-50"
                    }`}
                  >
                    <FolderOpenIcon className="h-4 w-4 text-amber-500" />
                    <span>{selectedDir.nombre}</span>
                  </button>
                </>
              )}

              {selectedSub && (
                <>
                  <ChevronRightIcon className="h-4 w-4 text-slate-400" />
                  <button
                    type="button"
                    onClick={() => {
                      setCatFolderTipoId(null)
                      setCurrentPage(1)
                      setSelectedIds([])
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      catFolderSubId && !catFolderTipoId
                        ? "bg-[#0E5296] text-[#FFCC00] shadow-sm shadow-[#0E5296]/20 font-black"
                        : "bg-slate-100 text-[#002F6C] hover:bg-blue-50"
                    }`}
                  >
                    <FolderOpenIcon className="h-4 w-4 text-purple-500" />
                    <span>{selectedSub.nombre}</span>
                  </button>
                </>
              )}

              {selectedTipo && (
                <>
                  <ChevronRightIcon className="h-4 w-4 text-slate-400" />
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-white shadow-sm font-black">
                    <FileTextIcon className="h-4 w-4 text-[#002F6C]" />
                    <span>{selectedTipo.nombre}</span>
                  </span>
                </>
              )}
            </div>

            {/* Botón Volver si estamos dentro de alguna carpeta */}
            {(catFolderDirId || catFolderSubId || catFolderTipoId) && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  if (catFolderTipoId) {
                    setCatFolderTipoId(null)
                  } else if (catFolderSubId) {
                    setCatFolderSubId(null)
                  } else if (catFolderDirId) {
                    setCatFolderDirId(null)
                  }
                  setCurrentPage(1)
                  setSelectedIds([])
                }}
                className="h-8 px-3 rounded-xl border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-[#002F6C] font-bold text-xs gap-1.5 cursor-pointer shadow-xs ml-auto"
              >
                <ArrowLeftIcon className="h-3.5 w-3.5 text-[#0E5296]" />
                <span>
                  Volver a{" "}
                  {catFolderTipoId
                    ? "Categorías"
                    : catFolderSubId
                    ? "Subcategorías"
                    : "Direcciones"}
                </span>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ── Barra Flotante de Selección Múltiple ── */}
      {selectedIds.length > 0 && (
        <div className="rounded-2xl border-2 border-[#0E5296]/30 bg-gradient-to-r from-blue-50 via-white to-amber-50 p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-md animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 rounded-full bg-[#0E5296] animate-ping" />
            <div>
              <span className="text-xs font-black text-[#002F6C]">
                {selectedIds.length} {tab === "categorias" ? "categoría(s) seleccionada(s)" : "documento(s) seleccionado(s)"}
              </span>
              <p className="text-[11px] text-slate-500 font-medium">
                Acciones masivas sobre los elementos seleccionados
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedIds([])}
              className="h-8 px-3 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Deseleccionar todos
            </Button>
            {canDeleteDocumento && (
              <>
                {tab !== "categorias" && (
                  <Button
                    type="button"
                    size="sm"
                    disabled={isProcessingBulk}
                    onClick={handleBulkEnviarPapelera}
                    className="h-8 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2Icon className="h-3.5 w-3.5" />
                    Enviar a papelera ({selectedIds.length})
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  disabled={isProcessingBulk}
                  onClick={() => setShowPermanentDeleteModal(true)}
                  className="h-8 px-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <AlertTriangleIcon className="h-3.5 w-3.5" />
                  {tab === "categorias" ? "Eliminar categorías" : "Eliminar permanentemente"} ({selectedIds.length})
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* VISTA EN TABLA ESTRUCTURADA Y RESPONSIVA AGBC                  */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="rounded-3xl border-2 border-[#002F6C]/15 bg-white p-4 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[750px]">
            <thead>
              <tr className="border-b-2 border-slate-100 bg-gradient-to-r from-sky-50/70 via-blue-50/50 to-amber-50/50 text-[11px] font-black uppercase text-[#002F6C] tracking-wider">
                <th className="py-3 px-3 text-center w-10">
                  <button
                    type="button"
                    onClick={() => handleSelectAll(currentList)}
                    className="text-[#002F6C] hover:text-[#0E5296] transition-colors p-0.5 cursor-pointer"
                    title={selectedIds.length === currentList.length && currentList.length > 0 ? "Deseleccionar todos" : "Seleccionar todos"}
                  >
                    {selectedIds.length > 0 && selectedIds.length === currentList.length ? (
                      <CheckSquareIcon className="h-4 w-4 text-[#0E5296]" />
                    ) : (
                      <SquareIcon className="h-4 w-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-4">{tab === "categorias" && !catFolderTipoId ? "Categoría / Carpeta" : "Documento"}</th>
                <th className="py-3 px-4">{tab === "categorias" && !catFolderTipoId ? "Jerarquía / Pertenece a" : "Dirección / Área"}</th>
                <th className="py-3 px-4">{tab === "categorias" && !catFolderTipoId ? "Contenido / Sub-niveles" : "Tipo Documental"}</th>
                <th className="py-3 px-4">{tab === "categorias" && !catFolderTipoId ? "Fecha Creación" : "Fecha Oficial"}</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {currentList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                    {tab === "categorias" && catFolderTipoId ? (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FolderOpenIcon className="h-10 w-10 text-amber-400 stroke-1" />
                        <p className="text-sm font-bold text-[#002F6C]">No hay documentos en {selectedTipo?.nombre} todavía</p>
                        <p className="text-xs text-slate-400">
                          Esta categoría ({selectedDir?.nombre} &gt; {selectedSub?.nombre}) está lista para recibir documentos.
                        </p>
                        {canCreateDocumento && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setDocDireccion(selectedDir?.nombre || "")
                              setDocSubcategoria(selectedSub?.nombre || "")
                              setDocTipoDocumental(selectedTipo?.nombre || "")
                              openCreateDoc()
                            }}
                            className="mt-2 bg-[#0E5296] hover:bg-[#002F6C] text-white text-xs font-bold rounded-xl cursor-pointer"
                          >
                            <PlusIcon className="mr-1.5 h-3.5 w-3.5 text-[#FFCC00]" />
                            Subir documento a {selectedTipo?.nombre}
                          </Button>
                        )}
                      </div>
                    ) : (
                      <span>No hay registros en {tab === "categorias" ? "Categorías" : "Todos los Documentos"}.</span>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedList.map((item: any) => {
                  const isCat = tab === "categorias" && !catFolderTipoId && !item.tipoArchivo
                  const Icon = isCat ? FolderIcon : getFileIcon(item.tipoArchivo)
                  const iconColor = isCat ? "#FF8800" : getFileColor(item.tipoArchivo)

                  if (isCat) {
                    const parentCat = categorias.find((p) => p.id === item.parentId)
                    const nivel = item.nivel || 1
                    const subCatsCount = categorias.filter((c) => c.parentId === item.id).length
                    const docsCount = nivel === 1
                      ? docsEnriquecidos.filter((d) => d.direccion?.toLowerCase() === item.nombre.toLowerCase()).length
                      : nivel === 2
                      ? docsEnriquecidos.filter((d) => d.subcategoria?.toLowerCase() === item.nombre.toLowerCase()).length
                      : docsEnriquecidos.filter((d) => (selectedSub ? d.subcategoria?.toLowerCase() === selectedSub.nombre.toLowerCase() : true) && (d.tipoDocumental?.toLowerCase() === item.nombre.toLowerCase() || d.categoriaId === item.id)).length

                    const nivelBadge =
                      nivel === 1
                        ? { label: "Nivel 1 • Dirección", bg: "bg-blue-50 text-[#002F6C] border-blue-200" }
                        : nivel === 2
                        ? { label: "Nivel 2 • Subcategoría", bg: "bg-purple-50 text-purple-700 border-purple-200" }
                        : { label: "Nivel 3 • Tipo Documental", bg: "bg-amber-50 text-amber-800 border-amber-200" }

                    return (
                      <tr
                        key={item.id}
                        onClick={() => handleDrillDown(item)}
                        className="hover:bg-amber-50/40 transition-colors group cursor-pointer"
                      >
                        <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleToggleSelect(item.id)}
                            className="text-[#0E5296] hover:scale-110 transition-transform p-0.5 cursor-pointer"
                          >
                            {selectedIds.includes(item.id) ? (
                              <CheckSquareIcon className="h-4 w-4 text-[#0E5296]" />
                            ) : (
                              <SquareIcon className="h-4 w-4 text-slate-300 group-hover:text-slate-400" />
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-black shadow-xs border ${
                              nivel === 1
                                ? "bg-amber-50 text-amber-600 border-amber-200 group-hover:bg-amber-500 group-hover:text-white transition-colors"
                                : nivel === 2
                                ? "bg-purple-50 text-purple-600 border-purple-200 group-hover:bg-purple-600 group-hover:text-white transition-colors"
                                : "bg-blue-50 text-blue-600 border-blue-200 group-hover:bg-[#0E5296] group-hover:text-white transition-colors"
                            }`}>
                              {nivel === 1 ? <Building2Icon className="h-5 w-5" /> : nivel === 2 ? <BriefcaseIcon className="h-5 w-5" /> : <FolderIcon className="h-5 w-5" />}
                            </div>
                            <div>
                              <p className="font-bold text-[#002F6C] text-sm group-hover:text-[#0E5296] transition-colors flex items-center gap-1.5">
                                <span>{item.nombre}</span>
                                <ChevronRightIcon className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </p>
                              <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[9.5px] font-bold border mt-0.5 ${nivelBadge.bg}`}>
                                {nivelBadge.label}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {parentCat ? (
                            <span className="font-bold text-[#0E5296] text-xs">
                              {parentCat.nombre}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs italic">
                              — Raíz Institucional
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 max-w-[280px]">
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-slate-700">
                              {nivel === 1
                                ? `${subCatsCount} Subcategorías disponibles`
                                : nivel === 2
                                ? `6 Categorías estándar (${docsCount} docs)`
                                : `${docsCount} Documentos registrados`}
                            </p>
                            {item.descripcion && (
                              <p className="text-slate-500 truncate text-[11px]">
                                {item.descripcion}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-slate-500 text-xs font-medium">
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString("es-BO") : "—"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDrillDown(item)}
                              className="h-8 px-2.5 rounded-xl text-xs font-bold text-[#0E5296] hover:bg-blue-50 cursor-pointer hidden sm:flex items-center gap-1"
                              title="Abrir carpeta y ver contenido"
                            >
                              <span>{nivel === 3 ? "Ver docs" : "Abrir"}</span>
                              <ChevronRightIcon className="h-3.5 w-3.5" />
                            </Button>
                            {canEditDocumento && (
                              <button
                                onClick={() => {
                                  setEditCat(item)
                                  setCatNivel(item.nivel || 1)
                                  setCatParentId(item.parentId || "")
                                  setCatDialogOpen(true)
                                }}
                                className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-[#002F6C] hover:bg-[#0E5296] hover:text-white transition-colors cursor-pointer"
                                title="Editar categoría"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                            )}
                            {canDeleteDocumento && (
                              <button
                                onClick={() => handleDeleteCategory(item.id)}
                                className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                                title="Eliminar categoría"
                              >
                                <Trash2Icon className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  }

                  // Vista de Fila de Documento
                  const fechaOficial = obtenerFechaOficialDocumento(item.archivo, item.titulo, item.nombreArchivo, item.createdAt)

                  return (
                    <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelect(item.id)}
                          className="text-[#0E5296] hover:scale-110 transition-transform p-0.5 cursor-pointer"
                        >
                          {selectedIds.includes(item.id) ? (
                            <CheckSquareIcon className="h-4 w-4 text-[#0E5296]" />
                          ) : (
                            <SquareIcon className="h-4 w-4 text-slate-300 group-hover:text-slate-400" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFCC00] text-[#002F6C] font-black shadow-xs">
                            <Icon className="h-5 w-5" style={{ color: iconColor }} />
                          </div>
                          <div>
                            <p className="font-bold text-[#002F6C] line-clamp-1">{item.titulo}</p>
                            {item.nombreArchivo && (
                              <p className="text-[10px] text-slate-400 truncate max-w-[240px] font-mono">{item.nombreArchivo}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-black text-[#002F6C] text-[11px]">
                            {item.direccion ? item.direccion.replace("Dirección ", "") : "AGBC"}
                          </span>
                          <span className="text-[10.5px] text-slate-500 font-medium">
                            {item.subcategoria || "Área General"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-black text-[#0E5296]">
                          {item.tipoDocumental || item.categoria || "Normativa"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-xs text-[#002F6C]">
                            {fechaOficial}
                          </span>
                          {item.tamano && (
                            <span className="text-[10px] text-slate-400">
                              {item.tamano}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.archivo && (
                            <button
                              onClick={() => {
                                setPreviewDoc(item)
                                registrarAccionDocumentoAction({
                                  documentoId: item.id,
                                  titulo: item.titulo,
                                  accion: "Visualizó documento",
                                }).catch(() => {})
                              }}
                              className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-[#002F6C] hover:bg-[#0E5296] hover:text-white transition-colors cursor-pointer"
                              title="Ver archivo"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                          )}
                          {item.archivo && (
                            <a
                              href={`${getDocumentUrl(item.archivo)}?download=1`}
                              download={item.nombreArchivo ?? "documento"}
                              onClick={() => {
                                registrarAccionDocumentoAction({
                                  documentoId: item.id,
                                  titulo: item.titulo,
                                  accion: "Descargó documento",
                                }).catch(() => {})
                              }}
                              className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer"
                              title="Descargar"
                            >
                              <DownloadIcon className="h-4 w-4" />
                            </a>
                          )}
                          {canEditDocumento && (
                            <button
                              onClick={() => openEditDoc(item)}
                              className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-[#002F6C] hover:bg-[#0E5296] hover:text-white transition-colors cursor-pointer"
                              title="Editar"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                          )}
                          {canDeleteDocumento && (
                            <button
                              onClick={() => handleDeleteDoc(item.id)}
                              className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                              title="Eliminar"
                            >
                              <Trash2Icon className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación Centrada al pie de tabla */}
        {totalPages > 1 && (
          <div className="mt-4 flex flex-col items-center justify-center gap-2 pt-3 border-t border-[#002F6C]/10 text-center">
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#002F6C] shadow-xs hover:bg-slate-50 disabled:opacity-30 cursor-pointer transition-colors"
                title="Página anterior"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-1">
                {buildPagination(currentPage, totalPages).map((item, idx) => {
                  if (item === "ellipsis") {
                    return (
                      <span key={`ellipsis-${idx}`} className="px-1 text-xs font-bold text-slate-400">
                        ...
                      </span>
                    )
                  }
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setCurrentPage(item)}
                      className={`h-7 w-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        currentPage === item
                          ? "bg-[#0E5296] text-white shadow-xs"
                          : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                      }`}
                    >
                      {item}
                    </button>
                  )
                })}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage >= totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#002F6C] shadow-xs hover:bg-slate-50 disabled:opacity-30 cursor-pointer transition-colors"
                title="Siguiente página"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>

            <span className="text-[11px] font-medium text-slate-400">
              Página {currentPage} de {totalPages} • Mostrando {Math.min(currentList.length, (currentPage - 1) * pageSize + 1)} - {Math.min(currentList.length, currentPage * pageSize)} de {currentList.length} registros
            </span>
          </div>
        )}
      </div>

      {/* ── MODAL NUEVO / EDITAR DOCUMENTO CON JERARQUÍA ── */}
      {canCreateDocumento || canEditDocumento ? (
        <Dialog
          open={dialogOpen}
          onOpenChange={(v) => {
            if (!v) {
              setDialogOpen(false)
              setEditDoc(null)
              setUploadedFile(null)
              setDocDireccion("")
              setDocSubcategoria("")
              setDocTipoDocumental("")
              setEstado("borrador")
            }
          }}
        >
          <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-160 max-h-[92vh] overflow-y-auto p-0 gap-0 rounded-2xl border-border/50">
            <div className="flex h-1.5 w-full rounded-t-2xl overflow-hidden">
              <div className="flex-1 bg-[#C41E3A]" />
              <div className="flex-1 bg-[#FFB300]" />
              <div className="flex-1 bg-[#2E7D32]" />
            </div>

            <DialogHeader className="px-6 pt-5 pb-0">
              <DialogTitle className="text-xl font-bold tracking-tight text-[#002F6C]">
                {editDoc ? "Editar documento" : "Subir nuevo documento"}
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                Asigna la Dirección, Subcategoría y Tipo Documental institucional correspondiente
              </p>
            </DialogHeader>

            <form onSubmit={handleDocSubmit} className="space-y-4 px-6 pb-6 pt-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#002F6C]">Título del documento *</Label>
                <Input
                  name="titulo"
                  required
                  defaultValue={editDoc?.titulo}
                  placeholder="Ej. Reglamento Específico del Sistema de Personal"
                  className="h-11 w-full rounded-xl border-slate-200 focus:border-[#0E5296] text-sm"
                />
              </div>

              {/* Cascada de selección jerárquica en 3 niveles */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-3">
                <span className="text-xs font-black text-[#002F6C] uppercase tracking-wider block">
                  Clasificación Institucional (3 Niveles)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* 1. Dirección */}
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-slate-700">1. Dirección *</Label>
                    <Select
                      value={docDireccion || "__none__"}
                      onValueChange={(val) => {
                        const v = val === "__none__" ? "" : val
                        setDocDireccion(v)
                        setDocSubcategoria("")
                      }}
                    >
                      <SelectTrigger className="h-9 rounded-xl text-xs bg-white">
                        <SelectValue placeholder="Dirección" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Sin Dirección fija</SelectItem>
                        {ESTRUCTURA_JERARQUICA.map((dir) => (
                          <SelectItem key={dir.codigo} value={dir.nombre}>
                            {dir.codigo} - {dir.nombre.replace("Dirección ", "")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 2. Subcategoría */}
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-slate-700">2. Subcategoría *</Label>
                    <Select
                      value={docSubcategoria || "__none__"}
                      onValueChange={(val) => setDocSubcategoria(val === "__none__" ? "" : val)}
                    >
                      <SelectTrigger className="h-9 rounded-xl text-xs bg-white">
                        <SelectValue placeholder="Área" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Área General</SelectItem>
                        {subcategoriasDialogDisponibles.map((sub) => (
                          <SelectItem key={sub.codigo} value={sub.nombre}>
                            {sub.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 3. Tipo Documental */}
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-slate-700">3. Tipo *</Label>
                    <Select
                      value={docTipoDocumental || "__none__"}
                      onValueChange={(val) => setDocTipoDocumental(val === "__none__" ? "" : val)}
                    >
                      <SelectTrigger className="h-9 rounded-xl text-xs bg-white">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Normativa</SelectItem>
                        {TIPOS_DOCUMENTALES.map((tipo) => (
                          <SelectItem key={tipo} value={tipo}>
                            {tipo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#002F6C]">Descripción o alcance</Label>
                <Input
                  name="descripcion"
                  defaultValue={editDoc?.descripcion ?? ""}
                  placeholder="Descripción breve del contenido o alcance de este documento"
                  className="h-11 w-full rounded-xl border-slate-200 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#002F6C]">Estado de publicación</Label>
                <Select value={estado} onValueChange={setEstado}>
                  <SelectTrigger className="h-11 w-full rounded-xl border-slate-200 text-sm">
                    <SelectValue placeholder="Selecciona un estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="publicado">Publicado (Visible en Intranet)</SelectItem>
                    <SelectItem value="borrador">Borrador (Solo Administradores)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Archivo adjunto */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#002F6C]">Archivo oficial</Label>
                {uploadedFile ? (
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                      <FileIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate text-emerald-900">{uploadedFile.nombre}</p>
                      <p className="text-[10px] text-emerald-700">{uploadedFile.tamano}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUploadedFile(null)}
                      className="text-slate-400 hover:text-red-500 cursor-pointer p-1"
                    >
                      <XIcon className="h-4 w-4" />
                    </button>
                  </div>
                ) : editDoc?.archivo ? (
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                    <span className="font-mono text-slate-600 truncate max-w-xs">{editDoc.nombreArchivo || editDoc.archivo}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-lg text-xs"
                    >
                      Reemplazar
                    </Button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-2xl hover:border-[#0E5296] hover:bg-blue-50/20 transition-all cursor-pointer text-center"
                  >
                    <UploadIcon className="h-7 w-7 text-slate-400 mb-2" />
                    <span className="text-xs font-bold text-[#002F6C]">Haz clic para seleccionar archivo</span>
                    <span className="text-[10px] text-slate-400">PDF, Word, Excel o Imágenes oficiales</span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) handleFileUpload(f)
                  }}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => {
                    setDialogOpen(false)
                    setEditDoc(null)
                    setUploadedFile(null)
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isPending || uploading}
                  className="rounded-xl border-0 bg-[#0E5296] hover:bg-[#002F6C] font-bold text-white shadow-md shadow-[#0E5296]/20 cursor-pointer"
                >
                  {isPending ? "Guardando..." : "Guardar documento"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      ) : null}

      {/* ── MODAL NUEVA / EDITAR CATEGORÍA JERÁRQUICA ── */}
      {canCreateDocumento || canEditDocumento ? (
        <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
          <DialogContent className="p-0 gap-0 overflow-hidden rounded-2xl max-w-md">
            <div className="h-1.5 w-full bg-[#0E5296]" />
            <div className="p-6">
              <DialogHeader>
                <DialogTitle className="text-lg font-black text-[#002F6C]">
                  {editCat ? "Editar Categoría Jerárquica" : "Nueva Categoría Institucional"}
                </DialogTitle>
                <p className="text-xs text-slate-500 font-medium">
                  Configura la categoría dentro de la jerarquía de Direcciones y Áreas
                </p>
              </DialogHeader>

              <form onSubmit={handleCatSubmit} className="space-y-4 pt-4">
                {/* Nivel Jerárquico */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#002F6C]">Nivel Jerárquico *</Label>
                  <Select
                    value={String(catNivel)}
                    onValueChange={(val) => {
                      setCatNivel(Number(val))
                      setCatParentId("")
                    }}
                  >
                    <SelectTrigger className="h-10 rounded-xl text-xs bg-slate-50">
                      <SelectValue placeholder="Seleccionar Nivel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Nivel 1 • Dirección Principal</SelectItem>
                      <SelectItem value="2">Nivel 2 • Subcategoría / Área</SelectItem>
                      <SelectItem value="3">Nivel 3 • Tipo Documental</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Si es Nivel 2: Selección de Dirección Padre */}
                {catNivel === 2 && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-[#002F6C]">Dirección a la que pertenece *</Label>
                    <Select
                      value={catParentId || "__none__"}
                      onValueChange={(val) => setCatParentId(val === "__none__" ? "" : val)}
                    >
                      <SelectTrigger className="h-10 rounded-xl text-xs bg-slate-50">
                        <SelectValue placeholder="Seleccionar Dirección" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Sin Dirección padre fija</SelectItem>
                        {categorias.filter((c) => c.nivel === 1).map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Si es Nivel 3: Selección de Subcategoría Padre */}
                {catNivel === 3 && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-[#002F6C]">Subcategoría / Área a la que pertenece *</Label>
                    <Select
                      value={catParentId || "__none__"}
                      onValueChange={(val) => setCatParentId(val === "__none__" ? "" : val)}
                    >
                      <SelectTrigger className="h-10 rounded-xl text-xs bg-slate-50">
                        <SelectValue placeholder="Seleccionar Subcategoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Sin Subcategoría fija</SelectItem>
                        {categorias.filter((c) => c.nivel === 2).map((c) => {
                          const parentDir = categorias.find((p) => p.id === c.parentId)
                          return (
                            <SelectItem key={c.id} value={c.id}>
                              {c.nombre} {parentDir ? `(${parentDir.nombre.replace("Dirección ", "")})` : ""}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#002F6C]">Nombre de la Categoría *</Label>
                  <Input
                    name="nombre"
                    required
                    defaultValue={editCat?.nombre}
                    placeholder="Ej. Planificación, Recursos Humanos, Reglamentos..."
                    className="h-11 rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#002F6C]">Descripción</Label>
                  <Input
                    name="descripcion"
                    defaultValue={editCat?.descripcion ?? ""}
                    placeholder="Breve detalle del alcance de esta categoría"
                    className="h-11 rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#002F6C]">Orden numérico</Label>
                  <Input
                    name="orden"
                    type="number"
                    defaultValue={editCat?.orden ?? 1}
                    className="h-10 rounded-xl text-sm"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <Button type="button" variant="outline" className="rounded-xl" onClick={() => setCatDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="rounded-xl bg-[#0E5296] hover:bg-[#002F6C] text-white border-0 font-bold shadow-md shadow-[#0E5296]/20 cursor-pointer"
                  >
                    {isPending ? "Guardando..." : "Guardar categoría"}
                  </Button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      ) : null}

      {/* ── VISUALIZADOR PREVIEW DOCUMENTO ── */}
      <Dialog open={!!previewDoc} onOpenChange={(v) => { if (!v) setPreviewDoc(null) }}>
        <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-225 max-h-[92vh] overflow-hidden p-0 gap-0 rounded-2xl border-border/50">
          <DialogHeader className="sr-only">
            <DialogTitle>{previewDoc?.titulo ?? "Vista previa"}</DialogTitle>
          </DialogHeader>

          <div className="h-1.5 w-full bg-[#0E5296]" />

          {previewDoc && (
            (() => {
              const fileEffectiveUrl = getDocumentUrl(previewDoc.archivo)
              const downloadUrl = `${fileEffectiveUrl}?download=1`
              const fechaOficial = obtenerFechaOficialDocumento(previewDoc.archivo, previewDoc.titulo, previewDoc.nombreArchivo, previewDoc.createdAt)

              return (
                <>
                  <div className="flex items-center justify-between border-b border-border/40 px-6 py-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: getFileColor(previewDoc.tipoArchivo) + "15" }}>
                        {(() => {
                          const Icon = getFileIcon(previewDoc.tipoArchivo)
                          return <Icon className="h-5 w-5" style={{ color: getFileColor(previewDoc.tipoArchivo) }} />
                        })()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate text-[#002F6C]">{previewDoc.titulo}</p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 flex-wrap">
                          <span>{previewDoc.nombreArchivo}</span>
                          <span>•</span>
                          <span>{previewDoc.tamano}</span>
                          <span>•</span>
                          <span className="font-bold text-[#002F6C] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                            Fecha Oficial: {fechaOficial}
                          </span>
                        </p>
                      </div>
                    </div>
                    <a
                      href={downloadUrl}
                      download={previewDoc.nombreArchivo ?? "archivo"}
                      onClick={() => {
                        registrarAccionDocumentoAction({
                          documentoId: previewDoc.id,
                          titulo: previewDoc.titulo,
                          accion: "Descargó documento",
                        }).catch(() => {})
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#0E5296] hover:bg-[#002F6C] px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#0E5296]/20 transition-all cursor-pointer"
                    >
                      <DownloadIcon className="h-3.5 w-3.5 text-[#FFB800]" />
                      Descargar
                    </a>
                  </div>

                  <div className="flex-1 overflow-auto bg-muted/20" style={{ height: "70vh" }}>
                    {(() => {
                      const t = (previewDoc.tipoArchivo || "").toLowerCase()
                      const fileUrl = (previewDoc.archivo || "").toLowerCase()
                      const fileName = (previewDoc.nombreArchivo || "").toLowerCase()
                      
                      const isPdf = t.includes("pdf") || fileUrl.endsWith(".pdf") || fileName.endsWith(".pdf")
                      const isImage = ["jpg", "jpeg", "png", "webp", "gif"].some(ext => t.includes(ext) || fileUrl.endsWith("." + ext) || fileName.endsWith("." + ext))
                      const isExcel = t.includes("xls") || t.includes("sheet") || t.includes("csv") || fileUrl.endsWith(".xlsx") || fileUrl.endsWith(".xls") || fileUrl.endsWith(".csv") || fileName.endsWith(".xlsx") || fileName.endsWith(".xls") || fileName.endsWith(".csv")
                      const isWord = t.includes("doc") || t.includes("word") || fileUrl.endsWith(".docx") || fileUrl.endsWith(".doc") || fileName.endsWith(".docx") || fileName.endsWith(".doc")

                      if (isPdf) {
                        return (
                          <div className="flex flex-col h-full w-full">
                            <iframe src={fileEffectiveUrl} className="flex-1 w-full border-0 min-h-[500px]" title={previewDoc.titulo} />
                          </div>
                        )
                      }

                      if (isImage) {
                        return (
                          <div className="flex items-center justify-center p-6 h-full">
                            <img src={fileEffectiveUrl} alt={previewDoc.titulo} className="max-h-[60vh] max-w-full object-contain rounded-xl shadow-md" />
                          </div>
                        )
                      }

                      if (isExcel || isWord) {
                        return (
                          <DocumentContentViewer
                            url={fileEffectiveUrl}
                            fileName={previewDoc.nombreArchivo ?? previewDoc.titulo}
                            title={previewDoc.titulo}
                            tipoArchivo={previewDoc.tipoArchivo}
                          />
                        )
                      }

                      return (
                        <div className="flex flex-col items-center justify-center p-8 text-center h-full">
                          <FileTextIcon className="h-14 w-14 text-slate-300 mb-3" />
                          <h4 className="font-bold text-[#002F6C]">{previewDoc.titulo}</h4>
                          <p className="text-xs text-slate-500 max-w-md mt-1">{previewDoc.descripcion}</p>
                        </div>
                      )
                    })()}
                  </div>
                </>
              )
            })()
          )}
        </DialogContent>
      </Dialog>

      <ImportarCatalogoDialog
        open={importCatalogOpen}
        onClose={() => setImportCatalogOpen(false)}
        existingDocs={docsEnriquecidos}
        onSuccess={() => {
          // Re-render handled by Server Action revalidatePath
        }}
      />

      {/* ── Modal de Confirmación Fuerte para Eliminación Permanente ── */}
      <Dialog open={showPermanentDeleteModal} onOpenChange={setShowPermanentDeleteModal}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader>
            <div className="flex items-center gap-3 text-red-600">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-100 text-red-600 shadow-2xs">
                <AlertTriangleIcon className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-black text-red-600">
                  Confirmar Eliminación Permanente
                </DialogTitle>
                <p className="text-[11px] text-slate-500 font-medium">
                  Esta acción es destructiva y definitiva
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              ¿Estás seguro de que deseas eliminar permanentemente{" "}
              <strong className="text-red-600 font-black">
                {selectedIds.length} {tab === "categorias" ? "categoría(s)" : "documento(s)"}
              </strong>?
            </p>
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-[11px] text-red-800 font-semibold flex items-start gap-2">
              <AlertTriangleIcon className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <span>
                {tab === "categorias"
                  ? "Las categorías seleccionadas serán eliminadas permanentemente de la base de datos."
                  : "Los documentos seleccionados serán eliminados por completo de la base de datos."}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPermanentDeleteModal(false)}
              disabled={isProcessingBulk}
              className="rounded-xl text-xs font-bold cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleBulkEliminarPermanente}
              disabled={isProcessingBulk}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20 cursor-pointer"
            >
              {isProcessingBulk ? (
                <>
                  <Loader2Icon className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Sí, eliminar permanentemente"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}