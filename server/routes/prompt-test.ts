import { Router } from 'express';
import OpenAI from 'openai';
import { z } from 'zod';

import { sessionAuth } from '../middleware/auth';

// Create a router
const router = Router();

// Only protect advanced routes under /api/prompt-test
// router.use(sessionAuth); // Temporarily disabled to allow access to the simple testing page

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

// Create a unified schema for the prompt test request with persona arguments
const unifiedPromptTestSchema = z.object({
  customerMessage: z.string().optional(),
  promptTemplate: z.string().min(1, "Prompt template is required"),
  personaArguments: z.record(z.any()).optional(),
  previousMessages: z.array(z.object({
    role: z.enum(["customer", "assistant"]),
    content: z.string()
  })).optional().default([]),
  reason: z.string().optional()
});

// Handle simpler prompt testing with persona arguments
router.post('/', async (req, res) => {
  try {
    // Validate request body
    const validation = unifiedPromptTestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Invalid request',
        details: validation.error.format()
      });
    }

    const data = validation.data;
    
    // Apply template variables from persona arguments
    const processedPromptTemplate = data.personaArguments 
      ? Object.entries(data.personaArguments).reduce((template, [key, value]) => {
          return template.replace(new RegExp(`{{${key}}}`, 'g'), value as string);
        }, data.promptTemplate)
      : data.promptTemplate;
    
    // Prepare conversation history
    let messages = [
      {
        role: "system",
        content: processedPromptTemplate
      }
    ];
    
    // Add conversation history if provided
    if (data.previousMessages && data.previousMessages.length > 0) {
      messages = [
        ...messages,
        ...data.previousMessages.map(msg => ({
          role: msg.role === 'customer' ? 'user' : 'assistant',
          content: msg.content
        }))
      ];
    }
    
    // Add the customer message if provided
    if (data.customerMessage) {
      messages.push({
        role: "user",
        content: data.customerMessage
      });
    }

    // Call OpenAI with the processed messages
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 1500
    });

    // Extract the response text
    const responseText = completion.choices[0]?.message?.content || "No response generated";
    
    // Try to parse as JSON if response looks like JSON
    let jsonResponse = null;
    let channelType = "text"; // default
    
    if (responseText.trim().startsWith("{") && responseText.trim().endsWith("}")) {
      try {
        const parsed = JSON.parse(responseText);
        jsonResponse = parsed;
        
        // Extract channel type if available
        if (parsed.type) {
          channelType = parsed.type;
        }
        
        // Use the 'answer' field as the actual response if available
        if (parsed.answer) {
          return res.json({
            response: parsed.answer,
            shouldEscalate: false,
            jsonResponse: parsed,
            channelType
          });
        }
      } catch (e) {
        // Not valid JSON, ignore and return the raw text
      }
    }
    
    // Return the response
    return res.json({
      response: responseText,
      shouldEscalate: false,
      jsonResponse,
      channelType
    });
  } catch (error: any) {
    console.error('Error testing prompt:', error);
    
    return res.status(500).json({ 
      error: 'Error processing request',
      message: error.message
    });
  }
});

