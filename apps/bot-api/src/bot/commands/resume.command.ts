import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { BaseCommand } from '@/bot/commands/base.command';
import { queueManager } from '@/queue/queue.manager';

export class ResumeCommand extends BaseCommand {
  data = new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Resume playback');

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const currentTrack = queueManager.getCurrentTrack(interaction.guildId!);

    if (!currentTrack) {
      await interaction.reply({
        content: '❌ Nothing is paused!',
        ephemeral: true,
      });
      return;
    }

    queueManager.resume(interaction.guildId!);
    await interaction.reply({
      content: '▶️ Resumed!',
      ephemeral: true,
    });
  }
}
