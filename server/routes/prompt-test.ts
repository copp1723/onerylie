import { Router, Request, Response } from 'express';
import { z } from 'zod';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { isAuthenticated } from '../replitAuth';

const router = Router();

// Initialize OpenAI client once (at module level)
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) 
  : null;

// Determine if we should use stub mode
const useStub = !process.env.OPENAI_API_KEY || process.env.PROMPT_TEST_USE_STUB === 'true';

/**
 * Generate a deterministic stub response based on the message content
 * with appropriate paragraph formatting
 */
function generateStubResponse(customerMessage: string, personaArguments: any) {
  let response = '';
  const customerMsg = customerMessage.toLowerCase();
  
  // Helper function to ensure proper paragraph spacing in responses
  const formatResponse = (text: string): string => {
    // Replace sentence-ending punctuation followed by space with punctuation + double newline
    return text.replace(/([.!?])\s+/g, '$1\n\n').trim();
  };
  
  // Check for trade-in related queries
  if (customerMsg.includes('trade-in') || customerMsg.includes('trade in') || customerMsg.includes('value') || 
      customerMsg.includes('worth') || customerMsg.includes('trade')) {
    // Extract vehicle info if present
    const vehicleMatches = customerMessage.match(/(?:my|a|the)\s+([a-zA-Z0-9\s]+?)(?:is|for|to|\?|$)/i);
    const vehicleName = vehicleMatches ? vehicleMatches[1].trim() : '';
    
    if (vehicleName) {
      response = `I can help with that! To find out the trade-in value of your ${vehicleName}, please use our trade-in valuation tool. You can access it here: ${personaArguments?.tradeInUrl || "our website"}.
      
This tool will guide you through the process and provide you with an estimate based on current market conditions. If you have any other questions, feel free to ask!`;
    } else {
      response = `I'd be happy to help you get an estimate for your current vehicle's trade-in value. Our online tool makes it easy to get a fair market assessment without any obligation.

You can start the process right away here: ${personaArguments?.tradeInUrl || "our website"}

Would you like to know anything specific about our trade-in process?`;
    }
  } 
  // Check for financing related queries
  else if (customerMsg.includes('financ') || customerMsg.includes('loan') || 
           customerMsg.includes('credit') || customerMsg.includes('payment') || 
           customerMsg.includes('money') || customerMsg.includes('afford')) {
    
    response = `We offer flexible financing options to fit your budget and credit situation. Our finance team works with multiple lenders to find the best rates for you.

You can start the pre-approval process online here: ${personaArguments?.financeApplicationUrl || "our finance page"}

This only takes a few minutes and doesn't impact your credit score. Would you like to know more about our current finance specials?`;
  }
  // General inventory question
  else if (customerMsg.includes('inventory') || customerMsg.includes('available') || 
           customerMsg.includes('have') || customerMsg.includes('looking for')) {
    
    response = `We have a great selection of vehicles in our inventory right now! Are you looking for something specific like an SUV, sedan, or truck? I'd be happy to help you find the perfect match for your needs.

You can also browse our full inventory on our website, or I can answer any questions about specific models you're interested in.`;
  }
  // Default friendly response
  else {
    response = `Thanks for reaching out to ${personaArguments?.dealershipName || "us"}! I'm here to help with any questions about our inventory, financing options, or scheduling a test drive.

Our team at ${personaArguments?.dealershipName || "our dealership"} is committed to making your car-buying experience as smooth as possible. How can I assist you today?`;
  }
  
  return {
    response: formatResponse(response),
    shouldEscalate: false,
    reason: null,
    responseTime: 50 // fake response time
  };
}

// Schema for prompt test request validation
const promptTestSchema = z.object({
  customerMessage: z.string().min(1, "Customer message is required"),
  promptTemplate: z.string().min(1, "Prompt template is required"),
  personaArguments: z.object({
    dealerName: z.string().optional(),
    dealershipName: z.string().optional(),
    website: z.string().optional(),
    location: z.string().optional(),
    phoneNumber: z.string().optional(),
    specialties: z.array(z.string()).optional(),
    workingHours: z.string().optional(),
    salesEmail: z.string().optional(),
    handoverEmail: z.string().optional(),
    financeApplicationUrl: z.string().optional(),
    tradeInUrl: z.string().optional(),
    customInstructions: z.string().optional(),
    constraints: z.string().optional(),
  }).optional(),
  previousMessages: z.array(
    z.object({
      role: z.enum(["customer", "assistant"]),
      content: z.string()
    })
  ).optional()
});

