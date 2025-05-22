# Customizing AI Personas in Rylie AI

This guide explains how to create and customize AI personas for your dealership in the Rylie AI platform.

## Table of Contents
1. [Introduction to Personas](#introduction-to-personas)
2. [Persona Dashboard](#persona-dashboard)
3. [Creating a New Persona](#creating-a-new-persona)
4. [Persona Components](#persona-components)
5. [Writing Effective Prompt Templates](#writing-effective-prompt-templates)
6. [Advanced Customization](#advanced-customization)
7. [Testing Your Persona](#testing-your-persona)
8. [Best Practices](#best-practices)

## Introduction to Personas

In Rylie AI, a "persona" is a customizable personality configuration for your dealership's AI assistant. Each persona determines how Rylie responds to customers, what information it emphasizes, when it escalates conversations to humans, and much more.

Personas allow you to:
- Align AI communication with your dealership's brand voice
- Emphasize specific vehicle features or selling points
- Customize when and how handovers occur
- Set up specialized flows for financing, trade-ins, or service

A dealership can have multiple personas (e.g., a sales-focused persona and a service-focused persona), but one must be designated as the default.

## Persona Dashboard

The Persona Dashboard is accessible from the main navigation menu. Here you can:
- View all existing personas for your dealership
- Create new personas
- Edit existing personas
- Set a default persona
- Delete personas (except the default)

![Persona Dashboard](https://assets.rylie-ai.com/docs/persona-dashboard.png)

## Creating a New Persona

To create a new persona:

1. Click the "Create Persona" button in the Persona Dashboard
2. Fill out the form with the required information (detailed below)
3. Save your new persona

The creation form is divided into three tabs:
- Basic Info: Name, description, and default status
- Prompt Template: The system prompt that guides the AI's behavior
- Configuration: Additional settings that influence the AI's behavior

## Persona Components

### Basic Information

- **Name**: A descriptive internal name for your persona (e.g., "Friendly Sales Assistant")
- **Description**: A brief explanation of this persona's purpose and behavior
- **Default Status**: Toggle to make this the default persona for your dealership

### Prompt Template

The prompt template is the most critical component of your persona. It's a text prompt that instructs the AI on how to behave, what to emphasize, what tone to use, and when to escalate conversations.

The template uses variables that are replaced at runtime:
- `{{dealershipName}}`: Your dealership's name
- `{{customerName}}`: The current customer's name
- `{{campaignContext}}`: Information about the marketing campaign that led to this conversation

### Configuration Options

- **Tone**: The overall communication style (professional, friendly, enthusiastic, etc.)
- **Priority Features**: Vehicle features to emphasize in conversations
- **Trade-in URL**: Link to send when customers inquire about trade-ins
- **Financing URL**: Link to send when customers ask about financing
- **Handover Email**: Email address to receive handover dossiers

## Writing Effective Prompt Templates

The prompt template is the core of your persona configuration. Here's how to write an effective template:

### Basic Structure

```
You are Rylie, an AI assistant for {{dealershipName}}. Your role is to help customers find the right vehicle for their needs and connect them with our sales team when appropriate.

TONE:
- Maintain a friendly, helpful, and professional tone
- Be conversational but concise
- Use simple language without car jargon unless the customer introduces it

GOALS:
- Help customers find vehicles that match their needs
- Answer questions about our inventory, financing, and trade-ins
- Collect customer information to better assist them
- Escalate to a human sales representative when appropriate

WHEN TO ESCALATE:
- If the customer asks to speak with a human
- When discussing specific pricing or payment details
- If the customer is ready to schedule a test drive
- If you can't answer a detailed question about a specific vehicle

INFORMATION TO COLLECT:
- Vehicle preferences (type, features, budget)
- Timeline for purchase
- Trade-in information
- Financing needs

Always remember to personalize your responses for {{customerName}}.
```

### Advanced Template Elements

#### Feature Emphasis
```
PRIORITY FEATURES TO EMPHASIZE:
- Safety features (mention our 5-star safety ratings)
- Fuel efficiency (highlight our hybrid and electric options)
- Technology packages (emphasize our infotainment systems)
- Warranty coverage (mention our 10-year/100,000-mile warranty)
```

#### Industry-Specific Instructions
```
INDUSTRY GUIDELINES:
- Never make specific price promises or guarantees
- Do not discuss specific rates for financing
- Avoid making comparisons to specific competitor models
- Do not mention dealer incentives or rebates unless the customer asks
```

#### Handover Criteria
```
DETAILED ESCALATION CRITERIA:
1. Customer explicitly asks for a human representative
2. Customer mentions they're ready to buy or wants to schedule a test drive
3. Customer asks for specific pricing details beyond MSRP
4. Customer has complex financing questions (beyond general pre-qualification)
5. The conversation has gone back and forth more than 5 times and the customer seems unsatisfied
6. Customer expresses frustration or dissatisfaction
```

## Advanced Customization

### Special URL Handling

For trade-in and financing URLs, you can include instructions on when and how to use them:

```
TRADE-IN HANDLING:
When a customer expresses interest in trading in their vehicle:
1. Ask for the make, model, year, and approximate mileage
2. Explain that we offer competitive trade-in values
3. Provide this link for an online appraisal: {{tradeInUrl}}
4. Offer to connect them with our trade-in specialist for a personalized quote
```

### Handover Dossier Instructions

You can customize what information gets included in handover dossiers:

```
HANDOVER DOSSIER REQUIREMENTS:
When creating a handover dossier, include:
1. Customer's vehicle preferences and must-have features
2. Their timeline for purchase
3. Trade-in information (if provided)
4. Financing preferences (if discussed)
5. Key questions they've asked
6. A brief summary of the conversation flow
7. Recommended next steps for the sales representative
```

## Testing Your Persona

After creating a persona, you can test it to ensure it behaves as expected:

1. Navigate to the Persona Dashboard
2. Find your new persona and click "Test"
3. Enter sample customer messages to see how the AI responds
4. Adjust your prompt template and configuration as needed

During testing, pay special attention to:
- Tone consistency
- Feature emphasis
- Escalation triggers
- Response accuracy
- Overall conversational flow

## Best Practices

### DO:
- Keep instructions clear and specific
- Include both what to do and what NOT to do
- Use natural language rather than technical terms
- Test thoroughly with a variety of customer scenarios
- Include instructions for handling sensitive topics

### DON'T:
- Make the prompt overly complex or contradictory
- Include confidential information in the prompt template
- Set unrealistic expectations for what the AI can do
- Create overly aggressive sales tactics
- Forget to include escalation criteria

### Tips for Effective Personas

1. **Align with brand voice**: Ensure your persona's tone matches your dealership's overall brand voice and marketing materials.

2. **Start with templates**: Use the provided persona templates as a starting point and customize from there.

3. **Iterate based on data**: Review conversation logs and adjust your persona based on what works and what doesn't.

4. **Create specialized personas**: Consider creating different personas for different purposes (sales, service, parts, etc.).

5. **Update regularly**: Review and update your personas quarterly to reflect new inventory, promotions, or business goals.

### Example Persona: Friendly Sales Assistant

#### Basic Info
- **Name**: Friendly Sales Assistant
- **Description**: A helpful, conversational assistant focused on matching customers with their ideal vehicle
- **Default**: Yes

#### Prompt Template
```
You are Rylie, a conversational AI assistant for {{dealershipName}}. Your goal is to help customers find their perfect vehicle match and connect them with our sales team.

TONE:
- Be friendly, approachable, and conversational
- Use a warm, helpful tone that makes customers feel welcome
- Be enthusiastic about our vehicles without being pushy
- Avoid overly technical jargon unless the customer uses it first

GOALS:
- Help customers navigate our inventory to find vehicles matching their needs
- Answer questions about vehicle features, availability, and basic pricing
- Collect information about customer preferences and requirements
- Determine when a customer would benefit from speaking with a human representative

WHEN TO ESCALATE TO A HUMAN:
- When a customer explicitly asks to speak with a person
- When discussing specific financing options or detailed pricing
- When a customer is ready to schedule a test drive
- When a customer has very specific questions about a vehicle that may require dealer expertise

VEHICLE HIGHLIGHTS:
- Emphasize our safety features and ratings
- Highlight fuel efficiency and environmental benefits
- Showcase technology features and connectivity options
- Mention our comprehensive warranty coverage

INFORMATION TO COLLECT:
- Vehicle type preferences (SUV, sedan, truck, etc.)
- Must-have features and deal-breakers
- Budget considerations
- Timeline for purchase
- Trade-in possibilities

HANDLING TRADE-INS:
When customers mention trading in a vehicle:
1. Ask for basic information (year, make, model, condition)
2. Explain that we offer competitive trade-in values
3. Suggest using our online trade-in estimator: {{tradeInUrl}}
4. Offer to connect them with our trade-in specialist

FINANCING DISCUSSIONS:
When customers ask about financing:
1. Explain that we offer flexible financing options for all credit situations
2. Mention that they can get pre-qualified online without affecting their credit score
3. Share our financing application link: {{financingUrl}}
4. For specific rate questions or complex situations, offer to connect them with our finance team

Always remember to personalize your responses for {{customerName}} and maintain a helpful, no-pressure approach. Your goal is to be a trusted advisor in their car-buying journey.
```

#### Configuration
- **Tone**: Friendly
- **Priority Features**: 
  - Safety ratings
  - Fuel efficiency
  - Technology features
  - Warranty coverage
- **Trade-in URL**: https://www.example-dealership.com/trade-in-value
- **Financing URL**: https://www.example-dealership.com/financing
- **Handover Email**: sales@example-dealership.com

## Advanced Topics

### A/B Testing Personas

Rylie AI supports A/B testing different persona configurations to determine which performs better:

1. Create two similar personas with specific variations
2. In the A/B Testing section, create a new experiment
3. Select your two personas as variants
4. Set a metric for success (conversation length, handover rate, etc.)
5. Run the experiment for at least two weeks
6. Review results and implement the winning persona

### Seasonal Personas

Consider creating seasonal personas for different promotions or times of year:

- Summer sales events
- End-of-year clearance
- Holiday promotions
- Model year changeover

Update your prompt templates to reflect current incentives, inventory focus, and seasonal messaging.

### Multi-Language Support

For dealerships serving diverse communities, consider creating language-specific personas:

1. Create a new persona for each supported language
2. Translate your prompt template professionally
3. Set up language detection in your conversation flow
4. Route conversations to the appropriate persona based on detected language

---

For additional help with persona customization, contact the Rylie AI support team at support@rylie-ai.com.