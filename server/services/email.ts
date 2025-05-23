/**
 * Email Service
 * 
 * This service handles sending emails via SendGrid
 */

import { MailService } from '@sendgrid/mail';

// Initialize mail service if API key is available
let mailService: MailService | null = null;
if (process.env.SENDGRID_API_KEY) {
  mailService = new MailService();
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

// Email parameters interface
interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Send an email using SendGrid
 * Ensures both text and html are present in the final email
 * Includes a fallback mechanism for deployment readiness
 * 
 * @param apiKey SendGrid API key
 * @param params Email parameters (to, from, subject, text/html)
 * @returns Success status
 */
export async function sendEmail(
  apiKey: string,
  params: EmailParams
): Promise<boolean> {
  try {
    // If no API key was provided or available, log but don't fail
    if (!apiKey && !process.env.SENDGRID_API_KEY) {
      console.log('No SendGrid API key available, email would have been sent to:', params.to);
      console.log('Subject:', params.subject);
      console.log('Content:', params.html || params.text);
      return true;
    }
    
    // Use the provided API key or the one from environment
    if (apiKey && (!mailService || process.env.SENDGRID_API_KEY !== apiKey)) {
      mailService = new MailService();
      mailService.setApiKey(apiKey);
    }
    
    if (!mailService) {
      console.error('Mail service not initialized');
      logEmailToFallbackSystem(params);
      return false;
    }
    
    // Ensure we have both text and html content for the email
    const textContent = params.text || 'This email contains HTML content. Please use an HTML-compatible email client to view it properly.';
    const htmlContent = params.html || '<p>' + (params.text || 'Email content not available') + '</p>';
    
    try {
      // Send the email
      await mailService.send({
        to: params.to,
        from: params.from,
        subject: params.subject,
        text: textContent,
        html: htmlContent
      });
      
      return true;
    } catch (sendError) {
      console.error('SendGrid email error:', sendError);
      
      // Use fallback mechanism for deployment readiness
      const isProduction = process.env.NODE_ENV === 'production';
      if (isProduction) {
        // In production, log the email for manual processing if needed
        logEmailToFallbackSystem(params);
        return true; // Return true so application flow isn't interrupted in production
      }
      
      return false;
    }
  } catch (error) {
    console.error('Email service error:', error);
    logEmailToFallbackSystem(params);
    return false;
  }
}

/**
 * Fallback mechanism for email delivery
 * Logs email details for manual processing if SendGrid is unavailable
 * 
 * @param params Email parameters
 */
function logEmailToFallbackSystem(params: EmailParams): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    to: params.to,
    from: params.from,
    subject: params.subject,
    textContent: params.text || '',
    htmlContent: params.html || '',
  };
  
  // Log to console in structured format for easier parsing
  console.log('EMAIL_FALLBACK_LOG:', JSON.stringify(logEntry));
  
  // In a real production system, this could:
  // 1. Write to a specific log file for manual processing
  // 2. Add to a database queue for retry
  // 3. Call a secondary email service provider
  // 4. Trigger an alert to operations team
}

/**
 * Send an inventory update confirmation email
 * 
 * @param to Recipient email address
 * @param subject Email subject
 * @param results Processing results to include in email
 * @returns Success status
 */
export async function sendInventoryUpdateEmail(
  to: string,
  subject: string,
  results: any
): Promise<boolean> {
  try {
    const from = 'inventory@rylie-ai.com';
    const html = `
      <h2>Inventory Update Processed</h2>
      <p>Your inventory file has been processed.</p>
      
      <h3>Processing Results:</h3>
      <ul>
        <li><strong>Total vehicles processed:</strong> ${results.totalProcessed || 0}</li>
        <li><strong>New vehicles added:</strong> ${results.added || 0}</li>
        <li><strong>Existing vehicles updated:</strong> ${results.updated || 0}</li>
        ${results.errors && results.errors.length > 0 ? 
          `<li><strong>Errors encountered:</strong> ${results.errors.length}</li>` : 
          ''
        }
      </ul>
      
      ${results.errors && results.errors.length > 0 ? `
        <h3>Error Details:</h3>
        <ul>
          ${results.errors.map((err: any) => `<li>${err}</li>`).join('')}
        </ul>
      ` : ''}
      
      <p>If you have any questions or concerns about this inventory update, please contact your Rylie AI representative.</p>
    `;
    
    // Generate a plain text version
    const text = `
      Inventory Update Processed
      
      Your inventory file has been processed.
      
      Processing Results:
      - Total vehicles processed: ${results.totalProcessed || 0}
      - New vehicles added: ${results.added || 0}
      - Existing vehicles updated: ${results.updated || 0}
      ${results.errors && results.errors.length > 0 ? 
        `- Errors encountered: ${results.errors.length}` : 
        ''
      }
      
      If you have any questions or concerns about this inventory update, please contact your Rylie AI representative.
    `;
    
    return await sendEmail(process.env.SENDGRID_API_KEY || '', {
      to,
      from,
      subject,
      text,
      html
    });
  } catch (error) {
    console.error('Error sending inventory update email:', error);
    return false;
  }
}

