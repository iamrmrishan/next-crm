#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Setting up Vercel integration...\n');

try {
  // Check if Vercel CLI is installed
  try {
    execSync('vercel --version', { stdio: 'ignore' });
    console.log('✅ Vercel CLI is installed');
  } catch (error) {
    console.log('❌ Vercel CLI not found. Installing...');
    execSync('npm install -g vercel', { stdio: 'inherit' });
    console.log('✅ Vercel CLI installed');
  }

  // Login to Vercel
  console.log('\n📝 Please login to Vercel...');
  execSync('vercel login', { stdio: 'inherit' });

  // Link project
  console.log('\n🔗 Linking project to Vercel...');
  execSync('vercel link', { stdio: 'inherit' });

  // Get project info
  console.log('\n📋 Getting project information...');
  const projectInfo = execSync('vercel project ls', { encoding: 'utf8' });
  
  console.log('\n✅ Setup complete!');
  console.log('\n📝 Next steps:');
  console.log('1. Go to your GitHub repository settings');
  console.log('2. Navigate to Secrets and variables > Actions');
  console.log('3. Add the following secrets:');
  console.log('   - VERCEL_TOKEN (get from https://vercel.com/account/tokens)');
  console.log('   - VERCEL_ORG_ID (found in .vercel/project.json)');
  console.log('   - VERCEL_PROJECT_ID (found in .vercel/project.json)');
  
  if (fs.existsSync('.vercel/project.json')) {
    const project = JSON.parse(fs.readFileSync('.vercel/project.json', 'utf8'));
    console.log('\n🔍 Your project details:');
    console.log(`   - Project ID: ${project.projectId}`);
    console.log(`   - Org ID: ${project.orgId}`);
  }

} catch (error) {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
}