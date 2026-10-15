export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  tag: string;
  message: string;
  details?: Record<string, unknown> | string;
}
