/**
 * Post Reply Tool
 * Posts a reply to a specific review on Google Business Profile
 */

import { z } from 'zod';
import { logger } from '../../utils/logger.js';
import type { IReviewService, PostReplyParams } from '../../types/index.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export interface PostReplyTool {
    schema: {
        title: string;
        description: string;
        inputSchema: {
            locationName: any;
            reviewId: any;
            replyText: any;
        };
        outputSchema: any;
    };
    handler: (args: any) => Promise<CallToolResult>;
}

export function createPostReplyTool(reviewService: IReviewService): PostReplyTool {
    return {
        schema: {
            title: 'Post Review Reply',
            description: 'Post a reply to a specific customer review on Google Business Profile',
            inputSchema: {
                locationName: z.string().describe('The full resource name of the business location'),
                reviewId: z.string().describe('The ID of the review to reply to'),
                replyText: z.string().min(1).max(4096).describe('The reply text to post (max 4096 characters)')
            },
            outputSchema: {
                success: z.boolean(),
                replyId: z.string().optional(),
                postedAt: z.string(),
                message: z.string()
            }
        },
        
        handler: async (args: any): Promise<CallToolResult> => {
            try {
                const params: PostReplyParams = {
                    locationName: args.locationName,
                    reviewId: args.reviewId,
                    replyText: args.replyText
                };
                logger.info('Executing post_reply tool', { 
                    locationName: params.locationName,
                    reviewId: params.reviewId,
                    replyLength: params.replyText.length
                });
                
                const { locationName, reviewId, replyText } = params;
                
                // Validate inputs
                if (!locationName?.trim()) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: 'Error: locationName is required and cannot be empty'
                            }
                        ],
                        isError: true
                    };
                }
                
                if (!reviewId?.trim()) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: 'Error: reviewId is required and cannot be empty'
                            }
                        ],
                        isError: true
                    };
                }
                
                if (!replyText?.trim()) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: 'Error: replyText is required and cannot be empty'
                            }
                        ],
                        isError: true
                    };
                }
                
                if (replyText.length > 4096) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: 'Error: replyText cannot exceed 4096 characters'
                            }
                        ],
                        isError: true
                    };
                }
                
                // Post the reply
                const result = await reviewService.postReply(locationName, reviewId, replyText);
                
                if (!result.success) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `Error: ${result.error}`
                            }
                        ],
                        isError: true
                    };
                }
                
                const postData = result.data!;
                const response = {
                    success: postData.success,
                    replyId: postData.replyId,
                    postedAt: postData.postedAt,
                    message: 'Reply posted successfully'
                };
                
                logger.info(`Successfully posted reply to review ${reviewId} for location ${locationName}`);
                
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Reply posted successfully!\n\n` +
                                  `**Location:** ${locationName}\n` +
                                  `**Review ID:** ${reviewId}\n` +
                                  `**Reply ID:** ${postData.replyId}\n` +
                                  `**Posted At:** ${new Date(postData.postedAt).toLocaleString()}\n\n` +
                                  `**Your Reply:**\n"${replyText}"\n\n` +
                                  `The reply is now visible to customers on Google Business Profile.`
                        }
                    ],
                    structuredContent: response
                };
                
            } catch (error) {
                logger.error('Error in post_reply tool:', error);
                
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Failed to post reply: ${error instanceof Error ? error.message : 'Unknown error'}`
                        }
                    ],
                    isError: true
                };
            }
        }
    };
}