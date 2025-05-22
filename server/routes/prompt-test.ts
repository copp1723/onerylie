import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { generateResponse } from '../services/openai';

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
    customInstructions: z.string().optional(),
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
    
    // Set up context for AI response
    const context = {
      systemPrompt: processedPrompt,
      dealershipId: 0, // Using 0 for testing purposes
      customerId: 0, // Using 0 for testing purposes
      userInfo: {
        name: 'Test Customer',
        contactInfo: 'test@example.com'
      },
      messageHistory: previousMessages,
      vehicles: [] // No specific vehicles in this test
    };

    // Generate AI response
    const startTime = Date.now();
    const aiResponse = await generateResponse(customerMessage, context);
    const responseTime = Date.now() - startTime;

    // Return the response
    return res.status(200).json({
      response: aiResponse.response,
      shouldEscalate: aiResponse.shouldEscalate,
      escalationReason: aiResponse.reason,
      responseTime,
      handoverDossier: aiResponse.handoverDossier
    });
  } catch (error) {
    console.error("Error in prompt test:", error);
    return res.status(500).json({ message: "Server error processing prompt test" });
  }
});

export default router;