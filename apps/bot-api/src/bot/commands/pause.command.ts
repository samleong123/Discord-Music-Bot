import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { BaseCommand } from '@/bot/commands/base.command';
import { queueManager } from '@/queue/queue.manager';

export class PauseCommand extends BaseCommand {
  data = new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pause playback');

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const currentTrack = queueManager.getCurrentTrack(interaction.guildId!);

    if (!currentTrack) {
      await interaction.reply({
        content: '❌ Nothing is playing!',
        ephemeral: true,
      });
      return;
    }

    queueManager.pause(interaction.guildId!);
    await interaction.reply({
      content: '⏸️ Paused!',
      ephemeral: true,
    });
  }
}
