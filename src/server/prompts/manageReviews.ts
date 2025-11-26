import { logger } from '../../utils/logger.js';
import type { IReviewService } from '../../types/index.js';

export function createManageReviewsPrompt(reviewService: IReviewService) {
    return {
        name: 'manage_pending_reviews',
        description: 'Fetches unreplied reviews and instructs the AI to generate and post replies',
        
        handler: async (args: { locationName?: string }) => {
            try {
                logger.info('Generating manage_reviews prompt');
                
                let targetLocation = args.locationName;

                // If no location provided, fetch the first available one
                if (!targetLocation) {
                    const locationsResult = await reviewService.listLocations();
                    if (locationsResult.success && locationsResult.data && locationsResult.data.locations.length > 0) {
                        targetLocation = locationsResult.data.locations[0].name;
                        logger.info(`No location specified, using default: ${targetLocation}`);
                    } else {
                        return "Error: No location specified and failed to fetch available locations.";
                    }
                }

                // 1. CALL THE SERVICE DIRECTLY (This is how the prompt "uses" the tool's logic)
                const result = await reviewService.getReviews(targetLocation);
                
                if (!result.success || !result.data) {
                    return `Failed to fetch reviews: ${result.error}`;
                }

                // 2. Filter for reviews that need replies
                const pendingReviews = result.data.reviews.filter(r => !r.reviewReply);
                
                if (pendingReviews.length === 0) {
                    return "There are no pending reviews that require a reply at this time.";
                }

                // 3. Construct the Prompt
                let prompt = `You are managing the Google Business Profile for a location.
There are ${pendingReviews.length} new reviews that need replies.

YOUR TASK:
1. Analyze each review below.
2. Generate a professional, personalized reply for each (referencing specific details).
3. Use the 'post_reply' tool to submit each reply.
   IMPORTANT: You MUST include the 'reviewText', 'starRating', and 'reviewerName' arguments in the tool call. This allows the human reviewer to see the context before approving.

PENDING REVIEWS:
`;

                pendingReviews.forEach((review, index) => {
                    prompt += `
---
REVIEW #${index + 1}
ID: ${review.reviewId}
RATING: ${review.starRating}/5
AUTHOR: ${review.reviewer.displayName}
TEXT: "${review.comment}"
---
`;
                });

                prompt += `
Please proceed with generating and posting replies for these reviews now.`;

                return prompt;
                
            } catch (error) {
                logger.error('Error in manage_reviews prompt:', error);
                return `Error generating prompt: ${error instanceof Error ? error.message : 'Unknown error'}`;
            }
        }
    };
}
