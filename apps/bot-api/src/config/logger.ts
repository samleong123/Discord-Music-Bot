interface LogLevel {
  error: string;
  warn: string;
  info: string;
  debug: string;
}

const logLevels: LogLevel = {
  error: 'ERROR',
  warn: 'WARN',
  info: 'INFO',
  debug: 'DEBUG',
};

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
};

class Logger {
  private prefix(level: string, color: string): string {
    const timestamp = new Date().toISOString();
    return `${color}[${timestamp}] [${level}]${colors.reset}`;
  }

  error(message: string, error?: unknown): void {
    if (error !== undefined) {
      const errorMsg = error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : String(error);
      console.error(`${this.prefix(logLevels.error, colors.red)} ${message}`, errorMsg);
    } else {
      console.error(`${this.prefix(logLevels.error, colors.red)} ${message}`);
    }
  }

  warn(message: string): void {
    console.warn(`${this.prefix(logLevels.warn, colors.yellow)} ${message}`);
  }

  info(message: string): void {
    console.log(`${this.prefix(logLevels.info, colors.green)} ${message}`);
  }

  debug(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`${this.prefix(logLevels.debug, colors.blue)} ${message}`, data || '');
    }
  }
}

export default new Logger();
