# Deployment Guide

This guide outlines the procedures for deploying the Rylie AI platform to production environments.

## Prerequisites

Before deployment, ensure the following prerequisites are met:

- Node.js v18+ installed on the target server
- Access to a PostgreSQL database (v13+)
- Required API keys for external services:
  - OpenAI API key
  - SendGrid API key (for email notifications)
- SSL certificate for secure HTTPS connections
- Domain name configured with DNS records pointing to your server

## Environment Configuration

### Environment Variables

Create a `.env` file in the project root with the following variables:

```
# Database Configuration
DATABASE_URL=postgresql://username:password@hostname:port/database

# API Keys
OPENAI_API_KEY=your-openai-api-key
SENDGRID_API_KEY=your-sendgrid-api-key

# Security Configuration
SESSION_SECRET=your-secure-random-string
NODE_ENV=production

# Optional Configuration
PORT=5000  # Default is 5000
LOG_LEVEL=info  # Options: debug, info, warn, error
DISABLE_CONSOLE_LOGS=false  # Set to true to disable console logs in production
```

## Build Process

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the Application

```bash
npm run build
```

This command will:
- Build the React frontend using Vite
- Bundle the server-side code using esbuild
- Output all files to the `dist/` directory

### 3. Database Setup

```bash
# Apply database schema changes
npm run db:push
```

## Deployment Steps

### Method 1: Manual Deployment

1. **Transfer Files**:
   ```bash
   rsync -avz --exclude 'node_modules' --exclude '.git' ./ user@server:/path/to/app/
   ```

2. **Install Production Dependencies**:
   ```bash
   cd /path/to/app/
   npm install --production
   ```

3. **Set Environment Variables**:
   Ensure all environment variables are properly set.

4. **Start the Application**:
   ```bash
   npm run start
   ```

### Method 2: Replit Deployment

1. **Prepare for Deployment**:
   - Ensure all code is committed
   - Verify environment variables are set in the Replit Secrets tab

2. **Deploy on Replit**:
   - Click the "Deploy" button in the Replit interface
   - Select deployment settings (domain, environment)
   - Confirm deployment

3. **Post-Deployment Verification**:
   - Verify application health at `/api/health`
   - Check logs for any startup errors

### Method 3: Containerized Deployment

1. **Build Docker Image**:
   ```bash
   docker build -t rylie-ai:latest .
   ```

2. **Run Container**:
   ```bash
   docker run -d --name rylie-ai \
     -p 5000:5000 \
     -e DATABASE_URL=postgresql://username:password@hostname:port/database \
     -e OPENAI_API_KEY=your-openai-api-key \
     -e SENDGRID_API_KEY=your-sendgrid-api-key \
     -e SESSION_SECRET=your-secure-random-string \
     -e NODE_ENV=production \
     rylie-ai:latest
   ```

## Post-Deployment Verification

After deployment, perform the following checks:

1. **Health Check**:
   ```bash
   curl https://your-domain.com/api/health
   ```

2. **Database Connection**:
   Verify the application can connect to the database by checking the health endpoint response.

3. **External API Integration**:
   Test OpenAI and SendGrid integration by sending a test message.

4. **Authentication**:
   Verify that the authentication system works correctly.

5. **Frontend Functionality**:
   Go through key user journeys to ensure the application works as expected.

## Rollback Procedure

If issues are encountered after deployment, follow these rollback steps:

### 1. Identify the Issue

Check logs to determine the nature of the problem:
```bash
tail -f /path/to/logs/*.log
```

### 2. Attempt Quick Fixes

For minor issues, attempt a fix without full rollback:
```bash
# Restart the application
pm2 restart rylie-ai
```

### 3. Full Rollback

If a quick fix isn't possible:

```bash
# Stop the current version
pm2 stop rylie-ai

# Switch to the previous version
cd /path/to/previous/version

# Start the previous version
pm2 start npm --name "rylie-ai" -- run start
```

## Multi-Environment Deployment Strategy

### Development Environment

- Purpose: Daily development and testing
- Database: Separate development database
- Deployment: Automatic on commit to development branch
- URL: dev.rylie-ai.example.com

### Staging Environment

- Purpose: Pre-production testing and UAT
- Database: Copy of production schema with anonymized data
- Deployment: Manual or scheduled from main branch
- URL: staging.rylie-ai.example.com

### Production Environment

- Purpose: Live customer-facing system
- Database: Production database with regular backups
- Deployment: Manual from release tags
- URL: rylie-ai.example.com

## Continuous Integration/Deployment

For automated deployments, configure CI/CD workflows:

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  release:
    types: [published]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build application
        run: npm run build
        
      - name: Deploy to production server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /path/to/app
            git pull
            npm ci --production
            npm run db:push
            pm2 restart rylie-ai
```

## Monitoring Setup

After deployment, set up monitoring:

1. **Application Logs**:
   Configure log aggregation to a central system.

2. **Performance Monitoring**:
   Implement APM tools to track application performance.

3. **Error Tracking**:
   Set up error reporting to capture and notify about production errors.

4. **Uptime Monitoring**:
   Configure external monitoring of the `/api/health` endpoint.

## Troubleshooting Common Deployment Issues

| Issue | Possible Cause | Solution |
|-------|---------------|----------|
| Application fails to start | Missing environment variables | Check `.env` file and environment configuration |
| Database connection error | Incorrect DATABASE_URL or network issues | Verify connection string and network access |
| API key errors | Invalid or expired API keys | Update API keys in environment variables |
| Frontend not loading | Static file serving issues | Check build output and server configuration |
| Memory issues | Resource constraints | Check server resources and optimize application |

## Deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] Build completed successfully
- [ ] Application starts without errors
- [ ] Health check returns OK
- [ ] External API integrations working
- [ ] Authentication system functioning
- [ ] Frontend loads correctly
- [ ] Critical user journeys tested
- [ ] Monitoring configured
- [ ] Backup system verified