/**
 * Configuration and environment validation utilities
 */

export interface Config {
    // Google OAuth configuration
    googleClientId: string;
    googleClientSecret: string;
    googleRedirectUri: string;
    googleApiKey: string;
    
    // Server configuration
    port: number;
    host: string;
    
    // MCP Server settings
    mcpServerName: string;
    mcpServerVersion: string;
    
    // Rate limiting
    rateLimitRequestsPerMinute: number;
    
    // Session settings
    sessionSecret?: string;
    sessionTimeoutMinutes: number;
    
    // Logging
    logLevel: string;
}

/**
 * Validates that all required environment variables are present
 * @throws Error if required environment variables are missing
 */
export function validateEnvironment(): Config {
    const isMockMode = process.env.NODE_ENV === 'test' || 
                      process.env.NODE_ENV === 'development' || 
                      process.env.ENABLE_MOCK_MODE === 'true';
    
    const requiredVars = [
        'GOOGLE_CLIENT_ID',
        'GOOGLE_CLIENT_SECRET',
        'GOOGLE_REDIRECT_URI',
        'GOOGLE_API_KEY'
    ];
    
    const missing: string[] = [];
    
    // Only validate Google API credentials if not in mock mode
    if (!isMockMode) {
        for (const varName of requiredVars) {
            if (!process.env[varName]) {
                missing.push(varName);
            }
        }
        
        if (missing.length > 0) {
            throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
        }
    }
    
    return {
        googleClientId: process.env.GOOGLE_CLIENT_ID || 'mock-client-id',
        googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || 'mock-client-secret',
        googleRedirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/callback',
        googleApiKey: process.env.GOOGLE_API_KEY || 'mock-api-key',
        port: parseInt(process.env.PORT || '3000'),
        host: process.env.HOST || 'localhost',
        mcpServerName: process.env.MCP_SERVER_NAME || 'google-business-review-mcp-server',
        mcpServerVersion: process.env.MCP_SERVER_VERSION || '1.0.0',
        rateLimitRequestsPerMinute: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE || '60'),
        sessionSecret: process.env.SESSION_SECRET,
        sessionTimeoutMinutes: parseInt(process.env.SESSION_TIMEOUT_MINUTES || '60'),
        logLevel: process.env.LOG_LEVEL || 'info'
    };
}

/**
 * Gets the current configuration from environment variables
 */
export function getConfig(): Config {
    return validateEnvironment();
}