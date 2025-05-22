# Rylie AI API Integration Guide for PureCars

## Overview

This document outlines the API integration between PureCars and Rylie AI. The Rylie system provides conversational AI capabilities for automotive dealerships, with the ability to handle customer inquiries, provide vehicle information, and intelligently hand over leads to human representatives when appropriate.

## Authentication

All API requests require authentication using an API key. PureCars will be provided with a primary API key that must be included in all requests.

### API Key Header

```
X-API-Key: your_api_key_here
```

### Dealer Identification

Each request must include a dealer ID to properly route conversations and access the correct dealership configuration. The dealer ID is a unique identifier assigned to each dealership in the PureCars system.

## Endpoints

### 1. Inbound Message

**Endpoint:** `POST /api/inbound`

This endpoint receives incoming customer messages from PureCars and generates AI responses.

**Request Format:**

```json
{
  "dealerId": "string",           // Required: Unique identifier for the dealership
  "customerName": "string",       // Required: Customer's name
  "customerPhone": "string",      // Required: Customer's phone number in E.164 format
  "customerEmail": "string",      // Optional: Customer's email address
  "customerId": "string",         // Optional: Unique identifier for the customer in PureCars system
  "message": "string",            // Required: The customer's message content
  "conversationId": "string",     // Optional: ID of an existing conversation (omit for new conversations)
  "campaignContext": "string",    // Optional: Additional context about the marketing campaign
  "inventoryContext": "string",   // Optional: Specific inventory context for this conversation
  "channel": "string"             // Optional: Communication channel (default: "sms")
}
```

**Response Format:**

```json
{
  "conversationId": "number",     // Unique identifier for this conversation
  "message": {
    "id": "number",               // Message ID
    "content": "string",          // AI response content
    "timestamp": "string"         // ISO timestamp of the response
  },
  "status": "string",             // Status of the conversation (active, escalated, closed)
  "escalationReason": "string",   // Only present if status is "escalated"
  "variantId": "number"           // ID of the prompt variant used (for A/B testing tracking)
}
```

### 2. Reply to Conversation

**Endpoint:** `POST /api/reply`

This endpoint handles follow-up messages in an existing conversation.

**Request Format:**

```json
{
  "dealerId": "string",           // Required: Unique identifier for the dealership
  "conversationId": "number",     // Required: ID of the existing conversation
  "message": "string",            // Required: Customer's reply message
  "channel": "string"             // Optional: Communication channel (default: "sms")
}
```

**Response Format:**

```json
{
  "conversationId": "number",     // Conversation ID
  "message": {
    "id": "number",               // Message ID
    "content": "string",          // AI response content
    "timestamp": "string"         // ISO timestamp of the response
  },
  "status": "string",             // Status of the conversation (active, escalated, closed)
  "escalationReason": "string",   // Only present if status is "escalated"
  "variantId": "number"           // ID of the prompt variant used (for A/B testing tracking)
}
```

### 3. Manual Handover

**Endpoint:** `POST /api/handover`

Manually trigger a conversation handover to a human representative.

**Request Format:**

```json
{
  "dealerId": "string",           // Required: Unique identifier for the dealership
  "conversationId": "number",     // Required: ID of the conversation to escalate
  "reason": "string"              // Optional: Reason for the manual handover
}
```

**Response Format:**

```json
{
  "conversationId": "number",     // Conversation ID
  "status": "string",             // Will be "escalated"
  "handoverDossier": {            // Customer information dossier for the sales rep
    "customerName": "string",
    "contactDetails": {
      "email": "string",
      "phone": "string"
    },
    "productsInterested": ["string"],
    "purchaseTimeline": "string",
    "dealershipName": "string",
    "keyPoints": ["string"],
    "leadIntent": "string",
    "personalInsights": "string",
    "communicationStyle": "string",
    "engagementTips": ["string"],
    "closingStrategies": ["string"],
    "conversationHistory": [
      {
        "role": "string",
        "content": "string",
        "timestamp": "string"
      }
    ]
  }
}
```

### 4. Get Conversation History

**Endpoint:** `GET /api/conversations/:conversationId`

Retrieve the full history of a conversation.

**Request Parameters:**

- `conversationId`: ID of the conversation to retrieve
- `dealerId`: Dealer ID (as a query parameter)

**Response Format:**

```json
{
  "conversation": {
    "id": "number",
    "dealerId": "string",
    "customerName": "string",
    "customerPhone": "string",
    "customerEmail": "string",
    "status": "string",
    "createdAt": "string",
    "updatedAt": "string",
    "campaignContext": "string",
    "inventoryContext": "string"
  },
  "messages": [
    {
      "id": "number",
      "conversationId": "number",
      "content": "string",
      "isFromCustomer": "boolean",
      "timestamp": "string",
      "channel": "string"
    }
  ]
}
```

