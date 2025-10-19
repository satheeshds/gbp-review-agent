/**
 * Testing Configuration for MCP Server
 * Enables mock mode for testing without Google Business Profile access
 */

export interface TestConfig {
    enableMockMode: boolean;
    mockDelay: number;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    testScenarios: {
        positiveReviews: boolean;
        negativeReviews: boolean;
        neutralReviews: boolean;
        repliedReviews: boolean;
        multipleLocations: boolean;
    };
}

export const testConfig: TestConfig = {
    enableMockMode: process.env.NODE_ENV !== 'production',
    mockDelay: parseInt(process.env.MOCK_DELAY || '200'),
    logLevel: (process.env.LOG_LEVEL as any) || 'info',
    testScenarios: {
        positiveReviews: true,
        negativeReviews: true,
        neutralReviews: true,
        repliedReviews: true,
        multipleLocations: true
    }
};

export const mockTestData = {
    businessProfiles: [
        {
            name: 'The Great Coffee House',
            type: 'restaurant',
            description: 'Artisanal coffee and fresh pastries in the heart of the city',
            categories: ['Coffee Shop', 'Bakery', 'Breakfast Restaurant']
        },
        {
            name: 'Downtown Bakery',
            type: 'retail',
            description: 'Fresh baked goods and custom cakes since 1995',
            categories: ['Bakery', 'Dessert Shop', 'Custom Cakes']
        }
    ],
    reviewScenarios: [
        {
            type: 'excellent_service',
            starRating: 'FIVE',
            comment: 'Outstanding service and amazing coffee! The barista recommended the perfect blend and the atmosphere is so cozy. Definitely my new favorite spot!',
            customerName: 'Jennifer Walsh'
        },
        {
            type: 'poor_service',
            starRating: 'TWO',
            comment: 'Very disappointed with today\'s visit. The coffee was cold, service was slow, and the staff seemed disinterested. Expected much better.',
            customerName: 'Robert Kim'
        },
        {
            type: 'average_experience',
            starRating: 'THREE',
            comment: 'It\'s fine. Nothing spectacular but gets the job done. Coffee is decent for the price.',
            customerName: 'Maria Gonzalez'
        },
        {
            type: 'food_quality',
            starRating: 'FOUR',
            comment: 'Really enjoyed the pastries and the coffee was excellent. Only downside was the long wait during lunch rush.',
            customerName: 'Alex Turner'
        },
        {
            type: 'atmosphere_praise',
            starRating: 'FIVE',
            comment: 'Perfect place to work remotely! Great WiFi, comfortable seating, and the background music is just right. Plus the coffee is fantastic!',
            customerName: 'Sophie Chen'
        },
        {
            type: 'complaint_resolved',
            starRating: 'ONE',
            comment: 'Had a terrible experience last week but the manager reached out and made it right. Still not sure if I\'ll be back though.',
            customerName: 'Michael Brown'
        }
    ]
};