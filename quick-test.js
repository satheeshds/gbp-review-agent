#!/usr/bin/env node
/**
 * Interactive MCP Server Test
 * Quick way to test your MCP server functionality
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';

console.log('🧪 Google Business Profile Review MCP Server - Interactive Test\n');

// Ensure we're in mock mode
const envPath = '.env';
const envContent = `# Test Environment Configuration
NODE_ENV=development
ENABLE_MOCK_MODE=true
LOG_LEVEL=info

# Mock Google OAuth (required for config validation)
GOOGLE_CLIENT_ID=mock_client_id_for_testing
GOOGLE_CLIENT_SECRET=mock_client_secret_for_testing
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback

# Server Configuration
PORT=3000
`;

console.log('📝 Setting up test environment...');
writeFileSync(envPath, envContent);
console.log('✅ Created .env file with mock configuration\n');

// Build the project
console.log('🔨 Building project...');
try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build completed successfully\n');
} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}

// Run comprehensive tests
console.log('🧪 Running comprehensive test suite...');
try {
    execSync('npm run test:dev', { stdio: 'inherit' });
    console.log('\n✅ All tests passed!\n');
} catch (error) {
    console.error('❌ Tests failed:', error.message);
    process.exit(1);
}

console.log('🎉 Your MCP Server is ready for testing!\n');

console.log('📋 Next Steps:');
console.log('==============');
console.log('1. 🖥️  Test with Claude Desktop:');
console.log('   - Add server to Claude Desktop config');
console.log('   - Ask: "Can you list my business locations?"');
console.log('');
console.log('2. 🌐 Test with HTTP client:');
console.log('   npm run start:http');
console.log('   # Then use curl or Postman to test endpoints');
console.log('');
console.log('3. 🔧 Test with MCP Inspector:');
console.log('   npx @modelcontextprotocol/inspector node build/index.js');
console.log('');
console.log('4. 📱 Manual STDIO test:');
console.log('   npm run start:mock');
console.log('   # Server runs in STDIO mode for MCP clients');
console.log('');

console.log('📊 Mock Data Available:');
console.log('======================');
console.log('✅ 2 Business Locations');
console.log('✅ 5 Customer Reviews (1-5 stars)');
console.log('✅ AI Reply Generation');
console.log('✅ Review Sentiment Analysis');
console.log('✅ Business Profile Information');
console.log('✅ Response Templates');
console.log('');

console.log('🔍 Test Commands You Can Try:');
console.log('=============================');
console.log('• "List all my business locations"');
console.log('• "Show me recent reviews for my coffee shop"');
console.log('• "Generate a reply to this review: Great coffee but slow service"');
console.log('• "What\'s the sentiment of this review: Terrible experience, won\'t return"');
console.log('• "Show me my business profile information"');
console.log('');

console.log('🚀 Your Google Business Profile Review MCP Server is ready!');
console.log('   No Google API access required - everything runs with mock data!');