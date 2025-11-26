# Google Business Profile Review MCP Server

A Model Context Protocol (MCP) server that enables AI assistants to manage Google Business Profile reviews through intelligent automation.

## Features

- **Review Management**: Fetch and analyze Google Business Profile reviews
- **AI-Powered Responses**: Generate contextually appropriate replies using LLM sampling
- **Automated Posting**: Post replies back to Google Business Profile
- **OAuth Integration**: Secure authentication with Google APIs
- **Rate Limiting**: Respectful API usage with built-in rate limiting
- **Structured Logging**: Comprehensive logging for debugging and monitoring

## Prerequisites

- Node.js 18.0.0 or higher
- Google Cloud Platform account with My Business API enabled
- Google OAuth 2.0 credentials

## Setup

### 1. Google Cloud Configuration

1. Go to the [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. **Enable the following APIs**:
   - Go to "APIs & Services" > "Library"
   - Search for and enable **"Google My Business API"**
   - Search for and enable **"My Business Business Information API"**
4. Create OAuth 2.0 credentials:
   - Go to "Credentials" in the API & Services section
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Set application type to "Web application"
   - Add authorized redirect URI: `http://localhost:3000/auth/callback`
   - Note down the Client ID and Client Secret
5. **Configure OAuth Consent Screen**:
   - Go to "APIs & Services" > "OAuth consent screen"
   - Add test users (your Google account email that has access to the business profile)
   - Add required scopes: `business.manage`, `userinfo.email`, `userinfo.profile`

### 2. Installation

```bash
# Clone the repository
git clone <repository-url>
cd review-mcp

# Install dependencies
npm install

# Build the project
npm run build
```

### 3. Configuration

```bash
# Copy the environment template
cp .env.example .env

# Edit .env with your credentials
# Add your Google OAuth credentials and other settings
```

Required environment variables:
- `GOOGLE_CLIENT_ID`: Your Google OAuth 2.0 Client ID
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth 2.0 Client Secret
- `GOOGLE_REDIRECT_URI`: OAuth redirect URI (default: http://localhost:3000/auth/callback)

### 4. Authentication

Before running the server, you need to authenticate with Google:

```bash
# Run the authentication helper
npm run auth
```

This will:
1. Open your browser to Google's authentication page
2. Ask you to grant permissions to access your Google Business Profile
3. Save the authentication tokens locally
4. These tokens will be automatically used by the MCP server

### 5. Running the Server

```bash
# Start the server with your authenticated credentials
npm start

# Or in development/mock mode for testing
npm run start:mock
```

The server will start with STDIO transport for MCP communication.

## Usage

### Connecting to MCP Clients

You can connect to this server using any MCP-compatible client:

#### Claude Desktop
Add to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "google-business-reviews": {
      "command": "node",
      "args": ["/path/to/build/index.js"]
    }
  }
}
```

#### HTTP Clients
Connect to: `http://localhost:3000/mcp`

### Available Tools

1. **`list_locations`**: Get all business locations associated with your account
2. **`get_reviews`**: Fetch reviews for a specific location
3. **`generate_reply`**: Generate an AI response to a review
4. **`post_reply`**: Post a reply to a review on Google Business Profile

### Available Resources

1. **`business_profile`**: Business profile information and settings
2. **`review_templates`**: Pre-defined response templates

### Available Prompts

1. **`review_response`**: Generate professional review responses
2. **`sentiment_analysis`**: Analyze review sentiment

## Development

### Project Structure

```
src/
├── index.ts              # Main server entry point
├── server/               # MCP server implementation
│   ├── mcpServer.ts     # Core MCP server setup
│   ├── tools/           # Tool implementations
│   ├── resources/       # Resource implementations
│   └── prompts/         # Prompt implementations
├── services/            # Business logic services
│   ├── googleAuth.ts    # Google OAuth handling
│   ├── reviewService.ts # Review management
│   └── llmService.ts    # LLM interaction
├── types/               # TypeScript type definitions
└── utils/               # Utility functions
```

### Scripts

- `npm run dev`: Start development server with hot reload
- `npm run build`: Build the TypeScript project
- `npm run lint`: Run ESLint
- `npm run test`: Run tests
- `npm run clean`: Clean build directory

## API Documentation

### Authentication Flow

1. User initiates OAuth flow through the MCP client
2. Server redirects to Google OAuth consent screen
3. User grants permissions for Google My Business access
4. Server receives authorization code and exchanges for access token
5. Token is stored securely for subsequent API calls

### Rate Limiting

The server implements rate limiting to respect Google API quotas:
- 60 requests per minute per user (configurable)
- Exponential backoff for failed requests
- Graceful error handling for quota exceeded

## Security Considerations

- All Google API calls use OAuth 2.0 authentication
- Access tokens are stored securely and refreshed automatically
- Input validation and sanitization for all user inputs
- Rate limiting to prevent abuse
- Comprehensive logging for security monitoring

## Troubleshooting

### Common Issues

1. **OAuth Error**: Ensure redirect URI matches exactly what's configured in Google Cloud Console
2. **API Quota Exceeded**: Check your Google Cloud Console for API usage and limits
3. **Permission Denied**: Verify the Google account has access to the business profile

### Logging

Enable debug logging by setting `LOG_LEVEL=debug` in your `.env` file.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the logs with debug level enabled
3. Open an issue on GitHub with detailed information about the problem