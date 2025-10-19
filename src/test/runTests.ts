#!/usr/bin/env node
/**
 * Test Runner Entry Point
 * Runs comprehensive tests for the MCP Server using mock data
 */

import { runMCPTests } from './testRunner.js';
import { logger } from '../utils/logger.js';

async function main() {
    try {
        // Set test environment
        process.env.NODE_ENV = 'test';
        process.env.LOG_LEVEL = 'info';
        process.env.ENABLE_MOCK_MODE = 'true';
        
        logger.info('🧪 Starting MCP Server Test Suite');
        logger.info('Environment: Mock Mode (No Google API required)');
        
        await runMCPTests();
        
        logger.info('🎉 All tests completed successfully!');
        process.exit(0);
        
    } catch (error) {
        logger.error('❌ Test suite failed:', error);
        process.exit(1);
    }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection in test runner:', { promise: promise.toString(), reason });
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception in test runner:', error);
    process.exit(1);
});

main();