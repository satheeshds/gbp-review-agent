/**
 * Type definitions for Google Business Profile Review MCP Server
 */

// Google My Business API types
export interface BusinessLocation {
    name: string;
    locationName: string;
    primaryPhone?: string;
    websiteUri?: string;
    address?: {
        addressLines: string[];
        locality: string;
        administrativeArea: string;
        postalCode: string;
        regionCode: string;
    };
}

export interface BusinessProfile extends BusinessLocation {
    businessType?: string;
    language?: string;
    description?: string;
    categories?: string[];
    hours?: {
        [key: string]: {
            open?: string;
            close?: string;
        };
    };
}

export interface GoogleReview {
    reviewId: string;
    reviewer: {
        profilePhotoUrl?: string;
        displayName: string;
    };
    starRating: 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE';
    comment?: string;
    createTime: string;
    updateTime: string;
    reviewReply?: {
        comment: string;
        updateTime: string;
    };
}

export interface ReviewReply {
    comment: string;
}

// MCP Tool parameters
export interface ListLocationsParams {
    // No parameters needed
}

export interface GetReviewsParams {
    locationName: string;
    pageSize?: number;
    pageToken?: string;
}

export interface GenerateReplyParams {
    reviewText: string;
    starRating: number;
    businessName: string;
    replyTone?: 'professional' | 'friendly' | 'apologetic' | 'grateful';
    includePersonalization?: boolean;
}

export interface PostReplyParams {
    locationName: string;
    reviewId: string;
    replyText: string;
}

// Service response types
export interface ServiceResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    errorCode?: string;
}

export interface ListLocationsResponse {
    locations: BusinessLocation[];
    nextPageToken?: string;
}

export interface GetReviewsResponse {
    reviews: GoogleReview[];
    nextPageToken?: string;
    totalSize?: number;
}

export interface GenerateReplyResponse {
    replyText: string;
    tone: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
}

export interface PostReplyResponse {
    success: boolean;
    replyId?: string;
    postedAt: string;
}

// MCP Resource types
export interface GetResourceResult {
    contents: Array<{
        uri: string;
        mimeType: string;
        text: string;
    }>;
}

export interface ListResourcesResult {
    resources: Array<{
        uri: string;
        name: string;
        description?: string;
        mimeType?: string;
    }>;
}

// OAuth and authentication types
export interface GoogleOAuthTokens {
    access_token: string;
    refresh_token?: string;
    scope: string;
    token_type: string;
    expires_in: number;
    expires_at: number;
}

export interface AuthState {
    isAuthenticated: boolean;
    tokens?: GoogleOAuthTokens;
    userInfo?: {
        email: string;
        name: string;
    };
}

// Prompt context types
export interface ReviewResponseContext {
    reviewText: string;
    starRating: number;
    businessName: string;
    businessType?: string;
    customerName?: string;
    replyTone: string;
    previousReplies?: string[];
}

export interface SentimentAnalysisContext {
    reviewText: string;
    includeEmotions?: boolean;
    includeKeywords?: boolean;
}

// Error types
export class McpServerError extends Error {
    constructor(
        public code: string,
        message: string,
        public details?: any
    ) {
        super(message);
        this.name = 'McpServerError';
    }
}

export class GoogleApiError extends Error {
    constructor(
        public statusCode: number,
        message: string,
        public apiError?: any
    ) {
        super(message);
        this.name = 'GoogleApiError';
    }
}

// Rate limiting types
export interface RateLimitInfo {
    limit: number;
    remaining: number;
    resetTime: number;
}

// Configuration types (re-exported from config)
export type { Config } from '../utils/config.js';