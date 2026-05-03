import { SlashCommandBuilder, ChatInputCommandInteraction, VoiceChannel } from 'discord.js';
import { joinVoiceChannel, getVoiceConnection } from '@discordjs/voice';
import { BaseCommand } from '@/bot/commands/base.command';
import { queueManager } from '@/queue/queue.manager';
import logger from '@/config/logger';

export class JoinCommand extends BaseCommand {
  data = new SlashCommandBuilder()
    .setName('join')
    .setDescription('Join your voice channel');

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const member = interaction.guild?.members.cache.get(interaction.user.id);
    const voiceChannel = member?.voice.channel;

    if (!voiceChannel) {
      await interaction.reply({
        content: '❌ You must be in a voice channel to use this command!',
        ephemeral: true,
      });
      return;
    }

    try {
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guildId!,
        adapterCreator: interaction.guild!.voiceAdapterCreator as any,
      });

      const player = queueManager.getPlayer(interaction.guildId!);
      await player.setVoiceConnection(connection, voiceChannel.id, voiceChannel.name);

      logger.info(`Bot joined voice channel ${voiceChannel.name} in guild ${interaction.guildId}`);

      await interaction.reply({
        content: `✅ Joined **${voiceChannel.name}**!`,
        ephemeral: true,
      });
    } catch (error) {
      logger.error('Failed to join voice channel', error);
      await interaction.reply({
        content: '❌ Failed to join voice channel!',
        ephemeral: true,
      });
    }
  }
}
