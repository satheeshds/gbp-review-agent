/**
 * Review Management Service
 * Handles Google My Business API interactions for review management
 */

import { google } from 'googleapis';
import { GoogleAuthService } from './googleAuth.js';
import { GoogleMyBusinessApiClient } from './apiClient.js';
import { logger } from '../utils/logger.js';
import { DEFAULTS, ERROR_CODES } from '../utils/constants.js';
import { buildFullLocationPath, buildReviewPath, logPathResolution } from '../utils/pathHelpers.js';
import { mapApiReviewToGoogleReview, mapApiLocationToBusinessLocation, filterUnrepliedReviews, extractCategories } from '../utils/mappers.js';
import type { 
    BusinessLocation,
    BusinessProfile,
    GoogleReview, 
    ReviewReply,
    ListLocationsResponse,
    GetReviewsResponse,
    PostReplyResponse,
    ServiceResponse,
    IReviewService,
    GoogleReviewStat,
    GoogleReviewDayStat,
    GoogleReviewShort
} from '../types/index.js';

export class ReviewService implements IReviewService {
    private mybusinessbusinessinformation: any;
    private mybusinessaccountmanagement: any;
    private apiClient: GoogleMyBusinessApiClient;
    
    constructor(private authService: GoogleAuthService) {
        // Initialize Google My Business API clients
        const auth = this.authService.getAuthenticatedClient();
        this.mybusinessbusinessinformation = google.mybusinessbusinessinformation({ version: 'v1', auth });
        this.mybusinessaccountmanagement = google.mybusinessaccountmanagement({ version: 'v1', auth });
        this.apiClient = new GoogleMyBusinessApiClient(authService);
    }
    
    /**
     * Resolves a location name to its full path
     * @private
     */
    private async resolveLocationPath(locationName: string): Promise<string> {
        if (locationName.includes('accounts/')) {
            return locationName;
        }
        
        const account = await this.apiClient.getFirstAccount();
        return buildFullLocationPath(locationName, account.name);
    }
    
    /**
     * List all business locations for the authenticated account
     */
    async listLocations(): Promise<ServiceResponse<ListLocationsResponse>> {
        try {
            await this.authService.refreshTokenIfNeeded();
            
            logger.debug('Fetching business locations...');
            
            // First, get the accounts
            const accountsResponse = await this.mybusinessaccountmanagement.accounts.list({
                pageSize: 100
            });
            
            const accounts = accountsResponse.data.accounts || [];
            
            if (accounts.length === 0) {
                return {
                    success: false,
                    error: 'No business accounts found. Please ensure your Google account has a Google Business Profile.'
                };
            }
            
            logger.debug(`Found ${accounts.length} business account(s)`);
            
            // Collect locations from all accounts
            const allLocations: BusinessLocation[] = [];
            
            for (const account of accounts) {
                const accountName = account.name;
                logger.debug(`Fetching locations for account: ${accountName}`);
                
                try {
                    const locationsResponse = await this.mybusinessbusinessinformation.accounts.locations.list({
                        parent: accountName,
                        readMask: 'name,title,storefrontAddress,websiteUri,phoneNumbers'
                    });
                    
                    const locations = (locationsResponse.data.locations || []).map((location: any) => 
                        mapApiLocationToBusinessLocation(location)
                    );
                    
                    allLocations.push(...locations);
                } catch (locationError: any) {
                    logger.warn(`Error fetching locations for account ${accountName}:`, locationError.message);
                }
            }
            
            logger.info(`Found ${allLocations.length} business location(s) total`);
            
            return {
                success: true,
                data: {
                    locations: allLocations,
                    nextPageToken: undefined
                }
            };
            
        } catch (error: any) {
            logger.error('Error listing locations:', error);
            return {
                success: false,
                error: error.message || 'Failed to fetch business locations',
                errorCode: ERROR_CODES.LOCATIONS_FETCH_ERROR
            };
        }
    }
    
