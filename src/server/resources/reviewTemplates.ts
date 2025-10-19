/**
 * Review Templates Resource
 * Provides pre-defined response templates for different review types and scenarios
 */

import { logger } from '../../utils/logger.js';
import type { GetResourceResult } from '../../types/index.js';

export interface ReviewTemplatesResource {
    uri: string;
    name: string;
    description: string;
    mimeType: string;
    handler: () => Promise<GetResourceResult>;
}

export function createReviewTemplatesResource(): ReviewTemplatesResource {
    return {
        uri: 'review_templates://templates',
        name: 'Review Response Templates',
        description: 'Pre-defined templates for responding to different types of customer reviews',
        mimeType: 'application/json',
        
        handler: async (): Promise<GetResourceResult> => {
            try {
                logger.info('Fetching review templates resource');
                
                const templates = {
                    positiveReviews: {
                        fiveStars: [
                            "Thank you so much for the wonderful 5-star review, {customerName}! We're thrilled to hear about your positive experience with {businessName}. Your feedback means the world to us, and we look forward to serving you again soon!",
                            "We're absolutely delighted by your amazing review! Thank you for taking the time to share your experience. It's customers like you who make what we do so rewarding. We can't wait to welcome you back to {businessName}!",
                            "What a fantastic review! Thank you {customerName} for your kind words and the 5-star rating. We're so happy we could exceed your expectations. See you again soon at {businessName}!"
                        ],
                        fourStars: [
                            "Thank you for the great 4-star review, {customerName}! We appreciate your feedback and are glad you had a positive experience at {businessName}. We're always working to improve and would love to earn that 5th star next time!",
                            "We're so pleased you enjoyed your visit to {businessName}! Thank you for the wonderful review. Your feedback helps us continue to provide excellent service. We hope to see you again soon!",
                            "Thank you for choosing {businessName} and for your thoughtful review! We're delighted you had a great experience and appreciate you taking the time to share it."
                        ]
                    },
                    negativeReviews: {
                        oneToTwoStars: [
                            "Thank you for bringing this to our attention, {customerName}. We sincerely apologize that your experience at {businessName} didn't meet your expectations. We take all feedback seriously and would appreciate the opportunity to make this right. Please contact us directly so we can address your concerns and improve your experience.",
                            "We're truly sorry to hear about your disappointing experience, {customerName}. This is not the level of service we strive for at {businessName}. We would love the chance to speak with you directly to understand what went wrong and how we can improve. Please reach out to us.",
                            "Your feedback is important to us, {customerName}, and we apologize for falling short of your expectations. At {businessName}, we're committed to providing excellent service, and we'd like the opportunity to make things right. Please contact us so we can address your concerns."
                        ],
                        threeStars: [
                            "Thank you for your honest feedback, {customerName}. We appreciate you taking the time to review {businessName}. We're sorry to hear your experience was just okay - we'd love to do better! We'd appreciate the chance to learn more about your visit and how we can improve.",
                            "We value your 3-star review, {customerName}, and appreciate your honest feedback about {businessName}. We're always looking for ways to enhance our customer experience. Would you mind sharing more details about what we could improve? We'd love to make your next visit exceptional!",
                            "Thank you for visiting {businessName} and for sharing your feedback, {customerName}. We're glad you had an acceptable experience, but we know we can do better! We'd appreciate any specific suggestions for improvement and hope to exceed your expectations next time."
                        ]
                    },
                    specificScenarios: {
                        foodService: {
                            positive: [
                                "Thank you for the amazing review! We're so happy you enjoyed the food at {businessName}. Our team takes great pride in preparing fresh, delicious meals, and it means everything to hear that it shows. We can't wait to serve you again!",
                                "What a wonderful review! Thank you for highlighting our food quality and service. The entire team at {businessName} works hard to create memorable dining experiences, and your feedback motivates us to keep doing our best!"
                            ],
                            negative: [
                                "We sincerely apologize for your disappointing dining experience at {businessName}. Food quality and service are our top priorities, and we clearly fell short. We'd love the opportunity to make this right - please contact us directly so we can address your concerns and invite you back for a proper meal on us.",
                                "Thank you for bringing this to our attention. We're truly sorry your meal and service didn't meet the standards we strive for at {businessName}. We take all feedback seriously and would appreciate the chance to discuss this with you directly to ensure this doesn't happen again."
                            ]
                        },
                        retail: {
                            positive: [
                                "Thank you for the wonderful review! We're thrilled you found what you were looking for at {businessName} and that our team could help. Providing excellent customer service and quality products is what we're all about. We appreciate your business and look forward to seeing you again!",
                                "What fantastic feedback! Thank you for choosing {businessName} and for taking the time to share your positive experience. Our team loves helping customers find exactly what they need, and your review makes our day!"
                            ],
                            negative: [
                                "We apologize for the poor experience you had at {businessName}. Customer satisfaction is our priority, and we clearly didn't deliver the service you deserved. We'd like to make this right - please contact us directly so we can address your concerns and improve your experience with us.",
                                "Thank you for your honest feedback about your visit to {businessName}. We're sorry we didn't meet your expectations and would appreciate the opportunity to understand what went wrong. Please reach out to us so we can make improvements and regain your trust."
                            ]
                        },
                        service: {
                            positive: [
                                "Thank you so much for the glowing review! We're delighted that our team at {businessName} could provide you with excellent service. Customer satisfaction is our top priority, and your feedback confirms we're on the right track. We appreciate your business!",
                                "We're thrilled to receive such positive feedback! Thank you for recognizing the hard work our team puts in at {businessName}. Providing outstanding service is what we strive for every day, and reviews like yours motivate us to keep exceeding expectations."
                            ],
                            negative: [
                                "We sincerely apologize for the service issues you experienced at {businessName}. This is not the level of service we strive to provide, and we take your feedback very seriously. We'd like the opportunity to discuss this with you directly and make improvements. Please contact us.",
                                "Thank you for bringing this to our attention. We're truly sorry our service didn't meet your expectations at {businessName}. We're committed to providing excellent customer care, and we'd appreciate the chance to make this right. Please reach out to us directly."
                            ]
                        }
                    },
                    specialSituations: {
                        noComment: [
                            "Thank you for the {starRating}-star rating! We appreciate you taking the time to review {businessName}. Your feedback helps us understand how we're doing, and we hope to see you again soon!",
                            "We appreciate your {starRating}-star review of {businessName}! Even without specific comments, your rating gives us valuable insight. Thank you for choosing us, and we look forward to serving you again!"
                        ],
                        firstTimeVisitor: [
                            "Welcome to {businessName} and thank you for the wonderful review! We're so glad your first visit was a positive experience. We look forward to becoming your go-to destination and seeing you again soon!",
                            "Thank you for giving {businessName} a try and for the great review! It's exciting to welcome new customers, and we're thrilled your first experience was excellent. We can't wait to serve you again!"
                        ],
                        regularCustomer: [
                            "Thank you for being such a loyal customer and for this wonderful review! Your continued support of {businessName} means everything to us. We're grateful to have customers like you and look forward to many more visits together!",
                            "What a fantastic review from one of our favorite customers! Thank you for your continued loyalty to {businessName}. Your ongoing support and positive feedback help make our community stronger."
                        ]
                    },
                    tonalVariations: {
                        professional: {
                            thankYou: "Thank you for your review and for choosing {businessName}.",
                            apology: "We apologize for any inconvenience and appreciate your feedback.",
                            invitation: "We welcome the opportunity to serve you again."
                        },
                        friendly: {
                            thankYou: "Thanks so much for the awesome review!",
                            apology: "We're really sorry this happened and want to make it right.",
                            invitation: "Hope to see you again soon!"
                        },
                        warm: {
                            thankYou: "Your wonderful review just made our day!",
                            apology: "We're truly sorry and would love the chance to improve your experience.",
                            invitation: "We can't wait to welcome you back!"
                        }
                    },
                    placeholders: {
                        description: "Use these placeholders in templates for personalization:",
                        available: [
                            "{customerName} - The reviewer's display name",
                            "{businessName} - Your business name",
                            "{starRating} - The star rating given (1-5)",
                            "{reviewText} - The original review text",
                            "{date} - Current date",
                            "{location} - Business location/address"
                        ]
                    }
                };
                
                logger.info('Successfully retrieved review templates');
                
                return {
                    contents: [
                        {
                            uri: 'review_templates://templates',
                            mimeType: 'application/json',
                            text: JSON.stringify(templates, null, 2)
                        }
                    ]
                };
                
            } catch (error) {
                logger.error('Error fetching review templates resource:', error);
                
                return {
                    contents: [
                        {
                            uri: 'review_templates://templates',
                            mimeType: 'text/plain',
                            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                        }
                    ]
                };
            }
        }
    };
}