import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

import { pool } from "@/db"

// Rate limiting: max 5 intentos de verificación por email cada 15 min
const verifyRateMap = new Map<string, { count: number; resetAt: number }>()
const VERIFY_MAX = 5
const VERIFY_WINDOW = 15 * 60 * 1000

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json()

    if (!email || !code) {
      return NextResponse.json(
        { error: "Correo y código son requeridos." },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Rate limit por email para evitar fuerza bruta en el código
    const now = Date.now()
    const key = `verify:${normalizedEmail}`
    const entry = verifyRateMap.get(key)
    if (entry && now <= entry.resetAt && entry.count >= VERIFY_MAX) {
      return NextResponse.json(
        { error: "Demasiados intentos. Solicita un nuevo código." },
        { status: 429 }
      )
    }
    if (!entry || now > entry.resetAt) {
      verifyRateMap.set(key, { count: 1, resetAt: now + VERIFY_WINDOW })
    } else {
      entry.count++
    }

    const identifier = `reset:${normalizedEmail}`

    const { rows } = await pool.query(
      'SELECT value, expires_at FROM "verifications" WHERE identifier = $1',
      [identifier]
    )

    // Comparación segura usando timingSafeEqual
    const validEntry = rows.find(
      (entry: { value: string; expires_at: Date }) => {
        if (new Date(entry.expires_at) <= new Date()) return false
        try {
          return crypto.timingSafeEqual(
            Buffer.from(entry.value),
            Buffer.from(code)
          )
        } catch {
          return false
        }
      }
    )

    if (!validEntry) {
      return NextResponse.json(
        { error: "Código inválido o expirado." },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error verifying code:", error)
    return NextResponse.json(
      { error: "Error al verificar el código." },
      { status: 500 }
    )
  }
}
