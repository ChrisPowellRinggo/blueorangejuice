import type { Server, Socket } from 'socket.io'
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  PlayerInput,
} from '@shared/types/events'
import { RoomManager } from '../rooms/RoomManager'

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>

export class GameServer {
  private io: TypedServer
  private rooms: RoomManager

  constructor(io: TypedServer) {
    this.io = io
    this.rooms = new RoomManager(io)
  }

  init(): void {
    this.io.on('connection', (socket: TypedSocket) => {
      console.log('Player connected:', socket.id)

      socket.on('join_room', (data) => this.rooms.join(socket, data.roomId, data.username))
      socket.on('player_input', (input: PlayerInput) => this.handleInput(socket, input))
      socket.on('disconnect', () => this.rooms.leave(socket))
    })
  }

  private handleInput(socket: TypedSocket, input: PlayerInput): void {
    const room = this.rooms.getRoomBySocket(socket)
    room?.applyInput(socket.id, input)
  }
}
