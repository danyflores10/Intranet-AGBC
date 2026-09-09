export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      console.log("⚡ [AGBC Intranet] Verificando e inicializando base de datos institucional...")
      const { runDatabaseSeed } = await import("@/db/seed")
      await runDatabaseSeed()
    } catch (error) {
      console.error("⚠️ [AGBC Intranet] No se pudo completar la inicialización automática:", error)
    }
  }
}
