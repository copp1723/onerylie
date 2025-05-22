
import { Router } from 'express';
import { apiKeyAuth, type AuthenticatedRequest } from '../middleware/auth';
import { storage } from '../storage';
import { z } from 'zod';

const router = Router();

// Validation schema for inbound messages
const inboundMessageSchema = z.object({
  dealerId: z.string(),
  customerName: z.string(),
  customerPhone: z.string(),
  customerEmail: z.string().optional(),
  customerId: z.string().optional(),
  message: z.string(),
  conversationId: z.string().optional(),
  campaignContext: z.string().optional(),
  inventoryContext: z.string().optional(),
  channel: z.string().default('sms')
});

// Handle inbound messages
router.post('/inbound', apiKeyAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const data = inboundMessageSchema.parse(req.body);
    
    // Get dealer's default persona
    const persona = await storage.getDefaultPersonaForDealership(req.dealershipId!);
    if (!persona) {
      return res.status(404).json({ message: 'No default persona configured for this dealership' });
    }

    // Process message and generate response
    const response = await storage.processInboundMessage({
      ...data,
      dealershipId: req.dealershipId!,
      persona: persona
    });

    return res.json(response);
  } catch (error) {
    console.error('Error processing inbound message:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid request data', errors: error.errors });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Handle conversation replies
router.post('/reply', apiKeyAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { conversationId, message, channel = 'sms' } = req.body;

    if (!conversationId || !message) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const response = await storage.processReply({
      dealershipId: req.dealershipId!,
      conversationId,
      message,
      channel
    });

    return res.json(response);
  } catch (error) {
    console.error('Error processing reply:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
