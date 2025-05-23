import { storage } from "../storage";
import { sendConversationSummary } from "./email";

// Interface for email schedule settings
export interface EmailScheduleSettings {
  dealershipId: number;
  recipientEmails: string[];
  frequency: 'daily' | 'weekly';
  dayOfWeek?: number; // 0-6 (Sunday-Saturday) for weekly reports
  timeOfDay: string; // HH:MM format in 24-hour time
  includeStatus: ('active' | 'waiting' | 'escalated' | 'completed')[];
  lastSent?: Date;
}

// In-memory store for scheduled reports
// In a production environment, this would be stored in the database
const scheduledReports: Map<number, EmailScheduleSettings[]> = new Map();

/**
 * Add or update a scheduled email report
 */
export function scheduleEmailReport(settings: EmailScheduleSettings): number {
  const dealershipId = settings.dealershipId;
  
  // Get existing schedules for this dealership
  const existingSchedules = scheduledReports.get(dealershipId) || [];
  
  // Generate a unique ID for this schedule
  const scheduleId = Date.now();
  
  // Add the new schedule
  existingSchedules.push({
    ...settings,
    lastSent: undefined
  });
  
  // Update the map
  scheduledReports.set(dealershipId, existingSchedules);
  
  return scheduleId;
}

/**
 * Remove a scheduled email report
 */
export function removeScheduledReport(dealershipId: number, scheduleId: number): boolean {
  const existingSchedules = scheduledReports.get(dealershipId);
  if (!existingSchedules) {
    return false;
  }
  
  const index = existingSchedules.findIndex(s => s.dealershipId === dealershipId);
  if (index === -1) {
    return false;
  }
  
  existingSchedules.splice(index, 1);
  scheduledReports.set(dealershipId, existingSchedules);
  
  return true;
}

/**
 * Get all scheduled reports for a dealership
 */
export function getScheduledReports(dealershipId: number): EmailScheduleSettings[] {
  return scheduledReports.get(dealershipId) || [];
}

/**
 * Check if any reports are due to be sent and send them
 * This function would be called by a cron job or scheduler in a production environment
 */
import { queueReportGeneration } from './queue';

export async function processScheduledReports(): Promise<void> {
  // Queue report generation instead of processing directly
  await queueReportGeneration(settings);
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentDay = now.getDay(); // 0-6 (Sunday-Saturday)
  
  // Iterate through all scheduled reports
  for (const [dealershipId, schedules] of scheduledReports.entries()) {
    for (const schedule of schedules) {
      // Parse the time of day
      const [hour, minute] = schedule.timeOfDay.split(':').map(n => parseInt(n));
      
      // Check if this report should be sent now
      const shouldSendDaily = schedule.frequency === 'daily' && 
        currentHour === hour && 
        currentMinute === minute;
      
      const shouldSendWeekly = schedule.frequency === 'weekly' && 
        currentDay === schedule.dayOfWeek && 
        currentHour === hour && 
        currentMinute === minute;
      
      if (shouldSendDaily || shouldSendWeekly) {
        try {
          await sendDealershipReport(dealershipId, schedule);
          
          // Update last sent time
          schedule.lastSent = new Date();
        } catch (error) {
          console.error(`Error sending scheduled report for dealership ${dealershipId}:`, error);
        }
      }
    }
  }
}

/**
 * Send a dealership report based on the schedule settings
 */
async function sendDealershipReport(dealershipId: number, settings: EmailScheduleSettings): Promise<void> {
  try {
    // Get dealership info
    const dealership = await storage.getDealership(dealershipId);
    if (!dealership) {
      throw new Error(`Dealership ${dealershipId} not found`);
    }
    
    // Get conversations since the last report
    const since = settings.lastSent || new Date(Date.now() - 24 * 60 * 60 * 1000); // Default to last 24 hours
    
    // Get conversations for this dealership with the specified statuses
    const conversations = await storage.getConversationsByDealership(dealershipId);
    const filteredConversations = conversations.filter(conv => 
      settings.includeStatus.includes(conv.status) && 
      new Date(conv.updatedAt) > since
    );
    
    if (filteredConversations.length === 0) {
      console.log(`No new conversations to report for dealership ${dealershipId}`);
      return;
    }
    
    // Generate email report for each recipient
    for (const recipientEmail of settings.recipientEmails) {
      // Create a report summary
      const reportDate = new Date().toLocaleDateString();
      const fromDate = since.toLocaleDateString();
      const reportSubject = `${dealership.name} Conversation Report - ${reportDate}`;
      
      // Send individual conversation summaries
      for (const conversation of filteredConversations) {
        const messages = await storage.getMessagesByConversation(conversation.id);
        
        await sendConversationSummary({
          toEmail: recipientEmail,
          fromEmail: `rylie@${dealership.domain || 'rylie-ai.com'}`,
          conversation,
          messages,
          dealershipName: dealership.name
        });
      }
      
      console.log(`Sent conversation reports to ${recipientEmail} for dealership ${dealershipId}`);
    }
  } catch (error) {
    console.error(`Error sending dealership report for ${dealershipId}:`, error);
    throw error;
  }
}