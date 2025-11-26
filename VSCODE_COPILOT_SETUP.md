# VS Code + GitHub Copilot MCP Server Setup

## Method 1: User Settings (Recommended)

1. **Open VS Code Settings**:
   - Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
   - Type "Preferences: Open User Settings (JSON)"
   - Click on it

2. **Add MCP Server Configuration**:
   Add this to your `settings.json`:

```json
{
  "github.copilot.chat.mcp.servers": {
    "google-business-reviews": {
      "command": "node",
      "args": ["C:\\Users\\david\\source\\review-mcp\\build\\index.js"],
      "env": {
        "NODE_ENV": "development", 
        "ENABLE_MOCK_MODE": "true",
        "LOG_LEVEL": "info"
      },
      "description": "Google Business Profile Review Management with AI-powered responses"
    }
  }
}
```

**Note**: Update the path in `args` to match your actual project location.

## Method 2: Workspace Settings

1. **Create Workspace Settings**:
   In your project root (`C:\Users\david\source\review-mcp`), create `.vscode/settings.json`:

```json
{
  "github.copilot.chat.mcp.servers": {
    "google-business-reviews": {
      "command": "node",
      "args": ["./build/index.js"],
      "cwd": "${workspaceFolder}",
      "env": {
        "NODE_ENV": "development",
        "ENABLE_MOCK_MODE": "true",
        "LOG_LEVEL": "info"
      },
      "description": "Google Business Profile Review MCP Server"
    }
  }
}
```

## Method 3: Global MCP Configuration

1. **Install Server Globally** (Optional):
```bash
npm install -g .
```

2. **Use Global Command**:
```json
{
  "github.copilot.chat.mcp.servers": {
    "google-business-reviews": {
      "command": "google-business-review-mcp-server",
      "env": {
        "NODE_ENV": "development",
        "ENABLE_MOCK_MODE": "true"
      }
    }
  }
}
```

## Setup Steps

### 1. **Prerequisites**
- ✅ VS Code with GitHub Copilot extension installed
- ✅ GitHub Copilot Chat extension installed  
- ✅ Your MCP server built (`npm run build`)

### 2. **Build Your Server**
```bash
cd C:\Users\david\source\review-mcp
npm run build
```

### 3. **Test Server Locally**
```bash
# Test that it starts correctly
npm run start:mock
```
You should see: `🧪 Starting in MOCK MODE - No Google API required`

### 4. **Configure in VS Code**
Choose one of the methods above and add the configuration to your VS Code settings.

### 5. **Restart VS Code**
After adding the configuration, restart VS Code to load the MCP server.

### 6. **Verify Connection**
1. Open GitHub Copilot Chat in VS Code
2. Type `@workspace` to see if your MCP server tools are available
3. Look for tools like `list_locations`, `get_reviews`, `generate_reply`

## Testing with GitHub Copilot

Once configured, you can use these commands in Copilot Chat:

### **Basic Commands**
```
Can you list all my business locations?

Show me recent reviews for my coffee shop

Generate a reply to this review: "Great coffee but slow service"

What's the sentiment of this review: "Amazing experience, will definitely return!"
```

### **Advanced Commands**
```
Help me respond to negative reviews professionally

Show me my business profile information

Generate response templates for different review types

Analyze the sentiment of recent reviews and suggest response strategies
```

## Troubleshooting

### **Common Issues**

1. **Server Not Found**:
   - Check the file path in your configuration
   - Ensure `npm run build` completed successfully
   - Verify Node.js is in your PATH

2. **Environment Variables**:
   - Make sure `ENABLE_MOCK_MODE=true` is set
   - Check that `.env` file exists with mock configuration

3. **VS Code Not Recognizing Server**:
   - Restart VS Code after configuration changes
   - Check VS Code developer console for errors (`Help > Toggle Developer Tools`)

4. **MCP Server Crashes**:
   - Test with `npm run start:mock` first
   - Check logs for any errors
   - Ensure all dependencies are installed

### **Debug Mode**
To see detailed logs, modify your configuration:

```json
{
  "github.copilot.chat.mcp.servers": {
    "google-business-reviews": {
      "command": "node",
      "args": ["./build/index.js"],
      "cwd": "C:\\Users\\david\\source\\review-mcp",
      "env": {
        "NODE_ENV": "development",
        "ENABLE_MOCK_MODE": "true",
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

### **Verify Installation**
Run this to test everything works:

```bash
cd C:\Users\david\source\review-mcp
npm run quick-test
```

You should see all tests pass with mock data.

## Expected Behavior

Once configured correctly, you'll be able to:

✅ **Ask Copilot about your business locations** (shows 2 mock locations)
✅ **Request recent reviews** (returns 5 mock reviews with different ratings)
✅ **Generate AI replies** to customer reviews with appropriate tone
✅ **Get business profile information** with response guidelines
✅ **Access review templates** for different scenarios
✅ **Perform sentiment analysis** on reviews

The server runs completely with mock data, so no Google Business Profile access is needed for testing!

## Next Steps

1. **Configure VS Code** with one of the methods above
2. **Restart VS Code** 
3. **Test with Copilot Chat**
4. **Try the sample commands** to see your MCP server in action

Your Google Business Profile Review MCP Server will now be available directly in GitHub Copilot! 🎉