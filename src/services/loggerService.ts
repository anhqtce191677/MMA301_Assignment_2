import { LogEntry, LogLevel } from '@/types/log';

type LogListener = (logs: LogEntry[]) => void;

class LoggerService {
  private logs: LogEntry[] = [];
  private listeners: Set<LogListener> = new Set();
  private maxLogs = 100;

  constructor() {
    this.info('SYSTEM', 'LoggerService initialized');
  }

  public subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    listener([...this.logs]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const currentLogs = [...this.logs];
    this.listeners.forEach((listener) => {
      try {
        listener(currentLogs);
      } catch (e) {
        console.error('Error in log listener:', e);
      }
    });
  }

  public log(level: LogLevel, tag: string, message: string, details?: Record<string, unknown> | string) {
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toISOString(),
      level,
      tag,
      message,
      details,
    };

    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    const consoleMessage = `[${entry.timestamp}] [${level}] [${tag}] ${message}`;
    if (level === 'ERROR') {
      console.error(consoleMessage, details || '');
    } else if (level === 'WARN') {
      console.warn(consoleMessage, details || '');
    } else {
      console.log(consoleMessage, details || '');
    }

    this.notify();
  }

  public info(tag: string, message: string, details?: Record<string, unknown> | string) {
    this.log('INFO', tag, message, details);
  }

  public warn(tag: string, message: string, details?: Record<string, unknown> | string) {
    this.log('WARN', tag, message, details);
  }

  public error(tag: string, message: string, details?: Record<string, unknown> | string) {
    this.log('ERROR', tag, message, details);
  }

  public debug(tag: string, message: string, details?: Record<string, unknown> | string) {
    this.log('DEBUG', tag, message, details);
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clearLogs() {
    this.logs = [];
    this.notify();
    this.info('SYSTEM', 'Log history cleared');
  }
}

export const logger = new LoggerService();
