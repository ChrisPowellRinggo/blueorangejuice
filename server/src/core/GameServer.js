import { RoomManager } from '../rooms/RoomManager.js';

export class GameServer {
  constructor(io) {
    this.io = io;
    this.rooms = new RoomManager();
  }

  init() {
    this.io.on('connection', (socket) => {
      console.log('Player connected:', socket.id);

      socket.on('join_room', (roomId) => this.rooms.join(socket, roomId));
      socket.on('player_input', (input) => this.handleInput(socket, input));
      socket.on('disconnect', () => this.rooms.leave(socket));
    });
  }

  handleInput(socket, input) {
    const room = this.rooms.getRoomBySocket(socket);
    room?.applyInput(socket.id, input);
  }
}
