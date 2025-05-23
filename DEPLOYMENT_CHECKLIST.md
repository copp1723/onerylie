# Deployment Checklist for Rylie AI

## Environment Configuration
- [x] Basic environment variables defined in .env
- [x] Replace placeholder API keys with real values:
  - [x] `OPENAI_API_KEY` - Required for AI conversation capabilities
  - [x] `SENDGRID_API_KEY` - Required for email notifications
  - [x] `DATABASE_URL` - Connection string for PostgreSQL database
  - [x] `SESSION_SECRET` - Secure string for session management
  - [x] `REPLIT_DOMAINS` - Domain configuration for authentication

## Database Setup
- [x] Complete database setup:
  - [x] Run `npx tsx scripts/setup-database.ts` to create required tables
  - [x] Run `npx tsx scripts/setup-auth-database.ts` to ensure auth tables exist
  - [x] Database security settings verification
  - [x] Create necessary database indexes for performance
  - [x] Run `npx tsx scripts/apply-indexes.ts` to apply and verify performance optimizations
  - [x] Verify database connection and tables with `npx tsx scripts/check-env.ts`

## Database Performance Optimizations
- [x] Apply strategic performance indexes:
  - [x] Vehicles table: dealership_id, make+model+year, price, is_active
  - [x] Conversations table: dealership_id, status, customer contact, escalation status, timestamps
  - [x] Messages table: conversation_id, channel, sender type, conversation+time
  - [x] API Keys table: key lookup, dealership filtering, active status
  - [x] Personas table: dealership matching, default flag, name search
- [x] Run database performance benchmarks
- [x] Configure appropriate connection pooling

## Security Configuration
- [x] Set proper CORS settings in production
- [x] Implement rate limiting for API endpoints
- [x] Review API input validation
- [x] Use strong SESSION_SECRET in production
- [x] Ensure secure API key handling
- [x] Implement authentication middleware for protected routes

## Data Preparation
- [x] Run `npx tsx scripts/test-setup.ts` to seed test data
- [x] Configure sample admin accounts
- [x] Add test dealerships and vehicles
- [x] Set up sample personas for conversation testing

## Application Configuration
- [x] Set proper NODE_ENV for production ("production")
- [x] Configure proper logging levels for production
- [x] Ensure proper error handling for production
- [x] Implement database performance optimizations
- [x] Configure structured error reporting

## Deployment Settings
- [x] Set deployment build command to `npm run build`
- [x] Set deployment run command to `npm run start`
- [ ] Configure appropriate scaling for expected load
- [ ] Set up health check endpoints

## Post-Deployment Verification
- [x] Verify database connections and table structures
- [ ] Test all API endpoints
- [ ] Review security configurations
- [ ] Monitor performance metrics
- [ ] Test email sending functionality
- [ ] Verify OpenAI integration
- [ ] Test inventory import functionality
- [ ] Verify lead handover and CRM integration

## Monitoring and Maintenance
- [ ] Set up error monitoring and alerts
- [ ] Configure performance monitoring dashboards
- [ ] Document regular maintenance procedures
- [ ] Set up automated backups for database
- [ ] Create runbook for common issues