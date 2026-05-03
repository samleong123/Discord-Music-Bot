import { MusicPlayer, QueueTrack } from '@/audio/player.service';
import { redisService } from '@/config/redis';
import logger from '@/config/logger';

export class QueueManager {
  private players: Map<string, MusicPlayer> = new Map();

  getPlayer(guildId: string): MusicPlayer {
    if (!this.players.has(guildId)) {
      this.players.set(guildId, new MusicPlayer(guildId));
    }
    return this.players.get(guildId)!;
  }

  async addTrack(guildId: string, track: QueueTrack): Promise<void> {
    const player = this.getPlayer(guildId);
    await player.addTrackToQueue(track);
    const queue = player.getState().queue;
    await redisService.setQueueForGuild(guildId, queue);
  }

  async addTracks(guildId: string, tracks: QueueTrack[]): Promise<void> {
    const player = this.getPlayer(guildId);
    await player.addTracksToQueue(tracks);
    const queue = player.getState().queue;
    await redisService.setQueueForGuild(guildId, queue);
  }

  async play(guildId: string): Promise<void> {
    const player = this.getPlayer(guildId);
    const state = player.getState();
    if (!state.currentTrack && state.queue.length > 0) {
      await player.playNext();
      await redisService.setPlayerState(guildId, 'playing');
    }
  }

  async pause(guildId: string): Promise<void> {
    const player = this.getPlayer(guildId);
    player.pause();
    await redisService.setPlayerState(guildId, 'paused');
  }

  async resume(guildId: string): Promise<void> {
    const player = this.getPlayer(guildId);
    player.resume();
    await redisService.setPlayerState(guildId, 'playing');
  }

  async skip(guildId: string): Promise<void> {
    const player = this.getPlayer(guildId);
    await player.playNext();
    await redisService.setPlayerState(guildId, 'playing');
  }

  async stop(guildId: string): Promise<void> {
    const player = this.getPlayer(guildId);
    player.stop();
    player.clearQueue();
    await redisService.setPlayerState(guildId, 'stopped');
    await redisService.setQueueForGuild(guildId, []);
  }

  getQueue(guildId: string): QueueTrack[] {
    return this.getPlayer(guildId).getState().queue;
  }

  getCurrentTrack(guildId: string): QueueTrack | null {
    return this.getPlayer(guildId).getState().currentTrack;
  }

  removeTrack(guildId: string, index: number): QueueTrack | null {
    const player = this.getPlayer(guildId);
    const removed = player.removeFromQueue(index);
    if (removed) {
      const queue = player.getState().queue;
      void redisService.setQueueForGuild(guildId, queue);
    }
    return removed;
  }

  moveTrack(guildId: string, fromIndex: number, toIndex: number): boolean {
    const player = this.getPlayer(guildId);
    const success = player.moveInQueue(fromIndex, toIndex);
    if (success) {
      const queue = player.getState().queue;
      void redisService.setQueueForGuild(guildId, queue);
    }
    return success;
  }

  clearQueue(guildId: string): void {
    const player = this.getPlayer(guildId);
    player.clearQueue();
    void redisService.setQueueForGuild(guildId, []);
  }

  setVolume(guildId: string, volume: number): void {
    const player = this.getPlayer(guildId);
    player.setVolume(volume);
  }

  shuffle(guildId: string): void {
    const player = this.getPlayer(guildId);
    player.shuffle();
  }

  async seek(guildId: string, seconds: number): Promise<void> {
    const player = this.getPlayer(guildId);
    await player.seek(seconds);
  }

  setRepeatMode(guildId: string, mode: 'off' | 'track' | 'queue'): void {
    const player = this.getPlayer(guildId);
    player.setRepeatMode(mode);
    void redisService.setRepeatMode(guildId, mode);
  }

  getRepeatMode(guildId: string): string {
    return this.getPlayer(guildId).getState().repeatMode;
  }

  removePlayer(guildId: string): void {
    const player = this.players.get(guildId);
    if (player) {
      void player.disconnect();
      this.players.delete(guildId);
      void redisService.clearGuildState(guildId);
    }
  }

  onPlayerEvent(guildId: string, event: string, handler: (...args: any[]) => void): void {
    const player = this.getPlayer(guildId);
    player.on(event, handler);
  }
}

export const queueManager = new QueueManager();
