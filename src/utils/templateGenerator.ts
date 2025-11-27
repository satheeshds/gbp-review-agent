/**
 * Template-based response generator for review replies
 */

/**
 * Template response library organized by tone and star rating
 */
const RESPONSE_TEMPLATES = {
    grateful: {
        5: (businessName: string) => 
            `Thank you so much for your wonderful 5-star review! We're thrilled that you had such a positive experience with ${businessName}. Your feedback means the world to us and motivates our team to continue providing excellent service. We look forward to serving you again soon!`,
        4: (businessName: string) => 
            `Thank you for your great 4-star review! We're so pleased you enjoyed your experience with ${businessName}. We appreciate your feedback and hope to see you again soon!`
    },
    friendly: {
        4: (businessName: string) => 
            `Thanks for the lovely review! We're happy you had a good time at ${businessName}. Hope to see you back soon!`,
        3: (businessName: string) => 
            `Thank you for taking the time to review ${businessName}! We appreciate your feedback and hope to provide an even better experience next time.`
    },
    professional: {
        3: (businessName: string) => 
            `Thank you for your review of ${businessName}. We value your feedback and are always working to improve our service. We hope you'll give us another opportunity to exceed your expectations.`,
        2: (businessName: string) => 
            `Thank you for your feedback regarding ${businessName}. We take all reviews seriously and would like to address your concerns. Please contact us directly so we can make this right.`
    },
    apologetic: {
        2: (businessName: string) => 
            `We sincerely apologize for the experience you had at ${businessName}. This is not the level of service we strive for. Please reach out to us directly at your earliest convenience so we can address your concerns and make this right.`,
        1: (businessName: string) => 
            `We are deeply sorry for your disappointing experience at ${businessName}. Your feedback is invaluable, and we would very much like to speak with you directly to understand what went wrong and how we can improve. Please contact us so we can make amends.`
    }
} as const;

/**
 * Generate a template-based response (fallback when LLM is not available)
 */
export function generateTemplateResponse(
    reviewText: string,
    starRating: number,
    businessName: string,
    tone: string
): string {
    const toneTemplates = RESPONSE_TEMPLATES[tone as keyof typeof RESPONSE_TEMPLATES];
    
    if (toneTemplates) {
        const templateFn = toneTemplates[starRating as keyof typeof toneTemplates] as ((name: string) => string) | undefined;
        if (templateFn) {
            return templateFn(businessName);
        }
    }
    
    // Fallback template
    return `Thank you for your review of ${businessName}. We appreciate your feedback and are committed to providing the best possible experience for all our customers.`;
}

/**
 * Create a structured prompt for LLM sampling
 */
export function createReplyPrompt(
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
