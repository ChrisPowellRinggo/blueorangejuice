import React, { useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { useGameStore } from './store/useGameStore'
import { Lobby } from './components/Lobby'
import { HUD } from './components/HUD'
import { World } from './components/World'
import { LocalPlayer } from './components/LocalPlayer'
import { RemotePlayer } from './components/RemotePlayer'
import { BulletLayer } from './components/Bullet'
import { useNetworkSync } from './hooks/useNetworkSync'

/**
 * Root application shell.
 * - Shows Lobby when not in a room (roomId === null).
 * - Shows the 3D Canvas + HUD overlay when in-game.
 */
export default function App(): React.ReactElement {
  const roomId = useGameStore((s) => s.roomId)
  const remotePlayers = useGameStore((s) => s.remotePlayers)

  // Establish socket event subscriptions for the lifetime of the app
  useNetworkSync()

  const requestPointerLock = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    if (document.pointerLockElement !== target) {
      target.requestPointerLock()
    }
  }, [])

  if (roomId === null) {
    return <Lobby />
  }

  return (
    <div
      style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}
      onClick={requestPointerLock}
    >
      <Canvas
        shadows
        camera={{ fov: 75, near: 0.1, far: 200 }}
        style={{ width: '100%', height: '100%' }}
      >
        <Physics gravity={[0, -20, 0]}>
          <World />
          <LocalPlayer />
          {Array.from(remotePlayers.values()).map((player) => (
            <RemotePlayer key={player.id} player={player} />
          ))}
          <BulletLayer />
        </Physics>
      </Canvas>

      {/* HUD sits on top as a fixed overlay */}
      <HUD />
    </div>
  )
}
