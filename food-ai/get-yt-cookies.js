#!/usr/bin/env node

// YouTube Cookie Helper
// Chrome encrypts cookie values on macOS, so we'll provide manual instructions

import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env.local');

function showInstructions() {
  console.log('🍪 YouTube Cookie Setup\n');
  
  console.log('Chrome encrypts cookies on macOS, so here\'s the manual method:\n');
  
  console.log('📋 Steps:');
  console.log('1. Open YouTube.com in Chrome (make sure you\'re logged in)');
  console.log('2. Open DevTools (Cmd+Option+I)');
  console.log('3. Go to Network tab');
  console.log('4. Refresh the page (Cmd+R)');
  console.log('5. Click any request to youtube.com');
  console.log('6. Find "Request Headers" → "cookie:" line');
  console.log('7. Right-click the cookie value → Copy');
  console.log('8. Paste it below when prompted\n');
  
  // Simple interactive prompt
  process.stdout.write('Paste your YouTube cookie header here (or press Enter to skip): ');
  
  process.stdin.once('data', (data) => {
    const cookieValue = data.toString().trim();
    
    if (cookieValue && cookieValue.length > 10) {
      updateEnvFile(cookieValue);
      console.log('\n✅ Cookie added to .env.local!');
      console.log('Cookie preview:', cookieValue.substring(0, 60) + '...');
      console.log('\n🚀 Now restart your dev server: npm run dev');
    } else {
      console.log('\n⏩ Skipped cookie setup. The app will work but may hit rate limits.');
      console.log('You can add YT_COOKIE="..." to .env.local anytime.');
    }
    
    process.exit(0);
  });
}

function updateEnvFile(cookieString) {
  let envContent = '';
  
  // Read existing .env.local if it exists
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8');
  }

  // Remove existing YT_COOKIE line if present
  const lines = envContent.split('\n').filter(line => !line.startsWith('YT_COOKIE='));
  
  // Add new cookie line
  lines.push(`YT_COOKIE="${cookieString}"`);
  
  // Write back to file
  fs.writeFileSync(envPath, lines.filter(line => line.trim()).join('\n') + '\n');
}

showInstructions();
