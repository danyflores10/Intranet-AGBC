import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

import { pool } from "@/db"
import { sendResetCode } from "@/lib/email"

// Rate limiting en memoria: max 3 intentos por email cada 15 min
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX = 3
const RATE_LIMIT_WINDOW = 15 * 60 * 1000 // 15 min

function checkRateLimit(key: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return true
  }
  if (entry.count >= RATE_LIMIT_MAX) return false
  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "El correo electrónico es requerido." },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Rate limit por email
    if (!checkRateLimit(normalizedEmail)) {
      return NextResponse.json(
        { error: "Demasiados intentos. Espera 15 minutos antes de volver a intentar." },
        { status: 429 }
      )
    }

    // Check if user exists
    const { rows: users } = await pool.query(
      'SELECT id FROM "user" WHERE email = $1 LIMIT 1',
      [normalizedEmail]
    )

    if (users.length === 0) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({ success: true })
    }

    // Generate 6-digit code
    const code = crypto.randomInt(100000, 999999).toString()
    const id = crypto.randomUUID()
    const identifier = `reset:${normalizedEmail}`

    // Delete old verification entries for this email
    await pool.query(
      'DELETE FROM "verification" WHERE identifier = $1',
      [identifier]
    )

    // Store verification code (expires in 10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
    await pool.query(
      'INSERT INTO "verification" (id, identifier, value, expires_at, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW())',
      [id, identifier, code, expiresAt]
    )

    // Send email
    await sendResetCode(normalizedEmail, code)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error sending reset code:", error)
    return NextResponse.json(
      { error: "Error al enviar el código. Inténtalo más tarde." },
      { status: 500 }
    )
  }
}
