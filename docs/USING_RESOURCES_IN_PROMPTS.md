# Using MCP Resources in Prompts

This guide shows different approaches for incorporating MCP resources into prompts.

## Approach 1: Instruct AI to Access Resources (Recommended)

The prompt instructs the AI assistant to read the resource themselves. This is the **cleanest and most MCP-idiomatic approach**.

### Example: `manageReviews.ts`

```typescript
export function createManageReviewsPrompt() {
    return {
        name: 'manage_pending_reviews',
        description: 'Instructs AI to use MCP resources',
        
        handler: async (args: any) => {
            const prompt = `You are managing Google Business Profile reviews.

**YOUR TASK:**
1. First, read the "reviews://all" MCP resource to see all pending reviews
2. For each review, generate a personalized reply
3. Use the 'post_reply' tool to submit replies

**AVAILABLE RESOURCES:**
- reviews://all - All unreplied reviews
- locations://list - Business locations
- business_profile://profile - Brand guidelines
- review_templates://templates - Template examples

Please start by reading the reviews://all resource.`;
            
            return prompt;
        }
    };
}
```

**Benefits:**
- ✅ Clean separation of concerns
- ✅ AI can access resources dynamically
- ✅ Resources stay up-to-date (no stale data)
- ✅ AI can choose which resources to read
- ✅ Follows MCP best practices

**How it works:**
1. Prompt tells AI which resources are available
2. AI reads the resources using MCP protocol
3. AI uses the data to complete the task

---

## Approach 2: Embed Resource Data in Prompt

The prompt handler fetches and embeds the resource data directly into the prompt text.

### Example:

```typescript
export function createManageReviewsPrompt(reviewService: IReviewService) {
    return {
        handler: async (args: any) => {
            // Fetch data directly
            const result = await reviewService.getReviews(locationName);
            const reviews = result.data?.reviews || [];
            
            // Embed in prompt
            let prompt = `You have ${reviews.length} pending reviews:\n\n`;
            
            reviews.forEach((review, i) => {
                prompt += `Review #${i + 1}:\n`;
                prompt += `Rating: ${review.starRating}\n`;
                prompt += `Text: "${review.comment}"\n\n`;
            });
            
            prompt += `Generate replies for each review.`;
            
            return prompt;
        }
    };
}
```

**Benefits:**
- ✅ Simpler for AI (data already in context)
- ✅ Works with AI that doesn't support resource access
- ✅ All data in one place

**Drawbacks:**
- ❌ Prompt can become very long with lots of data
- ❌ Requires prompt to handle service errors
- ❌ Data is stale (snapshot at prompt generation time)
- ❌ Duplicates resource functionality

**When to use:**
- Legacy AI systems without MCP resource support
- When you need to pre-filter or transform the data
- When data is small and static

---

## Approach 3: Hybrid - Reference Resources with Optional Fallback

Instruct AI to use resources, but include minimal context as fallback.

### Example:

```typescript
export function createReviewResponsePrompt() {
    return {
        handler: async (context: ReviewResponseContext) => {
            const prompt = `Generate a reply for this ${context.starRating}-star review.

**REVIEW:**
"${context.reviewText}"

**RESOURCES FOR ADDITIONAL CONTEXT:**
- business_profile://profile - Brand voice guidelines
- review_templates://templates - Example responses

**TIP:** Access the resources above for brand-specific guidance.

Write a personalized response:`;
            
            return prompt;
        }
    };
}
```

**Benefits:**
- ✅ AI can access resources if needed
- ✅ Works without resources (has basic context)
- ✅ Flexible and adaptive

---

## Comparison Table

| Approach | Prompt Size | Real-time Data | MCP-Idiomatic | AI Complexity |
|----------|-------------|----------------|---------------|---------------|
| **Instruct AI** | Small | ✅ Yes | ✅ Yes | Medium |
| **Embed Data** | Large | ❌ No | ❌ No | Low |
| **Hybrid** | Medium | ⚠️ Partial | ✅ Yes | Low |

---

## Best Practices

### 1. **Use Clear Resource URIs**
```typescript
// ✅ Good - Clear and descriptive
"Read the reviews://all resource for pending reviews"

// ❌ Bad - Vague
"Use the reviews resource"
```

### 2. **Explain What Each Resource Contains**
```typescript
const prompt = `
**AVAILABLE RESOURCES:**
- reviews://all - All unreplied reviews with ratings and text
- business_profile://profile - Your brand voice, tone guidelines
- review_templates://templates - Example responses by rating
`;
```

### 3. **Provide Instructions for Resource Usage**
```typescript
const prompt = `
Step 1: Read reviews://all to see pending reviews
Step 2: For each review, consider the rating and text
Step 3: Generate personalized replies
`;
```

### 4. **Handle Cases When Resources Might Be Empty**
```typescript
const prompt = `
Read reviews://all. If there are no pending reviews, inform the user.
Otherwise, generate replies for each review.
`;
```

### 5. **Don't Duplicate Resource Data**
```typescript
// ❌ Bad - Duplicates resource functionality
const reviews = await reviewService.getReviews();
const prompt = `Here are the reviews: ${JSON.stringify(reviews)}`;

// ✅ Good - References resource
const prompt = `Read the reviews://all resource to see pending reviews`;
```

---

## Real-World Example: Updated `manageReviews` Prompt

**Before (Old Approach):**
```typescript
// Fetched and embedded reviews directly
const result = await reviewService.getReviews(location);
const reviews = result.data?.reviews || [];

let prompt = `You have ${reviews.length} reviews:\n`;
reviews.forEach(r => {
    prompt += `Review: ${r.comment}\n`;
});
```

**After (Resource-Based Approach):**
```typescript
// Instructs AI to read the resource
const prompt = `
1. Read the reviews://all MCP resource
2. Generate replies for each review
3. Post using the post_reply tool

Available resources:
- reviews://all
- business_profile://profile
- review_templates://templates
`;
```

**Results:**
- Prompt size: 500KB → 1KB (500x smaller!)
- Real-time data: No → Yes
- MCP compliance: No → Yes
- Maintainability: Low → High

---

## Testing Your Prompts

### Test with MCP Inspector (if available)
```bash
# Start your MCP server
npm run start

# In another terminal, test resource access
mcp-inspector read-resource "reviews://all"
```

### Test Prompts Programmatically
```typescript
// Test that prompt instructs resource usage
const prompt = await manageReviewsPrompt.handler({});
console.log(prompt);

// Should contain resource URIs
assert(prompt.includes('reviews://all'));
assert(prompt.includes('business_profile://profile'));
```

---

## Conclusion

**For new prompts:** Use **Approach 1** (Instruct AI to Access Resources)
- Clean, MCP-idiomatic, real-time data
- Works great with modern AI assistants

**For legacy compatibility:** Use **Approach 3** (Hybrid)
- References resources but includes basic context
- Works with both old and new systems

**Avoid Approach 2** unless you have a specific reason:
- Creates large prompts
- Duplicates resource functionality
- Stale data
