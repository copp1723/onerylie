import { Router, Response } from 'express';
import { z } from 'zod';
import { apiKeyAuth, type AuthenticatedRequest } from '../middleware/auth';
import { processScheduledReports } from '../services/scheduler';

const router = Router();

// Route to manually trigger report processing
router.post('/trigger-reports', apiKeyAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Only allow admin or dealership staff to trigger reports
    if (!req.dealershipId) {
      return res.status(403).json({ message: 'Not authorized to trigger reports' });
    }
    
    // Process all scheduled reports
    await processScheduledReports();
    
    return res.json({ 
      success: true, 
      message: 'Report processing triggered successfully' 
    });
    
  } catch (error) {
    console.error('Error triggering reports:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error triggering reports' 
    });
  }
});

export default router;