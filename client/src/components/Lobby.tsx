import React, { useState } from 'react'
import { useGameStore } from '../store/useGameStore'

export function Lobby(): React.ReactElement {
  const [username, setUsername] = useState('')
  const [roomId, setRoomId] = useState('')
  const [error, setError] = useState<string | null>(null)

  const joinRoom = useGameStore((s) => s.joinRoom)
  const remotePlayers = useGameStore((s) => s.remotePlayers)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault()
    if (!username.trim()) {
      setError('Enter a username.')
      return
    }
    if (!roomId.trim()) {
      setError('Enter a room ID.')
      return
    }
    setError(null)
    joinRoom(roomId.trim(), username.trim())
  }

  const playerList = Array.from(remotePlayers.values())

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        fontFamily: "'Courier New', monospace",
        color: '#e2e8f0',
      }}
    >
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12,
          padding: '40px 48px',
          minWidth: 380,
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        }}
      >
        {/* Title */}
        <h1
          style={{
            fontSize: 28,
            fontWeight: 'bold',
            letterSpacing: 3,
            marginBottom: 8,
            textAlign: 'center',
            textTransform: 'uppercase',
            color: '#f97316',
            textShadow: '0 0 20px rgba(249,115,22,0.4)',
          }}
        >
          BlueOrangeJuice
        </h1>
        <p
          style={{
            textAlign: 'center',
            color: '#94a3b8',
            fontSize: 12,
            marginBottom: 32,
            letterSpacing: 1,
          }}
        >
          MULTIPLAYER FPS
        </p>

        {/* Join form */}
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: 16 }}>
            <label
              htmlFor="username"
              style={{ display: 'block', fontSize: 11, color: '#94a3b8', marginBottom: 6, letterSpacing: 1 }}
            >
              USERNAME
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name"
              maxLength={24}
              autoComplete="off"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label
              htmlFor="roomId"
              style={{ display: 'block', fontSize: 11, color: '#94a3b8', marginBottom: 6, letterSpacing: 1 }}
            >
              ROOM ID
            </label>
            <input
              id="roomId"
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="e.g. arena-01"
              maxLength={32}
              autoComplete="off"
              style={inputStyle}
            />
          </div>

          {error && (
            <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px 0',
              background: 'linear-gradient(90deg, #f97316 0%, #ea580c 100%)',
              border: 'none',
              borderRadius: 6,
              color: '#fff',
              fontFamily: 'inherit',
              fontSize: 14,
              fontWeight: 'bold',
              letterSpacing: 2,
              cursor: 'pointer',
              textTransform: 'uppercase',
              boxShadow: '0 4px 12px rgba(249,115,22,0.35)',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={(e) => ((e.target as HTMLButtonElement).style.opacity = '0.85')}
            onMouseLeave={(e) => ((e.target as HTMLButtonElement).style.opacity = '1')}
          >
            Join Room
          </button>
        </form>

        {/* Player list (visible once connected) */}
        {playerList.length > 0 && (
          <div style={{ marginTop: 28 }}>
            <p
              style={{ fontSize: 11, color: '#94a3b8', letterSpacing: 1, marginBottom: 10 }}
            >
              IN ROOM ({playerList.length})
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {playerList.map((p) => (
                <li
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 13,
                    color: '#cbd5e1',
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#22c55e',
                      flexShrink: 0,
                    }}
                  />
                  {p.username}
                  <span style={{ color: '#475569', marginLeft: 'auto', fontSize: 11 }}>
                    {p.kills}K / {p.deaths}D
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 6,
  color: '#e2e8f0',
  fontFamily: "'Courier New', monospace",
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
}
