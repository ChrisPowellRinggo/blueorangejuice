import type { Server, Socket } from 'socket.io'
import type { ServerToClientEvents, ClientToServerEvents, PlayerInput } from '@shared/types/events'
import type { PlayerState, BulletState } from '@shared/types/player'
import * as MovementSystem from '../systems/MovementSystem'
import { registerShot, applyDamage } from '../systems/CombatSystem'

const TICK_RATE = 20 // Hz — matches shared/constants/game.js
const PLAYER_START_HEALTH = 100

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>

export class Room {
  readonly id: string
  readonly io: TypedServer

  players: Map<string, PlayerState>
  bullets: Map<string, BulletState>
  tick: number

  private pendingInputs: Map<string, PlayerInput>
  private interval: ReturnType<typeof setInterval> | null

  constructor(id: string, io: TypedServer) {
    this.id = id
    this.io = io
    this.players = new Map()
    this.bullets = new Map()
    this.pendingInputs = new Map()
    this.tick = 0
    this.interval = null
  }

  // ---------------------------------------------------------------------------
  // Player lifecycle
  // ---------------------------------------------------------------------------

  addPlayer(socket: TypedSocket): void {
    const player: PlayerState = {
      id: socket.id,
      username: socket.id, // overridden when auth is wired up
      pos: { x: 0, y: 0, z: 0 },
      rot: { yaw: 0, pitch: 0 },
      health: PLAYER_START_HEALTH,
      anim: 'idle',
      kills: 0,
      deaths: 0,
    }
    this.players.set(socket.id, player)

    socket.emit('room_joined', {
      roomId: this.id,
      players: [...this.players.values()],
    })
    socket.to(this.id).emit('player_joined', { id: socket.id })
  }

  removePlayer(socketId: string): void {
    this.players.delete(socketId)
    this.pendingInputs.delete(socketId)
    this.io.to(this.id).emit('player_left', { id: socketId })
  }

  // ---------------------------------------------------------------------------
  // Input handling
  // ---------------------------------------------------------------------------

  applyInput(socketId: string, input: PlayerInput): void {
    if (!this.players.has(socketId)) return
    // Store latest input; the game loop will consume it each tick
    this.pendingInputs.set(socketId, input)

    // Shooting is handled immediately on receipt, not per-tick
    if (input.shooting) {
      const { hit, targetId } = registerShot(socketId, this.players)
      if (hit && targetId !== undefined) {
        applyDamage(this, targetId, socketId, 25).catch((err: unknown) => {
          console.error('[Room] applyDamage error:', err)
        })
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Game loop
  // ---------------------------------------------------------------------------

  startLoop(): void {
    if (this.interval !== null) return // guard against double-start

    this.interval = setInterval(() => {
      // 1. Apply pending inputs via MovementSystem
      for (const [id, player] of this.players) {
        const input = this.pendingInputs.get(id)
        if (input !== undefined) {
          MovementSystem.applyInput(player, input, 1 / TICK_RATE)
        }
      }

      // 2. Broadcast authoritative world state to all sockets in the room
      this.io.to(this.id).emit('world_state', {
        players: [...this.players.values()],
        bullets: [...this.bullets.values()],
        tick: this.tick++,
      })
    }, 1000 / TICK_RATE)
  }

  stopLoop(): void {
    if (this.interval !== null) {
      clearInterval(this.interval)
      this.interval = null
    }
  }

  // ---------------------------------------------------------------------------
  // Utility
  // ---------------------------------------------------------------------------

  isEmpty(): boolean {
    return this.players.size === 0
  }
}
