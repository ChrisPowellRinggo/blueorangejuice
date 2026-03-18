# blueorangejuice — Multiplayer FPS Game Plan

A browser-based multiplayer first-person shooter for up to 16 players per room, built with React Three Fiber, TypeScript, Socket.io, PostgreSQL, and Redis.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | TypeScript (client + server, strict mode) |
| 3D Rendering | React Three Fiber (`@react-three/fiber`) |
| 3D Helpers | `@react-three/drei` — PointerLockControls, Text, Trail, Environment |
| Physics | `@react-three/rapier` — rigid bodies, capsule colliders, gravity |
| State | Zustand (typed) |
| Networking | Socket.io + socket.io-client (typed events) |
| Build | Vite + React TypeScript template |
| Server | Node.js + Express + `tsx` watcher |
| Persistent data | PostgreSQL + `pg` |
| Live session data | Redis + `ioredis` |

---

## Team — Domain Roles

The team of 4 is split by **domain**, not by feature. Each person owns a vertical slice of the stack, so work can happen in parallel with minimal merge conflicts.

| Role | Domain | What they build |
|---|---|---|
| **Role 1** | Frontend 3D | Everything inside the R3F Canvas — map, player meshes, bullets, animations |
| **Role 2** | Frontend UI & State | Shared types, Zustand store, socket hook, HUD, Lobby |
| **Role 3** | Backend Game Server | Socket.io routing, 20 Hz game loop, movement, combat |
| **Role 4** | Backend Data | PostgreSQL schema + repos, Redis helpers, leaderboard API |

---

## Architecture

```
blueorangejuice/
├── shared/                         # Imported by both client and server
│   ├── constants/game.ts           # TICK_RATE=20, PLAYER_SPEED, SPAWN_POINTS
│   └── types/
│       ├── player.ts               # PlayerState, BulletState, LocalPlayerState
│       ├── events.ts               # ServerToClientEvents, ClientToServerEvents
│       └── match.ts                # KillEvent, MatchSummary
│
├── client/                         # Vite + React (TypeScript)
│   └── src/
│       ├── App.tsx                 # <Canvas> + <Physics> root
│       ├── network/socket.ts       # Typed socket.io-client singleton
│       ├── store/useGameStore.ts   # Zustand: players, bullets, killfeed
│       ├── hooks/
│       │   ├── useInput.ts         # WASD + mouse tracking
│       │   └── useNetworkSync.ts   # Subscribe to server events, reconcile prediction
│       └── components/
│           ├── World.tsx           # Map geometry, lighting, skybox, fog
│           ├── LocalPlayer.tsx     # Rapier body, PointerLockControls, weapon mesh
│           ├── RemotePlayer.tsx    # Interpolated capsule + nametag per other player
│           ├── Bullet.tsx          # Sphere mesh + Trail effect
│           ├── HUD.tsx             # Health bar, crosshair, kill feed (DOM overlay)
│           └── Lobby.tsx           # Username + room join screen (DOM)
│
└── server/
    └── src/
        ├── index.ts                # Express + Socket.io bootstrap + /leaderboard
        ├── core/GameServer.ts      # Typed socket event router
        ├── rooms/
        │   ├── Room.ts             # Per-room 20 Hz game loop
        │   └── RoomManager.ts      # Room create/destroy lifecycle
        ├── systems/
        │   ├── MovementSystem.ts   # Server-authoritative position updates
        │   └── CombatSystem.ts     # Hit detection, damage, death, respawn
        ├── db/
        │   ├── postgres.ts         # pg Pool singleton
        │   ├── redis.ts            # ioredis singleton
        │   └── migrations/001_init.sql
        └── repositories/
            ├── PlayerRepository.ts  # upsert, increment stats, leaderboard
            └── MatchRepository.ts   # match lifecycle, kill event log
```

---

## How Multiplayer Works

1. Player opens the Lobby, enters a username and room ID, clicks Join.
2. Client emits `join_room` over WebSocket. Server adds them to a `Room`.
3. The room runs a **20 Hz `setInterval` loop** on the server. Every tick it:
   - Applies each player's latest `player_input` through `MovementSystem`
   - Checks pending shots through `CombatSystem`
   - Broadcasts `world_state` (all positions, health, bullets) to every client in the room
