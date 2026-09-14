import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
})

export async function sendResetCode(to: string, code: string) {
  const digits = code.split("")
  const year = new Date().getFullYear()
  const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000"

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: "🔐 Código de verificación — Correos de Bolivia",
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
            <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); padding: 36px 32px 32px; text-align: center;">
              <img src="${baseUrl}/image/LogoAmarillo.png" alt="Correos de Bolivia" width="200" style="max-width: 200px; height: auto; margin-bottom: 12px;" />
              <p style="margin: 0; color: #FFB300; font-size: 12px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase;">Plataforma Intranet</p>
            </td>
          </tr>

          <!-- Ícono de seguridad -->
          <tr>
            <td style="padding: 32px 32px 0; text-align: center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td style="background: linear-gradient(135deg, #FFF3D6, #FFE4A0); border-radius: 20px; padding: 18px; text-align: center;">
                    <span style="font-size: 36px; line-height: 1;">🔐</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Título -->
          <tr>
            <td style="padding: 20px 32px 8px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #1a1a1a; letter-spacing: -0.5px;">Código de verificación</h1>
            </td>
          </tr>

          <!-- Subtítulo -->
          <tr>
            <td style="padding: 0 40px 28px; text-align: center;">
              <p style="margin: 0; font-size: 14px; color: #666666; line-height: 1.6;">
                Has solicitado restablecer tu contraseña. Ingresa el siguiente código en la plataforma:
              </p>
            </td>
          </tr>

          <!-- Código de verificación con cada dígito separado -->
          <tr>
            <td style="padding: 0 32px 28px; text-align: center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto; background: linear-gradient(135deg, #FFF8E7, #FFF3D6); border: 2px solid #FFB300; border-radius: 16px; padding: 20px 12px;">
                <tr>
                  ${digits.map(d => `<td style="padding: 0 6px;"><span style="display: inline-block; width: 44px; height: 56px; line-height: 56px; background: #ffffff; border-radius: 10px; font-size: 28px; font-weight: 800; color: #1a1a1a; text-align: center; box-shadow: 0 2px 8px rgba(255,179,0,0.15); border: 1px solid #FFE4A0;">${d}</span></td>`).join("")}
                </tr>
              </table>
            </td>
          </tr>

          <!-- Timer de expiración -->
          <tr>
            <td style="padding: 0 32px 28px; text-align: center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto; background: #FEF3F2; border-radius: 10px; padding: 10px 20px;">
                <tr>
                  <td style="font-size: 13px; color: #B42318; font-weight: 600;">
                    ⏱️ Este código expira en <strong>10 minutos</strong>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Separador -->
          <tr>
            <td style="padding: 0 32px;">
              <div style="height: 1px; background: linear-gradient(90deg, transparent, #e5e5e5, transparent);"></div>
            </td>
          </tr>

          <!-- Instrucciones de seguridad -->
          <tr>
            <td style="padding: 24px 32px 8px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding: 10px 14px; background: #F9FAFB; border-radius: 10px; border-left: 3px solid #FFB300;">
                    <p style="margin: 0 0 4px; font-size: 12px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">🛡️ Seguridad</p>
                    <p style="margin: 0; font-size: 12px; color: #6B7280; line-height: 1.5;">
                      Si no solicitaste este código, ignora este mensaje. Tu cuenta permanece segura.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Nota -->
          <tr>
            <td style="padding: 16px 32px 28px; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #9CA3AF;">
                No compartas este código con nadie. El equipo de Correos de Bolivia nunca te pedirá tu código por teléfono o mensaje.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #1a1a2e; padding: 24px 32px; text-align: center;">
              <p style="margin: 0 0 6px; font-size: 13px; font-weight: 600; color: #FFB300;">Agencia Boliviana de Correos</p>
              <p style="margin: 0 0 12px; font-size: 11px; color: #8892b0;">Intranet — Plataforma de Gestión Interna</p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td style="height: 2px; width: 30px; background-color: #C41E3A; border-radius: 1px;"></td>
                  <td style="width: 4px;"></td>
                  <td style="height: 2px; width: 30px; background-color: #FFB300; border-radius: 1px;"></td>
                  <td style="width: 4px;"></td>
                  <td style="height: 2px; width: 30px; background-color: #2E7D32; border-radius: 1px;"></td>
                </tr>
              </table>
              <p style="margin: 12px 0 0; font-size: 10px; color: #5a6380;">&copy; ${year} AGBC. Todos los derechos reservados.</p>
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
}

