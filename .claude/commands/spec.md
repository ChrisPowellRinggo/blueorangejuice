# Multiplayer FPS Game — Team Spec & Role Assignments

You are the project architect for a 4-person team building a browser-based multiplayer FPS using **React Three Fiber** (pmnd.rs ecosystem), **TypeScript**, and **Socket.io**. When invoked, print the full spec below and answer any questions about it.

Agent slash commands: `/agent-frontend-3d`, `/agent-frontend-ui`, `/agent-backend-game`, `/agent-backend-data`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | **TypeScript** — client + server, strict mode |
| 3D Rendering | `@react-three/fiber` (R3F) |
| 3D Helpers | `@react-three/drei` — controls, text, trails, environment |
| Physics | `@react-three/rapier` — rigid bodies, colliders, gravity |
| State | `zustand` (typed) |
| Networking | `socket.io` (server) + `socket.io-client` (typed events) |
| Build | `vite` + React TypeScript template |
| Server Runtime | Node.js + Express + `tsx` watcher |
| Stats & Match History | PostgreSQL + `pg` |
| Session & Room State | Redis + `ioredis` |

Install commands:
```bash
# client
npm create vite@latest client -- --template react-ts
cd client && npm install @react-three/fiber @react-three/drei @react-three/rapier three zustand socket.io-client
npm install -D @types/three

# server
cd server && npm install pg ioredis tsx
npm install -D typescript @types/node @types/express @types/pg
```

---

## Architecture Overview

```
blueorangejuice/
├── shared/                        # Shared between client and server
│   ├── constants/game.ts          # TICK_RATE, PLAYER_SPEED, SPAWN_POINTS
│   └── types/
│       ├── player.ts              # PlayerState, BulletState, LocalPlayerState
│       ├── events.ts              # ServerToClientEvents, ClientToServerEvents, PlayerInput
│       └── match.ts               # MatchSummary, KillEvent
│
├── client/                        # Vite + React (TypeScript)
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── src/
│       ├── App.tsx                # Canvas + Physics + scene root
│       ├── store/
│       │   └── useGameStore.ts    # Zustand store (typed)         ← Role 2
│       ├── network/
│       │   └── socket.ts          # Typed Socket.io singleton     ← Role 2
│       ├── hooks/
│       │   ├── useInput.ts        # WASD + mouse state            ← Role 2
│       │   └── useNetworkSync.ts  # Server reconciliation         ← Role 2
│       └── components/
│           ├── World.tsx          # Map, lighting, environment    ← Role 1
│           ├── LocalPlayer.tsx    # FP camera + Rapier body       ← Role 1
│           ├── RemotePlayer.tsx   # Interpolated other players    ← Role 1
│           ├── Bullet.tsx         # Projectile mesh + Trail       ← Role 1
│           ├── HUD.tsx            # Health, crosshair, killfeed   ← Role 2
│           └── Lobby.tsx          # Room join screen              ← Role 2
│
└── server/
    ├── tsconfig.json
    └── src/
        ├── index.ts               # Express + Socket.io + /leaderboard  ← Role 4
        ├── core/
        │   └── GameServer.ts      # Socket.io event router        ← Role 3
        ├── rooms/
        │   ├── Room.ts            # 20 Hz game loop               ← Role 3
        │   └── RoomManager.ts     # Room lifecycle                ← Role 3
        ├── systems/
        │   ├── MovementSystem.ts  # Server-authoritative movement ← Role 3
        │   └── CombatSystem.ts    # Hit detection, damage, respawn← Role 3
        ├── db/
        │   ├── postgres.ts        # pg Pool singleton             ← Role 4
        │   ├── redis.ts           # ioredis singleton             ← Role 4
        │   └── migrations/
        │       └── 001_init.sql   # Schema                        ← Role 4
        └── repositories/
            ├── PlayerRepository.ts  # Stats upsert, leaderboard   ← Role 4
            └── MatchRepository.ts   # Match lifecycle + events    ← Role 4
```

---

## Shared Socket.io Event Protocol

```
Client → Server:
  player_input  { move: {x,z}, yaw, pitch, shooting: bool, seq: number }
  join_room     roomId: string

Server → Client:
  room_joined   { roomId, players: PlayerState[] }
  world_state   { players: PlayerState[], bullets: BulletState[], tick: number }
  player_hit    { targetId, damage, shooterId }
  player_died   { id, killerId }
  player_joined { id }
  player_left   { id }
```

**Tick rate:** 20 Hz (`shared/constants/game.ts`)

---

## Domain Roles

---

### Role 1 — Frontend 3D
**Owner:** Team Member 1
**Branch:** `frontend/3d-scene`

Everything that lives inside the R3F `<Canvas>`. No networking, no UI overlays.

**Owns:**
- `client/src/App.tsx` — Canvas + Physics wrapper
- `client/src/components/World.tsx` — map, lighting, skybox, fog
- `client/src/components/LocalPlayer.tsx` — Rapier body, PointerLockControls, weapon mesh
- `client/src/components/RemotePlayer.tsx` — interpolated capsule + nametag
- `client/src/components/Bullet.tsx` — sphere mesh + Trail
- `shared/constants/game.ts` — convert to TS, add SPAWN_POINTS
- `client/vite.config.ts`, `client/tsconfig.json`

