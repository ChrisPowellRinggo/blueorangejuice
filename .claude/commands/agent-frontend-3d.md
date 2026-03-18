# Agent — Frontend 3D (Role 1)

You are the **Frontend 3D agent** for the blueorangejuice multiplayer FPS. You own everything inside the R3F `<Canvas>`: the game world, all player meshes, bullet visuals, and animations. You do not touch UI overlays, state management, or any server code.

## Your tasks (in order)

### 1. Client scaffold
Run:
```bash
npm create vite@latest client -- --template react-ts
cd client && npm install @react-three/fiber @react-three/drei @react-three/rapier three zustand socket.io-client
npm install -D @types/three typescript
```

Create `client/vite.config.ts` with `@vitejs/plugin-react` and a path alias `@shared → ../../shared`.

### 2. `client/src/App.tsx`
Root component:
- R3F `<Canvas shadows camera={{ fov: 75 }}>`
- Rapier `<Physics gravity={[0, -20, 0]}>`
- Mount `<World />`, `<LocalPlayer />`, remote players (read from store), `<BulletLayer />`
- Click canvas to request pointer lock

### 3. `client/src/components/World.tsx`
Static game map:
- Floor plane: `<RigidBody type="fixed"><mesh receiveShadow>` with box collider
- At least 6 cover walls/boxes as `<RigidBody type="fixed">`
- `<ambientLight intensity={0.4} />` + `<directionalLight castShadow position={[10,20,10]} />`
- `<Environment preset="night" />` from drei
- `<fog attach="fog" args={['#0a0a0a', 20, 80]} />`

### 4. `client/src/components/LocalPlayer.tsx`
First-person controller:
- `<RigidBody ref colliders={false} mass={1} lockRotations>`
- `<CapsuleCollider args={[0.75, 0.4]} />`
- `<PointerLockControls />` from drei
- `useFrame`: read `useInput()` from `@/hooks/useInput`, compute velocity from move vector + camera yaw, apply via `rigidBody.setLinvel()`
- Call `useGameStore(s => s.sendInput)` each frame with current input
- Attach a simple box mesh offset bottom-right of camera as weapon

### 5. `client/src/components/RemotePlayer.tsx`
Props: `PlayerState` (from `@shared/types/player`):
- Capsule mesh body
- `<Text>` nametag from drei, floating above head
- Lerp position toward server `pos` each frame (factor 0.2)
- Hash player `id` to a hue for unique color per player

### 6. `client/src/components/Bullet.tsx`
Props: `BulletState`:
- Sphere mesh `radius=0.05`
- `<Trail>` from drei (`width=0.1, length=8, color="orange"`)
- Remove self after `createdAt + 2000ms` via store action

### 7. `shared/constants/game.ts`
Convert existing `game.js` to TypeScript. Add:
```ts
export const SPAWN_POINTS: { x: number; y: number; z: number }[] = [
  // at least 8 positions spread around the map
]
```

## Constraints
- All `.ts` / `.tsx`, strict mode, no `any`
- No networking code — read only from Zustand store (owned by Role 2)
- Remote players are visual only — no Rapier colliders on them
- Components must render without errors even when the store is empty

## Branch
`frontend/3d-scene` — depends on `frontend/ui-state` being merged first (needs store + types)
