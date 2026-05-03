import dotenv from 'dotenv';

dotenv.config();

export const config = {
  discord: {
    token: process.env.DISCORD_TOKEN || '',
    clientId: process.env.DISCORD_CLIENT_ID || '',
    devGuildId: process.env.DISCORD_GUILD_ID_DEV,
  },
  database: {
    url: process.env.DATABASE_URL || '',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  web: {
    port: parseInt(process.env.PORT || '3000', 10),
    baseUrl: process.env.DASHBOARD_BASE_URL || 'http://localhost:3000',
    sessionSecret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  },
  bot: {
    ownerIds: (process.env.OWNER_DISCORD_IDS || '').split(',').filter(Boolean),
    defaultVolume: parseFloat(process.env.DEFAULT_VOLUME || '0.5'),
    maxPlaylistItems: parseInt(process.env.MAX_PLAYLIST_ITEMS || '100', 10),
    idleDisconnectSeconds: parseInt(process.env.IDLE_DISCONNECT_SECONDS || '300', 10),
  },
  env: process.env.NODE_ENV || 'development',
};

export function validateConfig(): void {
  const required = ['DISCORD_TOKEN', 'DISCORD_CLIENT_ID'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
