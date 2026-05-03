import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { BaseCommand } from '@/bot/commands/base.command';
import { queueManager } from '@/queue/queue.manager';

export class ClearCommand extends BaseCommand {
  data = new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Clear the entire queue');

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const queue = queueManager.getQueue(interaction.guildId!);

    if (queue.length === 0) {
      await interaction.reply({
        content: '📭 Queue is already empty!',
        ephemeral: true,
      });
      return;
    }

    queueManager.clearQueue(interaction.guildId!);

    await interaction.reply({
      content: '🗑️ Queue cleared!',
      ephemeral: true,
    });
  }
}
