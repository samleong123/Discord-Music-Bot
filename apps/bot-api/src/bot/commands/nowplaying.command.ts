import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { BaseCommand } from '@/bot/commands/base.command';
import { queueManager } from '@/queue/queue.manager';

export class NowPlayingCommand extends BaseCommand {
  data = new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Show the current track');

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const currentTrack = queueManager.getCurrentTrack(interaction.guildId!);

    if (!currentTrack) {
      await interaction.reply({
        content: '❌ Nothing is playing!',
        ephemeral: true,
      });
      return;
    }

    let content = '🎵 **Now Playing**\n\n';
    content += `**${currentTrack.title}**\n`;
    if (currentTrack.uploader) content += `Artist: ${currentTrack.uploader}\n`;
    if (currentTrack.durationSec) {
      const duration = `${Math.floor(currentTrack.durationSec / 60)}:${(currentTrack.durationSec % 60).toString().padStart(2, '0')}`;
      content += `Duration: ${duration}\n`;
    }
    content += `Source: ${currentTrack.source}\n`;
    content += `Requested by: <@${currentTrack.requestedByUserId}>`;

    const embed = {
      color: 0x2f3136,
      title: '🎵 Now Playing',
      description: currentTrack.title,
      thumbnail: {
        url: currentTrack.thumbnailUrl || 'https://cdn.discordapp.com/embed/avatars/0.png',
      },
      fields: [
        {
          name: 'Artist',
          value: currentTrack.uploader || 'Unknown',
          inline: true,
        },
        {
          name: 'Duration',
          value: currentTrack.durationSec
            ? `${Math.floor(currentTrack.durationSec / 60)}:${(currentTrack.durationSec % 60).toString().padStart(2, '0')}`
            : 'Unknown',
          inline: true,
        },
        {
          name: 'Source',
          value: currentTrack.source,
          inline: true,
        },
      ],
    };

    await interaction.reply({
      embeds: [embed as any],
      ephemeral: true,
    });
  }
}
