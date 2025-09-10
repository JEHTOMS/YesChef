#!/usr/bin/env node

// Quick deployment verification script
const https = require('https');

console.log('🧪 Testing YesChef deployment...\n');

// Test backend health
const testBackend = () => {
  return new Promise((resolve, reject) => {
    const req = https.get('https://yeschef-production.up.railway.app/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('✅ Backend Health:', result);
          resolve(result);
        } catch (e) {
          console.log('❌ Backend returned non-JSON:', data);
          reject(e);
        }
      });
    });
    
    req.on('error', (e) => {
      console.log('❌ Backend connection error:', e.message);
      reject(e);
    });
    
    req.setTimeout(10000, () => {
      console.log('⏰ Backend request timeout');
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
};

// Test frontend
const testFrontend = () => {
  return new Promise((resolve, reject) => {
    const req = https.get('https://jehtoms.github.io/YesChef/', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (data.includes('YesChef') || data.includes('React')) {
          console.log('✅ Frontend is accessible');
          resolve(true);
        } else {
          console.log('❌ Frontend content unexpected');
          reject(false);
        }
      });
    });
    
    req.on('error', (e) => {
      console.log('❌ Frontend connection error:', e.message);
      reject(e);
    });
    
    req.setTimeout(10000, () => {
      console.log('⏰ Frontend request timeout');
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
};

// Run tests
async function runTests() {
  try {
    await testBackend();
    await testFrontend();
    console.log('\n🎉 Full-stack deployment is working!');
  } catch (error) {
    console.log('\n⚠️ Some issues detected. Check individual test results above.');
  }
}

runTests();
