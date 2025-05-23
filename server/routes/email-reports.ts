import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { apiKeyAuth, type AuthenticatedRequest } from '../middleware/auth';
import { storage } from '../storage';
import { 
  scheduleEmailReport, 
  removeScheduledReport, 
  getScheduledReports,
  type EmailScheduleSettings 
} from '../services/scheduler';
import { sendConversationSummary } from '../services/conversation-summary';

const router = Router();

// Schema for creating a new email schedule
const createScheduleSchema = z.object({
  recipientEmails: z.array(z.string().email()),
  frequency: z.enum(['daily', 'weekly']),
  dayOfWeek: z.number().min(0).max(6).optional(),
  timeOfDay: z.string().regex(/^([0-1][0-9]|2[0-3]):([0-5][0-9])$/),
  includeStatus: z.array(z.enum(['active', 'waiting', 'escalated', 'completed'])),
});

// Create a new scheduled report
router.post('/:dealershipId/reports/schedule', apiKeyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dealershipId = parseInt(req.params.dealershipId);
    
    // Verify the dealership exists and the API key has access
    if (req.dealershipId !== dealershipId) {
      return res.status(403).json({ message: 'Not authorized to access this dealership' });
    }
    
    const dealership = await storage.getDealership(dealershipId);
    if (!dealership) {
      return res.status(404).json({ message: 'Dealership not found' });
    }
    
    // Validate the schedule settings
    const scheduleSettings = createScheduleSchema.parse(req.body);
    
    // If frequency is weekly, require dayOfWeek
    if (scheduleSettings.frequency === 'weekly' && scheduleSettings.dayOfWeek === undefined) {
      return res.status(400).json({ 
        message: 'Day of week is required for weekly schedules' 
      });
    }
    
    // Create the schedule
    const scheduleId = scheduleEmailReport({
      ...scheduleSettings,
      dealershipId,
      reportType: 'conversation_summary',
      enabled: true
    });
    
    return res.status(201).json({
      id: scheduleId,
      dealershipId,
      ...scheduleSettings
    });
    
  } catch (error) {
    console.error('Error creating email schedule:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid schedule settings', errors: error.errors });
    }
    return res.status(500).json({ message: 'Server error creating email schedule' });
  }
});

// Get all scheduled reports for a dealership
router.get('/:dealershipId/reports/schedule', apiKeyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dealershipId = parseInt(req.params.dealershipId);
    
    // Verify the dealership exists and the API key has access
    if (req.dealershipId !== dealershipId) {
      return res.status(403).json({ message: 'Not authorized to access this dealership' });
    }
    
    // Get scheduled reports
    const reports = getScheduledReports(dealershipId);
    
    return res.json(reports);
    
  } catch (error) {
    console.error('Error fetching scheduled reports:', error);
    return res.status(500).json({ message: 'Server error fetching scheduled reports' });
  }
});

// Delete a scheduled report
router.delete('/:dealershipId/reports/schedule/:scheduleId', apiKeyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dealershipId = parseInt(req.params.dealershipId);
    const scheduleId = parseInt(req.params.scheduleId);
    
    // Verify the dealership exists and the API key has access
    if (req.dealershipId !== dealershipId) {
      return res.status(403).json({ message: 'Not authorized to access this dealership' });
    }
    
    // Remove the schedule
    const removed = removeScheduledReport(dealershipId, scheduleId);
    
    if (!removed) {
      return res.status(404).json({ message: 'Schedule not found' });
    }
    
    return res.json({ success: true });
    
  } catch (error) {
    console.error('Error deleting scheduled report:', error);
    return res.status(500).json({ message: 'Server error deleting scheduled report' });
  }
});

// Generate and send a report on demand
router.post('/:dealershipId/reports/generate', apiKeyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dealershipId = parseInt(req.params.dealershipId);
    
    // Verify the dealership exists and the API key has access
    if (req.dealershipId !== dealershipId) {
      return res.status(403).json({ message: 'Not authorized to access this dealership' });
    }
    
    const dealership = await storage.getDealership(dealershipId);
    if (!dealership) {
      return res.status(404).json({ message: 'Dealership not found' });
    }
    
    // Validate request
    const { email, days, status } = z.object({
      email: z.string().email(),
      days: z.number().min(1).max(30).default(1),
      status: z.array(z.enum(['active', 'waiting', 'escalated', 'completed'])).default(['active', 'escalated']),
    }).parse(req.body);
    
    // Get conversations updated in the last N days
    const since = new Date();
    since.setDate(since.getDate() - days);
    
    // Get all conversations for this dealership
    const conversations = await storage.getConversationsByDealership(dealershipId);
    
    // Filter based on status and update date
    const filteredConversations = conversations.filter(conv => 
      status.includes(conv.status) && 
      new Date(conv.updatedAt) > since
    );
    
    if (filteredConversations.length === 0) {
      return res.json({ 
        message: 'No conversations match the criteria', 
        count: 0 
      });
    }
    
    // Send individual email for each conversation
    let successCount = 0;
    
    for (const conversation of filteredConversations) {
      try {
        const messages = await storage.getMessagesByConversation(conversation.id);
        
        // Send the email
        const success = await sendConversationSummary({
          toEmail: email,
          fromEmail: `rylie@${dealership.domain || 'rylie-ai.com'}`,
          conversation,
          messages,
          dealershipName: dealership.name
        });
        
        if (success) {
          successCount++;
        }
      } catch (error) {
        console.error(`Error sending summary for conversation ${conversation.id}:`, error);
      }
    }
    
    return res.json({ 
      message: `Sent ${successCount} of ${filteredConversations.length} conversation summaries to ${email}`,
      count: successCount,
      total: filteredConversations.length
    });
    
  } catch (error) {
    console.error('Error generating report:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid report settings', errors: error.errors });
    }
    return res.status(500).json({ message: 'Server error generating report' });
  }
});

export default router;