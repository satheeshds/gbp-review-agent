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
    private isStdioTransport: boolean;
    
    constructor() {
        this.logLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
        this.isStdioTransport = process.env.TRANSPORT_MODE === 'stdio';
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
        
        // Always write to stderr when using STDIO transport (MCP protocol uses stdin/stdout)
        // For HTTP transport, stderr is also appropriate for server logs
        process.stderr.write(formattedMessage + '\n');
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
    
    /**
     * Debug output for STDIO transport - only outputs in non-production environments
     * and when log level is debug. Always writes to stderr to avoid interfering with
     * MCP protocol messages on stdin/stdout.
     */
    stdioDebug(message: string): void {
        if (this.isStdioTransport && 
            this.logLevel === 'debug' && 
            process.env.NODE_ENV !== 'production') {
            process.stderr.write(`[STDIO DEBUG] ${message}\n`);
        }
    }
}

export const logger = new Logger();