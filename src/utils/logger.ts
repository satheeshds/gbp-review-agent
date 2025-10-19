/**
 * Logging utility for the Google Business Profile Review MCP Server
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    data?: any;
}

class Logger {
    private logLevel: LogLevel;
    
    constructor() {
        this.logLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
    }
    
    private shouldLog(level: LogLevel): boolean {
        const levels: Record<LogLevel, number> = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3
        };
        
        return levels[level] >= levels[this.logLevel];
    }
    
    private formatMessage(level: LogLevel, message: string, data?: any): string {
        const timestamp = new Date().toISOString();
        const logEntry: LogEntry = {
            timestamp,
            level,
            message,
            ...(data && { data })
        };
        
        return JSON.stringify(logEntry);
    }
    
    private log(level: LogLevel, message: string, data?: any): void {
        if (!this.shouldLog(level)) {
            return;
        }
        
        const formattedMessage = this.formatMessage(level, message, data);
        
        // Write to stderr for logging (as per MCP best practices for stdio transport)
        // For HTTP transport, we can use stdout
        if (level === 'error') {
            console.error(formattedMessage);
        } else {
            console.error(formattedMessage);
        }
    }
    
    debug(message: string, data?: any): void {
        this.log('debug', message, data);
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
}

export const logger = new Logger();