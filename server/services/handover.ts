import OpenAI from 'openai';
import { db } from '../db';
import { messages, conversations, handoverDossiers, dealerships, vehicles } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import type { 
  ConversationHistoryMessage, 
  CustomerInsight, 
  VehicleInterest,
  HandoverDossier,
  InsertHandoverDossier
} from '@shared/schema';
import { sendEmail } from './email';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface HandoverDossierInput {
  conversationId: number;
  dealershipId: number;
  customerName: string;
  customerContact?: string;
  escalationReason: string;
}

/**
 * Analyzes conversation to extract customer insights
 */
async function analyzeCustomerInsights(conversationId: number): Promise<CustomerInsight[]> {
  // Get conversation history
  const messageHistory = await db.select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);
  
  if (!messageHistory.length) {
    return [];
  }

  // Format conversation history for OpenAI
  const formattedHistory = messageHistory.map(msg => ({
    role: msg.isFromCustomer ? 'user' : 'assistant',
    content: msg.content
  }));

  // Use OpenAI to extract insights
  const response = await openai.chat.completions.create({
    model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    messages: [
      {
        role: "system",
        content: `You are an AI that analyzes customer conversations to extract key insights about the customer. Extract the following information from the conversation:
        1. Customer's buying timeline/urgency (if mentioned)
        2. Budget constraints or price sensitivity
        3. Specific vehicle preferences (style, features, etc.)
        4. Family situation or lifestyle needs
        5. Current vehicle situation (trade-in potential, issues with current vehicle)
        6. Financing needs or questions
        
        For each insight, provide a confidence score between 0 and 1 (1 being most confident).`
      },
      ...formattedHistory,
      {
        role: "user",
        content: "Analyze this conversation and provide customer insights as a JSON array of objects with 'key', 'value', and 'confidence' fields."
      }
    ],
    response_format: { type: "json_object" }
  });

  try {
    const insights = JSON.parse(response.choices[0].message.content || "{}");
    if (insights.insights && Array.isArray(insights.insights)) {
      return insights.insights;
    }
    return [];
  } catch (error) {
    console.error("Error parsing customer insights:", error);
    return [];
  }
}

/**
 * Analyzes conversation to identify vehicle interests
 */
async function analyzeVehicleInterests(conversationId: number, dealershipId: number): Promise<VehicleInterest[]> {
  // Get conversation history
  const messageHistory = await db.select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);

  if (!messageHistory.length) {
    return [];
  }

  // Get available inventory
  const inventory = await db.select()
    .from(vehicles)
    .where(eq(vehicles.dealershipId, dealershipId))
    .limit(50); // Limit to recent inventory

  // Format conversation history for OpenAI
  const formattedHistory = messageHistory.map(msg => ({
    role: msg.isFromCustomer ? 'user' : 'assistant',
    content: msg.content
  }));

  // Format inventory for OpenAI
  const formattedInventory = inventory.map(v => 
    `${v.year} ${v.make} ${v.model} ${v.trim || ''} (VIN: ${v.vin})`
  ).join('\n');

  // Use OpenAI to extract vehicle interests
  const response = await openai.chat.completions.create({
    model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    messages: [
      {
        role: "system",
        content: `You are an AI that analyzes conversations to extract customer vehicle interests. Based on the conversation, identify vehicles the customer has shown interest in. Compare their interests to the available inventory.
        
        Available inventory:
        ${formattedInventory}`
      },
      ...formattedHistory,
      {
        role: "user",
        content: "Analyze this conversation and provide vehicle interests as a JSON array of objects with 'make', 'model', 'year', 'trim', 'vin' (if matching a specific inventory item), and 'confidence' fields."
      }
    ],
    response_format: { type: "json_object" }
  });

  try {
    const interests = JSON.parse(response.choices[0].message.content || "{}");
    if (interests.vehicleInterests && Array.isArray(interests.vehicleInterests)) {
      return interests.vehicleInterests;
    }
    return [];
  } catch (error) {
    console.error("Error parsing vehicle interests:", error);
    return [];
  }
}

