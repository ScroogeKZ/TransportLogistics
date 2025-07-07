#!/usr/bin/env node

/**
 * Health check script for Google Cloud deployment
 * This script verifies that all components are working correctly
 */

const https = require('https');
const http = require('http');

const config = {
  baseUrl: process.env.APP_URL || 'https://your-app.appspot.com',
  timeout: 10000,
  retries: 3
};

const endpoints = [
  { path: '/api/auth/user', method: 'GET', expectedStatus: 401 }, // Unauthorized is expected
  { path: '/api/transportation-requests', method: 'GET', expectedStatus: 401 },
  { path: '/api/carriers', method: 'GET', expectedStatus: 401 },
  { path: '/api/dashboard/stats', method: 'GET', expectedStatus: 401 },
  { path: '/', method: 'GET', expectedStatus: 200 }, // Frontend should load
];

async function makeRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const url = `${config.baseUrl}${endpoint.path}`;
    const client = url.startsWith('https') ? https : http;
    
    const options = {
      method: endpoint.method,
      timeout: config.timeout,
      headers: {
        'User-Agent': 'Health-Check-Script'
      }
    };

    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function checkEndpoint(endpoint, retryCount = 0) {
  try {
    console.log(`Checking ${endpoint.method} ${endpoint.path}...`);
    const response = await makeRequest(endpoint);
    
    if (response.statusCode === endpoint.expectedStatus) {
      console.log(`✅ ${endpoint.path} - Status: ${response.statusCode} (Expected: ${endpoint.expectedStatus})`);
      return true;
    } else {
      console.log(`❌ ${endpoint.path} - Status: ${response.statusCode} (Expected: ${endpoint.expectedStatus})`);
      return false;
    }
  } catch (error) {
    if (retryCount < config.retries) {
      console.log(`⚠️  ${endpoint.path} - Retry ${retryCount + 1}/${config.retries}: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return checkEndpoint(endpoint, retryCount + 1);
    } else {
      console.log(`❌ ${endpoint.path} - Failed after ${config.retries} retries: ${error.message}`);
      return false;
    }
  }
}

async function runHealthCheck() {
  console.log('🏥 Starting health check...');
  console.log(`Base URL: ${config.baseUrl}`);
  console.log(`Timeout: ${config.timeout}ms`);
  console.log(`Retries: ${config.retries}`);
  console.log('');

  const results = [];
  
  for (const endpoint of endpoints) {
    const result = await checkEndpoint(endpoint);
    results.push({ endpoint: endpoint.path, success: result });
  }

  console.log('\n📊 Health Check Results:');
  console.log('========================');
  
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  
  results.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.endpoint}`);
  });
  
  console.log(`\n📈 Success Rate: ${successful}/${total} (${Math.round(successful/total*100)}%)`);
  
  if (successful === total) {
    console.log('🎉 All health checks passed!');
    process.exit(0);
  } else {
    console.log('⚠️  Some health checks failed. Please investigate.');
    process.exit(1);
  }
}

// Run health check
runHealthCheck().catch(error => {
  console.error('💥 Health check failed:', error);
  process.exit(1);
});