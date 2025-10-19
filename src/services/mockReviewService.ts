/**
 * Mock Google Business Profile Service for Testing
 * Simulates Google My Business API responses without requiring actual API access
 */

import { logger } from '../utils/logger.js';
import type { 
    BusinessLocation,
    BusinessProfile,
    GoogleReview,
    ServiceResponse,
    ListLocationsResponse,
    GetReviewsResponse,
    PostReplyResponse,
    IReviewService
} from '../types/index.js';

export class MockReviewService implements IReviewService {
    private mockLocations: BusinessLocation[] = [
        {
            name: 'accounts/mock123/locations/loc456',
            locationName: 'The Great Coffee House',
            primaryPhone: '+1-555-0123',
            websiteUri: 'https://greatcoffeehouse.com',
            address: {
                addressLines: ['123 Main Street'],
                locality: 'San Francisco',
                administrativeArea: 'CA',
                postalCode: '94102',
                regionCode: 'US'
            }
        },
        {
            name: 'accounts/mock123/locations/loc789',
            locationName: 'Downtown Bakery',
            primaryPhone: '+1-555-0456',
            websiteUri: 'https://downtownbakery.com',
            address: {
                addressLines: ['456 Market Street'],
                locality: 'San Francisco',
                administrativeArea: 'CA',
                postalCode: '94105',
                regionCode: 'US'
            }
        }
    ];

    private mockReviews: GoogleReview[] = [
        {
            reviewId: 'review_001',
            reviewer: {
                displayName: 'Sarah Johnson',
                profilePhotoUrl: 'https://example.com/photos/sarah.jpg'
            },
            starRating: 'FIVE',
            comment: 'Absolutely amazing coffee and pastries! The staff was incredibly friendly and the atmosphere is perfect for working. Will definitely be back!',
            createTime: '2024-10-15T14:30:00Z',
            updateTime: '2024-10-15T14:30:00Z'
        },
        {
            reviewId: 'review_002',
            reviewer: {
                displayName: 'Mike Chen',
                profilePhotoUrl: 'https://example.com/photos/mike.jpg'
            },
            starRating: 'TWO',
            comment: 'Disappointed with the service today. Had to wait 20 minutes for a simple coffee order and the barista seemed uninterested. The coffee was lukewarm when I finally got it.',
            createTime: '2024-10-14T09:15:00Z',
            updateTime: '2024-10-14T09:15:00Z'
        },
        {
            reviewId: 'review_003',
            reviewer: {
                displayName: 'Emily Rodriguez'
            },
            starRating: 'FOUR',
            comment: 'Great selection of pastries and the coffee is really good. Only complaint is that it gets quite noisy during peak hours.',
            createTime: '2024-10-13T16:45:00Z',
            updateTime: '2024-10-13T16:45:00Z'
        },
        {
            reviewId: 'review_004',
            reviewer: {
                displayName: 'David Thompson'
            },
            starRating: 'THREE',
            comment: 'It\'s okay. Nothing special but not bad either. Coffee is decent, prices are reasonable.',
            createTime: '2024-10-12T11:20:00Z',
            updateTime: '2024-10-12T11:20:00Z'
        },
        {
            reviewId: 'review_005',
            reviewer: {
                displayName: 'Lisa Parker'
            },
            starRating: 'FIVE',
            comment: 'This place is a hidden gem! The latte art is incredible and the homemade cookies are to die for. Highly recommend!',
            createTime: '2024-10-11T13:10:00Z',
            updateTime: '2024-10-11T13:10:00Z',
            reviewReply: {
                comment: 'Thank you so much for the wonderful review, Lisa! We\'re thrilled you enjoyed our latte art and cookies. See you soon!',
                updateTime: '2024-10-11T14:00:00Z'
            }
        }
    ];

    private isAuthenticated = false;

