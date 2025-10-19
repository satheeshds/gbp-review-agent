/**
 * List Locations Tool
 * Fetches all business locations associated with the authenticated Google account
 */

import { z } from 'zod';
import { logger } from '../../utils/logger.js';
import type { IReviewService } from '../../types/index.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export interface ListLocationsTool {
    schema: {
        title: string;
        description: string;
        inputSchema: Record<string, never>;
        outputSchema: any;
    };
    handler: (args: any) => Promise<CallToolResult>;
}

export function createListLocationsTool(reviewService: IReviewService): ListLocationsTool {
    return {
        schema: {
            title: 'List Business Locations',
            description: 'Fetch all business locations associated with the authenticated Google Business Profile account',
            inputSchema: {},
            outputSchema: {
                locations: z.array(z.object({
                    name: z.string(),
                    locationName: z.string(),
                    primaryPhone: z.string().optional(),
                    websiteUri: z.string().optional(),
                    address: z.object({
                        addressLines: z.array(z.string()),
                        locality: z.string(),
                        administrativeArea: z.string(),
                        postalCode: z.string(),
                        regionCode: z.string()
                    }).optional()
                })),
                nextPageToken: z.string().optional(),
                totalCount: z.number()
            }
        },
        
        handler: async (args: any): Promise<CallToolResult> => {
            try {
                logger.info('Executing list_locations tool');
                
                const result = await reviewService.listLocations();
                
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
                
                const locations = result.data?.locations || [];
                const response = {
                    locations,
                    nextPageToken: result.data?.nextPageToken,
                    totalCount: locations.length
                };
                
                logger.info(`Successfully listed ${locations.length} business locations`);
                
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Found ${locations.length} business location(s):\n\n${
                                locations.map((loc, index) => 
                                    `${index + 1}. ${loc.locationName}\n` +
                                    `   Phone: ${loc.primaryPhone || 'Not provided'}\n` +
                                    `   Website: ${loc.websiteUri || 'Not provided'}\n` +
                                    (loc.address ? 
                                        `   Address: ${loc.address.addressLines.join(', ')}, ${loc.address.locality}, ${loc.address.administrativeArea} ${loc.address.postalCode}\n` 
                                        : '   Address: Not provided\n')
                                ).join('\n')
                            }`
                        }
                    ],
                    structuredContent: response
                };
                
            } catch (error) {
                logger.error('Error in list_locations tool:', error);
                
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Failed to list business locations: ${error instanceof Error ? error.message : 'Unknown error'}`
                        }
                    ],
                    isError: true
                };
            }
        }
    };
}