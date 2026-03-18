import { create } from 'zustand'
import socket from '../network/socket'
import type { PlayerState, BulletState, LocalPlayerState } from '@shared/types/player'
import type { PlayerInput } from '@shared/types/events'
import { PLAYER_START_HEALTH } from '@shared/constants/game'

export interface KillEvent {
  id: string
  killerId: string
  killerName: string
  victimName: string
  timestamp: number
}

export interface WorldStatePayload {
  players: PlayerState[]
  bullets: BulletState[]
  tick: number
}

interface GameStore {
  roomId: string | null
  localPlayer: LocalPlayerState | null
  remotePlayers: Map<string, PlayerState>
  bullets: Map<string, BulletState>
  killfeed: KillEvent[]
  ammo: number

  joinRoom: (roomId: string, username: string) => void
  sendInput: (input: PlayerInput) => void
  applyWorldState: (d: WorldStatePayload) => void
  registerHit: (targetId: string, damage: number, shooterId: string) => void
  registerDeath: (id: string, killerId: string) => void
  addBullet: (bullet: BulletState) => void
  removeBullet: (id: string) => void
  setLocalPlayer: (player: LocalPlayerState) => void
  addRemotePlayer: (id: string) => void
  removeRemotePlayer: (id: string) => void
}

export const useGameStore = create<GameStore>((set) => ({
  roomId: null,
  localPlayer: null,
  remotePlayers: new Map(),
  bullets: new Map(),
  killfeed: [],
  ammo: 30,

  joinRoom: (roomId: string, username: string) => {
    socket.emit('join_room', { roomId, username })
    set({
      roomId,
      localPlayer: {
        id: socket.id ?? '',
        username,
        pos: { x: 0, y: 0, z: 0 },
        rot: { yaw: 0, pitch: 0 },
        health: PLAYER_START_HEALTH,
        anim: 'idle',
        kills: 0,
        deaths: 0,
        seq: 0,
      },
    })
  },

  sendInput: (input: PlayerInput) => {
    socket.emit('player_input', input)
    set((state) => ({
      localPlayer: state.localPlayer
        ? { ...state.localPlayer, seq: input.seq }
        : null,
    }))
  },

  applyWorldState: (d: WorldStatePayload) => {
    set((state) => {
      const localId = state.localPlayer?.id

      const newRemote = new Map<string, PlayerState>()
      for (const p of d.players) {
        if (p.id !== localId) {
          newRemote.set(p.id, p)
        }
      }

      const newBullets = new Map<string, BulletState>()
      for (const b of d.bullets) {
        newBullets.set(b.id, b)
      }

      return { remotePlayers: newRemote, bullets: newBullets }
    })
  },

  registerHit: (targetId: string, damage: number, _shooterId: string) => {
    set((state) => {
      if (targetId !== state.localPlayer?.id) return {}

      const newHealth = Math.max(0, (state.localPlayer?.health ?? 0) - damage)
      return {
        localPlayer: state.localPlayer
          ? { ...state.localPlayer, health: newHealth }
          : null,
      }
    })
  },

  registerDeath: (id: string, killerId: string) => {
    set((state) => {
      const killerName =
        state.remotePlayers.get(killerId)?.username ??
        (killerId === state.localPlayer?.id ? state.localPlayer.username : killerId)
      const victimName =
        state.remotePlayers.get(id)?.username ??
        (id === state.localPlayer?.id ? (state.localPlayer?.username ?? id) : id)

      const entry: KillEvent = {
        id: `${killerId}-${id}-${Date.now()}`,
        killerId,
        killerName,
        victimName,
        timestamp: Date.now(),
      }

      const updated: Partial<GameStore> = {
        killfeed: [...state.killfeed.slice(-4), entry],
      }

      if (id === state.localPlayer?.id) {
        updated.localPlayer = state.localPlayer
          ? { ...state.localPlayer, health: 0, anim: 'dead', deaths: state.localPlayer.deaths + 1 }
          : null
      }

      return updated
    })
  },

  addBullet: (bullet: BulletState) => {
    set((state) => {
      const next = new Map(state.bullets)
      next.set(bullet.id, bullet)
      return { bullets: next }
    })
  },

  removeBullet: (id: string) => {
    set((state) => {
      const next = new Map(state.bullets)
      next.delete(id)
      return { bullets: next }
    })
  },

  setLocalPlayer: (player: LocalPlayerState) => {
    set({ localPlayer: player })
  },

  addRemotePlayer: (id: string) => {
    set((state) => {
      if (state.remotePlayers.has(id)) return {}
      const next = new Map(state.remotePlayers)
      next.set(id, {
        id,
        username: id,
        pos: { x: 0, y: 0, z: 0 },
        rot: { yaw: 0, pitch: 0 },
        health: PLAYER_START_HEALTH,
        anim: 'idle',
        kills: 0,
        deaths: 0,
      })
      return { remotePlayers: next }
    })
  },

  removeRemotePlayer: (id: string) => {
    set((state) => {
      const next = new Map(state.remotePlayers)
      next.delete(id)
      return { remotePlayers: next }
    })
  },
}))

export default useGameStore
