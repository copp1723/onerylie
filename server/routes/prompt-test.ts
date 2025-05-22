import { Router, Request, Response } from 'express';
import { z } from 'zod';

const router = Router();

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
    
    // Built augmented prompt with URLs if present
    if (personaArguments?.tradeInUrl) {
      processedPrompt += `\n\nTRADE-IN URL: ${personaArguments.tradeInUrl}`;
    }
    
    if (personaArguments?.financeApplicationUrl) {
      processedPrompt += `\n\nFINANCE APPLICATION URL: ${personaArguments.financeApplicationUrl}`;
    }

    // Set up mock response - this is temporary for testing
    const startTime = Date.now();
    
    // Simulate AI response based on customer message type
    let response;
    if (customerMessage.toLowerCase().includes('trade')) {
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
    
    const responseTime = Date.now() - startTime;

    // Return the response
    return res.status(200).json({
      response: response,
      shouldEscalate: false,
      reason: null,
      responseTime
    });
  } catch (error) {
    console.error("Error in prompt test:", error);
    return res.status(500).json({ message: "Server error processing prompt test" });
  }
});

export default router;