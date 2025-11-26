#!/usr/bin/env node
/**
 * OAuth Authentication Helper
 * Run this script to authenticate with Google and save tokens for the MCP server
 */

import { config } from 'dotenv';
import { google } from 'googleapis';
import express from 'express';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import open from 'open';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config();

const PORT = 3000;
const TOKENS_FILE = join(__dirname, '.tokens.json');

// Create OAuth2 client
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `http://localhost:${PORT}/auth/callback`
);

// Scopes needed for Google My Business
const scopes = [
    'https://www.googleapis.com/auth/business.manage',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
];

// Create express app for OAuth callback
const app = express();

app.get('/auth/callback', async (req, res) => {
    const { code } = req.query;
    
    if (!code) {
        res.status(400).send('No authorization code received');
        return;
    }
    
    try {
        // Exchange code for tokens
        const { tokens } = await oauth2Client.getToken(code);
        
        // Save tokens to file
        const tokenData = {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            scope: tokens.scope,
            token_type: tokens.token_type || 'Bearer',
            expires_at: tokens.expiry_date || (Date.now() + 3600000)
        };
        
        writeFileSync(TOKENS_FILE, JSON.stringify(tokenData, null, 2));
        
        console.log('\n✅ Authentication successful!');
        console.log(`📁 Tokens saved to: ${TOKENS_FILE}`);
        
        res.send(`
            <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; text-align: center; }
                        h1 { color: #4CAF50; }
                        p { color: #666; font-size: 16px; }
                        code { background: #f5f5f5; padding: 5px 10px; border-radius: 4px; }
                    </style>
                </head>
                <body>
                    <h1>✅ Authentication Successful!</h1>
                    <p>Your Google Business Profile credentials have been saved.</p>
                    <p>Tokens saved to: <code>.tokens.json</code></p>
                    <p><strong>You can now close this window and use the MCP server.</strong></p>
                </body>
            </html>
        `);
        
        // Close server after 2 seconds
        setTimeout(() => {
            console.log('\n🚀 Ready to use! Run: npm start');
            process.exit(0);
        }, 2000);
        
    } catch (error) {
        console.error('❌ Error getting tokens:', error.message);
        res.status(500).send(`Authentication failed: ${error.message}`);
        process.exit(1);
    }
});

// Start server and open browser
const server = app.listen(PORT, () => {
    console.log('\n🔐 Google Business Profile Authentication');
    console.log('==========================================\n');
    console.log(`✓ OAuth server started on http://localhost:${PORT}`);
    console.log('✓ Opening browser for authentication...\n');
    
    // Generate auth URL
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent'
    });
    
    console.log('If the browser doesn\'t open automatically, visit:');
    console.log(`\n${authUrl}\n`);
    
    // Open browser
    open(authUrl).catch(err => {
        console.log('⚠️  Could not open browser automatically. Please open the URL above manually.');
    });
});

// Handle errors
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Please close other applications using this port.`);
    } else {
        console.error('❌ Server error:', error.message);
    }
    process.exit(1);
});
