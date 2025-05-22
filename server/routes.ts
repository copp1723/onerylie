import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { apiKeyAuth, type AuthenticatedRequest } from "./middleware/auth";
import { generateResponse, detectEscalationKeywords, analyzeMessageForVehicleIntent, type ConversationContext, type PersonaArguments, type HandoverDossier } from "./services/openai";
import { sendHandoverEmail, sendConversationSummary } from "./services/email";
import { generateABTestedResponse } from "./services/abtest-openai-integration";
import { processScheduledReports } from "./services/scheduler";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import MemoryStore from "memorystore";
import emailReportRoutes from "./routes/email-reports";
import reportApiRoutes from "./routes/report-api";
import abtestRoutes from "./routes/abtest-routes";
import personaRoutes from "./routes/persona-routes";
import { log } from "./vite";

// Define validation schemas
const inboundMessageSchema = z.object({
  customerMessage: z.string(),
  customerName: z.string(),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email().optional(),
  dealershipId: z.number(),
  conversationId: z.number().optional(),
  channel: z.string().default("sms"),
  campaignContext: z.string().optional(),
  inventoryContext: z.string().optional(),
});

const replySchema = z.object({
  conversationId: z.number(),
  message: z.string(),
});

const handoverSchema = z.object({
  conversationId: z.number(),
  reason: z.string().optional(),
  assignToUserId: z.number().optional(),
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up session management
  const MemoryStoreSession = MemoryStore(session);
  app.use(session({
    secret: process.env.SESSION_SECRET || "rylie-ai-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 24 * 60 * 60 * 1000 },
    store: new MemoryStoreSession({
      checkPeriod: 86400000 // 24 hours
    })
  }));

  // Initialize passport for user authentication
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      // In production, compare with hashed password
      if (user.password !== password) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Register email report routes
  app.use('/api/dealerships', emailReportRoutes);
  
  // Register report trigger route
  app.use('/api/reports', reportApiRoutes);
  
  // Register A/B testing routes
  app.use('/api/abtest', abtestRoutes);
  
  // Register persona management routes
  app.use('/api/personas', personaRoutes);
  
  // Set up scheduled task to process email reports
  // In a production environment, this would be handled by a proper scheduler
  // For this demo, we'll check every minute if any reports are due
  setInterval(async () => {
    try {
      await processScheduledReports();
      log('Processed scheduled reports', 'scheduler');
    } catch (error) {
      console.error('Error processing scheduled reports:', error);
    }
  }, 60 * 1000); // Check every minute

  // Authentication routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      passport.authenticate('local', (err, user, info) => {
        if (err) {
          return res.status(500).json({ message: 'Authentication error' });
        }
        if (!user) {
          return res.status(401).json({ message: info.message || 'Authentication failed' });
        }
        req.login(user, (err) => {
          if (err) {
            return res.status(500).json({ message: 'Login error' });
          }
          
          // Store the complete user object in the session
          req.session.user = user;
          req.session.userId = user.id;
          req.session.role = user.role;
          
          return res.json({ 
            id: user.id,
            username: user.username,
            name: user.name,
            email: user.email,
            role: user.role,
            dealershipId: user.dealershipId
          });
        });
      })(req, res);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input', errors: error.errors });
      }
      return res.status(500).json({ message: 'Server error' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.logout(() => {
      res.json({ message: 'Logged out successfully' });
    });
  });

  app.get('/api/auth/me', (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    const user = req.user as any;
    return res.json({ 
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role
    });
  });

  // API endpoints for Rylie
  // 1. Inbound message endpoint
  app.post('/api/inbound', apiKeyAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { 
        customerMessage, 
        customerName, 
        customerPhone, 
        customerEmail, 
        conversationId,
        channel,
        campaignContext,
        inventoryContext
      } = inboundMessageSchema.parse({
        ...req.body,
        dealershipId: req.dealershipId
      });

      // Get the dealership info
      const dealership = await storage.getDealership(req.dealershipId!);
      if (!dealership) {
        return res.status(404).json({ message: 'Dealership not found' });
      }

      // Check for escalation keywords
      const shouldEscalateBasedOnKeywords = detectEscalationKeywords(customerMessage);

      let conversation;
      let previousMessages = [];

      // Get or create conversation
      if (conversationId) {
        conversation = await storage.getConversation(conversationId);
        if (!conversation) {
          return res.status(404).json({ message: 'Conversation not found' });
        }

        // Get previous messages
        const messageHistory = await storage.getMessagesByConversation(conversationId);
        previousMessages = messageHistory.map(msg => ({
          role: msg.isFromCustomer ? 'customer' : 'assistant',
          content: msg.content
        }));
      } else {
        // Create a new conversation
        conversation = await storage.createConversation({
          dealershipId: req.dealershipId!,
          customerName,
          customerPhone,
          customerEmail,
          campaignContext,
          inventoryContext,
          status: 'active'
        });
      }

      // We'll create the customer message later to get the message ID for A/B testing

      // If we should escalate based on keywords, do it immediately
      if (shouldEscalateBasedOnKeywords) {
        await storage.updateConversationStatus(conversation.id, 'escalated');
        return res.json({
          conversationId: conversation.id,
          response: "I'll connect you with one of our representatives who can help with your specific request. They'll be in touch with you shortly.",
          status: 'escalated',
          escalationReason: 'Detected sensitive topic requiring human assistance'
        });
      }

      // Analyze message for vehicle intent
      const vehicleIntent = await analyzeMessageForVehicleIntent(customerMessage);
      
      // Find relevant vehicles based on intent
      let relevantVehicles = [];
      if (vehicleIntent.make || vehicleIntent.model) {
        const searchQuery = [vehicleIntent.make, vehicleIntent.model].filter(Boolean).join(' ');
        if (searchQuery) {
          relevantVehicles = await storage.searchVehicles(req.dealershipId!, searchQuery);
        }
      }

      // Get the default persona for this dealership
      const persona = await storage.getDefaultPersonaForDealership(req.dealershipId!);
      if (!persona) {
        return res.status(404).json({ message: 'No default persona configured for this dealership' });
      }

      // Build context for the AI
      const context: ConversationContext = {
        customerName,
        dealershipName: dealership.name,
        campaignContext: campaignContext || conversation.campaignContext || undefined,
        previousMessages,
        relevantVehicles
      };

      // Create message record first to get the message ID
      const message = await storage.createMessage({
        conversationId: conversation.id,
        content: customerMessage,
        isFromCustomer: true,
        channel,
      });
      
      // Generate AI response with A/B testing and potential handover dossier
      const { 
        response, 
        shouldEscalate, 
        reason, 
        handoverDossier,
        variantId 
      } = await generateABTestedResponse(
        customerMessage,
        context,
        persona.promptTemplate,
        persona.arguments as PersonaArguments,
        req.dealershipId!,
        conversation,
        message
      );

      // Store the AI response
      await storage.createMessage({
        conversationId: conversation.id,
        content: response,
        isFromCustomer: false,
        channel,
      });

      // Update conversation status if needed
      if (shouldEscalate) {
        await storage.updateConversationStatus(conversation.id, 'escalated');
        
        // Handle the handover process with email if configured
        if (handoverDossier && persona.arguments && persona.arguments.handoverEmail) {
          try {
            // Send the handover dossier to the configured email
            await sendHandoverEmail({
              toEmail: persona.arguments.handoverEmail as string,
              fromEmail: `rylie@${dealership.domain || 'rylie-ai.com'}`,
              dossier: handoverDossier
            });
            
            console.log(`Handover dossier sent to ${persona.arguments.handoverEmail} for conversation ${conversation.id}`);
          } catch (emailError) {
            console.error('Error sending handover email:', emailError);
          }
        }
      }

      // Return the response
      return res.json({
        conversationId: conversation.id,
        response,
        status: shouldEscalate ? 'escalated' : 'active',
        escalationReason: shouldEscalate ? reason : undefined
      });
    } catch (error) {
      console.error('Error processing inbound message:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input', errors: error.errors });
      }
      return res.status(500).json({ message: 'Server error processing inbound message' });
    }
  });

  // 2. Reply endpoint - get AI response only
  app.post('/api/reply', apiKeyAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { conversationId, message } = replySchema.parse(req.body);

      // Verify the conversation belongs to this dealership
      const conversation = await storage.getConversation(conversationId);
      if (!conversation || conversation.dealershipId !== req.dealershipId) {
        return res.status(404).json({ message: 'Conversation not found' });
      }

      // Get the dealership info
      const dealership = await storage.getDealership(req.dealershipId!);
      if (!dealership) {
        return res.status(404).json({ message: 'Dealership not found' });
      }

      // Get previous messages
      const messageHistory = await storage.getMessagesByConversation(conversationId);
      const previousMessages = messageHistory.map(msg => ({
        role: msg.isFromCustomer ? 'customer' : 'assistant',
        content: msg.content
      }));

      // Get the default persona for this dealership
      const persona = await storage.getDefaultPersonaForDealership(req.dealershipId!);
      if (!persona) {
        return res.status(404).json({ message: 'No default persona configured for this dealership' });
      }

      // Build context for the AI
      const context: ConversationContext = {
        customerName: conversation.customerName,
        dealershipName: dealership.name,
        campaignContext: conversation.campaignContext || undefined,
        previousMessages,
      };

      // Store the customer message to get message ID for A/B testing
      const customerMessage = await storage.createMessage({
        conversationId: conversation.id,
        content: message,
        isFromCustomer: true,
        channel: 'api',
      });
      
      // Generate AI response with A/B testing and potential handover dossier
      const { 
        response, 
        shouldEscalate, 
        reason, 
        handoverDossier,
        variantId 
      } = await generateABTestedResponse(
        message,
        context,
        persona.promptTemplate,
        persona.arguments as PersonaArguments,
        req.dealershipId!,
        conversation,
        customerMessage
      );

      // Handle the handover process with email if configured and if should escalate
      if (shouldEscalate && handoverDossier && persona.arguments && persona.arguments.handoverEmail) {
        try {
          // Send the handover dossier to the configured email
          await sendHandoverEmail({
            toEmail: persona.arguments.handoverEmail as string,
            fromEmail: `rylie@${dealership.domain || 'rylie-ai.com'}`,
            dossier: handoverDossier
          });
          
          console.log(`Handover dossier sent to ${persona.arguments.handoverEmail} for conversation ${conversationId}`);
        } catch (emailError) {
          console.error('Error sending handover email:', emailError);
        }
      }

      // Return the response without storing it
      return res.json({
        response,
        shouldEscalate,
        escalationReason: shouldEscalate ? reason : undefined
      });
    } catch (error) {
      console.error('Error generating reply:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input', errors: error.errors });
      }
      return res.status(500).json({ message: 'Server error generating reply' });
    }
  });

  // 3. Handover endpoint - escalate to human
  app.post('/api/handover', apiKeyAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { conversationId, reason, assignToUserId } = handoverSchema.parse(req.body);

      // Verify the conversation belongs to this dealership
      const conversation = await storage.getConversation(conversationId);
      if (!conversation || conversation.dealershipId !== req.dealershipId) {
        return res.status(404).json({ message: 'Conversation not found' });
      }

      // Escalate the conversation
      const updatedConversation = await storage.escalateConversation(
        conversationId, 
        assignToUserId || 0
      );

      // Add system message about escalation
      await storage.createMessage({
        conversationId,
        content: `Conversation escalated to human support. Reason: ${reason || 'Not specified'}`,
        isFromCustomer: false,
        channel: 'system',
        metadata: { reason, escalatedBy: req.apiKey }
      });

      return res.json({
        success: true,
        conversation: updatedConversation
      });
    } catch (error) {
      console.error('Error handling handover:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input', errors: error.errors });
      }
      return res.status(500).json({ message: 'Server error processing handover' });
    }
  });

  // Admin API routes for dashboard
  // Dealerships
  app.get('/api/dealerships', async (req, res) => {
    try {
      const dealerships = await storage.getDealerships();
      res.json(dealerships);
    } catch (error) {
      console.error('Error fetching dealerships:', error);
      res.status(500).json({ message: 'Server error fetching dealerships' });
    }
  });

  // Conversations
  app.get('/api/dealerships/:dealershipId/conversations', async (req, res) => {
    try {
      const dealershipId = parseInt(req.params.dealershipId);
      const conversations = await storage.getConversationsByDealership(dealershipId);
      res.json(conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      res.status(500).json({ message: 'Server error fetching conversations' });
    }
  });

  // Conversation details with messages
  app.get('/api/conversations/:conversationId', async (req, res) => {
    try {
      const conversationId = parseInt(req.params.conversationId);
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }
      
      const messages = await storage.getMessagesByConversation(conversationId);
      res.json({ conversation, messages });
    } catch (error) {
      console.error('Error fetching conversation details:', error);
      res.status(500).json({ message: 'Server error fetching conversation details' });
    }
  });
  
  // Send conversation summary via email
  const emailConversationSchema = z.object({
    conversationId: z.number(),
    emailTo: z.string().email(),
    emailFrom: z.string().email().optional(),
    subject: z.string().optional(),
  });
  
  app.post('/api/conversations/:conversationId/email', async (req, res) => {
    try {
      const { conversationId, emailTo, emailFrom, subject } = emailConversationSchema.parse({
        ...req.body,
        conversationId: parseInt(req.params.conversationId)
      });
      
      // Get conversation details
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }
      
      // Get all messages for the conversation
      const messages = await storage.getMessagesByConversation(conversationId);
      
      // Get dealership information
      const dealership = await storage.getDealership(conversation.dealershipId);
      if (!dealership) {
        return res.status(404).json({ message: 'Dealership not found' });
      }
      
      // Send the email
      const result = await sendConversationSummary({
        toEmail: emailTo,
        fromEmail: emailFrom || `rylie@${dealership.domain || 'rylie-ai.com'}`,
        conversation,
        messages,
        dealershipName: dealership.name
      });
      
      if (result) {
        // Log email sending activity
        await storage.createMessage({
          conversationId,
          content: `Conversation summary sent to ${emailTo}`,
          isFromCustomer: false,
          channel: 'system',
        });
        
        return res.json({ success: true, message: `Conversation summary sent to ${emailTo}` });
      } else {
        return res.status(500).json({ message: 'Failed to send email' });
      }
    } catch (error) {
      console.error('Error sending conversation summary email:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input', errors: error.errors });
      }
      return res.status(500).json({ message: 'Server error sending email' });
    }
  });

  // Inventory
  app.get('/api/dealerships/:dealershipId/inventory', async (req, res) => {
    try {
      const dealershipId = parseInt(req.params.dealershipId);
      const vehicles = await storage.getVehiclesByDealership(dealershipId);
      res.json(vehicles);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      res.status(500).json({ message: 'Server error fetching inventory' });
    }
  });

  // Personas
  app.get('/api/dealerships/:dealershipId/personas', async (req, res) => {
    try {
      const dealershipId = parseInt(req.params.dealershipId);
      const personas = await storage.getPersonasByDealership(dealershipId);
      res.json(personas);
    } catch (error) {
      console.error('Error fetching personas:', error);
      res.status(500).json({ message: 'Server error fetching personas' });
    }
  });

  // API Keys
  app.get('/api/dealerships/:dealershipId/apikeys', async (req, res) => {
    try {
      const dealershipId = parseInt(req.params.dealershipId);
      const apiKeys = await storage.getApiKeysByDealership(dealershipId);
      
      // Mask the actual key values for security
      const maskedKeys = apiKeys.map(key => ({
        ...key,
        key: `${key.key.substring(0, 8)}...${key.key.substring(key.key.length - 4)}`
      }));
      
      res.json(maskedKeys);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      res.status(500).json({ message: 'Server error fetching API keys' });
    }
  });

  // Generate new API key
  app.post('/api/dealerships/:dealershipId/apikeys', async (req, res) => {
    try {
      const dealershipId = parseInt(req.params.dealershipId);
      const { description } = req.body;
      
      const apiKey = await storage.generateApiKey(dealershipId, description);
      res.json(apiKey);
    } catch (error) {
      console.error('Error generating API key:', error);
      res.status(500).json({ message: 'Server error generating API key' });
    }
  });

  return httpServer;
}
