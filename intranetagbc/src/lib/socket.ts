"use client"

import { io, type Socket } from "socket.io-client"

declare global {
  interface Window {
    __soporteSocket?: Socket<ServerToClientEvents, ClientToServerEvents>
  }
}

export function getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (typeof window === "undefined") {
    throw new Error("Socket client is only available in the browser")
  }

  if (!window.__soporteSocket) {
    window.__soporteSocket = io({
      path: "/socket.io",
      transports: ["websocket"],
      autoConnect: true,
    })
  }

  return window.__soporteSocket
}
