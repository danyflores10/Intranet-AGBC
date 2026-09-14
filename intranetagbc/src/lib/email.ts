import nodemailer from "nodemailer"
import { db } from "@/db"
import { emailLogs } from "@/db/schema"

// Helper de validación de email
export function validarEmail(email?: string | null): boolean {
  if (!email || typeof email !== "string") return false
  const trimmed = email.trim()
  if (trimmed.length < 5 || trimmed.length > 254) return false
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/
  return emailRegex.test(trimmed)
}

// Configuración SMTP adaptable (Soporta variables MAIL_* y SMTP_*)
export function getEmailConfig() {
  const host = process.env.MAIL_HOST || process.env.SMTP_HOST || "zimbra.correos.gob.bo"
  const port = Number(process.env.MAIL_PORT || process.env.SMTP_PORT || 587)
  const user = process.env.MAIL_USERNAME || process.env.SMTP_USER || ""
  const pass = process.env.MAIL_PASSWORD || process.env.SMTP_PASS || ""
  const encryption = (process.env.MAIL_ENCRYPTION || "").toLowerCase()
  const secure = port === 465 || encryption === "ssl"

  const fromAddress = process.env.MAIL_FROM_ADDRESS || process.env.SMTP_FROM || user || "noreply@correos.gob.bo"
  const fromName = process.env.MAIL_FROM_NAME || "Correos de Bolivia"
  const from = `"${fromName}" <${fromAddress}>`

  const appUrl = (process.env.APP_URL || process.env.NEXTAUTH_URL || process.env.BETTER_AUTH_URL || "https://intranet.correos.gob.bo:8122").replace(/\/$/, "")

  return {
    host,
    port,
    secure,
    user,
    pass,
    from,
    fromAddress,
    fromName,
    appUrl,
  }
}

// Creación de Transporter con manejo de TLS y Timeouts
export function createTransporter() {
  const config = getEmailConfig()

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    tls: {
      rejectUnauthorized: false, // Permite compatibilidad con certificados institucionales Zimbra
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  })
}

// Registro en base de datos de envíos de correo
export async function registrarEmailLog({
  destinatarioNombre,
  destinatarioEmail,
  tipo,
  asunto,
  estado,
  errorMensaje,
}: {
  destinatarioNombre: string
  destinatarioEmail: string
  tipo: "cuenta_creada" | "reenvio_credenciales" | "correo_prueba" | "envio_masivo"
  asunto: string
  estado: "enviado" | "error"
  errorMensaje?: string | null
}) {
  try {
    // Sanitizar mensaje de error para NUNCA exponer contraseñas
    const cleanError = errorMensaje ? errorMensaje.slice(0, 1000) : null

    await db.insert(emailLogs).values({
      destinatarioNombre: destinatarioNombre.slice(0, 200),
      destinatarioEmail: destinatarioEmail.slice(0, 200),
      tipo,
      asunto: asunto.slice(0, 300),
      estado,
      errorMensaje: cleanError,
    })
  } catch (err) {
    console.error("Error al registrar email log en base de datos:", err)
  }
}

// Función para probar conectividad SMTP
export async function verifySmtpConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const transporter = createTransporter()
    await transporter.verify()
    return {
      success: true,
      message: "Conexión con el servidor SMTP institucional establecida correctamente.",
    }
  } catch (error: any) {
    let msg = "No se pudo conectar al servidor SMTP."
    if (error?.code === "ECONNREFUSED") {
      msg = "Conexión rechazada por el servidor SMTP. Verifique host y puerto."
    } else if (error?.code === "ETIMEDOUT") {
      msg = "Tiempo de espera agotado al conectar al servidor SMTP."
    } else if (error?.responseCode === 535 || error?.message?.includes("auth")) {
      msg = "Error de autenticación SMTP. Usuario o contraseña incorrectos."
    } else if (error?.message) {
      msg = `Error SMTP: ${error.message}`
    }
    return { success: false, message: msg }
  }
}

