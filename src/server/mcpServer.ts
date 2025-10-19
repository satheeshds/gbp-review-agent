/**
 * Main MCP Server implementation for Google Business Profile Review management
 */

import { McpServer as BaseMcpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';
import cors from 'cors';
import { z } from 'zod';

import { getConfig } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { GoogleAuthService } from '../services/googleAuth.js';
import { ReviewService } from '../services/reviewService.js';
import { LLMService } from '../services/llmService.js';

// Import tool implementations
import { createListLocationsTool } from './tools/listLocations.js';
import { createGetReviewsTool } from './tools/getReviews.js';
import { createGenerateReplyTool } from './tools/generateReply.js';
import { createPostReplyTool } from './tools/postReply.js';

// Import resource implementations
import { createBusinessProfileResource } from './resources/businessProfile.js';
import { createReviewTemplatesResource } from './resources/reviewTemplates.js';

// Import prompt implementations
import { createReviewResponsePrompt } from './prompts/reviewResponse.js';
import { createSentimentAnalysisPrompt } from './prompts/sentimentAnalysis.js';

export class McpServer {
    private config = getConfig();
    private server: BaseMcpServer;
    private app?: express.Application;
    private httpServer?: any;
    
    // Services
    private googleAuthService: GoogleAuthService;
    private reviewService: ReviewService;
    private llmService: LLMService;
    
    constructor() {
        // Initialize MCP server
        this.server = new BaseMcpServer(
            {
                name: this.config.mcpServerName,
                version: this.config.mcpServerVersion
            },
            {
                capabilities: {
                    tools: {},
                    resources: {},
                    prompts: {},
                    logging: {},
                    sampling: {}
                }
            }
        );
        
        // Initialize services
        this.googleAuthService = new GoogleAuthService();
        this.reviewService = new ReviewService(this.googleAuthService);
        this.llmService = new LLMService();
        
        this.setupServer();
    }
    
    private setupServer(): void {
        logger.info('Setting up MCP server tools, resources, and prompts...');
        
        // Register tools
        this.registerTools();
        
        // Register resources
        this.registerResources();
        
        // Register prompts
        this.registerPrompts();
        
        logger.info('MCP server setup completed');
    }
    
    private registerTools(): void {
        logger.debug('Registering MCP tools...');
        
        // List locations tool
        const listLocationsTool = createListLocationsTool(this.reviewService);
        this.server.registerTool(
            'list_locations',
            {
                title: listLocationsTool.schema.title,
                description: listLocationsTool.schema.description,
                inputSchema: {},
                outputSchema: listLocationsTool.schema.outputSchema
            },
            async (args: any) => {
                return await listLocationsTool.handler(args);
            }
        );
        
        // Get reviews tool
        const getReviewsTool = createGetReviewsTool(this.reviewService);
        this.server.registerTool(
            'get_reviews',
            {
                title: getReviewsTool.schema.title,
                description: getReviewsTool.schema.description,
                inputSchema: getReviewsTool.schema.inputSchema,
                outputSchema: getReviewsTool.schema.outputSchema
            },
            async (args: any) => {
                return await getReviewsTool.handler(args);
            }
        );
        
        // Generate reply tool
        const generateReplyTool = createGenerateReplyTool(this.llmService);
        this.server.registerTool(
            'generate_reply',
            {
                title: generateReplyTool.schema.title,
                description: generateReplyTool.schema.description,
                inputSchema: generateReplyTool.schema.inputSchema,
                outputSchema: generateReplyTool.schema.outputSchema
            },
            async (args: any) => {
                return await generateReplyTool.handler(args);
            }
        );
        
        // Post reply tool
        const postReplyTool = createPostReplyTool(this.reviewService);
        this.server.registerTool(
            'post_reply',
            {
                title: postReplyTool.schema.title,
                description: postReplyTool.schema.description,
                inputSchema: postReplyTool.schema.inputSchema,
                outputSchema: postReplyTool.schema.outputSchema
            },
            async (args: any) => {
                return await postReplyTool.handler(args);
            }
        );
        
        logger.debug('Tools registered successfully');
    }
    
    private registerResources(): void {
        logger.debug('Registering MCP resources...');
        
        // Business profile resource
        const businessProfileResource = createBusinessProfileResource(this.reviewService);
        this.server.registerResource(
            'business_profile',
            businessProfileResource.uri,
            { 
                name: businessProfileResource.name,
                description: businessProfileResource.description,
                mimeType: businessProfileResource.mimeType
            },
            async () => {
                const result = await businessProfileResource.handler();
                return {
                    contents: result.contents
                };
            }
        );
        
        // Review templates resource
        const reviewTemplatesResource = createReviewTemplatesResource();
        this.server.registerResource(
            'review_templates',
            reviewTemplatesResource.uri,
            {
                name: reviewTemplatesResource.name,
                description: reviewTemplatesResource.description,
                mimeType: reviewTemplatesResource.mimeType
            },
            async () => {
                const result = await reviewTemplatesResource.handler();
                return {
                    contents: result.contents
                };
            }
        );
        
        logger.debug('Resources registered successfully');
    }
    
    private registerPrompts(): void {
        logger.debug('Registering MCP prompts...');
        
        // Review response prompt
        const reviewResponsePrompt = createReviewResponsePrompt();
        this.server.registerPrompt(
            'review_response',
            {
                title: 'Review Response Generator',
                description: reviewResponsePrompt.description,
                argsSchema: {
                    reviewText: z.string().describe('The customer review text'),
                    starRating: z.string().describe('Star rating (1-5)'),
                    businessName: z.string().describe('Name of the business'),
                    businessType: z.string().optional().describe('Type of business (restaurant, retail, etc.)'),
                    customerName: z.string().optional().describe('Customer display name'),
                    replyTone: z.string().describe('Desired tone for the reply'),
                    previousReplies: z.string().optional().describe('JSON array of previous replies for consistency')
                }
            },
            async (args: any) => {
                const context = {
                    reviewText: args.reviewText,
                    starRating: parseInt(args.starRating),
                    businessName: args.businessName,
                    businessType: args.businessType,
                    customerName: args.customerName,
                    replyTone: args.replyTone,
                    previousReplies: args.previousReplies ? JSON.parse(args.previousReplies) : []
                };
                const prompt = await reviewResponsePrompt.handler(context);
                return {
                    description: `Review response prompt for ${args.businessName}`,
                    messages: [
                        {
                            role: 'user',
                            content: {
                                type: 'text',
                                text: prompt
                            }
                        }
                    ]
                };
            }
        );
        
        // Sentiment analysis prompt
        const sentimentAnalysisPrompt = createSentimentAnalysisPrompt();
        this.server.registerPrompt(
            'sentiment_analysis',
            {
                title: 'Review Sentiment Analysis',
                description: sentimentAnalysisPrompt.description,
                argsSchema: {
                    reviewText: z.string().describe('The review text to analyze'),
                    includeEmotions: z.string().optional().describe('Include emotional analysis (true/false)'),
                    includeKeywords: z.string().optional().describe('Include keyword extraction (true/false)')
                }
            },
            async (args: any) => {
                const context = {
                    reviewText: args.reviewText,
                    includeEmotions: args.includeEmotions !== 'false',
                    includeKeywords: args.includeKeywords !== 'false'
                };
                const prompt = await sentimentAnalysisPrompt.handler(context);
                return {
                    description: `Sentiment analysis for review: "${args.reviewText.substring(0, 50)}..."`,
                    messages: [
                        {
                            role: 'user',
                            content: {
                                type: 'text',
                                text: prompt
                            }
                        }
                    ]
                };
            }
        );
        
        logger.debug('Prompts registered successfully');
    }
    
    private setupHttpServer(): void {
        logger.info('Setting up HTTP server for Streamable HTTP transport...');
        
        this.app = express();
        
        // Middleware
        this.app.use(cors({
            origin: '*',
            methods: ['GET', 'POST', 'DELETE'],
            allowedHeaders: ['Content-Type', 'Authorization', 'Mcp-Session-Id']
        }));
        this.app.use(express.json());
        
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({ status: 'healthy', timestamp: new Date().toISOString() });
        });
        
        // OAuth callback endpoint for Google authentication
        this.app.get('/auth/callback', async (req, res) => {
            try {
                const { code, state } = req.query;
                if (!code || typeof code !== 'string') {
                    throw new Error('Authorization code not provided');
                }
                
                await this.googleAuthService.handleCallback(code, state as string);
                res.json({ success: true, message: 'Authentication successful' });
                
            } catch (error) {
                logger.error('OAuth callback error:', error);
                res.status(400).json({ 
                    success: false, 
                    error: error instanceof Error ? error.message : 'Authentication failed' 
                });
            }
        });
        
        // MCP endpoint for Streamable HTTP transport
        this.app.post('/mcp', async (req, res) => {
            try {
                const transport = new StreamableHTTPServerTransport({
                    sessionIdGenerator: undefined,
                    enableJsonResponse: true
                });
                
                res.on('close', () => {
                    transport.close();
                });
                
                await this.server.connect(transport);
                await transport.handleRequest(req, res, req.body);
                
            } catch (error) {
                logger.error('MCP request error:', error);
                if (!res.headersSent) {
                    res.status(500).json({
                        jsonrpc: '2.0',
                        error: {
                            code: -32603,
                            message: 'Internal server error'
                        },
                        id: null
                    });
                }
            }
        });
        
        logger.info('HTTP server setup completed');
    }
    
    async start(): Promise<void> {
        const transportMode = process.env.TRANSPORT_MODE || 'http';
        
        if (transportMode === 'stdio') {
            await this.startStdioTransport();
        } else {
            await this.startHttpTransport();
        }
    }
    
    private async startStdioTransport(): Promise<void> {
        logger.info('Starting MCP server with STDIO transport...');
        
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        
        logger.info(`MCP server started with STDIO transport`);
    }
    
    private async startHttpTransport(): Promise<void> {
        logger.info('Starting MCP server with HTTP transport...');
        
        this.setupHttpServer();
        
        return new Promise((resolve, reject) => {
            try {
                this.httpServer = this.app!.listen(this.config.port, this.config.host, () => {
                    logger.info(`MCP server listening on http://${this.config.host}:${this.config.port}`);
                    logger.info(`MCP endpoint available at http://${this.config.host}:${this.config.port}/mcp`);
                    logger.info(`OAuth callback URL: http://${this.config.host}:${this.config.port}/auth/callback`);
                    resolve();
                });
                
                this.httpServer.on('error', (error: Error) => {
                    logger.error('HTTP server error:', error);
                    reject(error);
                });
                
            } catch (error) {
                logger.error('Failed to start HTTP server:', error);
                reject(error);
            }
        });
    }
    
    async stop(): Promise<void> {
        logger.info('Stopping MCP server...');
        
        if (this.httpServer) {
            return new Promise((resolve) => {
                this.httpServer!.close(() => {
                    logger.info('HTTP server stopped');
                    resolve();
                });
            });
        }
        
        logger.info('MCP server stopped');
    }
}