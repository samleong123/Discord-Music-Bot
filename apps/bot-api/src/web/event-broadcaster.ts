import { queueManager } from '@/queue/queue.manager';
import { SocketManager } from '@/web/sockets/socket.manager';
import logger from '@/config/logger';

export function setupPlayerEventBroadcasting(socketManager: SocketManager, guildId: string): void {
  const player = queueManager.getPlayer(guildId);

  player.on('trackStart', (track) => {
    logger.debug(`Broadcasting trackStart event for guild ${guildId}`);
    socketManager.emitTrackStart(guildId, track);
    socketManager.emitPlayerUpdate(guildId);
  });

  player.on('trackEnd', (track) => {
    logger.debug(`Broadcasting trackEnd event for guild ${guildId}`);
    socketManager.emitTrackEnd(guildId, track);
    socketManager.emitPlayerUpdate(guildId);
  });

  player.on('playing', (track) => {
    socketManager.emitPlayerUpdate(guildId);
  });

  player.on('paused', () => {
    socketManager.emitPlayerUpdate(guildId);
  });

  player.on('resumed', () => {
    socketManager.emitPlayerUpdate(guildId);
  });

  player.on('stopped', () => {
    socketManager.emitPlayerUpdate(guildId);
  });

  player.on('queueUpdate', (queue) => {
    socketManager.emitQueueUpdate(guildId);
  });

  player.on('repeatModeChanged', () => {
    socketManager.emitPlayerUpdate(guildId);
  });

  player.on('voiceChannelChanged', (channel) => {
    socketManager.emitPlayerUpdate(guildId);
    socketManager.broadcastToGuild(guildId, 'voiceChannelUpdate', channel);
  });

  player.on('error', (error) => {
    logger.error(`Player error in guild ${guildId}`, error);
    socketManager.broadcastToGuild(guildId, 'playerError', {
      message: error.message,
    });
  });
}
