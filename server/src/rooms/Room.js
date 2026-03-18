export class Room {
  constructor(id) {
    this.id = id;
    this.players = new Map(); // socketId -> player state
  }

  addPlayer(socket) {
    this.players.set(socket.id, { id: socket.id, position: { x: 0, y: 0, z: 0 }, health: 100 });
    socket.emit('room_joined', { roomId: this.id, players: [...this.players.values()] });
    socket.to(this.id).emit('player_joined', { id: socket.id });
  }

  removePlayer(socketId) {
    this.players.delete(socketId);
  }

  applyInput(socketId, input) {
    // Validate and apply movement input server-side
    const player = this.players.get(socketId);
    if (!player) return;
    // TODO: server-side movement simulation
  }

  isEmpty() {
    return this.players.size === 0;
  }
}