/* ══════════════════════════════════════════════════════════════
 * 1. ENVÍO DE CÓDIGO DE RECUPERACIÓN / RESET PASSWORD
 * ══════════════════════════════════════════════════════════════ */
export async function sendResetCode(to: string, code: string) {
  const config = getEmailConfig()
  const digits = code.split("")
  const year = new Date().getFullYear()

  if (!validarEmail(to)) {
    throw new Error("Dirección de correo electrónico inválida")
  }

  const transporter = createTransporter()
  const asunto = "🔐 Código de verificación — Correos de Bolivia"

  try {
    await transporter.sendMail({
      from: config.from,
      to,
      subject: asunto,
      html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f1eb; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f1eb; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width: 520px; width: 100%; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 8px 40px rgba(0,0,0,0.08);">
          <!-- Barra tricolor Bolivia -->
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="height: 5px; background-color: #C41E3A; width: 33.33%;"></td>
                  <td style="height: 5px; background-color: #FFB300; width: 33.34%;"></td>
                  <td style="height: 5px; background-color: #2E7D32; width: 33.33%;"></td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Header con logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #002F6C 0%, #0E5296 50%, #0A192F 100%); padding: 32px; text-align: center;">
              <h2 style="margin: 0 0 6px; color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">Correos de Bolivia</h2>
              <p style="margin: 0; color: #FFCC00; font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">Área de Sistemas</p>
            </td>
          </tr>
          <!-- Título -->
          <tr>
            <td style="padding: 28px 32px 8px; text-align: center;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #002F6C;">Código de verificación</h1>
              <p style="margin: 12px 0 0; font-size: 14px; color: #4B5563; line-height: 1.6;">
                Has solicitado restablecer tu contraseña. Ingresa el siguiente código en la plataforma:
              </p>
            </td>
          </tr>
          <!-- Código -->
          <tr>
            <td style="padding: 16px 32px 24px; text-align: center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto; background: #FFFBEB; border: 2px solid #FFCC00; border-radius: 16px; padding: 16px 20px;">
                <tr>
                  ${digits.map(d => `<td style="padding: 0 4px;"><span style="display: inline-block; width: 40px; height: 50px; line-height: 50px; background: #ffffff; border-radius: 8px; font-size: 26px; font-weight: 800; color: #002F6C; text-align: center; border: 1px solid #E2E8F0; box-shadow: 0 2px 6px rgba(0,0,0,0.06);">${d}</span></td>`).join("")}
                </tr>
              </table>
            </td>
          </tr>
          <!-- Timer -->
          <tr>
            <td style="padding: 0 32px 20px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #B45309; font-weight: 600;">
                ⏱️ Este código expira en <strong>10 minutos</strong>.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background: #0A192F; padding: 20px 32px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #94A3B8;">&copy; ${year} Correos de Bolivia. Todos los derechos reservados.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    })

    await registrarEmailLog({
      destinatarioNombre: to,
      destinatarioEmail: to,
      tipo: "reenvio_credenciales",
      asunto,
      estado: "enviado",
    })

    return { success: true }
  } catch (error: any) {
    await registrarEmailLog({
      destinatarioNombre: to,
      destinatarioEmail: to,
      tipo: "reenvio_credenciales",
      asunto,
      estado: "error",
      errorMensaje: error?.message || "Error al enviar código de verificación",
    })
    throw error
  }
}

/* ══════════════════════════════════════════════════════════════
 * 2. ENVÍO DE CREDENCIALES (CREACIÓN O REENVÍO)
 * ══════════════════════════════════════════════════════════════ */
export async function sendWelcomeCredentialsEmail({
  to,
  nombre,
  emailInstitucional,
  usuario,
  password,
  esReenvio = false,
}: {
  to: string
  nombre: string
  emailInstitucional?: string
  usuario?: string
  password?: string
  esReenvio?: boolean
}): Promise<{ success: boolean; message?: string; error?: string }> {
  const config = getEmailConfig()
  const year = new Date().getFullYear()
  const loginUrl = `${config.appUrl}/`
  const passwordToShow = password || "Correos2026!"
  const usuarioMostrar = usuario || emailInstitucional || to

  if (!validarEmail(to)) {
    return {
      success: false,
      error: `La dirección de correo "${to}" tiene un formato inválido.`,
    }
  }

  const asunto = esReenvio
    ? "🔑 Reenvío de Credenciales de Acceso — Intranet Institucional"
    : "🚀 Bienvenido(a) al Sistema — Credenciales de Acceso (Intranet Institucional)"

  const tipoLog = esReenvio ? "reenvio_credenciales" : "cuenta_creada"

  try {
    const transporter = createTransporter()

    // Destinatarios: Se envía al correo registrado (personal/gmail/etc.) y al institucional si son distintos y válidos
    const destinatariosList = [to.trim()]
    if (emailInstitucional && validarEmail(emailInstitucional) && emailInstitucional.toLowerCase() !== to.toLowerCase()) {
      destinatariosList.push(emailInstitucional.trim())
    }

    await transporter.sendMail({
      from: config.from,
      to: destinatariosList.join(", "),
      subject: asunto,
      html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f6f9; padding: 30px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width: 560px; width: 100%; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #E2E8F0;">

          <!-- Barra Tricolor de Bolivia -->
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="height: 5px; background-color: #C41E3A; width: 33.33%;"></td>
                  <td style="height: 5px; background-color: #FFB300; width: 33.34%;"></td>
                  <td style="height: 5px; background-color: #2E7D32; width: 33.33%;"></td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Encabezado Institucional -->
          <tr>
            <td style="background: linear-gradient(135deg, #002F6C 0%, #0E5296 50%, #0A192F 100%); padding: 32px 28px; text-align: center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td style="text-align: center;">
                    <h1 style="margin: 0 0 6px; color: #ffffff; font-size: 22px; font-weight: 900; letter-spacing: -0.5px;">
                      Correos de Bolivia
                    </h1>
                    <p style="margin: 0; color: #FFCC00; font-size: 13px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">
                      Área de Sistemas
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Título y Saludo Personalizado -->
          <tr>
            <td style="padding: 28px 28px 12px;">
              <h2 style="margin: 0 0 12px; font-size: 19px; font-weight: 800; color: #002F6C;">
                Bienvenido al sistema
              </h2>
              <p style="margin: 0 0 12px; font-size: 14px; color: #334155; line-height: 1.6;">
                Estimado/a <strong>${nombre}</strong>:
              </p>
              <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.6;">
                ${
                  esReenvio
                    ? "Se han actualizado y reenviado sus credenciales para ingresar a la Intranet Institucional. A continuación encontrará sus datos de acceso:"
                    : "Su cuenta de acceso a la Intranet Institucional ha sido creada correctamente. A continuación encontrará sus datos de acceso:"
                }
              </p>
            </td>
          </tr>

          <!-- Cuadro Visual de Credenciales -->
          <tr>
            <td style="padding: 8px 28px 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #F8FAFC; border: 2px solid #E2E8F0; border-radius: 12px; padding: 18px 20px;">
                <tr>
                  <td style="padding-bottom: 12px; border-bottom: 1px dashed #CBD5E1;">
                    <span style="font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px;">Usuario de Acceso:</span>
                    <div style="font-size: 15px; font-weight: 800; color: #002F6C; margin-top: 4px; font-family: 'Courier New', monospace;">
                      ${usuarioMostrar}
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 12px;">
                    <span style="font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px;">Contraseña ${esReenvio ? "Temporal" : "Inicial"}:</span>
                    <div style="margin-top: 6px;">
                      <span style="display: inline-block; background: #002F6C; color: #FFCC00; font-family: 'Courier New', monospace; font-size: 16px; font-weight: 800; padding: 7px 14px; border-radius: 8px; letter-spacing: 1px;">
                        ${passwordToShow}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Botón de Ingreso al Sistema -->
          <tr>
            <td style="padding: 0 28px 20px; text-align: center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td align="center" style="border-radius: 10px; background-color: #0E5296;">
                    <a href="${loginUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 14px; font-weight: 800; color: #ffffff; text-decoration: none; border-radius: 10px; text-transform: uppercase; letter-spacing: 0.5px;">
                      👉 INGRESAR AL SISTEMA
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Link alternativo -->
              <p style="margin: 14px 0 0; font-size: 11px; color: #64748B; line-height: 1.5;">
                Si el botón no funciona, copie y pegue el siguiente enlace en su navegador web:
              </p>
              <p style="margin: 4px 0 0; font-size: 11px; word-break: break-all;">
                <a href="${loginUrl}" target="_blank" style="color: #0E5296; font-weight: 700; text-decoration: underline;">
                  ${loginUrl}
                </a>
              </p>
            </td>
          </tr>

          <!-- Avisos de Seguridad y Soporte -->
          <tr>
            <td style="padding: 0 28px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #FFFBEB; border-left: 4px solid #F59E0B; border-radius: 8px; padding: 12px 16px; margin-bottom: 12px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 4px; font-size: 11px; font-weight: 800; color: #B45309; text-transform: uppercase; letter-spacing: 0.5px;">
                      🔒 Aviso de Seguridad:
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #78350F; line-height: 1.5;">
                      Por seguridad, se recomienda cambiar su contraseña después de iniciar sesión en su primer ingreso a la plataforma.
                    </p>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #F1F5F9; border-radius: 8px; padding: 10px 14px;">
                <tr>
                  <td>
                    <p style="margin: 0; font-size: 11px; color: #475569; line-height: 1.5;">
                      ℹ️ <strong>Soporte Técnico:</strong> Si presenta algún inconveniente al ingresar, comuníquese con la Unidad de Tecnologías de la Información y Comunicación (TIC) de la AGBC.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Pie de Página Institucional -->
          <tr>
            <td style="background: #0A192F; padding: 22px 28px; text-align: center;">
              <p style="margin: 0 0 4px; font-size: 12px; font-weight: 800; color: #FFCC00;">Correos de Bolivia</p>
              <p style="margin: 0 0 10px; font-size: 11px; color: #94A3B8;">Área de Sistemas — Intranet Institucional</p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td style="height: 2px; width: 25px; background-color: #C41E3A;"></td>
                  <td style="width: 3px;"></td>
                  <td style="height: 2px; width: 25px; background-color: #FFB300;"></td>
                  <td style="width: 3px;"></td>
                  <td style="height: 2px; width: 25px; background-color: #2E7D32;"></td>
                </tr>
              </table>
              <p style="margin: 10px 0 0; font-size: 10px; color: #64748B;">
                &copy; ${year} Correos de Bolivia. Todos los derechos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    })

    await registrarEmailLog({
      destinatarioNombre: nombre,
      destinatarioEmail: to,
      tipo: tipoLog,
      asunto,
      estado: "enviado",
    })

    return {
      success: true,
      message: `Credenciales enviadas correctamente a ${to}.`,
    }
  } catch (error: any) {
    console.error("Error al enviar credenciales por correo:", error)

    let errorMensaje = error?.message || "Error al enviar correo electrónico"
    if (error?.code === "ECONNREFUSED" || error?.code === "ETIMEDOUT") {
      errorMensaje = "Servidor SMTP no disponible temporalmente."
    } else if (error?.responseCode === 535) {
      errorMensaje = "Error de autenticación en el servidor SMTP institucional."
    }

    await registrarEmailLog({
      destinatarioNombre: nombre,
      destinatarioEmail: to,
      tipo: tipoLog,
      asunto,
      estado: "error",
      errorMensaje,
    })

    return {
      success: false,
      error: errorMensaje,
    }
  }
}

/* ══════════════════════════════════════════════════════════════
 * 3. ENVÍO DE CORREO DE PRUEBA DESDE PANEL ADMINISTRATIVO
 * ══════════════════════════════════════════════════════════════ */
export async function sendTestEmail(to: string): Promise<{ success: boolean; message: string }> {
  if (!validarEmail(to)) {
    return {
      success: false,
      message: "La dirección de correo de prueba no tiene un formato válido.",
    }
  }

  const config = getEmailConfig()
  const year = new Date().getFullYear()
  const asunto = "🧪 Correo de Prueba — Servidor SMTP Correos de Bolivia"

  try {
    const transporter = createTransporter()

    await transporter.sendMail({
      from: config.from,
      to: to.trim(),
      subject: asunto,
      html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f6f9; padding: 30px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width: 520px; width: 100%; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #E2E8F0;">
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="height: 5px; background-color: #C41E3A; width: 33.33%;"></td>
                  <td style="height: 5px; background-color: #FFB300; width: 33.34%;"></td>
                  <td style="height: 5px; background-color: #2E7D32; width: 33.33%;"></td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background: linear-gradient(135deg, #002F6C 0%, #0E5296 100%); padding: 28px; text-align: center;">
              <h2 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 800;">Correos de Bolivia</h2>
              <p style="margin: 4px 0 0; color: #FFCC00; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">Prueba de Conectividad SMTP</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 28px;">
              <div style="background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 10px; padding: 14px 18px; margin-bottom: 16px;">
                <p style="margin: 0; font-size: 14px; font-weight: 700; color: #065F46;">
                  ✅ ¡Conexión SMTP exitosa!
                </p>
                <p style="margin: 6px 0 0; font-size: 12px; color: #047857; line-height: 1.5;">
                  El servidor SMTP institucional (<code>${config.host}</code>) está enviando correos correctamente a través del sistema.
                </p>
              </div>
              <p style="margin: 0; font-size: 12px; color: #64748B; line-height: 1.5;">
                <strong>Fecha y hora:</strong> ${new Date().toLocaleString("es-BO", { timeZone: "America/La_Paz" })}<br/>
                <strong>Servidor:</strong> ${config.host}:${config.port}<br/>
                <strong>Remitente configurado:</strong> ${config.fromAddress}
              </p>
            </td>
          </tr>
          <tr>
            <td style="background: #0A192F; padding: 16px 28px; text-align: center;">
              <p style="margin: 0; font-size: 10px; color: #94A3B8;">&copy; ${year} Agencia Boliviana de Correos. Todos los derechos reservados.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    })

    await registrarEmailLog({
      destinatarioNombre: "Prueba SMTP",
      destinatarioEmail: to,
      tipo: "correo_prueba",
      asunto,
      estado: "enviado",
    })

    return {
      success: true,
      message: "Correo de prueba enviado correctamente.",
    }
  } catch (error: any) {
    console.error("Error al enviar correo de prueba:", error)

    let msg = "No se pudo enviar el correo de prueba. Revise la configuración SMTP."
    if (error?.responseCode === 535) {
      msg = "Error de autenticación SMTP. Revise usuario y contraseña en las variables de entorno."
    } else if (error?.code === "ECONNREFUSED") {
      msg = `No se pudo conectar al servidor SMTP en ${config.host}:${config.port}.`
    } else if (error?.message) {
      msg = `Error al enviar correo de prueba: ${error.message}`
    }

    await registrarEmailLog({
      destinatarioNombre: "Prueba SMTP",
      destinatarioEmail: to,
      tipo: "correo_prueba",
      asunto,
      estado: "error",
      errorMensaje: msg,
    })

    return {
      success: false,
      message: msg,
    }
  }
}
