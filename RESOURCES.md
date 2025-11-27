# MCP Resources

This MCP server provides read-only resources that can be accessed by AI assistants and other MCP clients to gather context about your Google Business Profile.

## Available Resources

### 1. **Locations** (`locations://list`)
Lists all business locations associated with your Google Business Profile account.

**URI**: `locations://list`

**Returns**:
```json
{
  "totalCount": 1,
  "locations": [
    {
      "name": "locations/6087465285515339471",
      "displayName": "Noodle House",
      "address": {
        "addressLines": ["Kulathoor, Near NH Service Road"],
        "locality": "Thiruvananthapuram",
        "administrativeArea": "Kerala",
        "postalCode": "695583",
        "regionCode": "IN"
      },
      "phone": "+91 1234567890",
      "website": "https://noodlehouse.in/"
    }
  ]
}
```

**Use Cases**:
- Get location IDs for fetching reviews
- Display business information
- Multi-location management

---

### 2. **Reviews** (`reviews://{locationId}` and `reviews://all`)
Fetches unreplied reviews for specific locations or all locations.

**Dynamic URI**: `reviews://{locationId}` (replace `{locationId}` with actual location ID)  
**Convenience URI**: `reviews://all` (all locations at once)

**Example URIs**:
- `reviews://locations/6087465285515339471` - Reviews for specific location
- `reviews://all` - All unreplied reviews across all locations

**Returns** (for specific location):
```json
{
  "locationName": "locations/6087465285515339471",
  "totalReviews": 50,
  "unrepliedCount": 6,
  "reviews": [
    {
      "id": "AbFvOqk7ktaqtIRXifV8ph...",
      "rating": "FIVE",
      "text": "Great food!",
      "author": "John Doe",
      "isAnonymous": false,
      "createTime": "2025-11-20T10:30:00Z",
      "updateTime": "2025-11-20T10:30:00Z",
      "hasReply": false
    }
  ]
}
```

**Returns** (for all locations):
```json
{
  "totalLocations": 1,
  "totalUnrepliedReviews": 6,
  "locations": [
    {
      "location": {
        "name": "locations/6087465285515339471",
        "displayName": "Noodle House",
        "address": {...}
      },
      "reviews": [...],
      "totalReviews": 50,
      "unrepliedCount": 6
    }
  ]
}
```

**Use Cases**:
- Check pending reviews for a specific location (using dynamic URI)
- Get overview of all locations' reviews (using reviews://all)
- Fetch fresh review data in real-time
- Filter reviews by location

---

### 3. **Business Profile** (`business_profile://profile`)
Provides enhanced business profile information with response guidelines and brand voice.

**URI**: `business_profile://profile`

**Returns**:
```json
{
  "name": "locations/6087465285515339471",
  "locationName": "Noodle House",
  "address": {...},
  "businessType": "Restaurant",
  "language": "en",
  "description": "Noodle House",
  "categories": ["Asian Restaurant", "Noodle Shop"],
  "responseGuidelines": {
    "tone": "professional and friendly",
    "style": "conversational yet business-appropriate",
    "thankCustomers": true,
    "addressConcerns": true,
    "inviteReturn": true,
    "includeBusinessName": true,
    "maxLength": 4096,
    "language": "en"
  },
  "brandVoice": {
    "personality": "warm, welcoming, food-passionate",
    "values": [
      "customer satisfaction",
      "quality service",
      "continuous improvement",
      "community engagement"
    ]
  }
}
```

**Use Cases**:
- Generate consistent brand voice in responses
- Understand business context for better replies
- Apply response guidelines automatically

---

### 4. **Review Templates** (`review_templates://templates`)
Pre-defined response templates for different review types and scenarios.

**URI**: `review_templates://templates`

**Returns**: Comprehensive template library organized by:
- **Star ratings** (5-star, 4-star, 3-star, 1-2 star)
- **Specific scenarios** (food service, retail, service industry)
- **Special situations** (no comment, first-time visitor, regular customer)
- **Tonal variations** (professional, friendly, warm)

**Template Example**:
```json
{
  "positiveReviews": {
    "fiveStars": [
      "Thank you so much for the wonderful 5-star review, {customerName}! We're thrilled to hear about your positive experience with {businessName}..."
    ]
  }
}
```

**Placeholders**:
- `{customerName}` - Reviewer's display name
- `{businessName}` - Your business name
- `{starRating}` - Star rating (1-5)
- `{reviewText}` - Original review text
- `{date}` - Current date
- `{location}` - Business location/address

**Use Cases**:
- Quick response generation
- Consistent messaging
- Training data for AI responses
- Fallback when LLM is unavailable

---

## How to Use Resources

### In Prompts
Resources can be referenced in prompts to provide context:

```typescript
// Example: Using locations resource in a prompt
const locations = await client.readResource('locations://list');
const prompt = `Based on these locations: ${locations}...`;
```

### In AI Assistants
AI assistants with MCP support can automatically access these resources to:
- Understand your business context
- Generate appropriate responses
- Stay consistent with your brand voice

### Direct Access
```bash
# Using MCP CLI (if available)
mcp read-resource "reviews://all"
mcp read-resource "locations://list"
```

---

## Benefits of Resource-Based Architecture

1. **Read-Only Access**: Resources are safe to expose - they only read data, never modify
2. **Cacheable**: Resource responses can be cached for performance
3. **Context-Rich**: Provides comprehensive context without requiring multiple tool calls
4. **Standardized**: MCP standard format for interoperability
5. **Discoverable**: Clients can list available resources automatically

---

## Next Steps

- **Enhance Prompts**: Update review response prompts to reference these resources
- **Cache Strategy**: Implement caching for frequently accessed resources
- **Dynamic Resources**: Add support for per-location review resources
- **Webhooks**: Consider webhook-triggered resource updates for real-time data
