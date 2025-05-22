import { 
  selectPromptVariant, 
  recordPromptMetrics, 
  getPromptMetricsByConversation, 
  updatePromptMetric,
  rateConversation
} from './abtest';
import { generateResponse, type ConversationContext, type PersonaArguments, type HandoverDossier } from './openai';
import { type Message, type Conversation } from '@shared/schema';
import { performance } from 'perf_hooks';

/**
 * Generate a response using the A/B testing framework to select prompt variants
 * This is the entry point for conversation responses that should be A/B tested
 */
export async function generateABTestedResponse(
  customerMessage: string,
  context: ConversationContext,
  basePersonaTemplate: string,
  personaArguments: PersonaArguments,
  dealershipId: number,
  conversation: Conversation,
  message: Message
): Promise<{ 
  response: string; 
  shouldEscalate: boolean; 
  reason?: string; 
  handoverDossier?: HandoverDossier;
  variantId?: number;
  responseTime?: number;
}> {
  try {
    // Start timing the response generation
    const startTime = performance.now();
    
    // Select a prompt variant to use based on active experiments
    const promptVariant = await selectPromptVariant({
      dealershipId,
      conversationId: conversation.id
    });
    
    // If no variant is found, use the base persona template
    const personaTemplate = promptVariant?.promptTemplate || basePersonaTemplate;
    
    // Generate the response using the selected variant
    const responseResult = await generateResponse(
      customerMessage,
      context,
      personaTemplate,
      personaArguments
    );
    
    // Calculate response time
    const responseTime = Math.round(performance.now() - startTime);
    
    // If we used a prompt variant, log the metrics
    if (promptVariant) {
      // Rough estimate of tokens used based on input/output length
      // In production, you would use the actual token count from the OpenAI response
      const tokensUsed = Math.round(
        (customerMessage.length + responseResult.response.length) / 4
      );
      
      // Track the metrics for this prompt variant
      await recordPromptMetrics(
        promptVariant.id,
        conversation.id,
        message.id,
        {
          responseTime,
          tokensUsed,
          customerMessageLength: customerMessage.length,
          assistantResponseLength: responseResult.response.length,
          wasEscalated: responseResult.shouldEscalate
        }
      );
    }
    
    return {
      ...responseResult,
      variantId: promptVariant?.id,
      responseTime
    };
  } catch (error) {
    console.error('Error generating A/B tested response:', error);
    
    // Fallback to the base persona template if there's an error
    const startTime = performance.now();
    const responseResult = await generateResponse(
      customerMessage,
      context,
      basePersonaTemplate,
      personaArguments
    );
    const responseTime = Math.round(performance.now() - startTime);
    
    return {
      ...responseResult,
      responseTime
    };
  }
}

/**
 * Update the success status of a prompt variant usage
 * This can be called after a conversation is completed to mark whether the variant was successful
 */
export async function updatePromptSuccessStatus(
  conversationId: number,
  wasSuccessful: boolean
): Promise<boolean> {
  try {
    // Rate the conversation with success/failure status
    return await rateConversation(conversationId, 0, wasSuccessful);
  } catch (error) {
    console.error('Error updating prompt success status:', error);
    return false;
  }
}

/**
 * Record a customer rating for a prompt variant
 */
export async function recordCustomerRating(
  conversationId: number,
  rating: number
): Promise<boolean> {
  try {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
    
    // Rate the conversation with a customer satisfaction score
    return await rateConversation(conversationId, rating, true);
  } catch (error) {
    console.error('Error recording customer rating:', error);
    return false;
  }
}