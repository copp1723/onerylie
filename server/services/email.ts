import sgMail from '@sendgrid/mail';
import { HandoverDossier } from './openai';

// Initialize SendGrid with the API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

interface SendHandoverEmailParams {
  toEmail: string;
  fromEmail: string;
  dossier: HandoverDossier;
}

/**
 * Sends the handover dossier to the specified sales representative via email
 */
export async function sendHandoverEmail({
  toEmail,
  fromEmail,
  dossier
}: SendHandoverEmailParams): Promise<boolean> {
  try {
    // Format the conversation history as HTML
    const conversationHtml = dossier.conversationHistory
      .map(msg => {
        const role = msg.role === 'customer' ? 'Customer' : 'Rylie';
        const timestamp = msg.timestamp ? new Date(msg.timestamp).toLocaleString() : '';
        return `
          <div style="margin-bottom: 12px;">
            <strong>${role}</strong> <span style="color: #888; font-size: 0.9em;">${timestamp}</span>
            <div style="margin-left: 20px; margin-top: 4px;">${msg.content}</div>
          </div>
        `;
      })
      .join('');

    // Format the key points as HTML list
    const keyPointsHtml = dossier.keyPoints
      .map(point => `<li>${point}</li>`)
      .join('');

    // Format the products of interest as HTML list
    const productsInterestedHtml = dossier.productsInterested
      .map(product => `<li>${product}</li>`)
      .join('');

    // Format engagement tips as HTML list
    const engagementTipsHtml = dossier.engagementTips
      .map(tip => `<li>${tip}</li>`)
      .join('');

    // Format closing strategies as HTML list
    const closingStrategiesHtml = dossier.closingStrategies
      .map(strategy => `<li>${strategy}</li>`)
      .join('');

    // Create a professional-looking email template for the dossier based on the provided format
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Lead Handover: ${dossier.customerName}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 700px; margin: 0 auto; padding: 20px; }
          .header { background-color: #1a237e; color: white; padding: 15px; border-radius: 5px 5px 0 0; text-align: center; }
          .pre-header { background-color: #f5f5f5; padding: 15px; text-align: center; font-style: italic; }
          .section { margin-bottom: 25px; border-bottom: 1px solid #eee; padding-bottom: 15px; }
          .section-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #1a237e; }
          .section-number { background-color: #1a237e; color: white; display: inline-block; width: 24px; height: 24px; border-radius: 50%; text-align: center; margin-right: 8px; }
          .conversation { background-color: #f9f9f9; padding: 15px; border-radius: 5px; max-height: 400px; overflow-y: auto; }
          .footer { font-size: 14px; color: #777; margin-top: 30px; text-align: center; font-style: italic; }
          ul { margin-top: 5px; }
          .contact-detail { margin: 5px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="pre-header">
            <p>Lead Handover Notification: Human Engagement Required</p>
          </div>
          
          <div class="header">
            <h1 style="margin: 0;">Lead Handover: ${dossier.customerName}</h1>
            <p style="margin: 5px 0 0 0;">${dossier.dealershipName}</p>
          </div>
          
          <p style="font-style: italic; text-align: center; margin: 20px 0;">
            We have a promising lead requiring your expertise to finalize the details for a potential sale. 
            Below you'll find comprehensive information about the lead to prepare for your interaction. 
            Please review the details carefully to tailor your approach effectively.
          </p>
          
          <div class="section">
            <div class="section-title"><span class="section-number">1</span> Lead Identification</div>
            <p><strong>Name:</strong> ${dossier.customerName}</p>
            <p class="contact-detail"><strong>Contact Details:</strong> 
              ${dossier.contactDetails.email ? `Email - ${dossier.contactDetails.email}` : ''}
              ${dossier.contactDetails.email && dossier.contactDetails.phone ? ', ' : ''}
              ${dossier.contactDetails.phone ? `Phone - ${dossier.contactDetails.phone}` : ''}
            </p>
            <p><strong>Products Interested In:</strong></p>
            <ul>${productsInterestedHtml}</ul>
            <p><strong>Likely Purchase Date/Timeline:</strong> ${dossier.purchaseTimeline}</p>
          </div>
          
          <div class="section">
            <div class="section-title"><span class="section-number">2</span> Conversation Summary</div>
            <p><strong>Key Points:</strong></p>
            <ul>${keyPointsHtml}</ul>
            <p><strong>Lead's Intent:</strong> ${dossier.leadIntent}</p>
          </div>
          
          <div class="section">
            <div class="section-title"><span class="section-number">3</span> Relationship Building Information</div>
            <p><strong>Personal Insights:</strong> ${dossier.personalInsights}</p>
            <p><strong>Communication Style:</strong> ${dossier.communicationStyle}</p>
          </div>
          
          <div class="section">
            <div class="section-title"><span class="section-number">4</span> Sales Strategies</div>
            <p><strong>Engagement Tips:</strong></p>
            <ul>${engagementTipsHtml}</ul>
            <p><strong>Closing Strategies:</strong></p>
            <ul>${closingStrategiesHtml}</ul>
          </div>
          
          <div class="section">
            <div class="section-title">Conversation History</div>
            <div class="conversation">
              ${conversationHtml}
            </div>
          </div>
          
          <div class="footer">
            <p>Your adept skills in managing client relations and closing deals can undoubtedly make a significant difference here. Wishing you the best in this engagement!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send the email with the dossier
    const msg = {
      to: toEmail,
      from: fromEmail,
      subject: `Lead Handover: ${dossier.customerName} - ${dossier.dealershipName}`,
      text: `Lead handover for ${dossier.customerName} from ${dossier.dealershipName}. Please view in HTML format for a better experience.`,
      html: emailHtml,
    };

    await sgMail.send(msg);
    return true;
  } catch (error) {
    console.error('Error sending handover email:', error);
    return false;
  }
}