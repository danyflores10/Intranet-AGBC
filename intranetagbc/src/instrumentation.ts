export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { runAutoMigrations } = await import("@/lib/db/auto-migrate")
      await runAutoMigrations()
      console.log("⚡ [AGBC Intranet] Base de datos sincronizada y servidor listo.")
    } catch (error) {
      console.error("⚠️ [AGBC Intranet] Error en sincronización de base de datos:", error)
    }
  }
}
