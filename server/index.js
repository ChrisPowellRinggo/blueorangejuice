import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { GameServer } from './src/core/GameServer.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
});

app.use(express.static('../client'));

const game = new GameServer(io);
game.init();

const PORT = process.env.PORT ?? 3000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
