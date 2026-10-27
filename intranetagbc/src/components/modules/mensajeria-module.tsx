"use client"

import { useState, useTransition, useMemo, useEffect, useRef } from "react"
import {
  Mail,
  Send,
  Users,
  UserCheck,
  AlertTriangle,
  Info,
  Sparkles,
  Search,
  RotateCcw,
  CheckCircle2,
  Clock,
  Inbox,
  Eye,
  Bell,
  Check,
  X,
  Paperclip,
  Trash2,
  FileText,
  HelpCircle,
  Megaphone,
  Plus,
  Upload,
} from "lucide-react"
import toast from "react-hot-toast"
import {
  type DestinatarioUsuario,
  type InfoDestinatarios,
  type CampanaEnviada,
  enviarMensajeMasivo,
  eliminarMensajeMasivoCampana,
} from "@/actions/mensajeria"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface MensajeriaModuleProps {
  destinatariosData: InfoDestinatarios
  historialInicial: CampanaEnviada[]
  usuarioActualNombre?: string
}

type TipoNotif = "comunicado" | "alerta" | "info" | "sistema"

type PlantillaCustom = {
  id: string
  nombre: string
  asunto: string
  mensaje: string
}

type ArchivoAdjuntoState = {
  file?: File
  nombre: string
  tamano: string
  url?: string
  filePath?: string
  subiendo?: boolean
}

const TIPOS_CONFIG: Record<
  TipoNotif,
  { label: string; icon: typeof Bell; color: string; bg: string; border: string; badgeBg: string }
> = {
  comunicado: {
    label: "Comunicado Oficial",
    icon: Megaphone,
    color: "#002F6C",
    bg: "bg-[#002F6C]/10 text-[#002F6C]",
    border: "border-[#002F6C]/30",
    badgeBg: "bg-[#002F6C] text-white",
  },
  alerta: {
    label: "Urgente / Alerta",
    icon: AlertTriangle,
    color: "#D97706",
    bg: "bg-amber-500/10 text-amber-600",
    border: "border-amber-500/30",
    badgeBg: "bg-amber-500 text-white",
  },
  info: {
    label: "Informativo General",
    icon: Info,
    color: "#0E5296",
    bg: "bg-[#0E5296]/10 text-[#0E5296]",
    border: "border-[#0E5296]/30",
    badgeBg: "bg-[#0E5296] text-white",
  },
  sistema: {
    label: "Aviso de Sistema",
    icon: Bell,
    color: "#7C3AED",
    bg: "bg-purple-500/10 text-purple-600",
    border: "border-purple-500/30",
    badgeBg: "bg-purple-600 text-white",
  },
}

// Plantilla estándar base para primera vez (sin datos inventados)
const PLANTILLA_ESTANDAR_BASE: PlantillaCustom = {
  id: "plantilla-base",
  nombre: "Plantilla Estándar",
  asunto: "[Comunicado Oficial]: Ingrese aquí el asunto del mensaje",
  mensaje:
    "Estimados/as funcionarios/as y personal de la Agencia Boliviana de Correos:\n\nPor medio del presente se comunica que...\n\nPara mayor información o coordinación, comunicarse con la unidad correspondiente.\n\nAtentamente,\nDirección General Ejecutiva\nAgencia Boliviana de Correos",
}

function resolverUrlDocumento(enlace: string): string {
  if (enlace.startsWith("/api/documentos/") || enlace.startsWith("http://") || enlace.startsWith("https://")) {
    return enlace
  }
  return `/api/documentos/${enlace.replace(/^\/?(documentos\/)?/, "")}`
}

