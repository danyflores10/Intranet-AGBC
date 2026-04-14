import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendResetCode(to: string, code: string) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: "Código de recuperación — Intranet AGBC",
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e5e5;">
        <div style="background: linear-gradient(135deg, #FFB300, #FF8800); padding: 32px 24px; text-align: center;">
          <h1 style="margin: 0; color: #1a1000; font-size: 22px; font-weight: 800;">Correos de Bolivia</h1>
          <p style="margin: 4px 0 0; color: #1a1000cc; font-size: 13px;">Intranet — Plataforma de Gestión Interna</p>
        </div>
        <div style="padding: 32px 24px;">
          <h2 style="margin: 0 0 8px; font-size: 20px; color: #1a1a1a;">Recuperar contraseña</h2>
          <p style="margin: 0 0 24px; color: #666; font-size: 14px; line-height: 1.6;">
            Has solicitado restablecer tu contraseña. Usa el siguiente código de verificación:
          </p>
          <div style="background: #f8f8f8; border: 2px dashed #FFB300; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #1a1a1a;">${code}</span>
          </div>
          <p style="margin: 0 0 4px; color: #999; font-size: 12px;">Este código expira en <strong>10 minutos</strong>.</p>
          <p style="margin: 0; color: #999; font-size: 12px;">Si no solicitaste este cambio, ignora este correo.</p>
        </div>
        <div style="background: #fafafa; padding: 16px 24px; text-align: center; border-top: 1px solid #eee;">
          <p style="margin: 0; color: #aaa; font-size: 11px;">&copy; ${new Date().getFullYear()} Agencia Boliviana de Correos</p>
        </div>
      </div>
    `,
  })
}
