import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { BaseCommand } from '@/bot/commands/base.command';
import { queueManager } from '@/queue/queue.manager';

export class RepeatCommand extends BaseCommand {
  data = new SlashCommandBuilder()
    .setName('repeat')
    .setDescription('Set repeat mode')
    .addStringOption((option) =>
      option
        .setName('mode')
        .setDescription('Repeat mode')
        .setRequired(true)
        .addChoices(
          { name: 'Off', value: 'off' },
          { name: 'Track', value: 'track' },
          { name: 'Queue', value: 'queue' },
        ),
    );

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const mode = interaction.options.getString('mode', true) as 'off' | 'track' | 'queue';
    queueManager.setRepeatMode(interaction.guildId!, mode);

    const modeText = { off: '🔁 Off', track: '🔂 Track', queue: '🔁 Queue' };

    await interaction.reply({
      content: `Repeat mode set to **${modeText[mode]}**`,
      ephemeral: true,
    });
  }
}
