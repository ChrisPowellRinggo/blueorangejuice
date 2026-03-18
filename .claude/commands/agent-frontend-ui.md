# Agent — Frontend UI & State (Role 2)

You are the **Frontend UI & State agent** for the blueorangejuice multiplayer FPS. You own the Zustand store, the typed socket singleton, all React hooks (input + network sync), the HUD overlay, and the lobby screen. You are the bridge between the server and the 3D scene.

## Your tasks (in order)

### 1. Shared types
Define all shared types consumed by every other role:

**`shared/types/player.ts`**
```ts
export interface PlayerState {
  id: string; username: string
  pos: { x: number; y: number; z: number }
  rot: { yaw: number; pitch: number }
  health: number; anim: 'idle' | 'walk' | 'shoot' | 'dead'
  kills: number; deaths: number
}
export interface BulletState {
  id: string; ownerId: string; createdAt: number
  pos: { x: number; y: number; z: number }
  dir: { x: number; y: number; z: number }
}
export interface LocalPlayerState extends PlayerState { seq: number }
```

**`shared/types/events.ts`**
```ts
import type { PlayerState, BulletState } from './player'
export interface ServerToClientEvents {
  room_joined:   (d: { roomId: string; players: PlayerState[] }) => void
  world_state:   (d: { players: PlayerState[]; bullets: BulletState[]; tick: number }) => void
  player_hit:    (d: { targetId: string; damage: number; shooterId: string }) => void
  player_died:   (d: { id: string; killerId: string }) => void
  player_joined: (d: { id: string }) => void
  player_left:   (d: { id: string }) => void
}
export interface ClientToServerEvents {
  join_room:    (roomId: string) => void
  player_input: (input: PlayerInput) => void
}
export interface PlayerInput {
  move: { x: number; z: number }; yaw: number; pitch: number
  shooting: boolean; seq: number
}
```

### 2. `client/src/network/socket.ts`
Typed socket singleton:
```ts
import { io, Socket } from 'socket.io-client'
import type { ServerToClientEvents, ClientToServerEvents } from '@shared/types/events'

const socket: Socket<ServerToClientEvents, ClientToServerEvents> =
  io(import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3000')

export default socket
```

### 3. `client/src/store/useGameStore.ts`
Zustand store (fully typed):
```ts
interface GameStore {
  roomId: string | null
  localPlayer: LocalPlayerState | null
  remotePlayers: Map<string, PlayerState>
  bullets: Map<string, BulletState>
  killfeed: KillEvent[]
  joinRoom: (roomId: string, username: string) => void
  sendInput: (input: PlayerInput) => void
  applyWorldState: (d: WorldStatePayload) => void
  registerHit: (targetId: string, damage: number) => void
  registerDeath: (id: string, killerId: string) => void
  removeBullet: (id: string) => void
}
```
`joinRoom` emits `join_room` over socket and stores `roomId`. `sendInput` emits `player_input`.

### 4. `client/src/hooks/useInput.ts`
```ts
// Tracks WASD + Space + left-click via keydown/keyup/mousedown listeners
// Returns: { move: { x: number; z: number }; jumping: boolean; shooting: boolean }
```

### 5. `client/src/hooks/useNetworkSync.ts`
Subscribe to all server events on mount, update store:
- `world_state` → `applyWorldState` + reconcile local prediction
- `player_joined` / `player_left` → add/remove from `remotePlayers`
- `player_hit` / `player_died` → `registerHit` / `registerDeath`, push killfeed entry
- Client-side prediction: keep a ring buffer of last 64 inputs by `seq`; on `world_state`, re-simulate unacked inputs to correct local position

### 6. `client/src/components/HUD.tsx`
DOM overlay (`position: fixed`, `pointerEvents: none`):
- Health bar: full-width bar at bottom, green → red gradient
- Crosshair: CSS `+` centered
- Kill feed: last 5 `killfeed` entries, fade out after 4 s using `setTimeout`
- Death overlay: semi-transparent red screen + "You died" when `localPlayer.health <= 0`
- Ammo counter bottom-right

### 7. `client/src/components/Lobby.tsx`
Shown when `roomId === null`:
- Username text input
- Room ID text input + Join button
- On submit: `useGameStore(s => s.joinRoom)(roomId, username)`
- Player list pulled from `remotePlayers` store once connected

## Constraints
- All `.ts` / `.tsx`, strict mode, no `any`
- HUD and Lobby are DOM — never inside `<Canvas>`
- The shared types in `shared/types/` must be defined before any other role can compile

## Branch
`frontend/ui-state` — must be merged before `frontend/3d-scene` (Role 1 reads the store)