    /**
     * Get reviews for a specific business location
     */
    async getReviews(locationName: string, pageSize = DEFAULTS.PAGE_SIZE, pageToken?: string): Promise<ServiceResponse<GetReviewsResponse>> {
        try {
            await this.authService.refreshTokenIfNeeded();
            
            logger.debug(`Fetching reviews for location: ${locationName}`);
            
            // Build the full path
            const fullLocationPath = await this.resolveLocationPath(locationName);
            logPathResolution(locationName, fullLocationPath, 'getReviews');
            
            // Fetch reviews using API client
            const params: Record<string, any> = { pageSize };
            if (pageToken) {
                params.pageToken = pageToken;
            }
            
            const data = await this.apiClient.get<any>(
                `${fullLocationPath}/reviews`,
                params
            );
            
            logger.debug(`API Response:`, JSON.stringify(data, null, 2));
            
            // Map and filter reviews
            const allReviews: GoogleReview[] = (data.reviews || []).map(mapApiReviewToGoogleReview);
            
            return {
                success: true,
                data: {
                    reviews: allReviews,
                    nextPageToken: data.nextPageToken,
                    totalSize: data.totalReviewCount || allReviews.length
                }
            };
            
        } catch (error: any) {
            logger.error('Error fetching reviews:', error);
            return {
                success: false,
                error: error.message || 'Failed to fetch reviews',
                errorCode: ERROR_CODES.REVIEWS_FETCH_ERROR
            };
        }
    }
    
    async getReviewStats(locationName: string): Promise<ServiceResponse<GoogleReviewDayStat[]>> {
        const allReviews: GoogleReviewShort[] = [];
        
        // Fetch all reviews with pagination
        let pageToken: string | undefined = undefined;
        let reviewsResult = await this.getReviews(locationName);
        
        while (reviewsResult.success && reviewsResult.data) {
            allReviews.push(...reviewsResult.data.reviews);
            pageToken = reviewsResult.data.nextPageToken;
            
            if (!pageToken) break;
            
            reviewsResult = await this.getReviews(locationName, DEFAULTS.PAGE_SIZE, pageToken);
        }
        
        if (!reviewsResult.success) {
            return {
                success: false,
                error: reviewsResult.error,
                errorCode: reviewsResult.errorCode
            };
        }
        
        // Group reviews by date (YYYY-MM-DD)
        const reviewsByDate = new Map<string, GoogleReviewShort[]>();
        
        for (const review of allReviews) {
            const date = review.createTime.split('T')[0]; // Extract YYYY-MM-DD
            if (!reviewsByDate.has(date)) {
                reviewsByDate.set(date, []);
            }
            reviewsByDate.get(date)!.push(review);
        }
        
        // Calculate statistics for each day
        const dayStats: GoogleReviewDayStat[] = [];
        
        for (const [date, reviews] of reviewsByDate.entries()) {
            // Map star ratings to numeric values
            const ratings = reviews.map(r => {
                switch (r.starRating) {
                    case 'ONE': return 1;
                    case 'TWO': return 2;
                    case 'THREE': return 3;
                    case 'FOUR': return 4;
                    case 'FIVE': return 5;
                    default: return 0;
                }
            });
            
            // Calculate average rating
            const averageRating = ratings.length > 0 
                ? ratings.reduce((sum, rating) => sum + rating, 0 as number) / ratings.length 
                : 0;
            
            // Build rating distribution
            const ratingDistribution = {
                ONE: reviews.filter(r => r.starRating === 'ONE').length,
                TWO: reviews.filter(r => r.starRating === 'TWO').length,
                THREE: reviews.filter(r => r.starRating === 'THREE').length,
                FOUR: reviews.filter(r => r.starRating === 'FOUR').length,
                FIVE: reviews.filter(r => r.starRating === 'FIVE').length
            };
            
            // Extract comments
            const comments = reviews
                .filter(r => r.comment && r.comment.trim().length > 0)
                .map(r => r.comment!)
                .filter((comment): comment is string => comment !== undefined);
            
            dayStats.push({
                date,
                stat: {
                    totalReviewCount: reviews.length,
                    averageRating: Math.round(averageRating * 10) / 10,
                    ratingDistribution,
                    comments: comments
                }
            });
        }
        
        // Sort by date descending (most recent first)
        dayStats.sort((a, b) => b.date.localeCompare(a.date));
        
        logger.info(`Generated stats for ${dayStats.length} days from ${allReviews.length} reviews`);
        
        return {
            success: true,
            data: dayStats
        };
    }