/**
 * Generates a conversation summary
 */
async function generateConversationSummary(conversationId: number): Promise<string> {
  // Get conversation history
  const messageHistory = await db.select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);

  if (!messageHistory.length) {
    return "No conversation history available";
  }

  // Format conversation history for OpenAI
  const formattedHistory = messageHistory.map(msg => ({
    role: msg.isFromCustomer ? 'user' : 'assistant',
    content: msg.content
  }));

  // Use OpenAI to generate summary
  const response = await openai.chat.completions.create({
    model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    messages: [
      {
        role: "system",
        content: "Summarize this customer conversation in 2-3 paragraphs, focusing on the customer's needs, interests, and why they need human assistance."
      },
      ...formattedHistory
    ],
    max_tokens: 300
  });

  return response.choices[0].message.content || "Unable to generate summary";
}

/**
 * Suggests an approach for the sales representative
 */
async function suggestApproach(conversationId: number, customerInsights: CustomerInsight[], vehicleInterests: VehicleInterest[]): Promise<string> {
  // Get conversation history
  const messageHistory = await db.select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);

  if (!messageHistory.length) {
    return "No conversation history available for approach suggestion";
  }

  // Format conversation history for OpenAI
  const formattedHistory = messageHistory.map(msg => ({
    role: msg.isFromCustomer ? 'user' : 'assistant',
    content: msg.content
  }));

  // Format insights for OpenAI
  const formattedInsights = customerInsights.map(i => 
    `${i.key}: ${i.value} (confidence: ${i.confidence})`
  ).join('\n');

  // Format vehicle interests for OpenAI
  const formattedVehicleInterests = vehicleInterests.map(v => 
    `${v.year || 'Unknown year'} ${v.make || 'Unknown make'} ${v.model || 'Unknown model'} ${v.trim || ''} (confidence: ${v.confidence})`
  ).join('\n');

  // Use OpenAI to suggest approach
  const response = await openai.chat.completions.create({
    model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    messages: [
      {
        role: "system",
        content: `You are an AI that helps salespeople prepare for customer interactions. Based on the conversation and insights, suggest a personalized approach for the sales representative to take with this customer.
        
        Customer Insights:
        ${formattedInsights}
        
        Vehicle Interests:
        ${formattedVehicleInterests}`
      },
      ...formattedHistory,
      {
        role: "user",
        content: "Suggest a personalized approach for the sales representative in 1-2 paragraphs."
      }
    ],
    max_tokens: 250
  });

  return response.choices[0].message.content || "Unable to suggest approach";
}

/**
 * Determines the urgency level for the handover
 */
async function determineUrgency(
  conversationId: number, 
  customerInsights: CustomerInsight[]
): Promise<'low' | 'medium' | 'high'> {
  // Check for explicit urgency indications in the insights
  const urgencyInsight = customerInsights.find(insight => 
    insight.key.toLowerCase().includes('urgency') || 
    insight.key.toLowerCase().includes('timeline')
  );

  if (urgencyInsight) {
    const value = urgencyInsight.value.toLowerCase();
    if (value.includes('immediate') || value.includes('urgent') || value.includes('asap') || 
        value.includes('today') || value.includes('tomorrow')) {
      return 'high';
    } else if (value.includes('week') || value.includes('soon')) {
      return 'medium';
    }
  }

  // Get conversation history
  const messageHistory = await db.select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);
  
  // Look for urgency indicators in customer messages
  const urgencyKeywords = {
    high: ['urgent', 'immediately', 'asap', 'today', 'emergency', 'right now'],
    medium: ['this week', 'soon', 'as soon as', 'quickly']
  };

  let highCount = 0;
  let mediumCount = 0;

  messageHistory.forEach(msg => {
    if (msg.isFromCustomer) {
      const content = msg.content.toLowerCase();
      urgencyKeywords.high.forEach(keyword => {
        if (content.includes(keyword)) highCount++;
      });
      urgencyKeywords.medium.forEach(keyword => {
        if (content.includes(keyword)) mediumCount++;
      });
    }
  });

  if (highCount > 0) return 'high';
  if (mediumCount > 0) return 'medium';
  return 'low';
}

