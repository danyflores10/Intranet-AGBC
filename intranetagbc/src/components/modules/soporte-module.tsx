"use client"

import { useState, useTransition, useRef, useEffect, useCallback } from "react"
import {
  PlusIcon, SearchIcon, SendIcon, PaperclipIcon, UserIcon,
  PhoneIcon, VideoIcon, XIcon, ImageIcon, FileIcon, DownloadIcon,
  LifeBuoyIcon, CheckCircle2Icon, ClockIcon, MessageSquareIcon,
  FileTextIcon, ChevronLeftIcon, CircleDotIcon,
} from "lucide-react"
import toast from "react-hot-toast"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  crearTicketSoporte,
  obtenerMensajesTicket,
  enviarMensaje,
  actualizarEstadoTicket,
} from "@/actions/soporte"
import { getSocket } from "@/lib/socket"

// ─── Types ───
type Usuario = {
  id: string
  firstName: string
  lastNamePaternal: string
  lastNameMaternal: string | null
  institutionalEmail: string
  image: string | null
}

type Ticket = {
  id: string
  codigo: string
  asunto: string
  estado: string
  prioridad: string
  solicitanteId: string
  agenteId: string | null
  cerradoAt: Date | string | null
  createdAt: Date | string
  updatedAt: Date | string
}

type Mensaje = SoporteSocketMessage

interface Props {
  tickets: Ticket[]
  usuarios: Usuario[]
  currentUserId: string
}

// ─── Helpers ───
function nombreCompleto(u: Usuario) {
  return `${u.firstName} ${u.lastNamePaternal}${u.lastNameMaternal ? ` ${u.lastNameMaternal}` : ""}`
}

function iniciales(u: Usuario) {
  return `${u.firstName[0]}${u.lastNamePaternal[0]}`.toUpperCase()
}

function getEstadoColor(estado: string) {
  switch (estado) {
    case "abierto": return "bg-yellow-500"
    case "en_atencion": return "bg-blue-500"
    case "resuelto": return "bg-green-500"
    case "cerrado": return "bg-gray-400"
    default: return "bg-gray-400"
  }
}

function getEstadoLabel(estado: string) {
  switch (estado) {
    case "abierto": return "Abierto"
    case "en_atencion": return "En atención"
    case "resuelto": return "Resuelto"
    case "cerrado": return "Cerrado"
    default: return estado
  }
}

function isImage(tipo: string | null) {
  if (!tipo) return false
  return ["jpg", "jpeg", "png", "webp", "gif"].includes(tipo.toLowerCase())
}

function isPdf(tipo: string | null) {
  return tipo?.toLowerCase() === "pdf"
}

function formatHora(date: Date | string) {
  return new Date(date).toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })
}

function formatFecha(date: Date | string) {
  return new Date(date).toLocaleDateString("es-BO", { day: "2-digit", month: "short" })
}

function formatFechaCompleta(date: Date | string) {
  const d = new Date(date)
  const hoy = new Date()
  const ayer = new Date(hoy)
  ayer.setDate(ayer.getDate() - 1)

  if (d.toDateString() === hoy.toDateString()) return "Hoy"
  if (d.toDateString() === ayer.toDateString()) return "Ayer"
  return d.toLocaleDateString("es-BO", { day: "2-digit", month: "long", year: "numeric" })
}

