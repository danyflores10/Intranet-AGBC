import { NextRequest, NextResponse } from "next/server"
import { hashPassword } from "better-auth/crypto"

import { pool } from "@/db"

export async function POST(req: NextRequest) {
  try {
    const { email, code, newPassword } = await req.json()

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos." },
        { status: 400 }
      )
    }

    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres." },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()
    const identifier = `reset:${normalizedEmail}`

    // Verify code is still valid
    const { rows: verifyRows } = await pool.query(
      'SELECT value, expires_at FROM "verification" WHERE identifier = $1',
      [identifier]
    )

    const validEntry = verifyRows.find(
      (entry: { value: string; expires_at: Date }) =>
        entry.value === code && new Date(entry.expires_at) > new Date()
    )

    if (!validEntry) {
      return NextResponse.json(
        { error: "Código inválido o expirado. Solicita uno nuevo." },
        { status: 400 }
      )
    }

    // Find user
    const { rows: users } = await pool.query(
      'SELECT id FROM "user" WHERE email = $1 LIMIT 1',
      [normalizedEmail]
    )

    if (users.length === 0) {
      return NextResponse.json(
        { error: "Usuario no encontrado." },
        { status: 404 }
      )
    }

    const userId = users[0].id

    // Hash new password
    const hashedPassword = await hashPassword(newPassword)

    // Update password in the credential account
    await pool.query(
      'UPDATE "account" SET password = $1, updated_at = NOW() WHERE user_id = $2',
      [hashedPassword, userId]
    )

    // Delete used verification entries
    await pool.query(
      'DELETE FROM "verification" WHERE identifier = $1',
      [identifier]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error resetting password:", error)
    return NextResponse.json(
      { error: "Error al restablecer la contraseña." },
      { status: 500 }
    )
  }
}
