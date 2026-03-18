import React, { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Trail } from '@react-three/drei'
import * as THREE from 'three'
import type { BulletState } from '@shared/types/player'
import { useGameStore } from '../store/useGameStore'

interface BulletProps {
  bullet: BulletState
}

const BULLET_SPEED = 40 // units per second

export function Bullet({ bullet }: BulletProps): React.ReactElement {
  const meshRef = useRef<THREE.Mesh>(null)
  const matRef = useRef<THREE.MeshStandardMaterial>(null)
  const removeBullet = useGameStore((s) => s.removeBullet)
  const birthTime = useRef(bullet.createdAt)

  // Auto-remove after 2 seconds
  useEffect(() => {
    const elapsed = Date.now() - bullet.createdAt
    const remaining = Math.max(0, 2000 - elapsed)
    const timer = setTimeout(() => {
      removeBullet(bullet.id)
    }, remaining)
    return () => clearTimeout(timer)
  }, [bullet.id, bullet.createdAt, removeBullet])

  useFrame((_state, delta) => {
    const mesh = meshRef.current
    if (!mesh) return

    // Move bullet forward
    mesh.position.x += bullet.dir.x * BULLET_SPEED * delta
    mesh.position.y += bullet.dir.y * BULLET_SPEED * delta
    mesh.position.z += bullet.dir.z * BULLET_SPEED * delta

    // Pulse emissive intensity using sine wave
    const age = (Date.now() - birthTime.current) / 1000
    if (matRef.current) {
      matRef.current.emissiveIntensity = 2 + Math.sin(age * 30) * 1.5
    }

    // Spin the bullet on its travel axis for a drill effect
    mesh.rotation.z += delta * 20
  })

  return (
    <Trail
      width={0.15}
      length={12}
      color={new THREE.Color(1, 0.5, 0)}
      attenuation={(t) => t * t * t}
    >
      <mesh
        ref={meshRef}
        position={[bullet.pos.x, bullet.pos.y, bullet.pos.z]}
        castShadow
      >
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial
          ref={matRef}
          color="#ff6600"
          emissive="#ff4400"
          emissiveIntensity={2}
          toneMapped={false}
        />
      </mesh>
    </Trail>
  )
}

/** Renders all active bullets from the store. */
export function BulletLayer(): React.ReactElement {
  const bullets = useGameStore((s) => s.bullets)

  return (
    <>
      {Array.from(bullets.values()).map((b) => (
        <Bullet key={b.id} bullet={b} />
      ))}
    </>
  )
}
