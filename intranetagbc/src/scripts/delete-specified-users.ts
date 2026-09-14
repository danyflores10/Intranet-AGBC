import "dotenv/config"
import { db } from "../db"
import {
  users,
  personal,
  account,
  session,
  userRoles,
  onboardingProgreso,
  notificaciones,
  mensajesSoporte,
  ticketsSoporte,
  solicitudes,
  correspondencia,
  correspondenciaMovimientos,
  correspondenciaAdjuntos,
  documentos,
  solicitudesMaterial,
  comunicados,
  eventosCalendario,
  reconocimientoEmpleadoMes,
  reconocimientoEquipo,
  reconocimientoEquipoIntegrantes,
  reconocimientos,
  contactosEmergencia,
} from "../db/schema"
import { eq } from "drizzle-orm"

const TARGET_EMAILS = [
  "jose@correos.gob.bo",
  "daniela@gmail.com",
  "luz.luz@correos.gob.bo",
]

async function deleteUser(uId: string) {
  console.log(`\n--- Eliminando Usuario ID: ${uId} ---`)
  
  // 1. Session, Account, UserRoles
  await db.delete(session).where(eq(session.userId, uId))
  console.log("  - Sesiones eliminadas")
  await db.delete(account).where(eq(account.userId, uId))
  console.log("  - Cuentas eliminadas")
  await db.delete(userRoles).where(eq(userRoles.userId, uId))
  console.log("  - Roles eliminados")

  // 2. Onboarding
  await db.delete(onboardingProgreso).where(eq(onboardingProgreso.usuarioId, uId))
  console.log("  - Onboarding eliminado")

  // 3. Notificaciones
  await db.delete(notificaciones).where(eq(notificaciones.usuarioId, uId))
  await db.update(notificaciones).set({ creadoPor: null }).where(eq(notificaciones.creadoPor, uId))
  console.log("  - Notificaciones eliminadas/desvinculadas")

  // 4. Soporte
  await db.delete(mensajesSoporte).where(eq(mensajesSoporte.emisorId, uId))
  await db.delete(ticketsSoporte).where(eq(ticketsSoporte.solicitanteId, uId))
  await db.update(ticketsSoporte).set({ agenteId: null }).where(eq(ticketsSoporte.agenteId, uId))
  console.log("  - Soporte eliminado/desvinculado")

  // 5. Solicitudes
  await db.delete(solicitudes).where(eq(solicitudes.solicitanteId, uId))
  await db.update(solicitudes).set({ destinatarioId: null }).where(eq(solicitudes.destinatarioId, uId))
  console.log("  - Solicitudes eliminadas/desvinculadas")

  // 6. Correspondencia
  await db.update(correspondencia).set({ remitenteUserId: null }).where(eq(correspondencia.remitenteUserId, uId))
  await db.update(correspondencia).set({ destinatarioUserId: null }).where(eq(correspondencia.destinatarioUserId, uId))
  await db.update(correspondencia).set({ creadoPor: null }).where(eq(correspondencia.creadoPor, uId))
  await db.update(correspondencia).set({ actualizadoPor: null }).where(eq(correspondencia.actualizadoPor, uId))
  await db.update(correspondenciaMovimientos).set({ fromUserId: null }).where(eq(correspondenciaMovimientos.fromUserId, uId))
  await db.update(correspondenciaMovimientos).set({ toUserId: null }).where(eq(correspondenciaMovimientos.toUserId, uId))
  await db.update(correspondenciaMovimientos).set({ creadoPor: null }).where(eq(correspondenciaMovimientos.creadoPor, uId))
  await db.update(correspondenciaAdjuntos).set({ subidoPor: null }).where(eq(correspondenciaAdjuntos.subidoPor, uId))
  console.log("  - Correspondencia desvinculada")

  // 7. Documentos, Logística, Comunicados, Calendario
  await db.update(documentos).set({ creadoPor: null }).where(eq(documentos.creadoPor, uId))
  await db.update(solicitudesMaterial).set({ creadoPor: null }).where(eq(solicitudesMaterial.creadoPor, uId))
  await db.update(comunicados).set({ creadoPor: null }).where(eq(comunicados.creadoPor, uId))
  await db.update(eventosCalendario).set({ creadoPor: null }).where(eq(eventosCalendario.creadoPor, uId))
  console.log("  - Documentos / Logística / Comunicados / Calendario desvinculados")

  // 8. Reconocimientos
  await db.delete(reconocimientoEmpleadoMes).where(eq(reconocimientoEmpleadoMes.empleadoId, uId))
  await db.delete(reconocimientoEquipoIntegrantes).where(eq(reconocimientoEquipoIntegrantes.usuarioId, uId))
  await db.update(reconocimientoEquipo).set({ responsableId: null }).where(eq(reconocimientoEquipo.responsableId, uId))
  await db.update(reconocimientos).set({ creadoPor: null }).where(eq(reconocimientos.creadoPor, uId))
  await db.update(reconocimientos).set({ aprobadoPor: null }).where(eq(reconocimientos.aprobadoPor, uId))
  console.log("  - Reconocimientos desvinculados")

  // 9. Eliminar usuario de users
  await db.delete(users).where(eq(users.id, uId))
  console.log(`  ✓ Usuario ${uId} eliminado exitosamente de users`)
}

async function main() {
  console.log("=== INICIANDO ELIMINACIÓN FÍSICA INDIVIDUAL ===")

  const allUsers = await db.select().from(users)
  const allPersonal = await db.select().from(personal)

  const foundUsers = allUsers.filter(
    (u) =>
      (u.institutionalEmail && TARGET_EMAILS.includes(u.institutionalEmail.toLowerCase().trim())) ||
      (u.email && TARGET_EMAILS.includes(u.email.toLowerCase().trim()))
  )

  const foundPersonal = allPersonal.filter(
    (p) => p.email && TARGET_EMAILS.includes(p.email.toLowerCase().trim())
  )

  for (const u of foundUsers) {
    await deleteUser(u.id)
  }

  for (const p of foundPersonal) {
    console.log(`\n--- Eliminando Personal ID: ${p.id} (${p.nombre}) ---`)
    await db.delete(contactosEmergencia).where(eq(contactosEmergencia.personalId, p.id))
    await db.delete(personal).where(eq(personal.id, p.id))
    console.log(`  ✓ Personal ${p.id} eliminado exitosamente de personal`)
  }

  // Verificación final
  const finalUsers = await db.select().from(users)
  const finalPersonal = await db.select().from(personal)

  const remainingUsers = finalUsers.filter(
    (u) =>
      (u.institutionalEmail && TARGET_EMAILS.includes(u.institutionalEmail.toLowerCase().trim())) ||
      (u.email && TARGET_EMAILS.includes(u.email.toLowerCase().trim()))
  )

  const remainingPersonal = finalPersonal.filter(
    (p) => p.email && TARGET_EMAILS.includes(p.email.toLowerCase().trim())
  )

  console.log("\n=== VERIFICACIÓN FINAL ===")
  console.log(`Usuarios restantes: ${remainingUsers.length}`)
  console.log(`Personal restante: ${remainingPersonal.length}`)

  if (remainingUsers.length === 0 && remainingPersonal.length === 0) {
    console.log("✓✓✓ ÉXITO TOTAL: Los 3 funcionarios han sido completamente eliminados físicamente de la base de datos sin dejar registros huérfanos.")
  } else {
    console.error("✗ ERROR: Aún quedan registros.")
    process.exit(1)
  }

  process.exit(0)
}

main().catch((err) => {
  console.error("Error en script:", err)
  process.exit(1)
})
