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
- **Google Business Profile API Access** (see requirements below)

### Google Business Profile API Access Requirements

Before you can use this MCP server, you must request and be approved for Google Business Profile API access. Google requires all applicants to:

1. **Manage a verified Google Business Profile** that has been active for 60+ days
   - This can be your own business or a client's business you manage
2. **Have a website** representing the business listed on the Google Business Profile
3. **Complete Google Business Profile** with current, up-to-date information

**To request API access:**

1. Go to the [Google Cloud Console](https://console.developers.google.com/project) and note your Project Number from the Project info card
2. Submit your request using the [GBP API contact form](https://support.google.com/business/contact/api_default)
   - Select "Application for Basic API Access" from the dropdown
   - Provide your Project Number and all requested information
   - Use an email address listed as an owner/manager on your business's GBP
3. Wait for review - you'll receive a follow-up email with the decision

**Check approval status** by viewing quotas in Google Cloud Console:
- **0 QPM (Queries Per Minute)** = Not yet approved
- **300 QPM** = Approved ✓

For complete prerequisites, see the [official GBP API documentation](https://developers.google.com/my-business/content/prereqs).

## Setup

### 1. Google Cloud Configuration

1. Go to the [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. **Request GBP API access** (see requirements above - this step is critical and may take time for approval)
4. **Enable the following APIs** (after your project is approved):
   - Go to "APIs & Services" > "Library"
   - Search for and enable **"Google My Business API"**
   - Search for and enable **"My Business Account Management API"**
5. Create OAuth 2.0 credentials:
   - Go to "Credentials" in the API & Services section
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Set application type to "Web application"
   - Add authorized redirect URI: `http://localhost:3000/auth/callback`
   - Note down the Client ID and Client Secret
6. **Configure OAuth Consent Screen**:
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

#### VS Code (GitHub Copilot)

Add to your VS Code MCP settings file (`mcp.json`):

**Windows:** `%APPDATA%\Code\User\profiles\<profile-id>\mcp.json`  
**macOS/Linux:** `~/.config/Code/User/profiles/<profile-id>/mcp.json`

```jsonc
{
  "servers": {
    "google-business-reviews": {
      "type": "stdio",
      "command": "node",
      "args": [
        "C:\\path\\to\\review-mcp\\build\\index.js"
      ],
      "cwd": "C:\\path\\to\\review-mcp",
      "env": {
        "NODE_ENV": "production",
        "GOOGLE_CLIENT_ID": "your-client-id.apps.googleusercontent.com",
        "GOOGLE_CLIENT_SECRET": "your-client-secret",
        "GOOGLE_REDIRECT_URI": "http://localhost:3000/auth/callback",
        "LOG_LEVEL": "info"
      },
      "description": "Google Business Profile Review MCP Server - Manage reviews with AI-powered responses"
    }
  }
}
```

**Important Notes:**
- Replace `C:\\path\\to\\review-mcp` with the actual path to your project
- Use double backslashes (`\\`) in Windows paths
- Replace `your-client-id` and `your-client-secret` with your actual OAuth credentials
- Make sure to run `npm run auth` first to authenticate before using in VS Code
- Restart VS Code after adding the configuration

#### Claude Desktop

Add to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "google-business-reviews": {
      "command": "node",
      "args": ["/path/to/review-mcp/build/index.js"],
      "env": {
        "GOOGLE_CLIENT_ID": "your-client-id.apps.googleusercontent.com",
        "GOOGLE_CLIENT_SECRET": "your-client-secret",
        "GOOGLE_REDIRECT_URI": "http://localhost:3000/auth/callback"
      }
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