import { Router, Request, Response } from 'express';
import { z } from 'zod';
import OpenAI from 'openai';

const router = Router();

// Initialize OpenAI client once (at module level)
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) 
  : null;

// Determine if we should use stub mode
const useStub = !process.env.OPENAI_API_KEY || process.env.PROMPT_TEST_USE_STUB === 'true';

/**
 * Generate a deterministic stub response based on the message content
 */
function generateStubResponse(customerMessage: string, personaArguments: any) {
  let response = '';
  
  if (customerMessage.toLowerCase().includes('trade-in') || customerMessage.toLowerCase().includes('trade in')) {
    response = "We have a great trade-in program! I'd be happy to help you get an estimate for your current vehicle. You can start the process online through our trade-in valuation tool. Would you like me to send you the link?";
    
    if (personaArguments?.tradeInUrl) {
      response += `\n\nHere's our trade-in valuation tool: ${personaArguments.tradeInUrl}`;
    }
  } 
  else if (customerMessage.toLowerCase().includes('financ') || customerMessage.toLowerCase().includes('loan')) {
    response = "Our financing department offers competitive rates and flexible terms to fit your budget. You can start the pre-approval process online to save time at the dealership.";
    
    if (personaArguments?.financeApplicationUrl) {
      response += `\n\nHere's our finance application: ${personaArguments.financeApplicationUrl}`;
    }
  }
  else {
    response = "Thank you for reaching out to us! I'm here to help with any questions you might have about our inventory, financing options, or scheduling a test drive. How can I assist you today?";
  }
  
  return {
    response,
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

router.post('/', async (req: Request, res: Response) => {
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
        const messages = [
          { role: "system", content: processedPrompt },
          ...previousMessages.map(msg => ({
            role: msg.role === "customer" ? "user" : "assistant",
            content: msg.content
          })),
          { role: "user", content: customerMessage }
        ];
        
        const completion = await openai.chat.completions.create({
          model: "gpt-4o", 
          messages,
          temperature: 0.7,
          max_tokens: 1000,
        });
        
        result = {
          response: completion.choices[0].message.content || "I apologize, but I couldn't generate a response.",
          shouldEscalate: false,
          reason: null,
          responseTime: Date.now() - startTime
        };
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