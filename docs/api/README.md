# Rylie AI API Documentation

This API documentation details the endpoints available in the Rylie AI platform for automotive dealerships. The API enables integration with dealership systems, management of conversations, and access to AI-powered functionalities.

## Table of Contents

1. [Authentication](#authentication)
2. [API Overview](#api-overview)
3. [Endpoints](#endpoints)
   - [Conversations](#conversations)
   - [Messaging](#messaging)
   - [Dealerships](#dealerships)
   - [Vehicles](#vehicles)
   - [Personas](#personas)
   - [Handover](#handover)
   - [Analytics](#analytics)
4. [Response Formats](#response-formats)
5. [Error Handling](#error-handling)
6. [Rate Limits](#rate-limits)

## Authentication

The Rylie AI API uses API key-based authentication. Each dealership is assigned a unique API key that must be included in all requests.

### API Key Authentication

Include your API key in the request headers:

```
Authorization: Bearer YOUR_API_KEY
```

Alternatively, you can include it as a query parameter:

```
?api_key=YOUR_API_KEY
```

API keys are managed through the admin dashboard and are specific to each dealership.

## API Overview

The base URL for all API requests is:

```
https://yourdomain.com/api
```

All responses are returned in JSON format. Successful responses include a `success: true` field, while error responses include `success: false` and an error message.

## Endpoints

### Conversations

#### List Conversations

```
GET /conversations
```

Query parameters:
- `dealershipId` (required): ID of the dealership
- `status`: Filter by status (`active`, `closed`, `handover`)
- `limit`: Number of conversations to return (default: 50)
- `offset`: Pagination offset (default: 0)

#### Get Conversation

```
GET /conversations/:id
```

Path parameters:
- `id`: Conversation ID

#### Create Conversation

```
POST /conversations
```

Request body:
```json
{
  "dealershipId": 123,
  "customerName": "John Doe",
  "customerContact": "john@example.com"
}
```

### Messaging

#### Inbound Message

```
POST /inbound
```

Request body:
```json
{
  "conversationId": 456,
  "message": "I'm interested in buying a new car",
  "customerId": "customer-123"
}
```

#### Reply to Message

```
POST /reply
```

Request body:
```json
{
  "conversationId": 456,
  "message": "Let me tell you about our inventory"
}
```

### Dealerships

#### Get Dealership

```
GET /dealerships/:id
```

Path parameters:
- `id`: Dealership ID

#### List Dealerships

```
GET /dealerships
```

Query parameters:
- `limit`: Number of dealerships to return (default: 50)
- `offset`: Pagination offset (default: 0)

### Vehicles

#### List Vehicles

```
GET /vehicles
```

Query parameters:
- `dealershipId` (required): ID of the dealership
- `make`: Filter by make
- `model`: Filter by model
- `year`: Filter by year
- `limit`: Number of vehicles to return (default: 50)
- `offset`: Pagination offset (default: 0)

#### Get Vehicle

```
GET /vehicles/:id
```

Path parameters:
- `id`: Vehicle ID

### Personas

#### List Personas

```
GET /personas
```

Query parameters:
- `dealershipId` (required): ID of the dealership

#### Get Persona

```
GET /personas/:id
```

Path parameters:
- `id`: Persona ID

#### Create Persona

```
POST /personas
```

Request body:
```json
{
  "dealershipId": 123,
  "name": "Sales Assistant",
  "configuration": {
    "personality": "friendly and helpful",
    "knowledgeAreas": ["financing", "vehicle features"]
  }
}
```

### Handover

#### Initiate Handover

```
POST /handover
```

Request body:
```json
{
  "conversationId": 456,
  "reason": "Customer requesting specific financing details",
  "priority": "high"
}
```

### Analytics

#### Get Conversation Analytics

```
GET /analytics/conversations
```

Query parameters:
- `dealershipId` (required): ID of the dealership
- `startDate`: Start date (ISO format)
- `endDate`: End date (ISO format)

## Response Formats

Successful response:

```json
{
  "success": true,
  "data": { ... }
}
```

Error response:

```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

## Error Handling

Common error codes:

- `400`: Bad Request - Invalid parameters or request body
- `401`: Unauthorized - Invalid or missing API key
- `403`: Forbidden - Valid API key but insufficient permissions
- `404`: Not Found - Resource not found
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error - Unexpected server error

## Rate Limits

The API enforces rate limits to prevent abuse:

- 100 requests per minute per API key
- 5,000 requests per day per API key

When a rate limit is exceeded, the API returns a 429 Too Many Requests response with a Retry-After header indicating when the client can make requests again.