/**
 * Prepares the full conversation history for the handover dossier
 */
async function prepareConversationHistory(conversationId: number): Promise<ConversationHistoryMessage[]> {
  const messageHistory = await db.select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);
  
  return messageHistory.map(msg => ({
    role: msg.isFromCustomer ? 'customer' : 'assistant',
    content: msg.content,
    timestamp: msg.createdAt
  }));
}

/**
 * Creates a handover dossier from a conversation
 */
export async function createHandoverDossier(input: HandoverDossierInput): Promise<HandoverDossier> {
  // Generate all components of the dossier
  const [
    customerInsights,
    vehicleInterests,
    conversationSummary,
    conversationHistory
  ] = await Promise.all([
    analyzeCustomerInsights(input.conversationId),
    analyzeVehicleInterests(input.conversationId, input.dealershipId),
    generateConversationSummary(input.conversationId),
    prepareConversationHistory(input.conversationId)
  ]);

  // Generate approach suggestion based on insights and interests
  const suggestedApproach = await suggestApproach(
    input.conversationId, 
    customerInsights, 
    vehicleInterests
  );

  // Determine urgency
  const urgency = await determineUrgency(input.conversationId, customerInsights);

  // Prepare the dossier data
  const dossierData: InsertHandoverDossier = {
    conversationId: input.conversationId,
    dealershipId: input.dealershipId,
    customerName: input.customerName,
    customerContact: input.customerContact || 'Not provided',
    conversationSummary,
    customerInsights,
    vehicleInterests,
    suggestedApproach,
    urgency,
    escalationReason: input.escalationReason,
    fullConversationHistory: conversationHistory,
    isEmailSent: false
  };
  
  // Insert into database
  const [dossier] = await db.insert(handoverDossiers)
    .values(dossierData)
    .returning();
  
  // Update conversation status
  await db.update(conversations)
    .set({ status: 'escalated' })
    .where(eq(conversations.id, input.conversationId));
  
  return dossier;
}

/**
 * Sends the handover dossier via email
 */
