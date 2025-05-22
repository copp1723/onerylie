# Handover Dossier Customization

This guide explains how to customize the handover dossier in Rylie AI to optimize lead transfers to your sales team.

## Table of Contents
1. [Introduction to Handover Dossiers](#introduction-to-handover-dossiers)
2. [Dossier Components](#dossier-components)
3. [Configuring Handover Settings](#configuring-handover-settings)
4. [Customizing Dossier Content](#customizing-dossier-content)
5. [Email Template Customization](#email-template-customization)
6. [Handover Triggers](#handover-triggers)
7. [Recipient Management](#recipient-management)
8. [Best Practices](#best-practices)
9. [Examples](#examples)

## Introduction to Handover Dossiers

A handover dossier is a comprehensive summary of a customer conversation that is created when Rylie AI determines a human sales representative should take over. The dossier contains valuable context about the customer's needs, preferences, and conversation history, enabling a smooth transition and improving the chances of conversion.

Key benefits:
- Provides sales representatives with all relevant customer information
- Identifies customer preferences and priorities
- Summarizes the conversation history
- Suggests next steps based on customer intent
- Enables personalized follow-up

## Dossier Components

The handover dossier includes several key components:

### Customer Information
- Name and contact details
- Source/campaign that led to the conversation
- Conversation timeline (start, duration, handover time)

### Conversation Summary
- Key points from the conversation
- Customer's explicit requests or questions
- AI's assessment of customer intent
- Sentiment analysis

### Vehicle Preferences
- Preferred makes and models
- Must-have features
- Deal-breakers
- Budget considerations
- Timeline for purchase

### Additional Context
- Trade-in information
- Financing preferences
- Previous dealership interactions
- Specific concerns or objections

### Recommendations
- Suggested vehicles to show
- Talking points for the sales representative
- Potential objections to address
- Recommended next steps

## Configuring Handover Settings

To configure your dealership's handover settings:

1. Navigate to Settings > Handover Configuration
2. Configure the following settings:
   - **Handover Email**: Primary email to receive dossiers
   - **Secondary Recipients**: Additional staff to include
   - **Notification Settings**: Email, SMS, or system notifications
   - **Urgency Levels**: Configure different handling for urgent leads
   - **Working Hours**: Set business hours for handover timing
   - **Auto-response**: Configure what Rylie tells the customer during handover

## Customizing Dossier Content

You can customize the content and format of your handover dossiers:

### Dossier Sections

1. Navigate to Settings > Handover Configuration > Customize Format
2. Enable/disable specific sections
3. Reorder sections by priority
4. Configure the level of detail for each section

### Customization Options

- **Summary Length**: Brief, standard, or detailed
- **Conversation History**: None, highlights only, or full transcript
- **Vehicle Recommendations**: Number of vehicles to include
- **Format Type**: Text, HTML, or PDF attachment
- **Branding**: Add dealership logo and styling to email

### Custom Fields

You can add custom fields to collect specific information:

1. Go to Settings > Handover Configuration > Custom Fields
2. Click "Add Custom Field"
3. Configure the field:
   - Name (e.g., "Local Competitors Mentioned")
   - Type (text, number, yes/no, dropdown)
   - AI instructions (how Rylie should populate this field)
4. Save and arrange custom fields in order of importance

## Email Template Customization

The handover email template can be fully customized:

1. Navigate to Settings > Handover Configuration > Email Templates
2. Edit the default template or create a new one
3. Use the visual editor or HTML mode to customize
4. Incorporate template variables:
   - `{{customerName}}`: Customer's name
   - `{{conversationId}}`: Unique conversation ID
   - `{{summary}}`: Conversation summary
   - `{{vehiclePreferences}}`: Customer's vehicle preferences
   - `{{recommendedVehicles}}`: Matched vehicles from inventory
   - `{{nextSteps}}`: Recommended next actions
   - `{{customField1}}`, `{{customField2}}`, etc.: Custom field values

### Example Template

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0;">
  <div style="text-align: center; margin-bottom: 20px;">
    <img src="{{dealershipLogo}}" alt="{{dealershipName}} Logo" style="max-width: 200px;">
  </div>
  
  <h1 style="color: #1a73e8; font-size: 24px;">New Lead Handover: {{customerName}}</h1>
  
  <div style="background-color: #f8f9fa; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
    <h2 style="font-size: 18px; margin-top: 0;">Customer Information</h2>
    <p><strong>Name:</strong> {{customerName}}</p>
    <p><strong>Contact:</strong> {{customerPhone}} | {{customerEmail}}</p>
    <p><strong>Conversation Started:</strong> {{conversationStartTime}}</p>
    <p><strong>Source:</strong> {{conversationSource}}</p>
  </div>
  
  <div style="margin-bottom: 20px;">
    <h2 style="font-size: 18px; color: #1a73e8;">Summary</h2>
    <p>{{summary}}</p>
  </div>
  
  <div style="margin-bottom: 20px;">
    <h2 style="font-size: 18px; color: #1a73e8;">Vehicle Preferences</h2>
    <ul>
      {{#each vehiclePreferences}}
        <li><strong>{{this.label}}:</strong> {{this.value}}</li>
      {{/each}}
    </ul>
  </div>
  
  <div style="margin-bottom: 20px;">
    <h2 style="font-size: 18px; color: #1a73e8;">Recommended Vehicles</h2>
    <ul>
      {{#each recommendedVehicles}}
        <li>
          <strong>{{this.year}} {{this.make}} {{this.model}} {{this.trim}}</strong><br>
          Stock #: {{this.stockNumber}} | Price: {{this.price}}<br>
          <a href="{{this.detailUrl}}">View Details</a>
        </li>
      {{/each}}
    </ul>
  </div>
  
  <div style="margin-bottom: 20px;">
    <h2 style="font-size: 18px; color: #1a73e8;">Suggested Next Steps</h2>
    <ol>
      {{#each nextSteps}}
        <li>{{this}}</li>
      {{/each}}
    </ol>
  </div>
  
  <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px;">
    <h2 style="font-size: 18px; margin-top: 0;">Conversation Highlights</h2>
    <div style="max-height: 200px; overflow-y: auto;">
      {{#each conversationHighlights}}
        <p>
          <strong>{{this.speaker}}:</strong> {{this.message}}
        </p>
      {{/each}}
    </div>
    <p><a href="{{conversationUrl}}">View Full Conversation</a></p>
  </div>
  
  <div style="margin-top: 30px; font-size: 12px; color: #5f6368; text-align: center;">
    <p>This lead was automatically handed over by Rylie AI</p>
    <p>Conversation ID: {{conversationId}}</p>
  </div>
</div>
```

## Handover Triggers

Customize when Rylie AI initiates a handover:

### Standard Triggers

Rylie has default triggers that can be enabled/disabled:
- Customer explicitly asks for a human
- Customer expresses purchase intent
- Customer asks for specific pricing details
- Complex financing questions
- Scheduled appointment requests
- Multiple repeated questions
- Negative sentiment detected

### Custom Triggers

Create custom triggers in Settings > Handover Configuration > Triggers:
1. Click "Add Custom Trigger"
2. Configure trigger conditions:
   - **Keyword-based**: Specific words or phrases
   - **Intent-based**: Customer's detected intent
   - **Question-based**: Number or type of questions
   - **Time-based**: Conversation duration thresholds
   - **Sentiment-based**: Customer emotion/frustration
   - **Complex Logic**: Combinations of the above

Example custom trigger:
```
IF (contains_keywords("test drive", "see in person", "visit dealership") 
    AND conversation_duration > 5 minutes
    AND has_mentioned_specific_vehicle = true)
THEN trigger_handover("Purchase Intent - Test Drive Request")
```

## Recipient Management

Configure who receives handover dossiers:

### Primary Recipient

The primary recipient is set in the persona configuration:
- Navigate to Personas > [Select Persona] > Configuration
- Set the "Handover Email" field

### Additional Recipients

Set up rules for additional recipients:
1. Go to Settings > Handover Configuration > Recipients
2. Configure recipient rules:
   - By vehicle type (e.g., luxury vehicles go to premium sales team)
   - By customer source (e.g., Facebook leads go to digital team)
   - By time of day (e.g., after-hours leads go to night team)
   - By detected purchase timeline (e.g., immediate buyers go to closers)
   - By conversation topic (e.g., financing questions go to F&I)

### Rotation and Load Balancing

Set up lead distribution:
- Round-robin assignment
- Availability-based routing
- Performance-based allocation
- Hybrid approaches

## Best Practices

### Content Optimization

1. **Prioritize Actionable Information**: Put the most important information first
2. **Be Concise**: Keep summaries brief and to the point
3. **Highlight Customer Quotes**: Include verbatim statements when relevant
4. **Make Next Steps Clear**: Provide specific, actionable recommendations
5. **Include Timeline Info**: Note the customer's buying timeline and urgency

### Email Design

1. **Mobile-Friendly**: Ensure the template works well on mobile devices
2. **Scannable Format**: Use headers, bullet points, and clear sections
3. **Minimal Styling**: Keep design clean and professional
4. **Clear CTA**: Make it obvious what the sales rep should do next
5. **Quick Access**: Provide links to view the full conversation or customer profile

### Process Integration

1. **CRM Integration**: Set up automatic CRM entry for handovers
2. **Follow-up Tracking**: Track which handovers result in sales
3. **Feedback Loop**: Collect sales rep feedback on dossier quality
4. **Regular Reviews**: Analyze handover effectiveness monthly
5. **A/B Testing**: Test different dossier formats to optimize conversion

## Examples

### Example 1: Basic Handover Dossier

```
LEAD HANDOVER: John Smith

CUSTOMER INFO:
Name: John Smith
Phone: (555) 123-4567
Email: john.smith@example.com
Source: Website Chat
Conversation Start: May 21, 2025 2:15 PM
Handover Time: May 21, 2025 2:32 PM

SUMMARY:
John is looking for a family-friendly SUV with good safety features and third-row seating. He has two children and frequently drives long distances for family vacations. Price range is $35,000-$45,000. He currently owns a 2018 Honda Accord that he's considering trading in. Timeframe is within the next month.

VEHICLE PREFERENCES:
- Vehicle Type: SUV
- Must-Have Features: Third-row seating, advanced safety features, good fuel economy
- Nice-to-Have: Leather seats, panoramic sunroof, premium sound system
- Budget: $35,000-$45,000
- Timeline: 3-4 weeks

MATCHED VEHICLES:
1. 2025 Toyota Highlander XLE (Stock #T12345) - $39,995
2. 2025 Honda Pilot EX-L (Stock #H54321) - $42,995
3. 2025 Mazda CX-9 Touring (Stock #M98765) - $38,495

TRADE-IN INFO:
- Current Vehicle: 2018 Honda Accord EX
- Condition: Good, ~45,000 miles
- Owed Amount: None (fully paid off)

CONVERSATION HIGHLIGHTS:
- Customer expressed concern about fuel economy
- Specifically asked about Toyota Highlander
- Mentioned he'd like to avoid "anything too flashy"
- Asked about weekend availability for a test drive

NEXT STEPS:
1. Call customer within 1 hour
2. Highlight safety features of recommended vehicles
3. Prepare trade-in valuation estimate for his Honda Accord
4. Suggest Saturday appointment for test drives
```

### Example 2: Detailed Handover Dossier

```
LEAD HANDOVER DOSSIER

CUSTOMER INFORMATION
--------------------
Name: Sarah Johnson
Contact: (555) 987-6543 | sarah.johnson@example.com
First Contact: May 22, 2025 10:22 AM
Handover Time: May 22, 2025 10:47 AM
Source: Google Ads - "hybrid SUV deals"
Lead Score: 92/100 (HOT LEAD)
Handover Reason: Specific pricing request and test drive inquiry

EXECUTIVE SUMMARY
----------------
Sarah is a highly qualified lead looking for a hybrid or electric SUV. She's a tech-savvy professional who values fuel efficiency and modern features. She has researched extensively and is ready to make a purchase within the next two weeks. Her budget is $50,000-$60,000, and she's specifically interested in the Toyota RAV4 Prime, Volvo XC60 Recharge, and Tesla Model Y. She has a 2019 BMW X3 to trade in and is pre-approved for financing.

VEHICLE PREFERENCES
------------------
Primary Requirements:
- SUV with hybrid or electric powertrain
- Premium/luxury segment
- Advanced driver assistance features
- Minimum 30 MPG combined or 250+ mile electric range
- Budget: $50,000-$60,000 (financing, pre-approved)

Specific Models Mentioned:
- Toyota RAV4 Prime (high interest)
- Volvo XC60 Recharge (high interest)
- Tesla Model Y (moderate interest)
- Lexus NX Hybrid (asked for comparison)

Deal Breakers:
- Poor technology interface
- Less than 250 miles electric range (for EVs)
- Cloth interior

CUSTOMER INSIGHTS
----------------
Motivations:
- Environmental concerns ("reducing carbon footprint")
- Rising fuel costs
- Desire for latest technology

Objections Anticipated:
- Charging infrastructure concerns for full electric
- Premium pricing of hybrid/electric models
- Potential wait times for delivery

Purchase Readiness: 9/10
- Timeline: 1-2 weeks
- Has conducted extensive research
- Pre-approved for financing
- Ready for test drive

TRADE-IN DETAILS
---------------
Current Vehicle: 2019 BMW X3 30i
- Mileage: Approximately 32,000
- Condition: Excellent, no accidents
- Features: Premium package, navigation
- Owed: Approximately $18,000 remaining on loan
- Customer Expectation: $35,000+ trade value

MATCHED INVENTORY
----------------
Primary Recommendations:
1. 2025 Toyota RAV4 Prime XSE (Stock #RP7890)
   - MSRP: $52,450
   - Available: In stock
   - Key Features: 42-mile electric range, 38 MPG combined, panoramic roof
   - Match Score: 95%

2. 2025 Volvo XC60 Recharge T8 (Stock #VR5432)
   - MSRP: $57,995
   - Available: In stock
   - Key Features: 35-mile electric range, 400hp combined output, Pilot Assist
   - Match Score: 93%

3. 2025 Tesla Model Y Long Range (Stock #TY2468)
   - MSRP: $54,990
   - Available: 2-week delivery
   - Key Features: 330-mile range, Autopilot, 5-star safety
   - Match Score: 88%

CONVERSATION INTELLIGENCE
------------------------
Key Topics Discussed:
- Electric vs. hybrid technology comparison
- Charging infrastructure at home and work
- Performance comparisons between models
- Trade-in valuation expectations
- Financing options and incentives
- Test drive availability

Customer Verbatims:
"I'm really looking for something that balances luxury with efficiency."
"The RAV4 Prime seems like the perfect compromise between range anxiety and efficiency."
"I'd need at least $35K for my BMW to make the numbers work."
"I could come in this Saturday morning if you have those models available to test."

SUGGESTED APPROACH
-----------------
1. Call immediately (high-intent, ready-to-buy customer)
2. Lead with availability of RAV4 Prime and Volvo XC60 for test drives
3. Prepare preliminary trade-in valuation for BMW X3
4. Highlight federal and state tax incentives for PHEVs
5. Confirm Saturday availability for test drives
6. Prepare comparison of total cost of ownership between top models

Follow-up Required: URGENT (within 30 minutes)
Suggested Sales Rep: Jennifer Liu (hybrid/EV specialist)

FULL CONVERSATION TRANSCRIPT
---------------------------
[Available in the customer portal]
Conversation ID: 12345-ABC-67890
URL: https://dealership.rylie-ai.com/conversations/12345-ABC-67890
```

---

For assistance with handover dossier customization, contact Rylie AI support at support@rylie-ai.com