/**
 * Sentiment Analysis Prompt
 * Analyze review sentiment to tailor response tone and approach
 */

import { logger } from '../../utils/logger.js';
import type { SentimentAnalysisContext } from '../../types/index.js';

export interface SentimentAnalysisPrompt {
    name: string;
    description: string;
    handler: (context: SentimentAnalysisContext) => Promise<string>;
}

export function createSentimentAnalysisPrompt(): SentimentAnalysisPrompt {
    return {
        name: 'sentiment_analysis',
        description: 'Analyze customer review sentiment and emotions to guide response strategy',
        
        handler: async (context: SentimentAnalysisContext): Promise<string> => {
            try {
                logger.info('Generating sentiment analysis prompt', { 
                    includeEmotions: context.includeEmotions,
                    includeKeywords: context.includeKeywords
                });
                
                const { 
                    reviewText, 
                    includeEmotions = true, 
                    includeKeywords = true 
                } = context;
                
                let prompt = `You are a sentiment analysis expert tasked with analyzing a customer review to understand the emotional context and guide the appropriate response strategy.

**REVIEW TO ANALYZE:**
"${reviewText}"

**YOUR ANALYSIS TASK:**

1. **Overall Sentiment Classification:**
   - Determine if the sentiment is: POSITIVE, NEGATIVE, NEUTRAL, or MIXED
   - Provide a confidence score (0-100%) for your classification
   - If MIXED, explain the positive and negative elements

2. **Sentiment Intensity:**
   - Rate the intensity on a scale of 1-5:
     * 1 = Mild/Subtle sentiment
     * 2 = Moderate sentiment
     * 3 = Strong sentiment  
     * 4 = Very strong sentiment
     * 5 = Extreme sentiment (ecstatic or furious)

3. **Primary Concerns/Highlights:**
   - Identify the main topics or aspects mentioned
   - Determine which aspects are viewed positively vs negatively
   - Highlight any specific issues that need addressing

4. **Customer Intent & Expectations:**
   - What was the customer hoping to achieve with this review?
   - Are they seeking resolution, recognition, or just sharing experience?
   - Do they seem open to future engagement with the business?`;

                if (includeEmotions) {
                    prompt += `

5. **Emotional Analysis:**
   - Identify specific emotions present (joy, frustration, disappointment, appreciation, anger, surprise, etc.)
   - Determine the emotional priority (which emotion is strongest)
   - Assess the customer's emotional state when writing the review
   - Note any emotional triggers that should be handled carefully in the response`;
                }

                if (includeKeywords) {
                    prompt += `

6. **Key Phrases & Language Patterns:**
   - Extract important keywords and phrases used by the customer
   - Identify language that indicates strong feelings (superlatives, exclamations, etc.)
   - Note any specific terminology that should be echoed in the response
   - Highlight any positive language that can be reinforced`;
                }

                prompt += `

7. **Response Strategy Recommendations:**
   - Suggest the most appropriate response tone (professional, friendly, apologetic, grateful, etc.)
   - Recommend key points that MUST be addressed in the response
   - Suggest elements to emphasize or avoid in the reply
   - Indicate urgency level for response (immediate, prompt, standard)

8. **Risk Assessment:**
   - Evaluate potential reputation impact (low, medium, high)
   - Identify any red flags that need special attention
   - Assess likelihood of escalation if not handled properly
   - Note if legal or policy concerns are present

**OUTPUT FORMAT:**
Provide your analysis in a structured format with clear sections for each element above. Be specific and actionable in your recommendations.

**ANALYSIS:**`;

                logger.info('Successfully generated sentiment analysis prompt');
                
                return prompt;
                
            } catch (error) {
                logger.error('Error generating sentiment analysis prompt:', error);
                throw new Error(`Failed to generate sentiment analysis prompt: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    };
}