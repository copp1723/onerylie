import OpenAI from "openai";
import { Vehicle } from "@shared/schema";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });

// Types for persona arguments
export interface PersonaArguments {
  tone?: string;
  priorityFeatures?: string[];
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

// Process incoming customer message and generate a response
export async function generateResponse(
  customerMessage: string,
  context: ConversationContext,
  personaTemplate: string,
  personaArguments: PersonaArguments
): Promise<{ response: string; shouldEscalate: boolean; reason?: string }> {
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
      max_tokens: 1000,
    });
    
    // Parse the response
    const jsonResponse = JSON.parse(completion.choices[0].message.content || "{}");
    
    return {
      response: jsonResponse.response || "I'm sorry, I couldn't process your request.",
      shouldEscalate: jsonResponse.escalate || false,
      reason: jsonResponse.escalate ? jsonResponse.reason : undefined
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
  
  // Base instructions that always apply
  const baseInstructions = `
You are Rylie, an AI assistant for ${context.dealershipName}. You're speaking with ${context.customerName}.

COMPLIANCE RULES (EXTREMELY IMPORTANT):
1. NEVER mention price, financing, or payment terms
2. NEVER mention vehicles that aren't in the provided inventory list
3. NEVER make up information about vehicles
4. If you don't know something, suggest the customer speak with a sales representative
5. ALWAYS be professional, helpful, and conversational

RESPONSE FORMAT:
You must respond with a JSON object having these fields:
- "response": Your message to the customer (string)
- "escalate": Whether this conversation should be escalated to a human (boolean)
- "reason": If escalating, briefly explain why (string, optional)

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
    "financing", "finance", "loan", "credit", "payment", "lease", "trade-in", "trade in",
    "discount", "negotiate", "bargain", "best price", "offer", "buy now", 
    "speak to a human", "talk to a person", "talk to a manager", "speak with manager", 
    "speak with representative", "speak with sales"
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
