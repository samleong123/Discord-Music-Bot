import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { BaseCommand } from '@/bot/commands/base.command';
import { queueManager } from '@/queue/queue.manager';

export class QueueCommand extends BaseCommand {
  data = new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Show the current queue')
    .addIntegerOption((option) =>
      option.setName('page').setDescription('Page number').setMinValue(1),
    );

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const queue = queueManager.getQueue(interaction.guildId!);
    const currentTrack = queueManager.getCurrentTrack(interaction.guildId!);
    const page = interaction.options.getInteger('page') ?? 1;
    const itemsPerPage = 10;

    if (queue.length === 0 && !currentTrack) {
      await interaction.reply({
        content: '📭 Queue is empty!',
        ephemeral: true,
      });
      return;
    }

    let content = '🎵 **Queue**\n\n';

    if (currentTrack) {
      content += `**Now Playing:**\n${currentTrack.title} by ${currentTrack.uploader || 'Unknown'}\n\n`;
    }

    if (queue.length === 0) {
      content += 'No upcoming tracks.';
    } else {
      const start = (page - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      const items = queue.slice(start, end);

      content += '**Upcoming Tracks:**\n';
      items.forEach((track, index) => {
        const num = start + index + 1;
        const duration = track.durationSec ? `${Math.floor(track.durationSec / 60)}:${(track.durationSec % 60).toString().padStart(2, '0')}` : 'Unknown';
        content += `${num}. **${track.title}** \`${duration}\` - ${track.uploader || 'Unknown'}\n`;
      });

      const totalPages = Math.ceil(queue.length / itemsPerPage);
      content += `\n📄 Page ${page}/${totalPages}`;
    }

    await interaction.reply({
      content,
      ephemeral: false,
    });
  }
}
