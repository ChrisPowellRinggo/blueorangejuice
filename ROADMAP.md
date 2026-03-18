# Roadmap to Playable

Where we are, where we're going, and who does what to get there.

---

## Where We Are

The project has a solid skeleton but no running game yet. The server boots, the browser loads a blank canvas, and the code is organised into the right shape — but none of the systems are connected to each other yet.

**What exists today:**

| Area | What's there |
|---|---|
| Server | Starts up, accepts socket connections, creates rooms, tracks players |
| Client | HTML canvas, a game loop, keyboard and mouse input capture |
| Network | Socket.io wiring stubbed out but not active |
| Shared | Game constants (tick rate, speed, health values) |
| Docs | Game plan, team guide, user journey |

If you run `npm install && npm run dev` right now the server starts. Nothing appears in the browser.

---

## The Path to Playable

These are the steps in the order they need to happen. Each one unlocks the next.

---

### Step 1 — Pick and install the 3D engine
**Who:** Lead + Frontend 3D
**Branch:** `frontend/3d-scene`

Nothing can render until we have an engine. The team has agreed Babylon.js is the recommendation (see `GAME_PLAN.md`). This is a one-line install and a decision that affects everyone, so the Lead should sign off before Frontend 3D proceeds.

---

### Step 2 — Render a scene
**Who:** Frontend 3D
**Branch:** `frontend/3d-scene`

A floor, a skybox, and a first-person camera with pointer lock. No gameplay yet — just enough that opening the browser puts you somewhere. This is the first visual proof the engine is working.

---

### Step 3 — Player movement
**Who:** Frontend 3D
**Branch:** `frontend/3d-scene`

Wire up the existing `InputSystem` to move the camera. WASD to walk, mouse to look. Pointer lock should already be half-working from the input system. This step is self-contained — no server needed.

---

### Step 4 — Live network connection
**Who:** Backend Game + Frontend UI
**Branches:** `backend/game-server`, `frontend/ui-state`

Uncomment and complete `NetworkClient.js` on the client side. The client should join a room on load, and the server should confirm the join and track the player. This is the first moment the two sides talk to each other.

Define the socket event names and payloads here and write them to `PROTOCOL.md` immediately — Frontend 3D will need them in the next step.

---

### Step 5 — Server game tick
**Who:** Backend Game
**Branch:** `backend/game-server`

`Room.js` has a placeholder. It needs a real 20Hz tick loop that:
- Reads buffered player inputs
- Updates player positions
- Broadcasts the world state to every client in the room

This is the heart of the server. Use the `backend-dev` agent for this task.

---

### Step 6 — See other players
**Who:** Frontend 3D
**Branch:** `frontend/3d-scene`

When the client receives a world state update from the server, render a simple shape (box or capsule) at each other player's position. No animations yet. This is the first moment two people can open a browser and see each other move — the project's first real milestone.

> **This is the playable proof of concept.** Steps 7–10 add the game on top.

---

### Step 7 — Shooting
**Who:** Backend Game + Frontend 3D
**Branches:** `backend/game-server`, `frontend/3d-scene`

On click: cast a ray from the camera in the look direction. If it hits a player or target, send a `shoot` event to the server. The server validates the shot and applies damage. The client shows a visual (muzzle flash, hit marker) based on the server's response.

This is a cross-domain step — coordinate before starting.

---

### Step 8 — Health and death
**Who:** Backend Game
**Branch:** `backend/game-server`

Players and targets have health (already defined in `shared/constants/game.js`). Reduce it on hit. Broadcast the updated value. When a player hits zero: remove them from the world and trigger a respawn after a delay. The HUD shows current health.

---

### Step 9 — Ammo
**Who:** Backend Game + Frontend UI
**Branches:** `backend/game-server`, `frontend/ui-state`

The server tracks ammo per player. Each shot consumes one round. Shooting at zero does nothing. The HUD displays the current count. Ammo packs in the world restore it (handled in Step 10).

---

### Step 10 — Pickups and terrain
**Who:** Frontend 3D + Backend Game
**Branches:** `frontend/3d-scene`, `backend/game-server`

Place static objects in the scene: trees for cover, health packs, ammo packs. Walking over a pickup sends an event to the server, which validates it (was it already taken?), applies the effect, and broadcasts the removal of the pickup to all clients.

---

## Summary

| Step | What it unlocks | Owner |
|---|---|---|
| 1. Engine | Anything visual | Lead + Frontend 3D |
| 2. Scene | First render | Frontend 3D |
| 3. Movement | Single-player feel | Frontend 3D |
| 4. Network | Client and server talking | Backend Game + Frontend UI |
| 5. Game tick | Server authority | Backend Game |
| 6. Other players | **First playable moment** | Frontend 3D |
| 7. Shooting | Combat | Backend Game + Frontend 3D |
| 8. Health/death | Stakes | Backend Game |
| 9. Ammo | Resource management | Backend Game + Frontend UI |
| 10. Pickups + terrain | Full user journey | Frontend 3D + Backend Game |

---

## What Doesn't Block the Above

These are real features but nothing in the list above depends on them. Do them after Step 10.

- Lobby UI and room selection
- Player stats and leaderboard
- PostgreSQL and Redis persistence
- Animations and player models
- Sound effects
- Win conditions and match flow
