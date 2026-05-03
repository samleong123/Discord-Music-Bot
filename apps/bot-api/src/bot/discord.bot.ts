import { Client, GatewayIntentBits, Interaction, REST, Routes } from 'discord.js';
import { config, validateConfig } from '@/config/config';
import { CommandManager } from '@/bot/command.manager';
import { botState } from '@/bot/bot-state';
import logger from '@/config/logger';

export class DiscordBot {
  private client: Client;
  private commandManager: CommandManager;
  private rest: REST;

  constructor() {
    validateConfig();

    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.DirectMessages,
      ],
    });

    this.commandManager = new CommandManager();
    this.rest = new REST({ version: '10' }).setToken(config.discord.token);

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.client.on('ready', () => {
      logger.info(`✅ Bot logged in as ${this.client.user?.tag}`);
      this.client.user?.setActivity('music 🎵', { type: 2 });
      if (this.client.user?.tag) botState.setBotTag(this.client.user.tag);

      // Register all current guilds
      this.client.guilds.cache.forEach((guild) => {
        botState.registerGuild({
          id: guild.id,
          name: guild.name,
          iconURL: guild.iconURL(),
          memberCount: guild.memberCount,
        });
      });
      logger.info(`Registered ${this.client.guilds.cache.size} guild(s) in bot state`);

      void this.registerCommands();
    });

    this.client.on('guildCreate', (guild) => {
      botState.registerGuild({
        id: guild.id,
        name: guild.name,
        iconURL: guild.iconURL(),
        memberCount: guild.memberCount,
      });
    });

    this.client.on('guildDelete', (guild) => {
      botState.unregisterGuild(guild.id);
    });

    this.client.on('interactionCreate', async (interaction: Interaction) => {
      if (!interaction.isChatInputCommand()) return;

      const command = this.commandManager.getCommand(interaction.commandName);
      if (!command) {
        logger.warn(`Unknown command: ${interaction.commandName}`);
        return;
      }

      try {
        logger.debug(`Executing command: /${interaction.commandName} by ${interaction.user.tag}`);
        await command.execute(interaction);
      } catch (error) {
        logger.error(`Command execution error: ${interaction.commandName}`, error);
        if (!interaction.replied) {
          await interaction.reply({
            content: '❌ An error occurred while executing the command!',
            ephemeral: true,
          });
        }
      }
    });

    this.client.on('error', (error) => {
      logger.error('Discord client error', error);
    });
  }

  private async registerCommands(): Promise<void> {
    try {
      logger.info('Registering slash commands...');
      const commands = this.commandManager.getSlashCommandData();

      if (config.discord.devGuildId) {
        // Register commands to dev guild only (instant)
        await this.rest.put(Routes.applicationGuildCommands(config.discord.clientId, config.discord.devGuildId), {
          body: commands,
        });
        logger.info(`Registered ${commands.length} commands to dev guild`);
      } else {
        // Register globally (takes up to 1 hour to propagate)
        await this.rest.put(Routes.applicationCommands(config.discord.clientId), {
          body: commands,
        });
        logger.info(`Registered ${commands.length} commands globally`);
      }
    } catch (error) {
      logger.error('Failed to register commands', error);
    }
  }

  async start(): Promise<void> {
    try {
      logger.info('Starting Discord bot...');
      await this.client.login(config.discord.token);
    } catch (error) {
      logger.error('Failed to start bot', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    await this.client.destroy();
    logger.info('Bot stopped');
  }

  getClient(): Client {
    return this.client;
  }
}
