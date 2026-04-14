import { createAuthClient } from "better-auth/react"
import { customSessionClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  basePath: "/api/auth",
  plugins: [customSessionClient()],
})
