import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server } from 'http';
import logger from '@/config/logger';
import { queueManager } from '@/queue/queue.manager';

export class SocketManager {
  private io: SocketIOServer;
  private guildSockets: Map<string, Set<string>> = new Map();

  constructor(httpServer: Server) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    this.setupConnectionHandlers();
  }

  private setupConnectionHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      logger.debug(`Socket connected: ${socket.id}`);

      // Guild subscription
      socket.on('subscribe', (guildId: string) => {
        if (!this.guildSockets.has(guildId)) {
          this.guildSockets.set(guildId, new Set());
        }
        this.guildSockets.get(guildId)!.add(socket.id);
        socket.join(`guild:${guildId}`);
        logger.debug(`Socket ${socket.id} subscribed to guild ${guildId}`);

        // Send current state
        const player = queueManager.getPlayer(guildId);
        const state = player.getState();
        socket.emit('playerStateUpdate', state);
      });

      // Guild unsubscribe
      socket.on('unsubscribe', (guildId: string) => {
        if (this.guildSockets.has(guildId)) {
          this.guildSockets.get(guildId)!.delete(socket.id);
        }
        socket.leave(`guild:${guildId}`);
        logger.debug(`Socket ${socket.id} unsubscribed from guild ${guildId}`);
      });

      socket.on('disconnect', () => {
        logger.debug(`Socket disconnected: ${socket.id}`);
        this.guildSockets.forEach((sockets) => {
          sockets.delete(socket.id);
        });
      });
    });
  }

  broadcastToGuild(guildId: string, event: string, data: any): void {
    this.io.to(`guild:${guildId}`).emit(event, data);
  }

  emitPlayerUpdate(guildId: string): void {
    const player = queueManager.getPlayer(guildId);
    const state = player.getState();
    this.broadcastToGuild(guildId, 'playerStateUpdate', state);
  }

  emitQueueUpdate(guildId: string): void {
    const queue = queueManager.getQueue(guildId);
    const currentTrack = queueManager.getCurrentTrack(guildId);
    this.broadcastToGuild(guildId, 'queueUpdate', { queue, currentTrack });
  }

  emitTrackStart(guildId: string, track: any): void {
    this.broadcastToGuild(guildId, 'trackStart', track);
  }

  emitTrackEnd(guildId: string, track: any): void {
    this.broadcastToGuild(guildId, 'trackEnd', track);
  }

  getIO(): SocketIOServer {
    return this.io;
  }
}
