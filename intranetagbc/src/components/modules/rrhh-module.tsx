"use client"

import { useState, useTransition, useRef, useMemo } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  UsersIcon,
  MailIcon,
  PhoneIcon,
  BuildingIcon,
  SearchIcon,
  BadgeCheckIcon,
  CameraIcon,
  XIcon,
  Crown,
  LayoutGridIcon,
  TableIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SparklesIcon,
  CheckCircle2Icon,
  FileSpreadsheetIcon,
  UserXIcon,
  UserCheckIcon,
  CalendarIcon,
  EyeIcon,
  EyeOffIcon,
  RefreshCwIcon,
  LockIcon,
  ShieldAlertIcon,
  Loader2Icon,
  Undo2Icon,
  AlertTriangleIcon,
} from "lucide-react"
import toast from "react-hot-toast"

import { DataTable } from "@/components/dashboard/data-table"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { RrhhExcelDialog } from "@/components/rrhh/rrhh-excel-dialog"
import {
  crearPersonal,
  actualizarPersonal,
  eliminarPersonal,
  crearDirectivo,
  actualizarDirectivo,
  eliminarDirectivo,
  revertirUltimaImportacionRRHH,
  confirmarCambiosImportacionRRHH,
} from "@/actions/rrhh"
import { verificarPasswordAdmin, revelarPasswordUsuario } from "@/actions/usuarios"

function generarPasswordSegura(): string {
  const prefixes = ["Agbc", "Correos", "Bolivia", "Postal", "AdminAGBC"]
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const year = 2026
  const symbols = ["!", "@", "#", "$", "*"]
  const symbol = symbols[Math.floor(Math.random() * symbols.length)]
  const chars = "abcdefghjkmnpqrstuvwxyz23456789ABCDEFGHJKMNPQRSTUVWXYZ"
  let randomSuffix = ""
  for (let i = 0; i < 4; i++) {
    randomSuffix += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `${prefix}${year}${symbol}${randomSuffix}`
}

type Tab = "personal" | "directorio"

/* ── Colores de avatar estilo Google Meet ── */
const AVATAR_COLORS = [
  "#1A73E8", "#E8453C", "#0B8043", "#F29900", "#8430CE",
  "#D93025", "#1E8E3E", "#185ABC", "#E37400", "#A142F4",
  "#00897B", "#C2185B",
]

function hashName(name: string): number {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
    hash |= 0
  }
  return Math.abs(hash)
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
}

function getColor(name: string) {
  return AVATAR_COLORS[hashName(name) % AVATAR_COLORS.length]
}

interface PersonalRow {
  id: string
  nombre: string
  ci: string
  cargo: string
  unidad: string
  email: string | null
  telefono: string | null
  foto: string | null
  fechaIngreso: string
  estado: string
}

interface DirectivoRow {
  id: string
  nombre: string
  cargo: string
  unidad: string
  email: string | null
  telefono: string | null
  foto: string | null
  orden: number
  estado: string
}

export const DIRECCIONES_DIRECTORIO = [
  "Dirección General Ejecutiva",
  "Dirección Comercial",
  "Dirección Operativa",
  "Dirección Administrativa Financiera",
] as const

interface UsuarioItem {
  id: string
  name: string
  email?: string | null
  institutionalEmail?: string | null
  phoneNumber?: string | null
  avatarUrl?: string | null
  nationalId?: string | null
}

interface Props {
  personal: PersonalRow[]
  directivos: DirectivoRow[]
  usuarios?: UsuarioItem[]
}

