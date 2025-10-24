import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export class Logger {
  private logPath: string;
  private logStream: fs.WriteStream | null = null;

  constructor(logDir?: string) {
    const baseDir = logDir || path.join(os.homedir(), '.glean', 'logs');
    
    // Ensure log directory exists
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }

    // Create log file with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    this.logPath = path.join(baseDir, `glean-mcp-${timestamp}.log`);
    
    this.logStream = fs.createWriteStream(this.logPath, { flags: 'a' });
    this.log('info', `Log started at ${new Date().toISOString()}`);
    this.log('info', `Log file: ${this.logPath}`);
  }

  private formatMessage(level: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  }

  log(level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: any): void {
    const formatted = this.formatMessage(level, message);
    
    // Write to file
    if (this.logStream) {
      this.logStream.write(formatted + '\n');
      if (data) {
        this.logStream.write(JSON.stringify(data, null, 2) + '\n');
      }
    }

    // Also output to console for important messages
    if (level === 'error' || level === 'warn') {
      console.error(formatted);
      if (data) {
        console.error(data);
      }
    } else if (level === 'info') {
      console.error(message); // Use original message for cleaner console output
    }
  }

  info(message: string, data?: any): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: any): void {
    this.log('error', message, data);
  }

  debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }

  close(): void {
    if (this.logStream) {
      this.logStream.end();
      this.logStream = null;
    }
  }

  getLogPath(): string {
    return this.logPath;
  }

  // Cleanup old log files (keep last N days)
  static cleanupOldLogs(logDir?: string, daysToKeep: number = 7): void {
    const baseDir = logDir || path.join(os.homedir(), '.glean', 'logs');
    
    if (!fs.existsSync(baseDir)) {
      return;
    }

    const now = Date.now();
    const maxAge = daysToKeep * 24 * 60 * 60 * 1000; // days to milliseconds

    fs.readdirSync(baseDir).forEach(file => {
      const filePath = path.join(baseDir, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        fs.unlinkSync(filePath);
      }
    });
  }
}

// Global logger instance
let globalLogger: Logger | null = null;

export function getLogger(): Logger {
  if (!globalLogger) {
    globalLogger = new Logger();
    Logger.cleanupOldLogs(); // Clean old logs on startup
  }
  return globalLogger;
}

export function closeLogger(): void {
  if (globalLogger) {
    globalLogger.close();
    globalLogger = null;
  }
}

