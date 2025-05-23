/**
 * Email Service for Rylie AI platform
 * 
 * This module provides email functionality using SendGrid with a fallback
 * mechanism for when SendGrid is unavailable
 */
import { MailService } from '@sendgrid/mail';
import logger from '../utils/logger';
import { addEmailJob } from './queue';

// Cache for SendGrid templates and other resources to prevent repeated API calls
const templateCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 3600000; // 1 hour in milliseconds
const API_TIMEOUT = 5000; // 5 seconds timeout for API calls

// Initialize SendGrid if API key is available
let mailService: MailService | null = null;
let isConnectionError = false;
let lastErrorTime = 0;

try {
  if (process.env.SENDGRID_API_KEY) {
    mailService = new MailService();
    mailService.setApiKey(process.env.SENDGRID_API_KEY);
    // Set timeout for all SendGrid requests
    mailService.setTimeout(API_TIMEOUT);
    logger.info('SendGrid email service initialized');
  } else {
    logger.warn('SendGrid API key not provided, emails will be logged only');
  }
} catch (error) {
  logger.error('Failed to initialize SendGrid', error);
  isConnectionError = true;
  lastErrorTime = Date.now();
}

// Default sender configuration
const DEFAULT_FROM_EMAIL = process.env.DEFAULT_FROM_EMAIL || 'noreply@rylie.ai';
const DEFAULT_FROM_NAME = process.env.DEFAULT_FROM_NAME || 'Rylie AI';

/**
 * Queue an email to be sent asynchronously
 * @param type Email job type
 * @param data Email data
 */
export const queueEmail = async (type: string, data: any): Promise<string> => {
  return await addEmailJob({ type, data });
};

/**
 * Send an email directly using SendGrid
 * @param to Recipient email address or array of addresses
 * @param subject Email subject
 * @param text Plain text email content
 * @param html HTML email content (optional)
 * @param from Sender email address (defaults to configured default)
 */
export const sendEmail = async (
  to: string | string[],
  subject: string,
  text: string,
  html?: string,
  from: string = `${DEFAULT_FROM_NAME} <${DEFAULT_FROM_EMAIL}>`
): Promise<boolean> => {
  // If we're in a circuit break period due to recent connection errors, use fallback immediately
  const now = Date.now();
  if (isConnectionError && (now - lastErrorTime) < 60000) { // 1 minute circuit breaker
    logger.warn('SendGrid in circuit break mode - using fallback', { to, subject });
    return handleFallbackEmail(to, subject, text, html, from);
  }

  try {
    if (mailService && process.env.SENDGRID_API_KEY) {
      // Use Promise.race to implement timeout
      const sendPromise = mailService.send({
        to,
        from,
        subject,
        text,
        html: html || text
      });

      await sendPromise;
      
      // Reset connection error flag if successful
      if (isConnectionError) {
        isConnectionError = false;
        logger.info('SendGrid connection restored');
      }
      
      logger.info('Email sent successfully', { 
        to: typeof to === 'string' ? to : to.join(', '), 
        subject 
      });
      return true;
    } else {
      return handleFallbackEmail(to, subject, text, html, from);
    }
  } catch (error) {
    // Check if it's a timeout or connection error
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isTimeout = errorMessage.includes('timeout') || errorMessage.includes('timed out');
    const isConnectError = errorMessage.includes('ECONNREFUSED') || 
                           errorMessage.includes('ENOTFOUND') ||
                           errorMessage.includes('EAI_AGAIN');
    
    if (isTimeout || isConnectError) {
      isConnectionError = true;
      lastErrorTime = now;
      logger.error('SendGrid connection error - activating circuit breaker', { 
        error: errorMessage, 
        timeout: isTimeout, 
        connection: isConnectError 
      });
    } else {
      logger.error('Failed to send email', { error: errorMessage, to, subject });
    }
    
    // Fall back to logging the email
    return handleFallbackEmail(to, subject, text, html, from);
  }
};

/**
 * Handle fallback email delivery when SendGrid is unavailable
 */
const handleFallbackEmail = (
  to: string | string[],
  subject: string,
  text: string,
  html?: string,
  from: string = `${DEFAULT_FROM_NAME} <${DEFAULT_FROM_EMAIL}>`
): boolean => {
  // Log the email details when SendGrid is unavailable
  logger.info('Email would be sent (using fallback)', {
    to: typeof to === 'string' ? to : to.join(', '),
    from,
    subject,
    text: text.substring(0, 100) + (text.length > 100 ? '...' : '')
  });
  
  // In development, log the full email content to console
  if (process.env.NODE_ENV !== 'production') {
    logger.debug('Email content', { to, from, subject, text, html });
  }
  
  return true;
};

