/**
 * LLM Service for generating review responses using MCP sampling
 */

import { logger } from '../utils/logger.js';
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';
import type { 
    GenerateReplyResponse, 
    ServiceResponse,
    ReviewResponseContext
} from '../types/index.js';
import { CreateMessageRequest, CreateMessageRequestSchema, ServerNotification, ServerRequest, ToolResultContent } from '@modelcontextprotocol/sdk/types.js';

type SendRequest = RequestHandlerExtra<ServerRequest, ServerNotification>['sendRequest'];
const requestSampling = async (prompt: string, sendRequest: SendRequest) => {
    const request: CreateMessageRequest = {
        method: "sampling/createMessage",
        params: {
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: prompt
                    }
                }
            ],
            systemPrompt: "Generate a professional and appropriate response to the customer review provided.",
            maxTokens: 500,
            temperature: 0.7,
            includeContext: "thisServer"
        }
    };

    const response: any = await sendRequest(request, CreateMessageRequestSchema);
    return response.content.text;

}; 

export class LLMService {
    private samplingCallback?: (prompt: string) => Promise<string>;
    
    constructor(samplingCallback?: (prompt: string) => Promise<string>) {
        this.samplingCallback = samplingCallback;
        logger.debug('LLM Service initialized', { hasSampling: !!samplingCallback });
    }
    
    /**
     * Set the sampling callback for LLM requests
     */
    setSamplingCallback(callback: (prompt: string) => Promise<string>): void {
        this.samplingCallback = callback;
        logger.debug('Sampling callback registered');
    }
    
    /**
     * Generate a reply to a review using LLM sampling
     * This method will use MCP's sampling capability to generate responses
     */
    async generateReply(
reviewText: string, starRating: number, businessName: string, options: {
    replyTone?: 'professional' | 'friendly' | 'apologetic' | 'grateful';
    includePersonalization?: boolean;
    maxLength?: number;
} = {}, extra: RequestHandlerExtra<ServerRequest, ServerNotification>    ): Promise<ServiceResponse<GenerateReplyResponse>> {
        try {
            logger.debug('Generating reply for review', { starRating, businessName, hasSampling: !!this.samplingCallback });
            
            const {
                replyTone = this.determineToneFromRating(starRating),
                includePersonalization = true,
                maxLength = 500
            } = options;
            
            // Analyze sentiment
            const sentiment = this.analyzeSentiment(reviewText, starRating);
            
            // Create prompt for LLM
            const prompt = this.createReplyPrompt(reviewText, starRating, businessName, replyTone, includePersonalization);
            
            let replyText: string;
            let confidence: number;
            
            // Try to use LLM sampling if available
            if (this.samplingCallback) {
                try {
                    logger.info('Using AI sampling for reply generation');
                    replyText = await this.samplingCallback(prompt);
                    confidence = 0.9; // High confidence for AI-generated replies
                    logger.info('AI-generated reply received', { length: replyText.length });
                } catch (samplingError) {
                    logger.warn('AI sampling failed, falling back to template', { error: samplingError });
                    replyText = this.generateTemplateResponse(reviewText, starRating, businessName, replyTone);
                    confidence = this.calculateConfidence(reviewText, starRating, replyText);
                }
            } else {
                logger.info('No AI sampling available, using template response');
                replyText = await requestSampling(prompt, extra.sendRequest);
                confidence = 0.9; // High confidence for AI-generated replies
                // Fallback to template-based response
                // logger.debug('No AI sampling available, using template response');
                // replyText = this.generateTemplateResponse(reviewText, starRating, businessName, replyTone);
                // confidence = this.calculateConfidence(reviewText, starRating, replyText);
            }
            
            logger.info('Reply generated successfully', { sentiment, confidence, method: this.samplingCallback ? 'AI' : 'template' });
            
            return {
                success: true,
                data: {
                    replyText: replyText.substring(0, maxLength),
                    tone: replyTone,
                    sentiment,
                    confidence
                }
            };
            
        } catch (error) {
            logger.error('Error generating reply:', error);
            return {
                success: false,
                error: 'Failed to generate reply',
                errorCode: 'REPLY_GENERATION_ERROR'
            };
        }
    }
    
