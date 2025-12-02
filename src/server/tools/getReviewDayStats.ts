/**
 * Get Review Day Stats Tool
 * Fetches review statistics grouped by day for a specific business location
 */

import { z } from 'zod';
import { logger } from '../../utils/logger.js';
import type { IReviewService } from '../../types/index.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export interface GetReviewDayStatsTool {
    schema: {
        title: string;
        description: string;
        inputSchema: {
            locationName: any;
        };
        outputSchema: any;
    };
    handler: (args: any) => Promise<CallToolResult>;
}

export function createGetReviewDayStatsTool(reviewService: IReviewService): GetReviewDayStatsTool {
    return {
        schema: {
            title: 'Get Review Statistics by Day',
            description: 'Fetch review statistics grouped by day for a specific business location. Returns daily aggregates including review count, average rating, rating distribution, and comments.',
            inputSchema: {
                locationName: z.string().describe('The full resource name of the business location (e.g., accounts/123/locations/456)')
            },
            outputSchema: {
                dayStats: z.array(z.object({
                    date: z.string().describe('Date in YYYY-MM-DD format'),
                    stat: z.object({
                        totalReviewCount: z.number(),
                        averageRating: z.number(),
                        ratingDistribution: z.object({
                            ONE: z.number(),
                            TWO: z.number(),
                            THREE: z.number(),
                            FOUR: z.number(),
                            FIVE: z.number()
                        }),
                        comments: z.array(z.string())
                    })
                }))
            }
        },
        
        handler: async (args: any): Promise<CallToolResult> => {
            try {
                logger.info('Executing get_review_day_stats tool', { locationName: args.locationName });
                
                const { locationName } = args;
                
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
                
                const result = await reviewService.getReviewStats(locationName);
                
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
                
                const dayStats = result.data || [];
                
                logger.info(`Successfully fetched statistics for ${dayStats.length} days for location ${locationName}`);
                
                // Format statistics for display
                let statsText = `Review Statistics for ${locationName}\n`;
                statsText += `Total days with reviews: ${dayStats.length}\n\n`;
                
                if (dayStats.length > 0) {
                    // Calculate overall stats
                    const totalReviews = dayStats.reduce((sum, day) => sum + day.stat.totalReviewCount, 0);
                    const overallAverage = dayStats.reduce((sum, day) => {
                        return sum + (day.stat.averageRating * day.stat.totalReviewCount);
                    }, 0) / totalReviews;
                    
                    statsText += `📊 Overall Summary:\n`;
                    statsText += `   Total Reviews: ${totalReviews}\n`;
                    statsText += `   Average Rating: ${overallAverage.toFixed(1)} ⭐\n\n`;
                    
                    statsText += `📅 Daily Breakdown:\n\n`;
                    
                    // Show top 10 most recent days
                    dayStats.slice(0, 10).forEach((dayStat, index) => {
                        const stars = '⭐'.repeat(Math.round(dayStat.stat.averageRating));
                        statsText += `${index + 1}. ${dayStat.date}\n`;
                        statsText += `   Reviews: ${dayStat.stat.totalReviewCount}\n`;
                        statsText += `   Average: ${dayStat.stat.averageRating} ${stars}\n`;
                        statsText += `   Distribution: `;
                        statsText += `5★:${dayStat.stat.ratingDistribution.FIVE} `;
                        statsText += `4★:${dayStat.stat.ratingDistribution.FOUR} `;
                        statsText += `3★:${dayStat.stat.ratingDistribution.THREE} `;
                        statsText += `2★:${dayStat.stat.ratingDistribution.TWO} `;
                        statsText += `1★:${dayStat.stat.ratingDistribution.ONE}\n`;
                        
                        if (dayStat.stat.comments.length > 0) {
                            statsText += `   Sample Comments:\n`;
                            dayStat.stat.comments.slice(0, 2).forEach(comment => {
                                const truncated = comment.length > 60 
                                    ? comment.substring(0, 60) + '...' 
                                    : comment;
                                statsText += `     - "${truncated}"\n`;
                            });
                        }
                        statsText += '\n';
                    });
                    
                    if (dayStats.length > 10) {
                        statsText += `... and ${dayStats.length - 10} more days\n`;
                    }
                } else {
                    statsText += 'No reviews found for this location.\n';
                }
                
                return {
                    content: [
                        {
                            type: 'text',
                            text: statsText
                        }
                    ],
                    structuredContent: { dayStats }
                };
                
            } catch (error) {
                logger.error('Error in get_review_day_stats tool:', error);
                
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Failed to fetch review statistics: ${error instanceof Error ? error.message : 'Unknown error'}`
                        }
                    ],
                    isError: true
                };
            }
        }
    };
}
