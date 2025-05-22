import { Router, Request, Response } from 'express';
import { apiKeyAuth, type AuthenticatedRequest, sessionAuth } from '../middleware/auth';
import { z } from 'zod';
import { db } from '../db';
import { 
  promptVariants, 
  promptExperiments, 
  experimentVariants, 
  insertPromptVariantSchema,
  insertPromptExperimentSchema,
  insertExperimentVariantSchema
} from '@shared/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { abTestService } from '../services/abtest';

const router = Router();

// ==================== Prompt Variants Routes ====================

// Create a new prompt variant
router.post('/variants', apiKeyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dealershipId = req.dealershipId;
    if (!dealershipId) {
      return res.status(403).json({ message: 'Not authorized to create prompt variants' });
    }
    
    // Validate request body
    const variantData = insertPromptVariantSchema.parse({
      ...req.body,
      dealershipId
    });
    
    // If this is set as a control variant, check if there's already a control variant for this dealership
    if (variantData.isControl) {
      const existingControl = await db.query.promptVariants.findFirst({
        where: and(
          eq(promptVariants.dealershipId, dealershipId),
          eq(promptVariants.isControl, true)
        )
      });
      
      if (existingControl) {
        return res.status(400).json({ 
          message: 'A control variant already exists for this dealership. Please update the existing control or set isControl to false.'
        });
      }
    }
    
    // Create the variant
    const [variant] = await db.insert(promptVariants).values(variantData).returning();
    
    return res.status(201).json(variant);
  } catch (error) {
    console.error('Error creating prompt variant:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid variant data', errors: error.errors });
    }
    return res.status(500).json({ message: 'Error creating prompt variant' });
  }
});

// Get all prompt variants for a dealership
router.get('/variants', apiKeyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dealershipId = req.dealershipId;
    if (!dealershipId) {
      return res.status(403).json({ message: 'Not authorized to access prompt variants' });
    }
    
    const variants = await db.query.promptVariants.findMany({
      where: eq(promptVariants.dealershipId, dealershipId),
      orderBy: (promptVariants, { desc }) => [
        desc(promptVariants.isControl),
        desc(promptVariants.updatedAt)
      ]
    });
    
    return res.json(variants);
  } catch (error) {
    console.error('Error fetching prompt variants:', error);
    return res.status(500).json({ message: 'Error fetching prompt variants' });
  }
});

// Get a single prompt variant by ID
router.get('/variants/:id', apiKeyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dealershipId = req.dealershipId;
    if (!dealershipId) {
      return res.status(403).json({ message: 'Not authorized to access this prompt variant' });
    }
    
    const variantId = parseInt(req.params.id);
    
    const variant = await db.query.promptVariants.findFirst({
      where: and(
        eq(promptVariants.id, variantId),
        eq(promptVariants.dealershipId, dealershipId)
      )
    });
    
    if (!variant) {
      return res.status(404).json({ message: 'Prompt variant not found' });
    }
    
    return res.json(variant);
  } catch (error) {
    console.error('Error fetching prompt variant:', error);
    return res.status(500).json({ message: 'Error fetching prompt variant' });
  }
});

// Update a prompt variant
router.patch('/variants/:id', apiKeyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dealershipId = req.dealershipId;
    if (!dealershipId) {
      return res.status(403).json({ message: 'Not authorized to update this prompt variant' });
    }
    
    const variantId = parseInt(req.params.id);
    
    // Check if variant exists and belongs to the dealership
    const existingVariant = await db.query.promptVariants.findFirst({
      where: and(
        eq(promptVariants.id, variantId),
        eq(promptVariants.dealershipId, dealershipId)
      )
    });
    
    if (!existingVariant) {
      return res.status(404).json({ message: 'Prompt variant not found' });
    }
    
    // If setting this as control variant, clear any existing control variants
    if (req.body.isControl) {
      await db
        .update(promptVariants)
        .set({ isControl: false })
        .where(and(
          eq(promptVariants.dealershipId, dealershipId),
          eq(promptVariants.isControl, true)
        ));
    }
    
    // Update the variant
    const [updatedVariant] = await db
      .update(promptVariants)
      .set({
        ...req.body,
        updatedAt: new Date()
      })
      .where(eq(promptVariants.id, variantId))
      .returning();
    
    return res.json(updatedVariant);
  } catch (error) {
    console.error('Error updating prompt variant:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid variant data', errors: error.errors });
    }
    return res.status(500).json({ message: 'Error updating prompt variant' });
  }
});

