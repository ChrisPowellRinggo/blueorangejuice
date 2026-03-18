import { io, Socket } from 'socket.io-client'
import type { ServerToClientEvents, ClientToServerEvents } from '@shared/types/events'

const socket: Socket<ServerToClientEvents, ClientToServerEvents> =
  io(import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3000', {
    autoConnect: true,
    transports: ['websocket'],
  })

export default socket
