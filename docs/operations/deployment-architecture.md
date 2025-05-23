# Rylie AI Deployment Architecture

## System Overview

Rylie AI is a conversational platform that enables automotive dealerships to manage customer interactions through AI-powered messaging. This document outlines the core architectural components of the system for deployment to staging and production environments.

## Core Components

### 1. Job Queue System

The application uses a robust job queue system with the following characteristics:

- **Primary Queue**: Redis-based queue system using the Bull library 
- **Fallback Mechanism**: Automatic in-memory queue when Redis is unavailable
- **Retry Logic**: Built-in retry mechanism with exponential backoff
- **Job Types**:
  - Email delivery jobs
  - Report generation jobs
  - Inventory import jobs
  - Conversation analysis jobs

#### Queue Configuration

```typescript
// Queue configuration with fallback mechanism
const queueOptions = {
  redis: {
    port: REDIS_PORT,
    host: REDIS_HOST,
    password: REDIS_PASSWORD,
    tls: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  },
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
};
```

### 2. Email Integration

The application uses SendGrid for email delivery with a resilient architecture:

- **Queue-Based Processing**: All emails are sent through the job queue to ensure delivery
- **Retry Mechanism**: Failed emails are automatically retried according to queue configuration
- **Fallback Templates**: System includes fallback templates if custom templates are unavailable
- **Types of Emails**:
  - Conversation summaries
  - Lead handover dossiers
  - Scheduled reports
  - System alerts

### 3. Database Schema Extensions

The database schema includes several optimizations:

- **Dealership Active Status**: Added `active` boolean field to dealerships table for activation control
- **Performance Indexes**: Strategic indexes on high-volume tables for query optimization
- **Session Management**: Dedicated sessions table for authentication and state management

### 4. Monitoring & Logging

The application includes comprehensive monitoring and logging:

- **Structured Logging**: JSON-formatted logs with context for better searchability
- **Log Rotation**: Automatic rotation of log files based on size and date
- **Error Tracking**: Separate error log streams for critical issues
- **API Metrics**: Request/response metrics for performance analysis
- **Health Checks**: Dedicated health check endpoints for monitoring systems

### 5. Security Features

The application includes several security enhancements:

- **CSRF Protection**: Cross-Site Request Forgery protection for all state-changing operations
- **Rate Limiting**: Tiered rate limiting based on client dealership size
- **Input Validation**: Comprehensive Zod-based validation for all input data
- **Secure Headers**: Security headers configured for production environments
- **API Key Authentication**: Robust API key management for dealership integrations

## Deployment Considerations

### Environment Variables

The following environment variables are required:

```
DATABASE_URL=postgres://username:password@hostname:port/database
OPENAI_API_KEY=your-openai-api-key
SENDGRID_API_KEY=your-sendgrid-api-key
REDIS_HOST=your-redis-host
REDIS_PORT=your-redis-port
REDIS_PASSWORD=your-redis-password
NODE_ENV=production
SESSION_SECRET=your-secure-session-secret
```

### Deployment Process

1. Run database migrations: `npm run db:push`
2. Build the application: `npm run build`
3. Start the application: `npm run start`

### Scaling Considerations

- The application uses connection pooling for database connections, with configurable pool size
- The queue system can be scaled horizontally with multiple workers
- Session storage is database-backed for multi-instance deployment

## Fallback Behaviors

The system is designed to gracefully handle service outages:

- **Redis Unavailable**: Falls back to in-memory queue (suitable for development/testing only)
- **SendGrid Unavailable**: Logs errors and retries according to queue configuration
- **OpenAI Unavailable**: Returns appropriate error responses with retry suggestions

## Database Operations

Regular database maintenance should include:

- Periodic reindexing of high-volume tables
- Monitoring of session table size and cleanup of expired sessions
- Regular backups for disaster recovery