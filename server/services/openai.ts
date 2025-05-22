import OpenAI from "openai";
import { Vehicle } from "@shared/schema";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

// Types for persona arguments
export interface PersonaArguments {
  tone?: string;
  priorityFeatures?: string[];
  tradeInUrl?: string;
  financingUrl?: string;
  handoverEmail?: string;
  [key: string]: any;
}

// Type for context to be provided to LLM
export interface ConversationContext {
  customerName: string;
  dealershipName: string;
  campaignContext?: string;
  previousMessages: {
    role: "customer" | "assistant";
    content: string;
  }[];
  relevantVehicles?: Vehicle[];
}

// Type for handover dossier
export interface HandoverDossier {
  // Lead Identification
  customerName: string;
  contactDetails: {
    email?: string;
    phone?: string;
  };
  productsInterested: string[];
  purchaseTimeline: string;
  dealershipName: string;
  
  // Conversation Summary
  keyPoints: string[];
  leadIntent: string;
  
  // Relationship Building Information
  personalInsights: string;
  communicationStyle: string;
  
  // Sales Strategies
  engagementTips: string[];
  closingStrategies: string[];
  
  // Full conversation history for reference
  conversationHistory: {
    role: "customer" | "assistant";
    content: string;
    timestamp?: string;
  }[];
}

// Process incoming customer message and generate a response
export async function generateResponse(
  customerMessage: string,
  context: ConversationContext,
  personaTemplate: string,
  personaArguments: PersonaArguments
): Promise<{ response: string; shouldEscalate: boolean; reason?: string; handoverDossier?: HandoverDossier }> {
  try {
    // Build the complete system prompt with persona configuration
    const systemPrompt = buildSystemPrompt(personaTemplate, personaArguments, context);
    
    // Prepare conversation history
    const conversationHistory = context.previousMessages.map(msg => ({
      role: msg.role === "customer" ? "user" : "assistant",
      content: msg.content
    }));
    
    // Add the current message
    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { role: "user", content: customerMessage }
    ];
    
    // Request structured JSON response from OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: messages as any,
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1500,
    });
    
    // Parse the response
    const jsonResponse = JSON.parse(completion.choices[0].message.content || "{}");
    
    // Detect if this message should trigger escalation based on content
    const containsEscalationKeywords = detectEscalationKeywords(customerMessage);
    const shouldEscalate = jsonResponse.escalate || containsEscalationKeywords;
    
    // If escalation is needed, generate a handover dossier
    let handoverDossier: HandoverDossier | undefined;
    
    if (shouldEscalate) {
      handoverDossier = await generateHandoverDossier(customerMessage, context);
    }
    
    return {
      response: jsonResponse.response || "I'm sorry, I couldn't process your request.",
      shouldEscalate: shouldEscalate,
      reason: shouldEscalate ? (jsonResponse.reason || "Customer query requires human assistance") : undefined,
      handoverDossier: handoverDossier
    };
  } catch (error) {
    console.error("Error generating response:", error);
    return {
      response: "I apologize, but I'm having trouble processing your request right now. Let me connect you with a human representative who can assist you.",
      shouldEscalate: true,
      reason: "LLM processing error"
    };
  }
}