// Delete a prompt variant
router.delete('/variants/:id', apiKeyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dealershipId = req.dealershipId;
    if (!dealershipId) {
      return res.status(403).json({ message: 'Not authorized to delete this prompt variant' });
    }
    
    const variantId = parseInt(req.params.id);
    
    // Check if variant exists and belongs to the dealership
    const existingVariant = await db.query.promptVariants.findFirst({
      where: and(
        eq(promptVariants.id, variantId),
        eq(promptVariants.dealershipId, dealershipId)
      )
    });
    
    if (!existingVariant) {
      return res.status(404).json({ message: 'Prompt variant not found' });
    }
    
    // Check if this variant is used in any active experiments
    const usedInExperiment = await db.query.experimentVariants.findFirst({
      where: eq(experimentVariants.variantId, variantId),
      with: {
        experiment: true
      }
    });
    
    if (usedInExperiment && usedInExperiment.experiment.isActive) {
      return res.status(400).json({ 
        message: 'Cannot delete a variant that is used in an active experiment',
        experimentId: usedInExperiment.experimentId
      });
    }
    
    // Delete the variant (in production, consider soft deletes instead)
    await db
      .delete(promptVariants)
      .where(eq(promptVariants.id, variantId));
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting prompt variant:', error);
    return res.status(500).json({ message: 'Error deleting prompt variant' });
  }
});

// ==================== Experiments Routes ====================

// Create a new experiment
router.post('/experiments', apiKeyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dealershipId = req.dealershipId;
    if (!dealershipId) {
      return res.status(403).json({ message: 'Not authorized to create experiments' });
    }
    
    // Validate the experiment data
    const { name, description, variants } = z.object({
      name: z.string(),
      description: z.string().optional(),
      variants: z.array(z.object({
        variantId: z.number(),
        trafficAllocation: z.number().min(1).max(100)
      }))
    }).parse(req.body);
    
    // Check if all variants belong to this dealership
    const variantIds = variants.map(v => v.variantId);
    const existingVariants = await db.query.promptVariants.findMany({
      where: and(
        eq(promptVariants.dealershipId, dealershipId),
        inArray(promptVariants.id, variantIds)
      )
    });
    
    if (existingVariants.length !== variantIds.length) {
      return res.status(400).json({ message: 'One or more variants do not exist or do not belong to this dealership' });
    }
    
    // Calculate sum of traffic allocation
    const totalAllocation = variants.reduce((sum, v) => sum + v.trafficAllocation, 0);
    if (totalAllocation !== 100) {
      return res.status(400).json({ message: `Traffic allocation must sum to 100%, got ${totalAllocation}%` });
    }
    
    // Create the experiment
    const experiment = await abTestService.createExperiment(
      name,
      description || '',
      dealershipId,
      variants
    );
    
    return res.status(201).json(experiment);
  } catch (error) {
    console.error('Error creating experiment:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid experiment data', errors: error.errors });
    }
    return res.status(500).json({ message: 'Error creating experiment' });
  }
});

// Get all experiments for a dealership
router.get('/experiments', apiKeyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dealershipId = req.dealershipId;
    if (!dealershipId) {
      return res.status(403).json({ message: 'Not authorized to access experiments' });
    }
    
    const experiments = await db.query.promptExperiments.findMany({
      where: eq(promptExperiments.dealershipId, dealershipId),
      orderBy: (experiments, { desc }) => [
        desc(experiments.isActive),
        desc(experiments.startDate)
      ],
      with: {
        experimentVariants: {
          with: {
            variant: true
          }
        }
      }
    });
    
    return res.json(experiments);
  } catch (error) {
    console.error('Error fetching experiments:', error);
    return res.status(500).json({ message: 'Error fetching experiments' });
  }
});

