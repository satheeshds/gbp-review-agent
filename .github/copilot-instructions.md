# Google Business Profile Review MCP Server

An MCP (Model Context Protocol) server that enables AI assistants to read Google Business Profile reviews, generate AI-powered replies, and post responses back to Google Business Profile.

## Project Overview

This project implements an MCP server that:

1. **Reads Reviews**: Fetches reviews from Google Business Profile using Google My Business API
2. **Generates Replies**: Uses LLM sampling to generate contextually appropriate responses to reviews
3. **Posts Replies**: Submits generated replies back to Google Business Profile through the API
4. **Manages Authorization**: Implements OAuth 2.1 for secure Google API access

## Architecture

- **MCP Server**: TypeScript-based server using the official MCP SDK
- **Transport**: Streamable HTTP for web-based clients
- **Authentication**: OAuth 2.1 with Google OAuth provider
- **APIs**: Google My Business API for review management
- **LLM Integration**: Uses MCP sampling for AI-powered reply generation

## Core Features

### Tools
- `get_reviews`: Fetch reviews from a Google Business Profile location
- `generate_reply`: Generate an appropriate reply to a specific review using LLM
- `post_reply`: Post a reply to a review on Google Business Profile
- `list_locations`: Get all business locations associated with the authenticated account

### Resources  
- `business_profile`: Information about the business profile and settings
- `review_templates`: Pre-defined response templates for different review types

### Prompts
- `review_response`: Template for generating professional, personalized review responses
- `sentiment_analysis`: Analyze review sentiment to tailor response tone

## Security & Authorization

- OAuth 2.1 integration with Google
- Secure token handling and validation
- Rate limiting for API calls
- User consent for all review posting actions

## Development Guidelines

- Follow MCP specification 2025-06-18
- Use TypeScript with proper type safety
- Implement comprehensive error handling
- Include structured logging
- Follow Google API best practices
- Implement proper OAuth flows