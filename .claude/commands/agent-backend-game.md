# Agent — Backend Game Server (Role 3)

You are the **Backend Game Server agent** for the blueorangejuice multiplayer FPS. You own the Socket.io event routing, the per-room 20 Hz game loop, server-authoritative movement, and the combat system (hit detection, damage, respawn). You do not touch the database or any client code.

## Your tasks (in order)

### 1. Convert server scaffold to TypeScript
- Add `server/tsconfig.json` (strict, `module: NodeNext`, `outDir: dist`)
- Add `tsx` as dev runner: `"dev": "tsx --watch src/index.ts"`
- Rename all `.js` files to `.ts`

### 2. `server/src/core/GameServer.ts`
Convert existing `GameServer.js` to TypeScript. Use the typed socket:
```ts
import type { Server } from 'socket.io'
import type { ServerToClientEvents, ClientToServerEvents } from '@shared/types/events'

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>
```
Wire: `join_room`, `player_input`, `disconnect` (already exist — just type them).

### 3. `server/src/rooms/Room.ts`
Convert to TypeScript + add game loop:
```ts
startLoop(): void {
  this.interval = setInterval(() => {
    // 1. apply pending inputs via MovementSystem
    for (const [id, player] of this.players) {
      const input = this.pendingInputs.get(id)
      if (input) MovementSystem.applyInput(player, input, 1 / TICK_RATE)
    }
    // 2. broadcast world state
    this.io.to(this.id).emit('world_state', {
      players: [...this.players.values()],
      bullets: [...this.bullets.values()],
      tick: this.tick++,
    })
  }, 1000 / TICK_RATE)
}

stopLoop(): void { clearInterval(this.interval) }
```
Store `pendingInputs: Map<string, PlayerInput>`, updated on every `player_input` event.

### 4. `server/src/systems/MovementSystem.ts`
Server-authoritative position update:
```ts
export function applyInput(player: PlayerState, input: PlayerInput, delta: number): void {
  const speed = PLAYER_SPEED * delta
  const cos = Math.cos(input.yaw)
  const sin = Math.sin(input.yaw)
  player.pos.x += (input.move.x * cos + input.move.z * sin) * speed
  player.pos.z += (input.move.x * -sin + input.move.z * cos) * speed
}
```

### 5. `server/src/systems/CombatSystem.ts`
Hit registration and lifecycle:
```ts
// registerShot: bounding sphere check (radius 0.5) against all players in room
export function registerShot(
  shooterId: string,
  players: Map<string, PlayerState>
): { hit: boolean; targetId?: string }

// applyDamage: reduce health, emit player_hit; if <= 0 emit player_died,
// call PlayerRepository.incrementStats, schedule respawn in 3s
export async function applyDamage(
  room: Room,
  targetId: string,
  shooterId: string,
  damage: number
): Promise<void>
```
Wire into `Room.ts`: when `player_input` has `shooting: true`, call `registerShot`. If hit, call `applyDamage`.

### 6. `server/src/rooms/RoomManager.ts`
Convert to TypeScript. On room creation call `room.startLoop()`. On room empty call `room.stopLoop()` before deleting.

## Constraints
- All TypeScript strict mode, no `any`
- Import shared types from `../../shared/types` — never duplicate them
- No database calls in this layer — call `PlayerRepository` / `MatchRepository` (owned by Role 4) via dependency injection
- Movement is server-authoritative — never trust client position values directly

## Branch
`backend/game-server` — depends on `backend/data` for repository imports. Can stub repositories behind an interface while Role 4 builds the real implementations.
