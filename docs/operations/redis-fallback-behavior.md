# Redis Fallback Behavior Guide

## Overview

Rylie AI uses Redis for job queues, caching, and scheduled tasks. This document explains how the system behaves when Redis is unavailable and how to properly configure the production environment.

## Fallback Architecture

The application implements a robust Redis fallback mechanism:

1. **Detection**: The system attempts to connect to Redis on startup and periodically retries if unavailable
2. **Graceful Degradation**: Instead of failing when Redis is unavailable, the system switches to in-memory alternatives
3. **Logging**: All fallback behaviors are clearly logged for debugging
4. **Auto-Recovery**: If Redis becomes available later, the system will automatically reconnect

## Fallback Components

### 1. Queue System

When Redis is unavailable, the system uses an in-memory queue with similar API:

- All job types continue to function (email, reports, etc.)
- Jobs persist only within the current process (not across restarts)
- Retries and scheduling still function but are process-bound

### 2. Scheduler

The report scheduler gracefully degrades:

- In-memory scheduling is used instead of Redis-based distributed scheduling
- Schedule persistence is limited to the current process lifetime
- Scheduled reports will run as normal, but timing may be less precise

## Environment Considerations

### Development Environment

- Redis is not required for development (fallback is sufficient)
- Redis warnings in logs are expected and can be ignored
- Functionality works properly through in-memory fallbacks

### Staging/Production Environment

- Redis is required for proper operation (fallback is emergency-only)
- Redis should be configured with persistence for job durability
- Monitoring should alert on Redis connectivity issues

## Configuration

The Redis connection is configured through environment variables:

```
REDIS_HOST=your-redis-host
REDIS_PORT=your-redis-port
REDIS_PASSWORD=your-redis-password
REDIS_TLS_ENABLED=true/false
```

## Monitoring Redis Health

The application exposes Redis health via the monitoring endpoint:

- `/monitoring/health` returns Redis connection status
- Logs with `[warn]: Redis connection refused` indicate fallback activation
- The metrics endpoint reports fallback usage counters

## Production Recommendations

1. Use a managed Redis service with high availability
2. Configure Redis with appropriate persistence (AOF recommended)
3. Use TLS for Redis connections in production
4. Set up alerting for Redis connectivity issues
5. Review logs periodically for Redis fallback warnings

## Testing Fallback Behavior

To test the fallback behavior:

1. Start the application with invalid Redis credentials
2. Observe logs for fallback activation messages
3. Verify functionality continues to work
4. Restore proper Redis credentials and observe reconnection

## Common Issues

### High Redis Reconnection Attempts

If logs show hundreds of reconnection attempts:

```
[info]: Redis connection retry in 2000ms (attempt 529)
```

This is expected behavior in development environments without Redis. In production:

1. Check Redis service availability
2. Verify network connectivity to Redis
3. Confirm authentication credentials
4. Check Redis instance capacity and limits

### Multiple Redis Warning Messages

The following warning repeated frequently is normal in development:

```
[warn]: Redis connection refused - using in-memory fallback for development
```

In production, this indicates a connectivity issue that should be addressed.