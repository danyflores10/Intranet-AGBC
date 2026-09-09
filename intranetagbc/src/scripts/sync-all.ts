import { sincronizarTodoPersonalConUsuarios } from "../lib/services/personal-user-sync"
import { sincronizarNoticiasAuto } from "../lib/services/news-sync-service"
import { db } from "../db"
import { personal, users, account, banners } from "../db/schema"

async function run() {
  console.log("=== INICIANDO SINCRONIZACIÓN COMPLETA ===")

  console.log("1. Sincronizando 24 noticias...")
  const resNoticias = await sincronizarNoticiasAuto(true)
  console.log("Resultado noticias:", resNoticias)

  console.log("2. Sincronizando personal y cuentas de usuario...")
  const resUsers = await sincronizarTodoPersonalConUsuarios()
  console.log("Resultado personal-usuarios:", resUsers)

  const p = await db.select().from(personal)
  const u = await db.select().from(users)
  const a = await db.select().from(account)
  const b = await db.select().from(banners)

  console.log("\n=== ESTADO FINAL DE TABLAS ===")
  console.log(`- Personal: ${p.length} registros`)
  console.log(`- Users: ${u.length} registros`)
  console.log(`- Accounts (credenciales): ${a.length} registros`)
  console.log(`- Banners / Noticias: ${b.length} registros`)

  console.log("\n=== LISTA DE USUARIOS Y CORREOS HABILITADOS PARA LOGIN ===")
  for (const user of u) {
    const matchingAcc = a.find((acc) => acc.userId === user.id)
    const matchingPers = p.find((pers) => pers.email === user.institutionalEmail || pers.ci === user.nationalId)
    console.log(`- Nombre: ${user.firstName} ${user.lastNamePaternal} | Email: ${user.institutionalEmail} | CI: ${user.nationalId} | Tiene Cuenta: ${!!matchingAcc} | En Personal: ${!!matchingPers}`)
  }

  process.exit(0)
}

run().catch((err) => {
  console.error("Error en sincronización:", err)
  process.exit(1)
})
