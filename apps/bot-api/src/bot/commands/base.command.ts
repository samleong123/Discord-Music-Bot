import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  SharedSlashCommandOptions
} from 'discord.js';

export abstract class BaseCommand {
  abstract data: any;

  abstract execute(interaction: ChatInputCommandInteraction): Promise<void>;

  getName(): string {
    return this.data.name;
  }
}

export interface CommandRegistry {
  [key: string]: BaseCommand;
}
