import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { BaseCommand } from '@/bot/commands/base.command';

export class PingCommand extends BaseCommand {
  data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check if the bot is alive');

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const latency = interaction.client.ws.ping;
    await interaction.reply({
      content: `🏓 Pong! Latency: **${latency}ms**`,
      ephemeral: true,
    });
  }
}
