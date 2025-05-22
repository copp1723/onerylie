# Rylie AI - API Integration Guide

This guide provides examples and best practices for integrating with the Rylie AI platform's API.

## Table of Contents
1. [Authentication](#authentication)
2. [Basic API Integration](#basic-api-integration)
3. [Integration Examples](#integration-examples)
   - [Starting a Conversation](#starting-a-conversation)
   - [Handling Replies](#handling-replies)
   - [Processing Handovers](#processing-handovers)
   - [Retrieving Conversation History](#retrieving-conversation-history)
4. [Webhook Integration](#webhook-integration)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Best Practices](#best-practices)

## Authentication

All API requests require authentication using an API key. You can generate API keys in the Rylie AI dashboard under Settings > API Keys.

Include your API key in the request header:

```
X-API-Key: your-api-key-here
```

Example in different programming languages:

### JavaScript (Node.js)
```javascript
const axios = require('axios');

const rylie = axios.create({
  baseURL: 'https://api.rylie-ai.com',
  headers: {
    'X-API-Key': 'your-api-key-here',
    'Content-Type': 'application/json'
  }
});

// Now use rylie for API requests
rylie.post('/api/inbound', {
  customerMessage: 'I want to buy a car',
  customerName: 'John Doe'
  // other required fields
})
.then(response => console.log(response.data))
.catch(error => console.error(error));
```

### Python
```python
import requests

api_key = "your-api-key-here"
base_url = "https://api.rylie-ai.com"

headers = {
    "X-API-Key": api_key,
    "Content-Type": "application/json"
}

# Example request
response = requests.post(
    f"{base_url}/api/inbound",
    headers=headers,
    json={
        "customerMessage": "I want to buy a car",
        "customerName": "John Doe",
        "dealershipId": 1,
        # other required fields
    }
)

print(response.json())
```

## Basic API Integration

The Rylie AI API follows RESTful principles:
- Uses standard HTTP methods (GET, POST, PATCH, DELETE)
- Returns JSON responses
- Uses HTTP status codes to indicate success/failure
- All endpoints are prefixed with `/api`

## Integration Examples

### Starting a Conversation

To start a new conversation with Rylie AI:

**Endpoint:** `POST /api/inbound`

**Request:**
```json
{
  "customerMessage": "I'm interested in the new SUV models you have",
  "customerName": "John Doe",
  "customerPhone": "+12345678901",
  "customerEmail": "john@example.com",
  "dealershipId": 1,
  "channel": "website",
  "campaignContext": "Summer Sale Campaign"
}
```

**Response:**
```json
{
  "conversationId": 12345,
  "response": "Hi John! Thanks for your interest in our SUV lineup. We have several great options including the Explorer XLT, Highlander Limited, and Grand Cherokee. Are you looking for something with specific features like third-row seating or off-road capabilities?",
  "status": "active"
}
```

**Node.js Example:**
```javascript
async function startConversation(customerData) {
  try {
    const response = await rylie.post('/api/inbound', customerData);
    return response.data;
  } catch (error) {
    console.error('Error starting conversation:', error.response?.data || error.message);
    throw error;
  }
}

// Usage
startConversation({
  customerMessage: "I'm interested in SUVs with good fuel economy",
  customerName: "Sarah Johnson",
  customerEmail: "sarah@example.com",
  dealershipId: 1,
  channel: "website"
}).then(result => {
  console.log(`Conversation started, ID: ${result.conversationId}`);
  console.log(`AI response: ${result.response}`);
});
```

### Handling Replies

To handle customer replies to an existing conversation:

**Endpoint:** `POST /api/reply`

**Request:**
```json
{
  "conversationId": 12345,
  "message": "I'm specifically interested in hybrid SUVs. What options do you have?"
}
```

**Response:**
```json
{
  "response": "We have several hybrid SUV options including the Toyota RAV4 Hybrid with 40 MPG combined, the Ford Escape Hybrid with 41 MPG city, and the Honda CR-V Hybrid with 38 MPG combined. Would you like more details about any of these models?",
  "shouldEscalate": false
}
```

**PHP Example:**
```php
<?php
function sendReply($conversationId, $message) {
    $apiKey = 'your-api-key-here';
    $url = 'https://api.rylie-ai.com/api/reply';
    
    $data = [
        'conversationId' => $conversationId,
        'message' => $message
    ];
    
    $options = [
        'http' => [
            'header' => "Content-type: application/json\r\nX-API-Key: $apiKey",
            'method' => 'POST',
            'content' => json_encode($data)
        ]
    ];
    
    $context = stream_context_create($options);
    $result = file_get_contents($url, false, $context);
    
    return json_decode($result, true);
}

// Usage
$reply = sendReply(12345, "Do any of those hybrid SUVs have third-row seating?");
echo "AI response: " . $reply['response'];

if ($reply['shouldEscalate']) {
    echo "This conversation should be escalated to a human agent.";
}
?>
```

### Processing Handovers

When Rylie AI determines a conversation should be handled by a human:

**Endpoint:** `POST /api/handover`

**Request:**
```json
{
  "conversationId": 12345,
  "reason": "Customer requesting specific financing details",
  "assignToUserId": 42
}
```

**Response:**
```json
{
  "success": true,
  "conversation": {
    "id": 12345,
    "status": "escalated",
    "assignedTo": 42,
    "escalatedAt": "2025-05-22T14:30:45Z"
  }
}
```

**Python Example:**
```python
def process_handover(conversation_id, reason=None, assign_to=None):
    handover_data = {
        "conversationId": conversation_id
    }
    
    if reason:
        handover_data["reason"] = reason
        
    if assign_to:
        handover_data["assignToUserId"] = assign_to
    
    response = requests.post(
        f"{base_url}/api/handover",
        headers=headers,
        json=handover_data
    )
    
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Handover failed: {response.text}")

# Usage
try:
    result = process_handover(
        conversation_id=12345, 
        reason="Customer needs detailed financing options", 
        assign_to=42
    )
    print(f"Conversation successfully escalated to user {result['conversation']['assignedTo']}")
except Exception as e:
    print(str(e))
```

### Retrieving Conversation History

To get the full history of a conversation:

**Endpoint:** `GET /api/conversations/{conversationId}`

**Response:**
```json
{
  "id": 12345,
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "status": "active",
  "createdAt": "2025-05-22T12:15:30Z",
  "updatedAt": "2025-05-22T12:20:15Z",
  "messages": [
    {
      "id": 1,
      "content": "I'm interested in the new SUV models you have",
      "isFromCustomer": true,
      "timestamp": "2025-05-22T12:15:30Z"
    },
    {
      "id": 2,
      "content": "Hi John! Thanks for your interest in our SUV lineup...",
      "isFromCustomer": false,
      "timestamp": "2025-05-22T12:15:35Z"
    },
    {
      "id": 3,
      "content": "I'm specifically interested in hybrid SUVs. What options do you have?",
      "isFromCustomer": true,
      "timestamp": "2025-05-22T12:20:10Z"
    },
    {
      "id": 4,
      "content": "We have several hybrid SUV options including...",
      "isFromCustomer": false,
      "timestamp": "2025-05-22T12:20:15Z"
    }
  ]
}
```

**JavaScript Example:**
```javascript
async function getConversationHistory(conversationId) {
  try {
    const response = await rylie.get(`/api/conversations/${conversationId}`);
    return response.data;
  } catch (error) {
    console.error('Error retrieving conversation:', error.response?.data || error.message);
    throw error;
  }
}

// Usage
getConversationHistory(12345)
  .then(conversation => {
    console.log(`Conversation with ${conversation.customerName}`);
    conversation.messages.forEach(msg => {
      const from = msg.isFromCustomer ? 'Customer' : 'Rylie AI';
      console.log(`[${new Date(msg.timestamp).toLocaleString()}] ${from}: ${msg.content}`);
    });
  })
  .catch(error => console.error('Failed to get conversation history', error));
```

## Webhook Integration

Rylie AI can send webhook notifications for important events:

### Setting Up Webhooks

Configure your webhook endpoint in the Rylie AI dashboard:
1. Go to Settings > Webhooks
2. Add a new webhook URL
3. Select events to subscribe to
4. Save your configuration

### Webhook Events

The platform supports these webhook events:
- `conversation.created`: A new conversation has started
- `conversation.message`: A new message was added to a conversation
- `conversation.escalated`: A conversation was escalated to a human
- `conversation.completed`: A conversation was marked as completed

### Webhook Payload Example

```json
{
  "event": "conversation.escalated",
  "timestamp": "2025-05-22T14:30:45Z",
  "data": {
    "conversationId": 12345,
    "dealershipId": 1,
    "customerName": "John Doe",
    "reason": "Customer requesting specific financing details",
    "assignedTo": 42
  }
}
```

### Webhook Verification

To verify webhook payloads, check the `X-Rylie-Signature` header:

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(JSON.stringify(payload)).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(digest),
    Buffer.from(signature)
  );
}

// Express.js example
app.post('/webhooks/rylie', (req, res) => {
  const signature = req.headers['x-rylie-signature'];
  
  if (!verifyWebhook(req.body, signature, 'your-webhook-secret')) {
    return res.status(401).send('Invalid signature');
  }
  
  // Process the webhook
  const event = req.body.event;
  const data = req.body.data;
  
  switch (event) {
    case 'conversation.escalated':
      // Alert sales team
      break;
    case 'conversation.message':
      // Log the message
      break;
    // Handle other events
  }
  
  res.status(200).send('Webhook received');
});
```

## Error Handling

The API uses standard HTTP status codes:
- `200 OK`: Request succeeded
- `400 Bad Request`: Invalid parameters
- `401 Unauthorized`: Invalid or missing API key
- `403 Forbidden`: API key doesn't have permission
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Server Error`: Something went wrong on the server

Error responses include a message:

```json
{
  "message": "Invalid input",
  "errors": [
    {
      "field": "customerEmail",
      "message": "Must be a valid email address"
    }
  ]
}
```

## Rate Limiting

The API implements rate limiting to ensure fair usage:
- 100 requests per minute per API key
- 10,000 requests per day per API key

Rate limit headers are included in responses:
- `X-Rate-Limit-Limit`: Rate limit ceiling
- `X-Rate-Limit-Remaining`: Remaining requests
- `X-Rate-Limit-Reset`: Timestamp when limit resets

## Best Practices

1. **Implement retry logic** for failed requests with exponential backoff
2. **Cache responses** when appropriate to reduce API calls
3. **Handle rate limits** gracefully by respecting the reset time
4. **Use webhooks** for event-driven architecture rather than polling
5. **Validate inputs** before sending to the API
6. **Store conversation IDs** to maintain context for ongoing conversations
7. **Implement proper error handling** to enhance user experience
8. **Log API interactions** for debugging and analytics
9. **Use a dedicated API client library** when available
10. **Keep your API keys secure** and rotate them periodically