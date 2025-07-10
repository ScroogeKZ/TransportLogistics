#!/usr/bin/env node

/**
 * Health check script для Yandex Cloud deployment
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

const config = {
  baseUrl: process.env.HEALTH_CHECK_URL || process.env.CONTAINER_URL || 'http://localhost:8080',
  timeout: 15000,
  retries: 3,
  interval: 2000
};

// Endpoints для проверки
const endpoints = [
  { 
    path: '/health', 
    method: 'GET', 
    expectedStatus: 200,
    critical: true,
    description: 'Health endpoint'
  },
  { 
    path: '/api/auth/user', 
    method: 'GET', 
    expectedStatus: 401,
    critical: true,
    description: 'Auth endpoint (should return 401 when unauthorized)'
  },
  { 
    path: '/', 
    method: 'GET', 
    expectedStatus: 200,
    critical: true,
    description: 'Frontend root'
  },
  { 
    path: '/api/dashboard/stats', 
    method: 'GET', 
    expectedStatus: 401,
    critical: false,
    description: 'Dashboard API (should return 401 when unauthorized)'
  }
];

class HealthChecker {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  async makeRequest(endpoint) {
    return new Promise((resolve, reject) => {
      const fullUrl = `${config.baseUrl}${endpoint.path}`;
      const url = new URL(fullUrl);
      const client = url.protocol === 'https:' ? https : http;
      
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: endpoint.method,
        timeout: config.timeout,
        headers: {
          'User-Agent': 'Yandex-Cloud-Health-Check/1.0',
          'Accept': 'application/json'
        }
      };

      const req = client.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
            responseTime: Date.now() - requestStart
          });
        });
      });

      const requestStart = Date.now();
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Request timeout after ${config.timeout}ms`));
      });

      req.end();
    });
  }

  async checkEndpoint(endpoint, retryCount = 0) {
    try {
      console.log(`🔍 Checking ${endpoint.method} ${endpoint.path} (${endpoint.description})`);
      
      const response = await this.makeRequest(endpoint);
      const success = response.statusCode === endpoint.expectedStatus;
      
      if (success) {
        console.log(`✅ ${endpoint.path} - Status: ${response.statusCode} (${response.responseTime}ms)`);
        return { success: true, response, endpoint };
      } else {
        console.log(`❌ ${endpoint.path} - Status: ${response.statusCode}, Expected: ${endpoint.expectedStatus}`);
        if (response.statusCode >= 500) {
          console.log(`   Server error response: ${response.body.substring(0, 200)}`);
        }
        return { success: false, response, endpoint };
      }
    } catch (error) {
      if (retryCount < config.retries) {
        console.log(`⚠️  ${endpoint.path} - Retry ${retryCount + 1}/${config.retries}: ${error.message}`);
        await this.sleep(config.interval * (retryCount + 1));
        return this.checkEndpoint(endpoint, retryCount + 1);
      } else {
        console.log(`❌ ${endpoint.path} - Failed after ${config.retries} retries: ${error.message}`);
        return { success: false, error: error.message, endpoint };
      }
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async runHealthCheck() {
    console.log('🏥 Yandex Cloud Health Check Starting...');
    console.log(`📍 Base URL: ${config.baseUrl}`);
    console.log(`⏱️  Timeout: ${config.timeout}ms`);
    console.log(`🔄 Retries: ${config.retries}`);
    console.log('');

    // Проверяем все endpoints
    for (const endpoint of endpoints) {
      const result = await this.checkEndpoint(endpoint);
      this.results.push(result);
      
      // Небольшая пауза между проверками
      await this.sleep(500);
    }

    return this.generateReport();
  }

  generateReport() {
    const totalTime = Date.now() - this.startTime;
    const successful = this.results.filter(r => r.success).length;
    const total = this.results.length;
    const criticalFailed = this.results.filter(r => !r.success && r.endpoint.critical).length;
    
    console.log('\n📊 Health Check Report');
    console.log('='.repeat(50));
    
    // Детальные результаты
    this.results.forEach(result => {
      const icon = result.success ? '✅' : '❌';
      const critical = result.endpoint.critical ? ' [CRITICAL]' : '';
      const responseTime = result.response?.responseTime ? ` (${result.response.responseTime}ms)` : '';
      
      console.log(`${icon} ${result.endpoint.path}${critical}${responseTime}`);
      
      if (!result.success && result.error) {
        console.log(`    Error: ${result.error}`);
      }
    });
    
    console.log('');
    console.log(`📈 Success Rate: ${successful}/${total} (${Math.round(successful/total*100)}%)`);
    console.log(`⏱️  Total Time: ${totalTime}ms`);
    console.log(`🚨 Critical Failures: ${criticalFailed}`);
    
    // Определяем общий статус
    const overallHealth = criticalFailed === 0 && successful >= total * 0.8;
    
    if (overallHealth) {
      console.log('🎉 Overall Status: HEALTHY');
      return { status: 'healthy', exitCode: 0 };
    } else if (criticalFailed > 0) {
      console.log('💥 Overall Status: CRITICAL');
      return { status: 'critical', exitCode: 2 };
    } else {
      console.log('⚠️  Overall Status: DEGRADED');
      return { status: 'degraded', exitCode: 1 };
    }
  }

  // Дополнительные проверки для Yandex Cloud
  async checkYandexCloudSpecific() {
    console.log('\n🔍 Yandex Cloud Specific Checks');
    console.log('-'.repeat(40));
    
    // Проверка переменных окружения
    const requiredEnvVars = ['DATABASE_URL', 'SESSION_SECRET', 'NODE_ENV'];
    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingEnvVars.length > 0) {
      console.log(`❌ Missing environment variables: ${missingEnvVars.join(', ')}`);
      return false;
    } else {
      console.log('✅ All required environment variables are set');
    }
    
    // Проверка порта
    const port = process.env.PORT || 8080;
    if (config.baseUrl.includes(`:${port}`)) {
      console.log(`✅ Port ${port} is correctly configured`);
    } else {
      console.log(`⚠️  Port mismatch: expected ${port}, found in URL ${config.baseUrl}`);
    }
    
    return true;
  }
}

// Основная функция
async function main() {
  const checker = new HealthChecker();
  
  try {
    // Основная проверка
    const result = await checker.runHealthCheck();
    
    // Дополнительные проверки для Yandex Cloud
    await checker.checkYandexCloudSpecific();
    
    // Выводим рекомендации
    console.log('\n💡 Recommendations:');
    if (result.status === 'critical') {
      console.log('- Check application logs: yc serverless container revision logs --container-name transport-container');
      console.log('- Verify database connectivity');
      console.log('- Check environment variables');
    } else if (result.status === 'degraded') {
      console.log('- Monitor application performance');
      console.log('- Check non-critical service dependencies');
    } else {
      console.log('- Application is running normally');
      console.log('- Continue monitoring');
    }
    
    process.exit(result.exitCode);
    
  } catch (error) {
    console.error('💥 Health check failed:', error);
    process.exit(3);
  }
}

// Запуск проверки
if (require.main === module) {
  main();
}

module.exports = { HealthChecker };