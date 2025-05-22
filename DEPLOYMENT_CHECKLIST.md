# Deployment Checklist for Rylie AI

## Environment Configuration
- [x] Basic environment variables defined in .env
- [ ] Replace placeholder API keys with real values:
  - [ ] `OPENAI_API_KEY` - Required for AI conversation capabilities
  - [ ] `SENDGRID_API_KEY` - Required for email notifications

## Database Setup
- [ ] Complete database setup:
  - [ ] Run `npx tsx scripts/setup-database.ts` to create required tables
  - [ ] Run `npx tsx scripts/setup-auth-database.ts` to ensure auth tables exist
  - [ ] Database security settings verification
  - [ ] Create necessary database indexes for performance

## Security Configuration
- [ ] Set proper CORS settings in production
- [ ] Implement rate limiting for API endpoints
- [ ] Review API input validation
- [ ] Use strong SESSION_SECRET in production
- [ ] Ensure secure API key handling

## Data Preparation
- [ ] Run `npx tsx scripts/test-setup.ts` to seed test data
- [ ] Configure sample admin accounts
- [ ] Add test dealerships and vehicles

## Application Configuration
- [ ] Set proper NODE_ENV for production ("production")
- [ ] Configure proper logging levels for production
- [ ] Ensure proper error handling for production

## Deployment Settings
- [ ] Set deployment build command to `npm run build`
- [ ] Set deployment run command to `npm run start`
- [ ] Configure appropriate scaling for expected load

## Post-Deployment Verification
- [ ] Verify database connections and table structures
- [ ] Test all API endpoints
- [ ] Review security configurations
- [ ] Monitor performance metrics
- [ ] Test email sending functionality
- [ ] Verify OpenAI integration