import type { Server, Socket } from 'socket.io'
import type { ServerToClientEvents, ClientToServerEvents } from '@shared/types/events'
import { Room } from './Room'

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>

export class RoomManager {
  private io: TypedServer
  private rooms: Map<string, Room>        // roomId  → Room
  private socketToRoom: Map<string, string> // socketId → roomId

  constructor(io: TypedServer) {
    this.io = io
    this.rooms = new Map()
    this.socketToRoom = new Map()
  }

  join(socket: TypedSocket, roomId: string): void {
    if (!this.rooms.has(roomId)) {
      const room = new Room(roomId, this.io)
      this.rooms.set(roomId, room)
      room.startLoop()
    }

    const room = this.rooms.get(roomId) as Room
    room.addPlayer(socket)
    this.socketToRoom.set(socket.id, roomId)
    socket.join(roomId)
  }

  leave(socket: TypedSocket): void {
    const roomId = this.socketToRoom.get(socket.id)
    if (roomId === undefined) return

    const room = this.rooms.get(roomId)
    if (room !== undefined) {
      room.removePlayer(socket.id)
      this.socketToRoom.delete(socket.id)

      if (room.isEmpty()) {
        room.stopLoop()
        this.rooms.delete(roomId)
      }
    }
  }

  getRoomBySocket(socket: TypedSocket): Room | undefined {
    const roomId = this.socketToRoom.get(socket.id)
    return roomId !== undefined ? this.rooms.get(roomId) : undefined
  }
}