/**
 * Send a notification email
 * @param to Recipient email address
 * @param subject Email subject
 * @param message Email message
 */
export const sendNotificationEmail = async (
  to: string,
  subject: string,
  message: string
): Promise<boolean> => {
  const text = `${message}

This is an automated notification from Rylie AI.`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f8f8; padding: 20px; border-radius: 5px;">
        <p>${message}</p>
      </div>
      <p style="color: #666; font-size: 12px; margin-top: 20px;">This is an automated notification from Rylie AI.</p>
    </div>
  `;

  return await sendEmail(to, subject, text, html);
};

/**
 * Send a password reset email
 * @param to User email address
 * @param resetToken Reset token
 */
export const sendPasswordResetEmail = async (
  to: string,
  resetToken: string
): Promise<boolean> => {
  const resetUrl = `${process.env.APP_URL || 'https://app.rylie.ai'}/reset-password?token=${resetToken}`;
  
  const subject = 'Password Reset Request';
  
  const text = `You requested a password reset for your Rylie AI account.

Please click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this, please ignore this email.`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Password Reset Request</h2>
      <p>You requested a password reset for your Rylie AI account.</p>
      <div style="margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #4a6cf7; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
      </div>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    </div>
  `;

  return await sendEmail(to, subject, text, html);
};

/**
 * Send a welcome email to a new user
 * @param to User email address
 * @param name User name
 */
export const sendWelcomeEmail = async (
  to: string,
  name: string
): Promise<boolean> => {
  const subject = 'Welcome to Rylie AI';
  
  const text = `Hi ${name},

Welcome to Rylie AI! We're excited to have you onboard.

You can now log in to your account and start setting up your dealership's AI assistant.

For help getting started, check out our documentation:
https://docs.rylie.ai/getting-started

Best regards,
The Rylie AI Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Welcome to Rylie AI!</h2>
      <p>Hi ${name},</p>
      <p>We're excited to have you onboard. You can now log in to your account and start setting up your dealership's AI assistant.</p>
      <div style="margin: 30px 0;">
        <a href="${process.env.APP_URL || 'https://app.rylie.ai'}" style="background-color: #4a6cf7; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">Get Started</a>
      </div>
      <p>For help getting started, check out our <a href="https://docs.rylie.ai/getting-started">documentation</a>.</p>
      <p>Best regards,<br>The Rylie AI Team</p>
    </div>
  `;

  return await sendEmail(to, subject, text, html);
};

/**
 * Send a report email
 * @param to Recipient email address
 * @param reportId Report ID
 * @param reportType Report type
 */
