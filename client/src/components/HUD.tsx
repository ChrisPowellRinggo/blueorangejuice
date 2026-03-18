import React, { useEffect, useState } from 'react'
import { useGameStore, type KillEvent } from '../store/useGameStore'
import { KILLFEED_DISPLAY_MS } from '@shared/constants/game'

interface VisibleKillEvent extends KillEvent {
  visible: boolean
}

export function HUD(): React.ReactElement | null {
  const localPlayer = useGameStore((s) => s.localPlayer)
  const killfeed = useGameStore((s) => s.killfeed)
  const ammo = useGameStore((s) => s.ammo)
  const [visibleKills, setVisibleKills] = useState<VisibleKillEvent[]>([])

  // Sync killfeed from store, scheduling fade-out
  useEffect(() => {
    setVisibleKills((prev) => {
      const existingIds = new Set(prev.map((k) => k.id))
      const newEntries = killfeed
        .filter((k) => !existingIds.has(k.id))
        .map((k): VisibleKillEvent => ({ ...k, visible: true }))
      return [...prev, ...newEntries].slice(-5)
    })
  }, [killfeed])

  // Fade out individual entries after KILLFEED_DISPLAY_MS
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []

    visibleKills.forEach((entry) => {
      if (entry.visible) {
        const age = Date.now() - entry.timestamp
        const remaining = Math.max(0, KILLFEED_DISPLAY_MS - age)
        const t = setTimeout(() => {
          setVisibleKills((prev) =>
            prev.map((k) => (k.id === entry.id ? { ...k, visible: false } : k)),
          )
        }, remaining)
        timers.push(t)
      }
    })

    return () => timers.forEach(clearTimeout)
  }, [visibleKills])

  if (!localPlayer) return null

  const healthPct = Math.max(0, Math.min(100, localPlayer.health))
  const isDead = localPlayer.health <= 0

  // Health bar colour: green → yellow → red
  const hue = Math.round((healthPct / 100) * 120) // 120 = green, 0 = red
  const healthColor = `hsl(${hue}, 90%, 45%)`

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        fontFamily: "'Courier New', monospace",
        color: '#fff',
        userSelect: 'none',
      }}
    >
      {/* Death overlay */}
      {isDead && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(180, 0, 0, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 48,
            fontWeight: 'bold',
            letterSpacing: 4,
            textShadow: '0 2px 8px #000',
          }}
        >
          YOU DIED
        </div>
      )}

      {/* Crosshair */}
      {!isDead && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 20,
            height: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-hidden="true"
        >
          {/* Horizontal bar */}
          <div
            style={{
              position: 'absolute',
              width: 20,
              height: 2,
              background: 'rgba(255,255,255,0.85)',
              boxShadow: '0 0 2px #000',
            }}
          />
          {/* Vertical bar */}
          <div
            style={{
              position: 'absolute',
              width: 2,
              height: 20,
              background: 'rgba(255,255,255,0.85)',
              boxShadow: '0 0 2px #000',
            }}
          />
        </div>
      )}

      {/* Kill feed — top-right */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 4,
          maxWidth: 320,
        }}
      >
        {visibleKills
          .filter((k) => k.visible)
          .slice(-5)
          .map((k) => (
            <div
              key={k.id}
              style={{
                background: 'rgba(0,0,0,0.55)',
                padding: '3px 8px',
                borderRadius: 4,
                fontSize: 13,
                whiteSpace: 'nowrap',
                textShadow: '0 1px 2px #000',
              }}
            >
              <span style={{ color: '#f97316' }}>{k.killerName}</span>
              <span style={{ color: '#aaa', margin: '0 4px' }}>killed</span>
              <span style={{ color: '#60a5fa' }}>{k.victimName}</span>
            </div>
          ))}
      </div>

      {/* Health bar — bottom, full width */}
      <div
        style={{
          position: 'absolute',
          bottom: 32,
          left: 16,
          right: 120,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <div
          style={{ fontSize: 13, color: '#ddd', marginBottom: 2, textShadow: '0 1px 2px #000' }}
        >
          HP {Math.ceil(healthPct)}
        </div>
        <div
          style={{
            width: '100%',
            height: 10,
            background: 'rgba(0,0,0,0.5)',
            borderRadius: 5,
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          <div
            style={{
              width: `${healthPct}%`,
              height: '100%',
              background: healthColor,
              transition: 'width 0.15s ease, background 0.3s ease',
              borderRadius: 5,
            }}
          />
        </div>
      </div>

      {/* Ammo counter — bottom-right */}
      <div
        style={{
          position: 'absolute',
          bottom: 32,
          right: 16,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 2,
        }}
      >
        <div style={{ fontSize: 11, color: '#aaa', textShadow: '0 1px 2px #000' }}>AMMO</div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 'bold',
            lineHeight: 1,
            textShadow: '0 2px 4px #000',
            color: ammo <= 5 ? '#ef4444' : '#fff',
          }}
        >
          {ammo}
        </div>
      </div>
    </div>
  )
}
