# How to View MCP Server stderr Logs

## Method 1: Direct Terminal View
Run the server directly to see logs in real-time:

```powershell
# Set environment variables
$env:NODE_ENV="development"
$env:ENABLE_MOCK_MODE="true" 
$env:LOG_LEVEL="debug"          # Use "debug", "info", "warn", or "error"
$env:TRANSPORT_MODE="http"      # Use "http" to see startup logs, "stdio" for production

# Run server - logs will appear on stderr (visible in terminal)
node build/index.js
```

## Method 2: Redirect stderr to a File
Capture all stderr logs to a file for later analysis:

```powershell
# Redirect stderr to a log file
node build/index.js 2> server-logs.txt

# Or redirect both stdout and stderr to the same file
node build/index.js > all-output.txt 2>&1

# View the logs
Get-Content server-logs.txt -Wait  # Follow log file in real-time
```

## Method 3: Use PowerShell's Tee-Object to See AND Save Logs
See logs in terminal AND save to file:

```powershell
# Show logs in terminal and save to file
node build/index.js 2>&1 | Tee-Object -FilePath "server-logs.txt"
```

## Method 4: VS Code Integration Logs
When running with VS Code GitHub Copilot, logs are captured by VS Code:

1. **Open VS Code Developer Tools**:
   - Press `Ctrl+Shift+P`
   - Type "Developer: Toggle Developer Tools"
   - Look in the Console tab for MCP server logs

2. **Check VS Code Output Panel**:
   - Press `Ctrl+Shift+U` to open Output panel
   - Select "GitHub Copilot Chat" from the dropdown
   - Look for MCP server error messages

## Method 5: Structured Log Viewing with jq
For better formatted JSON log viewing:

```powershell
# Install jq first: winget install jqlang.jq
# Then pipe logs to jq for pretty formatting
node build/index.js 2>&1 | jq -R 'fromjson? // .'
```

## Method 6: Real-time Log Monitoring Script
Create a monitoring script:

```powershell
# monitor-logs.ps1
$env:NODE_ENV="development"
$env:ENABLE_MOCK_MODE="true"
$env:LOG_LEVEL="info"
$env:TRANSPORT_MODE="http"

Write-Host "🔍 Starting MCP Server with log monitoring..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow

node build/index.js 2>&1 | ForEach-Object {
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] $_" -ForegroundColor Cyan
}
```

## Current Log Levels

- **debug**: All messages (most verbose)
- **info**: Informational messages and above  
- **warn**: Warning messages and above
- **error**: Error messages only (least verbose)

## Example Log Output

When running with `LOG_LEVEL="debug"`, you'll see:
```json
{"timestamp":"2025-10-19T12:45:40.130Z","level":"debug","message":"This is a DEBUG message"}
{"timestamp":"2025-10-19T12:45:40.131Z","level":"info","message":"🧪 Starting in MOCK MODE"}
{"timestamp":"2025-10-19T12:45:40.131Z","level":"warn","message":"Configuration warning"}
{"timestamp":"2025-10-19T12:45:40.131Z","level":"error","message":"Error details"}
```

## Recommended Setup for Development

```powershell
# Create a development logging script
$env:NODE_ENV="development"
$env:ENABLE_MOCK_MODE="true"
$env:LOG_LEVEL="info"           # Good balance of info without spam
$env:TRANSPORT_MODE="stdio"     # For VS Code integration

# Run with log file backup
node build/index.js 2> logs/mcp-server.log &
```

This way you can monitor the server in VS Code while having logs saved for troubleshooting.