// Generate a comprehensive handover dossier for human representatives
export async function generateHandoverDossier(
  lastCustomerMessage: string,
  context: ConversationContext
): Promise<HandoverDossier> {
  try {
    const conversationHistory = context.previousMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    // Add the current message to history
    conversationHistory.push({
      role: "customer",
      content: lastCustomerMessage
    });
    
    const prompt = `
**SYSTEM INSTRUCTION: LEAD HANDOVER**

When a lead is determined to be ready for handover to a human dealership representative, generate a detailed, professional summary that prepares the salesperson to effectively engage and close the opportunity. Follow the outline below and fill in each section using the complete conversation history, customer-provided context, and any relevant background data.

**FORMAT THE HANDOVER AS A JSON OBJECT WITH THE FOLLOWING STRUCTURE:**

Return a JSON object with these fields:
- customerName: The customer's full name
- contactDetails: An object with email and phone (if available)
- productsInterested: Array of products/vehicles the lead is seeking
- purchaseTimeline: Any timing/urgency cues provided by the lead
- dealershipName: Name of the dealership
- keyPoints: Array of concise bullet points summarizing the lead's needs, pain points, and context
- leadIntent: The specific outcome the lead is seeking (e.g., "seeking immediate financing for a new car")
- personalInsights: Any personal, situational, or emotional factors relevant to building rapport
- communicationStyle: Description of how the lead prefers to communicate
- engagementTips: Array of recommendations for how to approach the lead
- closingStrategies: Array of suggested effective strategies for progressing the sale

Be clear, professional, and empathetic. Only include facts shared or inferred from the conversation—do not fabricate details. 
Do not include pricing or financing offers; defer those to the dealership rep.
`;
    
    // Vehicle information if available
    let vehicleInfo = "";
    if (context.relevantVehicles && context.relevantVehicles.length > 0) {
      vehicleInfo = "Available vehicles that may be relevant:\n";
      context.relevantVehicles.forEach((vehicle, index) => {
        vehicleInfo += `${index + 1}. ${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim || ''}\n`;
      });
    }
    
    const messages = [
      { 
        role: "system", 
        content: prompt + "\n\nCustomer: " + context.customerName + "\nDealership: " + context.dealershipName + "\n" + vehicleInfo
      },
      { 
        role: "user", 
        content: "Here's the conversation history:\n" + 
          conversationHistory.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join("\n\n")
      }
    ];
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: messages as any,
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2000,
    });
    
    const dossier = JSON.parse(completion.choices[0].message.content || "{}");
    
    // Add timestamps to the conversation history for the dossier
    dossier.conversationHistory = conversationHistory.map((msg, index) => ({
      ...msg,
      timestamp: new Date(Date.now() - (conversationHistory.length - index) * 5 * 60000).toISOString()
    }));
    
    return dossier as HandoverDossier;
  } catch (error) {
    console.error("Error generating handover dossier:", error);
    // Return a basic dossier if we encounter an error
    return {
      customerName: context.customerName,
      contactDetails: {
        email: "",
        phone: ""
      },
      productsInterested: ["Unable to determine"],
      purchaseTimeline: "Unable to determine",
      dealershipName: context.dealershipName,
      keyPoints: ["Error generating key points"],
      leadIntent: "Error determining lead intent",
      personalInsights: "Unable to analyze",
      communicationStyle: "Unable to determine",
      engagementTips: ["Review the conversation history", "Contact customer promptly"],
      closingStrategies: ["Address customer needs directly", "Provide personalized assistance"],
      conversationHistory: context.previousMessages.concat([{
        role: "customer",
        content: lastCustomerMessage
      }])
    };
  }
}

