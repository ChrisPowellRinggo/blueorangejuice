import { useEffect, useRef, type RefObject } from 'react'
import socket from '../network/socket'
import { useGameStore } from '../store/useGameStore'
import type { PlayerInput } from '@shared/types/events'
import { INPUT_BUFFER_SIZE, PLAYER_SPEED, TICK_RATE } from '@shared/constants/game'

/**
 * Ring buffer entry for client-side prediction.
 */
interface BufferedInput {
  seq: number
  input: PlayerInput
}

/**
 * Re-simulate a sequence of buffered inputs onto a position to reconcile
 * server-authoritative state with unacknowledged local predictions.
 */
function reSimulate(
  serverPos: { x: number; y: number; z: number },
  pending: BufferedInput[],
): { x: number; y: number; z: number } {
  const dt = 1 / TICK_RATE
  let pos = { ...serverPos }

  for (const { input } of pending) {
    const len = Math.sqrt(input.move.x ** 2 + input.move.z ** 2)
    if (len > 0) {
      const nx = input.move.x / len
      const nz = input.move.z / len
      pos = {
        x: pos.x + nx * PLAYER_SPEED * dt,
        y: pos.y,
        z: pos.z + nz * PLAYER_SPEED * dt,
      }
    }
  }

  return pos
}

/**
 * Subscribes to all server events on mount and feeds them into the Zustand
 * store. Also maintains a ring buffer of the last INPUT_BUFFER_SIZE inputs
 * for client-side prediction reconciliation on world_state.
 *
 * Returns a ref to a function the game loop can call to register each sent
 * input into the prediction buffer.
 */
export function useNetworkSync(): RefObject<(input: PlayerInput) => void> {
  const inputBuffer = useRef<BufferedInput[]>([])

  // Stable ref — the game loop calls this to push inputs into the ring buffer
  const pushInput = useRef<(input: PlayerInput) => void>((input: PlayerInput) => {
    const buffer = inputBuffer.current
    buffer.push({ seq: input.seq, input })
    if (buffer.length > INPUT_BUFFER_SIZE) {
      buffer.shift()
    }
  })

  useEffect(() => {
    function getState() {
      return useGameStore.getState()
    }

    const {
      applyWorldState,
      registerHit,
      registerDeath,
      addRemotePlayer,
      removeRemotePlayer,
      setLocalPlayer,
    } = getState()

    socket.on('room_joined', (d) => {
      const state = getState()
      if (!state.localPlayer) return

      for (const p of d.players) {
        if (p.id !== state.localPlayer.id) {
          addRemotePlayer(p.id)
          useGameStore.setState((s) => {
            const next = new Map(s.remotePlayers)
            next.set(p.id, p)
            return { remotePlayers: next }
          })
        }
      }
    })

    socket.on('world_state', (d) => {
      const state = getState()
      applyWorldState(d)

      // Client-side prediction reconciliation
      if (state.localPlayer) {
        const localId = state.localPlayer.id
        const serverSnapshot = d.players.find((p) => p.id === localId)
        if (serverSnapshot) {
          // Use the local seq as the last-acked watermark (server echoes it in
          // a real implementation; here we use the latest buffered seq as a
          // conservative fallback so we never discard future inputs).
          const lastAckedSeq = state.localPlayer.seq
          const pending = inputBuffer.current.filter((b) => b.seq > lastAckedSeq)
          inputBuffer.current = pending.slice(-INPUT_BUFFER_SIZE)

          const reconciledPos = reSimulate(serverSnapshot.pos, pending)
          setLocalPlayer({
            ...state.localPlayer,
            ...serverSnapshot,
            seq: state.localPlayer.seq,
            pos: reconciledPos,
          })
        }
      }
    })

    socket.on('player_hit', (d) => {
      registerHit(d.targetId, d.damage, d.shooterId)
    })

    socket.on('player_died', (d) => {
      registerDeath(d.id, d.killerId)
    })

    socket.on('player_joined', (d) => {
      addRemotePlayer(d.id)
    })

    socket.on('player_left', (d) => {
      removeRemotePlayer(d.id)
    })

    return () => {
      socket.off('room_joined')
      socket.off('world_state')
      socket.off('player_hit')
      socket.off('player_died')
      socket.off('player_joined')
      socket.off('player_left')
    }
  }, [])

  return pushInput
}
