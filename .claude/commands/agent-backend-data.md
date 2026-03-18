# Agent — Backend Data (Role 4)

You are the **Backend Data agent** for the blueorangejuice multiplayer FPS. You own the entire data layer: PostgreSQL schema and repositories for persistent stats and match history, Redis for live session and room state, and the leaderboard REST endpoint. You do not touch game logic or any client code.

## Your tasks (in order)

### 1. DB singletons

**`server/src/db/postgres.ts`**
```ts
import { Pool } from 'pg'
export const pool = new Pool({ connectionString: process.env.DATABASE_URL })
```

**`server/src/db/redis.ts`**
```ts
import Redis from 'ioredis'
export const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379')
```

### 2. `server/src/db/migrations/001_init.sql`
```sql
CREATE TABLE players (
  id          TEXT PRIMARY KEY,
  username    TEXT NOT NULL,
  kills       INT  NOT NULL DEFAULT 0,
  deaths      INT  NOT NULL DEFAULT 0,
  wins        INT  NOT NULL DEFAULT 0,
  matches     INT  NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE matches (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     TEXT NOT NULL,
  started_at  TIMESTAMPTZ DEFAULT now(),
  ended_at    TIMESTAMPTZ,
  winner_id   TEXT REFERENCES players(id)
);

CREATE TABLE match_events (
  id          BIGSERIAL PRIMARY KEY,
  match_id    UUID REFERENCES matches(id),
  tick        INT  NOT NULL,
  event_type  TEXT NOT NULL,        -- 'kill' | 'respawn' | 'round_end'
  payload     JSONB NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ON match_events(match_id);
```

### 3. `server/src/repositories/PlayerRepository.ts`
```ts
upsertPlayer(id: string, username: string): Promise<void>
  // INSERT INTO players (id, username) VALUES ($1,$2) ON CONFLICT DO NOTHING

incrementStats(id: string, kills: number, deaths: number): Promise<void>
  // UPDATE players SET kills = kills + $2, deaths = deaths + $3 WHERE id = $1

getLeaderboard(limit: number): Promise<PlayerRow[]>
  // SELECT id, username, kills, deaths, wins FROM players ORDER BY kills DESC LIMIT $1
```
All queries use parameterised values — no string interpolation.

### 4. `server/src/repositories/MatchRepository.ts`
```ts
createMatch(roomId: string): Promise<string>          // returns matchId (UUID)
appendEvent(matchId: string, tick: number, type: string, payload: object): Promise<void>
closeMatch(matchId: string, winnerId: string): Promise<void>
  // UPDATE matches SET ended_at = now(), winner_id = $2 WHERE id = $1
  // UPDATE players SET wins = wins + 1 WHERE id = $2
```

### 5. Redis — session & room state
Provide these helper functions (used by Role 3's `Room.ts`):

```ts
// room state
export async function savePlayerToRoom(roomId: string, socketId: string, state: PlayerState): Promise<void>
  // HSET room:{roomId}:players socketId JSON + EXPIRE 3600

export async function removePlayerFromRoom(roomId: string, socketId: string): Promise<void>
  // HDEL room:{roomId}:players socketId

export async function getRoomPlayers(roomId: string): Promise<PlayerState[]>
  // HGETALL room:{roomId}:players → parse values

// session
export async function saveSession(socketId: string, data: { playerId: string; roomId: string; username: string }): Promise<void>
  // SET session:{socketId} JSON EX 1800

export async function getSession(socketId: string): Promise<SessionData | null>
export async function deleteSession(socketId: string): Promise<void>
```

### 6. Leaderboard API endpoint
In `server/index.ts`, add:
```ts
app.get('/leaderboard', async (_req, res) => {
  const rows = await PlayerRepository.getLeaderboard(20)
  res.json(rows)
})
```

### 7. `server/.env.example`
```
DATABASE_URL=postgres://user:pass@localhost:5432/blueorangejuice
REDIS_URL=redis://localhost:6379
PORT=3000
```

Add migration script to `server/package.json`:
```json
"migrate": "psql $DATABASE_URL -f src/db/migrations/001_init.sql"
```

## Constraints
- All TypeScript strict mode, no `any`
- Postgres: always parameterised queries — never interpolate user data into SQL
- Redis: always set TTLs — no unbounded keys
- Export only named functions/classes — no default exports from repositories

## Branch
`backend/data` — fully independent, can be built in parallel with everything else. All other backend work imports from here.
