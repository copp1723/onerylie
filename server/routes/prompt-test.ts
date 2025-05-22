import { Router } from 'express';
import OpenAI from 'openai';
import { z } from 'zod';

// Create a router
const router = Router();

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Input validation schema
const vehicleSchema = z.object({
  id: z.number(),
  vin: z.string(),
  make: z.string(),
  model: z.string(),
  year: z.number(),
  trim: z.string(),
  exteriorColor: z.string(),
  interiorColor: z.string(),
  mileage: z.number(),
  price: z.number(),
  condition: z.string(),
  description: z.string(),
  features: z.array(z.string())
});

const customerInfoSchema = z.object({
  name: z.string(),
  conversationId: z.number().optional(),
  phone: z.string().optional(),
  email: z.string().optional()
});

const dealershipContextSchema = z.object({
  dealershipId: z.number(),
  dealershipName: z.string(),
  brandTypes: z.string(),
  dealershipLocation: z.string(),
  businessHours: z.string()
});

const formatOptionsSchema = z.object({
  enableJsonResponse: z.boolean().optional().default(false),
  includeVehicleRecommendations: z.boolean().optional().default(true),
  considerHandover: z.boolean().optional().default(true),
  generateHandoverDossier: z.boolean().optional().default(false)
});

const messageSchema = z.object({
  role: z.string(),
  content: z.string()
});

const promptTestSchema = z.object({
  customerMessage: z.string().min(1, "Customer message is required"),
  systemPrompt: z.string().min(1, "System prompt is required"),
  channel: z.string().optional().default("sms"),
  customerInfo: customerInfoSchema.optional(),
  dealershipContext: dealershipContextSchema.optional(),
  conversationHistory: z.array(messageSchema).optional().default([]),
  relevantVehicles: z.array(vehicleSchema).optional().default([]),
  formatOptions: formatOptionsSchema.optional().default({})
});

// Replace template variables in the system prompt
function applyTemplateVariables(template: string, variables: Record<string, any>): string {
  let result = template;
  
  Object.entries(variables).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{${key}}`, 'g'), value);
  });
  
  return result;
}

// Process vehicle data to create recommendations
function formatVehicleRecommendations(vehicles: any[]): string {
  if (!vehicles || vehicles.length === 0) {
    return "";
  }
  
  return vehicles.map(vehicle => {
    return `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim} - $${vehicle.price.toLocaleString()}, ${vehicle.mileage.toLocaleString()} miles, ${vehicle.exteriorColor}`;
  }).join("\n");
}

// Generate a handover dossier based on conversation
function generateHandoverDossier(data: any): any {
  return {
    customerName: data.customerInfo?.name || "Unknown",
    customerContact: data.customerInfo?.phone || data.customerInfo?.email || "Not provided",
    dealershipId: data.dealershipContext?.dealershipId || 0,
    conversationId: data.customerInfo?.conversationId || 0,
    conversationSummary: "Conversation requiring human assistance",
    customerInsights: [
      {
        key: "Intent",
        value: "Purchase inquiry",
        confidence: 0.9
      },
      {
        key: "Budget",
        value: "Unknown",
        confidence: 0.5
      }
    ],
    vehicleInterests: data.relevantVehicles.map((v: any) => ({
      vin: v.vin,
      year: v.year,
      make: v.make,
      model: v.model,
      trim: v.trim,
      confidence: 0.8
    })),
    suggestedApproach: "Follow up promptly with specific vehicle information",
    urgency: "medium",
    fullConversationHistory: [
      ...data.conversationHistory,
      { 
        role: "customer", 
        content: data.customerMessage,
        timestamp: new Date()
      }
    ],
    escalationReason: "Customer has specific questions about pricing/financing"
  };
}

// Test prompt endpoint
router.post('/test', async (req, res) => {
  try {
    // Validate request body
    const validation = promptTestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Invalid request',
        details: validation.error.format()
      });
    }

    const data = validation.data;
    
    // Apply template variables to system prompt
    const processedSystemPrompt = data.dealershipContext 
      ? applyTemplateVariables(data.systemPrompt, data.dealershipContext)
      : data.systemPrompt;
    
    // Prepare conversation history
    let messages = [
      {
        role: "system",
        content: processedSystemPrompt
      }
    ];
    
    // Add conversation history if provided
    if (data.conversationHistory && data.conversationHistory.length > 0) {
      messages = [
        ...messages,
        ...data.conversationHistory.map(msg => ({
          role: msg.role === 'customer' ? 'user' : 'assistant',
          content: msg.content
        }))
      ];
    }
    
    // Add context about vehicles if provided
    if (data.relevantVehicles && data.relevantVehicles.length > 0 && 
        data.formatOptions?.includeVehicleRecommendations) {
      messages.push({
        role: "system",
        content: `Current vehicle inventory:\n${formatVehicleRecommendations(data.relevantVehicles)}`
      });
    }
    
    // Add communication channel information
    messages.push({
      role: "system",
      content: `The customer is contacting via ${data.channel}. Adapt your response style accordingly.`
    });
    
    // Add customer information if available
    if (data.customerInfo) {
      messages.push({
        role: "system",
        content: `Customer information: Name: ${data.customerInfo.name}${data.customerInfo.phone ? ', Phone: ' + data.customerInfo.phone : ''}${data.customerInfo.email ? ', Email: ' + data.customerInfo.email : ''}`
      });
    }
    
    // Add the customer message
    messages.push({
      role: "user",
      content: data.customerMessage
    });

    // Call OpenAI with the processed messages
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 1500,
      ...(data.formatOptions?.enableJsonResponse ? { response_format: { type: "json_object" } } : {})
    });

    // Extract the response text
    const responseText = completion.choices[0]?.message?.content || "No response generated";
    let responseObject: any = { response: responseText };
    
    // Add handover information if requested
    if (data.formatOptions?.considerHandover) {
      // For demo purposes, we'll detect handover based on simple keywords
      const handoverKeywords = ['speak to a human', 'talk to someone', 'representative', 'test drive', 'pricing details', 'financing options'];
      const needsHandover = handoverKeywords.some(keyword => 
        data.customerMessage.toLowerCase().includes(keyword.toLowerCase())
      );
      
      responseObject.shouldEscalate = needsHandover;
      responseObject.reason = needsHandover ? "Customer requested specific information requiring human assistance" : undefined;
      
      // Generate handover dossier if requested and needed
      if (needsHandover && data.formatOptions.generateHandoverDossier) {
        responseObject.handoverDossier = generateHandoverDossier(data);
      }
    }
    
    // Add usage information
    responseObject.usage = completion.usage;
    
    // Return the response
    return res.json(responseObject);
  } catch (error: any) {
    console.error('Error testing prompt:', error);
    
    // Handle OpenAI API errors
    if (error.response) {
      return res.status(error.response.status).json({
        error: `OpenAI API Error: ${error.response.data.error.message}`,
        code: error.response.data.error.code
      });
    }
    
    // Handle generic errors
    return res.status(500).json({ 
      error: 'Error processing request',
      message: error.message
    });
  }
});

export default router;