**Reads from:** Zustand store (owned by Role 2) — never writes to it directly except via `sendInput`

---

### Role 2 — Frontend UI & State
**Owner:** Team Member 2
**Branch:** `frontend/ui-state`

The glue layer: shared types, client state, socket connection, hooks, and all DOM UI.

**Owns:**
- `shared/types/player.ts`, `shared/types/events.ts`, `shared/types/match.ts` — **must be done first**, all other roles depend on these
- `client/src/network/socket.ts` — typed Socket.io singleton
- `client/src/store/useGameStore.ts` — Zustand store
- `client/src/hooks/useInput.ts` — keyboard/mouse tracking
- `client/src/hooks/useNetworkSync.ts` — subscribe to server events, client-side prediction
- `client/src/components/HUD.tsx` — health bar, crosshair, kill feed, death overlay
- `client/src/components/Lobby.tsx` — room join screen

**Note:** This role defines the shared types first. All other roles are blocked on `shared/types/` to compile.

---

### Role 3 — Backend Game Server
**Owner:** Team Member 3
**Branch:** `backend/game-server`

The authoritative game runtime. Handles all real-time player state and combat.

**Owns:**
- `server/src/core/GameServer.ts` — typed Socket.io event router
- `server/src/rooms/Room.ts` — 20 Hz `setInterval` game loop
- `server/src/rooms/RoomManager.ts` — room creation/teardown
- `server/src/systems/MovementSystem.ts` — position update from input
- `server/src/systems/CombatSystem.ts` — bounding sphere hit detection, damage, respawn

**Calls into:** `PlayerRepository` and `MatchRepository` (owned by Role 4) for stat writes. Can stub with interfaces while Role 4 builds the real implementation.

---

### Role 4 — Backend Data
**Owner:** Team Member 4
**Branch:** `backend/data`

The persistence layer. Fully independent — can be built in parallel with everything else.

**Owns:**
- `server/src/db/postgres.ts` — pg Pool singleton
- `server/src/db/redis.ts` — ioredis singleton
- `server/src/db/migrations/001_init.sql` — `players`, `matches`, `match_events` tables
- `server/src/repositories/PlayerRepository.ts` — upsert, increment stats, leaderboard query
- `server/src/repositories/MatchRepository.ts` — create match, append events, close match
- Redis helpers — `savePlayerToRoom`, `getRoomPlayers`, `saveSession`, `getSession`
- `GET /leaderboard` endpoint in `server/src/index.ts`

---

## PostgreSQL Schema

```sql
CREATE TABLE players (
  id TEXT PRIMARY KEY, username TEXT NOT NULL,
  kills INT NOT NULL DEFAULT 0, deaths INT NOT NULL DEFAULT 0,
  wins INT NOT NULL DEFAULT 0, matches INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT NOT NULL, started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ, winner_id TEXT REFERENCES players(id)
);
CREATE TABLE match_events (
  id BIGSERIAL PRIMARY KEY, match_id UUID REFERENCES matches(id),
  tick INT NOT NULL, event_type TEXT NOT NULL, payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## Redis Key Patterns

| Key | Type | TTL | Content |
|---|---|---|---|
| `room:{id}:players` | Hash | 1 h | `socketId → PlayerState JSON` |
| `room:{id}:meta` | Hash | 1 h | `matchId, startedAt, tick` |
| `session:{socketId}` | String | 30 min | `{ playerId, roomId, username }` |

---

## Branch Strategy & Merge Order

```
master
 ├── backend/data          Role 4  — fully independent, merge any time
 ├── backend/game-server   Role 3  — depends on backend/data
 ├── frontend/ui-state     Role 2  — shared types must land first
 └── frontend/3d-scene     Role 1  — depends on frontend/ui-state
```

---

## Integration Milestones

| # | Goal | Roles |
|---|---|---|
| 1 | Shared types compile, socket connects | 2 |
| 2 | Scene renders, local player walks | 1 + 2 |
| 3 | Two browsers connect and see each other move | 1 + 2 + 3 |
| 4 | Shooting registers, health drops | 1 + 2 + 3 |
| 5 | Room state survives server restart (Redis) | 3 + 4 |
| 6 | Kill → respawn → stats in Postgres, `/leaderboard` live | 3 + 4 |

---

## Environment Variables

```bash
# server/.env
DATABASE_URL=postgres://user:pass@localhost:5432/blueorangejuice
REDIS_URL=redis://localhost:6379
PORT=3000

# client/.env
VITE_SERVER_URL=http://localhost:3000
```

## Zustand Store Shape

```ts
{
  roomId: string | null
  localPlayer: LocalPlayerState | null
  remotePlayers: Map<string, PlayerState>
  bullets: Map<string, BulletState>
  killfeed: KillEvent[]

  joinRoom:        (roomId: string, username: string) => void
  sendInput:       (input: PlayerInput) => void
  applyWorldState: (d: WorldStatePayload) => void
  registerHit:     (targetId: string, damage: number) => void
  registerDeath:   (id: string, killerId: string) => void
  removeBullet:    (id: string) => void
}
```
