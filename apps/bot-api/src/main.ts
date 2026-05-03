import { DiscordBot } from '@/bot/discord.bot';
import { WebServer } from '@/web/web.server';
import { config } from '@/config/config';
import logger from '@/config/logger';
import { setupPlayerEventBroadcasting } from '@/web/event-broadcaster';

async function main(): Promise<void> {
  try {
    logger.info('🚀 Starting Discord Music Bot...');

    // Start web server first (so socket server is ready)
    const webServer = new WebServer();
    webServer.start(config.web.port);
    const socketManager = webServer.getSocketManager();

    // Hook up player event broadcasting
    // This will be set up for each guild when needed
    logger.info('Player event broadcasting initialized');

    // Start Discord bot
    const bot = new DiscordBot();
    await bot.start();

    // Graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Shutting down gracefully...');
      await bot.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Shutting down gracefully...');
      await bot.stop();
      process.exit(0);
    });
  } catch (error) {
    logger.error('Fatal error', error);
    process.exit(1);
  }
}

void main();
