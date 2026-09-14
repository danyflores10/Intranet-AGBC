import { NextRequest, NextResponse } from "next/server"
import { sendWelcomeCredentialsEmail } from "@/lib/email"
import { obtenerSesionConAccesoActual } from "@/lib/auth/session-access"
import { PERMISOS } from "@/lib/auth/permisos"
import { db } from "@/db"
import { users, account, personal } from "@/db/schema"
import { eq, or } from "drizzle-orm"

export async function POST(req: NextRequest) {
  try {
    const sesion = await obtenerSesionConAccesoActual()
    if (!sesion) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const tienePermiso = sesion.roles.includes("super_admin") || sesion.permissions.includes(PERMISOS.USUARIOS.CREAR) || sesion.permissions.includes(PERMISOS.RRHH.CREAR)
    if (!tienePermiso) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const body = await req.json()
    const { userId, personalId, email, password } = body

    let targetEmail = email
    let targetName = "Funcionario"
    let targetInstitutionalEmail = email
    let targetCi = undefined
    let targetPassword = password || "Correos2026!"

    if (userId) {
      const [usr] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
      if (usr) {
        targetName = `${usr.firstName} ${usr.lastNamePaternal}`.trim()
        targetInstitutionalEmail = usr.institutionalEmail
        targetEmail = usr.email || usr.institutionalEmail
        targetCi = usr.nationalId

        const [acc] = await db.select().from(account).where(eq(account.userId, usr.id)).limit(1)
        if (acc?.idToken) {
          targetPassword = acc.idToken
        }
      }
    } else if (personalId) {
      const [p] = await db.select().from(personal).where(eq(personal.id, personalId)).limit(1)
      if (p) {
        targetName = p.nombre
        targetEmail = p.email || targetEmail
        targetCi = p.ci
      }
    }

    if (!targetEmail || !targetEmail.includes("@")) {
      return NextResponse.json({ error: "El correo del destinatario no es válido" }, { status: 400 })
    }

    const result = await sendWelcomeCredentialsEmail({
      to: targetEmail,
      nombre: targetName,
      emailInstitucional: targetInstitutionalEmail,
      password: targetPassword,
      ci: targetCi,
    })

    return NextResponse.json({
      success: true,
      message: `Credenciales enviadas a ${targetEmail}`,
      details: result,
    })
  } catch (error: any) {
    console.error("Error en API /api/usuarios/send-credentials:", error)
    return NextResponse.json({ error: error.message || "Error al enviar credenciales" }, { status: 500 })
  }
}
