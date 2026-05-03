import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { BaseCommand } from '@/bot/commands/base.command';
import { queueManager } from '@/queue/queue.manager';

export class RemoveCommand extends BaseCommand {
  data = new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Remove a track from the queue')
    .addIntegerOption((option) =>
      option
        .setName('position')
        .setDescription('Position in the queue (1-based)')
        .setRequired(true)
        .setMinValue(1),
    );

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const position = interaction.options.getInteger('position', true) - 1;
    const removed = queueManager.removeTrack(interaction.guildId!, position);

    if (!removed) {
      await interaction.reply({
        content: '❌ Invalid queue position!',
        ephemeral: true,
      });
      return;
    }

    await interaction.reply({
      content: `🗑️ Removed **${removed.title}** from the queue!`,
      ephemeral: true,
    });
  }
}
