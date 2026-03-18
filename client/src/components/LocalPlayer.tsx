import React, { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls } from '@react-three/drei'
import { RigidBody, CapsuleCollider } from '@react-three/rapier'
import type { RapierRigidBody } from '@react-three/rapier'
import * as THREE from 'three'
import { useInput } from '../hooks/useInput'
import { useGameStore } from '../store/useGameStore'
import { PLAYER_SPEED } from '@shared/constants/game'

const _direction = new THREE.Vector3()
const _velocity = new THREE.Vector3()
const _euler = new THREE.Euler(0, 0, 0, 'YXZ')
const _bulletDir = new THREE.Vector3()

let seqCounter = 0

export function LocalPlayer(): React.ReactElement {
  const rigidBodyRef = useRef<RapierRigidBody>(null)
  const prevShootingRef = useRef(false)
  const inputRef = useInput()
  const sendInput = useGameStore((s) => s.sendInput)
  const addBullet = useGameStore((s) => s.addBullet)
  const localPlayer = useGameStore((s) => s.localPlayer)
  const { camera } = useThree()

  useFrame(() => {
    const rb = rigidBodyRef.current
    if (!rb) return

    const input = inputRef.current
    if (!input) return

    // Derive movement direction from camera yaw + WASD input
    _euler.setFromQuaternion(camera.quaternion, 'YXZ')
    const yaw = _euler.y
    const pitch = _euler.x

    _direction.set(input.move.x, 0, -input.move.z)
    _direction.applyEuler(new THREE.Euler(0, yaw, 0))
    _direction.normalize()

    const currentLinvel = rb.linvel()
    const hasMove = input.move.x !== 0 || input.move.z !== 0

    _velocity.set(
      hasMove ? _direction.x * PLAYER_SPEED : 0,
      currentLinvel.y, // preserve gravity
      hasMove ? _direction.z * PLAYER_SPEED : 0,
    )

    rb.setLinvel({ x: _velocity.x, y: _velocity.y, z: _velocity.z }, true)

    // Sync camera to rigid body position
    const pos = rb.translation()
    camera.position.set(pos.x, pos.y + 0.35, pos.z)

    // Spawn bullet on rising edge of shoot
    if (input.shooting && !prevShootingRef.current) {
      _bulletDir.set(0, 0, -1).applyQuaternion(camera.quaternion).normalize()
      addBullet({
        id: crypto.randomUUID(),
        ownerId: localPlayer?.id ?? '',
        createdAt: Date.now(),
        pos: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
        dir: { x: _bulletDir.x, y: _bulletDir.y, z: _bulletDir.z },
      })
    }
    prevShootingRef.current = input.shooting

    // Send input to server each frame
    seqCounter += 1
    sendInput({
      move: input.move,
      yaw,
      pitch,
      shooting: input.shooting,
      seq: seqCounter,
    })
  })

  return (
    <>
      <PointerLockControls />
      <RigidBody
        ref={rigidBodyRef}
        colliders={false}
        mass={1}
        lockRotations
        position={[0, 2, 0]}
        linearDamping={10}
        enabledRotations={[false, false, false]}
      >
        <CapsuleCollider args={[0.75, 0.4]} />
      </RigidBody>

      {/* Weapon mesh — rendered in camera-local space */}
      <WeaponMesh />
    </>
  )
}

/** Simple box weapon model that follows the camera. */
function WeaponMesh(): React.ReactElement {
  const meshRef = useRef<THREE.Mesh>(null)
  const { camera } = useThree()

  useFrame(() => {
    const mesh = meshRef.current
    if (!mesh) return

    // Position weapon relative to camera: bottom-right, slightly in front
    const offset = new THREE.Vector3(0.25, -0.22, -0.45)
    offset.applyQuaternion(camera.quaternion)
    mesh.position.copy(camera.position).add(offset)
    mesh.quaternion.copy(camera.quaternion)
  })

  return (
    <mesh ref={meshRef} castShadow>
      <boxGeometry args={[0.06, 0.06, 0.35]} />
      <meshStandardMaterial color="#333344" roughness={0.3} metalness={0.8} />
    </mesh>
  )
}
