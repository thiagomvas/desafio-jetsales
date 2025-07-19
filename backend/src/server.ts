import app from './app';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { notificationWorker } from './workers/notificationWorker';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import redis from './utils/redis';

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;

// Wrap Express app with HTTP server
const httpServer = createServer(app);

// Create Socket.IO server
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// On client connection
io.on('connection', async (socket) => {
  const userId = socket.handshake.query.userId;
  if (!userId) {
    socket.disconnect();
    return;
  }


  // Create a Redis subscriber client dedicated to this socket
  const subscriber = redis.duplicate();

  // Remove await subscriber.connect();
  const channel = `notification:${userId}`; // subscribe to this user’s channel
  logger.info('WebSocket', `User ${userId} connected, subscribing to ${channel}`);

  await subscriber.subscribe(channel, (channelName, message) => {
    logger.info('WebSocket', `Raw message received on ${channelName}: ${message}`);

    try {
      const parsed = JSON.parse(String(message));
      logger.info('WebSocket', `Parsed message: ${JSON.stringify(parsed)}`);
      socket.emit('notification', parsed);
    } catch (err) {
      logger.warn('WebSocket', `Failed to parse message: ${message}`);
    }
  });

  
  

  socket.on('disconnect', () => {
    logger.info('WebSocket', `User ${userId} disconnected, unsubscribing from ${channel}`);
    subscriber.unsubscribe(channel);
    subscriber.quit();
  });
});

httpServer.listen(PORT, '0.0.0.0', () => {
  logger.info('Server', `Server is running on port ${PORT}`);
});


