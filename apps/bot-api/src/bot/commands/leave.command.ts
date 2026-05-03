import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { getVoiceConnection } from '@discordjs/voice';
import { BaseCommand } from '@/bot/commands/base.command';
import { queueManager } from '@/queue/queue.manager';
import logger from '@/config/logger';

export class LeaveCommand extends BaseCommand {
  data = new SlashCommandBuilder()
    .setName('leave')
    .setDescription('Make the bot leave the voice channel');

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const connection = getVoiceConnection(interaction.guildId!);

    if (!connection) {
      await interaction.reply({
        content: '❌ Bot is not in any voice channel!',
        ephemeral: true,
      });
      return;
    }

    try {
      connection.destroy();
      queueManager.removePlayer(interaction.guildId!);
      logger.info(`Bot left voice channel in guild ${interaction.guildId}`);

      await interaction.reply({
        content: '👋 Disconnected!',
        ephemeral: true,
      });
    } catch (error) {
      logger.error('Failed to leave voice channel', error);
      await interaction.reply({
        content: '❌ Failed to disconnect!',
        ephemeral: true,
      });
    }
  }
}
