import { pool } from '../db/postgres'

export interface PlayerRow {
  id: string
  username: string
  kills: number
  deaths: number
  wins: number
}

export async function upsertPlayer(id: string, username: string): Promise<void> {
  await pool.query(
    'INSERT INTO players (id, username) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [id, username]
  )
}

export async function incrementStats(id: string, kills: number, deaths: number): Promise<void> {
  await pool.query(
    'UPDATE players SET kills = kills + $2, deaths = deaths + $3 WHERE id = $1',
    [id, kills, deaths]
  )
}

export async function getLeaderboard(limit: number): Promise<PlayerRow[]> {
  const result = await pool.query<PlayerRow>(
    'SELECT id, username, kills, deaths, wins FROM players ORDER BY kills DESC LIMIT $1',
    [limit]
  )
  return result.rows
}
