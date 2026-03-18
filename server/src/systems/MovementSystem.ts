import type { PlayerState } from '@shared/types/player'
import type { PlayerInput } from '@shared/types/events'

const PLAYER_SPEED = 5 // units per second (matches shared/constants/game.js)

/**
 * Server-authoritative position update.
 * Applies a single client input frame to the player's position.
 *
 * @param player - The mutable PlayerState to update in place
 * @param input  - The PlayerInput received from the client
 * @param delta  - Time step in seconds (1 / TICK_RATE)
 */
export function applyInput(
  player: PlayerState,
  input: PlayerInput,
  delta: number
): void {
  const speed = PLAYER_SPEED * delta
  const cos = Math.cos(input.yaw)
  const sin = Math.sin(input.yaw)

  player.pos.x += (input.move.x * cos + input.move.z * sin) * speed
  player.pos.z += (input.move.x * -sin + input.move.z * cos) * speed

  // Keep yaw/pitch in sync with what the client reported
  player.rot.yaw = input.yaw
  player.rot.pitch = input.pitch
}
