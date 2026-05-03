import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { BaseCommand } from '@/bot/commands/base.command';
import { queueManager } from '@/queue/queue.manager';

export class SkipCommand extends BaseCommand {
  data = new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the current track');

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const queue = queueManager.getQueue(interaction.guildId!);

    if (queue.length === 0) {
      await interaction.reply({
        content: '❌ Queue is empty!',
        ephemeral: true,
      });
      return;
    }

    const skipped = queueManager.getCurrentTrack(interaction.guildId!);
    await queueManager.skip(interaction.guildId!);

    await interaction.reply({
      content: `⏭️ Skipped **${skipped?.title || 'track'}**!`,
      ephemeral: true,
    });
  }
}
