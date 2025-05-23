
import { performance } from 'perf_hooks';
import os from 'os';
import { EventEmitter } from 'events';

interface SystemMetrics {
  cpu: {
    usage: number;
    loadAvg: number[];
    count: number;
  };
  memory: {
    total: number;
    free: number;
    used: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
  };
  process: {
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
  };
  network: {
    requestsPerSecond: number;
    avgResponseTime: number;
    errorRate: number;
  };
  application: {
    activeConnections: number;
    totalRequests: number;
    errors: Record<string, number>;
    endpoints: Record<string, {
      hits: number;
      avgResponseTime: number;
      errors: number;
    }>;
  };
}

class MonitoringService extends EventEmitter {
  private metrics: SystemMetrics;
  private requestCounts: { timestamp: number; count: number }[] = [];
  private historyLength = 3600; // 1 hour of history
  private updateInterval = 1000; // 1 second updates

  constructor() {
    super();
    this.metrics = this.initializeMetrics();
    this.startCollecting();
  }

  private initializeMetrics(): SystemMetrics {
    return {
      cpu: {
        usage: 0,
        loadAvg: os.loadavg(),
        count: os.cpus().length
      },
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        ...process.memoryUsage(),
      },
      process: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
      },
      network: {
        requestsPerSecond: 0,
        avgResponseTime: 0,
        errorRate: 0,
      },
      application: {
        activeConnections: 0,
        totalRequests: 0,
        errors: {},
        endpoints: {},
      }
    };
  }

  private startCollecting() {
    setInterval(() => {
      this.updateMetrics();
      this.emit('metrics', this.metrics);
    }, this.updateInterval);
  }

  private updateMetrics() {
    const currentMetrics = this.initializeMetrics();
    this.calculateRequestRate();
    this.metrics = currentMetrics;
  }

  private calculateRequestRate() {
    const now = Date.now();
    this.requestCounts = this.requestCounts
      .filter(count => now - count.timestamp < 1000)
      .concat([{ timestamp: now, count: 1 }]);
    
    this.metrics.network.requestsPerSecond = this.requestCounts.length;
  }

  trackRequest(path: string, duration: number, statusCode: number) {
    this.metrics.application.totalRequests++;
    
    if (!this.metrics.application.endpoints[path]) {
      this.metrics.application.endpoints[path] = {
        hits: 0,
        avgResponseTime: 0,
        errors: 0,
      };
    }

    const endpoint = this.metrics.application.endpoints[path];
    endpoint.hits++;
    endpoint.avgResponseTime = (endpoint.avgResponseTime * (endpoint.hits - 1) + duration) / endpoint.hits;

    if (statusCode >= 400) {
      endpoint.errors++;
      this.metrics.application.errors[statusCode] = (this.metrics.application.errors[statusCode] || 0) + 1;
    }
  }

  getMetrics(): SystemMetrics {
    return this.metrics;
  }
}

export const monitoring = new MonitoringService();
