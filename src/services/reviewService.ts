/**
 * Review Management Service
 * Handles Google My Business API interactions for review management
 */

import { google } from 'googleapis';
import { GoogleAuthService } from './googleAuth.js';
import { logger } from '../utils/logger.js';
import type { 
    BusinessLocation,
    BusinessProfile,
    GoogleReview, 
    ReviewReply,
    ListLocationsResponse,
    GetReviewsResponse,
    PostReplyResponse,
    ServiceResponse,
    IReviewService
} from '../types/index.js';

export class ReviewService implements IReviewService {
    private mybusinessbusinessinformation: any;
    private mybusinessaccountmanagement: any;
    
    constructor(private authService: GoogleAuthService) {
        // Initialize Google My Business API clients
        const auth = this.authService.getAuthenticatedClient();
        this.mybusinessbusinessinformation = google.mybusinessbusinessinformation({ version: 'v1', auth });
        this.mybusinessaccountmanagement = google.mybusinessaccountmanagement({ version: 'v1', auth });
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
                    
                    const locations = (locationsResponse.data.locations || []).map((location: any) => ({
                        name: location.name,
                        locationName: location.title || location.name,
                        primaryPhone: location.phoneNumbers?.[0]?.phoneNumber,
                        websiteUri: location.websiteUri,
                        address: location.storefrontAddress ? {
                            addressLines: location.storefrontAddress.addressLines || [],
                            locality: location.storefrontAddress.locality || '',
                            administrativeArea: location.storefrontAddress.administrativeArea || '',
                            postalCode: location.storefrontAddress.postalCode || '',
                            regionCode: location.storefrontAddress.regionCode || ''
                        } : undefined
                    }));
                    
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
                errorCode: 'LOCATIONS_FETCH_ERROR'
            };
        }
    }
    
    /**
     * Get reviews for a specific business location
     */
    async getReviews(locationName: string, pageSize = 50, pageToken?: string): Promise<ServiceResponse<GetReviewsResponse>> {
        try {
            await this.authService.refreshTokenIfNeeded();
            
            logger.debug(`Fetching reviews for location: ${locationName}`);
            
            // Build the full path: accounts/{accountId}/locations/{locationId}
            let fullLocationPath = locationName;
            if (!locationName.includes('accounts/')) {
                const accountsResponse = await this.mybusinessaccountmanagement.accounts.list({
                    pageSize: 1
                });
                const accounts = accountsResponse.data.accounts || [];
                if (accounts.length > 0) {
                    fullLocationPath = `${accounts[0].name}/${locationName}`;
                }
            }
            
            logger.debug(`Full location path: ${fullLocationPath}`);
            
            // Use direct HTTP request to Google My Business API v4
            const auth = this.authService.getAuthenticatedClient();
            const accessToken = (await auth.getAccessToken()).token;
            
            // Build URL with query parameters
            let url = `https://mybusiness.googleapis.com/v4/${fullLocationPath}/reviews?pageSize=${pageSize}`;
            if (pageToken) {
                url += `&pageToken=${pageToken}`;
            }
            
            logger.debug(`API Request URL: ${url}`);
            logger.debug(`Using Access Token: ${accessToken}`);
            
            const fetch = (await import('node-fetch')).default;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                logger.error(`API request failed: ${response.status} - ${errorText}`);
                throw new Error(`API request failed: ${response.status} - ${errorText}`);
            }
            
            const data: any = await response.json();
            
            logger.debug(`API Response:`, JSON.stringify(data, null, 2));
            
            const allReviews: GoogleReview[] = (data.reviews || []).map((review: any) => ({
                reviewId: review.reviewId || review.name?.split('/').pop() || '',
                reviewer: {
                    profilePhotoUrl: review.reviewer?.profilePhotoUrl,
                    displayName: review.reviewer?.displayName || 'Anonymous',
                    isAnonymous: review.reviewer?.isAnonymous || false
                },
                starRating: review.starRating || 'STAR_RATING_UNSPECIFIED',
                comment: review.comment || '',
                createTime: review.createTime || new Date().toISOString(),
                updateTime: review.updateTime || new Date().toISOString(),
                reviewReply: review.reviewReply ? {
                    comment: review.reviewReply.comment || '',
                    updateTime: review.reviewReply.updateTime || new Date().toISOString()
                } : undefined,
                name: review.name || ''
            }));
            
            // Filter out reviews that already have replies
            const reviews = allReviews.filter(review => !review.reviewReply);
            
            // If no reviews without replies found but there's a next page, fetch it recursively
            if (reviews.length === 0 && data.nextPageToken) {
                logger.debug(`No reviews without replies on this page, fetching next page...`);
                return this.getReviews(locationName, pageSize, data.nextPageToken);
            }
            
            logger.info(`Found ${reviews.length} reviews without replies out of ${allReviews.length} total reviews (total count: ${data.totalReviewCount || allReviews.length})`);
            
            return {
                success: true,
                data: {
                    reviews,
                    nextPageToken: data.nextPageToken,
                    totalSize: data.totalReviewCount || reviews.length
                }
            };
            
        } catch (error: any) {
            logger.error('Error fetching reviews:', error);
            return {
                success: false,
                error: error.message || 'Failed to fetch reviews',
                errorCode: 'REVIEWS_FETCH_ERROR'
            };
        }
    }
    
    /**
     * Post a reply to a specific review
     */
    async postReply(locationName: string, reviewId: string, replyText: string): Promise<ServiceResponse<PostReplyResponse>> {
        try {
            await this.authService.refreshTokenIfNeeded();
            
            logger.debug(`Posting reply to review ${reviewId} for location ${locationName}`);
            
            // Build the full path: accounts/{accountId}/locations/{locationId}
            let fullLocationPath = locationName;
            if (!locationName.includes('accounts/')) {
                const accountsResponse = await this.mybusinessaccountmanagement.accounts.list({
                    pageSize: 1
                });
                const accounts = accountsResponse.data.accounts || [];
                if (accounts.length > 0) {
                    fullLocationPath = `${accounts[0].name}/${locationName}`;
                }
            }
            
            // Build review path
            const reviewPath = `${fullLocationPath}/reviews/${reviewId}`;
            logger.debug(`Review path: ${reviewPath}`);
            
            // Use direct HTTP request to Google My Business API v4 for posting reply
            const auth = this.authService.getAuthenticatedClient();
            const accessToken = (await auth.getAccessToken()).token;
            
            const url = `https://mybusiness.googleapis.com/v4/${reviewPath}/reply`;
            
            const replyData = {
                comment: replyText
            };
            
            logger.debug(`API Request URL: ${url}`);
            logger.debug(`Reply data:`, JSON.stringify(replyData, null, 2));
            
            const fetch = (await import('node-fetch')).default;
            
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(replyData)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                logger.error(`API request failed: ${response.status} - ${errorText}`);
                throw new Error(`API request failed: ${response.status} - ${errorText}`);
            }
            
            const responseData: any = await response.json();
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
                errorCode: 'REPLY_POST_ERROR'
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
                        errorCode: 'NO_LOCATIONS_ERROR'
                    };
                }
                targetLocation = locationsResult.data.locations[0].name;
            }
            
            // Build full path if needed
            let fullLocationPath = targetLocation;
            if (!targetLocation.includes('accounts/')) {
                const accountsResponse = await this.mybusinessaccountmanagement.accounts.list({
                    pageSize: 1
                });
                const accounts = accountsResponse.data.accounts || [];
                if (accounts.length > 0) {
                    fullLocationPath = `${accounts[0].name}/${targetLocation}`;
                }
            }
            
            logger.debug(`Fetching business profile for location: ${fullLocationPath}`);
            
            const response = await this.mybusinessbusinessinformation.accounts.locations.get({
                name: fullLocationPath
            });
            
            const location = response.data;
            
            logger.debug(`Location details:`, JSON.stringify(location, null, 2));
            
            // Enhance with business profile specific information
            const businessProfile: BusinessProfile = {
                name: location.name || '',
                locationName: location.title || location.name || '',
                primaryPhone: location.phoneNumbers?.[0]?.phoneNumber,
                websiteUri: location.websiteUri,
                address: location.storefrontAddress ? {
                    addressLines: location.storefrontAddress.addressLines || [],
                    locality: location.storefrontAddress.locality || '',
                    administrativeArea: location.storefrontAddress.administrativeArea || '',
                    postalCode: location.storefrontAddress.postalCode || '',
                    regionCode: location.storefrontAddress.regionCode || ''
                } : undefined,
                businessType: location.primaryCategory?.displayName || 'business',
                language: location.languageCode || 'en',
                description: location.title || '',
                categories: location.additionalCategories?.map((cat: any) => cat.displayName).filter(Boolean) || []
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
                errorCode: 'PROFILE_FETCH_ERROR'
            };
        }
    }
}