/**
 * Data transformation utilities for Google My Business API responses
 */

import type { GoogleReview, BusinessLocation } from '../types/index.js';

/**
 * Maps raw API review data to GoogleReview type
 */
export function mapApiReviewToGoogleReview(review: any): GoogleReview {
    return {
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
    };
}

/**
 * Maps raw API location data to BusinessLocation type
 */
export function mapApiLocationToBusinessLocation(location: any): BusinessLocation {
    return {
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
    };
}

/**
 * Filters reviews to only include those without replies
 */
export function filterUnrepliedReviews(reviews: GoogleReview[]): GoogleReview[] {
    return reviews.filter(review => !review.reviewReply);
}

/**
 * Extracts categories from location data
 */
export function extractCategories(location: any): string[] {
    return location.additionalCategories?.map((cat: any) => cat.displayName).filter(Boolean) || [];
}