    /**
     * Create a structured prompt for LLM sampling
     */
    private createReplyPrompt(
        reviewText: string,
        starRating: number,
        businessName: string,
        tone: string,
        includePersonalization: boolean
    ): string {
        return `You are writing a professional response to a customer review for ${businessName}.

Review Details:
- Star Rating: ${starRating}/5
- Review Text: "${reviewText}"
- Desired Tone: ${tone}
- Include Personalization: ${includePersonalization}

Guidelines:
1. Be professional and ${tone}
2. ${starRating >= 4 ? 'Thank the customer for their positive feedback' : 'Address their concerns empathetically'}
3. ${includePersonalization ? 'Reference specific points from their review when appropriate' : 'Keep the response general but sincere'}
4. Keep the response concise (under 200 words)
5. ${starRating < 3 ? 'Offer to resolve any issues offline if appropriate' : 'Encourage them to visit again'}

Write a thoughtful response that represents ${businessName} well:`;
    }
    
    /**
     * Determine appropriate tone based on star rating
     */
    private determineToneFromRating(starRating: number): 'professional' | 'friendly' | 'apologetic' | 'grateful' {
        if (starRating >= 5) return 'grateful';
        if (starRating >= 4) return 'friendly';
        if (starRating >= 3) return 'professional';
        return 'apologetic';
    }
    
