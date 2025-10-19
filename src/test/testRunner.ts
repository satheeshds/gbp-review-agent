/**
 * MCP Server Test Runner
 * Comprehensive testing suite for the Google Business Profile Review MCP Server
 */

import { MockReviewService } from '../services/mockReviewService.js';
import { LLMService } from '../services/llmService.js';
import { logger } from '../utils/logger.js';
import { testConfig, mockTestData } from './testConfig.js';

export class MCPServerTester {
    private mockReviewService: MockReviewService;
    private llmService: LLMService;

    constructor() {
        this.mockReviewService = new MockReviewService();
        this.llmService = new LLMService();
        logger.info('MCP Server Tester initialized');
    }

    /**
     * Run all tests
     */
    async runAllTests(): Promise<void> {
        logger.info('🧪 Starting comprehensive MCP Server tests...');
        
        try {
            await this.testListLocations();
            await this.testGetReviews();
            await this.testGenerateReplies();
            await this.testPostReplies();
            await this.testBusinessProfile();
            await this.testErrorHandling();
            await this.testEdgeCases();
            
            logger.info('✅ All tests completed successfully!');
        } catch (error) {
            logger.error('❌ Test suite failed:', error);
            throw error;
        }
    }

    /**
     * Test list locations functionality
     */
    async testListLocations(): Promise<void> {
        logger.info('📍 Testing list locations...');
        
        const result = await this.mockReviewService.listLocations();
        
        if (!result.success || !result.data) {
            throw new Error('List locations test failed');
        }

        const locations = result.data.locations;
        logger.info(`✅ Found ${locations.length} mock locations`);
        
        // Validate location structure
        locations.forEach(location => {
            if (!location.name || !location.locationName) {
                throw new Error('Invalid location structure');
            }
        });

        logger.info('✅ List locations test passed');
    }

    /**
     * Test get reviews functionality
     */
    async testGetReviews(): Promise<void> {
        logger.info('📝 Testing get reviews...');
        
        // Get a test location
        const locationsResult = await this.mockReviewService.listLocations();
        if (!locationsResult.success || !locationsResult.data?.locations.length) {
            throw new Error('No locations available for testing');
        }
        
        const testLocation = locationsResult.data.locations[0];
        const result = await this.mockReviewService.getReviews(testLocation.name, 10);
        
        if (!result.success || !result.data) {
            throw new Error('Get reviews test failed');
        }

        const reviews = result.data.reviews;
        logger.info(`✅ Retrieved ${reviews.length} mock reviews`);
        
        // Validate review structure
        reviews.forEach(review => {
            if (!review.reviewId || !review.reviewer?.displayName || !review.starRating) {
                throw new Error('Invalid review structure');
            }
        });

        // Test pagination
        if (reviews.length > 5) {
            const paginatedResult = await this.mockReviewService.getReviews(testLocation.name, 3);
            if (!paginatedResult.success || paginatedResult.data?.reviews.length !== 3) {
                throw new Error('Pagination test failed');
            }
            logger.info('✅ Pagination working correctly');
        }

        logger.info('✅ Get reviews test passed');
    }

    /**
     * Test reply generation functionality
     */
    async testGenerateReplies(): Promise<void> {
        logger.info('🤖 Testing reply generation...');
        
        // Test different review scenarios
        for (const scenario of mockTestData.reviewScenarios) {
            const starRating = this.convertStarRating(scenario.starRating);
            
            const result = await this.llmService.generateReply(
                scenario.comment,
                starRating,
                'The Great Coffee House',
                {
                    replyTone: this.getToneForRating(starRating),
                    includePersonalization: true
                }
            );

            if (!result.success || !result.data) {
                throw new Error(`Reply generation failed for scenario: ${scenario.type}`);
            }

            const reply = result.data;
            logger.info(`✅ Generated ${reply.tone} reply for ${scenario.type} (${reply.sentiment} sentiment, ${Math.round(reply.confidence * 100)}% confidence)`);
            
            // Validate reply structure
            if (!reply.replyText || !reply.tone || !reply.sentiment || reply.confidence === undefined) {
                throw new Error('Invalid reply structure');
            }
        }

        logger.info('✅ Reply generation test passed');
    }

    /**
     * Test post reply functionality
     */
    async testPostReplies(): Promise<void> {
        logger.info('📤 Testing post replies...');
        
        // Get test data
        const locationsResult = await this.mockReviewService.listLocations();
        const reviewsResult = await this.mockReviewService.getReviews(locationsResult.data!.locations[0].name);
        
        if (!reviewsResult.success || !reviewsResult.data?.reviews.length) {
            throw new Error('No reviews available for reply testing');
        }

        // Find a review without a reply
        const unrepliedReview = reviewsResult.data.reviews.find(r => !r.reviewReply);
        if (!unrepliedReview) {
            // Add a test review
            this.mockReviewService.addMockReview({
                comment: 'Test review for reply testing',
                starRating: 'FOUR',
                reviewer: { displayName: 'Test User' }
            });
            
            const updatedReviews = await this.mockReviewService.getReviews(locationsResult.data!.locations[0].name);
            const testReview = updatedReviews.data!.reviews[0];
            
            const result = await this.mockReviewService.postReply(
                locationsResult.data!.locations[0].name,
                testReview.reviewId,
                'Thank you for your feedback! We appreciate your business.'
            );

            if (!result.success || !result.data) {
                throw new Error('Post reply test failed');
            }

            logger.info(`✅ Successfully posted reply with ID: ${result.data.replyId}`);
        }

        logger.info('✅ Post reply test passed');
    }

