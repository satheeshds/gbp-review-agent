/**
 * Business Locations Resource
 * Provides access to all business locations for the authenticated account
 */

import { logger } from '../../utils/logger.js';
import type { IReviewService, GetResourceResult } from '../../types/index.js';

export interface LocationsResource {
    uri: string;
    name: string;
    description: string;
    mimeType: string;
    handler: () => Promise<GetResourceResult>;
}

export function createLocationsResource(reviewService: IReviewService): LocationsResource {
    return {
        uri: 'locations://list',
        name: 'Business Locations',
        description: 'List of all business locations associated with the authenticated Google Business Profile account',
        mimeType: 'application/json',
        
        handler: async (): Promise<GetResourceResult> => {
            try {
                logger.info('Fetching locations resource');
                
                const result = await reviewService.listLocations();
                
                if (!result.success) {
                    return {
                        contents: [
                            {
                                uri: 'locations://list',
                                mimeType: 'text/plain',
                                text: `Error: ${result.error}`
                            }
                        ]
                    };
                }
                
                const { locations } = result.data!;
                
                // Format locations for easy consumption
                const formattedData = {
                    totalCount: locations.length,
                    locations: locations.map(loc => ({
                        name: loc.name,
                        displayName: loc.locationName,
                        address: loc.address,
                        phone: loc.primaryPhone,
                        website: loc.websiteUri
                    }))
                };
                
                logger.info(`Successfully retrieved ${locations.length} location(s)`);
                
                return {
                    contents: [
                        {
                            uri: 'locations://list',
                            mimeType: 'application/json',
                            text: JSON.stringify(formattedData, null, 2)
                        }
                    ]
                };
                
            } catch (error) {
                logger.error('Error fetching locations resource:', error);
                
                return {
                    contents: [
                        {
                            uri: 'locations://list',
                            mimeType: 'text/plain',
                            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                        }
                    ]
                };
            }
        }
    };
}
