import { logger } from '../../utils/logger.js';

export function createManageReviewsPrompt() {
    return {
        name: 'manage_pending_reviews',
        description: 'Instructs the AI to fetch reviews from the reviews resource and generate replies. Reference the reviews://all resource for current pending reviews.',
        
        handler: async () => {
            try {
                logger.info('Generating manage_reviews prompt');
                
                // Construct the prompt that instructs AI to use MCP resources
                let prompt = `You are managing Google Business Profile reviews for a business.

YOUR TASK:
1. First, read the "locations://list" MCP resource to see available business locations
2. If multiple locations exist, ask the user which location they want to manage reviews for
3. Once location is selected, read the dynamic reviews resource: "reviews://{locationId}"
   Replace {locationId} with the actual location ID (e.g., reviews://locations/6087465285515339471)
4. For each review without a reply, analyze the content and sentiment
5. Generate a professional, personalized reply (referencing specific details from the review)
6. Use the 'post_reply' tool to submit each reply
   IMPORTANT: You MUST include the 'reviewText', 'starRating', and 'reviewerName' arguments in the tool call for human approval context

**INSTRUCTIONS:**

Step 1: Check available locations
- Read: locations://list
- This will show you all available business locations with their IDs
- If multiple locations exist, present them to the user and ask which one to manage
- If only one location, proceed automatically with that location

Step 2: Get reviews for the selected location
- Read the dynamic resource: reviews://{locationId}
- Replace {locationId} with the full location ID from Step 1
- Example: reviews://locations/6087465285515339471
- This will show you all unreplied reviews for that specific location

Step 3: For each review, consider:
- Star rating and sentiment
- Specific details mentioned by the reviewer
- Appropriate tone (grateful for 5-star, empathetic for low ratings)
- Business context from business_profile://profile if needed

Step 4: Generate personalized replies
- Reference specific points from each review
- Use appropriate tone based on rating
- Keep responses concise (50-200 words)
- Sound genuine and human, not templated

Step 5: Post each reply using the post_reply tool

**AVAILABLE MCP RESOURCES:**
- locations://list - All business locations with IDs
- reviews://{locationId} - Reviews for a specific location (dynamic)
- reviews://all - All unreplied reviews across all locations (if you need overview)
- business_profile://profile - Brand voice and response guidelines
- review_templates://templates - Template examples for inspiration (don't copy exactly)

Please start by reading the locations://list resource to see available locations.`;

                return prompt;
                
            } catch (error) {
                logger.error('Error in manage_reviews prompt:', error);
                return `Error generating prompt: ${error instanceof Error ? error.message : 'Unknown error'}`;
            }
        }
    };
}
