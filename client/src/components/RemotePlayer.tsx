import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Billboard } from '@react-three/drei'
import * as THREE from 'three'
import type { PlayerState } from '@shared/types/player'

interface RemotePlayerProps {
  player: PlayerState
}

/** Deterministically hash a player ID string to a hue in [0, 360). */
function idToHue(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  }
  return hash % 360
}

export function RemotePlayer({ player }: RemotePlayerProps): React.ReactElement {
  const groupRef = useRef<THREE.Group>(null)

  const hue = idToHue(player.id)
  const color = `hsl(${hue}, 70%, 55%)`

  useFrame(() => {
    const group = groupRef.current
    if (!group) return

    // Lerp position toward server state each frame
    group.position.lerp(
      new THREE.Vector3(player.pos.x, player.pos.y, player.pos.z),
      0.2,
    )
  })

  return (
    <group ref={groupRef} position={[player.pos.x, player.pos.y, player.pos.z]}>
      {/* Capsule body — upper hemisphere */}
      <mesh castShadow position={[0, 1.4, 0]}>
        <sphereGeometry args={[0.4, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>

      {/* Capsule body — cylinder */}
      <mesh castShadow position={[0, 0.65, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 1.5, 12]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>

      {/* Capsule body — lower hemisphere */}
      <mesh castShadow position={[0, -0.1, 0]}>
        <sphereGeometry args={[0.4, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>

      {/* Floating nametag */}
      <Billboard position={[0, 2.1, 0]}>
        <Text
          fontSize={0.25}
          color="white"
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {player.username}
        </Text>
      </Billboard>
    </group>
  )
}
