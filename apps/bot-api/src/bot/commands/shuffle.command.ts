import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { BaseCommand } from '@/bot/commands/base.command';
import { queueManager } from '@/queue/queue.manager';

export class ShuffleCommand extends BaseCommand {
  data = new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('Shuffle the upcoming queue');

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const queue = queueManager.getQueue(interaction.guildId!);

    if (queue.length < 2) {
      await interaction.reply({
        content: '❌ Need at least 2 tracks in the queue to shuffle!',
        ephemeral: true,
      });
      return;
    }

    queueManager.shuffle(interaction.guildId!);

    await interaction.reply({
      content: `🔀 Shuffled **${queue.length}** tracks!`,
      ephemeral: true,
    });
  }
}
