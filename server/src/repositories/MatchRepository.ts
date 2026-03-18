import { pool } from '../db/postgres'

export async function createMatch(roomId: string): Promise<string> {
  const result = await pool.query<{ id: string }>(
    'INSERT INTO matches (room_id) VALUES ($1) RETURNING id',
    [roomId]
  )
  return result.rows[0].id
}

export async function appendEvent(
  matchId: string,
  tick: number,
  type: string,
  payload: object
): Promise<void> {
  await pool.query(
    'INSERT INTO match_events (match_id, tick, event_type, payload) VALUES ($1, $2, $3, $4)',
    [matchId, tick, type, JSON.stringify(payload)]
  )
}

export async function closeMatch(matchId: string, winnerId: string): Promise<void> {
  await pool.query(
    'UPDATE matches SET ended_at = now(), winner_id = $2 WHERE id = $1',
    [matchId, winnerId]
  )
  await pool.query(
    'UPDATE players SET wins = wins + 1 WHERE id = $1',
    [winnerId]
  )
}