### 5. Get Dealer Configuration

**Endpoint:** `GET /api/dealers/:dealerId/config`

Retrieve the current configuration for a dealership.

**Response Format:**

```json
{
  "dealership": {
    "id": "string",
    "name": "string",
    "address": "string",
    "phone": "string",
    "email": "string",
    "website": "string",
    "domain": "string"
  },
  "persona": {
    "id": "number",
    "name": "string",
    "description": "string",
    "isDefault": "boolean",
    "arguments": {
      "tone": "string",
      "priorityFeatures": ["string"],
      "tradeInUrl": "string",
      "financingUrl": "string",
      "handoverEmail": "string"
    }
  }
}
```

## Handover Dossier Format

When a conversation is escalated to a human representative, Rylie generates a comprehensive handover dossier. This dossier contains key information about the customer, their interests, and conversation context to help the sales representative effectively engage with the lead.

The handover dossier is structured as follows:

```json
{
  "customerName": "string",       // Customer's full name
  "contactDetails": {
    "email": "string",            // Customer's email if available
    "phone": "string"             // Customer's phone number
  },
  "productsInterested": ["string"], // List of vehicles or products customer expressed interest in
  "purchaseTimeline": "string",   // Customer's stated or inferred purchase timeline
  "dealershipName": "string",     // Name of the dealership
  "keyPoints": ["string"],        // Key points from the conversation
  "leadIntent": "string",         // Assessment of the customer's buying intent
  "personalInsights": "string",   // Insights about the customer's personality
  "communicationStyle": "string", // Customer's communication style preferences
  "engagementTips": ["string"],   // Tips for engaging with this specific customer
  "closingStrategies": ["string"], // Suggested closing strategies
  "conversationHistory": [        // Complete conversation history
    {
      "role": "string",           // "customer" or "assistant"
      "content": "string",        // Message content
      "timestamp": "string"       // ISO timestamp
    }
  ]
}
```

## Email Delivery

Rylie can deliver handover dossiers and conversation summaries via email. This feature can be configured per dealership through the dealer configuration.

### Email Format

The handover email includes:

1. A summary of the customer inquiry
2. Key details about the customer's interests
3. The complete handover dossier
4. Relevant vehicle information if applicable
5. A link to the full conversation history

## Inventory Integration

Rylie requires access to dealership inventory to provide accurate information to customers. Inventory data should be provided through the Inventory API.

### Inventory Update

**Endpoint:** `POST /api/dealers/:dealerId/inventory`

**Request Format:**

```json
{
  "vehicles": [
    {
      "vin": "string",            // Vehicle VIN number
      "make": "string",           // Vehicle make
      "model": "string",          // Vehicle model
      "year": "number",           // Vehicle year
      "trim": "string",           // Vehicle trim level
      "exteriorColor": "string",  // Exterior color
      "interiorColor": "string",  // Interior color
      "price": "number",          // MSRP or listing price
      "mileage": "number",        // Vehicle mileage
      "condition": "string",      // New, Used, CPO
      "bodyStyle": "string",      // Body style (e.g., SUV, Sedan)
      "fuelType": "string",       // Fuel type
      "transmission": "string",   // Transmission type
      "engineSize": "string",     // Engine size/description
      "drivetrain": "string",     // Drivetrain (e.g., AWD, FWD)
      "features": ["string"],     // Array of vehicle features
      "description": "string",    // Full vehicle description
      "imageUrls": ["string"],    // Array of image URLs
      "detailUrl": "string"       // URL to vehicle detail page
    }
  ]
}
```

## Error Handling

### Error Response Format

All errors follow this format:

```json
{
  "message": "string",            // Human-readable error message
  "code": "string",               // Error code
  "details": {}                   // Additional error details if available
}
```

### Common Error Codes

- `unauthorized`: Invalid or missing API key
- `dealer_not_found`: Specified dealer ID not found
- `conversation_not_found`: Conversation ID not found
- `validation_error`: Request validation failed
- `server_error`: Internal server error

## Rate Limiting

API requests are subject to rate limiting to ensure system stability:

- 100 requests per minute per dealer ID
- 1000 requests per hour per dealer ID

Rate limit headers are included in all responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1605133560
```

## Testing and Sandbox Environment

A sandbox environment is available for testing integration:

- Sandbox base URL: `https://sandbox.rylie-ai.com/api`
- Production base URL: `https://api.rylie-ai.com/api`

Test API keys will be provided separately for the sandbox environment.

## Support and Contact

For integration support or questions, please contact:

- Technical Support: `support@rylie-ai.com`
- API Status Page: `https://status.rylie-ai.com`

## Change Log

- 2023-05-22: Initial API documentation release
- 2023-05-22: Added dealer ID requirements