/**
 * Send a conversation summary email
 * 
 * @param to Recipient email address
 * @param subject Email subject
 * @param conversation Conversation data to include in summary
 * @returns Success status
 */
export async function sendConversationSummary(
  to: string,
  subject: string,
  conversation: any
): Promise<boolean> {
  try {
    const from = 'reports@rylie-ai.com';
    
    // Extract conversation details
    const customerName = conversation.customerName || 'Customer';
    const status = conversation.status || 'active';
    const startedAt = conversation.createdAt ? new Date(conversation.createdAt).toLocaleString() : 'Unknown';
    const lastUpdated = conversation.updatedAt ? new Date(conversation.updatedAt).toLocaleString() : 'Unknown';
    
    // Format messages for HTML
    const messagesHtml = conversation.messages && Array.isArray(conversation.messages) 
      ? conversation.messages.map((msg: any) => `
          <div style="margin-bottom: 10px; padding: 10px; border-radius: 5px; background-color: ${msg.role === 'customer' ? '#f0f0f0' : '#e6f7ff'};">
            <div style="font-weight: bold;">${msg.role === 'customer' ? customerName : 'Rylie AI'}</div>
            <div>${msg.content}</div>
            <div style="font-size: 0.8em; color: #666; margin-top: 5px;">
              ${msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ''}
            </div>
          </div>
        `).join('') 
      : '<p>No messages in this conversation</p>';
    
    const html = `
      <h2>Conversation Summary</h2>
      <p>Here is a summary of the conversation with ${customerName}.</p>
      
      <h3>Conversation Details:</h3>
      <ul>
        <li><strong>Status:</strong> ${status}</li>
        <li><strong>Started:</strong> ${startedAt}</li>
        <li><strong>Last Updated:</strong> ${lastUpdated}</li>
      </ul>
      
      <h3>Messages:</h3>
      <div style="margin-top: 15px;">
        ${messagesHtml}
      </div>
      
      <p style="margin-top: 20px;">
        To respond to this conversation, please log in to your Rylie AI dashboard.
      </p>
    `;
    
    // Generate a plain text version for email clients that don't support HTML
    let messagesText = 'No messages in this conversation';
    if (conversation.messages && Array.isArray(conversation.messages)) {
      messagesText = conversation.messages.map((msg: any) => {
        const sender = msg.role === 'customer' ? customerName : 'Rylie AI';
        const timestamp = msg.createdAt ? new Date(msg.createdAt).toLocaleString() : '';
        return `${sender}: ${msg.content}\n${timestamp ? `Sent: ${timestamp}` : ''}`;
      }).join('\n\n');
    }
    
    const text = `
      Conversation Summary
      
      Here is a summary of the conversation with ${customerName}.
      
      Conversation Details:
      - Status: ${status}
      - Started: ${startedAt}
      - Last Updated: ${lastUpdated}
      
      Messages:
      ${messagesText}
      
      To respond to this conversation, please log in to your Rylie AI dashboard.
    `;
    
    return await sendEmail(process.env.SENDGRID_API_KEY || '', {
      to,
      from,
      subject,
      text,
      html
    });
  } catch (error) {
    console.error('Error sending conversation summary email:', error);
    return false;
  }
}