router.post('/', isAuthenticated, async (req: Request, res: Response) => {
  try {
    // Validate request body
    const validationResult = promptTestSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: "Invalid request body", 
        errors: validationResult.error.format() 
      });
    }

    const { customerMessage, promptTemplate, personaArguments, previousMessages = [] } = validationResult.data;

    // Process the prompt template by replacing placeholders with values
    let processedPrompt = promptTemplate;
    if (personaArguments) {
      Object.entries(personaArguments).forEach(([key, value]) => {
        if (typeof value === 'string') {
          processedPrompt = processedPrompt.replace(
            new RegExp(`{{${key}}}`, 'g'), 
            value
          );
        } else if (Array.isArray(value)) {
          processedPrompt = processedPrompt.replace(
            new RegExp(`{{${key}}}`, 'g'), 
            value.join(', ')
          );
        }
      });
    }
    
    // Build augmented prompt with URLs if present
    if (personaArguments?.tradeInUrl) {
      processedPrompt += `\n\nTRADE-IN URL: ${personaArguments.tradeInUrl}`;
    }
    
    if (personaArguments?.financeApplicationUrl) {
      processedPrompt += `\n\nFINANCE APPLICATION URL: ${personaArguments.financeApplicationUrl}`;
    }
    
    // Add formatting instructions to ensure consistent paragraph breaks
    processedPrompt += `\n\nFORMATTING: Format replies in short paragraphs, using two newline characters (\\n\\n) between paragraphs.`;

    // Start timing
    const startTime = Date.now();
    
    let result;
    
    // Check if we should use stub mode
    if (useStub) {
      // Use stub mode (deterministic responses)
      result = generateStubResponse(customerMessage, personaArguments);
    } else if (openai) {
      try {
        // Use real OpenAI
        // Build a properly typed array of ChatCompletionMessageParam
        const messages: ChatCompletionMessageParam[] = [
          { role: "system", content: processedPrompt },
          ...previousMessages.map(msg => ({
            role: msg.role === "customer" ? "user" : "assistant",
            content: msg.content
          } as ChatCompletionMessageParam)),
          { role: "user", content: customerMessage }
        ];
        
        const completion = await openai.chat.completions.create({
          model: "gpt-4o", 
          messages,
          temperature: 0.7,
          max_tokens: 1000,
          response_format: { type: "json_object" }
        });
        
        // Get the JSON response and parse it
        let responseContent = completion.choices[0].message.content || "{}";
        let jsonResponse;
        
        try {
          jsonResponse = JSON.parse(responseContent);
          
          // Extract the main text answer from our JSON format
          let textResponse = jsonResponse.answer || "I apologize, but I couldn't generate a response.";
          
          // Post-process to ensure proper paragraph spacing
          // This replaces sentence ending punctuation followed by space with punctuation + double newline
          textResponse = textResponse.replace(/([.!?])\s+/g, '$1\n\n');
          
          // Determine if we should escalate based on JSON data
          const shouldEscalate = 
            (jsonResponse.sales_readiness === "high") || 
            (jsonResponse.retrieve_inventory_data === true);
          
          result = {
            response: textResponse,
            jsonResponse: jsonResponse, // Include the full JSON for debugging
            shouldEscalate: shouldEscalate,
            channelType: jsonResponse.type || "unknown", // Email or SMS
            reason: shouldEscalate ? "Customer shows high sales readiness or needs inventory data" : null,
            responseTime: Date.now() - startTime
          };
        } catch (jsonError) {
          console.error("Error parsing JSON response:", jsonError);
          
          // Fallback to using the raw content if JSON parsing fails
          responseContent = responseContent.replace(/([.!?])\s+/g, '$1\n\n');
          
          result = {
            response: responseContent,
            shouldEscalate: false,
            reason: "Failed to parse JSON response",
            responseTime: Date.now() - startTime
          };
        }
      } catch (aiError) {
        console.error("OpenAI API error:", aiError);
        // Fallback to stub on API error
        result = {
          response: "I apologize, but I'm having trouble connecting to our systems right now. Let me connect you with a human representative who can assist you.",
          shouldEscalate: true,
          reason: "OpenAI API error",
          responseTime: Date.now() - startTime
        };
      }
    } else {
      // OpenAI client wasn't initialized (missing API key)
      result = {
        response: "I apologize, but our AI systems are currently unavailable. Please try again later or contact support.",
        shouldEscalate: true,
        reason: "OpenAI client not initialized",
        responseTime: Date.now() - startTime
      };
    }

    // Return the response
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in prompt test:", error);
    return res.status(500).json({ message: "Server error processing prompt test" });
  }
});

export default router;