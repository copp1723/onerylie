# Rylie AI API Integration Guide for PureCars

## Overview

This document outlines the API integration between PureCars and Rylie AI. The system provides conversational AI capabilities for automotive dealerships, handling customer inquiries and intelligent lead handover.

## Authentication

All API requests require authentication using an API key provided by Rylie AI.

### API Key Header
```
X-API-Key: your_api_key_here
```

### Dealer Identification
Each request must include a dealer ID for proper conversation routing and dealership configuration access.

## Endpoints

### 1. Inbound Message
**Endpoint:** `POST /api/inbound`

Receives incoming customer messages and generates AI responses.

**Request Format:**
```json
{
  "dealerId": "string",           // Required: Unique identifier for the dealership
  "customerName": "string",       // Required: Customer's name
  "customerPhone": "string",      // Required: Customer's phone number in E.164 format
  "customerEmail": "string",      // Optional: Customer's email address
  "customerId": "string",         // Optional: Unique identifier for the customer in PureCars system
  "message": "string",            // Required: The customer's message content
  "conversationId": "string",     // Optional: ID of an existing conversation
  "inventoryContext": "string"    // Optional: Specific inventory context
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
  "status": "string",             // Status: active, escalated, closed
  "escalationReason": "string"   // Present if status is "escalated"
}
```

### 2. Reply to Conversation
**Endpoint:** `POST /api/reply`

Handles follow-up messages in existing conversations.

**Request Format:**
```json
{
  "dealerId": "string",           // Required: Dealership identifier
  "conversationId": "number",     // Required: Existing conversation ID 
  "message": "string"             // Required: Customer's reply message
}
```

**Response Format:**
```json
{
  "conversationId": "number",
  "message": {
    "id": "number",
    "content": "string",
    "timestamp": "string"
  },
  "status": "string",
  "escalationReason": "string"    // Present if escalated
}
```

### 3. Manual Handover
**Endpoint:** `POST /api/handover`

Triggers manual conversation handover to a human representative.

**Request Format:**
```json
{
  "dealerId": "string",           // Required: Dealership identifier
  "conversationId": "number",     // Required: Conversation to escalate
  "reason": "string"              // Optional: Handover reason
}
```

**Response Format:**
```json
{
  "conversationId": "number",
  "status": "string",             // Will be "escalated"
  "handoverDossier": {
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

Retrieves full conversation history.

**Query Parameters:**
- `dealerId`: Dealer ID (required)

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
    "inventoryContext": "string"
  },
  "messages": [
    {
      "id": "number",
      "conversationId": "number",
      "content": "string",
      "isFromCustomer": "boolean",
      "timestamp": "string"
    }
  ]
}
```

## Error Handling

All errors follow this format:
```json
{
  "message": "string",            // Human-readable error message
  "code": "string",              // Error code
  "details": {}                  // Additional error details if available
}
```

### Common Error Codes
- `unauthorized`: Invalid/missing API key
- `dealer_not_found`: Invalid dealer ID
- `conversation_not_found`: Invalid conversation ID
- `validation_error`: Invalid request format
- `server_error`: Internal server error

## Rate Limiting
- 100 requests per minute per dealer ID
- 1000 requests per hour per dealer ID

Rate limit headers included in responses:
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