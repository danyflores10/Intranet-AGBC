"use server"

import { db } from "@/db"
import { users, personal } from "@/db/schema"
import { eq, desc } from "drizzle-orm"

export interface Cumpleanero {
  id: string
  nombre: string
  cargo: string
  unidad: string
  email?: string | null
  foto?: string | null
  fechaNacimiento: string // YYYY-MM-DD
  dia: number
  mes: number // 1 - 12
  esHoy: boolean
  esEsteMes: boolean
  diasRestantes: number
}

const MESES_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]

export async function obtenerCumpleaneros(mesFiltro?: number): Promise<{
  hoy: Cumpleanero[]
  esteMes: Cumpleanero[]
  todosMeses: Cumpleanero[]
  mesActualNombre: string
}> {
  try {
    const ahora = new Date()
    const diaActual = ahora.getDate()
    const mesActual = ahora.getMonth() + 1 // 1-12
    const mesConsulta = mesFiltro || mesActual

    const [usuariosDb, personalDb] = await Promise.all([
      db.select().from(users),
      db.select().from(personal),
    ])

    // Mapa de personal para obtener cargo y unidad
    const personalMap = new Map<string, typeof personalDb[0]>()
    for (const p of personalDb) {
      if (p.email) personalMap.set(p.email.toLowerCase().trim(), p)
    }

    const cumpleaneros: Cumpleanero[] = []
    const processedEmails = new Set<string>()
    const processedNames = new Set<string>()

    // Función auxiliar para extraer dia y mes de una fecha
    const parseDiaMes = (val?: string | Date | null): { dia: number; mes: number; fechaStr: string } | null => {
      if (!val) return null
      const str = typeof val === "string" ? val.split("T")[0] : val.toISOString().split("T")[0]
      const parts = str.split("-")
      if (parts.length === 3) {
        const anio = parseInt(parts[0], 10)
        const mes = parseInt(parts[1], 10)
        const dia = parseInt(parts[2], 10)
        // Ignorar fechas con año 2026 que fueron fechas de registro por defecto, a menos que provengan de fechaNacimiento explícita
        if (!isNaN(mes) && !isNaN(dia) && mes >= 1 && mes <= 12 && dia >= 1 && dia <= 31) {
          return { dia, mes, fechaStr: str }
        }
      }
      return null
    }

    // 1. Procesar personal registrado con fecha de nacimiento real
    for (const p of personalDb) {
      if (!p.fechaNacimiento) continue

      const fechaParsed = parseDiaMes(p.fechaNacimiento)
      if (!fechaParsed) continue

      const { dia, mes, fechaStr } = fechaParsed
      const email = p.email ? p.email.toLowerCase().trim() : ""
      if (email) processedEmails.add(email)
      processedNames.add(p.nombre.toLowerCase().trim())

      const usuarioRel = usuariosDb.find(
        (u) =>
          (email && (u.email?.toLowerCase().trim() === email || u.institutionalEmail?.toLowerCase().trim() === email)) ||
          `${u.firstName} ${u.lastNamePaternal}`.toLowerCase().trim() === p.nombre.toLowerCase().trim()
      )

      const esHoy = dia === diaActual && mes === mesActual
      const esEsteMes = mes === mesActual

      // Calcular días restantes exactos hasta el próximo cumpleaños
      const hoySinHora = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
      const cumpleEsteAno = new Date(ahora.getFullYear(), mes - 1, dia)
      if (cumpleEsteAno < hoySinHora) {
        cumpleEsteAno.setFullYear(ahora.getFullYear() + 1)
      }
      const diasRestantes = Math.round((cumpleEsteAno.getTime() - hoySinHora.getTime()) / (1000 * 60 * 60 * 24))

      cumpleaneros.push({
        id: usuarioRel?.id || p.id,
        nombre: p.nombre,
        cargo: p.cargo || "Personal",
        unidad: p.unidad || "General",
        email: p.email || null,
        foto: usuarioRel?.image || p.foto || null,
        fechaNacimiento: fechaStr,
        dia,
        mes,
        esHoy,
        esEsteMes,
        diasRestantes,
      })
    }

    // 2. Procesar usuarios que tengan fecha de nacimiento válida y no hayan sido procesados
    for (const u of usuariosDb) {
      const email = (u.email || u.institutionalEmail || "").toLowerCase().trim()
      const nombreCompleto = `${u.firstName} ${u.lastNamePaternal} ${u.lastNameMaternal || ""}`.trim()
      if (email && processedEmails.has(email)) continue
      if (processedNames.has(nombreCompleto.toLowerCase().trim())) continue

      if (!u.dateOfBirth) continue
      const fechaParsed = parseDiaMes(u.dateOfBirth)
      if (!fechaParsed) continue

      // Si el año es >= 2025, probablemente fue fecha de creación por defecto y no de nacimiento real
      const anio = parseInt(fechaParsed.fechaStr.split("-")[0], 10)
      if (anio >= 2025) continue

      const { dia, mes, fechaStr } = fechaParsed
      const infoPersonal = personalMap.get(email)

      const esHoy = dia === diaActual && mes === mesActual
      const esEsteMes = mes === mesActual

      const hoySinHora = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())
      const cumpleEsteAno = new Date(ahora.getFullYear(), mes - 1, dia)
      if (cumpleEsteAno < hoySinHora) {
        cumpleEsteAno.setFullYear(ahora.getFullYear() + 1)
      }
      const diasRestantes = Math.round((cumpleEsteAno.getTime() - hoySinHora.getTime()) / (1000 * 60 * 60 * 24))

      cumpleaneros.push({
        id: u.id,
        nombre: nombreCompleto,
        cargo: infoPersonal?.cargo || "Funcionario Institucional",
        unidad: infoPersonal?.unidad || "Dirección General",
        email: email || null,
        foto: u.image || infoPersonal?.foto || null,
        fechaNacimiento: fechaStr,
        dia,
        mes,
        esHoy,
        esEsteMes,
        diasRestantes,
      })
    }

    // Ordenar: primero los de hoy, luego por orden de día en el mes
    cumpleaneros.sort((a, b) => {
      if (a.esHoy && !b.esHoy) return -1
      if (!a.esHoy && b.esHoy) return 1
      if (a.mes === b.mes) return a.dia - b.dia
      return a.mes - b.mes
    })

    const hoy = cumpleaneros.filter((c) => c.esHoy)
    const esteMes = cumpleaneros.filter((c) => c.mes === mesConsulta)

    return {
      hoy,
      esteMes,
      todosMeses: cumpleaneros,
      mesActualNombre: MESES_ES[mesConsulta - 1],
    }
  } catch (error) {
    console.error("Error al obtener cumpleañeros:", error)
    return {
      hoy: [],
      esteMes: [],
      todosMeses: [],
      mesActualNombre: "Mes Actual",
    }
  }
}

// ── Verificar si el usuario en sesión cumple años hoy ──
export async function verificarEsCumpleanosUsuario(usuarioId: string): Promise<{
  esCumpleanos: boolean
  nombre: string
  cargo: string
}> {
  try {
    const [u] = await db.select().from(users).where(eq(users.id, usuarioId))
    if (!u) return { esCumpleanos: false, nombre: "", cargo: "" }

    const ahora = new Date()
    const diaActual = ahora.getDate()
    const mesActual = ahora.getMonth() + 1

    let esCumpleanos = false
    if (u.dateOfBirth) {
      const dObj = new Date(u.dateOfBirth)
      if (!isNaN(dObj.getTime())) {
        const dia = dObj.getUTCDate()
        const mes = dObj.getUTCMonth() + 1
        esCumpleanos = dia === diaActual && mes === mesActual
      }
    }

    const nombreCompleto = `${u.firstName} ${u.lastNamePaternal}`.trim()
    return {
      esCumpleanos,
      nombre: nombreCompleto,
      cargo: "Funcionario Institucional",
    }
  } catch {
    return { esCumpleanos: false, nombre: "", cargo: "" }
  }
}
