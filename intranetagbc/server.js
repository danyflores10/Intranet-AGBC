import { createServer } from "node:http"
import next from "next"
import { Server } from "socket.io"

const port = Number.parseInt(process.env.PORT || "3000", 10)
const hostname = process.env.HOST || "0.0.0.0"
const forceProd = process.argv.includes("--prod")
const dev = !forceProd && process.env.NODE_ENV !== "production"

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app
  .prepare()
  .then(() => {
    const httpServer = createServer((req, res) => {
      handle(req, res)
    })

    const io = new Server(httpServer, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
    })

    global.io = io

    io.on("connection", (socket) => {
      socket.on("ticket:join", (ticketId) => {
        if (!ticketId || typeof ticketId !== "string") return
        socket.join(`ticket:${ticketId}`)
      })

      socket.on("ticket:leave", (ticketId) => {
        if (!ticketId || typeof ticketId !== "string") return
        socket.leave(`ticket:${ticketId}`)
      })

      socket.on("user:join", (userId) => {
        if (!userId || typeof userId !== "string") return
        socket.join(`user:${userId}`)
      })

      socket.on("user:leave", (userId) => {
        if (!userId || typeof userId !== "string") return
        socket.leave(`user:${userId}`)
      })
    })

    httpServer
      .once("error", (err) => {
        console.error("Error starting server:", err)
        process.exit(1)
      })
      .listen(port, hostname, () => {
        console.log(`> Ready on http://${hostname}:${port}`)
      })
  })
  .catch((err) => {
    console.error("Error preparing app:", err)
    process.exit(1)
  })
