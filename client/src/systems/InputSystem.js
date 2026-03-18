// Tracks keyboard/mouse state and pointer lock
export class InputSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = {};
    this.mouse = { dx: 0, dy: 0 };
    this._bind();
  }

  _bind() {
    document.addEventListener('keydown', (e) => { this.keys[e.code] = true; });
    document.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
    document.addEventListener('mousemove', (e) => {
      this.mouse.dx += e.movementX;
      this.mouse.dy += e.movementY;
    });
    this.canvas.addEventListener('click', () => this.canvas.requestPointerLock());
  }

  flush() {
    this.mouse.dx = 0;
    this.mouse.dy = 0;
  }

  isDown(code) {
    return !!this.keys[code];
  }
}
