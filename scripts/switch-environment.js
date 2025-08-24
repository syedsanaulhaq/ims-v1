#!/usr/bin/env node

// Environment Switcher Script
// Usage: node scripts/switch-environment.js [production|staging|development]

const { switchEnvironment, ENVIRONMENTS, getConfig } = require('../config/environment');

const args = process.argv.slice(2);
const targetEnv = args[0];

if (!targetEnv) {
  console.log('🎯 Environment Switcher');
  console.log('');
  console.log('Usage: node scripts/switch-environment.js [environment]');
  console.log('');
  console.log('Available environments:');
  Object.values(ENVIRONMENTS).forEach(env => {
    console.log(`  - ${env}`);
  });
  console.log('');
  console.log('Example: node scripts/switch-environment.js staging');
  process.exit(1);
}

try {
  const config = switchEnvironment(targetEnv);
  
  console.log('✅ Environment switched successfully!');
  console.log('');
  console.log('📋 Current Configuration:');
  console.log(`   Environment: ${config.env}`);
  console.log(`   Port: ${config.port}`);
  console.log(`   Database: ${config.database.database}`);
  console.log(`   API URL: ${config.frontend.apiBaseUrl}`);
  console.log('');
  console.log('🚀 Start the server with:');
  console.log(`   npm run start:${targetEnv}`);
  console.log('');
  console.log('🔧 Or start frontend with:');
  console.log(`   npm run dev:${targetEnv}`);
  
} catch (error) {
  console.error('❌ Error switching environment:', error.message);
  process.exit(1);
}
