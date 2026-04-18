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