// Get experiment results
router.get('/experiments/:id/results', apiKeyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dealershipId = req.dealershipId;
    if (!dealershipId) {
      return res.status(403).json({ message: 'Not authorized to access experiment results' });
    }
    
    const experimentId = parseInt(req.params.id);
    
    // Check if experiment exists and belongs to this dealership
    const experiment = await db.query.promptExperiments.findFirst({
      where: and(
        eq(promptExperiments.id, experimentId),
        eq(promptExperiments.dealershipId, dealershipId)
      )
    });
    
    if (!experiment) {
      return res.status(404).json({ message: 'Experiment not found' });
    }
    
    // Get the experiment results
    const results = await abTestService.getExperimentResults(experimentId);
    
    return res.json(results);
  } catch (error) {
    console.error('Error fetching experiment results:', error);
    return res.status(500).json({ message: 'Error fetching experiment results' });
  }
});

// End an experiment
router.post('/experiments/:id/end', apiKeyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dealershipId = req.dealershipId;
    if (!dealershipId) {
      return res.status(403).json({ message: 'Not authorized to end this experiment' });
    }
    
    const experimentId = parseInt(req.params.id);
    const { conclusionNotes } = z.object({
      conclusionNotes: z.string().optional()
    }).parse(req.body);
    
    // Check if experiment exists and belongs to this dealership
    const experiment = await db.query.promptExperiments.findFirst({
      where: and(
        eq(promptExperiments.id, experimentId),
        eq(promptExperiments.dealershipId, dealershipId),
        eq(promptExperiments.isActive, true)
      )
    });
    
    if (!experiment) {
      return res.status(404).json({ message: 'Active experiment not found' });
    }
    
    // End the experiment
    const [updatedExperiment] = await db
      .update(promptExperiments)
      .set({
        isActive: false,
        endDate: new Date(),
        conclusionNotes: conclusionNotes || null
      })
      .where(eq(promptExperiments.id, experimentId))
      .returning();
    
    return res.json(updatedExperiment);
  } catch (error) {
    console.error('Error ending experiment:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid data', errors: error.errors });
    }
    return res.status(500).json({ message: 'Error ending experiment' });
  }
});

// Rate a prompt variant based on customer feedback
const ratePromptSchema = z.object({
  variantId: z.number(),
  conversationId: z.number(),
  messageId: z.number(),
  rating: z.number().min(1).max(5),
});

router.post('/variants/rate', apiKeyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dealershipId = req.dealershipId;
    if (!dealershipId) {
      return res.status(403).json({ message: 'Not authorized to rate prompt variants' });
    }
    
    const { variantId, conversationId, messageId, rating } = ratePromptSchema.parse(req.body);
    
    // Find the metrics for this message to ensure it exists
    const metrics = await abTestService.findMetricsForMessage(variantId, conversationId, messageId);
    
    if (!metrics) {
      return res.status(404).json({ message: 'No metrics found for the specified message' });
    }
    
    // Verify the metrics belong to this dealership by checking the variant
    const variant = await db.query.promptVariants.findFirst({
      where: and(
        eq(promptVariants.id, variantId),
        eq(promptVariants.dealershipId, dealershipId)
      )
    });
    
    if (!variant) {
      return res.status(403).json({ message: 'Not authorized to rate this prompt variant' });
    }
    
    // Update the customer rating
    const success = await abTestService.updateMetricsRating(metrics.id, rating);
    
    if (!success) {
      return res.status(500).json({ message: 'Failed to update rating' });
    }
    
    res.json({ message: 'Rating recorded successfully' });
  } catch (error) {
    console.error('Error rating prompt variant:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid request data', errors: error.errors });
    }
    
    res.status(500).json({ message: 'Failed to record rating' });
  }
});

export default router;