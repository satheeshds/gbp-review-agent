# AI-Powered Reply Generation

This MCP server now supports **two methods** for generating review replies:

## Method 1: Template-Based Replies (Current Default)

The `generate_reply` tool uses pre-written templates:

```
Location: Noodle House
Review: "It was awesome!" (5 stars)
→ Reply: "Thank you so much for your wonderful 5-star review! We're thrilled..."
```

**How it works:**
- Automatic tone selection based on star rating
- Pre-written professional templates
- No AI API calls needed
- Fast and reliable

## Method 2: AI-Generated Replies (Via MCP Prompts)

Use the **`review_response` prompt** to generate AI-powered replies:

### In VS Code with GitHub Copilot:

1. **Access the prompt:**
   ```
   @workspace /prompt review_response
   ```

2. **Provide context:**
   - reviewText: "Pad thai is a must try, tastes very authentic..."
   - starRating: "5"
   - businessName: "Noodle House"
   - replyTone: "grateful"

3. **Copilot generates a personalized reply** using AI

### Why use AI-generated replies?

- ✅ **Personalized** - References specific menu items, comments
- ✅ **Natural** - Sounds more human and less templated
- ✅ **Contextual** - Adapts to review sentiment and tone
- ✅ **Constructive** - Addresses concerns in negative reviews

## How to Use Both Together

```bash
# 1. Fetch reviews without replies
get_reviews for locations/YOUR_LOCATION_ID

# 2a. Quick template reply (fast)
generate_reply + post_reply

# 2b. AI-powered reply (better quality)
Use @workspace /prompt review_response
Then post_reply with the AI-generated text
```

## Current Implementation Status

### ✅ Working Now:
- Template-based reply generation
- Review fetching (filters out replied reviews)
- Posting replies to Google Business Profile
- MCP prompts for AI assistance

### 🔄 Future Enhancement:
- Direct integration with LLM APIs (OpenAI, Anthropic)
- Automatic AI reply generation in the tool
- Batch AI reply generation

## Configuration

The LLM service is initialized in `src/server/mcpServer.ts`:

```typescript
this.llmService = new LLMService();
```

To add direct AI integration, you would:
1. Pass a sampling callback to `LLMService`
2. Implement the callback to call your chosen LLM API
3. The service will automatically use AI when available, falling back to templates

## Example Workflow

1. **Fetch unreplied reviews:**
   ```typescript
   mcp_google-busine_get_reviews(locationName)
   ```

2. **Generate reply (template-based):**
   ```typescript
   mcp_google-busine_generate_reply({
     reviewText: "It was awesome!",
     starRating: 5,
     businessName: "Noodle House"
   })
   ```

3. **Post the reply:**
   ```typescript
   mcp_google-busine_post_reply({
     locationName: "locations/...",
     reviewId: "AbFvOq...",
     replyText: "Generated reply text"
   })
   ```

## Best Practices

### For Positive Reviews (4-5 stars):
- Use "grateful" or "friendly" tone
- Thank the customer
- Reference specific items they mentioned
- Invite them back

### For Negative Reviews (1-2 stars):
- Use "apologetic" tone
- Acknowledge their concerns
- Offer to resolve offline
- Provide contact information

### For Neutral Reviews (3 stars):
- Use "professional" tone
- Acknowledge feedback
- Commit to improvement
- Invite them to give another chance

## Reply Quality Metrics

The system calculates a confidence score (0-1) based on:
- Review length (more context = higher confidence)
- Rating clarity (1 or 5 stars = higher confidence)
- Reply appropriateness (length, tone match)

Template-based: 0.7-0.9 confidence
AI-generated: 0.9+ confidence (when available)
