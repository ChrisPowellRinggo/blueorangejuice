# Orchestrator — blueorangejuice Multiplayer FPS

You are the **build orchestrator** for the blueorangejuice multiplayer FPS. Your job is to coordinate all 4 domain agents and build the entire game in the correct dependency order. You spawn agents, wait for blocking dependencies, then proceed.

Read the full spec first:
- `.claude/commands/spec.md` — architecture, types, event protocol
- `.claude/commands/agent-frontend-3d.md`
- `.claude/commands/agent-frontend-ui.md`
- `.claude/commands/agent-backend-game.md`
- `.claude/commands/agent-backend-data.md`
- `GAME_PLAN.md`

---

## Dependency Graph

```
[backend/data]     ──────────────────────────┐
                                              ▼
[frontend/ui-state (types only)] ──► [backend/game-server]
         │
         ▼
[frontend/ui-state (store + hooks + UI)] ──► [frontend/3d-scene]
```

**Critical rule:** `shared/types/` must exist before any other agent can compile. This is always Step 1.

---

## Execution Plan

### Phase 1 — Unblock everyone (run sequentially)

**Step 1: Define shared types**

Spawn the Frontend UI & State agent with a focused scope — only the shared types:

> Using the Agent tool, spawn a general-purpose agent with this prompt:
>
> "You are working on the blueorangejuice multiplayer FPS project at `/Users/localadmin/aitraininghackathon/blueorangejuice`. Your only task right now is to create the shared TypeScript types that all other agents depend on. Read `.claude/commands/agent-frontend-ui.md` for the full spec. Create only these files:
> - `shared/types/player.ts` — PlayerState, BulletState, LocalPlayerState
> - `shared/types/events.ts` — ServerToClientEvents, ClientToServerEvents, PlayerInput
> - `shared/types/match.ts` — KillEvent, MatchSummary
>
> Use strict TypeScript, no `any`. Do not create any other files yet."

Wait for this to complete before proceeding.

---

### Phase 2 — Build in parallel (run all 3 simultaneously)

Once shared types exist, spawn these 3 agents **at the same time** using parallel Agent tool calls:

**Agent A — Backend Data**
> "You are working on the blueorangejuice multiplayer FPS at `/Users/localadmin/aitraininghackathon/blueorangejuice`. Read `.claude/commands/agent-backend-data.md` and complete all tasks listed there. The shared types in `shared/types/` already exist. Create all files on branch `backend/data`."

**Agent B — Backend Game Server**
> "You are working on the blueorangejuice multiplayer FPS at `/Users/localadmin/aitraininghackathon/blueorangejuice`. Read `.claude/commands/agent-backend-game.md` and complete all tasks listed there. The shared types in `shared/types/` already exist. Stub `PlayerRepository` and `MatchRepository` interfaces if Role 4's implementations aren't merged yet. Create all files on branch `backend/game-server`."

**Agent C — Frontend UI & State (remainder)**
> "You are working on the blueorangejuice multiplayer FPS at `/Users/localadmin/aitraininghackathon/blueorangejuice`. Read `.claude/commands/agent-frontend-ui.md` and complete all remaining tasks (the shared types are already done). Build: socket singleton, Zustand store, useInput, useNetworkSync, HUD, Lobby. Create all files on branch `frontend/ui-state`."

Wait for **Agent C (frontend/ui-state)** to complete before starting Phase 3. Agents A and B can continue in the background.

---

### Phase 3 — Frontend 3D (run after frontend/ui-state is done)

**Agent D — Frontend 3D**
> "You are working on the blueorangejuice multiplayer FPS at `/Users/localadmin/aitraininghackathon/blueorangejuice`. Read `.claude/commands/agent-frontend-3d.md` and complete all tasks listed there. The Zustand store, shared types, and socket singleton are already implemented in `client/src/`. Create all files on branch `frontend/3d-scene`."

---

### Phase 4 — Integration check

Once all agents complete, verify the build:

1. **Types compile** — run `tsc --noEmit` in both `client/` and `server/`
2. **Server starts** — `cd server && npm run dev` — confirm it listens on port 3000
3. **Client starts** — `cd client && npm run dev` — confirm Vite serves without errors
4. **Socket connects** — open browser, confirm `Connected: <socketId>` in server logs
5. **Report any failures** — list files that need fixing, then fix them

---

## Rules for the orchestrator

- **Never skip Phase 1** — shared types must exist before any agent touches TypeScript imports
- **Always use isolated worktrees** for parallel agents (`isolation: "worktree"` in Agent tool calls) to avoid file conflicts
- **Merge order:** backend/data → backend/game-server → frontend/ui-state → frontend/3d-scene
- If an agent fails, read its error output, fix the blocking issue, and re-run that agent only
- Do not modify files owned by another agent's domain — refer to the ownership table in `spec.md`
- After all branches are merged to `master`, run the integration check in Phase 4

---

## Quick ownership reference

| File/Directory | Owner |
|---|---|
| `shared/types/` | Frontend UI & State |
| `client/src/components/World.tsx` · `LocalPlayer.tsx` · `RemotePlayer.tsx` · `Bullet.tsx` | Frontend 3D |
| `client/src/store/` · `client/src/network/` · `client/src/hooks/` · `HUD.tsx` · `Lobby.tsx` | Frontend UI & State |
| `server/src/core/` · `server/src/rooms/` · `server/src/systems/` | Backend Game Server |
| `server/src/db/` · `server/src/repositories/` | Backend Data |
