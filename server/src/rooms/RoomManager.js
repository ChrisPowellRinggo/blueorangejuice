import { Room } from './Room.js';

export class RoomManager {
  constructor() {
    this.rooms = new Map(); // roomId -> Room
    this.socketToRoom = new Map(); // socketId -> roomId
  }

  join(socket, roomId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Room(roomId));
    }
    const room = this.rooms.get(roomId);
    room.addPlayer(socket);
    this.socketToRoom.set(socket.id, roomId);
    socket.join(roomId);
  }

  leave(socket) {
    const roomId = this.socketToRoom.get(socket.id);
    if (!roomId) return;
    const room = this.rooms.get(roomId);
    room?.removePlayer(socket.id);
    this.socketToRoom.delete(socket.id);
    if (room?.isEmpty()) this.rooms.delete(roomId);
  }

  getRoomBySocket(socket) {
    const roomId = this.socketToRoom.get(socket.id);
    return roomId ? this.rooms.get(roomId) : null;
  }
}
