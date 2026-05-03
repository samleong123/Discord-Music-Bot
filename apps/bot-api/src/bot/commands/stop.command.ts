import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { BaseCommand } from '@/bot/commands/base.command';
import { queueManager } from '@/queue/queue.manager';

export class StopCommand extends BaseCommand {
  data = new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop playback and clear the queue');

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    queueManager.stop(interaction.guildId!);

    await interaction.reply({
      content: '⏹️ Stopped playback and cleared the queue!',
      ephemeral: true,
    });
  }
}