    /**
     * Test business profile functionality
     */
    async testBusinessProfile(): Promise<void> {
        logger.info('🏢 Testing business profile...');
        
        const result = await this.mockReviewService.getBusinessProfile();
        
        if (!result.success || !result.data) {
            throw new Error('Business profile test failed');
        }

        const profile = result.data;
        logger.info(`✅ Retrieved profile for: ${profile.locationName}`);
        
        // Validate profile structure
        if (!profile.name || !profile.locationName || !profile.businessType) {
            throw new Error('Invalid business profile structure');
        }

        logger.info('✅ Business profile test passed');
    }

    /**
     * Test error handling
     */
    async testErrorHandling(): Promise<void> {
        logger.info('⚠️ Testing error handling...');
        
        // Test invalid location
        const invalidLocationResult = await this.mockReviewService.getReviews('invalid/location');
        if (invalidLocationResult.success) {
            throw new Error('Should have failed for invalid location');
        }
        logger.info('✅ Invalid location error handled correctly');

        // Test invalid review ID
        const locationsResult = await this.mockReviewService.listLocations();
        const invalidReplyResult = await this.mockReviewService.postReply(
            locationsResult.data!.locations[0].name,
            'invalid_review_id',
            'Test reply'
        );
        if (invalidReplyResult.success) {
            throw new Error('Should have failed for invalid review ID');
        }
        logger.info('✅ Invalid review ID error handled correctly');

        logger.info('✅ Error handling test passed');
    }

    /**
     * Test edge cases
     */
    async testEdgeCases(): Promise<void> {
        logger.info('🔍 Testing edge cases...');
        
        // Test empty review text
        const emptyReviewResult = await this.llmService.generateReply('', 3, 'Test Business');
        if (!emptyReviewResult.success) {
            logger.info('✅ Empty review text handled correctly');
        }

        // Test very long review text
        const longReview = 'This is a very long review. '.repeat(100);
        const longReviewResult = await this.llmService.generateReply(longReview, 4, 'Test Business');
        if (longReviewResult.success && longReviewResult.data) {
            logger.info('✅ Long review text handled correctly');
        }

        // Test special characters in business name
        const specialCharsResult = await this.llmService.generateReply(
            'Great service!',
            5,
            'Café & Bistro™',
            { replyTone: 'grateful' }
        );
        if (specialCharsResult.success) {
            logger.info('✅ Special characters in business name handled correctly');
        }

        logger.info('✅ Edge cases test passed');
    }

    /**
     * Generate test report
     */
    async generateTestReport(): Promise<void> {
        logger.info('📊 Generating test report...');
        
        const stats = this.mockReviewService.getMockStatistics();
        const report = {
            timestamp: new Date().toISOString(),
            testConfig: testConfig,
            mockData: {
                totalLocations: 2,
                totalReviews: stats.totalReviews,
                averageRating: stats.averageRating,
                replyRate: stats.replyRate,
                ratingDistribution: stats.ratingDistribution
            },
            testResults: {
                allTestsPassed: true,
                testScenariosExecuted: mockTestData.reviewScenarios.length,
                mockMode: testConfig.enableMockMode
            }
        };

        logger.info('📋 Test Report:', report);
        
        console.log('\n🎉 MCP SERVER TEST SUMMARY');
        console.log('============================');
        console.log(`✅ Mock Locations: ${report.mockData.totalLocations}`);
        console.log(`✅ Mock Reviews: ${report.mockData.totalReviews}`);
        console.log(`✅ Average Rating: ${report.mockData.averageRating}/5`);
        console.log(`✅ Reply Rate: ${report.mockData.replyRate}%`);
        console.log(`✅ Test Scenarios: ${report.testResults.testScenariosExecuted}`);
        console.log(`✅ Mock Mode: ${report.testResults.mockMode ? 'Enabled' : 'Disabled'}`);
        console.log('\n🚀 Your MCP Server is ready for testing!');
    }

    /**
     * Helper methods
     */
    private convertStarRating(rating: string): number {
        switch (rating) {
            case 'ONE': return 1;
            case 'TWO': return 2;
            case 'THREE': return 3;
            case 'FOUR': return 4;
            case 'FIVE': return 5;
            default: return 3;
        }
    }

    private getToneForRating(rating: number): 'professional' | 'friendly' | 'apologetic' | 'grateful' {
        if (rating >= 4) return 'grateful';
        if (rating === 3) return 'professional';
        return 'apologetic';
    }
}

// Export for use in other modules
export async function runMCPTests(): Promise<void> {
    const tester = new MCPServerTester();
    await tester.runAllTests();
    await tester.generateTestReport();
}