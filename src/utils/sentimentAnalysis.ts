/**
 * Sentiment analysis utilities
 */

import { SENTIMENT_KEYWORDS, EMOTION_KEYWORDS, TOPIC_KEYWORDS, STRONG_INDICATORS, CONFIDENCE } from './constants.js';

/**
 * Analyze sentiment of review text based on keywords and star rating
 */
export function analyzeSentiment(reviewText: string, starRating: number): 'positive' | 'negative' | 'neutral' {
    if (starRating >= 4) return 'positive';
    if (starRating <= 2) return 'negative';
    
    // For 3-star reviews, analyze text for sentiment indicators
    const text = reviewText.toLowerCase();
    const positiveCount = SENTIMENT_KEYWORDS.POSITIVE.filter(word => text.includes(word)).length;
    const negativeCount = SENTIMENT_KEYWORDS.NEGATIVE.filter(word => text.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
}

/**
 * Extract emotions from review text based on emotion keywords
 */
export function extractEmotions(reviewText: string): string[] {
    const text = reviewText.toLowerCase();
    const emotions: string[] = [];
    
    for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
        if (keywords.some(keyword => text.includes(keyword))) {
            emotions.push(emotion.toLowerCase());
        }
    }
    
    return emotions;
}

/**
 * Extract key topics/keywords from review text
 */
export function extractKeywords(reviewText: string): string[] {
    const text = reviewText.toLowerCase();
    return TOPIC_KEYWORDS.filter(keyword => text.includes(keyword));
}

/**
 * Calculate confidence score for sentiment analysis
 */
export function calculateSentimentConfidence(reviewText: string, sentiment: string): number {
    let confidence = CONFIDENCE.BASE;
    
    // Longer reviews generally provide more reliable sentiment
    if (reviewText.length > CONFIDENCE.MIN_LENGTH_FOR_SENTIMENT) {
        confidence += CONFIDENCE.SHORT_TEXT_BOOST;
    }
    if (reviewText.length > CONFIDENCE.MODERATE_LENGTH_FOR_SENTIMENT) {
        confidence += CONFIDENCE.LONG_TEXT_BOOST;
    }
    
    // Clear sentiment indicators boost confidence
    const text = reviewText.toLowerCase();
    const indicators = STRONG_INDICATORS[sentiment.toUpperCase() as keyof typeof STRONG_INDICATORS] || [];
    
    if (indicators.some(indicator => text.includes(indicator))) {
        confidence += CONFIDENCE.STRONG_INDICATOR_BOOST;
    }
    
    return Math.min(confidence, 1.0);
}

/**
 * Calculate confidence score for generated response
 */
export function calculateResponseConfidence(
    reviewText: string,
    starRating: number,
    replyText: string
): number {
    let confidence = CONFIDENCE.BASE;
    
    // Adjust based on review length (more context = higher confidence)
    if (reviewText.length > 100) confidence += CONFIDENCE.SHORT_TEXT_BOOST;
    if (reviewText.length > 200) confidence += CONFIDENCE.LONG_TEXT_BOOST;
    
    // Adjust based on star rating clarity
    if (starRating === 1 || starRating === 5) {
        confidence += CONFIDENCE.CLEAR_RATING_BOOST;
    }
    
    // Adjust based on reply length (reasonable length = higher confidence)
    if (replyText.length >= 50 && replyText.length <= 300) {
        confidence += CONFIDENCE.REASONABLE_LENGTH_BOOST;
    }
    
    return Math.min(confidence, 1.0);
}

/**
 * Determine appropriate tone based on star rating
 */
export function determineToneFromRating(starRating: number): 'professional' | 'friendly' | 'apologetic' | 'grateful' {
    if (starRating >= 5) return 'grateful';
    if (starRating >= 4) return 'friendly';
    if (starRating >= 3) return 'professional';
    return 'apologetic';
}
