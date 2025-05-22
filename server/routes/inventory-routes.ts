import { Router, Request, Response } from "express";
import { apiKeyAuth, type AuthenticatedRequest } from "../middleware/auth";
import { storage } from "../storage";
import { z } from "zod";
import { processInventoryEmail } from "../services/inventory-import";

const router = Router();

// Schema for inventory email webhook payload
const inventoryEmailSchema = z.object({
  dealershipId: z.number(),
  attachmentContent: z.string(),
  fileName: z.string().optional(),
  emailSubject: z.string().optional(),
  emailSender: z.string().optional(),
  emailDate: z.string().optional(),
});

/**
 * Route to handle inventory TSV file uploads from emails
 * This endpoint can be called by an email processing webhook or directly
 */
router.post('/import/tsv', apiKeyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate the request body
    const { dealershipId, attachmentContent } = inventoryEmailSchema.parse(req.body);
    
    // Verify dealership exists
    const dealership = await storage.getDealership(dealershipId);
    if (!dealership) {
      return res.status(404).json({
        success: false,
        message: `Dealership with ID ${dealershipId} not found`
      });
    }
    
    // Process the inventory file
    const result = await processInventoryEmail(attachmentContent, dealershipId);
    
    // Return processing stats
    return res.json({
      success: result.success,
      message: result.success 
        ? `Inventory processed successfully: ${result.stats.added} added, ${result.stats.updated} updated, ${result.stats.errors} errors` 
        : 'Failed to process inventory file',
      stats: result.stats
    });
  } catch (error) {
    console.error('Error processing inventory file:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: error.errors
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Error processing inventory file'
    });
  }
});

/**
 * Route to get inventory import statistics and history for a dealership
 */
router.get('/import/stats', apiKeyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dealershipId = req.dealershipId;
    
    if (!dealershipId) {
      return res.status(403).json({
        success: false,
        message: 'Dealership ID not provided'
      });
    }
    
    // Get current inventory count
    const vehicles = await storage.getVehiclesByDealership(dealershipId);
    
    // Return basic stats (could be expanded to include historical import data)
    return res.json({
      success: true,
      stats: {
        currentInventory: vehicles.length,
        lastUpdated: vehicles.length > 0 
          ? Math.max(...vehicles.map(v => v.updatedAt?.getTime() || 0)) 
          : null
      }
    });
  } catch (error) {
    console.error('Error fetching inventory stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching inventory statistics'
    });
  }
});

export default router;