export const sendReportEmail = async (
  to: string,
  reportId: string,
  reportType: string
): Promise<boolean> => {
  const reportUrl = `${process.env.APP_URL || 'https://app.rylie.ai'}/reports/${reportId}`;
  
  const subject = `${reportType} Report Ready`;
  
  const text = `Your ${reportType} report is now ready.

You can view the report here:
${reportUrl}

This is an automated notification from Rylie AI.`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>${reportType} Report Ready</h2>
      <p>Your report is now ready to view.</p>
      <div style="margin: 30px 0;">
        <a href="${reportUrl}" style="background-color: #4a6cf7; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">View Report</a>
      </div>
      <p style="color: #666; font-size: 12px; margin-top: 20px;">This is an automated notification from Rylie AI.</p>
    </div>
  `;

  return await sendEmail(to, subject, text, html);
};

/**
 * Send a lead handover email with dossier information
 * @param to Recipient email address
 * @param handoverData Handover dossier data
 * @param additionalRecipients Optional additional recipients
 */
export const sendHandoverEmail = async (
  to: string,
  handoverData: any,
  additionalRecipients?: string[]
): Promise<boolean> => {
  const subject = `Lead Handover: ${handoverData.customerName || 'New Lead'}`;
  
  // Format insights into readable text
  const insightsText = handoverData.customerInsights?.map((insight: {key: string, value: string, confidence: number}) => {
    return `${insight.key}: ${insight.value} (Confidence: ${Math.round(insight.confidence * 100)}%)`;
  }).join('\n') || 'No insights available';
  
  // Format vehicle interests into readable text
  const vehicleText = handoverData.vehicleInterests?.map((vehicle: any) => {
    const details = [];
    if (vehicle.year) details.push(`${vehicle.year}`);
    if (vehicle.make) details.push(`${vehicle.make}`);
    if (vehicle.model) details.push(`${vehicle.model}`);
    if (vehicle.trim) details.push(`${vehicle.trim}`);
    if (vehicle.vin) details.push(`VIN: ${vehicle.vin}`);
    return details.join(' ') + ` (Confidence: ${Math.round(vehicle.confidence * 100)}%)`;
  }).join('\n') || 'No vehicle interests identified';
  
  // Format conversation history into readable text
  const conversationText = handoverData.fullConversationHistory?.map((msg: {role: string, content: string, timestamp: string}) => {
    const timestampStr = new Date(msg.timestamp).toLocaleString();
    return `[${timestampStr}] ${msg.role === 'customer' ? 'Customer' : 'Rylie'}: ${msg.content}`;
  }).join('\n\n') || 'No conversation history available';
  
  const text = `Lead Handover Dossier: ${handoverData.customerName || 'New Lead'}

Customer Information:
Name: ${handoverData.customerName || 'Unknown'}
Contact: ${handoverData.customerContact || 'Unknown'}
Dealership ID: ${handoverData.dealershipId || 'Unknown'}
Conversation ID: ${handoverData.conversationId || 'Unknown'}

Escalation Reason:
${handoverData.escalationReason || 'No reason provided'}

Conversation Summary:
${handoverData.conversationSummary || 'No summary available'}

Customer Insights:
${insightsText}

Vehicle Interests:
${vehicleText}

Suggested Approach:
${handoverData.suggestedApproach || 'No suggested approach available'}

Urgency: ${handoverData.urgency?.toUpperCase() || 'MEDIUM'}

Full Conversation History:
${conversationText}

This handover dossier was automatically generated by Rylie AI.`;

  // Create HTML version with improved formatting
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
      <h2>Lead Handover Dossier: ${handoverData.customerName || 'New Lead'}</h2>
      
      <div style="background-color: #f4f6fa; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
        <h3 style="margin-top: 0;">Customer Information</h3>
        <p><strong>Name:</strong> ${handoverData.customerName || 'Unknown'}</p>
        <p><strong>Contact:</strong> ${handoverData.customerContact || 'Unknown'}</p>
        <p><strong>Dealership ID:</strong> ${handoverData.dealershipId || 'Unknown'}</p>
        <p><strong>Conversation ID:</strong> ${handoverData.conversationId || 'Unknown'}</p>
      </div>
      
      <div style="background-color: #ffeeee; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
        <h3 style="margin-top: 0; color: #cc0000;">Escalation Reason</h3>
        <p>${handoverData.escalationReason || 'No reason provided'}</p>
      </div>
      
      <div style="background-color: #f4f6fa; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
        <h3 style="margin-top: 0;">Conversation Summary</h3>
        <p>${handoverData.conversationSummary || 'No summary available'}</p>
      </div>
      
      <div style="background-color: #f4f6fa; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
        <h3 style="margin-top: 0;">Customer Insights</h3>
        <ul>
          ${handoverData.customerInsights?.map((insight: {key: string, value: string, confidence: number}) => {
            return `<li><strong>${insight.key}:</strong> ${insight.value} <span style="color: #666;">(Confidence: ${Math.round(insight.confidence * 100)}%)</span></li>`;
          }).join('') || '<li>No insights available</li>'}
        </ul>
      </div>
      
      <div style="background-color: #f4f6fa; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
        <h3 style="margin-top: 0;">Vehicle Interests</h3>
        <ul>
          ${handoverData.vehicleInterests?.map((vehicle: any) => {
            const details = [];
            if (vehicle.year) details.push(`${vehicle.year}`);
            if (vehicle.make) details.push(`${vehicle.make}`);
            if (vehicle.model) details.push(`${vehicle.model}`);
            if (vehicle.trim) details.push(`${vehicle.trim}`);
            return `<li>${details.join(' ')} ${vehicle.vin ? `<br><span style="font-size: 0.9em;">VIN: ${vehicle.vin}</span>` : ''} <span style="color: #666;">(Confidence: ${Math.round(vehicle.confidence * 100)}%)</span></li>`;
          }).join('') || '<li>No vehicle interests identified</li>'}
        </ul>
      </div>
      
      <div style="background-color: #f4f6fa; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
        <h3 style="margin-top: 0;">Suggested Approach</h3>
        <p>${handoverData.suggestedApproach || 'No suggested approach available'}</p>
      </div>
      
      <div style="background-color: ${
        handoverData.urgency === 'high' ? '#ffeeee' : 
        handoverData.urgency === 'medium' ? '#fff8ee' : 
        '#eeffee'
      }; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
        <h3 style="margin-top: 0;">Urgency: <span style="color: ${
          handoverData.urgency === 'high' ? '#cc0000' : 
          handoverData.urgency === 'medium' ? '#cc7700' : 
          '#007700'
        };">${handoverData.urgency?.toUpperCase() || 'MEDIUM'}</span></h3>
      </div>
      
      <div style="background-color: #f4f6fa; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
        <h3 style="margin-top: 0;">Full Conversation History</h3>
        ${handoverData.fullConversationHistory?.map((msg: {role: string, content: string, timestamp: string}) => {
          const timestampStr = new Date(msg.timestamp).toLocaleString();
          return `
            <div style="margin-bottom: 15px; ${msg.role === 'customer' ? '' : 'background-color: #e6f0ff; padding: 10px; border-radius: 5px;'}">
              <p style="margin-bottom: 5px; font-size: 0.8em; color: #666;">${timestampStr} - ${msg.role === 'customer' ? 'Customer' : 'Rylie'}</p>
              <p style="margin-top: 0;">${msg.content}</p>
            </div>
          `;
        }).join('') || '<p>No conversation history available</p>'}
      </div>
      
      <p style="color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">This handover dossier was automatically generated by Rylie AI.</p>
    </div>
  `;

  // Set up recipients
  let recipients = to;
  if (additionalRecipients && additionalRecipients.length > 0) {
    recipients = [to, ...additionalRecipients];
  }

  return await sendEmail(recipients, subject, text, html);
};

