/**
 * Analyze Review Statistics Prompt
 * Generate insights and recommendations from review statistics
 */

import { logger } from '../../utils/logger.js';

export interface AnalyzeReviewStatsPrompt {
    name: string;
    description: string;
    handler: () => Promise<string>;
}

export function createAnalyzeReviewStatsPrompt(): AnalyzeReviewStatsPrompt {
    return {
        name: 'analyze_review_stats',
        description: 'Instructs the AI to fetch review statistics and provide comprehensive analysis with actionable insights',
        
        handler: async (): Promise<string> => {
            try {
                logger.info('Generating analyze_review_stats prompt');
                
                let prompt = `You are a business intelligence analyst specializing in customer review analysis. Your task is to analyze review statistics and provide actionable insights.

YOUR TASK:
1. First, read the locations MCP resource to see available business locations
2. If multiple locations exist, ask the user which location they want to analyze
3. Once location is selected, use the 'get_review_day_stats' tool with the location name
4. Analyze the statistics data and provide comprehensive insights
5. Generate specific, prioritized recommendations

**INSTRUCTIONS:**

Step 1: Check available locations
- Read: locations resource (locations://list)
- This will show you all available business locations with their names and IDs
- If multiple locations exist, present them to the user and ask which one to analyze
- If only one location, proceed automatically with that location

Step 2: Fetch review statistics
- Use the 'get_review_day_stats' tool with the selected location name
- This will return daily statistics including:
  * Date-by-date review counts
  * Average ratings per day
  * Rating distribution (1-5 stars)
  * Customer comments

Step 3: Analyze the statistics and provide insights on:

**A. Overall Performance Assessment:**
   - Evaluate the overall rating trend (excellent, good, average, concerning)
   - Compare against typical industry benchmarks
   - Assess review volume consistency and patterns
   - Determine if performance is above, at, or below expectations

**B. Trend Analysis:**
   - Identify upward or downward trends in ratings over time
   - Detect sudden changes or anomalies in review patterns
   - Analyze review volume trends (increasing, stable, decreasing)
   - Note correlations between volume and quality
   - Identify weekly or seasonal patterns

**C. Rating Distribution Insights:**
   - Analyze the spread across 1-5 star ratings
   - Calculate percentage of positive (4-5 stars) vs negative (1-2 stars)
   - Identify if ratings are polarized or consistently distributed
   - Highlight concerning patterns in low-rating frequency
   - Assess the "health" of the rating distribution

**D. Peak Performance Days:**
   - Identify days with highest ratings and review volume
   - Analyze what might have contributed to exceptional performance
   - Look for patterns in high-performing periods
   - Extract lessons from best days

**E. Problem Areas & Red Flags:**
   - Identify days with lowest ratings or rating drops
   - Flag clusters of negative reviews
   - Detect potential service issues or problem patterns
   - Highlight urgent concerns needing immediate attention
   - Note recurring themes in negative feedback

**F. Customer Sentiment Analysis:**
   - Analyze common themes from review comments
   - Identify frequently mentioned topics (positive and negative)
   - Detect emotional patterns in customer feedback
   - Extract specific pain points customers are experiencing
   - Highlight what customers appreciate most

**G. Actionable Recommendations:**
   - Provide 5-7 specific, prioritized recommendations for improvement
   - Suggest strategies to increase positive reviews
   - Recommend approaches to address negative feedback patterns
   - Propose customer service improvements based on patterns
   - Suggest operational changes to address recurring issues
   - Recommend response strategies for different review types

**H. Key Performance Indicators (KPIs):**
   - Define target metrics for the next 30/60/90 days
   - Suggest warning thresholds to monitor
   - Recommend tracking frequencies for different metrics
   - Identify leading indicators of potential issues

**I. Strategic Insights:**
   - Identify opportunities for business growth
   - Suggest areas for staff training or process improvement
   - Recommend customer engagement strategies
   - Propose ways to leverage positive feedback
   - Highlight untapped potential in customer satisfaction

**OUTPUT REQUIREMENTS:**
- Be specific and data-driven in your analysis
- Prioritize recommendations by impact and urgency (HIGH/MEDIUM/LOW)
- Provide clear, actionable steps (not just general advice)
- Use the actual data to support your conclusions
- Format your response in clear sections with headers
- Use bullet points for easy scanning
- Include specific examples from the comment data when relevant
- Use emojis strategically for visual emphasis (⭐📈📉🔴🟡🟢)
- Conclude with a one-paragraph executive summary

**AVAILABLE MCP RESOURCES:**
- locations://list - All business locations with IDs
- business_profile://profile - Business context and information

Please start by reading the locations://list resource to see available locations.`;

                logger.info('Successfully generated analyze_review_stats prompt');
                
                return prompt;
                
            } catch (error) {
                logger.error('Error generating analyze_review_stats prompt:', error);
                throw new Error(`Failed to generate analyze_review_stats prompt: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    };
}
