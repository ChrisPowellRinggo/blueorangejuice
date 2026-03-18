# Team Coordination

A guide for the five-person team on how to work with Claude effectively — including when to use agents, how to divide work, and how to keep Claude's context useful across sessions.

---

## Team Roles

| Person | Domain | Branch |
|---|---|---|
| **Lead** | Architecture, cross-cutting decisions, agents | `main` |
| **Backend Game** | Game loop, combat, hit detection, rooms | `backend/game-server` |
| **Backend Data** | Database, Redis, leaderboard API | `backend/data` |
| **Frontend 3D** | Map, player bodies, bullets, animations | `frontend/3d-scene` |
| **Frontend UI** | HUD, lobby, shared types, app state | `frontend/ui-state` |

---

## How Claude Works Best on This Project

Claude reads `CLAUDE.md` and all root-level `.md` files at the start of every session. This means the documents in this repo *are* Claude's briefing. Keep them current and Claude will always have context without needing to be re-explained.

### Golden rules

1. **One domain per session.** Open the relevant branch and ask Claude to work on that domain only. Mixing frontend and backend in one session produces scattered results.
2. **Read before writing.** Claude should always read the files it's about to change. Never ask Claude to create something without first asking it to read the existing code.
3. **Commit Claude's output before continuing.** If Claude writes code, commit it before starting a new task. A clean git state keeps context tight.
4. **Update the docs when the design changes.** If a decision changes (e.g. swapping the physics engine), update `GAME_PLAN.md` immediately. Claude's next session depends on it.

---

## When to Make a Claude Agent

Create a `.claude/agents/<name>.md` agent when a role needs to be invoked repeatedly across sessions and benefits from a consistent persona and toolset.

### Good candidates for agents

| Agent | When to create it | Tools it needs |
|---|---|---|
| `backend-dev` | Backend game loop, rooms, socket events (already created) | Read, Write, Edit, Bash, Glob, Grep |
| `frontend-3d` | Three.js / Babylon scene work, rendering, cameras | Read, Write, Edit, Glob, Grep |
| `frontend-ui` | HUD, lobby UI, Zustand state, shared types | Read, Write, Edit, Glob, Grep |
| `db-dev` | Schema design, SQL migrations, Redis structures | Read, Write, Edit, Bash |
| `reviewer` | Code review, catching bugs before PR merge | Read, Glob, Grep (no Write) |

### How to invoke an agent

Ask Claude: *"Use the backend-dev agent to implement the respawn timer in Room.js"*. Claude will spawn it with the right context and tools.

### When NOT to make an agent

- One-off tasks. If you're only doing something once, just ask Claude directly.
- Tasks that span multiple domains. Do those in the main session with Claude orchestrating, then delegating to agents for the domain-specific parts.

---

## Per-Domain Workflow

### Backend Game (`backend/game-server`)
1. Open the branch. Claude reads `GAME_PLAN.md` and `server/` automatically.
2. Use the `backend-dev` agent for implementation tasks.
3. Ask Claude to write a plain-English summary of any new socket event protocol and append it to `GAME_PLAN.md` or a new `PROTOCOL.md`.

### Backend Data (`backend/data`)
1. Schema changes should be proposed as SQL migration files, not edits to a live schema.
2. Ask Claude to document any new table or Redis key shape in a `DATA_MODEL.md` file so other domains can reference it without reading the DB code.

### Frontend 3D (`frontend/3d-scene`)
1. Before building any new scene element, ask Claude to read the current `client/src/` structure first.
2. Use the `frontend-3d` agent for rendering tasks once it's created.
3. Any new socket event consumed on the client should be cross-referenced with the server's protocol docs.

### Frontend UI (`frontend/ui-state`)
1. Shared types live in `shared/`. Any type added there affects all domains — coordinate with the Lead before Claude changes these.
2. Use Claude to keep the HUD in sync with server-sent state fields. Point it at both the UI file and the relevant `shared/constants/game.js`.

---

## Keeping Context Sharp

The more specific and current the root `.md` files are, the better Claude performs. Assign one person (suggested: the Lead) to merge Claude-generated doc updates into `main` weekly.

Useful docs to maintain in the root:

| File | Owned by | Contains |
|---|---|---|
| `GAME_PLAN.md` | Lead | Vision, user journey, milestones, tech |
| `TEAM.md` | Lead | This file |
| `PROTOCOL.md` | Backend Game | Socket event names, payloads, direction |
| `DATA_MODEL.md` | Backend Data | Tables, Redis keys, field descriptions |
| `CLAUDE.md` | Lead | Instructions to Claude for every session |

---

## PR and Review Process

1. Claude writes code on a feature branch.
2. Developer reviews the diff — Claude is not infallible, especially on game math and network edge cases.
3. Use the `reviewer` agent (once created) to get a second Claude pass before opening a PR: *"Use the reviewer agent to check this branch for bugs before I merge"*.
4. PRs into `main` require at least one human approval.

---

## What Claude Is Good At on This Project

- Scaffolding new files and systems quickly
- Keeping socket event handlers consistent between client and server
- Writing boilerplate (Room management, player state updates, input handling)
- Catching type errors and suggesting fixes
- Drafting documentation from code

## What Needs Human Judgement

- Game feel decisions (movement speed, damage values, weapon recoil)
- Network architecture trade-offs under real latency
- Security review of server-authoritative logic
- Final call on any design that affects multiple domains
