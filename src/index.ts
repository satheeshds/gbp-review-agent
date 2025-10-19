#!/usr/bin/env node

/**
 * Google Business Profile Review MCP Server
 * 
 * A Model Context Protocol server that enables AI assistants to manage
 * Google Business Profile reviews with AI-powered responses.
 */

import 'dotenv/config';
import { McpServer } from './server/mcpServer.js';
import { logger } from './utils/logger.js';
import { validateEnvironment } from './utils/config.js';
import { fileURLToPath } from 'url';

async function main() {
    try {
        logger.info('Initializing Google Business Profile Review MCP Server...');
        // Validate environment variables
        validateEnvironment();
        
        logger.info('Starting Google Business Profile Review MCP Server...');
        
        // Initialize the MCP server
        const mcpServer = new McpServer();
        
        // Start the server
        await mcpServer.start();
        
        logger.info('Google Business Profile Review MCP Server is running successfully');
        
        // Graceful shutdown handling
        process.on('SIGINT', async () => {
            logger.info('Received SIGINT, shutting down gracefully...');
            await mcpServer.stop();
            process.exit(0);
        });
        
        process.on('SIGTERM', async () => {
            logger.info('Received SIGTERM, shutting down gracefully...');
            await mcpServer.stop();
            process.exit(0);
        });
        
        process.on('uncaughtException', (error) => {
            logger.error('Uncaught exception:', error);
            process.exit(1);
        });
        
        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled rejection:', { promise: promise.toString(), reason });
            process.exit(1);
        });
        
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Convert the current module's URL to a filesystem path
const __filename = fileURLToPath(import.meta.url);

// Check if this file is being run directly
if (process.argv[1] === __filename) {
    // Entry point - start the server
    main().catch((error) => {
        logger.error('Fatal error:', error);
        process.exit(1);
    });
} else {
    // Being imported as a module
    logger.info('Service not started', { moduleFile: __filename });
}