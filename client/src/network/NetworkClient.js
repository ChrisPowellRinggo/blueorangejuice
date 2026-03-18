// Wraps socket.io connection and emits/receives game events
export class NetworkClient {
  constructor(serverUrl) {
    this.serverUrl = serverUrl;
    this.socket = null;
  }

  connect() {
    // this.socket = io(this.serverUrl);
    // this.socket.on('connect', () => console.log('Connected:', this.socket.id));
  }

  send(event, data) {
    this.socket?.emit(event, data);
  }

  on(event, handler) {
    this.socket?.on(event, handler);
  }

  disconnect() {
    this.socket?.disconnect();
  }
}
