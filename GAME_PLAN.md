# blueorangejuice — Game Plan

A browser-based multiplayer FPS. Up to 16 players per room, real-time, fully typed.

---

## What we're building

Players join a room, spawn into a 3D map, and shoot each other. Stats and match history persist across sessions. The server is authoritative — no client can cheat movement or damage.

---

## Tech

- **3D:** React Three Fiber + Drei + Rapier physics
- **Language:** TypeScript everywhere
- **Networking:** Socket.io (20 updates/sec)
- **State:** Zustand
- **Databases:** PostgreSQL (stats + history) · Redis (live session state)

---

## Team

| Domain | Owns |
|---|---|
| **Frontend 3D** | The game world — map, player bodies, bullets, animations |
| **Frontend UI & State** | Shared types, app state, HUD, lobby |
| **Backend Game** | Game loop, movement, combat, hit detection |
| **Backend Data** | Database schema, queries, Redis, leaderboard API |

---

## How it fits together

```
Browser                          Server
──────                           ──────
Lobby → join room ──────────────→ create/join Room
                                  20Hz game loop
LocalPlayer sends input ────────→ MovementSystem updates position
                                  CombatSystem checks hits
                    ←─────────── broadcast world_state
R3F renders all players
HUD shows health / kills
                                  on match end → write to Postgres
                                  live state mirrored in Redis
```

---

## Milestones

1. Shared types defined → everyone can compile
2. Scene renders, player walks
3. Two players see each other move
4. Shooting works, health drops
5. Server restart → room restores from Redis
6. Match ends → stats saved, leaderboard live

---

## Branches

```
backend/data        ← no dependencies, start immediately
backend/game-server ← needs data layer
frontend/ui-state   ← define shared types first
frontend/3d-scene   ← needs ui-state merged
```
