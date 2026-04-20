import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import { APIError, betterAuth } from "better-auth"
import { nextCookies } from "better-auth/next-js"
import { customSession } from "better-auth/plugins/custom-session"
import { createId } from "@paralleldrive/cuid2"
import { eq } from "drizzle-orm"

import { db } from "@/db"
import * as schema from "@/db/schema"
import { auditLogs } from "@/db/schema"

const ALLOWED_EMAIL_DOMAINS = ["correos.gob.bo", "agbc.gob.bo", "gmail.com"]
const INVALID_CREDENTIALS_ERROR = "Credenciales invalidas."
type AccessSet = {
  roles: string[]
  permissions: string[]
}

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

async function getUserAccessById(userId: string): Promise<AccessSet> {
  const rows = await db
    .select({
      roleName: schema.roles.name,
      permissionName: schema.permissions.name,
    })
    .from(schema.userRoles)
    .innerJoin(schema.roles, eq(schema.userRoles.roleId, schema.roles.id))
    .leftJoin(schema.rolePermissions, eq(schema.rolePermissions.roleId, schema.roles.id))
    .leftJoin(
      schema.permissions,
      eq(schema.rolePermissions.permissionId, schema.permissions.id),
    )
    .where(eq(schema.userRoles.userId, userId))

  const roleSet = new Set<string>()
  const permissionSet = new Set<string>()

  for (const row of rows) {
    if (row.roleName) {
      roleSet.add(normalize(row.roleName))
    }

    if (row.permissionName) {
      permissionSet.add(normalize(row.permissionName))
    }
  }

  return {
    roles: [...roleSet],
    permissions: [...permissionSet],
  }
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      account: schema.account,
      session: schema.session,
      verification: schema.verifications,
    },
    camelCase: true,
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    invalidEmailOrPasswordError: INVALID_CREDENTIALS_ERROR,
    signUp: {
      enabled: false,
    },
  },
  rateLimit: {
    window: 60,
    max: 10,
  },
  advanced: {
    database: {
      generateId: () => createId(),
    },
  },
  session: {
    expiresIn: 60 * 60 * 8, 
    updateAge: 60 * 15, 
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  account: {
    accountLinking: {
      enabled: false,
    },
  },
  user: {
    changeEmail: {
      enabled: false,
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const email = user.email.toLowerCase().trim()
          const domain = email.split("@")[1]
          if (!domain || !ALLOWED_EMAIL_DOMAINS.includes(domain)) {
            throw new Error(
              "Solo se permiten correos institucionales (@correos.gob.bo)."
            )
          }
          return { data: { ...user, email } }
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          const [user] = await db
            .select({ isActive: schema.users.isActive })
            .from(schema.users)
            .where(eq(schema.users.id, session.userId))
            .limit(1)

          if (!user || !user.isActive) {
            throw APIError.from("UNAUTHORIZED", {
              code: "INVALID_CREDENTIALS",
              message: INVALID_CREDENTIALS_ERROR,
            })
          }
        },
        after: async (session) => {
          const [user] = await db
            .select({ firstName: schema.users.firstName, lastNamePaternal: schema.users.lastNamePaternal, email: schema.users.email })
            .from(schema.users)
            .where(eq(schema.users.id, session.userId))
            .limit(1)

          await db.insert(auditLogs).values({
            usuario: session.userId,
            accion: "Inició sesión",
            modulo: "Autenticación",
            ip: session.ipAddress ?? undefined,
            resultado: "Exitoso",
            detalles: user?.email ? `Email: ${user.email}` : undefined,
          })
        },
      },
    },
  },
  plugins: [
    nextCookies(),
    customSession(async ({ user, session }) => {
      const access = await getUserAccessById(user.id)

      return {
        session,
        user: {
          ...user,
          roles: access.roles,
          permissions: access.permissions,
        },
      }
    }),
  ],
})