// Helper function to build the complete system prompt
function buildSystemPrompt(
  personaTemplate: string,
  personaArguments: PersonaArguments,
  context: ConversationContext
): string {
  // Vehicle information formatting
  let vehicleInfo = "";
  if (context.relevantVehicles && context.relevantVehicles.length > 0) {
    vehicleInfo = "Available vehicles that may be relevant:\n";
    context.relevantVehicles.forEach((vehicle, index) => {
      vehicleInfo += `${index + 1}. ${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim || ''}\n`;
      vehicleInfo += `   - Color: ${vehicle.exteriorColor || 'Not specified'}\n`;
      vehicleInfo += `   - Interior: ${vehicle.interiorColor || 'Not specified'}\n`;
      vehicleInfo += `   - Features: ${vehicle.features?.join(', ') || 'Not specified'}\n`;
      vehicleInfo += `   - Mileage: ${vehicle.mileage || 'New'}\n`;
    });
  }
  
  // Base instructions with updated style guide
  const baseInstructions = `
You are Rylie, an AI assistant for ${context.dealershipName}. You're speaking with ${context.customerName}.

STYLE & TONE GUIDE:
- Always greet customers warmly and personally (e.g., "Hey ${context.customerName}, great to hear from you!").
- Keep it natural, friendly, and engaging—like chatting with a helpful salesperson, not a stiff bot.
- Adapt dynamically to the customer's mood and urgency.
- Avoid formal greetings like "Dear" or robotic phrases like "delving into specifics."
- Use casual, friendly phrasing (e.g., "Happy to help!").

NEXT STEPS:
- Every response must end with a clear action step framed as a friendly invitation.

URL HANDLING & VALUE-DRIVEN INTEGRATION:
${personaArguments.tradeInUrl ? `- If the customer mentions trade-ins, include this trade-in link: ${personaArguments.tradeInUrl}` : ''}
${personaArguments.financingUrl ? `- If financing comes up, include this financing link: ${personaArguments.financingUrl}` : ''}

CONCISENESS & FORMATTING:
- Keep responses short: max 5 sentences OR 3 short paragraphs.
- Use line breaks to avoid dense text walls.
- Skip over-explaining.

COMPLIANCE RULES (EXTREMELY IMPORTANT):
1. DO NOT mention, imply, or hint at specific pricing, payments, shipping, or delivery
2. NEVER mention vehicles that aren't in the provided inventory list
3. NEVER make up information about vehicles
4. If you don't know something, suggest the customer speak with a sales representative
5. ALWAYS be professional, helpful, and conversational

RESPONSE FORMAT:
You must respond with a JSON object having these fields:
- "response": Your message to the customer (string)
- "escalate": Whether this conversation should be escalated to a human (boolean)
- "reason": If escalating, briefly explain why (string, optional)

When to escalate:
- Customer mentions legal concerns or a competitor's offer
- Customer asks for a human agent
- Customer requests specific pricing or financing details
- Customer is ready to make a purchase
- Customer has complex questions that require deep product expertise
- Customer shows high buying intent and needs personal attention to close the deal

${context.campaignContext ? `CAMPAIGN CONTEXT:\n${context.campaignContext}\n` : ''}

${vehicleInfo}

PERSONA CONFIGURATION:
${personaTemplate}
`;

  // Inject persona arguments
  let finalPrompt = baseInstructions;
  for (const [key, value] of Object.entries(personaArguments)) {
    finalPrompt = finalPrompt.replace(`{${key}}`, Array.isArray(value) ? value.join(', ') : value);
  }
  
  return finalPrompt;
}

// Detect keywords that should trigger escalation
export function detectEscalationKeywords(message: string): boolean {
  const escalationKeywords = [
    "pricing details", "exact price", "final price", "best deal", "bottom line",
    "negotiate", "bargain", "best price", "speak to a human", "talk to a person", 
    "talk to a manager", "speak with manager", "speak with representative", "speak with sales",
    "legal", "lawyer", "attorney", "lawsuit", "competitor offer", "other dealer",
    "ready to buy", "purchase now", "sign papers", "when can I come in"
  ];
  
  const lowercaseMessage = message.toLowerCase();
  return escalationKeywords.some(keyword => lowercaseMessage.includes(keyword));
}

// Search for relevant vehicles based on customer message
export async function analyzeMessageForVehicleIntent(
  message: string
): Promise<{ make?: string; model?: string; features?: string[]; year?: number }> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `
Extract vehicle search intent from the customer message. Return a JSON object with these fields:
- make: Car manufacturer (e.g., "Toyota", "Honda", null if not mentioned)
- model: Car model (e.g., "Camry", "Civic", null if not mentioned)
- features: Array of features mentioned (e.g., ["sunroof", "leather seats"], empty array if none)
- year: Model year if mentioned (number, null if not mentioned)

If no vehicle search intent is detected, return empty values.
          `
        },
        { role: "user", content: message }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });
    
    return JSON.parse(completion.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Error analyzing vehicle intent:", error);
    return {};
  }
}