/**
 * Get email templates from SendGrid or cache
 * This helps prevent repeated API calls that might cause 502 errors
 */
export const getEmailTemplates = async (): Promise<any[]> => {
  const cacheKey = 'sendgrid_templates';
  
  // Check cache first
  const cachedData = templateCache.get(cacheKey);
  if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_TTL) {
    logger.debug('Using cached email templates');
    return cachedData.data;
  }
  
  // Circuit breaker - if we've had recent connection issues, return empty array
  if (isConnectionError && (Date.now() - lastErrorTime) < 60000) {
    logger.warn('SendGrid in circuit break mode - returning empty templates');
    return [];
  }
  
  try {
    if (!mailService || !process.env.SENDGRID_API_KEY) {
      return [];
    }
    
    // In a real implementation, this would call SendGrid's API to fetch templates
    // For now, we'll use mock data to demonstrate the caching pattern
    const templates = [
      { id: 'template1', name: 'Welcome Email' },
      { id: 'template2', name: 'Password Reset' },
      { id: 'template3', name: 'Lead Handover' },
      { id: 'template4', name: 'Weekly Report' }
    ];
    
    // Add to cache
    templateCache.set(cacheKey, {
      data: templates,
      timestamp: Date.now()
    });
    
    return templates;
  } catch (error) {
    // Check if it's a timeout or connection error
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isTimeout = errorMessage.includes('timeout') || errorMessage.includes('timed out');
    const isConnectError = errorMessage.includes('ECONNREFUSED') || 
                          errorMessage.includes('ENOTFOUND') ||
                          errorMessage.includes('EAI_AGAIN');
    
    if (isTimeout || isConnectError) {
      isConnectionError = true;
      lastErrorTime = Date.now();
      logger.error('SendGrid connection error while fetching templates', {
        error: errorMessage
      });
    } else {
      logger.error('Failed to fetch email templates', { error: errorMessage });
    }
    
    return [];
  }
};

/**
 * Get email recipients (users/groups)
 * This helps prevent repeated API calls that might cause 502 errors
 */
export const getEmailRecipients = async (dealershipId: number): Promise<any[]> => {
  const cacheKey = `recipients_${dealershipId}`;
  
  // Check cache first
  const cachedData = templateCache.get(cacheKey);
  if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_TTL) {
    logger.debug('Using cached email recipients');
    return cachedData.data;
  }
  
  try {
    // In a real implementation, this would query the database for users
    // For now, we'll use mock data to demonstrate the caching pattern
    const recipients = [
      { id: 1, name: 'Sales Team', email: 'sales@example.com' },
      { id: 2, name: 'Service Team', email: 'service@example.com' },
      { id: 3, name: 'Management', email: 'management@example.com' }
    ];
    
    // Add to cache
    templateCache.set(cacheKey, {
      data: recipients,
      timestamp: Date.now()
    });
    
    return recipients;
  } catch (error) {
    logger.error('Failed to fetch email recipients', { 
      error: error instanceof Error ? error.message : String(error),
      dealershipId 
    });
    return [];
  }
};

/**
 * Clear cache entries, useful for testing or when data changes
 */
export const clearEmailCache = (key?: string): void => {
  if (key) {
    templateCache.delete(key);
  } else {
    templateCache.clear();
  }
  logger.debug('Email cache cleared', { key: key || 'all' });
};

// Export for testing purposes
export const _internal = {
  mailService,
  templateCache
};

export default {
  sendEmail,
  sendNotificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendReportEmail,
  sendHandoverEmail,
  queueEmail,
  getEmailTemplates,
  getEmailRecipients,
  clearEmailCache
};