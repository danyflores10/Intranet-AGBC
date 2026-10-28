"use client"

import React, { useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import {
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  FileSpreadsheet,
  UploadCloud,
  History,
  Eye,
  Download,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FolderTree,
  GitBranch,
  Layers,
  FileCheck,
  PlusCircle,
  Undo2,
  FileText,
  HelpCircle,
  ArrowRight,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface TourStep {
  id: string
  targetId: string | null
  titulo: string
  subtitulo: string
  categoria: string
  contenido: React.ReactNode
  placement?: "bottom" | "top" | "center"
}

interface Props {
  open: boolean
  onClose: () => void
}

export function DocumentosTourGuiado({ open, onClose }: Props) {
  const [mounted, setMounted] = useState(false)
  const [pasoIndex, setPasoIndex] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  
  // Estado para la simulación interactiva en el paso de importación
  const [simImportFase, setSimImportFase] = useState<"subiendo" | "analizado">("analizado")

  useEffect(() => {
    setMounted(true)
  }, [])

  const PASOS: TourStep[] = [
    {
      id: "inicio",
      targetId: null,
      titulo: "Bienvenido al Módulo de Gestión Documental",
      subtitulo: "Catálogo Oficial, Normativas y Archivos Digitales AGBC",
      categoria: "Introducción General",
      placement: "center",
      contenido: (
        <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          <p>
            Este módulo centraliza todo el patrimonio documental de la <strong>Agencia Boliviana de Correos</strong>: reglamentos, normativas, manuales, instructivos, formularios y circulares.
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
            <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-100 flex items-start gap-2">
              <FolderTree className="h-4 w-4 text-[#0E5296] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#002F6C] block">Estructura en 3 Niveles</strong>
                Dirección &gt; Subcategoría &gt; Tipo documental.
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-100 flex items-start gap-2">
              <GitBranch className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-emerald-900 block">Control de Versiones</strong>
                Identificación de vigencia y trazabilidad histórica.
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 italic pt-1">
            En los siguientes pasos te mostraremos cómo filtrar, exportar, importar con validación inteligente y editar documentos oficiales.
          </p>
        </div>
      ),
    },
    {
      id: "filtro-direccion",
      targetId: "tour-filtro-direccion",
      titulo: "1. Filtro por Direcciones Institucionales",
      subtitulo: "Nivel 1 de la Jerarquía Organizacional",
      categoria: "Navegación y Jerarquía",
      placement: "bottom",
      contenido: (
        <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
          <p>
            Permite segmentar instantáneamente los 89 documentos según las <strong>4 Direcciones oficiales</strong> de la AGBC:
          </p>
          <div className="grid grid-cols-2 gap-1.5 text-[10.5px] font-bold">
            <span className="px-2 py-1 rounded-lg bg-blue-50 text-[#002F6C] border border-blue-200">
              • Dirección General Ejecutiva (DGE)
            </span>
            <span className="px-2 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200">
              • Dirección Administrativa Financiera (DAF)
            </span>
            <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200">
              • Dirección de Operaciones (DO)
            </span>
            <span className="px-2 py-1 rounded-lg bg-rose-50 text-rose-900 border border-rose-200">
              • Dirección Comercial (DC)
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Al seleccionar una Dirección, el selector de subcategorías se adapta automáticamente mostrando solo sus unidades pertinentes.
          </p>
        </div>
      ),
    },
    {
      id: "filtro-sub-y-tipo",
      targetId: "tour-filtro-subcategoria",
      titulo: "2. Subcategorías y 6 Tipos Documentales",
      subtitulo: "Niveles 2 y 3: Clasificación Exacta",
      categoria: "Navegación y Jerarquía",
      placement: "bottom",
      contenido: (
        <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
          <p>
            Cada Dirección contiene sus <strong>Sub-áreas</strong> (Recursos Humanos, Tesorería, Sistemas, etc.), y dentro de cada una se organizan las <strong>6 categorías documentales estándar</strong>:
          </p>
          <div className="flex flex-wrap gap-1.5 text-[10px] font-black">
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">1. Circulares</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">2. Formularios</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">3. Instructivos</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">4. Manuales</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">5. Normativas</span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">6. Reglamentos</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Este orden garantiza que cualquier funcionario encuentre cualquier documento en menos de 3 clics.
          </p>
        </div>
      ),
    },
    {
      id: "filtro-vigencia",
      targetId: "tour-filtro-vigencia",
      titulo: "3. Filtro de Vigencia y Versiones",
      subtitulo: "Diferenciación de Normas Activas e Históricas",
      categoria: "Control de Vigencia",
      placement: "bottom",
      contenido: (
        <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
          <p>
            Te permite filtrar los documentos según su aplicación legal en la AGBC:
          </p>
          <div className="space-y-1.5 text-[11px]">
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200">
              <strong className="text-emerald-900 block">• Solo Vigentes (Norma Activa):</strong>
              Documentos de cumplimiento obligatorio actual. Solo la versión más reciente tiene este estado.
            </div>
            <div className="p-2 rounded-xl bg-slate-100 border border-slate-200">
              <strong className="text-slate-800 block">• Históricos / Derogados:</strong>
              Versiones previas que fueron sustituidas por una norma más reciente (conservadas para auditoría o consulta jurídica).
            </div>
            <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-200">
              <strong className="text-indigo-900 block">• Múltiples Versiones:</strong>
              Aísla las familias normativas que han evolucionado en el tiempo (ej. v1.0, v2.0, v3.0).
            </div>
            <div className="p-2 rounded-xl bg-amber-50 border border-amber-200">
              <strong className="text-amber-900 block">• Falta PDF:</strong>
              Muestra documentos aprobados que tienen pendiente la carga de su archivo físico digital.
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "exportar-catalogo",
      targetId: "tour-btn-exportar",
      titulo: "4. Exportar Catálogo Oficial a Excel",
      subtitulo: "Generación de Planilla Limpia con Hipervínculos",
      categoria: "Intercambio de Datos",
      placement: "bottom",
      contenido: (
        <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
          <p>
            Al hacer clic en <strong>Exportar Catálogo</strong>, se descarga automáticamente una planilla Excel oficial estructurada sin códigos técnicos innecesarios:
          </p>

          {/* Vista previa simulada del Excel oficial */}
          <div className="rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="bg-[#002F6C] text-white p-2 text-[10px] font-bold flex items-center justify-between">
              <span>AGENCIA BOLIVIANA DE CORREOS - CATÁLOGO GENERAL</span>
              <span className="text-[#FFCC00]">Formato Oficial</span>
            </div>
            <div className="overflow-x-auto text-[9.5px]">
              <table className="w-full text-left">
                <thead className="bg-[#002F6C] text-white font-bold">
                  <tr>
                    <th className="p-1.5">Nº</th>
                    <th className="p-1.5">TÍTULO DEL DOCUMENTO</th>
                    <th className="p-1.5">DIRECCIÓN</th>
                    <th className="p-1.5">VERSIÓN</th>
                    <th className="p-1.5">VIGENCIA</th>
                    <th className="p-1.5">ENLACE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  <tr>
                    <td className="p-1.5 font-bold">1</td>
                    <td className="p-1.5">Reglamento RE-SABS</td>
                    <td className="p-1.5">DAF</td>
                    <td className="p-1.5 font-bold text-emerald-700">v3.0</td>
                    <td className="p-1.5 text-emerald-700 font-bold">Vigente</td>
                    <td className="p-1.5 text-blue-600 underline">Ver Documento</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
            • Los hipervínculos dirigen directamente a <code>https://intranet.correos.gob.bo</code> para abrir el documento desde cualquier equipo.
          </p>
        </div>
      ),
    },
    {
      id: "importar-catalogo",
      targetId: "tour-btn-importar",
      titulo: "5. Importar Catálogo: Validación y Cotejo",
      subtitulo: "Carga Masiva con Detección de Cambios y Archivos Físicos",
      categoria: "Sincronización Inteligente",
      placement: "bottom",
      contenido: (
        <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
          <p>
            Al pulsar <strong>Importar Catálogo</strong>, se abre una ventana en 2 pasos: primero subes el Excel y opcionalmente varios PDFs, y luego el sistema realiza un análisis antes de guardar nada.
          </p>

          {/* Tarjetas de métricas interactivas de la simulación */}
          <div className="grid grid-cols-5 gap-1.5 text-center text-[10px]">
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200">
              <strong className="block text-sm font-black text-slate-800">89</strong>
              <span className="text-slate-500 font-bold">Evaluados</span>
            </div>
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
              <strong className="block text-sm font-black">+2</strong>
              <span className="font-bold">Nuevos</span>
            </div>
            <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-800">
              <strong className="block text-sm font-black">3</strong>
              <span className="font-bold">Modificados</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-700">
              <strong className="block text-sm font-black">84</strong>
              <span className="font-bold">Sin Cambios</span>
            </div>
            <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
              <strong className="block text-sm font-black">15</strong>
              <span className="font-bold">Falta PDF</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <p><strong>• Nuevos:</strong> Documentos agregados a la planilla que no existían.</p>
            <p><strong>• Modificados:</strong> Registros existentes con cambios en fecha, dirección, etc.</p>
            <p><strong>• Sin Cambios:</strong> Registros idénticos a los de la base de datos.</p>
            <p><strong>• Falta PDF:</strong> Documentos del catálogo pendientes de archivo físico.</p>
          </div>
        </div>
      ),
    },
    {
      id: "historial-cambios",
      targetId: "tour-btn-historial",
      titulo: "6. Historial de Cambios y Función 'Deshacer'",
      subtitulo: "Seguridad y Auditoría Total de Importaciones",
      categoria: "Auditoría Institucional",
      placement: "bottom",
      contenido: (
        <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
          <p>
            Cada vez que se importa un Excel, queda guardado un registro de auditoría con la fecha, hora exacta, usuario ejecutor y el detalle de cada cambio aplicado.
          </p>

          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-900">
            <Undo2 className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-xs font-bold text-rose-950">Botón 'Deshacer Cambios':</strong>
              <span className="text-[11px] leading-relaxed">
                Si importas una planilla por error o con datos incorrectos, puedes hacer clic en <strong>Deshacer cambios</strong> en el historial. El sistema eliminará los documentos nuevos creados y restaurará los valores previos automáticamente.
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "acciones-tabla",
      targetId: "tour-acciones-fila",
      titulo: "7. Acciones sobre Cada Documento",
      subtitulo: "Visualizar, Descargar, Editar y Eliminar",
      categoria: "Operaciones Rápidas",
      placement: "top",
      contenido: (
        <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
          <p>
            En el extremo derecho de cada fila dispones de las 4 acciones fundamentales:
          </p>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 rounded-xl bg-sky-50 border border-sky-100 flex items-center gap-2 text-[#002F6C]">
              <Eye className="h-4 w-4 shrink-0 text-[#0E5296]" />
              <span><strong>Ver:</strong> Visor interactivo en pantalla completa sin salir de la intranet.</span>
            </div>
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-2 text-emerald-900">
              <Download className="h-4 w-4 shrink-0 text-emerald-600" />
              <span><strong>Descargar:</strong> Descarga directa del archivo oficial en PDF, Word o Excel.</span>
            </div>
            <div className="p-2 rounded-xl bg-amber-50 border border-amber-100 flex items-center gap-2 text-amber-900">
              <Pencil className="h-4 w-4 shrink-0 text-amber-600" />
              <span><strong>Editar:</strong> Modificar título, fecha, versión, vigencia o cambiar el PDF.</span>
            </div>
            <div className="p-2 rounded-xl bg-rose-50 border border-rose-100 flex items-center gap-2 text-rose-900">
              <Trash2 className="h-4 w-4 shrink-0 text-rose-600" />
              <span><strong>Papelera:</strong> Eliminación segura con confirmación.</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "edicion-manual",
      targetId: null,
      titulo: "8. Edición Manual y Metadatos Oficiales",
      subtitulo: "Personalización Completa desde el Formulario",
      categoria: "Gestión Administrativa",
      placement: "center",
      contenido: (
        <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
          <p>
            Al editar un documento, tienes a tu disposición la sección <strong>Control de Versión, Vigencia y Catálogo Oficial</strong>:
          </p>

          <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
            <div>
              <span className="font-bold text-[#002F6C] block">Fecha de Emisión:</span>
              <span className="text-slate-500">Ej. <em>16 de junio de 2021</em></span>
            </div>
            <div>
              <span className="font-bold text-[#002F6C] block">Versión:</span>
              <span className="text-slate-500">Ej. <em>v1.0, v2.0, v3.0</em></span>
            </div>
            <div>
              <span className="font-bold text-[#002F6C] block">Vigencia:</span>
              <span className="text-slate-500">Vigente vs. Histórico/Derogado</span>
            </div>
            <div>
              <span className="font-bold text-[#002F6C] block">Archivo Digital:</span>
              <span className="text-slate-500">Disponible vs. Falta PDF</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
            También puedes sustituir o subir un nuevo archivo PDF, DOCX o XLSX en cualquier momento.
          </p>
        </div>
      ),
    },
    {
      id: "fin-tour",
      targetId: "tour-btn-nuevo",
      titulo: "¡Listo para Gestionar los Documentos!",
      subtitulo: "Crear Nuevos Documentos o Sincronizar",
      categoria: "Finalización",
      placement: "bottom",
      contenido: (
        <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
          <p>
            Puedes crear documentos individuales con el botón <strong>+ Subir nuevo documento</strong>, o trabajar en masa utilizando las opciones de <strong>Exportar e Importar Catálogo</strong>.
          </p>

          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-2.5">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
            <div className="text-[11px] leading-relaxed">
              <strong>El catálogo se encuentra 100% sincronizado y estructurado.</strong> Puedes volver a iniciar este tutorial interactivo cuando lo necesites.
            </div>
          </div>
        </div>
      ),
    },
  ]

  const pasoActual = PASOS[pasoIndex]

  // Actualizar la posición del target al cambiar de paso
  useEffect(() => {
    if (!open) return

    if (!pasoActual.targetId) {
      setTargetRect(null)
      return
    }

    const el = document.getElementById(pasoActual.targetId)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" })
      const updateRect = () => {
        setTargetRect(el.getBoundingClientRect())
      }
      updateRect()
      window.addEventListener("resize", updateRect)
      window.addEventListener("scroll", updateRect, true)
      return () => {
        window.removeEventListener("resize", updateRect)
        window.removeEventListener("scroll", updateRect, true)
      }
    } else {
      setTargetRect(null)
    }
  }, [open, pasoIndex, pasoActual])

  // Navegación con teclado
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" && pasoIndex < PASOS.length - 1) {
        setPasoIndex((p) => p + 1)
      } else if (e.key === "ArrowLeft" && pasoIndex > 0) {
        setPasoIndex((p) => p - 1)
      } else if (e.key === "Escape") {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [open, pasoIndex, PASOS.length, onClose])

  if (!mounted || !open) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-hidden select-none">
      {/* Fondo oscuro con difuminado */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity duration-300"
      />

      {/* Recuadro de luz (Spotlight) enfocado sobre el elemento del paso actual */}
      {targetRect && (
        <div
          style={{
            top: `${Math.max(0, targetRect.top - 6)}px`,
            left: `${Math.max(0, targetRect.left - 6)}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`,
          }}
          className="absolute z-[10000] rounded-2xl pointer-events-none transition-all duration-300 ring-4 ring-[#FFCC00] ring-offset-4 ring-offset-slate-950 shadow-[0_0_50px_rgba(255,204,0,0.45)]"
        />
      )}

      {/* Modal / Tarjeta Flotante del Paso Actual */}
      <div className="absolute inset-0 z-[10001] flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-[#002F6C]/25 overflow-hidden pointer-events-auto flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
          {/* Header del Paso */}
          <div className="bg-gradient-to-r from-[#002F6C] via-[#0E5296] to-[#002F6C] p-5 text-white shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#FFCC00] text-[#002F6C] font-black shadow-md">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#FFCC00] block">
                    {pasoActual.categoria} • Paso {pasoIndex + 1} de {PASOS.length}
                  </span>
                  <h3 className="text-base font-black truncate text-white">{pasoActual.titulo}</h3>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="h-8 w-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="Cerrar tutorial"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Subtítulo & Contenido */}
          <div className="p-6 overflow-y-auto space-y-4">
            <p className="text-xs font-bold text-[#002F6C] dark:text-blue-300">
              {pasoActual.subtitulo}
            </p>

            {pasoActual.contenido}
          </div>

          {/* Footer con Controles de Navegación */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 rounded-xl cursor-pointer"
            >
              Saltar tutorial
            </Button>

            {/* Indicadores de bolitas */}
            <div className="hidden sm:flex items-center gap-1.5">
              {PASOS.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPasoIndex(i)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    i === pasoIndex ? "w-6 bg-[#0E5296]" : "w-2 bg-slate-300 hover:bg-slate-400"
                  }`}
                  title={`Ir al paso ${i + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pasoIndex === 0}
                onClick={() => setPasoIndex((p) => Math.max(0, p - 1))}
                className="h-9 rounded-xl text-xs font-bold gap-1 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Anterior</span>
              </Button>

              {pasoIndex < PASOS.length - 1 ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setPasoIndex((p) => Math.min(PASOS.length - 1, p + 1))}
                  className="h-9 rounded-xl text-xs font-bold bg-[#0E5296] hover:bg-[#002F6C] text-white gap-1 cursor-pointer shadow-xs"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={onClose}
                  className="h-9 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white gap-1 cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>¡Entendido!</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