// ─── Component ───
export function SoporteModule({ tickets: initialTickets, usuarios, currentUserId }: Props) {
  const [tickets, setTickets] = useState(initialTickets)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [nuevoMensaje, setNuevoMensaje] = useState("")
  const [searchTicket, setSearchTicket] = useState("")
  const [newDialogOpen, setNewDialogOpen] = useState(false)
  const [fileViewerOpen, setFileViewerOpen] = useState(false)
  const [fileViewerUrl, setFileViewerUrl] = useState("")
  const [fileViewerName, setFileViewerName] = useState("")
  const [fileViewerType, setFileViewerType] = useState("")
  const [callDialogOpen, setCallDialogOpen] = useState(false)
  const [callType, setCallType] = useState<"audio" | "video">("audio")
  const [isPending, startTransition] = useTransition()
  const [searchAgente, setSearchAgente] = useState("")
  const [showAgenteDropdown, setShowAgenteDropdown] = useState(false)
  const [selectedAgente, setSelectedAgente] = useState<Usuario | null>(null)
  const [mobileShowChat, setMobileShowChat] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const selectedTicketIdRef = useRef<string | null>(null)

  const usuariosMap = new Map(usuarios.map(u => [u.id, u]))

  const ordenarTicketsPorActividad = useCallback((items: Ticket[]) => {
    return [...items].sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
  }, [])

  const actualizarTicketActividad = useCallback((ticketId: string, updatedAt: Date | string) => {
    const updatedAtDate = new Date(updatedAt)

    setTickets(prev =>
      ordenarTicketsPorActividad(
        prev.map(ticket => (
          ticket.id === ticketId ? { ...ticket, updatedAt: updatedAtDate } : ticket
        ))
      )
    )

    setSelectedTicket(prev => (
      prev && prev.id === ticketId
        ? { ...prev, updatedAt: updatedAtDate }
        : prev
    ))
  }, [ordenarTicketsPorActividad])

  // ─── Cargar mensajes del ticket seleccionado ───
  const cargarMensajes = useCallback(async (ticketId: string) => {
    const msgs = await obtenerMensajesTicket(ticketId)
    setMensajes(msgs)
  }, [])

  useEffect(() => {
    selectedTicketIdRef.current = selectedTicket?.id ?? null
  }, [selectedTicket?.id])

  useEffect(() => {
    const socket = getSocket()

    const onTicketMessageNew = (payload: TicketMessageNewPayload) => {
      const { message, ticketUpdatedAt } = payload

      actualizarTicketActividad(message.ticketId, ticketUpdatedAt)

      if (selectedTicketIdRef.current !== message.ticketId) return

      setMensajes(prev => {
        if (prev.some(msg => msg.id === message.id)) return prev

        const next = [...prev, message]
        next.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        return next
      })
    }

    socket.on("ticket:message:new", onTicketMessageNew)

    return () => {
      socket.off("ticket:message:new", onTicketMessageNew)
    }
  }, [actualizarTicketActividad])

  useEffect(() => {
    if (!selectedTicket?.id) {
      setMensajes([])
      return
    }

    const socket = getSocket()
    const ticketId = selectedTicket.id

    setMensajes([])
    void cargarMensajes(ticketId)
    socket.emit("ticket:join", ticketId)

    return () => {
      socket.emit("ticket:leave", ticketId)
    }
  }, [selectedTicket?.id, cargarMensajes])

  // ─── Auto-scroll a último mensaje ───
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [mensajes])

  // ─── Filtrar tickets ───
  const ticketsFiltrados = tickets.filter(t =>
    searchTicket === "" ||
    t.codigo.toLowerCase().includes(searchTicket.toLowerCase()) ||
    t.asunto.toLowerCase().includes(searchTicket.toLowerCase())
  )

  // ─── Filtrar agentes (excluir usuario actual) ───
  const filteredAgentes = usuarios.filter(u =>
    u.id !== currentUserId &&
    (searchAgente === "" ||
      nombreCompleto(u).toLowerCase().includes(searchAgente.toLowerCase()) ||
      u.institutionalEmail.toLowerCase().includes(searchAgente.toLowerCase()))
  )

  // ─── Obtener el otro participante del ticket ───
  function getOtroParticipante(ticket: Ticket): Usuario | undefined {
    const otroId = ticket.solicitanteId === currentUserId ? ticket.agenteId : ticket.solicitanteId
    return otroId ? usuariosMap.get(otroId) : undefined
  }

  // ─── Seleccionar ticket ───
  function selectTicket(ticket: Ticket) {
    setSelectedTicket(ticket)
    setMobileShowChat(true)
  }

  // ─── Crear ticket ───
  async function handleCrearTicket(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedAgente) {
      toast.error("Selecciona a quién solicitar soporte")
      return
    }
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        const ticket = await crearTicketSoporte({
          asunto: fd.get("asunto") as string,
          prioridad: fd.get("prioridad") as string,
          solicitanteId: currentUserId,
          agenteId: selectedAgente.id,
        })
        setNewDialogOpen(false)
        setSelectedAgente(null)
        setSearchAgente("")
        setTickets(prev =>
          ordenarTicketsPorActividad([
            ticket,
            ...prev.filter(t => t.id !== ticket.id),
          ])
        )
        setSelectedTicket(ticket)
        setMobileShowChat(true)
        toast.success("Conversación de soporte iniciada")
      } catch {
        toast.error("Error al crear ticket")
      }
    })
  }

  // ─── Enviar mensaje de texto ───
  async function handleEnviar(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedTicket || !nuevoMensaje.trim()) return
    const contenido = nuevoMensaje.trim()
    setNuevoMensaje("")

    startTransition(async () => {
      try {
        await enviarMensaje({
          ticketId: selectedTicket.id,
          emisorId: currentUserId,
          contenido,
          tipoMensaje: "texto",
        })
      } catch {
        toast.error("Error al enviar mensaje")
        setNuevoMensaje(contenido)
      }
    })
  }

  // ─── Enviar archivo/imagen ───
  async function handleFileUpload(file: File) {
    if (!selectedTicket) return
    const uploadFd = new FormData()
    uploadFd.append("archivo", file)

    startTransition(async () => {
      try {
        const resp = await fetch("/api/upload/documento", { method: "POST", body: uploadFd })
        if (!resp.ok) {
          const err = await resp.json()
          toast.error(err.error || "Error al subir archivo")
          return
        }
        const result = await resp.json()
        const esImagen = ["jpg", "jpeg", "png", "webp", "gif"].includes((result.tipo || "").toLowerCase())

        await enviarMensaje({
          ticketId: selectedTicket.id,
          emisorId: currentUserId,
          contenido: esImagen ? undefined : result.nombre,
          tipoMensaje: esImagen ? "imagen" : "archivo",
          archivoUrl: result.url,
          archivoNombre: result.nombre,
          archivoTipo: result.tipo,
        })
        toast.success("Archivo enviado")
      } catch {
        toast.error("Error al enviar archivo")
      }
    })
  }

  // ─── Cambiar estado del ticket ───
  async function handleCambiarEstado(estado: string) {
    if (!selectedTicket) return
    startTransition(async () => {
      try {
        await actualizarEstadoTicket(selectedTicket.id, estado, currentUserId)
        setTickets(prev =>
          prev.map(ticket => (
            ticket.id === selectedTicket.id ? { ...ticket, estado } : ticket
          ))
        )
        setSelectedTicket({ ...selectedTicket, estado })
        await cargarMensajes(selectedTicket.id)
        toast.success(`Ticket ${getEstadoLabel(estado).toLowerCase()}`)
      } catch {
        toast.error("Error al cambiar estado")
      }
    })
  }

  // ─── Iniciar llamada (Jitsi Meet) ───
  function iniciarLlamada(tipo: "audio" | "video") {
    if (!selectedTicket) return
    setCallType(tipo)
    setCallDialogOpen(true)
  }

  function abrirLlamada() {
    if (!selectedTicket) return
    const roomName = `agbc-soporte-${selectedTicket.codigo.replace(/[^a-zA-Z0-9]/g, "-")}`
    const baseUrl = `https://meet.jit.si/${roomName}`
    const url = callType === "audio"
      ? `${baseUrl}#config.startWithVideoMuted=true`
      : baseUrl
    window.open(url, "_blank", "noopener,noreferrer")

    // Enviar mensaje de sistema informando de la llamada
    startTransition(async () => {
      await enviarMensaje({
        ticketId: selectedTicket.id,
        emisorId: currentUserId,
        contenido: callType === "video"
          ? "📹 Ha iniciado una videollamada. Haz clic para unirte."
          : "📞 Ha iniciado una llamada de voz. Haz clic para unirte.",
        tipoMensaje: "llamada",
        archivoUrl: url,
        archivoNombre: callType === "video" ? "Videollamada" : "Llamada de voz",
        archivoTipo: "llamada",
      })
    })
    setCallDialogOpen(false)
  }

  // ─── Abrir visor de archivo ───
  function openFileViewer(url: string, nombre: string, tipo: string) {
    setFileViewerUrl(url)
    setFileViewerName(nombre)
    setFileViewerType(tipo)
    setFileViewerOpen(true)
  }

  // ─── Agrupar mensajes por fecha ───
  function agruparPorFecha(msgs: Mensaje[]) {
    const grupos: { fecha: string; mensajes: Mensaje[] }[] = []
    let ultimaFecha = ""
    for (const msg of msgs) {
      const fecha = formatFechaCompleta(msg.createdAt)
      if (fecha !== ultimaFecha) {
        grupos.push({ fecha, mensajes: [msg] })
        ultimaFecha = fecha
      } else {
        grupos[grupos.length - 1].mensajes.push(msg)
      }
    }
    return grupos
  }

  // ═══════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════
  return (
    <>
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
        {/* ─── Panel izquierdo: Lista de conversaciones ─── */}
        <div className={`w-full md:w-80 lg:w-96 flex-shrink-0 border-r flex flex-col bg-card ${mobileShowChat ? "hidden md:flex" : "flex"}`}>
          {/* Cabecera */}
          <div className="p-4 border-b space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFB300]/20 to-[#FF8800]/20">
                  <LifeBuoyIcon className="h-5 w-5 text-[#FF8800]" />
                </div>
                <div>
                  <h2 className="text-sm font-bold">Soporte</h2>
                  <p className="text-[10px] text-muted-foreground">{tickets.length} conversaciones</p>
                </div>
              </div>
              <Button
                size="sm"
                className="bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000] border-0 font-semibold shadow-sm h-8 gap-1"
                onClick={() => setNewDialogOpen(true)}
              >
                <PlusIcon className="h-3.5 w-3.5" />
                Nuevo
              </Button>
            </div>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar conversación..."
                className="pl-9 h-9 text-sm rounded-lg"
                value={searchTicket}
                onChange={e => setSearchTicket(e.target.value)}
              />
            </div>
          </div>

          {/* Lista de tickets */}
          <div className="flex-1 overflow-y-auto">
            {ticketsFiltrados.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <LifeBuoyIcon className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">Sin conversaciones</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Inicia una nueva solicitud de soporte</p>
              </div>
            ) : (
              ticketsFiltrados.map(ticket => {
                const otro = getOtroParticipante(ticket)
                const isSelected = selectedTicket?.id === ticket.id
                const isActive = ticket.estado === "abierto" || ticket.estado === "en_atencion"
                return (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => selectTicket(ticket)}
                    className={`w-full flex items-start gap-3 p-3 text-left transition-all border-b border-border/30 hover:bg-accent/50 ${
                      isSelected ? "bg-[#FFB300]/10 border-l-2 border-l-[#FFB300]" : ""
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {otro?.image ? (
                        <img src={otro.image} alt="" className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#FFB300]/30 to-[#FF8800]/30 text-xs font-bold text-[#FF8800]">
                          {otro ? iniciales(otro) : "?"}
                        </div>
                      )}
                      {isActive && (
                        <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card ${getEstadoColor(ticket.estado)}`} />
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold truncate">
                          {otro ? nombreCompleto(otro) : "Sin asignar"}
                        </span>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {formatFecha(ticket.updatedAt)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{ticket.asunto}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="font-mono text-[10px] text-muted-foreground/70">{ticket.codigo}</span>
                        <span className={`inline-flex h-1.5 w-1.5 rounded-full ${getEstadoColor(ticket.estado)}`} />
                        <span className="text-[10px] text-muted-foreground">{getEstadoLabel(ticket.estado)}</span>
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* ─── Panel derecho: Chat ─── */}
        <div className={`flex-1 flex flex-col bg-background ${!mobileShowChat ? "hidden md:flex" : "flex"}`}>
          {!selectedTicket ? (
            // Estado vacío
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFB300]/10 to-[#FF8800]/10 mb-4">
                <MessageSquareIcon className="h-10 w-10 text-[#FFB300]/50" />
              </div>
              <h3 className="text-lg font-semibold text-muted-foreground">Selecciona una conversación</h3>
              <p className="text-sm text-muted-foreground/70 mt-1 max-w-sm">
                Elige una conversación existente o inicia una nueva solicitud de soporte
              </p>
              <Button
                className="mt-4 bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000] border-0 font-semibold shadow-sm gap-2"
                onClick={() => setNewDialogOpen(true)}
              >
                <PlusIcon className="h-4 w-4" />
                Nueva conversación
              </Button>
            </div>
          ) : (
            <>
              {/* ─── Cabecera del chat ─── */}
              {(() => {
                const otro = getOtroParticipante(selectedTicket)
                const isActive = selectedTicket.estado === "abierto" || selectedTicket.estado === "en_atencion"
                return (
                  <div className="flex items-center justify-between px-4 py-3 border-b bg-card/50">
                    <div className="flex items-center gap-3">
                      {/* Botón volver en móvil */}
                      <button
                        type="button"
                        className="md:hidden inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent"
                        onClick={() => setMobileShowChat(false)}
                      >
                        <ChevronLeftIcon className="h-5 w-5" />
                      </button>
                      {/* Avatar */}
                      <div className="relative">
                        {otro?.image ? (
                          <img src={otro.image} alt="" className="h-9 w-9 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#FFB300]/30 to-[#FF8800]/30 text-xs font-bold text-[#FF8800]">
                            {otro ? iniciales(otro) : "?"}
                          </div>
                        )}
                        {isActive && (
                          <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card ${getEstadoColor(selectedTicket.estado)}`} />
                        )}
                      </div>
                      {/* Info */}
                      <div>
                        <p className="text-sm font-semibold">{otro ? nombreCompleto(otro) : "Sin asignar"}</p>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] text-muted-foreground">{selectedTicket.codigo}</span>
                          <span className="text-[10px] text-muted-foreground">·</span>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${
                            isActive ? "text-green-600" : "text-muted-foreground"
                          }`}>
                            <CircleDotIcon className="h-2.5 w-2.5" />
                            {getEstadoLabel(selectedTicket.estado)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Acciones: llamada + estado */}
                    <div className="flex items-center gap-1.5">
                      {isActive && (
                        <>
                          <button
                            type="button"
                            title="Llamada de voz"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg transition-all hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950/30 dark:hover:text-green-400"
                            onClick={() => iniciarLlamada("audio")}
                          >
                            <PhoneIcon className="h-4.5 w-4.5" />
                          </button>
                          <button
                            type="button"
                            title="Videollamada"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg transition-all hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/30 dark:hover:text-blue-400"
                            onClick={() => iniciarLlamada("video")}
                          >
                            <VideoIcon className="h-4.5 w-4.5" />
                          </button>
                          <div className="h-6 w-px bg-border mx-1" />
                        </>
                      )}
                      {/* Menú de estado */}
                      <select
                        value={selectedTicket.estado}
                        onChange={e => handleCambiarEstado(e.target.value)}
                        disabled={isPending}
                        className="rounded-lg border border-input bg-background px-2 py-1.5 text-xs font-medium transition-colors focus:border-[#FFB300] focus:ring-1 focus:ring-[#FFB300]/30 outline-none"
                      >
                        <option value="abierto">Abierto</option>
                        <option value="en_atencion">En atención</option>
                        <option value="resuelto">Resuelto</option>
                        <option value="cerrado">Cerrado</option>
                      </select>
                    </div>
                  </div>
                )
              })()}

              {/* ─── Área de mensajes ─── */}
              <div ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                {agruparPorFecha(mensajes).map(grupo => (
                  <div key={grupo.fecha}>
                    {/* Separador de fecha */}
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-background px-2">
                        {grupo.fecha}
                      </span>
                      <div className="flex-1 h-px bg-border" />
                    </div>

                    {grupo.mensajes.map(msg => {
                      const esMio = msg.emisorId === currentUserId
                      const emisor = usuariosMap.get(msg.emisorId)

                      // Mensaje de sistema
                      if (msg.tipoMensaje === "sistema") {
                        return (
                          <div key={msg.id} className="flex justify-center my-3">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1 text-[11px] text-muted-foreground">
                              <CircleDotIcon className="h-3 w-3" />
                              {msg.contenido}
                            </span>
                          </div>
                        )
                      }

                      // Mensaje de llamada
                      if (msg.tipoMensaje === "llamada") {
                        return (
                          <div key={msg.id} className="flex justify-center my-3">
                            <button
                              type="button"
                              onClick={() => msg.archivoUrl && window.open(msg.archivoUrl, "_blank", "noopener,noreferrer")}
                              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 px-4 py-2 text-sm font-medium text-green-700 dark:text-green-300 transition-all hover:shadow-md cursor-pointer"
                            >
                              {msg.archivoNombre === "Videollamada" ? (
                                <VideoIcon className="h-4 w-4" />
                              ) : (
                                <PhoneIcon className="h-4 w-4" />
                              )}
                              {msg.contenido}
                            </button>
                          </div>
                        )
                      }

                      // Mensajes normales (texto, imagen, archivo)
                      return (
                        <div key={msg.id} className={`flex gap-2 mb-3 ${esMio ? "flex-row-reverse" : "flex-row"}`}>
                          {/* Avatar */}
                          {!esMio && (
                            <div className="flex-shrink-0 mt-1">
                              {emisor?.image ? (
                                <img src={emisor.image} alt="" className="h-7 w-7 rounded-full object-cover" />
                              ) : (
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#FFB300]/30 to-[#FF8800]/30 text-[10px] font-bold text-[#FF8800]">
                                  {emisor ? iniciales(emisor) : "?"}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Burbuja */}
                          <div className={`max-w-[70%] ${esMio ? "items-end" : "items-start"}`}>
                            {/* Imagen */}
                            {msg.tipoMensaje === "imagen" && msg.archivoUrl && (
                              <div
                                className={`rounded-2xl overflow-hidden shadow-sm cursor-pointer transition-all hover:shadow-md ${
                                  esMio
                                    ? "rounded-tr-md bg-gradient-to-br from-[#FFB300] to-[#FF8800]"
                                    : "rounded-tl-md bg-card border"
                                }`}
                                onClick={() => openFileViewer(msg.archivoUrl!, msg.archivoNombre ?? "Imagen", msg.archivoTipo ?? "")}
                              >
                                <img
                                  src={msg.archivoUrl}
                                  alt={msg.archivoNombre ?? "Imagen"}
                                  className="max-w-full max-h-64 object-cover"
                                />
                                <span className={`block text-[10px] px-2 py-1 ${esMio ? "text-[#1a1000]/60" : "text-muted-foreground"}`}>
                                  {formatHora(msg.createdAt)}
                                </span>
                              </div>
                            )}

                            {/* Archivo */}
                            {msg.tipoMensaje === "archivo" && msg.archivoUrl && (
                              <div
                                className={`rounded-2xl p-3 shadow-sm ${
                                  esMio
                                    ? "rounded-tr-md bg-gradient-to-br from-[#FFB300] to-[#FF8800] text-[#1a1000]"
                                    : "rounded-tl-md bg-card border"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {isPdf(msg.archivoTipo) ? (
                                    <FileTextIcon className={`h-8 w-8 flex-shrink-0 ${esMio ? "text-red-800" : "text-red-500"}`} />
                                  ) : (
                                    <FileIcon className={`h-8 w-8 flex-shrink-0 ${esMio ? "text-[#1a1000]/70" : "text-[#FFB300]"}`} />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{msg.archivoNombre}</p>
                                    <p className={`text-[10px] uppercase ${esMio ? "text-[#1a1000]/60" : "text-muted-foreground"}`}>
                                      {msg.archivoTipo}
                                    </p>
                                  </div>
                                  <div className="flex gap-1">
                                    {(isPdf(msg.archivoTipo) || isImage(msg.archivoTipo)) && (
                                      <button type="button" title="Ver"
                                        className={`inline-flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
                                          esMio ? "hover:bg-[#1a1000]/10" : "hover:bg-accent"
                                        }`}
                                        onClick={() => openFileViewer(msg.archivoUrl!, msg.archivoNombre ?? "Archivo", msg.archivoTipo ?? "")}
                                      >
                                        <SearchIcon className="h-3.5 w-3.5" />
                                      </button>
                                    )}
                                    <a href={msg.archivoUrl} target="_blank" rel="noopener noreferrer" title="Descargar"
                                      className={`inline-flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
                                        esMio ? "hover:bg-[#1a1000]/10" : "hover:bg-accent"
                                      }`}
                                    >
                                      <DownloadIcon className="h-3.5 w-3.5" />
                                    </a>
                                  </div>
                                </div>
                                <span className={`block text-[10px] mt-1 ${esMio ? "text-[#1a1000]/60 text-right" : "text-muted-foreground"}`}>
                                  {formatHora(msg.createdAt)}
                                </span>
                              </div>
                            )}

                            {/* Texto */}
                            {msg.tipoMensaje === "texto" && (
                              <div
                                className={`rounded-2xl px-3.5 py-2 shadow-sm ${
                                  esMio
                                    ? "rounded-tr-md bg-gradient-to-br from-[#FFB300] to-[#FF8800] text-[#1a1000]"
                                    : "rounded-tl-md bg-card border"
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.contenido}</p>
                                <span className={`block text-[10px] mt-0.5 ${esMio ? "text-[#1a1000]/60 text-right" : "text-muted-foreground"}`}>
                                  {formatHora(msg.createdAt)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* ─── Input de mensaje ─── */}
              {(selectedTicket.estado === "abierto" || selectedTicket.estado === "en_atencion") ? (
                <div className="border-t bg-card/50 p-3">
                  <form onSubmit={handleEnviar} className="flex items-end gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
                      onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload(file)
                        if (fileInputRef.current) fileInputRef.current.value = ""
                      }}
                    />
                    <button
                      type="button"
                      title="Adjuntar archivo"
                      className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border transition-all hover:border-[#FFB300]/40 hover:bg-[#FFB300]/10 hover:text-[#FF8800]"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isPending}
                    >
                      <PaperclipIcon className="h-5 w-5" />
                    </button>
                    <div className="flex-1 relative">
                      <Input
                        placeholder="Escribe un mensaje..."
                        className="pr-12 h-10 rounded-xl"
                        value={nuevoMensaje}
                        onChange={e => setNuevoMensaje(e.target.value)}
                        disabled={isPending}
                      />
                    </div>
                    <Button
                      type="submit"
                      size="icon"
                      disabled={isPending || !nuevoMensaje.trim()}
                      className="h-10 w-10 rounded-xl bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000] shadow-sm flex-shrink-0"
                    >
                      <SendIcon className="h-4.5 w-4.5" />
                    </Button>
                  </form>
                </div>
              ) : (
                <div className="border-t bg-muted/30 p-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2Icon className="h-4 w-4" />
                    <span>Esta conversación está {getEstadoLabel(selectedTicket.estado).toLowerCase()}</span>
                  </div>
                  {selectedTicket.estado !== "abierto" && (
                    <button
                      type="button"
                      className="mt-2 text-xs text-[#FF8800] hover:underline font-medium"
                      onClick={() => handleCambiarEstado("abierto")}
                    >
                      Reabrir conversación
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* Dialog: Nuevo ticket de soporte            */}
      {/* ═══════════════════════════════════════════ */}
      <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <DialogContent className="p-0 gap-0 overflow-hidden rounded-2xl max-w-md border-0 shadow-2xl">
          <div className="flex h-1.5 w-full">
            <div className="flex-1 bg-[#C41E3A]" />
            <div className="flex-1 bg-[#FFB300]" />
            <div className="flex-1 bg-[#2E7D32]" />
          </div>
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFB300]/20 to-[#FF8800]/20">
                  <LifeBuoyIcon className="h-5 w-5 text-[#FF8800]" />
                </div>
                Solicitar soporte
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCrearTicket} className="space-y-4 mt-4">
              {/* Persona de soporte */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Solicitar soporte de *</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar persona por nombre o email..."
                    className="pl-9 rounded-lg"
                    value={searchAgente}
                    onChange={e => {
                      setSearchAgente(e.target.value)
                      setShowAgenteDropdown(true)
                      if (e.target.value === "") setSelectedAgente(null)
                    }}
                    onFocus={() => setShowAgenteDropdown(true)}
                    onBlur={() => setTimeout(() => setShowAgenteDropdown(false), 200)}
                  />
                  {showAgenteDropdown && searchAgente.length > 0 && filteredAgentes.length > 0 && (
                    <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover shadow-xl max-h-48 overflow-y-auto">
                      {filteredAgentes.slice(0, 8).map(u => (
                        <button key={u.id} type="button"
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-sm hover:bg-accent transition-colors text-left"
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => {
                            setSelectedAgente(u)
                            setSearchAgente(nombreCompleto(u))
                            setShowAgenteDropdown(false)
                          }}
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#FFB300]/30 to-[#FF8800]/30 text-xs font-bold text-[#FF8800]">
                            {iniciales(u)}
                          </div>
                          <div>
                            <div className="font-medium">{nombreCompleto(u)}</div>
                            <div className="text-xs text-muted-foreground">{u.institutionalEmail}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedAgente && (
                    <div className="mt-2 flex items-center gap-2 rounded-lg bg-[#FFB300]/10 border border-[#FFB300]/20 px-3 py-2 text-sm">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FFB300]/30 text-xs font-bold text-[#FF8800]">
                        {iniciales(selectedAgente)}
                      </div>
                      <span className="font-medium">{nombreCompleto(selectedAgente)}</span>
                      <button type="button" className="ml-auto text-muted-foreground hover:text-red-500 transition-colors"
                        onClick={() => { setSelectedAgente(null); setSearchAgente("") }}>
                        <XIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Asunto */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Asunto *</Label>
                <Input name="asunto" required placeholder="Describe brevemente tu problema..." className="rounded-lg" />
              </div>

              {/* Prioridad */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Prioridad</Label>
                <select name="prioridad"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm transition-colors focus:border-[#FFB300] focus:ring-1 focus:ring-[#FFB300]/30 outline-none"
                  defaultValue="media"
                >
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button type="button" variant="outline" onClick={() => setNewDialogOpen(false)} className="rounded-lg">
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending || !selectedAgente}
                  className="bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000] gap-2 rounded-lg font-semibold shadow-md shadow-[#FFB300]/20"
                >
                  <SendIcon className="h-4 w-4" />
                  {isPending ? "Iniciando..." : "Iniciar conversación"}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════ */}
      {/* Dialog: Confirmar llamada                  */}
      {/* ═══════════════════════════════════════════ */}
      <Dialog open={callDialogOpen} onOpenChange={setCallDialogOpen}>
        <DialogContent className="p-0 gap-0 overflow-hidden rounded-2xl max-w-sm border-0 shadow-2xl">
          <div className="flex h-1.5 w-full">
            <div className="flex-1 bg-[#C41E3A]" />
            <div className="flex-1 bg-[#FFB300]" />
            <div className="flex-1 bg-[#2E7D32]" />
          </div>
          <div className="p-6 text-center">
            <DialogHeader>
              <DialogTitle className="text-lg">
                {callType === "video" ? "Iniciar videollamada" : "Iniciar llamada de voz"}
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4 mb-6">
              <div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${
                callType === "video"
                  ? "bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-950/40 dark:to-blue-900/40"
                  : "bg-gradient-to-br from-green-100 to-green-200 dark:from-green-950/40 dark:to-green-900/40"
              }`}>
                {callType === "video" ? (
                  <VideoIcon className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                ) : (
                  <PhoneIcon className="h-10 w-10 text-green-600 dark:text-green-400" />
                )}
              </div>
              {selectedTicket && (() => {
                const otro = getOtroParticipante(selectedTicket)
                return (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground">
                      {callType === "video" ? "Videollamada" : "Llamada de voz"} con
                    </p>
                    <p className="text-base font-semibold mt-1">
                      {otro ? nombreCompleto(otro) : "Participante"}
                    </p>
                  </div>
                )
              })()}
              <p className="text-xs text-muted-foreground mt-3">
                Se abrirá en una nueva pestaña usando Jitsi Meet. El otro participante recibirá una notificación para unirse.
              </p>
            </div>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => setCallDialogOpen(false)} className="rounded-lg">
                Cancelar
              </Button>
              <Button
                onClick={abrirLlamada}
                className={`gap-2 rounded-lg font-semibold shadow-md ${
                  callType === "video"
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue-500/20"
                    : "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-green-500/20"
                }`}
              >
                {callType === "video" ? <VideoIcon className="h-4 w-4" /> : <PhoneIcon className="h-4 w-4" />}
                Iniciar {callType === "video" ? "videollamada" : "llamada"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════ */}
      {/* Dialog: Visor de archivos                  */}
      {/* ═══════════════════════════════════════════ */}
      <Dialog open={fileViewerOpen} onOpenChange={setFileViewerOpen}>
        <DialogContent className="p-0 gap-0 overflow-hidden rounded-2xl max-w-4xl w-[90vw] h-[85vh] border-0 shadow-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>{fileViewerName || "Visor de archivos"}</DialogTitle>
          </DialogHeader>
          <div className="flex h-1.5 w-full">
            <div className="flex-1 bg-[#C41E3A]" />
            <div className="flex-1 bg-[#FFB300]" />
            <div className="flex-1 bg-[#2E7D32]" />
          </div>
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
              <div className="flex items-center gap-2 min-w-0">
                {isPdf(fileViewerType)
                  ? <FileTextIcon className="h-8 w-8 text-red-500 flex-shrink-0" />
                  : isImage(fileViewerType)
                    ? <ImageIcon className="h-8 w-8 text-blue-500 flex-shrink-0" />
                    : <FileIcon className="h-8 w-8 text-[#FFB300] flex-shrink-0" />
                }
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{fileViewerName}</p>
                  <p className="text-xs text-muted-foreground uppercase">{fileViewerType}</p>
                </div>
              </div>
              <a href={fileViewerUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors hover:bg-accent"
              >
                <DownloadIcon className="h-4 w-4" />
                Descargar
              </a>
            </div>
            <div className="flex-1 overflow-hidden bg-muted/20">
              {isPdf(fileViewerType) ? (
                <iframe src={fileViewerUrl} className="w-full h-full border-0" title={fileViewerName} />
              ) : isImage(fileViewerType) ? (
                <div className="flex items-center justify-center h-full p-4">
                  <img src={fileViewerUrl} alt={fileViewerName} className="max-w-full max-h-full object-contain rounded-lg shadow-lg" />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <FileIcon className="h-16 w-16 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">Vista previa no disponible</p>
                  <a href={fileViewerUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#FFB300] to-[#FF8800] text-[#1a1000] px-4 py-2 text-sm font-semibold"
                  >
                    <DownloadIcon className="h-4 w-4" />
                    Descargar archivo
                  </a>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
