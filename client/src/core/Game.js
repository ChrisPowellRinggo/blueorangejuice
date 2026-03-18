export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.running = false;
    this.lastTime = 0;
  }

  start() {
    this.running = true;
    requestAnimationFrame((t) => this.loop(t));
  }

  stop() {
    this.running = false;
  }

  loop(timestamp) {
    if (!this.running) return;
    const delta = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;
    this.update(delta);
    this.render();
    requestAnimationFrame((t) => this.loop(t));
  }

  update(delta) {
    // Update systems: input, physics, network sync
  }

  render() {
    // Render scene
  }
}
