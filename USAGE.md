# Google Business Profile Review MCP Server - Usage Guide

## Overview

This MCP (Model Context Protocol) server enables AI assistants to manage Google Business Profile reviews through:

1. **Reading Reviews**: Fetch reviews from Google Business Profile locations
2. **AI-Powered Replies**: Generate contextually appropriate responses using LLM sampling
3. **Posting Replies**: Submit generated replies back to Google Business Profile
4. **OAuth Authentication**: Secure Google API access with OAuth 2.1

## Setup and Installation

### Prerequisites
- Node.js 18+ and npm
- Google Cloud Console project with My Business API enabled
- Google OAuth 2.0 credentials

### Installation
```bash
git clone <repository-url>
cd review-mcp
npm install
npm run build
```

### Environment Configuration
Copy `.env.example` to `.env` and configure:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback

# Server Configuration
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# Optional: Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

## Starting the Server

### STDIO Transport (for MCP clients)
```bash
npm start
```

### HTTP Transport (for web clients)
```bash
npm start -- --transport=http
```

### Development Mode
```bash
npm run dev
```

## Available Tools

### 1. `list_locations`
Fetches all business locations associated with your Google Business Profile account.

**Parameters**: None

**Example Response**:
```json
{
  "locations": [
    {
      "name": "accounts/123/locations/456",
      "locationName": "My Restaurant",
      "primaryPhone": "+1-555-0123",
      "address": {
        "addressLines": ["123 Main St"],
        "locality": "Anytown",
        "administrativeArea": "CA",
        "postalCode": "12345",
        "regionCode": "US"
      }
    }
  ]
}
```

### 2. `get_reviews`
Retrieves customer reviews for a specific business location.

**Parameters**:
- `locationName` (required): Full resource name of the location
- `pageSize` (optional): Number of reviews to fetch (default: 50)
- `pageToken` (optional): Token for pagination

**Example**:
```json
{
  "locationName": "accounts/123/locations/456",
  "pageSize": 10
}
```

### 3. `generate_reply`
Generates an AI-powered response to a customer review.

**Parameters**:
- `reviewText` (required): The customer's review text
- `starRating` (required): Star rating (1-5)
- `businessName` (required): Name of your business
- `replyTone` (optional): Desired tone (professional, friendly, apologetic, grateful)
- `includePersonalization` (optional): Whether to personalize the response

**Example**:
```json
{
  "reviewText": "Great food and excellent service!",
  "starRating": 5,
  "businessName": "My Restaurant",
  "replyTone": "grateful"
}
```

### 4. `post_reply`
Posts a reply to a specific customer review on Google Business Profile.

**Parameters**:
- `locationName` (required): Full resource name of the location
- `reviewId` (required): ID of the review to reply to
- `replyText` (required): The reply text to post

**Example**:
```json
{
  "locationName": "accounts/123/locations/456", 
  "reviewId": "review_abc123",
  "replyText": "Thank you for the wonderful review! We're thrilled you enjoyed your experience."
}
```

## Available Resources

### 1. `business_profile://profile`
Provides comprehensive business profile information and response guidelines.

Contains:
- Business details (name, address, phone, etc.)
- Response guidelines and best practices
- Brand voice and personality traits
- Common response templates

### 2. `review_templates://templates`
Pre-defined response templates for different review scenarios.

Includes templates for:
- Positive reviews (4-5 stars)
- Negative reviews (1-2 stars)
- Neutral reviews (3 stars)
- Industry-specific responses (food service, retail, general service)
- Special situations (first-time visitors, regular customers)

## Available Prompts

### 1. `review_response`
Generates detailed prompts for creating personalized review responses.

**Parameters**:
- `reviewText`: The customer review to respond to
- `starRating`: Star rating given (1-5)
- `businessName`: Your business name
- `businessType`: Type of business (optional)
- `customerName`: Customer's name (optional)
- `replyTone`: Desired response tone
- `previousReplies`: JSON array of previous replies for consistency (optional)

### 2. `sentiment_analysis`
Analyzes review sentiment and provides response strategy recommendations.

**Parameters**:
- `reviewText`: The review text to analyze
- `includeEmotions`: Whether to include emotional analysis (true/false)
- `includeKeywords`: Whether to include keyword extraction (true/false)

## OAuth Authentication Flow

1. Start the server with HTTP transport
2. Navigate to `http://localhost:3000/auth` to begin OAuth flow
3. Grant permissions to access Google My Business data
4. Server receives and stores OAuth tokens automatically
5. All subsequent API calls use the stored tokens

## Error Handling

The server provides comprehensive error handling:

- **Authentication Errors**: Automatic token refresh when possible
- **Rate Limiting**: Built-in rate limiting to prevent API quota exhaustion  
- **Validation Errors**: Clear error messages for invalid inputs
- **Google API Errors**: Detailed error information from Google APIs

## Logging

Structured JSON logging with configurable levels:
- `debug`: Detailed debugging information
- `info`: General operational information
- `warn`: Warning conditions
- `error`: Error conditions

Logs are output to stderr in JSON format for easy parsing.

## Best Practices

### Response Generation
- Always review AI-generated responses before posting
- Customize the tone based on review sentiment and business type
- Include specific details from the customer's review when possible
- Maintain consistency with your brand voice

### Rate Limiting
- Be mindful of Google API quotas
- Use pagination for large numbers of reviews
- Consider implementing delays between requests in batch operations

### Security
- Keep OAuth credentials secure and never commit them to version control
- Regularly rotate client secrets
- Monitor for unusual API usage patterns

## Troubleshooting

### Common Issues

1. **OAuth Errors**: Ensure redirect URI matches exactly in Google Cloud Console
2. **API Quota Exceeded**: Check Google Cloud Console for quota limits and usage
3. **Permission Denied**: Verify that the Google account has access to the business locations
4. **Build Errors**: Ensure Node.js 18+ and all dependencies are installed

### Support
- Check logs for detailed error information
- Verify environment configuration
- Ensure Google My Business API is enabled in Google Cloud Console
- Test OAuth flow manually through the web interface

## Development

### Project Structure
```
src/
├── index.ts              # Main entry point
├── server/
│   ├── mcpServer.ts      # Main MCP server implementation
│   ├── tools/            # MCP tool implementations
│   ├── resources/        # MCP resource implementations
│   └── prompts/          # MCP prompt implementations
├── services/
│   ├── googleAuth.ts     # Google OAuth service
│   ├── reviewService.ts  # Google My Business API service
│   └── llmService.ts     # LLM integration service
├── utils/
│   ├── config.ts         # Configuration validation
│   └── logger.ts         # Structured logging utility
└── types/
    └── index.ts          # TypeScript type definitions
```

### Adding New Features
1. Define types in `src/types/index.ts`
2. Implement service logic in appropriate service files
3. Create MCP tools, resources, or prompts as needed
4. Register new components in `mcpServer.ts`
5. Update tests and documentation

This MCP server provides a complete solution for AI-powered Google Business Profile review management, with robust error handling, security, and extensibility.