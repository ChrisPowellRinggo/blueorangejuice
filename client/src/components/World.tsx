import React from 'react'
import { Environment } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'

interface WallConfig {
  position: [number, number, number]
  size: [number, number, number]
}

const COVER_WALLS: WallConfig[] = [
  { position: [5, 1, 0],    size: [0.5, 2, 4] },
  { position: [-5, 1, 0],   size: [0.5, 2, 4] },
  { position: [0, 1, 6],    size: [4, 2, 0.5] },
  { position: [0, 1, -6],   size: [4, 2, 0.5] },
  { position: [9, 1, 9],    size: [0.5, 2, 3] },
  { position: [-9, 1, -9],  size: [0.5, 2, 3] },
  { position: [9, 1, -9],   size: [3, 2, 0.5] },
  { position: [-9, 1, 9],   size: [3, 2, 0.5] },
]

export function World(): React.ReactElement {
  return (
    <>
      {/* Scene atmosphere */}
      <fog attach="fog" args={['#0a0a0a', 30, 100]} />
      <ambientLight intensity={0.7} />
      <hemisphereLight args={['#334466', '#111122', 0.6]} />
      <pointLight position={[0, 8, 0]} intensity={2} castShadow color="#ffffff" />
      <directionalLight
        castShadow
        position={[10, 20, 10]}
        intensity={1.2}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={100}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
      <Environment preset="night" />

      {/* Floor */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh receiveShadow position={[0, -0.5, 0]}>
          <boxGeometry args={[80, 1, 80]} />
          <meshStandardMaterial color="#1a1a2e" roughness={0.9} metalness={0.1} />
        </mesh>
      </RigidBody>

      {/* Cover walls */}
      {COVER_WALLS.map((wall, i) => (
        <RigidBody key={i} type="fixed" colliders="cuboid">
          <mesh castShadow receiveShadow position={wall.position}>
            <boxGeometry args={wall.size} />
            <meshStandardMaterial color="#16213e" roughness={0.8} metalness={0.2} />
          </mesh>
        </RigidBody>
      ))}
    </>
  )
}
