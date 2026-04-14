import "dotenv/config"

import { eq } from "drizzle-orm"
import { createId } from "@paralleldrive/cuid2"

import { db } from "../src/db"
import { users, account } from "../src/db/schema"
import { auth } from "../src/lib/auth"

const USER_DATA = {
  firstName: "Daniel Wilson",
  lastNamePaternal: "Flores",
  lastNameMaternal: "Aguilar",
  institutionalEmail: "danielwilsonfloresaguilar10@gmail.com",
  email: "danielwilsonfloresaguilar10@gmail.com",
  nationalId: "00000001",
  dateOfBirth: "2000-01-01",
  password: "123456789",
}

async function main() {
  console.log("Verificando si el usuario ya existe...")

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.institutionalEmail, USER_DATA.institutionalEmail))
    .limit(1)

  if (existing) {
    console.log(`El usuario ya existe con ID: ${existing.id}`)
    process.exit(0)
  }

  console.log("Hasheando contraseña con seguridad...")
  const authContext = await auth.$context
  const hashedPassword = await authContext.password.hash(USER_DATA.password)

  console.log("Creando usuario...")
  const userId = createId()

  await db.transaction(async (tx) => {
    await tx.insert(users).values({
      id: userId,
      firstName: USER_DATA.firstName,
      lastNamePaternal: USER_DATA.lastNamePaternal,
      lastNameMaternal: USER_DATA.lastNameMaternal,
      institutionalEmail: USER_DATA.institutionalEmail,
      email: USER_DATA.email,
      emailVerified: false,
      nationalId: USER_DATA.nationalId,
      dateOfBirth: USER_DATA.dateOfBirth,
      isActive: true,
      image: null,
    })

    await tx.insert(account).values({
      id: createId(),
      accountId: userId,
      providerId: "credential",
      userId: userId,
      password: hashedPassword,
    })
  })

  console.log("Usuario creado exitosamente:")
  console.log(`  ID: ${userId}`)
  console.log(`  Email: ${USER_DATA.institutionalEmail}`)
  console.log(`  Nombre: ${USER_DATA.firstName} ${USER_DATA.lastNamePaternal} ${USER_DATA.lastNameMaternal}`)
  console.log(`  Contraseña: ${USER_DATA.password}`)
  process.exit(0)
}

main().catch((err) => {
  console.error("Error al crear usuario:", err)
  process.exit(1)
})
