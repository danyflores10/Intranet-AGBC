import { auth } from "../lib/auth"
import { db } from "../db"
import { users, account } from "../db/schema"
import { eq } from "drizzle-orm"

async function test() {
  const authContext = await auth.$context
  const [u] = await db.select().from(users).where(eq(users.email, "leo@correos.gob.bo")).limit(1)
  if (!u) throw new Error("User leo not found")
  
  const [a] = await db.select().from(account).where(eq(account.userId, u.id)).limit(1)
  if (!a || !a.password) throw new Error("Account for leo not found")

  const isValid = await authContext.password.verify({
    password: "87654321",
    hash: a.password,
  })

  console.log("Password verification for leo@correos.gob.bo (password: 87654321):", isValid ? "SUCCESS ✅" : "FAILED ❌")

  const [uAdmin] = await db.select().from(users).where(eq(users.email, "admin@correos.gob.bo")).limit(1)
  const [aAdmin] = await db.select().from(account).where(eq(account.userId, uAdmin.id)).limit(1)
  const isValidAdmin = await authContext.password.verify({
    password: "9976322",
    hash: aAdmin.password!,
  })
  console.log("Password verification for admin@correos.gob.bo (password: 9976322):", isValidAdmin ? "SUCCESS ✅" : "FAILED ❌")
}

test().then(() => process.exit(0)).catch((e) => {
  console.error(e)
  process.exit(1)
})
