/**
 * Business Profile Resource
 * Provides business profile information and settings for review responses
 */

import { logger } from '../../utils/logger.js';
import type { IReviewService, BusinessProfile, GetResourceResult } from '../../types/index.js';

export interface BusinessProfileResource {
    uri: string;
    name: string;
    description: string;
    mimeType: string;
    handler: () => Promise<GetResourceResult>;
}

export function createBusinessProfileResource(reviewService: IReviewService): BusinessProfileResource {
    return {
        uri: 'business_profile://profile',
        name: 'Business Profile',
        description: 'Current business profile information and settings for generating appropriate review responses',
        mimeType: 'application/json',
        
        handler: async (): Promise<GetResourceResult> => {
            try {
                logger.info('Fetching business profile resource');
                
                const result = await reviewService.getBusinessProfile();
                
                if (!result.success) {
                    return {
                        contents: [
                            {
                                uri: 'business_profile://profile',
                                mimeType: 'text/plain',
                                text: `Error: ${result.error}`
                            }
                        ]
                    };
                }
                
                const businessProfile = result.data!;
                
                // Create enhanced profile with response guidelines
                const enhancedProfile = {
                    ...businessProfile,
                    responseGuidelines: {
                        tone: 'professional and friendly',
                        style: 'conversational yet business-appropriate',
                        thankCustomers: true,
                        addressConcerns: true,
                        inviteReturn: true,
                        includeBusinessName: true,
                        maxLength: 4096,
                        language: businessProfile.language || 'en'
                    },
                    commonResponses: {
                        thankYou: [
                            'Thank you so much for taking the time to leave us a review!',
                            'We really appreciate your feedback!',
                            'Thank you for your wonderful review!'
                        ],
                        addressConcerns: [
                            'We take all feedback seriously and would love to make this right.',
                            'We apologize for any inconvenience and would appreciate the chance to improve.',
                            'Your feedback is important to us and we will address this concern.'
                        ],
                        inviteBack: [
                            'We hope to see you again soon!',
                            'We look forward to serving you again!',
                            'Please give us another chance to exceed your expectations!'
                        ]
                    },
                    brandVoice: {
                        personality: businessProfile.businessType === 'restaurant' ? 
                            'warm, welcoming, food-passionate' :
                            businessProfile.businessType === 'retail' ?
                            'helpful, customer-focused, solution-oriented' :
                            'professional, reliable, service-oriented',
                        values: [
                            'customer satisfaction',
                            'quality service',
                            'continuous improvement',
                            'community engagement'
                        ]
                    }
                };
                
                logger.info(`Successfully retrieved business profile for ${businessProfile.name}`);
                
                return {
                    contents: [
                        {
                            uri: 'business_profile://profile',
                            mimeType: 'application/json',
                            text: JSON.stringify(enhancedProfile, null, 2)
                        }
                    ]
                };
                
            } catch (error) {
                logger.error('Error fetching business profile resource:', error);
                
                return {
                    contents: [
                        {
                            uri: 'business_profile://profile',
                            mimeType: 'text/plain',
                            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                        }
                    ]
                };
            }
        }
    };
}