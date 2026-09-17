export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // La inicialización automática de seeders ha sido desactivada para evitar
    // que datos eliminados o modificados en producción se reescriban en cada despliegue.
    console.log("⚡ [AGBC Intranet] Servidor iniciado correctamente en modo incremental.")
  }
}

