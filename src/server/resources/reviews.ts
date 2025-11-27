/**
 * Reviews Resource
 * Provides access to reviews for business locations
 * Supports both listing all locations' reviews and specific location reviews
 */

import { logger } from '../../utils/logger.js';
import type { IReviewService, GetResourceResult } from '../../types/index.js';

export interface ReviewsResource {
    uri: string;
    name: string;
    description: string;
    mimeType: string;
    handler: (uri: string) => Promise<GetResourceResult>;
}

export function createReviewsResource(reviewService: IReviewService): ReviewsResource {
    return {
        uri: 'reviews://{locationId}',
        name: 'Business Reviews',
        description: 'Access reviews for business locations. Use reviews://all for all locations or reviews://{locationId} for a specific location',
        mimeType: 'application/json',
        
        handler: async (uri: string): Promise<GetResourceResult> => {
            try {
                logger.info(`Fetching reviews resource: ${uri}`);
                
                // Parse the URI to determine what to fetch
                // reviews://all - fetch all locations and their reviews
                // reviews://locations/123 - fetch reviews for specific location
                
                if (uri === 'reviews://all') {
                    return await fetchAllReviews(reviewService);
                } else if (uri.startsWith('reviews://') && uri !== 'reviews://all') {
                    const locationId = uri.replace('reviews://', '');
                    return await fetchLocationReviews(reviewService, locationId);
                } else {
                    return {
                        contents: [
                            {
                                uri,
                                mimeType: 'text/plain',
                                text: 'Invalid URI. Use reviews://all or reviews://{locationId}'
                            }
                        ]
                    };
                }
                
            } catch (error) {
                logger.error('Error fetching reviews resource:', error);
                
                return {
                    contents: [
                        {
                            uri,
                            mimeType: 'text/plain',
                            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                        }
                    ]
                };
            }
        }
    };
}

/**
 * Fetch reviews for all locations
 */
async function fetchAllReviews(reviewService: IReviewService): Promise<GetResourceResult> {
    // First get all locations
    const locationsResult = await reviewService.listLocations();
    
    if (!locationsResult.success) {
        return {
            contents: [
                {
                    uri: 'reviews://all',
                    mimeType: 'text/plain',
                    text: `Error fetching locations: ${locationsResult.error}`
                }
            ]
        };
    }
    
    const locations = locationsResult.data!.locations;
    const allReviewsData: any[] = [];
    
    // Fetch reviews for each location
    for (const location of locations) {
        const reviewsResult = await reviewService.getReviews(location.name);
        
        if (reviewsResult.success && reviewsResult.data) {
            allReviewsData.push({
                location: {
                    name: location.name,
                    displayName: location.locationName,
                    address: location.address
                },
                reviews: reviewsResult.data.reviews.map(review => ({
                    id: review.reviewId,
                    rating: review.starRating,
                    text: review.comment,
                    author: review.reviewer.displayName,
                    isAnonymous: review.reviewer.isAnonymous,
                    createTime: review.createTime,
                    hasReply: !!review.reviewReply
                })),
                totalReviews: reviewsResult.data.totalSize,
                unrepliedCount: reviewsResult.data.reviews.length
            });
        }
    }
    
    const summary = {
        totalLocations: locations.length,
        totalUnrepliedReviews: allReviewsData.reduce((sum, loc) => sum + loc.unrepliedCount, 0),
        locations: allReviewsData
    };
    
    logger.info(`Retrieved reviews for ${locations.length} location(s), ${summary.totalUnrepliedReviews} unreplied`);
    
    return {
        contents: [
            {
                uri: 'reviews://all',
                mimeType: 'application/json',
                text: JSON.stringify(summary, null, 2)
            }
        ]
    };
}

/**
 * Fetch reviews for a specific location
 */
async function fetchLocationReviews(reviewService: IReviewService, locationName: string): Promise<GetResourceResult> {
    const reviewsResult = await reviewService.getReviews(locationName);
    
    if (!reviewsResult.success) {
        return {
            contents: [
                {
                    uri: `reviews://locations/${locationName}`,
                    mimeType: 'text/plain',
                    text: `Error fetching reviews: ${reviewsResult.error}`
                }
            ]
        };
    }
    
    const { reviews, totalSize } = reviewsResult.data!;
    
    const formattedData = {
        locationName,
        totalReviews: totalSize,
        unrepliedCount: reviews.length,
        reviews: reviews.map(review => ({
            id: review.reviewId,
            rating: review.starRating,
            text: review.comment,
            author: review.reviewer.displayName,
            isAnonymous: review.reviewer.isAnonymous,
            createTime: review.createTime,
            updateTime: review.updateTime,
            hasReply: !!review.reviewReply
        }))
    };
    
    logger.info(`Retrieved ${reviews.length} unreplied reviews for location ${locationName}`);
    
    return {
        contents: [
            {
                uri: `reviews://${locationName}`,
                mimeType: 'application/json',
                text: JSON.stringify(formattedData, null, 2)
            }
        ]
    };
}