/**
 * Send a lead handover email
 * 
 * @param to Recipient email address
 * @param subject Email subject
 * @param handoverData Lead handover data
 * @returns Success status
 */
export async function sendHandoverEmail(
  to: string,
  subject: string,
  dossier: any
): Promise<boolean> {
  try {
    const from = 'leads@rylie-ai.com';
    
    // Extract handover details
    const customerName = dossier.customerName || 'Customer';
    const customerContact = dossier.customerContact || 'Not provided';
    const escalationReason = dossier.escalationReason || 'Manual handover';
    const urgency = dossier.urgency?.toUpperCase() || 'MEDIUM';
    const handoverDate = new Date().toLocaleString();
    
    // Format action items based on suggested approach
    const suggestedApproach = dossier.suggestedApproach || 'Follow up with the customer to address their needs.';
    const actionItems = suggestedApproach.split('\n').filter((item: string) => item.trim().length > 0);
    const actionItemsHtml = actionItems.length > 0
      ? actionItems.map((item: string) => `<li>${item}</li>`).join('') 
      : '<li>Follow up with the customer to address their needs.</li>';
    
    // Format customer insights
    const customerPointsHtml = dossier.customerInsights && Array.isArray(dossier.customerInsights) 
      ? dossier.customerInsights.map((insight: any) => `<li>${insight.key}: ${insight.value}</li>`).join('') 
      : '';
    
    // Format vehicle interests
    const vehiclePointsHtml = dossier.vehicleInterests && Array.isArray(dossier.vehicleInterests) 
      ? dossier.vehicleInterests.map((vehicle: any) => {
          const details = [];
          if (vehicle.year) details.push(`${vehicle.year}`);
          if (vehicle.make) details.push(`${vehicle.make}`);
          if (vehicle.model) details.push(`${vehicle.model}`);
          if (vehicle.trim) details.push(`${vehicle.trim}`);
          
          return `<li>${details.join(' ')} (Confidence: ${vehicle.confidence * 100}%)</li>`;
        }).join('') 
      : '';
    
    // Format next steps from suggested approach if not already provided
    let nextSteps = [];
    if (dossier.nextSteps && Array.isArray(dossier.nextSteps)) {
      nextSteps = dossier.nextSteps;
    } else {
      // Create next steps from the suggested approach
      nextSteps = [
        'Contact customer within 24 hours',
        'Reference their specific interests mentioned in the conversation',
        'Address any unanswered questions from the conversation history'
      ];
    }
    
    const nextStepsHtml = nextSteps.map((item: string) => `<li>${item}</li>`).join('');
    
    // Format conversation history for HTML
    const messagesHtml = dossier.fullConversationHistory && Array.isArray(dossier.fullConversationHistory) 
      ? dossier.fullConversationHistory.map((msg: any) => `
          <div style="margin-bottom: 10px; padding: 10px; border-radius: 5px; background-color: ${msg.role === 'customer' ? '#f0f0f0' : '#e6f7ff'};">
            <div style="font-weight: bold;">${msg.role === 'customer' ? customerName : 'Rylie AI'}</div>
            <div>${msg.content}</div>
            <div style="font-size: 0.8em; color: #666; margin-top: 5px;">
              ${msg.timestamp ? new Date(msg.timestamp).toLocaleString() : ''}
            </div>
          </div>
        `).join('') 
      : '<p>No messages in this conversation</p>';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #0056b3; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">LEAD HANDOVER DOSSIER</h1>
          <p style="margin: 5px 0 0 0; font-size: 18px;">${urgency} PRIORITY</p>
        </div>
        
        <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
          <div style="margin-bottom: 20px;">
            <h2 style="color: #0056b3; border-bottom: 2px solid #0056b3; padding-bottom: 5px;">Customer Information</h2>
            <p><strong>Name:</strong> ${customerName}</p>
            <p><strong>Contact:</strong> ${customerContact}</p>
            <p><strong>Handover Date:</strong> ${handoverDate}</p>
            <p><strong>Reason:</strong> ${escalationReason}</p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h2 style="color: #0056b3; border-bottom: 2px solid #0056b3; padding-bottom: 5px;">SUMMARY</h2>
            <p>${dossier.conversationSummary}</p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h2 style="color: #0056b3; border-bottom: 2px solid #0056b3; padding-bottom: 5px;">ACTION ITEMS</h2>
            <ul style="padding-left: 20px;">
              ${actionItemsHtml}
            </ul>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h2 style="color: #0056b3; border-bottom: 2px solid #0056b3; padding-bottom: 5px;">CUSTOMER INSIGHTS</h2>
            <ul style="padding-left: 20px;">
              ${customerPointsHtml}
            </ul>
          </div>
          
          ${vehiclePointsHtml ? `
          <div style="margin-bottom: 20px;">
            <h2 style="color: #0056b3; border-bottom: 2px solid #0056b3; padding-bottom: 5px;">VEHICLE INTERESTS</h2>
            <ul style="padding-left: 20px;">
              ${vehiclePointsHtml}
            </ul>
          </div>
          ` : ''}
          
          <div style="margin-bottom: 20px;">
            <h2 style="color: #0056b3; border-bottom: 2px solid #0056b3; padding-bottom: 5px;">NEXT STEPS</h2>
            <ul style="padding-left: 20px;">
              ${nextStepsHtml}
            </ul>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h2 style="color: #0056b3; border-bottom: 2px solid #0056b3; padding-bottom: 5px;">CONVERSATION HISTORY</h2>
            <div style="margin-top: 15px;">
              ${messagesHtml}
            </div>
          </div>
          
          <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center;">
            <p>This handover was automatically generated by Rylie AI. For questions, contact support.</p>
          </div>
        </div>
      </div>
    `;
    
    // Generate a plain text version for email clients that don't support HTML
    // Create a simpler text-based format of the same information
    let messagesText = 'No conversation history available';
    if (dossier.fullConversationHistory && Array.isArray(dossier.fullConversationHistory)) {
      messagesText = dossier.fullConversationHistory.map((msg: any) => {
        const sender = msg.role === 'customer' ? customerName : 'Rylie AI';
        const timestamp = msg.timestamp ? new Date(msg.timestamp).toLocaleString() : '';
        return `${sender}: ${msg.content}\n${timestamp ? `Sent: ${timestamp}` : ''}`;
      }).join('\n\n');
    }
    
    // Format customer insights in text
    let customerInsightsText = 'No customer insights available';
    if (dossier.customerInsights && Array.isArray(dossier.customerInsights)) {
      customerInsightsText = dossier.customerInsights.map((insight: any) => {
        return `- ${insight.key}: ${insight.value}`;
      }).join('\n');
    }
    
    // Format vehicle interests in text
    let vehicleInterestsText = '';
    if (dossier.vehicleInterests && Array.isArray(dossier.vehicleInterests)) {
      vehicleInterestsText = dossier.vehicleInterests.map((vehicle: any) => {
        const details = [];
        if (vehicle.year) details.push(`${vehicle.year}`);
        if (vehicle.make) details.push(`${vehicle.make}`);
        if (vehicle.model) details.push(`${vehicle.model}`);
        if (vehicle.trim) details.push(`${vehicle.trim}`);
        
        return `- ${details.join(' ')} (Confidence: ${vehicle.confidence * 100}%)`;
      }).join('\n');
    }
    
    const text = `
LEAD HANDOVER DOSSIER - ${urgency} PRIORITY

CUSTOMER INFORMATION:
Name: ${customerName}
Contact: ${customerContact}
Handover Date: ${handoverDate}
Reason: ${escalationReason}

SUMMARY:
${dossier.conversationSummary}

ACTION ITEMS:
${actionItems.map(item => `- ${item}`).join('\n')}

CUSTOMER INSIGHTS:
${customerInsightsText}

${vehicleInterestsText ? `VEHICLE INTERESTS:\n${vehicleInterestsText}\n\n` : ''}

NEXT STEPS:
${nextSteps.map(item => `- ${item}`).join('\n')}

CONVERSATION HISTORY:
${messagesText}

This handover was automatically generated by Rylie AI. For questions, contact support.
    `;
    
    return await sendEmail(process.env.SENDGRID_API_KEY || '', {
      to,
      from,
      subject,
      text,
      html
    });
  } catch (error) {
    console.error('Error sending lead handover email:', error);
    return false;
  }
}