export async function sendHandoverDossierEmail(dossier: HandoverDossier): Promise<boolean> {
  // Get dealership information for the email
  const [dealership] = await db.select()
    .from(dealerships)
    .where(eq(dealerships.id, dossier.dealershipId));
  
  if (!dealership || !dealership.handoverEmail) {
    console.error('Missing dealership email for handover notification');
    return false;
  }

  // Format the email content
  const emailHtml = `
    <h1>Lead Handover Dossier</h1>
    <p><strong>Customer:</strong> ${dossier.customerName}</p>
    <p><strong>Contact:</strong> ${dossier.customerContact}</p>
    <p><strong>Urgency:</strong> ${dossier.urgency.toUpperCase()}</p>
    <p><strong>Escalation Reason:</strong> ${dossier.escalationReason}</p>
    
    <h2>Conversation Summary</h2>
    <p>${dossier.conversationSummary}</p>
    
    <h2>Suggested Approach</h2>
    <p>${dossier.suggestedApproach}</p>
    
    <h2>Customer Insights</h2>
    <ul>
      ${(dossier.customerInsights as CustomerInsight[]).map(insight => 
        `<li><strong>${insight.key}:</strong> ${insight.value} (Confidence: ${Math.round(insight.confidence * 100)}%)</li>`
      ).join('')}
    </ul>
    
    <h2>Vehicle Interests</h2>
    <ul>
      ${(dossier.vehicleInterests as VehicleInterest[]).map(vehicle => 
        `<li>${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''} ${vehicle.trim || ''} (Confidence: ${Math.round(vehicle.confidence * 100)}%)</li>`
      ).join('')}
    </ul>
    
    <h2>Conversation History</h2>
    ${(dossier.fullConversationHistory as ConversationHistoryMessage[]).map(msg => 
      `<div style="margin-bottom: 10px;">
        <p><strong>${msg.role === 'customer' ? 'Customer' : 'Rylie AI'}</strong> (${new Date(msg.timestamp).toLocaleString()}):</p>
        <p>${msg.content}</p>
      </div>`
    ).join('')}
  `;
  
  const emailText = `
    Lead Handover Dossier
    
    Customer: ${dossier.customerName}
    Contact: ${dossier.customerContact}
    Urgency: ${dossier.urgency.toUpperCase()}
    Escalation Reason: ${dossier.escalationReason}
    
    Conversation Summary:
    ${dossier.conversationSummary}
    
    Suggested Approach:
    ${dossier.suggestedApproach}
    
    Customer Insights:
    ${(dossier.customerInsights as CustomerInsight[]).map(insight => 
      `- ${insight.key}: ${insight.value} (Confidence: ${Math.round(insight.confidence * 100)}%)`
    ).join('\n')}
    
    Vehicle Interests:
    ${(dossier.vehicleInterests as VehicleInterest[]).map(vehicle => 
      `- ${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''} ${vehicle.trim || ''} (Confidence: ${Math.round(vehicle.confidence * 100)}%)`
    ).join('\n')}
    
    Conversation History:
    ${(dossier.fullConversationHistory as ConversationHistoryMessage[]).map(msg => 
      `${msg.role === 'customer' ? 'Customer' : 'Rylie AI'} (${new Date(msg.timestamp).toLocaleString()}):
      ${msg.content}`
    ).join('\n\n')}
  `;
  
  // Send the email
  try {
    const success = await sendEmail(process.env.SENDGRID_API_KEY, {
      to: dealership.handoverEmail,
      from: 'no-reply@rylieai.com',
      subject: `[URGENT: ${dossier.urgency.toUpperCase()}] Lead Handover: ${dossier.customerName}`,
      text: emailText,
      html: emailHtml
    });
    
    if (success) {
      // Update the dossier to mark email as sent
      await db.update(handoverDossiers)
        .set({ 
          isEmailSent: true,
          emailSentAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(handoverDossiers.id, dossier.id));
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error sending handover email:', error);
    return false;
  }
}

/**
 * Gets a handover dossier by conversation ID
 */
export async function getHandoverDossierByConversationId(conversationId: number): Promise<HandoverDossier | undefined> {
  const [dossier] = await db.select()
    .from(handoverDossiers)
    .where(eq(handoverDossiers.conversationId, conversationId))
    .orderBy(desc(handoverDossiers.createdAt))
    .limit(1);
  
  return dossier;
}

/**
 * Creates a handover dossier and sends it via email
 */
export async function createAndSendHandoverDossier(input: HandoverDossierInput): Promise<{
  dossier: HandoverDossier;
  emailSent: boolean;
}> {
  // Ensure we have a valid reason, default if not provided
  if (!input.escalationReason) {
    input.escalationReason = 'Handover requested by system';
  }
  
  try {
    const dossier = await createHandoverDossier(input);
    
    // Only attempt to send an email if we have a valid dossier
    let emailSent = false;
    if (dossier && dossier.id) {
      emailSent = await sendHandoverDossierEmail(dossier);
    }
    
    return {
      dossier,
      emailSent
    };
  } catch (error) {
    console.error('Error in handover process:', error);
    // If something fails, create a minimal dossier with the available information
    const fallbackDossier: any = {
      id: -1,
      conversationId: input.conversationId,
      dealershipId: input.dealershipId,
      customerName: input.customerName || 'Unknown',
      customerContact: input.customerContact || 'Not provided',
      conversationSummary: 'Error generating summary',
      customerInsights: [],
      vehicleInterests: [],
      suggestedApproach: 'Please review the conversation history',
      urgency: 'high',
      escalationReason: input.escalationReason,
      fullConversationHistory: [],
      isEmailSent: false
    };
    
    return {
      dossier: fallbackDossier,
      emailSent: false
    };
  }
}