    constructor() {
        logger.info('Initializing Mock Review Service for testing');
        // Instant authentication for testing
        this.isAuthenticated = true;
        logger.info('Mock authentication completed successfully');
    }

    /**
     * Mock authentication check
     */
    private checkAuth(): boolean {
        if (!this.isAuthenticated) {
            logger.warn('Mock authentication not ready yet');
        }
        return this.isAuthenticated;
    }

    /**
     * List business locations (mock implementation)
     */
    async listLocations(): Promise<ServiceResponse<ListLocationsResponse>> {
        try {
            if (!this.checkAuth()) {
                return {
                    success: false,
                    error: 'Authentication required',
                    errorCode: 'MOCK_AUTH_REQUIRED'
                };
            }

            logger.info('Fetching mock business locations');
            
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 200));

            return {
                success: true,
                data: {
                    locations: this.mockLocations,
                    nextPageToken: undefined
                }
            };

        } catch (error) {
            logger.error('Mock error in listLocations:', error);
            return {
                success: false,
                error: 'Mock API error',
                errorCode: 'MOCK_API_ERROR'
            };
        }
    }

    /**
     * Get reviews for a location (mock implementation)
     */
    async getReviews(locationName: string, pageSize = 50, pageToken?: string): Promise<ServiceResponse<GetReviewsResponse>> {
        try {
            if (!this.checkAuth()) {
                return {
                    success: false,
                    error: 'Authentication required',
                    errorCode: 'MOCK_AUTH_REQUIRED'
                };
            }

            logger.info(`Fetching mock reviews for location: ${locationName}`);

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 300));

            // Validate location exists
            const locationExists = this.mockLocations.some(loc => loc.name === locationName);
            if (!locationExists) {
                return {
                    success: false,
                    error: 'Location not found',
                    errorCode: 'LOCATION_NOT_FOUND'
                };
            }

            // Simple pagination simulation
            const startIndex = pageToken ? parseInt(pageToken) : 0;
            const endIndex = Math.min(startIndex + pageSize, this.mockReviews.length);
            const paginatedReviews = this.mockReviews.slice(startIndex, endIndex);
            const nextPageToken = endIndex < this.mockReviews.length ? endIndex.toString() : undefined;

            return {
                success: true,
                data: {
                    reviews: paginatedReviews,
                    nextPageToken,
                    totalSize: this.mockReviews.length
                }
            };

        } catch (error) {
            logger.error('Mock error in getReviews:', error);
            return {
                success: false,
                error: 'Mock API error',
                errorCode: 'MOCK_API_ERROR'
            };
        }
    }

    /**
     * Post reply to review (mock implementation)
     */
    async postReply(locationName: string, reviewId: string, replyText: string): Promise<ServiceResponse<PostReplyResponse>> {
        try {
            if (!this.checkAuth()) {
                return {
                    success: false,
                    error: 'Authentication required',
                    errorCode: 'MOCK_AUTH_REQUIRED'
                };
            }

            logger.info(`Posting mock reply to review ${reviewId} for location ${locationName}`);

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 500));

            // Validate location exists
            const locationExists = this.mockLocations.some(loc => loc.name === locationName);
            if (!locationExists) {
                return {
                    success: false,
                    error: 'Location not found',
                    errorCode: 'LOCATION_NOT_FOUND'
                };
            }

            // Validate review exists
            const reviewExists = this.mockReviews.some(review => review.reviewId === reviewId);
            if (!reviewExists) {
                return {
                    success: false,
                    error: 'Review not found',
                    errorCode: 'REVIEW_NOT_FOUND'
                };
            }

            // Check if review already has a reply
            const review = this.mockReviews.find(r => r.reviewId === reviewId);
            if (review?.reviewReply) {
                return {
                    success: false,
                    error: 'Review already has a reply',
                    errorCode: 'REPLY_ALREADY_EXISTS'
                };
            }

            // Simulate successful reply posting
            if (review) {
                review.reviewReply = {
                    comment: replyText,
                    updateTime: new Date().toISOString()
                };
            }

            return {
                success: true,
                data: {
                    success: true,
                    replyId: `reply_${Date.now()}`,
                    postedAt: new Date().toISOString()
                }
            };

        } catch (error) {
            logger.error('Mock error in postReply:', error);
            return {
                success: false,
                error: 'Mock API error',
                errorCode: 'MOCK_API_ERROR'
            };
        }
    }

    /**
     * Get business profile (mock implementation)
     */
    async getBusinessProfile(locationName?: string): Promise<ServiceResponse<BusinessProfile>> {
        try {
            if (!this.checkAuth()) {
                return {
                    success: false,
                    error: 'Authentication required',
                    errorCode: 'MOCK_AUTH_REQUIRED'
                };
            }

            const targetLocation = locationName || this.mockLocations[0].name;
            const location = this.mockLocations.find(loc => loc.name === targetLocation);

            if (!location) {
                return {
                    success: false,
                    error: 'Location not found',
                    errorCode: 'LOCATION_NOT_FOUND'
                };
            }

            logger.info(`Fetching mock business profile for ${targetLocation}`);

            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 250));

            const businessProfile: BusinessProfile = {
                ...location,
                businessType: 'restaurant',
                language: 'en',
                description: 'A cozy coffee house serving artisanal coffee and fresh pastries',
                categories: ['Coffee Shop', 'Bakery', 'Breakfast Restaurant'],
                hours: {
                    monday: { open: '07:00', close: '19:00' },
                    tuesday: { open: '07:00', close: '19:00' },
                    wednesday: { open: '07:00', close: '19:00' },
                    thursday: { open: '07:00', close: '19:00' },
                    friday: { open: '07:00', close: '20:00' },
                    saturday: { open: '08:00', close: '20:00' },
                    sunday: { open: '08:00', close: '18:00' }
                }
            };

            return {
                success: true,
                data: businessProfile
            };

        } catch (error) {
            logger.error('Mock error in getBusinessProfile:', error);
            return {
                success: false,
                error: 'Mock API error',
                errorCode: 'MOCK_API_ERROR'
            };
        }
    }

    /**
     * Add a mock review (for testing purposes)
     */
    addMockReview(review: Partial<GoogleReview>): void {
        const newReview: GoogleReview = {
            reviewId: `review_${Date.now()}`,
            reviewer: {
                displayName: review.reviewer?.displayName || 'Test User'
            },
            starRating: review.starRating || 'FIVE',
            comment: review.comment || 'Test review comment',
            createTime: new Date().toISOString(),
            updateTime: new Date().toISOString(),
            ...review
        };

        this.mockReviews.unshift(newReview);
        logger.info(`Added mock review: ${newReview.reviewId}`);
    }

    /**
     * Get mock statistics (for testing dashboards)
     */
    getMockStatistics() {
        const totalReviews = this.mockReviews.length;
        const ratings = this.mockReviews.map(r => {
            switch (r.starRating) {
                case 'ONE': return 1;
                case 'TWO': return 2;
                case 'THREE': return 3;
                case 'FOUR': return 4;
                case 'FIVE': return 5;
                default: return 3;
            }
        });

        const averageRating = ratings.reduce((sum, rating) => sum + rating, 0) / totalReviews;
        const repliedCount = this.mockReviews.filter(r => r.reviewReply).length;

        return {
            totalReviews,
            averageRating: Math.round(averageRating * 10) / 10,
            repliedCount,
            replyRate: Math.round((repliedCount / totalReviews) * 100),
            ratingDistribution: {
                1: ratings.filter(r => r === 1).length,
                2: ratings.filter(r => r === 2).length,
                3: ratings.filter(r => r === 3).length,
                4: ratings.filter(r => r === 4).length,
                5: ratings.filter(r => r === 5).length
            }
        };
    }
}