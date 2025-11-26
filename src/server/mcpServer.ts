/**
 * Main MCP Server implementation for Google Business Profile Review management
 */

import { McpServer as BaseMcpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { getConfig } from '../utils/config.js';
import { logger } from '../utils/logger.js';
import { GoogleAuthService } from '../services/googleAuth.js';
import { ReviewService } from '../services/reviewService.js';
import { MockReviewService } from '../services/mockReviewService.js';
import { LLMService } from '../services/llmService.js';
import type { IReviewService } from '../types/index.js';

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
import { createManageReviewsPrompt } from './prompts/manageReviews.js';
import { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';
import { ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types.js';

export class McpServer {
    private config = getConfig();
    private server: BaseMcpServer;
    
    // Services
    private googleAuthService?: GoogleAuthService;
    private reviewService: IReviewService;
    private llmService: LLMService;
    private isMockMode: boolean;
    
    constructor() {
        // Check if we're in mock mode
        this.isMockMode = process.env.NODE_ENV === 'test' || 
                         process.env.NODE_ENV === 'development' || 
                         process.env.ENABLE_MOCK_MODE === 'true';
        
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
                    logging: {}
                }
            }
        );
        
        // Initialize services based on mode
        if (this.isMockMode) {
            logger.info('🧪 Starting in MOCK MODE - No Google API required');
            this.reviewService = new MockReviewService();
        } else {
            logger.info('🚀 Starting in PRODUCTION MODE - Google API required');
            this.googleAuthService = new GoogleAuthService();
            this.reviewService = new ReviewService(this.googleAuthService);
        }
        
        // Initialize LLM service
        // Note: Sampling capability will be added when MCP SDK supports it directly
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
            async (args: any, extra: RequestHandlerExtra<ServerRequest, ServerNotification>) => {
                return await generateReplyTool.handler(args, extra);
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

        // Manage pending reviews prompt
        const manageReviewsPrompt = createManageReviewsPrompt(this.reviewService);
        this.server.registerPrompt(
            'manage_pending_reviews',
            {
                title: 'Manage Pending Reviews',
                description: manageReviewsPrompt.description,
                argsSchema: {
                    locationName: z.string().optional().describe('Specific location to check (optional)')
                }
            },
            async (args: any) => {
                const context = {
                    locationName: args.locationName
                };
                const prompt = await manageReviewsPrompt.handler(context);
                return {
                    description: 'Instructions to manage pending reviews',
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
    
    
    async start(): Promise<void> {
        logger.info('Starting MCP server with STDIO transport...');
        
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        
        logger.info(`MCP server started with STDIO transport`);
        
        // Keep the process alive for STDIO transport
        // The transport will handle stdin/stdout communication
        return new Promise<void>(() => {
            // This promise never resolves, keeping the process alive
            // The process will only exit via signal handlers or errors
        });
    }
    
    async stop(): Promise<void> {
        logger.info('Stopping MCP server...');
        logger.info('MCP server stopped');
    }
}