import type { PlayerState } from '@shared/types/player'
import type { ServerToClientEvents, ClientToServerEvents } from '@shared/types/events'
import type { Server } from 'socket.io'
import { incrementStats } from '../repositories/PlayerRepository'

const HIT_RADIUS = 0.5 // bounding sphere radius in world units
const RESPAWN_DELAY_MS = 3_000

/**
 * Minimal interface for what CombatSystem needs from a Room.
 * Avoids a circular import between Room ↔ CombatSystem.
 */
export interface CombatRoom {
  id: string
  io: Server<ClientToServerEvents, ServerToClientEvents>
  tick: number
  players: Map<string, PlayerState>
}

// ---------------------------------------------------------------------------
// registerShot
// ---------------------------------------------------------------------------

/**
 * Bounding-sphere hit detection.
 * Checks all players in the room against the shooter's current position.
 * The shooter themselves is excluded.
 *
 * @returns { hit: true, targetId } if a player was struck, otherwise { hit: false }
 */
export function registerShot(
  shooterId: string,
  players: Map<string, PlayerState>
): { hit: boolean; targetId?: string } {
  const shooter = players.get(shooterId)
  if (!shooter) return { hit: false }

  for (const [id, candidate] of players) {
    if (id === shooterId) continue
    if (candidate.health <= 0) continue // already dead

    const dx = candidate.pos.x - shooter.pos.x
    const dy = candidate.pos.y - shooter.pos.y
    const dz = candidate.pos.z - shooter.pos.z
    const distSq = dx * dx + dy * dy + dz * dz

    if (distSq <= HIT_RADIUS * HIT_RADIUS) {
      return { hit: true, targetId: id }
    }
  }

  return { hit: false }
}

// ---------------------------------------------------------------------------
// applyDamage
// ---------------------------------------------------------------------------

/**
 * Reduces the target's health by `damage`.
 * Emits `player_hit` to the room.
 * If health drops to 0 or below:
 *   - emits `player_died`
 *   - calls PlayerRepository.incrementStats for both participants
 *   - schedules a respawn in RESPAWN_DELAY_MS ms
 */
export async function applyDamage(
  room: CombatRoom,
  targetId: string,
  shooterId: string,
  damage: number
): Promise<void> {
  const target = room.players.get(targetId)
  if (!target || target.health <= 0) return // already dead

  target.health = Math.max(0, target.health - damage)

  // Notify everyone in the room about the hit
  room.io.to(room.id).emit('player_hit', { targetId, damage, shooterId })

  if (target.health <= 0) {
    target.anim = 'dead'
    target.deaths += 1

    const shooter = room.players.get(shooterId)
    if (shooter) {
      shooter.kills += 1
    }

    // Notify room of kill
    room.io.to(room.id).emit('player_died', { id: targetId, killerId: shooterId })

    // Persist stats to DB (fire-and-forget; log on error)
    Promise.all([
      incrementStats(targetId, 0, 1),
      incrementStats(shooterId, 1, 0),
    ]).catch((err: unknown) => {
      console.error('[CombatSystem] Failed to persist stats:', err)
    })

    // Schedule respawn
    setTimeout(() => {
      const respawnTarget = room.players.get(targetId)
      if (respawnTarget) {
        respawnTarget.health = 100
        respawnTarget.anim = 'idle'
        respawnTarget.pos = { x: 0, y: 0, z: 0 }
      }
    }, RESPAWN_DELAY_MS)
  }
}