4. The client receives `world_state` and updates the Zustand store → R3F reads the store and re-renders.
5. **Client-side prediction:** movement is applied locally immediately (no wait for server). When `world_state` arrives, the client re-simulates any unacknowledged inputs to correct the position without visible rubber-banding.
6. Combat is **server-authoritative** — the server's bounding sphere check decides if a shot hit. Clients never self-report damage.

---

## Database Design

### PostgreSQL — persistent data

Stores anything that outlives a game session.

| Table | Purpose |
|---|---|
| `players` | Lifetime stats: kills, deaths, wins, matches played |
| `matches` | One row per match: room, timestamps, winner |
| `match_events` | Every kill/respawn with tick number and JSONB payload |

Used for: leaderboard (`GET /leaderboard`), career stats, match history replay.

### Redis — live data

Stores fast-changing state that must survive a server restart.

| Key pattern | Type | TTL | Content |
|---|---|---|---|
| `room:{id}:players` | Hash | 1 h | `socketId → PlayerState JSON` |
| `room:{id}:meta` | Hash | 1 h | `matchId, startedAt, tick` |
| `session:{socketId}` | String | 30 min | `{ playerId, roomId, username }` |

On server restart, `RoomManager` calls `getRoomPlayers(roomId)` to restore active rooms from Redis — players reconnecting see the same match state.

---

## Shared Types

All Socket.io events are fully typed via shared interfaces in `shared/types/events.ts`. Both the server `Socket.io` instance and the client socket are parameterised with these types, so event name typos and payload mismatches are caught at compile time.

```ts
// shared/types/events.ts
interface ServerToClientEvents {
  world_state:   (d: { players: PlayerState[]; bullets: BulletState[]; tick: number }) => void
  player_hit:    (d: { targetId: string; damage: number; shooterId: string }) => void
  player_died:   (d: { id: string; killerId: string }) => void
  ...
}
interface ClientToServerEvents {
  join_room:    (roomId: string) => void
  player_input: (input: PlayerInput) => void
}
```

---

## Branch Strategy & Merge Order

```
master
 ├── backend/data           Role 4  — no dependencies, merge any time
 ├── backend/game-server    Role 3  — depends on backend/data
 ├── frontend/ui-state      Role 2  — shared types must land first
 └── frontend/3d-scene      Role 1  — depends on frontend/ui-state (needs store)
```

Roles 2, 3, and 4 can all start simultaneously. Role 1 is unblocked as soon as Role 2 merges the shared types and Zustand store shape (even if the store implementation isn't complete).

---

## Integration Milestones

| # | Goal | Who |
|---|---|---|
| 1 | Shared types compile cleanly, socket connects to server | Role 2 |
| 2 | Scene renders, local player walks with physics | Role 1 + 2 |
| 3 | Two browsers connect and see each other move in real time | Role 1 + 2 + 3 |
| 4 | Shooting registers server-side, health decreases | Role 1 + 2 + 3 |
| 5 | Server restart → room restores from Redis | Role 3 + 4 |
| 6 | Match ends → stats in Postgres, `/leaderboard` returns ranked list | Role 3 + 4 |

---

## Agent Slash Commands

Each role has a dedicated Claude agent pre-loaded with their full task list:

| Command | Role |
|---|---|
| `/agent-frontend-3d` | Frontend 3D — scene, players, bullets |
| `/agent-frontend-ui` | Frontend UI & State — store, hooks, HUD, lobby |
| `/agent-backend-game` | Backend Game Server — game loop, movement, combat |
| `/agent-backend-data` | Backend Data — Postgres, Redis, repositories, API |

---

## Running the Project

```bash
# Start dependencies (Docker)
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=pass -e POSTGRES_DB=blueorangejuice postgres
docker run -d -p 6379:6379 redis

# Run DB migration
psql $DATABASE_URL -f server/src/db/migrations/001_init.sql

# Start server (watches for changes)
cd server && npm run dev       # tsx --watch src/index.ts → :3000

# Start client (Vite dev server)
cd client && npm run dev       # → :5173
```

### Environment variables

```bash
# server/.env
DATABASE_URL=postgres://postgres:pass@localhost:5432/blueorangejuice
REDIS_URL=redis://localhost:6379
PORT=3000

# client/.env
VITE_SERVER_URL=http://localhost:3000
```
