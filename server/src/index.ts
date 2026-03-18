import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { GameServer } from './core/GameServer'
import { getLeaderboard } from './repositories/PlayerRepository'
import type { ServerToClientEvents, ClientToServerEvents } from '@shared/types/events'

const app = express()
const httpServer = createServer(app)
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: '*' },
})

app.use(express.static('../../client/dist'))

app.get('/leaderboard', async (_req, res) => {
  try {
    const rows = await getLeaderboard(20)
    res.json(rows)
  } catch {
    res.status(500).json({ error: 'Database unavailable' })
  }
})

const game = new GameServer(io)
game.init()

const PORT = Number(process.env.PORT ?? 3000)
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`))
