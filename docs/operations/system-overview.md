# Rylie AI System Overview

This document provides a high-level overview of the Rylie AI system architecture, components, and operational considerations.

## System Architecture

Rylie AI is built as a modern web application with the following major components:

### Frontend
- **Framework**: React with TypeScript
- **State Management**: React hooks and TanStack Query
- **Routing**: Wouter for client-side routing
- **UI Components**: Shadcn UI library with TailwindCSS
- **Data Visualization**: Recharts for analytics dashboards

### Backend
- **Framework**: Express.js with TypeScript
- **API Layer**: RESTful endpoints with Zod validation
- **Authentication**: Session-based auth for UI, API key auth for integrations
- **Database Access**: Drizzle ORM for type-safe database operations
- **AI Services**: OpenAI integration for conversations and analysis
- **Email Services**: SendGrid for notifications and reports

### Database
- **Engine**: PostgreSQL (via Neon serverless)
- **Schema**: See the [Database Schema](#database-schema) section below

### External Integrations
- **OpenAI API**: Used for conversation intelligence
- **SendGrid API**: Used for email notifications
- **PureCars API**: For integration with dealership management systems

## Deployment Architecture

The application is deployed on Replit with the following configuration:

- **Development**: Combined frontend and backend development server
- **Production**: Static frontend assets served by Express
- **Database**: External Neon PostgreSQL instance
- **Environment Variables**: See [Environment Configuration](#environment-configuration)

## Database Schema

The primary entities in the system include:

1. **Users**: Dealership staff accounts
   - Relationships: Belongs to a dealership
   - Important fields: id, email, name, role

2. **Dealerships**: Car dealership information
   - Relationships: Has many users, vehicles, personas, API keys
   - Important fields: id, name, location, settings

3. **Vehicles**: Inventory items
   - Relationships: Belongs to a dealership
   - Important fields: id, dealershipId, vin, make, model, year, price

4. **Conversations**: Customer interactions
   - Relationships: Belongs to a dealership, has many messages
   - Important fields: id, dealershipId, customerName, status, startedAt

5. **Messages**: Individual conversation messages
   - Relationships: Belongs to a conversation
   - Important fields: id, conversationId, role, content, timestamp

6. **Personas**: AI personality configurations
   - Relationships: Belongs to a dealership
   - Important fields: id, dealershipId, name, configuration

7. **API Keys**: Authentication tokens
   - Relationships: Belongs to a dealership
   - Important fields: id, dealershipId, name, key, active

## Environment Configuration

The application requires the following environment variables:

| Variable | Description | Required in Development | Required in Production |
|----------|-------------|-------------------------|------------------------|
| DATABASE_URL | PostgreSQL connection string | Yes | Yes |
| OPENAI_API_KEY | OpenAI API key | Yes | Yes |
| SENDGRID_API_KEY | SendGrid API key | No | Yes |
| SESSION_SECRET | Secret for session encryption | Yes | Yes |
| NODE_ENV | Environment (`development` or `production`) | Yes | Yes |

## Runtime Dependencies

Key runtime dependencies include:

- **Node.js**: v18+ required
- **PostgreSQL**: v13+ required
- **Internet Access**: Required for API calls to OpenAI and SendGrid

## Monitoring

The system includes several monitoring endpoints:

- `/api/health`: Overall system health
- `/api/health/cache`: Cache performance metrics
- `/api/health/logs`: Log file management (admin only)

In production, these endpoints should be monitored regularly for performance and availability.

## Backup and Recovery

See the [Backup and Recovery Strategy](./backup-recovery.md) document for detailed information on the backup procedures and recovery options.

## Performance Considerations

- **Cache Strategy**: The application uses multi-level caching:
  - In-memory cache for frequently accessed data
  - Database query result caching
  - Response caching where appropriate

- **Rate Limiting**: API endpoints are rate-limited to prevent abuse

- **Database Performance**: Indexes are created for common query patterns

## Security Measures

- **API Authentication**: API keys with dealership-specific scopes
- **UI Authentication**: Session-based authentication
- **CSRF Protection**: All forms protected against CSRF attacks
- **Security Headers**: Standard security headers on all responses
- **Input Validation**: All inputs validated using Zod schemas
- **Error Handling**: Production-safe error messages

## Troubleshooting

Common issues and their solutions:

1. **Database Connection Issues**
   - Check DATABASE_URL environment variable
   - Verify network connectivity to database server
   - Check for reaching connection limits

2. **OpenAI API Issues**
   - Verify OPENAI_API_KEY is valid
   - Check for rate limiting or quota issues
   - Verify request format matches latest API version

3. **Email Delivery Problems**
   - Confirm SENDGRID_API_KEY is valid
   - Check email templates for formatting issues
   - Verify sender address is verified in SendGrid

## Operational Procedures

For detailed operational procedures, see:

- [Deployment Guide](./deployment.md)
- [Backup and Recovery](./backup-recovery.md)
- [Incident Response](./incident-response.md)
- [Maintenance Procedures](./maintenance.md)