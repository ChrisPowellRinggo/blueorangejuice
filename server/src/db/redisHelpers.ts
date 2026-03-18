import { redis } from './redis'
import type { PlayerState } from '@shared/types/player'

export interface SessionData {
  playerId: string
  roomId: string
  username: string
}

// Room state helpers

export async function savePlayerToRoom(
  roomId: string,
  socketId: string,
  state: PlayerState
): Promise<void> {
  const key = `room:${roomId}:players`
  await redis.hset(key, socketId, JSON.stringify(state))
  await redis.expire(key, 3600)
}

export async function removePlayerFromRoom(
  roomId: string,
  socketId: string
): Promise<void> {
  await redis.hdel(`room:${roomId}:players`, socketId)
}

export async function getRoomPlayers(roomId: string): Promise<PlayerState[]> {
  const raw = await redis.hgetall(`room:${roomId}:players`)
  if (!raw) return []
  return Object.values(raw).map((v) => JSON.parse(v as string) as PlayerState)
}

// Session helpers

export async function saveSession(
  socketId: string,
  data: { playerId: string; roomId: string; username: string }
): Promise<void> {
  await redis.set(`session:${socketId}`, JSON.stringify(data), 'EX', 1800)
}

export async function getSession(socketId: string): Promise<SessionData | null> {
  const raw = await redis.get(`session:${socketId}`)
  if (!raw) return null
  return JSON.parse(raw) as SessionData
}

export async function deleteSession(socketId: string): Promise<void> {
  await redis.del(`session:${socketId}`)
}
