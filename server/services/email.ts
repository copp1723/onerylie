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
      return false;
    }
    
    // Send the email
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html
    });
    
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
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
    
    return await sendEmail(process.env.SENDGRID_API_KEY || '', {
      to,
      from,
      subject,
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
    
    // Format messages
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
    
    return await sendEmail(process.env.SENDGRID_API_KEY || '', {
      to,
      from,
      subject,
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
  handoverData: any
): Promise<boolean> {
  try {
    const from = 'leads@rylie-ai.com';
    
    // Extract handover details
    const customerName = handoverData.customerName || 'Customer';
    const contactInfo = handoverData.contactInfo || 'Not provided';
    const reason = handoverData.reason || 'Manual handover';
    const handoverDate = new Date().toLocaleString();
    
    // Format messages
    const messagesHtml = handoverData.messages && Array.isArray(handoverData.messages) 
      ? handoverData.messages.map((msg: any) => `
          <div style="margin-bottom: 10px; padding: 10px; border-radius: 5px; background-color: ${msg.role === 'customer' ? '#f0f0f0' : '#e6f7ff'};">
            <div style="font-weight: bold;">${msg.role === 'customer' ? customerName : 'Rylie AI'}</div>
            <div>${msg.content}</div>
            <div style="font-size: 0.8em; color: #666; margin-top: 5px;">
              ${msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ''}
            </div>
          </div>
        `).join('') 
      : '<p>No messages in this conversation</p>';
    
    // Format vehicle interest
    const vehicleHtml = handoverData.vehicle 
      ? `
        <h3>Vehicle of Interest:</h3>
        <ul>
          <li><strong>Year:</strong> ${handoverData.vehicle.year || 'Unknown'}</li>
          <li><strong>Make:</strong> ${handoverData.vehicle.make || 'Unknown'}</li>
          <li><strong>Model:</strong> ${handoverData.vehicle.model || 'Unknown'}</li>
          <li><strong>Trim:</strong> ${handoverData.vehicle.trim || 'Unknown'}</li>
          <li><strong>Price:</strong> $${handoverData.vehicle.price || 'Unknown'}</li>
          <li><strong>VIN:</strong> ${handoverData.vehicle.vin || 'Unknown'}</li>
        </ul>
      `
      : '';
    
    const html = `
      <h2>Lead Handover: ${customerName}</h2>
      <p>A conversation has been escalated to you for follow-up.</p>
      
      <h3>Lead Details:</h3>
      <ul>
        <li><strong>Customer:</strong> ${customerName}</li>
        <li><strong>Contact Info:</strong> ${contactInfo}</li>
        <li><strong>Handover Reason:</strong> ${reason}</li>
        <li><strong>Handover Date:</strong> ${handoverDate}</li>
      </ul>
      
      ${vehicleHtml}
      
      <h3>Conversation History:</h3>
      <div style="margin-top: 15px;">
        ${messagesHtml}
      </div>
      
      <h3>Recommended Approach:</h3>
      <p>${handoverData.recommendedApproach || 'Follow up with the customer to address their needs and questions.'}</p>
      
      <p style="margin-top: 20px;">
        To respond to this lead, please contact the customer directly or log in to your Rylie AI dashboard.
      </p>
    `;
    
    return await sendEmail(process.env.SENDGRID_API_KEY || '', {
      to,
      from,
      subject,
      html
    });
  } catch (error) {
    console.error('Error sending lead handover email:', error);
    return false;
  }
}