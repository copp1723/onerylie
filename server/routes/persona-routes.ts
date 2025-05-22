import { Router, Response, Request } from 'express';
import { apiKeyAuth, type AuthenticatedRequest } from '../middleware/auth';
import { isAuthenticated, isAdmin } from '../replitAuth';
import { z } from 'zod';
import { db } from '../db';
import { personas, insertPersonaSchema } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { storage } from '../storage';

const router = Router();

// Get all personas for a dealership
router.get('/', isAuthenticated, async (req: any, res: Response) => {
  try {
    const dealershipId = req.session?.user?.dealershipId;
    if (!dealershipId) {
      return res.status(403).json({ message: 'Not authorized to access personas' });
    }
    
    const personasList = await storage.getPersonasByDealership(dealershipId);
    return res.json(personasList);
  } catch (error) {
    console.error('Error fetching personas:', error);
    return res.status(500).json({ message: 'Failed to fetch personas' });
  }
});

// API key version - used by PureCars integration
router.get('/api', apiKeyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dealershipId = req.dealershipId;
    if (!dealershipId) {
      return res.status(403).json({ message: 'Not authorized to access personas' });
    }
    
    const personasList = await storage.getPersonasByDealership(dealershipId);
    return res.json(personasList);
  } catch (error) {
    console.error('Error fetching personas:', error);
    return res.status(500).json({ message: 'Failed to fetch personas' });
  }
});

// Get a specific persona
router.get('/:id', isAuthenticated, async (req: any, res: Response) => {
  try {
    const dealershipId = req.session?.user?.dealershipId;
    if (!dealershipId) {
      return res.status(403).json({ message: 'Not authorized to access personas' });
    }
    
    const personaId = parseInt(req.params.id);
    if (isNaN(personaId)) {
      return res.status(400).json({ message: 'Invalid persona ID' });
    }
    
    const persona = await storage.getPersona(personaId);
    
    if (!persona) {
      return res.status(404).json({ message: 'Persona not found' });
    }
    
    if (persona.dealershipId !== dealershipId) {
      return res.status(403).json({ message: 'Not authorized to access this persona' });
    }
    
    return res.json(persona);
  } catch (error) {
    console.error('Error fetching persona:', error);
    return res.status(500).json({ message: 'Failed to fetch persona' });
  }
});

// Create a new persona
router.post('/', isAuthenticated, async (req: any, res: Response) => {
  try {
    const dealershipId = req.session?.user?.dealershipId;
    if (!dealershipId) {
      return res.status(403).json({ message: 'Not authorized to create personas' });
    }
    
    // Parse and validate the request body
    const personaData = insertPersonaSchema.parse({
      ...req.body,
      dealershipId
    });
    
    // Check if this should be the default persona
    if (personaData.isDefault) {
      // If this is a new default, update any existing defaults to false
      await db.update(personas)
        .set({ isDefault: false })
        .where(and(
          eq(personas.dealershipId, dealershipId),
          eq(personas.isDefault, true)
        ));
    }
    
    // Create the new persona
    const newPersona = await storage.createPersona(personaData);
    
    return res.status(201).json(newPersona);
  } catch (error) {
    console.error('Error creating persona:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Invalid persona data', 
        errors: error.errors 
      });
    }
    
    return res.status(500).json({ message: 'Failed to create persona' });
  }
});

// Update a persona
router.patch('/:id', isAuthenticated, async (req: any, res: Response) => {
  try {
    const dealershipId = req.session?.user?.dealershipId;
    if (!dealershipId) {
      return res.status(403).json({ message: 'Not authorized to update personas' });
    }
    
    const personaId = parseInt(req.params.id);
    if (isNaN(personaId)) {
      return res.status(400).json({ message: 'Invalid persona ID' });
    }
    
    // Check if the persona exists and belongs to this dealership
    const existingPersona = await storage.getPersona(personaId);
    
    if (!existingPersona) {
      return res.status(404).json({ message: 'Persona not found' });
    }
    
    if (existingPersona.dealershipId !== dealershipId) {
      return res.status(403).json({ message: 'Not authorized to update this persona' });
    }
    
    // Extract data that's allowed to be updated
    const updateData = {
      name: req.body.name,
      description: req.body.description,
      promptTemplate: req.body.promptTemplate,
      isDefault: req.body.isDefault,
      arguments: req.body.arguments
    };
    
    // Check if this should be the default persona
    if (updateData.isDefault && !existingPersona.isDefault) {
      // If this is becoming the default, update any existing defaults to false
      await db.update(personas)
        .set({ isDefault: false })
        .where(and(
          eq(personas.dealershipId, dealershipId),
          eq(personas.isDefault, true)
        ));
    }
    
    // Update the persona
    const updatedPersona = await storage.updatePersona(personaId, updateData);
    
    if (!updatedPersona) {
      return res.status(500).json({ message: 'Failed to update persona' });
    }
    
    return res.json(updatedPersona);
  } catch (error) {
    console.error('Error updating persona:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Invalid persona data', 
        errors: error.errors 
      });
    }
    
    return res.status(500).json({ message: 'Failed to update persona' });
  }
});

// Delete a persona
router.delete('/:id', isAuthenticated, async (req: any, res: Response) => {
  try {
    const dealershipId = req.session?.user?.dealershipId;
    if (!dealershipId) {
      return res.status(403).json({ message: 'Not authorized to delete personas' });
    }
    
    const personaId = parseInt(req.params.id);
    if (isNaN(personaId)) {
      return res.status(400).json({ message: 'Invalid persona ID' });
    }
    
    // Check if the persona exists and belongs to this dealership
    const existingPersona = await storage.getPersona(personaId);
    
    if (!existingPersona) {
      return res.status(404).json({ message: 'Persona not found' });
    }
    
    if (existingPersona.dealershipId !== dealershipId) {
      return res.status(403).json({ message: 'Not authorized to delete this persona' });
    }
    
    // Prevent deletion of the default persona
    if (existingPersona.isDefault) {
      return res.status(400).json({ 
        message: 'Cannot delete the default persona. Please set another persona as default first.'
      });
    }
    
    // Delete the persona
    await db.delete(personas)
      .where(eq(personas.id, personaId));
    
    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting persona:', error);
    return res.status(500).json({ message: 'Failed to delete persona' });
  }
});

// Get the default persona for a dealership
router.get('/default', apiKeyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dealershipId = req.dealershipId;
    if (!dealershipId) {
      return res.status(403).json({ message: 'Not authorized to access personas' });
    }
    
    const defaultPersona = await storage.getDefaultPersonaForDealership(dealershipId);
    
    if (!defaultPersona) {
      return res.status(404).json({ message: 'No default persona found for this dealership' });
    }
    
    return res.json(defaultPersona);
  } catch (error) {
    console.error('Error fetching default persona:', error);
    return res.status(500).json({ message: 'Failed to fetch default persona' });
  }
});

export default router;