    /**
     * Analyze sentiment of the review
     */
    private analyzeSentiment(reviewText: string, starRating: number): 'positive' | 'negative' | 'neutral' {
        // Simple sentiment analysis based on rating and keywords
        if (starRating >= 4) return 'positive';
        if (starRating <= 2) return 'negative';
        
        // For 3-star reviews, analyze text for sentiment indicators
        const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'wonderful', 'fantastic'];
        const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'horrible', 'worst', 'disappointed'];
        
        const text = reviewText.toLowerCase();
        const positiveCount = positiveWords.filter(word => text.includes(word)).length;
        const negativeCount = negativeWords.filter(word => text.includes(word)).length;
        
        if (positiveCount > negativeCount) return 'positive';
        if (negativeCount > positiveCount) return 'negative';
        return 'neutral';
    }
    
    /**
     * Generate a template-based response (fallback when LLM is not available)
     */
    private generateTemplateResponse(
        reviewText: string,
        starRating: number,
        businessName: string,
        tone: string
    ): string {
        const templates = {
            grateful: {
                5: `Thank you so much for your wonderful 5-star review! We're thrilled that you had such a positive experience with ${businessName}. Your feedback means the world to us and motivates our team to continue providing excellent service. We look forward to serving you again soon!`,
                4: `Thank you for your great 4-star review! We're so pleased you enjoyed your experience with ${businessName}. We appreciate your feedback and hope to see you again soon!`
            },
            friendly: {
                4: `Thanks for the lovely review! We're happy you had a good time at ${businessName}. Hope to see you back soon!`,
                3: `Thank you for taking the time to review ${businessName}! We appreciate your feedback and hope to provide an even better experience next time.`
            },
            professional: {
                3: `Thank you for your review of ${businessName}. We value your feedback and are always working to improve our service. We hope you'll give us another opportunity to exceed your expectations.`,
                2: `Thank you for your feedback regarding ${businessName}. We take all reviews seriously and would like to address your concerns. Please contact us directly so we can make this right.`
            },
            apologetic: {
                2: `We sincerely apologize for the experience you had at ${businessName}. This is not the level of service we strive for. Please reach out to us directly at your earliest convenience so we can address your concerns and make this right.`,
                1: `We are deeply sorry for your disappointing experience at ${businessName}. Your feedback is invaluable, and we would very much like to speak with you directly to understand what went wrong and how we can improve. Please contact us so we can make amends.`
            }
        };
        
        const toneTemplates = templates[tone as keyof typeof templates];
        if (toneTemplates && toneTemplates[starRating as keyof typeof toneTemplates]) {
            return toneTemplates[starRating as keyof typeof toneTemplates];
        }
        
        // Fallback template
        return `Thank you for your review of ${businessName}. We appreciate your feedback and are committed to providing the best possible experience for all our customers.`;
    }
    
    /**
     * Calculate confidence score for the generated response
     */
    private calculateConfidence(reviewText: string, starRating: number, replyText: string): number {
        let confidence = 0.7; // Base confidence
        
        // Adjust based on review length (more context = higher confidence)
        if (reviewText.length > 100) confidence += 0.1;
        if (reviewText.length > 200) confidence += 0.1;
        
        // Adjust based on star rating clarity
        if (starRating === 1 || starRating === 5) confidence += 0.1;
        
        // Adjust based on reply length (reasonable length = higher confidence)
        if (replyText.length >= 50 && replyText.length <= 300) confidence += 0.1;
        
        return Math.min(confidence, 1.0);
    }
    
    /**
     * Analyze review sentiment with detailed breakdown
     */
    async analyzeSentimentDetailed(reviewText: string): Promise<ServiceResponse<{
        sentiment: 'positive' | 'negative' | 'neutral';
        confidence: number;
        emotions: string[];
        keywords: string[];
    }>> {
        try {
            logger.debug('Performing detailed sentiment analysis');
            
            const sentiment = this.analyzeSentiment(reviewText, 3); // Neutral rating for text-only analysis
            const emotions = this.extractEmotions(reviewText);
            const keywords = this.extractKeywords(reviewText);
            const confidence = this.calculateSentimentConfidence(reviewText, sentiment);
            
            return {
                success: true,
                data: {
                    sentiment,
                    confidence,
                    emotions,
                    keywords
                }
            };
            
        } catch (error) {
            logger.error('Error in sentiment analysis:', error);
            return {
                success: false,
                error: 'Failed to analyze sentiment',
                errorCode: 'SENTIMENT_ANALYSIS_ERROR'
            };
        }
    }
    
    /**
     * Extract emotions from review text
     */
    private extractEmotions(reviewText: string): string[] {
        const emotionKeywords = {
            happy: ['happy', 'joy', 'delighted', 'pleased', 'satisfied', 'thrilled'],
            angry: ['angry', 'frustrated', 'annoyed', 'mad', 'furious', 'outraged'],
            disappointed: ['disappointed', 'let down', 'underwhelmed', 'expected more'],
            surprised: ['surprised', 'unexpected', 'shocked', 'amazed', 'astonished'],
            grateful: ['grateful', 'thankful', 'appreciative', 'blessed']
        };
        
        const text = reviewText.toLowerCase();
        const emotions: string[] = [];
        
        for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
            if (keywords.some(keyword => text.includes(keyword))) {
                emotions.push(emotion);
            }
        }
        
        return emotions;
    }
    
    /**
     * Extract key topics/keywords from review text
     */
    private extractKeywords(reviewText: string): string[] {
        const topicKeywords = [
            'service', 'staff', 'food', 'price', 'quality', 'atmosphere', 'location',
            'wait time', 'clean', 'dirty', 'fast', 'slow', 'fresh', 'stale',
            'friendly', 'rude', 'helpful', 'professional', 'organized', 'messy'
        ];
        
        const text = reviewText.toLowerCase();
        return topicKeywords.filter(keyword => text.includes(keyword));
    }
    
    /**
     * Calculate confidence for sentiment analysis
     */
    private calculateSentimentConfidence(reviewText: string, sentiment: string): number {
        let confidence = 0.6; // Base confidence
        
        // Longer reviews generally provide more reliable sentiment
        if (reviewText.length > 50) confidence += 0.1;
        if (reviewText.length > 150) confidence += 0.1;
        
        // Clear sentiment indicators boost confidence
        const strongIndicators = {
            positive: ['excellent', 'amazing', 'perfect', 'outstanding', 'incredible'],
            negative: ['terrible', 'awful', 'horrible', 'worst', 'disgusting'],
            neutral: ['okay', 'average', 'fine', 'decent', 'acceptable']
        };
        
        const text = reviewText.toLowerCase();
        const indicators = strongIndicators[sentiment as keyof typeof strongIndicators] || [];
        
        if (indicators.some(indicator => text.includes(indicator))) {
            confidence += 0.2;
        }
        
        return Math.min(confidence, 1.0);
    }
}