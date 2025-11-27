/**
 * LLM Service for generating review responses using MCP sampling
 */

import { logger } from '../utils/logger.js';
import { DEFAULTS } from '../utils/constants.js';
import { 
    analyzeSentiment, 
    extractEmotions, 
    extractKeywords, 
    calculateSentimentConfidence,
    calculateResponseConfidence,
    determineToneFromRating 
} from '../utils/sentimentAnalysis.js';
import { generateTemplateResponse, createReplyPrompt } from '../utils/templateGenerator.js';
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
            maxTokens: DEFAULTS.MAX_PROMPT_LENGTH,
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
                replyTone = determineToneFromRating(starRating),
                includePersonalization = true,
                maxLength = DEFAULTS.MAX_PROMPT_LENGTH
            } = options;
            
            // Analyze sentiment
            const sentiment = analyzeSentiment(reviewText, starRating);
            
            // Create prompt for LLM
            const prompt = createReplyPrompt(reviewText, starRating, businessName, replyTone, includePersonalization);
            
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
                    replyText = generateTemplateResponse(reviewText, starRating, businessName, replyTone);
                    confidence = calculateResponseConfidence(reviewText, starRating, replyText);
                }
            } else {
                logger.info('No AI sampling available, using template response');
                replyText = await requestSampling(prompt, extra.sendRequest);
                confidence = 0.9; // High confidence for AI-generated replies
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
            
            const sentiment = analyzeSentiment(reviewText, 3); // Neutral rating for text-only analysis
            const emotions = extractEmotions(reviewText);
            const keywords = extractKeywords(reviewText);
            const confidence = calculateSentimentConfidence(reviewText, sentiment);
            
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
}