    async getUnrepliedReviews(locationName: string, pageSize = DEFAULTS.PAGE_SIZE, pageToken?: string): Promise<ServiceResponse<GoogleReview[]>> {
        const reviewsResult = await this.getReviews(locationName, pageSize, pageToken);
        if (!reviewsResult.success) {
            return {
                success: false,
                error: reviewsResult.error,
                errorCode: reviewsResult.errorCode
            };
        }
        const reviews = filterUnrepliedReviews(reviewsResult.data?.reviews || []);
            
        // If no reviews without replies found but there's a next page, fetch it recursively
        if (reviews.length === 0 && reviewsResult.data?.nextPageToken) {
            logger.debug(`No reviews without replies on this page, fetching next page...`);
            return this.getUnrepliedReviews(locationName, pageSize, reviewsResult.data.nextPageToken);
        }

        return {
            success: true,
            data: reviewsResult.data?.reviews || []
        };
    }
    
    /**
     * Post a reply to a specific review
     */
    async postReply(locationName: string, reviewId: string, replyText: string): Promise<ServiceResponse<PostReplyResponse>> {
        try {
            await this.authService.refreshTokenIfNeeded();
            
            logger.debug(`Posting reply to review ${reviewId} for location ${locationName}`);
            
            // Build the full path
            const fullLocationPath = await this.resolveLocationPath(locationName);
            const reviewPath = buildReviewPath(fullLocationPath, reviewId);
            
            logPathResolution(locationName, fullLocationPath, 'postReply');
            logger.debug(`Review path: ${reviewPath}`);
            
            // Post the reply using API client
            const responseData = await this.apiClient.put<any>(
                `${reviewPath}/reply`,
                { comment: replyText }
            );
            
            logger.debug(`API Response:`, JSON.stringify(responseData, null, 2));
            
            const postedAt = responseData.updateTime || new Date().toISOString();
            
            logger.info(`✅ Reply posted successfully to review ${reviewId}`);
            
            return {
                success: true,
                data: {
                    success: true,
                    replyId: reviewId,
                    postedAt
                }
            };
            
        } catch (error: any) {
            logger.error('Error posting reply:', error);
            return {
                success: false,
                error: error.message || 'Failed to post reply',
                errorCode: ERROR_CODES.REPLY_POST_ERROR
            };
        }
    }
    
    /**
     * Get business profile information
     */
    async getBusinessProfile(locationName?: string): Promise<ServiceResponse<BusinessProfile>> {
        try {
            await this.authService.refreshTokenIfNeeded();
            
            let targetLocation = locationName;
            
            // If no location specified, get the first available location
            if (!targetLocation) {
                const locationsResult = await this.listLocations();
                if (!locationsResult.success || !locationsResult.data?.locations.length) {
                    return {
                        success: false,
                        error: 'No business locations found',
                        errorCode: ERROR_CODES.NO_LOCATIONS_ERROR
                    };
                }
                targetLocation = locationsResult.data.locations[0].name;
            }
            
            // Build full path
            const fullLocationPath = await this.resolveLocationPath(targetLocation);
            logPathResolution(targetLocation, fullLocationPath, 'getBusinessProfile');
            
            logger.debug(`Fetching business profile for location: ${fullLocationPath}`);
            
            const response = await this.mybusinessbusinessinformation.accounts.locations.get({
                name: fullLocationPath
            });
            
            const location = response.data;
            
            logger.debug(`Location details:`, JSON.stringify(location, null, 2));
            
            // Build business profile with enhanced information
            const businessProfile: BusinessProfile = {
                ...mapApiLocationToBusinessLocation(location),
                businessType: location.primaryCategory?.displayName || 'business',
                language: location.languageCode || 'en',
                description: location.title || '',
                categories: extractCategories(location)
            };
            
            logger.info(`Business profile fetched for ${fullLocationPath}`);
            
            return {
                success: true,
                data: businessProfile
            };
            
        } catch (error: any) {
            logger.error('Error fetching business profile:', error);
            return {
                success: false,
                error: error.message || 'Failed to fetch business profile',
                errorCode: ERROR_CODES.PROFILE_FETCH_ERROR
            };
        }
    }
}