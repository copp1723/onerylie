/**
 * A/B Testing API Routes
 * 
 * This file contains endpoints for managing prompt variants and experiments
 * used for optimizing Rylie's conversational capabilities.
 */

import { Router, Request, Response } from 'express';
import { isAuthenticated, isAdmin, apiKeyAuth } from '../middleware/auth';
import type { AuthenticatedRequest } from '../middleware/auth';
import { z } from 'zod';
import * as abtest from '../services/abtest';
import { storage } from '../storage';

const router = Router();

// Schemas for validation
const createPromptVariantSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  promptTemplate: z.string().min(10, "Prompt template must be at least 10 characters"),
  isControl: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

const createExperimentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  isActive: z.boolean().optional(),
  variantAssignments: z.array(z.object({
    variantId: z.number().positive(),
    trafficAllocation: z.number().min(1).max(100)
  })).min(2, "At least 2 variants are required")
});

const rateConversationSchema = z.object({
  rating: z.number().min(1).max(5),
  wasSuccessful: z.boolean()
});

// Routes accessible only to authenticated users with admin privileges
// GET /api/abtest/variants - Get all prompt variants for a dealership
router.get('/variants', isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dealershipId = req.query.dealershipId 
      ? parseInt(req.query.dealershipId as string) 
      : req.user?.dealershipId;
    
    if (!dealershipId) {
      return res.status(400).json({ message: "Dealership ID is required" });
    }

    const includeInactive = req.query.includeInactive === 'true';
    const variants = await abtest.getPromptVariants(dealershipId, includeInactive);
    res.json(variants);
  } catch (error) {
    console.error('Error getting prompt variants:', error);
    res.status(500).json({ message: "Failed to get prompt variants" });
  }
});

// POST /api/abtest/variants - Create a new prompt variant
router.post('/variants', isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dealershipId = req.body.dealershipId || req.user?.dealershipId;
    
    if (!dealershipId) {
      return res.status(400).json({ message: "Dealership ID is required" });
    }

    const validatedData = createPromptVariantSchema.parse(req.body);
    
    const variant = await abtest.createPromptVariant(dealershipId, validatedData);
    res.status(201).json(variant);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    console.error('Error creating prompt variant:', error);
    res.status(500).json({ message: "Failed to create prompt variant" });
  }
});

// GET /api/abtest/variants/:id - Get a specific prompt variant
router.get('/variants/:id', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const variantId = parseInt(req.params.id);
    
    if (isNaN(variantId)) {
      return res.status(400).json({ message: "Invalid variant ID" });
    }

    const variant = await storage.getPromptVariant(variantId);
    
    if (!variant) {
      return res.status(404).json({ message: "Prompt variant not found" });
    }

    res.json(variant);
  } catch (error) {
    console.error('Error getting prompt variant:', error);
    res.status(500).json({ message: "Failed to get prompt variant" });
  }
});

// PUT /api/abtest/variants/:id - Update a prompt variant
router.put('/variants/:id', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const variantId = parseInt(req.params.id);
    
    if (isNaN(variantId)) {
      return res.status(400).json({ message: "Invalid variant ID" });
    }

    const validatedData = createPromptVariantSchema.partial().parse(req.body);
    
    const updatedVariant = await storage.updatePromptVariant(variantId, validatedData);
    
    if (!updatedVariant) {
      return res.status(404).json({ message: "Prompt variant not found" });
    }

    res.json(updatedVariant);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    console.error('Error updating prompt variant:', error);
    res.status(500).json({ message: "Failed to update prompt variant" });
  }
});

// GET /api/abtest/experiments - Get all active experiments for a dealership
router.get('/experiments', isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dealershipId = req.query.dealershipId 
      ? parseInt(req.query.dealershipId as string) 
      : req.user?.dealershipId;
    
    if (!dealershipId) {
      return res.status(400).json({ message: "Dealership ID is required" });
    }

    // If includeAll=true, get all experiments, otherwise just active ones
    if (req.query.includeAll === 'true') {
      const experiments = await storage.getPromptExperiments(dealershipId);
      res.json(experiments);
    } else {
      const activeExperiments = await abtest.getActiveExperiments(dealershipId);
      res.json(activeExperiments);
    }
  } catch (error) {
    console.error('Error getting experiments:', error);
    res.status(500).json({ message: "Failed to get experiments" });
  }
});

// POST /api/abtest/experiments - Create a new experiment
router.post('/experiments', isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dealershipId = req.body.dealershipId || req.user?.dealershipId;
    
    if (!dealershipId) {
      return res.status(400).json({ message: "Dealership ID is required" });
    }

    const validatedData = createExperimentSchema.parse(req.body);
    
    const experiment = await abtest.createExperiment(dealershipId, validatedData);
    res.status(201).json(experiment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    console.error('Error creating experiment:', error);
    res.status(500).json({ 
      message: error instanceof Error ? error.message : "Failed to create experiment" 
    });
  }
});

// GET /api/abtest/experiments/:id - Get a specific experiment with its variants
router.get('/experiments/:id', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const experimentId = parseInt(req.params.id);
    
    if (isNaN(experimentId)) {
      return res.status(400).json({ message: "Invalid experiment ID" });
    }

    const experiment = await storage.getPromptExperimentWithVariants(experimentId);
    
    if (!experiment) {
      return res.status(404).json({ message: "Experiment not found" });
    }

    res.json(experiment);
  } catch (error) {
    console.error('Error getting experiment:', error);
    res.status(500).json({ message: "Failed to get experiment" });
  }
});

// GET /api/abtest/experiments/:id/results - Get results for a specific experiment
router.get('/experiments/:id/results', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const experimentId = parseInt(req.params.id);
    
    if (isNaN(experimentId)) {
      return res.status(400).json({ message: "Invalid experiment ID" });
    }

    const results = await abtest.getExperimentResults(experimentId);
    res.json(results);
  } catch (error) {
    console.error('Error getting experiment results:', error);
    res.status(500).json({ message: "Failed to get experiment results" });
  }
});

// PUT /api/abtest/experiments/:id/end - End an experiment
router.put('/experiments/:id/end', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
  try {
    const experimentId = parseInt(req.params.id);
    
    if (isNaN(experimentId)) {
      return res.status(400).json({ message: "Invalid experiment ID" });
    }

    const { conclusionNotes } = req.body;
    const success = await abtest.endExperiment(experimentId, conclusionNotes);
    
    if (!success) {
      return res.status(404).json({ message: "Experiment not found" });
    }

    res.json({ message: "Experiment ended successfully" });
  } catch (error) {
    console.error('Error ending experiment:', error);
    res.status(500).json({ message: "Failed to end experiment" });
  }
});

// POST /api/abtest/conversations/:id/rate - Rate a conversation (for feedback)
router.post('/conversations/:id/rate', apiKeyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const conversationId = parseInt(req.params.id);
    
    if (isNaN(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation ID" });
    }

    const validatedData = rateConversationSchema.parse(req.body);
    
    const success = await abtest.rateConversation(
      conversationId, 
      validatedData.rating,
      validatedData.wasSuccessful
    );
    
    if (!success) {
      return res.status(404).json({ message: "Conversation not found or not part of an experiment" });
    }

    res.json({ message: "Feedback recorded successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    console.error('Error rating conversation:', error);
    res.status(500).json({ message: "Failed to record feedback" });
  }
});

export default router;