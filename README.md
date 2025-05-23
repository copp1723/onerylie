# Rylie AI Platform

A specialized conversational AI platform for automotive sales, focusing on intelligent communication and dealer-specific tools.

## Overview

Rylie AI is a comprehensive conversational AI system designed specifically for automotive dealerships. It provides intelligent customer interactions, lead qualification, and seamless handover to human agents when appropriate.

### Key Features

- **Intelligent Conversations**: OpenAI-powered conversational AI that understands customer intent and automotive terminology
- **Lead Qualification**: Automatically identifies high-intent customers and creates detailed handover dossiers
- **Inventory Integration**: Connects to dealership inventory for accurate vehicle information and recommendations
- **Multi-Channel Support**: Handles conversations across web, SMS, and email channels
- **Dealership-Specific Personas**: Customizable AI personalities aligned with your dealership's brand
- **Advanced Analytics**: Comprehensive reporting on conversation performance and sales outcomes

## Documentation

Detailed documentation is available in the `/docs` directory:

- [API Integration Guide](docs/API_INTEGRATION.md) - How to integrate with the Rylie AI API
- [System Architecture](docs/SYSTEM_ARCHITECTURE.md) - Technical architecture and component overview
- [Deployment Checklist](docs/DEPLOYMENT_CHECKLIST.md) - Steps for deploying the platform
- [Integration Guides](docs/INTEGRATION_GUIDES.md) - How to connect with external services

### Operations Documentation

- [Deployment Guide](docs/operations/deployment.md) - Detailed deployment instructions
- [Maintenance Procedures](docs/operations/maintenance.md) - Routine maintenance tasks
- [Backup and Recovery](docs/operations/backup-recovery.md) - Backup procedures and recovery processes
- [Incident Response](docs/operations/incident-response.md) - Procedures for handling service incidents

## Development Setup

1. **Clone the repository**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file with the required variables:
   ```
   DATABASE_URL=postgresql://username:password@hostname:port/database
   OPENAI_API_KEY=your-openai-api-key
   SENDGRID_API_KEY=your-sendgrid-api-key
   SESSION_SECRET=your-secure-random-string
   ```

4. **Set up the database**
   ```bash
   # Push the schema to the database
   npm run db:push
   
   # (Optional) Seed the database with test data
   npx tsx scripts/seed-database.ts
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## API Quick Start

```javascript
// Example: Send a customer message to Rylie AI
const response = await fetch('https://your-deployment.com/api/inbound', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your-api-key'
  },
  body: JSON.stringify({
    customerMessage: "I'm interested in the 2023 Honda Accord on your website",
    customerName: "John Smith",
    channel: "website",
    dealershipId: 1
  })
});

const data = await response.json();
console.log(data.response); // Rylie's response to the customer
```

## License

All rights reserved. This codebase is proprietary and confidential.

Copyright (c) 2025