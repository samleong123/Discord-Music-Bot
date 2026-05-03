import { Collection } from 'discord.js';
import { BaseCommand } from '@/bot/commands/base.command';
import logger from '@/config/logger';

// Import all commands
import { PingCommand } from '@/bot/commands/ping.command';
import { JoinCommand } from '@/bot/commands/join.command';
import { LeaveCommand } from '@/bot/commands/leave.command';
import { PlayCommand } from '@/bot/commands/play.command';
import { QueueCommand } from '@/bot/commands/queue.command';
import { PauseCommand } from '@/bot/commands/pause.command';
import { ResumeCommand } from '@/bot/commands/resume.command';
import { SkipCommand } from '@/bot/commands/skip.command';
import { StopCommand } from '@/bot/commands/stop.command';
import { RemoveCommand } from '@/bot/commands/remove.command';
import { ClearCommand } from '@/bot/commands/clear.command';
import { NowPlayingCommand } from '@/bot/commands/nowplaying.command';
import { RepeatCommand } from '@/bot/commands/repeat.command';
import { ShuffleCommand } from '@/bot/commands/shuffle.command';

export class CommandManager {
  private commands: Collection<string, BaseCommand> = new Collection();

  constructor() {
    this.registerCommands([
      new PingCommand(),
      new JoinCommand(),
      new LeaveCommand(),
      new PlayCommand(),
      new QueueCommand(),
      new PauseCommand(),
      new ResumeCommand(),
      new SkipCommand(),
      new StopCommand(),
      new RemoveCommand(),
      new ClearCommand(),
      new NowPlayingCommand(),
      new RepeatCommand(),
      new ShuffleCommand(),
    ]);
  }

  private registerCommands(commands: BaseCommand[]): void {
    for (const command of commands) {
      this.commands.set(command.getName(), command);
      logger.info(`Registered command: /${command.getName()}`);
    }
  }

  getCommand(name: string): BaseCommand | undefined {
    return this.commands.get(name);
  }

  getAllCommands(): BaseCommand[] {
    return Array.from(this.commands.values());
  }

  getSlashCommandData() {
    return this.getAllCommands().map((cmd) => cmd.data);
  }
}
