/**
 * Application-wide constants
 */

// API Configuration
export const GOOGLE_API = {
    BASE_URL: 'https://mybusiness.googleapis.com/v4',
    SCOPES: [
        'https://www.googleapis.com/auth/business.manage',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
    ],
    VERSION: 'v4'
} as const;

// Default values
export const DEFAULTS = {
    PAGE_SIZE: 50,
    MAX_PAGE_SIZE: 50,
    MAX_REPLY_LENGTH: 4096,
    MAX_PROMPT_LENGTH: 500,
    SESSION_TIMEOUT_MINUTES: 60,
    RATE_LIMIT_PER_MINUTE: 60
} as const;

// Star rating mappings
export const STAR_RATINGS = {
    ONE: 1,
    TWO: 2,
    THREE: 3,
    FOUR: 4,
    FIVE: 5
} as const;

// Error codes
export const ERROR_CODES = {
    AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    INVALID_LOCATION: 'INVALID_LOCATION',
    LOCATIONS_FETCH_ERROR: 'LOCATIONS_FETCH_ERROR',
    REVIEWS_FETCH_ERROR: 'REVIEWS_FETCH_ERROR',
    REPLY_POST_ERROR: 'REPLY_POST_ERROR',
    REPLY_GENERATION_ERROR: 'REPLY_GENERATION_ERROR',
    PROFILE_FETCH_ERROR: 'PROFILE_FETCH_ERROR',
    SENTIMENT_ANALYSIS_ERROR: 'SENTIMENT_ANALYSIS_ERROR',
    API_REQUEST_FAILED: 'API_REQUEST_FAILED',
    NO_LOCATIONS_ERROR: 'NO_LOCATIONS_ERROR'
} as const;

// Sentiment keywords
export const SENTIMENT_KEYWORDS = {
    POSITIVE: ['good', 'great', 'excellent', 'amazing', 'love', 'wonderful', 'fantastic', 'awesome', 'perfect', 'outstanding'],
    NEGATIVE: ['bad', 'terrible', 'awful', 'hate', 'horrible', 'worst', 'disappointed', 'poor', 'disgusting', 'unacceptable']
} as const;

// Emotion keywords
export const EMOTION_KEYWORDS = {
    HAPPY: ['happy', 'joy', 'delighted', 'pleased', 'satisfied', 'thrilled'],
    ANGRY: ['angry', 'frustrated', 'annoyed', 'mad', 'furious', 'outraged'],
    DISAPPOINTED: ['disappointed', 'let down', 'underwhelmed', 'expected more'],
    SURPRISED: ['surprised', 'unexpected', 'shocked', 'amazed', 'astonished'],
    GRATEFUL: ['grateful', 'thankful', 'appreciative', 'blessed']
} as const;

// Topic keywords for review analysis
export const TOPIC_KEYWORDS = [
    'service', 'staff', 'food', 'price', 'quality', 'atmosphere', 'location',
    'wait time', 'clean', 'dirty', 'fast', 'slow', 'fresh', 'stale',
    'friendly', 'rude', 'helpful', 'professional', 'organized', 'messy'
] as const;

// Strong sentiment indicators
export const STRONG_INDICATORS = {
    POSITIVE: ['excellent', 'amazing', 'perfect', 'outstanding', 'incredible'],
    NEGATIVE: ['terrible', 'awful', 'horrible', 'worst', 'disgusting'],
    NEUTRAL: ['okay', 'average', 'fine', 'decent', 'acceptable']
} as const;

// Confidence scoring thresholds
export const CONFIDENCE = {
    BASE: 0.7,
    SHORT_TEXT_BOOST: 0.1,
    LONG_TEXT_BOOST: 0.1,
    CLEAR_RATING_BOOST: 0.1,
    REASONABLE_LENGTH_BOOST: 0.1,
    STRONG_INDICATOR_BOOST: 0.2,
    MIN_LENGTH_FOR_SENTIMENT: 50,
    MODERATE_LENGTH_FOR_SENTIMENT: 150
} as const;
