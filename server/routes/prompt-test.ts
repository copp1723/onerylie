import { Router } from 'express';
import OpenAI from 'openai';
import { z } from 'zod';

// Create a router
const router = Router();

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Input validation schema
const promptTestSchema = z.object({
  customerMessage: z.string().min(1, "Customer message is required"),
  systemPrompt: z.string().min(1, "System prompt is required"),
});

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

    const { customerMessage, systemPrompt } = validation.data;

    // Call OpenAI with the provided system prompt and customer message
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: customerMessage
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    // Extract the response text
    const response = completion.choices[0]?.message?.content || "No response generated";

    // Return the response
    return res.json({ 
      response,
      usage: completion.usage
    });
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

export default router;