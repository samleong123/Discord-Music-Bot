import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { joinVoiceChannel, getVoiceConnection } from '@discordjs/voice';
import { BaseCommand } from '@/bot/commands/base.command';
import { queueManager } from '@/queue/queue.manager';
import { ytDlpService } from '@/audio/ytdlp.service';
import logger from '@/config/logger';

export class PlayCommand extends BaseCommand {
  data = new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song or add it to the queue')
    .addStringOption((option) =>
      option
        .setName('url_or_search')
        .setDescription('YouTube URL, playlist URL, or search query')
        .setRequired(true),
    );

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const query = interaction.options.getString('url_or_search', true);
    const member = interaction.guild?.members.cache.get(interaction.user.id);
    const voiceChannel = member?.voice.channel;

    if (!voiceChannel) {
      await interaction.reply({
        content: '❌ You must be in a voice channel!',
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply();

    try {
      // ── Join / move to the user's voice channel ──────────────────────────
      const existingConnection = getVoiceConnection(interaction.guildId!);
      if (!existingConnection || existingConnection.joinConfig.channelId !== voiceChannel.id) {
        const connection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: interaction.guildId!,
          adapterCreator: interaction.guild!.voiceAdapterCreator as any,
        });
        const player = queueManager.getPlayer(interaction.guildId!);
        await player.setVoiceConnection(connection, voiceChannel.id, voiceChannel.name);
        logger.info(`Joined voice channel "${voiceChannel.name}" in guild ${interaction.guildId}`);
      }

      // ── Handle playlist or single track ──────────────────────────────────
      const isPlaylist = ytDlpService.isPlaylist(query);

      if (isPlaylist) {
        await interaction.editReply('📥 Importing playlist…');
        const tracks = await ytDlpService.extractPlaylist(query);

        if (tracks.length === 0) {
          await interaction.editReply('❌ No tracks found in the playlist!');
          return;
        }

        const queueTracks = tracks.map((track) => ({
          id: track.id,
          source: track.extractor,
          title: track.title,
          originalUrl: track.webpage_url,
          webpageUrl: track.webpage_url,
          durationSec: track.duration,
          thumbnailUrl: track.thumbnail || undefined,
          uploader: track.uploader || undefined,
          requestedByUserId: interaction.user.id,
          addedAt: new Date().toISOString(),
        }));

        await queueManager.addTracks(interaction.guildId!, queueTracks);
        await queueManager.play(interaction.guildId!);

        await interaction.editReply(`✅ Added **${tracks.length}** tracks to the queue!`);
      } else {
        await interaction.editReply('🔍 Searching…');
        const metadata = await ytDlpService.extractMetadata(query);

        const track = {
          id: metadata.id,
          source: metadata.extractor,
          title: metadata.title,
          originalUrl: metadata.webpage_url,
          webpageUrl: metadata.webpage_url,
          durationSec: metadata.duration,
          thumbnailUrl: metadata.thumbnail || undefined,
          uploader: metadata.uploader || undefined,
          requestedByUserId: interaction.user.id,
          addedAt: new Date().toISOString(),
        };

        await queueManager.addTrack(interaction.guildId!, track);
        await queueManager.play(interaction.guildId!);

        await interaction.editReply(`✅ Added **${metadata.title}** to the queue!`);
      }
    } catch (error) {
      logger.error('Failed to play track', error);
      await interaction.editReply('❌ Failed to process your request. Make sure the URL is valid!');
    }
  }
}
