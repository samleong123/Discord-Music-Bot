import { Redis } from 'ioredis';
import { config } from '@/config/config';
import logger from '@/config/logger';

export class RedisService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(config.redis.url);
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.redis.on('connect', () => {
      logger.info('Connected to Redis');
    });

    this.redis.on('error', (err) => {
      logger.error('Redis error:', err);
    });
  }

  async getQueueForGuild(guildId: string): Promise<any[]> {
    const data = await this.redis.get(`guild:${guildId}:queue`);
    return data ? JSON.parse(data) : [];
  }

  async setQueueForGuild(guildId: string, queue: any[]): Promise<void> {
    await this.redis.set(`guild:${guildId}:queue`, JSON.stringify(queue));
  }

  async getNowPlaying(guildId: string): Promise<any | null> {
    const data = await this.redis.get(`guild:${guildId}:now_playing`);
    return data ? JSON.parse(data) : null;
  }

  async setNowPlaying(guildId: string, track: any): Promise<void> {
    await this.redis.set(`guild:${guildId}:now_playing`, JSON.stringify(track));
  }

  async getPlayerState(guildId: string): Promise<string> {
    return (await this.redis.get(`guild:${guildId}:player_state`)) || 'stopped';
  }

  async setPlayerState(guildId: string, state: string): Promise<void> {
    await this.redis.set(`guild:${guildId}:player_state`, state);
  }

  async getRepeatMode(guildId: string): Promise<string> {
    return (await this.redis.get(`guild:${guildId}:repeat_mode`)) || 'off';
  }

  async setRepeatMode(guildId: string, mode: string): Promise<void> {
    await this.redis.set(`guild:${guildId}:repeat_mode`, mode);
  }

  async getPosition(guildId: string): Promise<number> {
    const pos = await this.redis.get(`guild:${guildId}:position`);
    return pos ? parseInt(pos, 10) : 0;
  }

  async setPosition(guildId: string, position: number): Promise<void> {
    await this.redis.set(`guild:${guildId}:position`, String(position));
  }

  async getHistory(guildId: string): Promise<any[]> {
    const data = await this.redis.get(`guild:${guildId}:history`);
    return data ? JSON.parse(data) : [];
  }

  async addToHistory(guildId: string, track: any): Promise<void> {
    const history = await this.getHistory(guildId);
    history.push({ ...track, playedAt: new Date().toISOString() });
    // Keep last 100 tracks
    if (history.length > 100) history.shift();
    await this.redis.set(`guild:${guildId}:history`, JSON.stringify(history));
  }

  async acquireLock(guildId: string, timeout: number = 5000): Promise<boolean> {
    const lock = `guild:${guildId}:lock`;
    const result = await this.redis.set(lock, '1', 'PX', timeout, 'NX');
    return result === 'OK';
  }

  async releaseLock(guildId: string): Promise<void> {
    await this.redis.del(`guild:${guildId}:lock`);
  }

  async clearGuildState(guildId: string): Promise<void> {
    const keys = [
      `guild:${guildId}:queue`,
      `guild:${guildId}:now_playing`,
      `guild:${guildId}:player_state`,
      `guild:${guildId}:repeat_mode`,
      `guild:${guildId}:position`,
      `guild:${guildId}:history`,
    ];
    await this.redis.del(...keys);
  }

  async close(): Promise<void> {
    await this.redis.quit();
  }
}

export const redisService = new RedisService();
