import { redirect } from "next/navigation"

import { obtenerUsuarioRbacActual } from "@/lib/auth/session-access"
import { puedeAccederUsuario } from "@/lib/rbac"
import { PERMISOS } from "@/lib/auth/permisos"
import { obtenerConfigOnboarding } from "@/actions/onboarding"
import { db } from "@/db"
import { onboardingProgreso, roles as rolesTable } from "@/db/schema"
import { sql } from "drizzle-orm"

import { OnboardingConfigModule } from "@/components/modules/onboarding-config-module"

export default async function OnboardingAdminPage() {
  const usuario = await obtenerUsuarioRbacActual()
  if (!usuario) redirect("/")
  if (!puedeAccederUsuario(usuario, { permissions: [PERMISOS.ONBOARDING.CONFIGURAR] })) {
    redirect("/dashboard")
  }

  const config = await obtenerConfigOnboarding()

  const [rolesList, statsRows] = await Promise.all([
    db.select({ name: rolesTable.name }).from(rolesTable),
    db
      .select({
        estado: onboardingProgreso.estado,
        count: sql<number>`count(*)::int`,
      })
      .from(onboardingProgreso)
      .groupBy(onboardingProgreso.estado),
  ])

  const stats = {
    completados: 0,
    pendientes: 0,
    omitidos: 0,
  }
  for (const row of statsRows) {
    if (row.estado === "completado") stats.completados = row.count
    else if (row.estado === "pendiente") stats.pendientes = row.count
    else if (row.estado === "omitido") stats.omitidos = row.count
  }

  return (
    <OnboardingConfigModule
      config={{
        activo: config.activo,
        mostrarA: config.mostrarA as "todos" | "nuevos" | "rol",
        rolObjetivo: config.rolObjetivo,
        version: config.version,
      }}
      roles={rolesList.map((r) => r.name)}
      stats={stats}
    />
  )
}
