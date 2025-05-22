# Integration Guides for Rylie AI

This document provides detailed configuration guides for integrating Rylie AI with various external systems and services.

## Table of Contents
1. [SendGrid Integration](#sendgrid-integration)
2. [OpenAI Configuration](#openai-configuration)
3. [Twilio SMS Integration](#twilio-sms-integration)
4. [CRM Integration](#crm-integration)
5. [Dealership Management System (DMS) Integration](#dealership-management-system-integration)
6. [Inventory Feed Configuration](#inventory-feed-configuration)
7. [Website Chat Widget](#website-chat-widget)
8. [Analytics Platform Integration](#analytics-platform-integration)

## SendGrid Integration

Rylie AI uses SendGrid for all email communications, including handover dossiers, reports, and notifications.

### Prerequisites
- A SendGrid account with API access
- Sender verification completed
- API key with appropriate permissions

### Configuration Steps

1. **Get your SendGrid API Key**:
   - Log in to your SendGrid account
   - Navigate to Settings > API Keys
   - Create a new API key with "Mail Send" permissions
   - Copy the generated key

2. **Configure Rylie AI**:
   - In the admin dashboard, go to Settings > Integrations
   - Locate the SendGrid section
   - Enter your API key
   - Click "Test Connection" to verify
   - Save the settings

3. **Configure Sender Identity**:
   - Still in SendGrid settings, go to "From Email"
   - Enter the email address to be used as the sender
   - We recommend using a domain specific to your dealership (e.g., rylie@yourdealership.com)
   - Set a display name (e.g., "Rylie AI Assistant")

4. **Email Template Configuration**:
   - Go to Settings > Email Templates
   - Upload your dealership logo
   - Customize colors to match your brand
   - Preview and test the templates
   - Publish your changes

### Verification

To verify the SendGrid integration is working correctly:
1. Go to Settings > Integrations > SendGrid
2. Click "Send Test Email"
3. Check the specified inbox for the test email
4. Verify the email formatting and branding

## OpenAI Configuration

Rylie AI relies on OpenAI's GPT-4o model for natural language processing capabilities.

### Prerequisites
- An OpenAI account with API access
- Sufficient usage credits for production use
- API key with appropriate permissions

### Configuration Steps

1. **Get your OpenAI API Key**:
   - Log in to your OpenAI account at https://platform.openai.com
   - Navigate to API Keys in the left sidebar
   - Create a new secret key
   - Copy the generated key

2. **Configure Rylie AI**:
   - In the admin dashboard, go to Settings > Integrations
   - Locate the OpenAI section
   - Enter your API key
   - Select GPT-4o as the default model
   - Configure usage limits (optional)
   - Save the settings

3. **Advanced Configuration**:
   - **Temperature**: Controls randomness (0.0-1.0, recommend 0.7)
   - **Top-p**: Controls diversity (0.0-1.0, recommend 0.95)
   - **Max Tokens**: Maximum response length (recommend 1000)
   - **Frequency Penalty**: Prevents repetition (0.0-2.0, recommend 0.5)
   - **Presence Penalty**: Encourages topic diversity (0.0-2.0, recommend 0.5)

4. **Failover Configuration**:
   - Enable the "Fallback to alternate model" option
   - Select GPT-3.5 Turbo as the fallback model
   - Set retry attempts (recommend 2)
   - Set timeout threshold (recommend 15 seconds)

### Model Usage Monitoring

1. Navigate to Settings > Usage
2. View token usage statistics:
   - Daily/weekly/monthly consumption
   - Per-conversation costs
   - Model distribution
3. Set usage alerts (optional):
   - Daily limit notifications
   - Weekly budget thresholds
   - Rate-limiting triggers

### Cost Management

1. Set a monthly budget cap (optional)
2. Enable intelligent context truncation to reduce token usage
3. Configure caching for common responses
4. Implement automatic model downgrading during peak usage

## Twilio SMS Integration

Connect Rylie AI to Twilio to enable SMS conversations with customers.

### Prerequisites
- A Twilio account with SMS capabilities
- A verified phone number
- Account SID and Auth Token

### Configuration Steps

1. **Get your Twilio Credentials**:
   - Log in to your Twilio account
   - On the dashboard, locate your Account SID and Auth Token
   - Copy both values

2. **Configure Rylie AI**:
   - In the admin dashboard, go to Settings > Integrations
   - Locate the Twilio section
   - Enter your Account SID and Auth Token
   - Enter your Twilio phone number
   - Select your SMS message format
   - Save the settings

3. **Webhook Configuration**:
   - In your Twilio account, go to Phone Numbers > Manage > Active numbers
   - Select your phone number
   - Under "Messaging", set the webhook URL to:
     `https://{your-rylie-domain}/api/webhooks/twilio`
   - Set the HTTP method to POST
   - Save the changes

4. **Test the Integration**:
   - Go to Settings > Integrations > Twilio
   - Click "Send Test Message"
   - Verify the message is received on the test phone
   - Send a reply to test the full round-trip

### SMS Templates

1. Navigate to Settings > SMS Templates
2. Configure the following templates:
   - Welcome message
   - Handover notification
   - Follow-up reminder
   - Out-of-hours response
3. Personalize templates with variables:
   - {{customerName}}
   - {{dealershipName}}
   - {{agentName}}

### SMS Settings

1. Configure SMS behavior:
   - Maximum message length (recommend 160 characters)
   - Split long messages (Yes/No)
   - Include dealership name in every message (Yes/No)
   - Add opt-out instructions (required for compliance)

## CRM Integration

Integrate Rylie AI with your Customer Relationship Management system to synchronize leads and conversation data.

### Supported CRM Systems
- Salesforce
- HubSpot
- DealerSocket
- VinSolutions
- Custom CRM (via API)

### Generic CRM Integration Steps

1. **Prepare your CRM**:
   - Create an API user with appropriate permissions
   - Generate API keys or OAuth credentials
   - Configure webhooks (if applicable)

2. **Configure Rylie AI**:
   - In the admin dashboard, go to Settings > Integrations
   - Locate your CRM section
   - Select your CRM type
   - Enter the required credentials
   - Map Rylie AI fields to CRM fields
   - Set synchronization frequency
   - Save the settings

3. **Field Mapping Configuration**:
   - Map essential fields:
     - Customer name
     - Contact information
     - Lead source
     - Vehicle interest
     - Conversation notes
     - Follow-up tasks

4. **Test the Integration**:
   - Create a test lead in Rylie AI
   - Trigger a sync (manually or wait for automatic sync)
   - Verify the lead appears in your CRM
   - Test bidirectional updates

### Salesforce-Specific Configuration

1. Create a Connected App in Salesforce:
   - Go to Setup > App Manager > New Connected App
   - Enable OAuth settings
   - Set the callback URL to: `https://{your-rylie-domain}/api/crm/salesforce/callback`
   - Select scopes: "Access and manage your data", "Access custom permissions"
   - Save and note the Consumer Key and Secret

2. Configure Rylie AI for Salesforce:
   - Enter the Consumer Key and Secret
   - Click "Authorize" to complete OAuth flow
   - Map standard and custom objects
   - Configure lead assignment rules

### HubSpot-Specific Configuration

1. Create a Private App in HubSpot:
   - Go to Settings > Integrations > Private Apps
   - Create a new Private App
   - Name it "Rylie AI Integration"
   - Select scopes: contacts, deals, engagements, etc.
   - Create and copy the access token

2. Configure Rylie AI for HubSpot:
   - Enter the access token
   - Set the portal ID
   - Map properties to Rylie AI fields
   - Configure deal stages mapping

## Dealership Management System Integration

Connect Rylie AI to your Dealership Management System (DMS) for inventory and customer data synchronization.

### Supported DMS Platforms
- CDK
- Reynolds & Reynolds
- Dealertrack
- Auto/Mate
- Dominion

### Configuration Steps

1. **Get API Access from your DMS Provider**:
   - Contact your DMS provider's support team
   - Request API access credentials
   - Understand rate limits and data access restrictions

2. **Configure Rylie AI**:
   - In the admin dashboard, go to Settings > Integrations
   - Locate your DMS section
   - Select your DMS provider
   - Enter the API credentials
   - Configure sync settings:
     - Inventory sync frequency (recommend daily)
     - Customer data sync (if applicable)
     - Bidirectional updates (Yes/No)
   - Save the settings

3. **Data Mapping**:
   - Map DMS inventory fields to Rylie AI vehicle fields
   - Configure VIN decoding options
   - Set up vehicle status mapping
   - Map custom fields if necessary

4. **Testing and Verification**:
   - Trigger a manual sync
   - Verify sample vehicles are imported correctly
   - Test updates in both directions (if enabled)
   - Check error logs for any issues

### CDK-Specific Configuration

1. Request CDK FLEX API access:
   - Obtain Partner ID and Secret
   - Configure authorized endpoints
   - Set required scopes for inventory data

2. Configure Rylie AI for CDK:
   - Enter Partner ID and Secret
   - Set dealer code
   - Configure data transformation rules for inventory

### Reynolds & Reynolds-Specific Configuration

1. Request Reynolds Certified Interface (RCI) access:
   - Complete the RCI agreement
   - Obtain API credentials
   - Set up authorized IP addresses

2. Configure Rylie AI for Reynolds:
   - Enter the RCI username and password
   - Configure data extraction rules
   - Set up scheduled sync windows

## Inventory Feed Configuration

Configure direct inventory feeds from various providers to keep vehicle data current.

### Supported Feed Providers
- vAuto
- HomeNet
- Dealer.com
- CarGurus
- Custom Feed (FTP/SFTP/HTTP)

### Generic Feed Configuration

1. **Obtain Feed Access**:
   - Contact your inventory provider
   - Request feed credentials
   - Understand the feed format and frequency

2. **Configure Rylie AI**:
   - In the admin dashboard, go to Settings > Inventory
   - Select "Add Feed"
   - Choose your feed provider
   - Enter connection details:
     - URL/FTP address
     - Username/password
     - API key (if applicable)
   - Set import schedule
   - Configure field mapping
   - Save the settings

3. **Feed Options**:
   - **Format**: Choose XML, JSON, or CSV
   - **Update Frequency**: Set how often to check for updates
   - **Overwrite Rules**: Configure which fields can be overwritten
   - **Image Handling**: Set image import preferences
   - **Status Mapping**: Map provider statuses to Rylie AI statuses

4. **Testing and Monitoring**:
   - Run a test import
   - Review the import log
   - Set up alerts for feed failures
   - Configure regular validation reports

### vAuto-Specific Configuration

1. Request vAuto API access:
   - Obtain API key and dealer ID
   - Configure webhook URLs (if applicable)

2. Configure Rylie AI for vAuto:
   - Enter API key and dealer ID
   - Select data fields to import
   - Configure pricing rules (List/asking price mapping)
   - Set up vehicle status mapping

### Custom Feed via SFTP

1. Set up an SFTP server:
   - Generate SSH keys for secure access
   - Configure access restrictions
   - Set up a dedicated directory for inventory files

2. Configure Rylie AI for SFTP:
   - Enter server address and port
   - Upload the private key or enter password
   - Specify the directory path
   - Configure the file pattern (e.g., `inventory_*.csv`)
   - Set import schedule
   - Define the file format and field mapping

## Website Chat Widget

Integrate Rylie AI's chat capabilities directly into your dealership website.

### Prerequisites
- Access to your website's HTML
- HTTPS enabled on your website
- API key with chat permissions

### Configuration Steps

1. **Generate Widget Code**:
   - In the admin dashboard, go to Settings > Website Integration
   - Configure widget appearance:
     - Colors
     - Position
     - Initial greeting
     - Availability hours
   - Click "Generate Code" to get the embed script

2. **Install on Your Website**:
   - Copy the provided JavaScript snippet
   - Add it to your website's HTML just before the closing `</body>` tag
   - Test the widget on your development environment
   - Deploy to production when ready

3. **Advanced Widget Configuration**:
   - **Mobile Responsiveness**: Configure mobile-specific behavior
   - **Chat Triggers**: Set up proactive chat based on user behavior
   - **Pre-chat Form**: Configure information to collect before chat starts
   - **Chat Routing**: Direct chats to specific personas based on page context
   - **After-hours Settings**: Configure automated responses outside business hours

4. **Customize Appearance**:
   - Upload your dealership logo
   - Set brand colors
   - Customize chat bubble design
   - Configure chat window size and position
   - Add custom CSS (optional)

### JavaScript API

For advanced website integration, use the JavaScript API:

```javascript
// Initialize with configuration
RylieAI.init({
  apiKey: 'your-public-api-key',
  dealershipId: 123,
  persona: 'sales',
  debug: false
});

// Open the chat programmatically
document.querySelector('#contact-button').addEventListener('click', () => {
  RylieAI.openChat({
    context: {
      currentVehicle: 'Toyota RAV4 Hybrid',
      pageUrl: window.location.href
    }
  });
});

// Listen for events
RylieAI.on('chatStarted', (data) => {
  console.log('Chat started:', data.conversationId);
});

RylieAI.on('messageSent', (data) => {
  console.log('Message sent:', data.message);
});

RylieAI.on('handover', (data) => {
  console.log('Conversation escalated:', data.reason);
});
```

## Analytics Platform Integration

Connect Rylie AI to analytics platforms for tracking conversation metrics and performance.

### Supported Analytics Platforms
- Google Analytics
- Mixpanel
- Segment
- Custom Analytics (via API)

### Google Analytics Configuration

1. **Prerequisites**:
   - Google Analytics 4 property
   - Measurement ID
   - Optional: Enhanced measurement enabled

2. **Configuration Steps**:
   - In the admin dashboard, go to Settings > Integrations
   - Locate the Google Analytics section
   - Enter your Measurement ID
   - Configure event tracking:
     - Conversation starts
     - Messages sent/received
     - Handovers
     - Conversions
   - Save the settings

3. **Event Mapping**:
   - Map Rylie AI events to GA4 events
   - Configure parameters for each event
   - Set up custom dimensions for advanced reporting
   - Configure conversion tracking

### Mixpanel Configuration

1. **Prerequisites**:
   - Mixpanel project
   - Project token
   - Server-side API secret

2. **Configuration Steps**:
   - In the admin dashboard, go to Settings > Integrations
   - Locate the Mixpanel section
   - Enter your Project Token and API Secret
   - Configure event tracking settings
   - Set up user identification
   - Save the settings

3. **Advanced Mixpanel Settings**:
   - Configure user profile properties
   - Set up funnel tracking
   - Create custom event properties
   - Configure retention analysis

### Custom Analytics via Webhook

1. **Set Up Your Endpoint**:
   - Create an endpoint to receive webhook events
   - Ensure it can handle POST requests with JSON payloads
   - Implement proper authentication

2. **Configure Rylie AI**:
   - In the admin dashboard, go to Settings > Integrations
   - Go to "Custom Analytics"
   - Enter your webhook URL
   - Configure authentication (API key or JWT)
   - Select events to send
   - Map event data to your expected format
   - Save the settings

3. **Testing Webhook Integration**:
   - Click "Send Test Event"
   - Verify the event is received by your endpoint
   - Check payload format and data integrity
   - Monitor webhook reliability

---

For assistance with integrations, contact the Rylie AI support team at integration-support@rylie-ai.com