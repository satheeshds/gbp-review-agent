/**
 * Getexport interface GetReviewsTool {
    schema: {
        title: string;
        description: string;
        inputSchema: {
            locationName: any;
            pageSize: any;
            pageToken: any;
        };
        outputSchema: any;
    };
    handler: (args: any) => Promise<CallToolResult>;
}
 * Fetches reviews for a specific business location
 */

import { z } from 'zod';
import { logger } from '../../utils/logger.js';
import type { ReviewService } from '../../services/reviewService.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { GetReviewsParams } from '../../types/index.js';

export interface GetReviewsTool {
    schema: {
        title: string;
        description: string;
        inputSchema: {
            locationName: any;
            pageSize?: any;
            pageToken?: any;
        };
        outputSchema: any;
    };
    handler: (params: GetReviewsParams) => Promise<CallToolResult>;
}

export function createGetReviewsTool(reviewService: ReviewService): GetReviewsTool {
    return {
        schema: {
            title: 'Get Business Reviews',
            description: 'Fetch reviews for a specific business location from Google Business Profile',
            inputSchema: {
                locationName: z.string().describe('The full resource name of the business location (e.g., accounts/123/locations/456)'),
                pageSize: z.number().optional().default(50).describe('Number of reviews to fetch (max 50)'),
                pageToken: z.string().optional().describe('Token for fetching the next page of results')
            },
            outputSchema: {
                reviews: z.array(z.object({
                    reviewId: z.string(),
                    reviewer: z.object({
                        profilePhotoUrl: z.string().optional(),
                        displayName: z.string()
                    }),
                    starRating: z.enum(['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE']),
                    comment: z.string().optional(),
                    createTime: z.string(),
                    updateTime: z.string(),
                    reviewReply: z.object({
                        comment: z.string(),
                        updateTime: z.string()
                    }).optional()
                })),
                nextPageToken: z.string().optional(),
                totalSize: z.number().optional()
            }
        },
        
        handler: async (args: any): Promise<CallToolResult> => {
            try {
                const params: GetReviewsParams = {
                    locationName: args.locationName,
                    pageSize: args.pageSize,
                    pageToken: args.pageToken
                };
                logger.info('Executing get_reviews tool', { locationName: params.locationName });
                
                const { locationName, pageSize = 50, pageToken } = params;
                
                // Validate inputs
                if (!locationName) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: 'Error: locationName is required'
                            }
                        ],
                        isError: true
                    };
                }
                
                if (pageSize > 50) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: 'Error: pageSize cannot exceed 50'
                            }
                        ],
                        isError: true
                    };
                }
                
                const result = await reviewService.getReviews(locationName, pageSize, pageToken);
                
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
                
                const reviews = result.data?.reviews || [];
                const response = {
                    reviews,
                    nextPageToken: result.data?.nextPageToken,
                    totalSize: result.data?.totalSize
                };
                
                logger.info(`Successfully fetched ${reviews.length} reviews for location ${locationName}`);
                
                // Format reviews for display
                const reviewsText = reviews.length > 0 
                    ? reviews.map((review, index) => {
                        const stars = '⭐'.repeat(parseInt(review.starRating.replace(/[^0-9]/g, '')) || 0);
                        return `${index + 1}. ${review.reviewer.displayName} - ${stars}\n` +
                               `   Review: ${review.comment || 'No comment provided'}\n` +
                               `   Date: ${new Date(review.createTime).toLocaleDateString()}\n` +
                               (review.reviewReply ? 
                                   `   Reply: ${review.reviewReply.comment}\n` +
                                   `   Reply Date: ${new Date(review.reviewReply.updateTime).toLocaleDateString()}\n`
                                   : '   No reply yet\n');
                      }).join('\n')
                    : 'No reviews found for this location.';
                
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Reviews for ${locationName}:\n\n${reviewsText}${
                                result.data?.nextPageToken ? '\n\nMore reviews available. Use the nextPageToken to fetch additional results.' : ''
                            }`
                        }
                    ],
                    structuredContent: response
                };
                
            } catch (error) {
                logger.error('Error in get_reviews tool:', error);
                
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Failed to fetch reviews: ${error instanceof Error ? error.message : 'Unknown error'}`
                        }
                    ],
                    isError: true
                };
            }
        }
    };
}