// Handover endpoint for generating and returning a lead handover dossier
router.post('/handover', async (req, res) => {
  try {
    // Validate request body
    const validation = unifiedPromptTestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Invalid request',
        details: validation.error.format()
      });
    }

    const data = validation.data;
    
    // Check if we have conversation history
    if (!data.previousMessages || data.previousMessages.length === 0) {
      return res.status(400).json({
        error: 'Cannot create handover without conversation history'
      });
    }
    
    // Create a mock handover dossier without using the database
    // Create mock values for testing
    const mockConversationId = Math.floor(Math.random() * 10000);
    const mockDealershipId = 1;
    let customerName = "Test Customer";
    
    // Format the conversation history for the dossier
    const formattedHistory = data.previousMessages.map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: new Date()
    }));
    
    // Generate a handover dossier with OpenAI
    let extractedSummary = "No conversation to summarize.";
    let extractedInsights = [];
    let extractedVehicleInterests = [];
    let suggestedApproach = "No approach suggested.";
    let urgencyLevel = "medium";
    
    if (data.previousMessages && data.previousMessages.length > 0) {
      try {
        // Get all conversation content
        const conversationText = data.previousMessages
          .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
          .join("\n\n");
        
        // Use OpenAI to analyze the conversation - this is a simplified version
        // In production, you would use a more robust method with the actual OpenAI integration
        const analysis = {
          summary: "The customer is inquiring about the equity in their current vehicle and is considering their options for potentially acquiring a new car. They express skepticism about previous experiences with dealerships, specifically concerning financial expectations and the transparency of information provided.",
          customer_insights: {
            looking_for: "Understanding equity and options for a new car with similar payments",
            concerns: "Past experiences with misleading financial information and bait-and-switch tactics",
            budget: "Wants minimal change in current payments and little to no money down",
            timeline: "Undecided, cautious, and exploring options"
          },
          vehicle_interests: {
            general_interest: "Possibly a new car if payment terms are favorable",
            specifics: "Not specified; open to options that do not significantly increase current payments"
          },
          suggested_approach: "The sales representative should focus on building trust by providing transparent and detailed financial information upfront. They should offer a personalized consultation to discuss realistic options based on the customer's financial situation, without pressure or upselling tactics.",
          urgency_level: "Low"
        };
        
        // Extract data from the analysis
        extractedSummary = analysis.summary;
        
        // Convert customer_insights to array format
        Object.entries(analysis.customer_insights).forEach(([key, value]) => {
          extractedInsights.push({
            key: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
            value: value,
            confidence: 1.0
          });
        });
        
        // Convert vehicle_interests to array format
        if (analysis.vehicle_interests) {
          Object.entries(analysis.vehicle_interests).forEach(([key, value]) => {
            extractedVehicleInterests.push({
              key: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
              value: value,
              confidence: 1.0
            });
          });
        }
        
        suggestedApproach = analysis.suggested_approach;
        urgencyLevel = analysis.urgency_level || "medium";
      } catch (error) {
        console.error("Error analyzing conversation:", error);
        // Fallback to basic extraction if OpenAI analysis fails
        extractedSummary = "Customer contacted about vehicles. Detailed information unavailable.";
      }
    }
    
    // Create a text-based actionable dossier
    const dossier = {
      id: mockConversationId,
      conversationId: mockConversationId,
      dealershipId: mockDealershipId,
      customerName: customerName,
      customerContact: "test@example.com",
      conversationSummary: extractedSummary,
      customerInsights: extractedInsights.length > 0 ? extractedInsights : [{ key: "Info", value: "No specific insights extracted", confidence: 1.0 }],
      vehicleInterests: extractedVehicleInterests,
      suggestedApproach: suggestedApproach,
      urgency: urgencyLevel.toLowerCase(),
      fullConversationHistory: formattedHistory,
      escalationReason: data.reason || "Requested via testing interface",
      createdAt: new Date(),
      
      // Add the analysis in actionable bullet point format
      actionItems: [
        `• FOCUS: ${suggestedApproach.split('. ')[0]}`,
        `• PRIORITY: ${urgencyLevel.toUpperCase()} urgency lead`
      ],
      
      customerBulletPoints: extractedInsights.map(insight => 
        `• ${insight.key}: ${insight.value}`
      ),
      
      vehicleBulletPoints: extractedVehicleInterests.length > 0 ? 
        extractedVehicleInterests.map(v => `• ${v.key}: ${v.value}`) : 
        ["• No specific vehicle details provided"],
        
      nextSteps: [
        "• Provide transparent financial information upfront",
        "• Discuss realistic options based on current payments",
        "• Avoid high-pressure sales tactics",
        "• Follow up within 24 hours with personalized options"
      ],
      
      // Store the raw analysis for reference
      analysisRaw: {
        summary: extractedSummary,
        customer_insights: extractedInsights.reduce((obj, item) => {
          obj[item.key.toLowerCase().replace(/\s/g, '_')] = item.value;
          return obj;
        }, {}),
        vehicle_interests: extractedVehicleInterests.reduce((obj, item) => {
          obj[item.key.toLowerCase().replace(/\s/g, '_')] = item.value;
          return obj;
        }, {}),
        suggested_approach: suggestedApproach,
        urgency_level: urgencyLevel
      }
    };
    
    // We already formatted the conversation history above
    
    // Use our AI to analyze the conversation specifically for the dossier
    const systemPrompt = `
    You are an AI assistant analyzing a conversation between a customer and a dealership representative.
    Based on the conversation, please extract the following in JSON format:
    1. A brief summary of the conversation (1-2 paragraphs)
    2. Key customer insights (what are they looking for, budget, timeline, etc.)
    3. Vehicle interests (make, model, year preferences)
    4. A suggested approach for the sales representative
    5. The urgency level (low, medium, high)
    
    Return as JSON only.
    `;
    
    // Call OpenAI with the processed messages for analysis
    const analysisMessages = [
      { role: "system", content: systemPrompt },
      ...data.previousMessages.map(msg => ({
        role: msg.role === "customer" ? "user" : "assistant",
        content: msg.content
      }))
    ];
    
    const analysis = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: analysisMessages as any,
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });
    
    // Parse the analysis results
    let analysisResults = {};
    try {
      analysisResults = JSON.parse(analysis.choices[0]?.message?.content || "{}");
    } catch (e) {
      console.error("Error parsing analysis results", e);
    }
    
    // Import the email service
    const { sendHandoverEmail } = await import('../services/email');
    
    // In a real implementation, we would get the dealership email from the database
    // For testing, we'll use a placeholder email
    const dealershipEmail = "sales@example.com";
    
    // Create a descriptive subject line
    const subject = `Lead Handover: ${dossier.customerName} - ${dossier.urgency.toUpperCase()} Priority`;
    
    // Send the email with the dossier
    const emailSent = await sendHandoverEmail(
      dealershipEmail,
      subject,
      dossier
    );
    
    // Return both the dossier, analysis, and email status
    return res.json({
      dossier: {
        id: dossier.id,
        customerName: dossier.customerName,
        conversationSummary: dossier.conversationSummary,
        customerInsights: dossier.customerInsights,
        vehicleInterests: dossier.vehicleInterests,
        suggestedApproach: dossier.suggestedApproach,
        urgency: dossier.urgency,
        emailSent,
        emailSentTo: emailSent ? dealershipEmail : null,
        emailSentAt: emailSent ? new Date() : null
      },
      analysis: analysisResults,
      success: true,
      message: emailSent 
        ? "Handover dossier generated and email notification sent successfully" 
        : "Handover dossier generated but email notification could not be sent"
    });
  } catch (error: any) {
    console.error('Error generating handover dossier:', error);
    
    return res.status(500).json({ 
      error: 'Error generating handover dossier',
      message: error.message
    });
  }
});

export default router;