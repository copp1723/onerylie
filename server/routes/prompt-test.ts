import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { generateResponse } from '../services/openai';
import OpenAI from 'openai';

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
    
    // Set up context for AI response
    const context = {
      systemPrompt: processedPrompt,
      customerName: 'Test Customer',
      dealershipName: personaArguments?.dealershipName || 'Test Dealership',
      previousMessages: previousMessages || [],
      relevantVehicles: [], // No specific vehicles in this test
      personaArguments: personaArguments || {} // Pass persona arguments to the OpenAI service
    };

    // Generate AI response directly for prompt testing
    const startTime = Date.now();
    let aiResponse;
    
    try {
      // Create a simplified version of what we need here to avoid complex dependencies
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
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
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
      });
      
      aiResponse = {
        response: completion.choices[0].message.content || "I apologize, but I couldn't generate a response.",
        shouldEscalate: false
      };
    } catch (error) {
      console.error("Error generating response:", error);
      aiResponse = {
        response: "I apologize, but I'm having trouble processing your request right now. Let me connect you with a human representative who can assist you.",
        shouldEscalate: true,
        reason: "LLM processing error"
      };
    }
    
    const responseTime = Date.now() - startTime;

    // Return the response
    return res.status(200).json({
      response: aiResponse.response,
      shouldEscalate: aiResponse.shouldEscalate,
      reason: aiResponse.reason || null,
      responseTime
    });
  } catch (error) {
    console.error("Error in prompt test:", error);
    return res.status(500).json({ message: "Server error processing prompt test" });
  }
});

export default router;