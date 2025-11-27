/**
 * Review Response Prompt
 * Template for generating professional, personalized review responses
 */

import { logger } from '../../utils/logger.js';
import type { ReviewResponseContext } from '../../types/index.js';

export interface ReviewResponsePrompt {
    name: string;
    description: string;
    handler: (context: ReviewResponseContext) => Promise<string>;
}

export function createReviewResponsePrompt(): ReviewResponsePrompt {
    return {
        name: 'review_response',
        description: 'Generate a professional, personalized response to a customer review',
        
        handler: async (context: ReviewResponseContext): Promise<string> => {
            try {
                logger.info('Generating review response prompt', { 
                    starRating: context.starRating,
                    businessName: context.businessName,
                    tone: context.replyTone
                });
                
                const { 
                    reviewText, 
                    starRating, 
                    businessName, 
                    businessType = 'business',
                    customerName = '',
                    replyTone,
                    previousReplies = []
                } = context;
                
                // Determine sentiment and response approach
                const isPositive = starRating >= 4;
                const isNeutral = starRating === 3;
                const isNegative = starRating <= 2;
                
                // Build the prompt
                let prompt = `You are tasked with writing a professional, personalized response to a customer review for ${businessName}, a ${businessType}.

**REVIEW DETAILS:**
- Star Rating: ${starRating}/5 stars
- Customer Name: ${customerName || 'Customer'}
- Review Text: "${reviewText}"
- Response Tone: ${replyTone}

**RESPONSE GUIDELINES:**
1. **Tone & Style:**
   - Use a ${replyTone} tone throughout
   - Be authentic and genuine, not overly promotional
   - Match the energy level of the review appropriately
   - Keep it conversational yet professional

2. **Structure Requirements:**
   - Start with a personalized greeting using the customer's name if available
   - Acknowledge the specific feedback given in the review
   - ${isPositive ? 'Express genuine gratitude for their positive experience' : 
     isNeutral ? 'Thank them for their honest feedback and show commitment to improvement' :
     'Acknowledge their concerns and show genuine empathy'}
   - End with an appropriate call-to-action or invitation

3. **Content Guidelines:**`;

                if (isPositive) {
                    prompt += `
   - Thank the customer warmly for their positive review
   - Highlight specific aspects they mentioned (if any)
   - Express how their feedback motivates the team
   - Invite them to return or try other services/products
   - Share the positive impact their review has on the business`;
                } else if (isNeutral) {
                    prompt += `
   - Thank them for their honest, balanced feedback
   - Acknowledge that their experience was "okay" but express desire to do better
   - Ask for specific suggestions for improvement (diplomatically)
   - Reassure them of your commitment to excellence
   - Invite them back for an improved experience`;
                } else {
                    prompt += `
   - Sincerely apologize for their disappointing experience
   - Acknowledge the specific issues they raised without being defensive
   - Take responsibility where appropriate
   - Explain steps being taken to prevent similar issues
   - Offer to make things right (contact information, return visit, etc.)
   - Show genuine commitment to improvement`;
                }

                prompt += `

4. **Personalization Elements:**
   - Reference specific details from their review when possible
   - Use the customer's name naturally (not just at the beginning)
   - Mention specific services/products they used if mentioned
   - Connect with the emotional context of their experience

5. **Business-Specific Considerations:**
   - Maintain ${businessName}'s brand voice and values
   - Include relevant business-specific details if appropriate
   - Consider the ${businessType} context in your response
   - Reflect the local community connection if applicable
   - **TIP:** You can access the business_profile://profile MCP resource for brand guidelines and tone recommendations

6. **Template Inspiration (Optional):**
   - You can access review_templates://templates MCP resource for example responses
   - Use these as inspiration only - make your response unique and specific to this review
   - Don't copy templates verbatim; personalize based on the actual review content

7. **Length & Format:**
   - Keep response between 50-200 words
   - Use proper paragraph breaks for readability
   - Avoid overly long sentences
   - End with a clear, actionable next step

**IMPORTANT REMINDERS:**
- Do NOT use overly generic or template-like language
- Avoid sounding robotic or copy-pasted
- Do NOT make promises you can't keep
- Reference the actual review content, don't just acknowledge "feedback"
- Make it feel like a real person wrote it, not an AI`;

                if (previousReplies.length > 0) {
                    prompt += `

**PREVIOUS REPLIES FOR REFERENCE:**
Here are some previous replies from this business to maintain consistency in voice and style:
${previousReplies.map((reply, index) => `\n${index + 1}. "${reply}"`).join('')}

Maintain a similar tone and style, but ensure your response is unique and specifically addresses this review.`;
                }

                prompt += `

**YOUR TASK:**
Write a thoughtful, personalized response to this ${starRating}-star review that follows all the guidelines above. Make it feel genuine and human while maintaining professionalism.

**RESPONSE:**`;

                logger.info('Successfully generated review response prompt');
                
                return prompt;
                
            } catch (error) {
                logger.error('Error generating review response prompt:', error);
                throw new Error(`Failed to generate review response prompt: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    };
}