export function MensajeriaModule({
  destinatariosData,
  historialInicial,
  usuarioActualNombre = "Administrador",
}: MensajeriaModuleProps) {
  const [activeTab, setActiveTab] = useState<"redactar" | "historial">("redactar")
  const [historial, setHistorial] = useState<CampanaEnviada[]>(historialInicial)
  const [isPending, startTransition] = useTransition()

  // Form State
  const [destinatarioTipo, setDestinatarioTipo] = useState<"todos" | "usuarios">("todos")
  const [usuariosSeleccionados, setUsuariosSeleccionados] = useState<string[]>([])
  const [busquedaUsuario, setBusquedaUsuario] = useState("")

  const [asunto, setAsunto] = useState("")
  const [mensaje, setMensaje] = useState("")
  const [tipo, setTipo] = useState<TipoNotif>("comunicado")

  // Adjunto State
  const [adjunto, setAdjunto] = useState<ArchivoAdjuntoState | null>(null)
  const [subiendoArchivo, setSubiendoArchivo] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Plantillas Personalizables del Admin (persisten en localStorage)
  const [plantillas, setPlantillas] = useState<PlantillaCustom[]>([PLANTILLA_ESTANDAR_BASE])
  const [modalGuardarPlantillaOpen, setModalGuardarPlantillaOpen] = useState(false)
  const [nombreNuevaPlantilla, setNombreNuevaPlantilla] = useState("")

  // Confirm Modal de Envío
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)

  // Delete Campaign Modal
  const [campanaAEliminar, setCampanaAEliminar] = useState<CampanaEnviada | null>(null)
  const [eliminandoCampana, setEliminandoCampana] = useState(false)

  // Historial search/filter
  const [busquedaHistorial, setBusquedaHistorial] = useState("")
  const [filtroTipoHistorial, setFiltroTipoHistorial] = useState<string>("todos")

  // Preview / Detail modal for History item
  const [detalleModalItem, setDetalleModalItem] = useState<CampanaEnviada | null>(null)

  // Cargar plantillas desde localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("agbc_mensajeria_plantillas_v2")
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPlantillas(parsed)
          return
        }
      }
    } catch {}
    setPlantillas([PLANTILLA_ESTANDAR_BASE])
  }, [])

  const guardarPlantillasEnStorage = (nuevas: PlantillaCustom[]) => {
    setPlantillas(nuevas)
    try {
      localStorage.setItem("agbc_mensajeria_plantillas_v2", JSON.stringify(nuevas))
    } catch {}
  }

  const handleCrearPlantilla = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombreNuevaPlantilla.trim()) {
      toast.error("Ingresa un nombre para la plantilla.")
      return
    }
    if (!asunto.trim() && !mensaje.trim()) {
      toast.error("Debes redactar al menos un asunto o mensaje para guardar como plantilla.")
      return
    }

    const nueva: PlantillaCustom = {
      id: `plantilla-${Date.now()}`,
      nombre: nombreNuevaPlantilla.trim(),
      asunto: asunto.trim(),
      mensaje: mensaje.trim(),
    }

    const actualizadas = [...plantillas, nueva]
    guardarPlantillasEnStorage(actualizadas)
    setNombreNuevaPlantilla("")
    setModalGuardarPlantillaOpen(false)
    toast.success(`Plantilla "${nueva.nombre}" guardada con éxito.`)
  }

  const handleEliminarPlantilla = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const filtradas = plantillas.filter((p) => p.id !== id)
    const final = filtradas.length > 0 ? filtradas : [PLANTILLA_ESTANDAR_BASE]
    guardarPlantillasEnStorage(final)
    toast.success("Plantilla eliminada")
  }

  const aplicarPlantilla = (p: PlantillaCustom) => {
    setAsunto(p.asunto)
    setMensaje(p.mensaje)
    toast.success(`Plantilla "${p.nombre}" cargada`)
  }

  // Filtered users for manual selection
  const usuariosFiltrados = useMemo(() => {
    if (!busquedaUsuario.trim()) return destinatariosData.usuarios
    const q = busquedaUsuario.toLowerCase()
    return destinatariosData.usuarios.filter(
      (u) =>
        u.nombreCompleto.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.institutionalEmail.toLowerCase().includes(q) ||
        u.roles.some((r) => r.toLowerCase().includes(q))
    )
  }, [busquedaUsuario, destinatariosData.usuarios])

  // Count target recipients
  const totalDestinatariosCalculados = useMemo(() => {
    if (destinatarioTipo === "todos") {
      return destinatariosData.totalUsuariosActivos
    }
    return usuariosSeleccionados.length
  }, [destinatarioTipo, usuariosSeleccionados, destinatariosData])

  const toggleUsuarioSeleccionado = (id: string) => {
    setUsuariosSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const seleccionarTodosUsuarios = () => {
    setUsuariosSeleccionados(usuariosFiltrados.map((u) => u.id))
  }

  const deseleccionarTodosUsuarios = () => {
    setUsuariosSeleccionados([])
  }

  // Manejo de archivo adjunto
  const handleSeleccionarArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSubiendoArchivo(true)
    const toastId = toast.loading("Cargando documento adjunto...")

    try {
      const formData = new FormData()
      formData.append("archivo", file)

      const res = await fetch("/api/upload/mensajeria", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setAdjunto({
          file,
          nombre: data.nombre,
          tamano: data.tamano,
          url: data.url,
          filePath: data.filePath,
        })
        toast.success(`Documento "${data.nombre}" adjuntado`, { id: toastId })
      } else {
        toast.error(data.error || "No se pudo subir el archivo", { id: toastId })
      }
    } catch {
      toast.error("Error al procesar el archivo adjunto", { id: toastId })
    } finally {
      setSubiendoArchivo(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleRemoverAdjunto = () => {
    setAdjunto(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
    toast("Documento adjunto removido", { icon: "📎" })
  }

  const limpiarFormulario = () => {
    setAsunto("")
    setMensaje("")
    setAdjunto(null)
    setTipo("comunicado")
    setUsuariosSeleccionados([])
    if (fileInputRef.current) fileInputRef.current.value = ""
    toast("Formulario reiniciado", { icon: "🧹" })
  }

  const handleAbrirConfirmacion = (e: React.FormEvent) => {
    e.preventDefault()
    if (!asunto.trim() || asunto.trim().length < 3) {
      toast.error("Por favor ingresa un asunto de al menos 3 caracteres.")
      return
    }
    if (!mensaje.trim() || mensaje.trim().length < 5) {
      toast.error("Por favor redacta un mensaje de al menos 5 caracteres.")
      return
    }
    if (totalDestinatariosCalculados === 0) {
      toast.error("Debes seleccionar al menos un destinatario válido.")
      return
    }
    setConfirmModalOpen(true)
  }

  const handleEnviarMensaje = () => {
    startTransition(async () => {
      try {
        const res = await enviarMensajeMasivo({
          asunto,
          mensaje,
          tipo,
          destinatarioTipo,
          usuarioIds: destinatarioTipo === "usuarios" ? usuariosSeleccionados : undefined,
          adjunto: adjunto
            ? {
                nombre: adjunto.nombre,
                url: adjunto.url || "",
                filePath: adjunto.filePath || null,
              }
            : null,
        })

        if (res.success) {
          toast.success(res.message, { duration: 6000 })
          // Agregar a historial local
          const nuevaCampana: CampanaEnviada = {
            id: `campana-nueva-${Date.now()}`,
            asunto,
            mensaje,
            tipo,
            enlace: adjunto?.url || null,
            creadoPorId: null,
            remitente: usuarioActualNombre,
            fecha: new Date().toISOString(),
            totalEnviados: res.count || totalDestinatariosCalculados,
            totalLeidos: 0,
          }
          setHistorial((prev) => [nuevaCampana, ...prev])
          setConfirmModalOpen(false)
          limpiarFormulario()
        } else {
          toast.error(res.message || "Error al enviar mensaje")
        }
      } catch {
        toast.error("Ocurrió un error inesperado al despachar el mensaje.")
      }
    })
  }

  // Eliminar campaña completa de la bandeja de todos los destinatarios
  const handleConfirmarEliminarCampana = async () => {
    if (!campanaAEliminar) return
    setEliminandoCampana(true)
    const toastId = toast.loading("Eliminando mensaje de todos los usuarios...")

    try {
      const res = await eliminarMensajeMasivoCampana({
        asunto: campanaAEliminar.asunto,
        creadoPorId: campanaAEliminar.creadoPorId,
        fechaTimestamp: campanaAEliminar.fecha,
      })

      if (res.success) {
        toast.success(res.message, { id: toastId })
        setHistorial((prev) => prev.filter((item) => item.id !== campanaAEliminar.id))
        setCampanaAEliminar(null)
      } else {
        toast.error(res.message || "No se pudo eliminar el mensaje", { id: toastId })
      }
    } catch {
      toast.error("Error al procesar la eliminación", { id: toastId })
    } finally {
      setEliminandoCampana(false)
    }
  }

  // Filtered history list
  const historialFiltrado = useMemo(() => {
    return historial.filter((item) => {
      const matchSearch =
        !busquedaHistorial.trim() ||
        item.asunto.toLowerCase().includes(busquedaHistorial.toLowerCase()) ||
        item.mensaje.toLowerCase().includes(busquedaHistorial.toLowerCase()) ||
        item.remitente.toLowerCase().includes(busquedaHistorial.toLowerCase())

      const matchTipo =
        filtroTipoHistorial === "todos" || item.tipo.toLowerCase() === filtroTipoHistorial.toLowerCase()

      return matchSearch && matchTipo
    })
  }, [historial, busquedaHistorial, filtroTipoHistorial])

  const configActual = TIPOS_CONFIG[tipo]
  const IconoTipo = configActual.icon

  return (
    <div className="space-y-6">
      {/* ── ENCABEZADO INSTITUCIONAL ── */}
      <div className="relative overflow-hidden rounded-2xl border border-[#002F6C]/20 bg-gradient-to-r from-[#002F6C] via-[#0E5296] to-[#002F6C] p-6 text-white shadow-xl">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-300 backdrop-blur-md">
              <Mail className="h-3.5 w-3.5" />
              Módulo de Mensajería Masiva
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              Centro de Notificaciones y Mensajería
            </h1>
            <p className="text-sm text-blue-100/90 max-w-2xl">
              Despacha comunicados oficiales y avisos que se entregan tanto en la campana de notificaciones interna como por correo electrónico institucional (@correos.gob.bo / Gmail).
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/10 p-3 text-center backdrop-blur-md border border-white/10 min-w-[110px]">
              <div className="text-2xl font-black text-amber-300">
                {destinatariosData.totalUsuariosActivos}
              </div>
              <div className="text-[11px] font-medium text-blue-100">Usuarios Activos</div>
            </div>
            <div className="rounded-xl bg-white/10 p-3 text-center backdrop-blur-md border border-white/10 min-w-[110px]">
              <div className="text-2xl font-black text-white">
                {historial.length}
              </div>
              <div className="text-[11px] font-medium text-blue-100">Envíos Realizados</div>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="relative z-10 mt-6 flex items-center gap-2 border-t border-white/15 pt-4">
          <button
            type="button"
            onClick={() => setActiveTab("redactar")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "redactar"
                ? "bg-white text-[#002F6C] shadow-lg"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <Send className="h-4 w-4" />
            Redactar Mensaje
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("historial")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "historial"
                ? "bg-white text-[#002F6C] shadow-lg"
                : "bg-white/10 text-white hover:bg-white/20"
            }`}
          >
            <Inbox className="h-4 w-4" />
            Bandeja de Enviados ({historial.length})
          </button>
        </div>
      </div>

      {/* ── TAB 1: REDACTAR MENSAJE (GMAIL STYLE) ── */}
      {activeTab === "redactar" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Compose Card */}
          <div className="lg:col-span-8 space-y-6">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md overflow-hidden">
              {/* Card Header resembling modern Google Workspace composer */}
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-6 py-3.5">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="ml-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Mensaje Institucional Masivo
                  </span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5 font-medium">
                  <Clock className="h-3.5 w-3.5 text-blue-500" />
                  Envío simultáneo: Notificaciones + Correo Oficial
                </div>
              </div>

              <form onSubmit={handleAbrirConfirmacion} className="p-6 space-y-5">
                {/* ── SECCIÓN "PARA:" (SOLO: TODOS O ESPECÍFICOS) ── */}
                <div className="space-y-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-2">
                      <span className="rounded bg-[#002F6C] px-2 py-0.5 text-white font-mono text-xs">
                        Para:
                      </span>
                      Selección de Destinatarios
                    </label>
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800">
                      🎯 {totalDestinatariosCalculados} destinatario(s) seleccionado(s)
                    </span>
                  </div>

                  {/* Mode selector: Solo 2 opciones (Todos / Específicos) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setDestinatarioTipo("todos")}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                        destinatarioTipo === "todos"
                          ? "border-[#002F6C] bg-[#002F6C]/5 dark:bg-[#002F6C]/20 shadow-sm ring-1 ring-[#002F6C]"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <div
                        className={`p-2.5 rounded-xl ${
                          destinatarioTipo === "todos"
                            ? "bg-[#002F6C] text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          Todos los usuarios registrados
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                          Envío general a todo el personal ({destinatariosData.totalUsuariosActivos} activos)
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDestinatarioTipo("usuarios")}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                        destinatarioTipo === "usuarios"
                          ? "border-[#002F6C] bg-[#002F6C]/5 dark:bg-[#002F6C]/20 shadow-sm ring-1 ring-[#002F6C]"
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      <div
                        className={`p-2.5 rounded-xl ${
                          destinatarioTipo === "usuarios"
                            ? "bg-[#002F6C] text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <UserCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          Destinatarios específicos
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                          {usuariosSeleccionados.length > 0
                            ? `${usuariosSeleccionados.length} usuario(s) seleccionado(s)`
                            : "Seleccionar usuarios individualmente"}
                        </div>
                      </div>
                    </button>
                  </div>

                  {/* Mode: Selección Específica de Usuarios */}
                  {destinatarioTipo === "usuarios" && (
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                          <Input
                            placeholder="Buscar por nombre, correo institucional o rol..."
                            value={busquedaUsuario}
                            onChange={(e) => setBusquedaUsuario(e.target.value)}
                            className="pl-8 text-xs h-8 bg-white dark:bg-slate-900"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={seleccionarTodosUsuarios}
                            className="text-[11px] h-8 px-2"
                          >
                            Todos ({usuariosFiltrados.length})
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={deseleccionarTodosUsuarios}
                            className="text-[11px] h-8 px-2"
                          >
                            Limpiar
                          </Button>
                        </div>
                      </div>

                      {/* User Pick List */}
                      <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100 dark:divide-slate-800">
                        {usuariosFiltrados.length === 0 ? (
                          <div className="py-4 text-center text-xs text-slate-600 dark:text-slate-300">
                            No se encontraron usuarios activos con esa búsqueda.
                          </div>
                        ) : (
                          usuariosFiltrados.map((u) => {
                            const seleccionado = usuariosSeleccionados.includes(u.id)
                            return (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() => toggleUsuarioSeleccionado(u.id)}
                                className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all ${
                                  seleccionado
                                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100"
                                    : "hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <Avatar className="h-7 w-7 text-[11px] border">
                                    {u.image ? (
                                      <AvatarImage src={u.image} alt={u.nombreCompleto} />
                                    ) : null}
                                    <AvatarFallback className="bg-slate-200 dark:bg-slate-700">
                                      {u.nombreCompleto.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="truncate">
                                    <div className="text-xs font-semibold truncate">
                                      {u.nombreCompleto}
                                    </div>
                                    <div className="text-[10px] text-slate-600 dark:text-slate-300 truncate">
                                      {u.institutionalEmail} {u.email ? `• ${u.email}` : ""}
                                    </div>
                                  </div>
                                </div>
                                <div
                                  className={`h-4 w-4 rounded border flex items-center justify-center ${
                                    seleccionado
                                      ? "bg-[#002F6C] border-[#002F6C] text-white"
                                      : "border-slate-300 dark:border-slate-600"
                                  }`}
                                >
                                  {seleccionado && <Check className="h-3 w-3" />}
                                </div>
                              </button>
                            )
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* ── TIPO / PRIORIDAD ── */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Tipo de Comunicado / Prioridad
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(Object.keys(TIPOS_CONFIG) as TipoNotif[]).map((t) => {
                      const cfg = TIPOS_CONFIG[t]
                      const ItemIcon = cfg.icon
                      const activo = tipo === t
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTipo(t)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                            activo
                              ? `${cfg.badgeBg} border-transparent shadow-md scale-[1.02]`
                              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                          }`}
                        >
                          <ItemIcon className="h-3.5 w-3.5" />
                          <span className="truncate">{cfg.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* ── ASUNTO ── */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      Asunto
                    </label>
                    <span className="text-[11px] text-slate-600 dark:text-slate-300 font-mono">
                      {asunto.length}/200
                    </span>
                  </div>
                  <Input
                    placeholder="Título del comunicado o asunto oficial..."
                    value={asunto}
                    maxLength={200}
                    onChange={(e) => setAsunto(e.target.value)}
                    className="font-medium text-slate-800 dark:text-slate-100 h-10 border-slate-200 dark:border-slate-800 focus:border-[#002F6C]"
                    required
                  />
                </div>

                {/* ── PLANTILLAS RÁPIDAS (CREADAS POR EL ADMIN) ── */}
                <div className="space-y-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      Plantillas Rápidas:
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setModalGuardarPlantillaOpen(true)}
                      className="text-[11px] h-7 px-2 text-[#002F6C] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Guardar borrador como plantilla
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {plantillas.map((p) => {
                      const esBase = p.id === "plantilla-base"
                      return (
                        <div
                          key={p.id}
                          onClick={() => aplicarPlantilla(p)}
                          className="group inline-flex items-center gap-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 hover:border-[#002F6C] cursor-pointer transition-colors shadow-2xs"
                        >
                          <span>{p.nombre}</span>
                          {!esBase && (
                            <button
                              type="button"
                              onClick={(e) => handleEliminarPlantilla(p.id, e)}
                              className="text-slate-400 hover:text-red-500 ml-1"
                              title="Eliminar plantilla"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* ── CUERPO DEL MENSAJE ── */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      Mensaje / Comunicado
                    </label>
                    <span className="text-[11px] text-slate-600 dark:text-slate-300 font-mono">
                      {mensaje.length} caracteres
                    </span>
                  </div>
                  <Textarea
                    placeholder="Redacta el contenido del mensaje. Se mostrará en las notificaciones internas y se enviará por correo electrónico institucional..."
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    rows={6}
                    className="text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-800 focus:border-[#002F6C] resize-y leading-relaxed text-sm"
                    required
                  />
                </div>

                {/* ── ADJUNTAR DOCUMENTO (CUALQUIER FORMATO) ── */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center justify-between">
                    <span>Adjuntar Documento Institucional (Opcional)</span>
                    <span className="text-[11px] font-normal text-slate-500">
                      Cualquier formato de documento o archivo
                    </span>
                  </label>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleSeleccionarArchivo}
                    className="hidden"
                  />

                  {!adjunto ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col sm:flex-row items-center justify-center gap-3 p-4 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition-colors text-center sm:text-left"
                    >
                      <div className="p-2.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-[#002F6C] dark:text-blue-400">
                        <Upload className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {subiendoArchivo
                            ? "Cargando documento..."
                            : "Haz clic para adjuntar un documento institucional"}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Formatos compatibles: PDF, Word, Excel, PowerPoint, imágenes u otros
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-blue-50/50 dark:bg-blue-950/20">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-[#002F6C] text-white shrink-0">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {adjunto.nombre}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {adjunto.tamano} • Adjunto listo para despacho
                          </div>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoverAdjunto}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 h-8 px-2"
                        title="Quitar documento adjunto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* ── BOTONERA DE ENVÍO ── */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={limpiarFormulario}
                    className="text-xs text-slate-600 dark:text-slate-300 hover:text-red-600"
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1" />
                    Limpiar Borrador
                  </Button>

                  <Button
                    type="submit"
                    disabled={isPending || totalDestinatariosCalculados === 0 || subiendoArchivo}
                    className="bg-[#002F6C] hover:bg-[#0E5296] text-white font-bold px-6 shadow-lg shadow-[#002F6C]/25"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Enviar a {totalDestinatariosCalculados} destinatario(s)
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar / Live Preview */}
          <div className="lg:col-span-4 space-y-6">
            {/* Live Preview Box */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-[#002F6C]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Vista Previa en Tiempo Real
                  </span>
                </div>
                <span className="text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                  Notificación + Correo
                </span>
              </div>

              <div className="text-[11px] text-slate-600 dark:text-slate-300">
                Así se visualizará el mensaje en la bandeja de los usuarios y en el correo electrónico oficial:
              </div>

              {/* Mock Notification Item */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 p-4 space-y-2.5 shadow-sm relative overflow-hidden">
                {/* Unread indicator dot */}
                <div className="absolute top-3 right-3 h-2.5 w-2.5 rounded-full bg-blue-600 animate-pulse" />

                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${configActual.bg}`}>
                    <IconoTipo className="h-3.5 w-3.5" />
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${configActual.badgeBg}`}
                  >
                    {configActual.label}
                  </span>
                  <span className="text-[10px] text-slate-600 dark:text-slate-300">
                    Hace un momento
                  </span>
                </div>

                <div className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                  {asunto.trim() ? asunto : "Asunto del comunicado..."}
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300 line-clamp-4 whitespace-pre-line leading-relaxed">
                  {mensaje.trim()
                    ? mensaje
                    : "Aquí se visualizará el contenido redactado del comunicado para todos los usuarios."}
                </div>

                {adjunto && (
                  <div className="pt-1">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#002F6C] dark:text-blue-400 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 shadow-2xs truncate max-w-full">
                      <Paperclip className="h-3 w-3 shrink-0" />
                      <span className="truncate">{adjunto.nombre}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({adjunto.tamano})</span>
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700 flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-300">
                  <span>De: {usuarioActualNombre}</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">AGBC Intranet</span>
                </div>
              </div>

              {/* Informative Guidance */}
              <div className="rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 p-3 space-y-2 text-xs text-blue-900 dark:text-blue-200">
                <div className="font-bold flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-blue-600" />
                  Doble Canal de Despacho
                </div>
                <p className="text-[11px] leading-relaxed text-blue-800 dark:text-blue-300">
                  Al confirmar el envío, el mensaje se inserta en la campanita de notificaciones de la Intranet y se despacha externamente mediante el servidor SMTP de Correos de Bolivia a las casillas @correos.gob.bo y correos personales/Gmail.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: HISTORIAL DE MENSAJES ENVIADOS ── */}
      {activeTab === "historial" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar en historial por asunto, contenido o remitente..."
                value={busquedaHistorial}
                onChange={(e) => setBusquedaHistorial(e.target.value)}
                className="pl-9 text-xs h-9"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Filtrar por:</span>
              <select
                value={filtroTipoHistorial}
                onChange={(e) => setFiltroTipoHistorial(e.target.value)}
                className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-hidden"
              >
                <option value="todos">Todos los tipos</option>
                <option value="comunicado">Comunicados Oficiales</option>
                <option value="alerta">Alertas / Urgente</option>
                <option value="info">Informativos</option>
                <option value="sistema">Avisos de Sistema</option>
              </select>
            </div>
          </div>

          {/* Cards List */}
          {historialFiltrado.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center space-y-3">
              <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <Inbox className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                No hay envíos registrados
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto">
                No se encontraron mensajes masivos con el filtro seleccionado. Puedes comenzar redactando tu primer comunicado.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab("redactar")}
                className="text-xs"
              >
                <Send className="h-3.5 w-3.5 mr-1.5" />
                Redactar Mensaje
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {historialFiltrado.map((item) => {
                const tipoKey = (item.tipo.toLowerCase() in TIPOS_CONFIG
                  ? item.tipo.toLowerCase()
                  : "comunicado") as TipoNotif
                const cfg = TIPOS_CONFIG[tipoKey]
                const ItemIcon = cfg.icon
                const tasaLectura =
                  item.totalEnviados > 0
                    ? Math.round((item.totalLeidos / item.totalEnviados) * 100)
                    : 0

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-md transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${cfg.badgeBg}`}
                        >
                          <ItemIcon className="h-3 w-3" />
                          {cfg.label}
                        </span>
                        <span className="text-xs text-slate-600 dark:text-slate-300">
                          {new Date(item.fecha).toLocaleString("es-BO", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-blue-600" />
                          <strong className="text-slate-800 dark:text-slate-100">
                            {item.totalEnviados}
                          </strong>{" "}
                          destinatarios
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          <strong className="text-slate-800 dark:text-slate-100">
                            {item.totalLeidos}
                          </strong>{" "}
                          leídos ({tasaLectura}%)
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        {item.asunto}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mt-1 leading-relaxed">
                        {item.mensaje}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <span>Remitente: <strong>{item.remitente}</strong></span>
                        {item.enlace && (
                          <a
                            href={resolverUrlDocumento(item.enlace)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium hover:underline text-xs"
                          >
                            <Paperclip className="h-3.5 w-3.5" />
                            Ver Documento Adjunto
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDetalleModalItem(item)}
                          className="text-xs h-7 px-2.5 text-slate-700 dark:text-slate-300"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          Ver Mensaje
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAsunto(item.asunto)
                            setMensaje(item.mensaje)
                            setTipo(tipoKey)
                            setActiveTab("redactar")
                            toast.success("Cargado en el redactor para nuevo envío")
                          }}
                          className="text-xs h-7 px-2.5 text-[#002F6C] border-[#002F6C]/30 hover:bg-[#002F6C]/10"
                        >
                          <RotateCcw className="h-3.5 w-3.5 mr-1" />
                          Reutilizar
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCampanaAEliminar(item)}
                          className="text-xs h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                          title="Eliminar este mensaje de todos los destinatarios"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── MODAL: GUARDAR NUEVA PLANTILLA ── */}
      <Dialog open={modalGuardarPlantillaOpen} onOpenChange={setModalGuardarPlantillaOpen}>
        <DialogContent className="max-w-md p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Guardar como Plantilla Rápida
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 dark:text-slate-300">
              Guarda el formato actual de asunto y mensaje para reutilizarlo en futuros comunicados.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCrearPlantilla} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Nombre de la Plantilla:
              </label>
              <Input
                placeholder="Ej: Convocatoria General, Aviso de Mantenimiento..."
                value={nombreNuevaPlantilla}
                onChange={(e) => setNombreNuevaPlantilla(e.target.value)}
                className="text-xs h-9"
                required
              />
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs space-y-1 text-slate-600 dark:text-slate-300">
              <p className="truncate"><strong>Asunto:</strong> {asunto || "(Vacío)"}</p>
              <p className="line-clamp-2"><strong>Mensaje:</strong> {mensaje || "(Vacío)"}</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalGuardarPlantillaOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" size="sm" className="bg-[#002F6C] hover:bg-[#0E5296] text-white">
                Guardar Plantilla
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── MODAL: CONFIRMACIÓN ANTES DE ENVIAR ── */}
      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <DialogContent className="max-w-md p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
              <Send className="h-5 w-5 text-[#002F6C]" />
              Confirmar Despacho Masivo
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 dark:text-slate-300">
              Estás a punto de emitir una notificación masiva en tiempo real y por correo oficial.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
              <span className="font-semibold text-slate-600 dark:text-slate-400">Destinatarios:</span>
              <span className="font-bold text-[#002F6C] dark:text-blue-400">
                {totalDestinatariosCalculados} usuario(s)
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
              <span className="font-semibold text-slate-600 dark:text-slate-400">Prioridad:</span>
              <span className="font-bold capitalize">{configActual.label}</span>
            </div>
            {adjunto && (
              <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700">
                <span className="font-semibold text-slate-600 dark:text-slate-400">Adjunto:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                  📎 {adjunto.nombre}
                </span>
              </div>
            )}
            <div className="py-1">
              <span className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                Asunto:
              </span>
              <p className="font-bold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700">
                {asunto}
              </p>
            </div>
          </div>

          <div className="text-[11px] text-blue-900 dark:text-blue-200 bg-blue-50 dark:bg-blue-950/40 p-3 rounded-lg border border-blue-200 dark:border-blue-900/50">
            ✉️ <strong>Canales oficiales:</strong> Se emitirá notificación interna en la campana de los usuarios y se despachará el correo institucional a sus direcciones registradas (@correos.gob.bo / Gmail).
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => setConfirmModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isPending}
              onClick={handleEnviarMensaje}
              className="bg-[#002F6C] hover:bg-[#0E5296] text-white font-bold"
            >
              {isPending ? (
                <>
                  <div className="h-3.5 w-3.5 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Despachando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1.5" />
                  Confirmar y Enviar Ahora
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── MODAL: CONFIRMACIÓN PARA ELIMINAR CAMPAÑA DE TODOS ── */}
      <Dialog open={Boolean(campanaAEliminar)} onOpenChange={(open) => !open && setCampanaAEliminar(null)}>
        <DialogContent className="max-w-md p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-red-600">
              <Trash2 className="h-5 w-5" />
              ¿Eliminar mensaje de todos los usuarios?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 dark:text-slate-300">
              Esta acción eliminará el mensaje de la campana de notificaciones de todos los usuarios a quienes fue enviado.
            </DialogDescription>
          </DialogHeader>

          {campanaAEliminar && (
            <div className="p-3.5 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 text-xs space-y-1.5">
              <p className="font-bold text-slate-900 dark:text-white">
                {campanaAEliminar.asunto}
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                Enviado a <strong>{campanaAEliminar.totalEnviados}</strong> destinatarios el{" "}
                {new Date(campanaAEliminar.fecha).toLocaleString("es-BO", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={eliminandoCampana}
              onClick={() => setCampanaAEliminar(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={eliminandoCampana}
              onClick={handleConfirmarEliminarCampana}
              className="bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              {eliminandoCampana ? "Eliminando..." : "Sí, eliminar de todos"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── MODAL: VER MENSAJE ENVIADO COMPLETO ── */}
      <Dialog
        open={Boolean(detalleModalItem)}
        onOpenChange={(open) => !open && setDetalleModalItem(null)}
      >
        <DialogContent className="max-w-lg p-6 space-y-4">
          {detalleModalItem && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Detalle del Envío
                  </span>
                </div>
                <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {detalleModalItem.asunto}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Emitido el{" "}
                  {new Date(detalleModalItem.fecha).toLocaleString("es-BO", {
                    dateStyle: "full",
                    timeStyle: "short",
                  })}{" "}
                  por {detalleModalItem.remitente}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="text-slate-600 dark:text-slate-300 block">Total Notificados:</span>
                    <strong className="text-slate-800 dark:text-slate-100 text-sm">
                      {detalleModalItem.totalEnviados} usuarios
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-300 block">Lecturas Registradas:</span>
                    <strong className="text-emerald-700 dark:text-emerald-300 text-sm">
                      {detalleModalItem.totalLeidos} usuarios
                    </strong>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Cuerpo del Mensaje
                  </label>
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed max-h-60 overflow-y-auto">
                    {detalleModalItem.mensaje}
                  </div>
                </div>

                {detalleModalItem.enlace && (
                  <div className="text-xs">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">Documento Adjunto:</span>{" "}
                    <a
                      href={resolverUrlDocumento(detalleModalItem.enlace)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 underline font-mono ml-1"
                    >
                      Descargar documento adjunto
                    </a>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDetalleModalItem(null)}
                >
                  Cerrar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    const itm = detalleModalItem
                    setAsunto(itm.asunto)
                    setMensaje(itm.mensaje)
                    setTipo(
                      itm.tipo.toLowerCase() in TIPOS_CONFIG
                        ? (itm.tipo.toLowerCase() as TipoNotif)
                        : "comunicado"
                    )
                    setDetalleModalItem(null)
                    setActiveTab("redactar")
                    toast.success("Cargado en el redactor")
                  }}
                  className="bg-[#002F6C] text-white"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  Cargar en Redactor
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
