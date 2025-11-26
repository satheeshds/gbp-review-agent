/**
 * Genexport interface GenerateReplyTool {
    schema: {
        title: string;
        description: string;
        inputSchema: {
            reviewText: any;
            starRating: any;
            businessName: any;
            replyTone: any;
            includePersonalization: any;
        };
        outputSchema: any;
    };
    handler: (args: any) => Promise<CallToolResult>;
}l
 * Uses LLM to generate appropriate responses to reviews
 */

import { z } from 'zod';
import { logger } from '../../utils/logger.js';
import type { LLMService } from '../../services/llmService.js';
import type { GenerateReplyParams } from '../../types/index.js';
import { CallToolResult, ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types.js';
import { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';

export interface GenerateReplyTool {
    schema: {
        title: string;
        description: string;
        inputSchema: {
            reviewText: any;
            starRating: any;
            businessName: any;
            replyTone?: any;
            includePersonalization?: any;
        };
        outputSchema: any;
    };
    handler: (params: GenerateReplyParams, extra: RequestHandlerExtra<ServerRequest, ServerNotification>) => Promise<CallToolResult>;
}

export function createGenerateReplyTool(llmService: LLMService): GenerateReplyTool {
    return {
        schema: {
            title: 'Generate Review Reply',
            description: 'Generate an AI-powered response to a customer review using appropriate tone and personalization',
            inputSchema: {
                reviewText: z.string().describe('The text content of the customer review'),
                starRating: z.number().min(1).max(5).describe('The star rating given by the reviewer (1-5)'),
                businessName: z.string().describe('The name of the business'),
                replyTone: z.enum(['professional', 'friendly', 'apologetic', 'grateful']).optional()
                    .describe('The desired tone for the reply (auto-determined based on rating if not specified)'),
                includePersonalization: z.boolean().optional().default(true)
                    .describe('Whether to include personalized references to the review content')
            },
            outputSchema: z.object({
                content: z.array(z.object({
                    type: z.string(),
                    text: z.string()
                }))
            })
        },
        
        handler: async (args: any, extra: RequestHandlerExtra<ServerRequest, ServerNotification>): Promise<any> => {
            try {
                const params: GenerateReplyParams = {
                    reviewText: args.reviewText,
                    starRating: args.starRating,
                    businessName: args.businessName,
                    replyTone: args.replyTone,
                    includePersonalization: args.includePersonalization
                };
                logger.info('Executing generate_reply tool', { 
                    starRating: params.starRating, 
                    businessName: params.businessName,
                    replyTone: params.replyTone
                });
                
                const { 
                    reviewText, 
                    starRating, 
                    businessName, 
                    replyTone, 
                    includePersonalization = true 
                } = params;
                
                // Validate inputs
                // if (!reviewText?.trim()) {
                //     throw new Error('reviewText is required and cannot be empty');
                // }
                
                if (!businessName?.trim()) {
                    throw new Error('businessName is required and cannot be empty');
                }
                
                if (starRating < 1 || starRating > 5) {
                    throw new Error('starRating must be between 1 and 5');
                }
                
                const result = await llmService.generateReply(
                    reviewText,
                    starRating,
                    businessName,
                    {
                        replyTone,
                        includePersonalization
                    }, 
                    extra
                );
                
                if (!result.success) {
                    throw new Error(result.error || 'Failed to generate reply');
                }
                
                const replyData = result.data!;
                
                logger.info(`Successfully generated reply with ${replyData.tone} tone and ${replyData.confidence} confidence`);
                
                const response = {
                    content: [
                        {
                            type: 'text',
                            text: `Generated reply for "${businessName}":\n\n` +
                                  `${replyData.replyText}\n\n` +
                                  `Tone: ${replyData.tone}\n` +
                                  `Sentiment: ${replyData.sentiment}\n` +
                                  `Confidence: ${Math.round(replyData.confidence * 100)}%`
                        }
                    ]
                };
                return response;
                
            } catch (error) {
                logger.error('Error in generate_reply tool:', error);
                
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Failed to generate reply: ${error instanceof Error ? error.message : 'Unknown error'}`
                        }
                    ],
                    isError: true
                };
            }
        }
    };
}