function FotoUploader({
  fotoUrl,
  onUploaded,
  onRemove,
  nombre,
}: {
  fotoUrl: string | null
  onUploaded: (url: string) => void
  onRemove: () => void
  nombre: string
}) {
  const [subiendo, setSubiendo] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes")
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen no debe superar 2 MB")
      return
    }
    setSubiendo(true)
    try {
      const fd = new FormData()
      fd.append("foto", file)
      const res = await fetch("/api/upload/personal", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Error al subir")
      onUploaded(data.url)
      toast.success("Foto subida")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al subir foto")
    } finally {
      setSubiendo(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  const color = getColor(nombre || "AGBC")
  const initials = getInitials(nombre || "AGBC")

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative group">
        {fotoUrl ? (
          <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-white shadow-md ring-2 ring-[#0E5296]/20">
            <Image src={fotoUrl} alt={nombre} fill className="object-cover" />
          </div>
        ) : (
          <div
            className="flex h-24 w-24 items-center justify-center rounded-full text-2xl font-bold text-white shadow-md ring-2 ring-[#0E5296]/20"
            style={{ backgroundColor: color }}
          >
            {initials}
          </div>
        )}

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={subiendo}
          className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer"
        >
          <CameraIcon className="h-6 w-6" />
        </button>
      </div>

      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />

      {fotoUrl && (
        <button
          type="button"
          onClick={onRemove}
          className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer font-medium"
        >
          <XIcon className="h-3.5 w-3.5" /> Quitar foto
        </button>
      )}
    </div>
  )
}

export function RrhhModule({ personal, directivos, usuarios = [] }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("personal")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"todos" | "activo" | "inactivo">("todos")
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 8
  const [excelDialogOpen, setExcelDialogOpen] = useState(false)

  const [isPending, startTransition] = useTransition()

  const [pDialogOpen, setPDialogOpen] = useState(false)
  const [pEditItem, setPEditItem] = useState<PersonalRow | null>(null)
  const [pFotoUrl, setPFotoUrl] = useState<string | null>(null)

  // Estados para contraseñas seguras y verificación de admin al editar
  const [pDefaultPassword, setPDefaultPassword] = useState(() => generarPasswordSegura())
  const [pPassword, setPPassword] = useState("")
  const [showPPassword, setShowPPassword] = useState(false)
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false)
  const [showAdminAuthModal, setShowAdminAuthModal] = useState(false)
  const [adminPasswordInput, setAdminPasswordInput] = useState("")
  const [verifyingAdmin, setVerifyingAdmin] = useState(false)
  const [hasImportedSnapshot, setHasImportedSnapshot] = useState(false)
  const [confirmModalType, setConfirmModalType] = useState<"permanecer" | "revertir" | null>(null)
  const [processingAction, setProcessingAction] = useState(false)
  const [itemAEliminar, setItemAEliminar] = useState<{ id: string; nombre: string; tipo: "personal" | "directivo" } | null>(null)
  const [eliminandoItem, setEliminandoItem] = useState(false)

  const handleConfirmarEliminacionFisica = async () => {
    if (!itemAEliminar) return
    setEliminandoItem(true)
    try {
      if (itemAEliminar.tipo === "personal") {
        await eliminarPersonal(itemAEliminar.id)
      } else {
        await eliminarDirectivo(itemAEliminar.id)
      }
      toast.success(`${itemAEliminar.tipo === "personal" ? "Funcionario" : "Directivo"} eliminado permanentemente`)
      setItemAEliminar(null)
      router.refresh()
    } catch {
      toast.error("Error al eliminar el registro permanentemente")
    } finally {
      setEliminandoItem(false)
    }
  }

  const handleExecutePermanecer = async () => {
    setProcessingAction(true)
    try {
      const res = await confirmarCambiosImportacionRRHH()
      if (res.success) {
        toast.success(res.message || "Cambios fijados y consolidados")
        setHasImportedSnapshot(false)
        setConfirmModalType(null)
        router.refresh()
      } else {
        toast.error(res.message || "Error al confirmar los cambios")
      }
    } catch {
      toast.error("Ocurrió un error al procesar")
    } finally {
      setProcessingAction(false)
    }
  }

  const handleExecuteRevertir = async () => {
    setProcessingAction(true)
    try {
      const res = await revertirUltimaImportacionRRHH()
      if (res.success) {
        toast.success(res.message || "Padrón restaurado con éxito")
        setHasImportedSnapshot(false)
        setConfirmModalType(null)
        router.refresh()
      } else {
        toast.error(res.message || "Error al revertir los cambios")
      }
    } catch {
      toast.error("Ocurrió un error al intentar revertir")
    } finally {
      setProcessingAction(false)
    }
  }

  const [dDialogOpen, setDDialogOpen] = useState(false)
  const [dEditItem, setDEditItem] = useState<DirectivoRow | null>(null)
  const [dFotoUrl, setDFotoUrl] = useState<string | null>(null)

  // Estados controlados para formulario de directivos
  const [dNombre, setDNombre] = useState("")
  const [dUnidad, setDUnidad] = useState<string>(DIRECCIONES_DIRECTORIO[0])
  const [dEmail, setDEmail] = useState("")
  const [dTelefono, setDTelefono] = useState("")
  const [candidateSearch, setCandidateSearch] = useState("")

  // ── Unificación del Padrón: Integra el personal con los usuarios del sistema ──
  const padronUnificado = useMemo(() => {
    const list: PersonalRow[] = [...personal]

    usuarios.forEach((u) => {
      const email = u.institutionalEmail || u.email || ""
      const exists = list.some(
        (p) =>
          (p.email && email && p.email.toLowerCase() === email.toLowerCase()) ||
          p.nombre.toLowerCase().trim() === u.name.toLowerCase().trim()
      )

      if (!exists) {
        list.push({
          id: u.id,
          nombre: u.name,
          ci: u.nationalId || "—",
          cargo: "Funcionario Institucional",
          unidad: "Personal General",
          email: email || null,
          telefono: u.phoneNumber || null,
          foto: u.avatarUrl || null,
          fechaIngreso: new Date().toISOString().slice(0, 10),
          estado: "activo",
        })
      }
    })

    return list
  }, [personal, usuarios])

  function openPersonalDialog(item?: PersonalRow | null) {
    setPEditItem(item || null)
    setPFotoUrl(item?.foto || null)
    if (!item) {
      const pass = generarPasswordSegura()
      setPDefaultPassword(pass)
      setPPassword(pass)
      setIsAdminUnlocked(false)
    } else {
      setPPassword("")
      setIsAdminUnlocked(false)
      setShowAdminAuthModal(false)
      setAdminPasswordInput("")
      setShowPPassword(false)
    }
    setPDialogOpen(true)
  }

  async function handleVerifyAdminPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!adminPasswordInput.trim()) {
      toast.error("Ingresa tu contraseña de administrador")
      return
    }

    setVerifyingAdmin(true)
    try {
      const res = await revelarPasswordUsuario({
        adminPassword: adminPasswordInput,
        email: pEditItem?.email || undefined,
        ci: pEditItem?.ci || undefined,
      })
      if (res.success && res.data) {
        setIsAdminUnlocked(true)
        setShowAdminAuthModal(false)
        setAdminPasswordInput("")
        setPPassword(res.data.password || "Correos2026*")
        setShowPPassword(true)
        toast.success("Contraseña del funcionario revelada")
      } else {
        toast.error(res.message || "Contraseña de administrador incorrecta")
      }
    } catch {
      toast.error("Error al validar la contraseña de administrador")
    } finally {
      setVerifyingAdmin(false)
    }
  }

  function openDirectivoDialog(item?: DirectivoRow | null) {
    if (item) {
      setDEditItem(item)
      setDNombre(item.nombre)
      setDUnidad(item.unidad)
      setDEmail(item.email || "")
      setDTelefono(item.telefono || "")
      setDFotoUrl(item.foto || null)
    } else {
      setDEditItem(null)
      setDNombre("")
      setDUnidad(DIRECCIONES_DIRECTORIO[0])
      setDEmail("")
      setDTelefono("")
      setDFotoUrl(null)
    }
    setCandidateSearch("")
    setDDialogOpen(true)
  }

  // Lista de funcionarios desde RRHH para autocompletar directivos
  const candidatos = useMemo(() => {
    return padronUnificado.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      email: p.email || "",
      telefono: p.telefono || "",
      cargo: p.cargo || "Personal",
      foto: p.foto || null,
    }))
  }, [padronUnificado])

  // Candidatos filtrados por búsqueda
  const filteredCandidatos = useMemo(() => {
    if (!candidateSearch.trim()) return []
    const q = candidateSearch.toLowerCase()
    return candidatos.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.cargo && c.cargo.toLowerCase().includes(q))
    ).slice(0, 6)
  }, [candidatos, candidateSearch])

  function seleccionarCandidato(c: typeof candidatos[0]) {
    setDNombre(c.nombre)
    if (c.email) setDEmail(c.email)
    if (c.telefono) setDTelefono(c.telefono)
    if (c.foto) setDFotoUrl(c.foto)
    setCandidateSearch("")
    toast.success(`Datos de ${c.nombre} autocompletados`)
  }

  async function handlePersonalSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      try {
        const payload = {
          nombre: (fd.get("nombre") as string).trim(),
          cargo: (fd.get("cargo") as string).trim(),
          email: (fd.get("email") as string) || undefined,
          telefono: (fd.get("telefono") as string) || undefined,
          foto: pFotoUrl || undefined,
          ci: "—",
          unidad: "General",
          fechaIngreso: pEditItem?.fechaIngreso || new Date().toISOString().split("T")[0],
        }
        if (pEditItem) {
          await actualizarPersonal(
            pEditItem.id,
            {
              ...payload,
              estado: fd.get("estado") as string,
            },
            pPassword || undefined
          )
          toast.success("Personal actualizado correctamente")
        } else {
          await crearPersonal(payload, pDefaultPassword)
          toast.success("Personal registrado exitosamente")
        }
        setPDialogOpen(false)
        setPEditItem(null)
        setPFotoUrl(null)
      } catch {
        toast.error("Error al guardar personal")
      }
    })
  }

  async function handleDirectivoSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    startTransition(async () => {
      try {
        const ordenAuto = DIRECCIONES_DIRECTORIO.indexOf(dUnidad as any) + 1 || 1
        const payload = {
          nombre: dNombre.trim(),
          cargo: dUnidad,
          unidad: dUnidad,
          email: dEmail.trim() || undefined,
          telefono: dTelefono.trim() || undefined,
          foto: dFotoUrl || undefined,
          orden: ordenAuto,
        }
        if (!payload.nombre) {
          toast.error("El nombre del directivo es requerido")
          return
        }
        if (dEditItem) {
          await actualizarDirectivo(dEditItem.id, payload)
          toast.success("Directivo actualizado correctamente")
        } else {
          await crearDirectivo(payload)
          toast.success("Directivo registrado exitosamente")
        }
        setDDialogOpen(false)
        setDEditItem(null)
        setDFotoUrl(null)
      } catch {
        toast.error("Error al guardar directivo")
      }
    })
  }

  async function handleTogglePersonalStatus(item: PersonalRow) {
    const nextEstado = item.estado === "activo" ? "inactivo" : "activo"
    startTransition(async () => {
      try {
        await actualizarPersonal(item.id, { estado: nextEstado })
        toast.success(`Personal ${nextEstado === "activo" ? "dado de alta" : "dado de baja"} correctamente`)
      } catch {
        toast.error("Error al actualizar estado")
      }
    })
  }

  async function handleToggleDirectivoStatus(item: DirectivoRow) {
    const nextEstado = item.estado === "activo" ? "inactivo" : "activo"
    startTransition(async () => {
      try {
        await actualizarDirectivo(item.id, { estado: nextEstado })
        toast.success(`Directivo ${nextEstado === "activo" ? "dado de alta" : "dado de baja"} correctamente`)
      } catch {
        toast.error("Error al actualizar estado")
      }
    })
  }

  const filteredPersonal = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return padronUnificado.filter((p) => {
      const matchSearch =
        !q ||
        p.nombre.toLowerCase().includes(q) ||
        p.cargo.toLowerCase().includes(q) ||
        (p.email && p.email.toLowerCase().includes(q)) ||
        (p.telefono && p.telefono.includes(q))

      const matchStatus =
        statusFilter === "todos" ||
        (statusFilter === "activo" && p.estado === "activo") ||
        (statusFilter === "inactivo" && p.estado !== "activo")

      return matchSearch && matchStatus
    })
  }, [padronUnificado, searchQuery, statusFilter])

  const filteredDirectivos = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return directivos.filter((d) => {
      const matchSearch =
        !q ||
        d.nombre.toLowerCase().includes(q) ||
        d.cargo.toLowerCase().includes(q) ||
        d.unidad.toLowerCase().includes(q) ||
        (d.email && d.email.toLowerCase().includes(q)) ||
        (d.telefono && d.telefono.includes(q))

      const matchStatus =
        statusFilter === "todos" ||
        (statusFilter === "activo" && d.estado === "activo") ||
        (statusFilter === "inactivo" && d.estado !== "activo")

      return matchSearch && matchStatus
    })
  }, [directivos, searchQuery, statusFilter])

  const currentList = tab === "personal" ? filteredPersonal : filteredDirectivos
  const totalPages = Math.max(1, Math.ceil(currentList.length / pageSize))
  const paginatedList = currentList.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const handleTabChange = (t: Tab) => {
    setTab(t)
    setSearchQuery("")
    setStatusFilter("todos")
    setCurrentPage(1)
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 bg-gradient-to-br from-slate-50 via-blue-50/25 to-amber-50/20 min-h-screen">
      {/* ── Encabezado Institucional ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-3xl border-2 border-[#002F6C]/15 bg-gradient-to-r from-white via-blue-50/30 to-amber-50/30 p-6 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0E5296] text-[#FFCC00] shadow-md ring-2 ring-[#0E5296]/20">
            <UsersIcon className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-[#002F6C]">
                Recursos Humanos y Directorio
              </h1>
              <span className="rounded-full bg-[#0E5296] text-[#FFCC00] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
                AGBC
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Padrón maestro de funcionarios, nómina unificada y directorio ejecutivo AGBC.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            className="bg-[#0E5296] hover:bg-[#002F6C] text-white font-bold rounded-2xl shadow-md shadow-[#0E5296]/20 cursor-pointer text-xs"
            onClick={() => {
              if (tab === "personal") {
                openPersonalDialog()
              } else {
                openDirectivoDialog()
              }
            }}
          >
            <PlusIcon className="mr-1.5 h-4 w-4 text-[#FFCC00]" />
            {tab === "personal" ? "Nuevo Funcionario" : "Nuevo Directivo"}
          </Button>
        </div>
      </div>

      {/* ── Tabs de Navegación ── */}
      <div className="flex items-center gap-2 rounded-2xl bg-slate-100/80 p-1.5 border border-[#002F6C]/10 w-fit">
        {([
          { key: "personal" as Tab, label: "Padrón de Funcionarios", icon: UsersIcon, count: padronUnificado.length },
          { key: "directorio" as Tab, label: "Directorio Ejecutivo", icon: Crown, count: directivos.length },
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
            <UsersIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#002F6C]">
              {tab === "personal" ? padronUnificado.length : directivos.length}
            </div>
            <div className="text-xs text-slate-600 font-bold">Total Registrados</div>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border-2 border-amber-200/90 bg-gradient-to-br from-amber-50 via-yellow-50/60 to-white p-4 shadow-xs">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFCC00] text-[#002F6C]">
            <CheckCircle2Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#002F6C]">
              {tab === "personal"
                ? padronUnificado.filter((p) => p.estado === "activo").length
                : directivos.filter((d) => d.estado === "activo").length}
            </div>
            <div className="text-xs text-slate-600 font-bold">Activos en Funciones</div>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border-2 border-blue-200/90 bg-gradient-to-br from-blue-50 via-sky-50/50 to-white p-4 shadow-xs">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-200 text-[#002F6C]">
            <SparklesIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#002F6C]">
              {tab === "personal"
                ? padronUnificado.filter((p) => p.estado !== "activo").length
                : directivos.filter((d) => d.estado !== "activo").length}
            </div>
            <div className="text-xs text-slate-600 font-bold">Inactivos / Bajas</div>
          </div>
        </div>
      </div>

      {/* ── Buscador y Filtros Interactivos ── */}
      <div className="rounded-2xl border-2 border-[#002F6C]/15 bg-gradient-to-r from-white via-blue-50/20 to-amber-50/20 p-4 shadow-xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto flex-1">
            <div className="relative w-full md:w-72">
              <Input
                type="text"
                placeholder={`Buscar en ${tab === "personal" ? "funcionarios" : "directorio"}...`}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="bg-white/90 border-[#002F6C]/20 text-xs font-medium focus:border-[#0E5296]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any)
                setCurrentPage(1)
              }}
              className="h-9 rounded-xl border border-[#002F6C]/20 bg-white px-3 text-xs font-bold text-[#002F6C] shadow-2xs focus:border-[#0E5296] focus:outline-hidden"
            >
              <option value="todos">Todos los estados</option>
              <option value="activo">Solo activos</option>
              <option value="inactivo">Solo inactivos</option>
            </select>

            {(searchQuery || statusFilter !== "todos") && (
              <button
                onClick={() => {
                  setSearchQuery("")
                  setStatusFilter("todos")
                  setCurrentPage(1)
                }}
                className="rounded-xl bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 text-xs font-bold text-[#002F6C] cursor-pointer transition-colors shadow-2xs"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
            {tab === "personal" && (
              <button
                onClick={() => setExcelDialogOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white px-3.5 py-2 text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
                title="Importar y Exportar Nómina en Excel (RRHH)"
              >
                <FileSpreadsheetIcon className="h-3.5 w-3.5 text-[#FFCC00]" />
                Excel (Importar / Exportar)
              </button>
            )}
            <span className="text-xs font-bold text-[#0E5296] bg-white/80 border border-[#0E5296]/20 px-3 py-1.5 rounded-xl shadow-2xs">
              {currentList.length} encontrados
            </span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* VISTA EN TABLA ESTRUCTURADA ESTILO INSTITUCIONAL AGBC          */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="rounded-3xl border-2 border-[#002F6C]/15 bg-gradient-to-br from-white via-blue-50/20 to-amber-50/20 p-5 shadow-sm overflow-hidden">
        {/* Cabecera Informativa de la Tabla */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#002F6C]/10 gap-2 mb-4">
          <div>
            <h3 className="text-sm font-black text-[#002F6C]">
              {tab === "personal" ? "Padrón General de Funcionarios AGBC" : "Directorio Ejecutivo AGBC"} ({currentList.length})
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              {tab === "personal"
                ? "Directorio unificado del personal institucional con control de estados, fechas de incorporación y contacto."
                : "Autoridades ejecutivas de las direcciones estratégicas institucionales."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {tab === "personal" && hasImportedSnapshot && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmModalType("permanecer")}
                  title="Permanecer y consolidar todos los cambios importados"
                  className="h-8 px-3 rounded-full border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold shadow-2xs cursor-pointer flex items-center gap-1.5 transition-all"
                >
                  <CheckCircle2Icon className="h-3.5 w-3.5 text-emerald-600" />
                  Permanecer Cambios
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmModalType("revertir")}
                  title="Revertir la última importación y restaurar el padrón al estado anterior"
                  className="h-8 px-3 rounded-full border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold shadow-2xs cursor-pointer flex items-center gap-1.5 transition-all"
                >
                  <Undo2Icon className="h-3.5 w-3.5 text-amber-700" />
                  Revertir Cambios
                </Button>
              </>
            )}
            <span className="text-xs font-bold text-[#0E5296] bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Página {currentPage} de {totalPages}
            </span>
          </div>
        </div>

        {/* Tabla con scroll horizontal responsivo */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="border-b border-slate-200/80 bg-gradient-to-r from-blue-50/80 via-white to-amber-50/60 text-[10px] font-black uppercase tracking-wider text-[#002F6C]">
                <th className="py-3.5 px-4">{tab === "personal" ? "Funcionario / Cargo" : "Directivo / Autoridad"}</th>
                {tab === "directorio" && <th className="py-3.5 px-4">Dirección Asignada</th>}
                <th className="py-3.5 px-4">Correo Institucional</th>
                <th className="py-3.5 px-4">Teléfono / Contacto</th>
                {tab === "personal" && <th className="py-3.5 px-4 text-center">Ingreso</th>}
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={tab === "personal" ? 6 : 5} className="py-12 text-center text-slate-400 font-medium">
                    No se encontraron registros en {tab === "personal" ? "Padrón de Funcionarios" : "Directorio Ejecutivo"}.
                  </td>
                </tr>
              ) : (
                paginatedList.map((item: any) => {
                  const initials = getInitials(item.nombre)
                  const isActivo = item.estado === "activo"

                  return (
                    <tr key={item.id} className="hover:bg-blue-50/40 transition-colors group">
                      {/* Funcionario / Directivo (Avatar + Nombre + Cargo) */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            {item.foto ? (
                              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-amber-300 shadow-xs">
                                <Image src={item.foto} alt={item.nombre} fill className="object-cover" />
                              </div>
                            ) : (
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFCC00] text-[#002F6C] font-black text-xs shadow-xs border border-amber-300">
                                {initials}
                              </div>
                            )}
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
                                isActivo ? "bg-emerald-500" : "bg-slate-400"
                              }`}
                            />
                          </div>
                          <div className="min-w-0 space-y-0.5">
                            <p className="font-black text-[#002F6C] text-xs truncate max-w-[220px]">{item.nombre}</p>
                            <p className="text-xs truncate max-w-[220px]">
                              <span className="text-slate-400 font-medium">Cargo: </span>
                              <span className="text-[#0E5296] font-bold">{item.cargo || "Personal"}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Dirección para pestaña de Directorio */}
                      {tab === "directorio" && (
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0E5296] text-[#FFCC00] px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-2xs">
                            <BuildingIcon className="h-3 w-3" />
                            {item.unidad || item.cargo}
                          </span>
                        </td>
                      )}

                      {/* Correo con enlace mailto interactivo */}
                      <td className="py-3 px-4">
                        {item.email ? (
                          <a
                            href={`mailto:${item.email}`}
                            className="font-bold text-[#0E5296] hover:text-[#002F6C] hover:underline text-[11px] truncate max-w-[220px] inline-flex items-center gap-1 transition-colors"
                            title={`Enviar correo a ${item.email}`}
                          >
                            <MailIcon className="h-3 w-3 shrink-0 text-slate-400" />
                            <span className="truncate">{item.email}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Teléfono con formato interactivo */}
                      <td className="py-3 px-4">
                        {item.telefono ? (
                          <span className="inline-flex items-center gap-1 text-slate-700 font-mono text-[11px] font-semibold bg-slate-100/80 px-2 py-0.5 rounded-md border border-slate-200/80">
                            {item.telefono}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Fecha de Ingreso en Personal */}
                      {tab === "personal" && (
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200/60">
                            <CalendarIcon className="h-3 w-3 text-[#0E5296]" />
                            {item.fechaIngreso || "—"}
                          </span>
                        </td>
                      )}

                      {/* Estado */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            isActivo ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          <span className={`h-2 w-2 rounded-full ${isActivo ? "bg-emerald-500" : "bg-slate-400"}`} />
                          {isActivo ? "Activo" : "Inactivo"}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Botón de Baja / Alta rápida */}
                          <button
                            onClick={() => {
                              if (tab === "personal") {
                                handleTogglePersonalStatus(item)
                              } else {
                                handleToggleDirectivoStatus(item)
                              }
                            }}
                            className={`flex h-7 items-center gap-1 px-2 rounded-lg text-[10px] font-bold transition-colors cursor-pointer shadow-2xs ${
                              isActivo
                                ? "bg-amber-50 text-amber-800 hover:bg-amber-500 hover:text-white border border-amber-200"
                                : "bg-emerald-50 text-emerald-800 hover:bg-emerald-600 hover:text-white border border-emerald-200"
                            }`}
                            title={isActivo ? "Dar de baja" : "Reactivar / Dar de alta"}
                          >
                            {isActivo ? (
                              <>
                                <UserXIcon className="h-3 w-3" />
                                <span>Baja</span>
                              </>
                            ) : (
                              <>
                                <UserCheckIcon className="h-3 w-3" />
                                <span>Alta</span>
                              </>
                            )}
                          </button>

                          {/* Botón de Editar */}
                          <button
                            onClick={() => {
                              if (tab === "personal") {
                                openPersonalDialog(item)
                              } else {
                                openDirectivoDialog(item)
                              }
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-[#002F6C] hover:bg-[#0E5296] hover:text-white transition-colors cursor-pointer shadow-2xs"
                            title="Editar"
                          >
                            <PencilIcon className="h-3.5 w-3.5" />
                          </button>

                          {/* Botón de Eliminar */}
                          <button
                            onClick={() => setItemAEliminar({ id: item.id, nombre: item.nombre, tipo: tab === "directorio" ? "directivo" : "personal" })}
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors cursor-pointer shadow-2xs"
                            title="Eliminar permanentemente"
                          >
                            <Trash2Icon className="h-3.5 w-3.5" />
                          </button>
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
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#002F6C] shadow-xs hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                title="Página anterior"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(idx + 1)}
                    className={`h-7 w-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      currentPage === idx + 1
                        ? "bg-[#0E5296] text-white shadow-xs"
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage >= totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#002F6C] shadow-xs hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
                title="Siguiente página"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>

            <span className="text-[11px] font-medium text-slate-400">
              Mostrando {Math.min(currentList.length, (currentPage - 1) * pageSize + 1)} - {Math.min(currentList.length, currentPage * pageSize)} de {currentList.length} registros
            </span>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* DIÁLOGOS DE CREACIÓN / EDICIÓN */}
      {/* ══════════════════════════════════════════════════════════════ */}

      {/* ── Modal Personal ── */}
      <Dialog
        open={pDialogOpen}
        onOpenChange={(o) => {
          setPDialogOpen(o)
          if (!o) { setPEditItem(null); setPFotoUrl(null) }
        }}
      >
        <DialogContent className="p-0 gap-0 overflow-hidden rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col">
          <div className="h-2 w-full bg-[#0E5296] shrink-0" />
          <div className="p-6 overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base font-black text-[#002F6C]">
                {pEditItem ? "Editar Funcionario" : "Registrar Nuevo Funcionario"}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                {pEditItem ? "Modifique la información del funcionario" : "Complete los datos del funcionario para integrarlo al padrón de RRHH"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handlePersonalSubmit} className="mt-4 space-y-3.5">
              {/* Banner con contraseña predeterminada y botón de regenerar */}
              {!pEditItem && (
                <div className="rounded-2xl border-2 border-[#0E5296]/20 bg-gradient-to-r from-blue-50/80 via-white to-amber-50/80 p-3.5 flex items-center justify-between gap-3 shadow-2xs">
                  <div>
                    <span className="text-xs font-bold text-[#002F6C]">Contraseña inicial de acceso:</span>
                    <p className="font-mono font-black text-[#0E5296] text-xs mt-0.5">{pDefaultPassword}</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newP = generarPasswordSegura()
                      setPDefaultPassword(newP)
                      setPPassword(newP)
                      toast.success("Nueva contraseña generada")
                    }}
                    className="rounded-xl border-slate-300 text-xs font-bold text-[#002F6C] hover:bg-white cursor-pointer"
                  >
                    <RefreshCwIcon className="mr-1 h-3.5 w-3.5 text-[#0E5296]" />
                    Generar Otra
                  </Button>
                </div>
              )}

              {/* ── Foto ── */}
              <div className="flex justify-center">
                <FotoUploader
                  fotoUrl={pFotoUrl}
                  onUploaded={(url) => setPFotoUrl(url)}
                  onRemove={() => setPFotoUrl(null)}
                  nombre={(pEditItem?.nombre) || "Nuevo Personal"}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#002F6C]">Nombres y Apellidos Completos *</Label>
                <Input name="nombre" required defaultValue={pEditItem?.nombre} placeholder="Ej. Maria Lopez Arce" className="h-10 text-xs" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#002F6C]">Cargo Institucional *</Label>
                <Input name="cargo" required defaultValue={pEditItem?.cargo} placeholder="Ej. Analista de Sistemas" className="h-10 text-xs" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#002F6C]">Correo Institucional</Label>
                  <Input name="email" type="email" defaultValue={pEditItem?.email ?? ""} placeholder="funcionario@correos.gob.bo" className="h-10 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#002F6C]">Teléfono / Celular</Label>
                  <Input name="telefono" defaultValue={pEditItem?.telefono ?? ""} placeholder="Ej. +591 71234567" className="h-10 text-xs" />
                </div>
              </div>

              {/* ── Contraseña de Acceso (Debajo de Correo Institucional) ── */}
              {pEditItem && (
                <div className="space-y-1.5 pt-1">
                  <Label className="text-xs font-bold text-[#002F6C] flex items-center gap-1.5">
                    <LockIcon className="h-3.5 w-3.5 text-[#0E5296]" />
                    Contraseña de Acceso
                  </Label>

                  {!isAdminUnlocked ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="password"
                        disabled
                        value="••••••••••••••••"
                        className="h-10 text-xs bg-slate-50 text-slate-400 font-mono tracking-widest cursor-not-allowed select-none border-slate-200 flex-1"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setShowAdminAuthModal(true)}
                        className="h-10 px-3.5 bg-[#0E5296] hover:bg-[#002F6C] text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs whitespace-nowrap shrink-0 flex items-center gap-1.5"
                      >
                        <EyeIcon className="h-3.5 w-3.5 text-[#FFCC00]" />
                        Ver Contraseña
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Input
                        type={showPPassword ? "text" : "password"}
                        value={pPassword}
                        onChange={(e) => setPPassword(e.target.value)}
                        placeholder="Escribir nueva contraseña o dejar en blanco..."
                        className="h-10 text-xs pr-20 bg-white border-emerald-300 focus:border-emerald-500 font-mono"
                        autoFocus
                      />
                      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            const pass = generarPasswordSegura()
                            setPPassword(pass)
                            setShowPPassword(true)
                            toast.success("Nueva clave generada")
                          }}
                          title="Generar clave aleatoria"
                          className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-[#0E5296] cursor-pointer"
                        >
                          <RefreshCwIcon className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPPassword((prev) => !prev)}
                          className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          {showPPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Cuadro de validación rápida de administrador */}
                  {showAdminAuthModal && !isAdminUnlocked && (
                    <div className="rounded-2xl border border-amber-300 bg-amber-50/90 p-3 space-y-2 animate-in fade-in">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#002F6C]">
                        <ShieldAlertIcon className="h-4 w-4 text-amber-600" />
                        Clave de Administrador requerida
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="password"
                          placeholder="Ingresa tu clave de admin..."
                          value={adminPasswordInput}
                          onChange={(e) => setAdminPasswordInput(e.target.value)}
                          className="h-9 bg-white text-xs rounded-xl flex-1 border-amber-300 focus:border-[#0E5296]"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              handleVerifyAdminPassword(e)
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowAdminAuthModal(false)
                            setAdminPasswordInput("")
                          }}
                          className="h-9 px-3 rounded-xl text-xs"
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          disabled={verifyingAdmin}
                          onClick={handleVerifyAdminPassword}
                          className="h-9 px-3.5 rounded-xl bg-[#0E5296] hover:bg-[#002F6C] text-white text-xs font-bold"
                        >
                          {verifyingAdmin ? <Loader2Icon className="h-3.5 w-3.5 animate-spin" /> : "Verificar"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}


              {pEditItem && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#002F6C]">Estado en funciones</Label>
                  <select
                    name="estado"
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold"
                    defaultValue={pEditItem.estado}
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo / Baja</option>
                    <option value="vacaciones">Vacaciones</option>
                    <option value="comision">Comisión</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" className="rounded-xl text-xs" onClick={() => setPDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-[#0E5296] hover:bg-[#002F6C] text-white font-bold rounded-xl text-xs cursor-pointer shadow-md shadow-[#0E5296]/20"
                >
                  {isPending ? "Guardando..." : "Guardar Funcionario"}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Modal Directorio Ejecutivo Simplificado ── */}
      <Dialog
        open={dDialogOpen}
        onOpenChange={(o) => {
          setDDialogOpen(o)
          if (!o) { setDEditItem(null); setDFotoUrl(null); setCandidateSearch("") }
        }}
      >
        <DialogContent className="p-0 gap-0 overflow-hidden rounded-2xl max-w-lg">
          <div className="h-2 w-full bg-[#0E5296]" />
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="text-base font-black text-[#002F6C]">
                {dEditItem ? "Editar Directivo" : "Nuevo Directivo / Autoridad"}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                {dEditItem ? "Actualice los datos de la autoridad ejecutiva" : "Seleccione o ingrese los datos de la autoridad institucional"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleDirectivoSubmit} className="mt-4 space-y-3.5">
              {/* ── Buscador / Autocompletar desde Funcionarios / Usuarios ── */}
              <div className="rounded-2xl border-2 border-[#002F6C]/15 bg-gradient-to-br from-blue-50/70 via-amber-50/40 to-white p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-black text-[#002F6C] flex items-center gap-1.5">
                    <SearchIcon className="h-3.5 w-3.5 text-[#0E5296]" />
                    Autocompletar desde Funcionario:
                  </Label>
                  <span className="text-[10px] text-slate-400 font-medium">Búsqueda rápida</span>
                </div>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Escribe para buscar funcionario (ej. Carlos, Laura...)"
                    value={candidateSearch}
                    onChange={(e) => setCandidateSearch(e.target.value)}
                    className="h-9 text-xs bg-white border-slate-200"
                  />
                  {filteredCandidatos.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border border-[#002F6C]/20 bg-white shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100">
                      {filteredCandidatos.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => seleccionarCandidato(c)}
                          className="w-full p-2.5 text-left hover:bg-blue-50/60 flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <div>
                            <p className="text-xs font-black text-[#002F6C]">{c.nombre}</p>
                            <p className="text-[10px] text-slate-500">{c.email || c.telefono || "Personal AGBC"}</p>
                          </div>
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-blue-100 text-[#0E5296]">
                            {c.cargo || "Personal"}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Foto ── */}
              <div className="flex justify-center">
                <FotoUploader
                  fotoUrl={dFotoUrl}
                  onUploaded={(url) => setDFotoUrl(url)}
                  onRemove={() => setDFotoUrl(null)}
                  nombre={dNombre || "Nuevo Directivo"}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#002F6C]">Nombre completo de la autoridad *</Label>
                <Input
                  name="nombre"
                  required
                  value={dNombre}
                  onChange={(e) => setDNombre(e.target.value)}
                  placeholder="Ej. Lic. Carlos Mendoza Vargas"
                  className="h-10 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#002F6C]">Dirección Institucional *</Label>
                <select
                  name="unidad"
                  required
                  value={dUnidad}
                  onChange={(e) => setDUnidad(e.target.value)}
                  className="w-full h-10 rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold text-[#002F6C]"
                >
                  {DIRECCIONES_DIRECTORIO.map((dir) => (
                    <option key={dir} value={dir}>
                      {dir}
                    </option>
                  ))}
                  {!DIRECCIONES_DIRECTORIO.includes(dUnidad as any) && dUnidad && (
                    <option value={dUnidad}>{dUnidad}</option>
                  )}
                </select>
              </div>

              {dEditItem && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#002F6C]">Estado</Label>
                  <select
                    name="estado"
                    className="w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold"
                    defaultValue={dEditItem.estado}
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" className="rounded-xl text-xs" onClick={() => setDDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-[#0E5296] hover:bg-[#002F6C] text-white font-bold rounded-xl text-xs cursor-pointer shadow-md shadow-[#0E5296]/20"
                >
                  {isPending ? "Guardando..." : "Guardar Directivo"}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Modal Dinámico de Confirmación de Cambios ── */}
      <Dialog open={confirmModalType !== null} onOpenChange={(open) => !open && setConfirmModalType(null)}>
        <DialogContent className="p-0 gap-0 overflow-hidden rounded-3xl max-w-md w-full">
          <div className={`h-2 w-full shrink-0 ${confirmModalType === "permanecer" ? "bg-emerald-600" : "bg-amber-500"}`} />
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className={`rounded-2xl p-2.5 shrink-0 ${confirmModalType === "permanecer" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                {confirmModalType === "permanecer" ? <CheckCircle2Icon className="h-6 w-6" /> : <Undo2Icon className="h-6 w-6" />}
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-base font-black text-[#002F6C]">
                  {confirmModalType === "permanecer" ? "¿Permanecer y fijar los cambios?" : "¿Revertir cambios de la importación?"}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-600 leading-relaxed">
                  {confirmModalType === "permanecer"
                    ? "¿Estás seguro de consolidar y guardar permanentemente todas las actualizaciones y nuevos registros en el padrón de RRHH?"
                    : "¿Estás seguro de deshacer la importación? Se eliminarán los nuevos registros y se restaurarán los valores previos del padrón."}
                </DialogDescription>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                disabled={processingAction}
                onClick={() => setConfirmModalType(null)}
                className="rounded-xl text-xs font-bold text-slate-600 cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={processingAction}
                onClick={confirmModalType === "permanecer" ? handleExecutePermanecer : handleExecuteRevertir}
                className={`rounded-xl text-xs font-bold text-white cursor-pointer shadow-xs ${
                  confirmModalType === "permanecer"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-amber-600 hover:bg-amber-700"
                }`}
              >
                {processingAction && <Loader2Icon className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                {confirmModalType === "permanecer" ? "Sí, Permanecer Cambios" : "Sí, Revertir Cambios"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Modal de Confirmación de Eliminación Permanente ── */}
      <Dialog
        open={Boolean(itemAEliminar)}
        onOpenChange={(open) => {
          if (!open && !eliminandoItem) setItemAEliminar(null)
        }}
      >
        <DialogContent className="p-0 gap-0 overflow-hidden rounded-3xl max-w-md border-2 border-red-500/20 bg-white shadow-2xl">
          <div className="h-2 w-full bg-gradient-to-r from-red-500 via-rose-600 to-red-700" />
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600 border border-red-200">
                <Trash2Icon className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-base font-black text-slate-900">
                  ¿Eliminar permanentemente a este {itemAEliminar?.tipo === "personal" ? "funcionario" : "directivo"}?
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 font-medium">
                  Esta acción es irreversible y definitiva.
                </DialogDescription>
              </div>
            </div>

            <div className="rounded-2xl border border-red-200 bg-red-50/70 p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-red-900">
                <AlertTriangleIcon className="h-4 w-4 text-red-600 shrink-0" />
                Eliminación física de la base de datos
              </div>
              <p className="text-xs text-red-800 leading-relaxed">
                Estás a punto de eliminar a <strong>{itemAEliminar?.nombre}</strong>.
                Todos sus datos y registros vinculados desaparecerán de forma permanente del sistema.
              </p>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                disabled={eliminandoItem}
                onClick={() => setItemAEliminar(null)}
                className="rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={eliminandoItem}
                onClick={handleConfirmarEliminacionFisica}
                className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-md shadow-red-600/20 cursor-pointer flex items-center gap-1.5"
              >
                {eliminandoItem ? (
                  <>
                    <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2Icon className="h-3.5 w-3.5" />
                    Sí, Eliminar Permanentemente
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Modal de Importación y Exportación Excel para RRHH ── */}
      <RrhhExcelDialog
        open={excelDialogOpen}
        onClose={() => setExcelDialogOpen(false)}
        personal={padronUnificado}
        onImportSuccess={() => {
          setHasImportedSnapshot(true)
          router.refresh()
        }}
      />
    </div>
  )
}
