/**
 * Shared in-memory state between the Discord bot and the web/API layer.
 * The bot writes here when guilds are added/removed.
 * The API routes read from here to serve the dashboard.
 */

export interface GuildInfo {
  id: string;
  name: string;
  iconURL: string | null;
  memberCount: number;
}

class BotState {
  private guilds = new Map<string, GuildInfo>();
  private botTag: string | null = null;

  setBotTag(tag: string): void {
    this.botTag = tag;
  }

  getBotTag(): string | null {
    return this.botTag;
  }

  registerGuild(info: GuildInfo): void {
    this.guilds.set(info.id, info);
  }

  unregisterGuild(id: string): void {
    this.guilds.delete(id);
  }

  getGuilds(): GuildInfo[] {
    return [...this.guilds.values()];
  }

  getGuild(id: string): GuildInfo | undefined {
    return this.guilds.get(id);
  }
}

export const botState = new BotState();