export async function sendWelcomeCredentialsEmail({
  to,
  nombre,
  emailInstitucional,
  password,
  ci,
}: {
  to: string
  nombre: string
  emailInstitucional: string
  password?: string
  ci?: string
}) {
  const year = new Date().getFullYear()
  const baseUrl = process.env.BETTER_AUTH_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"
  const loginUrl = `${baseUrl}/`
  const passwordToShow = password || "Correos2026!"

  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_HOST) {
      console.warn("SMTP no configurado. Credenciales generadas para:", {
        to,
        nombre,
        emailInstitucional,
        password: passwordToShow,
      })
      return { success: false, warning: "SMTP no configurado" }
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Intranet AGBC" <${process.env.SMTP_USER}>`,
      to,
      subject: "🚀 Bienvenido(a) a la Intranet — Correos de Bolivia (Credenciales de Acceso)",
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
        <table role="presentation" width="540" cellpadding="0" cellspacing="0" style="max-width: 540px; width: 100%; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 8px 40px rgba(0,0,0,0.08);">

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
            <td style="background: linear-gradient(135deg, #002F6C 0%, #0E5296 50%, #0A192F 100%); padding: 36px 32px 32px; text-align: center;">
              <img src="${baseUrl}/image/LogoAmarillo.png" alt="Correos de Bolivia" width="200" style="max-width: 200px; height: auto; margin-bottom: 12px;" />
              <p style="margin: 0; color: #FFB300; font-size: 13px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">Intranet Institucional</p>
            </td>
          </tr>

          <!-- Título y Saludo -->
          <tr>
            <td style="padding: 32px 36px 12px;">
              <h1 style="margin: 0 0 12px; font-size: 22px; font-weight: 800; color: #002F6C; letter-spacing: -0.5px;">
                ¡Bienvenido(a), ${nombre}!
              </h1>
              <p style="margin: 0; font-size: 14px; color: #4B5563; line-height: 1.6;">
                Se ha habilitado tu cuenta institucional en la <strong>Intranet de la Agencia Boliviana de Correos (AGBC)</strong>. A continuación encontrarás tus credenciales de acceso:
              </p>
            </td>
          </tr>

          <!-- Tarjeta de Credenciales -->
          <tr>
            <td style="padding: 12px 36px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #F8FAFC, #EFF6FF); border: 2px solid #0E5296/20; border-radius: 16px; padding: 20px 24px; border: 1px solid #CBD5E1;">
                <tr>
                  <td style="padding-bottom: 12px;">
                    <span style="font-size: 12px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px;">Usuario / Correo Institucional:</span>
                    <div style="font-size: 16px; font-weight: 800; color: #002F6C; margin-top: 4px; font-family: monospace;">${emailInstitucional}</div>
                  </td>
                </tr>
                ${ci && ci !== "—" ? `
                <tr>
                  <td style="padding-bottom: 12px;">
                    <span style="font-size: 12px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px;">Cédula de Identidad (CI):</span>
                    <div style="font-size: 15px; font-weight: 700; color: #1E293B; margin-top: 4px;">${ci}</div>
                  </td>
                </tr>` : ""}
                <tr>
                  <td style="padding-top: 4px;">
                    <span style="font-size: 12px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px;">Contraseña de Acceso:</span>
                    <div style="margin-top: 6px;">
                      <span style="display: inline-block; background: #002F6C; color: #FFCC00; font-family: monospace; font-size: 17px; font-weight: 800; padding: 8px 16px; border-radius: 8px; letter-spacing: 1px;">${passwordToShow}</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Botón de acceso -->
          <tr>
            <td style="padding: 0 36px 28px; text-align: center;">
              <a href="${loginUrl}" style="display: inline-block; background: #0E5296; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 14px rgba(14,82,150,0.35);">
                👉 Iniciar Sesión en la Intranet
              </a>
            </td>
          </tr>

          <!-- Separador -->
          <tr>
            <td style="padding: 0 36px;">
              <div style="height: 1px; background: #E2E8F0;"></div>
            </td>
          </tr>

          <!-- Aviso de seguridad -->
          <tr>
            <td style="padding: 24px 36px 8px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding: 12px 16px; background: #FFFBEB; border-radius: 10px; border-left: 4px solid #F59E0B;">
                    <p style="margin: 0 0 4px; font-size: 12px; font-weight: 700; color: #B45309; text-transform: uppercase; letter-spacing: 0.5px;">🔒 Recomendación de Seguridad</p>
                    <p style="margin: 0; font-size: 12px; color: #78350F; line-height: 1.5;">
                      Por tu seguridad institucional, te sugerimos cambiar esta contraseña temporal por una personalizada una vez que ingreses a la plataforma desde tu perfil de usuario.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #0A192F; padding: 24px 32px; text-align: center; margin-top: 24px;">
              <p style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: #FFCC00;">Agencia Boliviana de Correos</p>
              <p style="margin: 0 0 12px; font-size: 11px; color: #94A3B8;">Intranet Institucional — Correos de Bolivia</p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td style="height: 2px; width: 30px; background-color: #C41E3A; border-radius: 1px;"></td>
                  <td style="width: 4px;"></td>
                  <td style="height: 2px; width: 30px; background-color: #FFB300; border-radius: 1px;"></td>
                  <td style="width: 4px;"></td>
                  <td style="height: 2px; width: 30px; background-color: #2E7D32; border-radius: 1px;"></td>
                </tr>
              </table>
              <p style="margin: 12px 0 0; font-size: 10px; color: #64748B;">&copy; ${year} AGBC. Todos los derechos reservados.</p>
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
    return { success: true }
  } catch (error) {
    console.error("Error al enviar correo de bienvenida con credenciales:", error)
    return { success: false, error }
  }
}
