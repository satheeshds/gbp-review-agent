/**
 * Path resolution helpers for Google My Business API
 */

import { logger } from './logger.js';

/**
 * Builds a full location path from a location name
 * Handles both full paths and short location names
 */
export function buildFullLocationPath(
    locationName: string,
    accountName?: string
): string {
    // If already a full path, return as-is
    if (locationName.includes('accounts/')) {
        return locationName;
    }
    
    // If account name provided, build full path
    if (accountName) {
        return `${accountName}/${locationName}`;
    }
    
    // Otherwise, return as-is and let caller handle account resolution
    return locationName;
}

/**
 * Builds a review path from location and review ID
 */
export function buildReviewPath(
    fullLocationPath: string,
    reviewId: string
): string {
    return `${fullLocationPath}/reviews/${reviewId}`;
}

/**
 * Builds an API URL with query parameters
 */
export function buildApiUrl(
    baseUrl: string,
    path: string,
    params?: Record<string, string | number | boolean | undefined>
): string {
    const url = new URL(`${baseUrl}/${path}`);
    
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined) {
                url.searchParams.append(key, String(value));
            }
        });
    }
    
    return url.toString();
}

/**
 * Extracts account ID from account name
 */
export function extractAccountId(accountName: string): string | null {
    const match = accountName.match(/accounts\/(\d+)/);
    return match ? match[1] : null;
}

/**
 * Extracts location ID from location name
 */
export function extractLocationId(locationName: string): string | null {
    const match = locationName.match(/locations\/(\d+)/);
    return match ? match[1] : null;
}

/**
 * Validates that a location path is properly formatted
 */
export function isValidLocationPath(locationPath: string): boolean {
    return /^accounts\/\d+\/locations\/\d+$/.test(locationPath) ||
           /^locations\/\d+$/.test(locationPath);
}

/**
 * Logs path resolution steps for debugging
 */
export function logPathResolution(
    originalPath: string,
    resolvedPath: string,
    context: string
): void {
    if (originalPath !== resolvedPath) {
        logger.debug(`Path resolved for ${context}`, {
            original: originalPath,
            resolved: resolvedPath
        });
    }
}
