import { 
  type PromptVariant, 
  type PromptExperiment, 
  type InsertPromptMetrics,
  type ExperimentVariant,
  type Message,
  type Conversation,
} from '@shared/schema';
import { db } from '../db';
import { eq, and, inArray, desc } from 'drizzle-orm';
import { 
  promptVariants, 
  promptExperiments, 
  experimentVariants, 
  promptMetrics 
} from '@shared/schema';
import { performance } from 'perf_hooks';

/**
 * Service for handling A/B testing of prompt variants
 */
export class ABTestService {
  
  /**
   * Select a prompt variant for use based on active experiments
   * If no experiments are active for the dealership, returns the default/control variant
   */
  async selectVariant(dealershipId: number): Promise<PromptVariant | null> {
    try {
      // First, check for any active experiments for this dealership
      const activeExperiments = await db.query.promptExperiments.findMany({
        where: and(
          eq(promptExperiments.dealershipId, dealershipId),
          eq(promptExperiments.isActive, true)
        ),
      });
      
      if (activeExperiments.length === 0) {
        // No active experiments, return the control variant for this dealership
        const [controlVariant] = await db.query.promptVariants.findMany({
          where: and(
            eq(promptVariants.dealershipId, dealershipId),
            eq(promptVariants.isControl, true),
            eq(promptVariants.isActive, true)
          ),
          limit: 1
        });
        
        return controlVariant || null;
      }
      
      // There are active experiments, randomly select one based on active experiments
      const randomExperiment = activeExperiments[Math.floor(Math.random() * activeExperiments.length)];
      
      // Get all variants for this experiment with their traffic allocation
      const experimentVariantsList = await db.query.experimentVariants.findMany({
        where: eq(experimentVariants.experimentId, randomExperiment.id),
        with: {
          variant: true
        }
      });
      
      if (experimentVariantsList.length === 0) {
        return null;
      }
      
      // Select a variant based on traffic allocation
      return this.selectVariantByTrafficAllocation(experimentVariantsList);
    } catch (error) {
      console.error('Error selecting prompt variant:', error);
      return null;
    }
  }
  
  /**
   * Records metrics for a prompt variant
   */
  async recordMetrics(
    metrics: {
      variantId: number;
      conversationId: number;
      messageId: number;
      responseTime?: number | null;
      tokensUsed?: number | null;
      customerMessageLength?: number | null;
      assistantResponseLength?: number | null;
      wasEscalated?: boolean | null;
      wasSuccessful?: boolean | null;
      customerRating?: number | null;
    }
  ): Promise<boolean> {
    // Convert null values to undefined to match schema
    const cleanedMetrics = {
      ...metrics,
      responseTime: metrics.responseTime === null ? undefined : metrics.responseTime,
      tokensUsed: metrics.tokensUsed === null ? undefined : metrics.tokensUsed,
      customerMessageLength: metrics.customerMessageLength === null ? undefined : metrics.customerMessageLength,
      assistantResponseLength: metrics.assistantResponseLength === null ? undefined : metrics.assistantResponseLength,
      wasEscalated: metrics.wasEscalated === null ? undefined : metrics.wasEscalated,
      wasSuccessful: metrics.wasSuccessful === null ? undefined : metrics.wasSuccessful,
      customerRating: metrics.customerRating === null ? undefined : metrics.customerRating,
    };
    try {
      await db.insert(promptMetrics).values(cleanedMetrics);
      return true;
    } catch (error) {
      console.error('Error recording prompt metrics:', error);
      return false;
    }
  }
  
  /**
   * Starts timing for response generation
   */
  startTiming(): number {
    return performance.now();
  }
  
  /**
   * Ends timing and returns the elapsed time in milliseconds
   */
  endTiming(startTime: number): number {
    return Math.round(performance.now() - startTime);
  }
  
  /**
   * Track a prompt variant's usage with basic metrics
   */
  async trackPromptUsage(
    variant: PromptVariant,
    conversation: Conversation,
    message: Message,
    responseTime: number,
    tokensUsed: number,
    wasEscalated: boolean
  ): Promise<boolean> {
    const metrics: InsertPromptMetrics = {
      variantId: variant.id,
      conversationId: conversation.id,
      messageId: message.id,
      responseTime,
      tokensUsed,
      customerMessageLength: message.isFromCustomer ? message.content.length : undefined,
      assistantResponseLength: !message.isFromCustomer ? message.content.length : undefined,
      wasEscalated,
      // These can be updated later via API
      wasSuccessful: undefined,
      customerRating: undefined
    };
    
    return this.recordMetrics(metrics);
  }
  
  /**
   * Find metrics for a specific message
   */
  async findMetricsForMessage(
    variantId: number,
    conversationId: number,
    messageId: number
  ): Promise<typeof promptMetrics.$inferSelect | null> {
    try {
      const [metric] = await db.query.promptMetrics.findMany({
        where: and(
          eq(promptMetrics.variantId, variantId),
          eq(promptMetrics.conversationId, conversationId),
          eq(promptMetrics.messageId, messageId)
        ),
        limit: 1
      });
      
      return metric || null;
    } catch (error) {
      console.error('Error finding metrics for message:', error);
      return null;
    }
  }
  
  /**
   * Update success status for metrics
   */
  async updateMetricsSuccess(
    metricId: number,
    wasSuccessful: boolean
  ): Promise<boolean> {
    try {
      await db
        .update(promptMetrics)
        .set({ wasSuccessful })
        .where(eq(promptMetrics.id, metricId));
        
      return true;
    } catch (error) {
      console.error('Error updating metrics success:', error);
      return false;
    }
  }
  
  /**
   * Update customer rating for metrics
   */
  async updateMetricsRating(
    metricId: number,
    customerRating: number
  ): Promise<boolean> {
    try {
      await db
        .update(promptMetrics)
        .set({ customerRating })
        .where(eq(promptMetrics.id, metricId));
        
      return true;
    } catch (error) {
      console.error('Error updating metrics rating:', error);
      return false;
    }
  }
  
  async getExperimentResults(experimentId: number): Promise<any> {
    try {
      // Get the experiment
      const experiment = await db.query.promptExperiments.findFirst({
        where: eq(promptExperiments.id, experimentId),
      });
      
      if (!experiment) {
        throw new Error(`Experiment ${experimentId} not found`);
      }
      
      // Get all variants for this experiment
      const experimentVariantsList = await db.query.experimentVariants.findMany({
        where: eq(experimentVariants.experimentId, experimentId),
        with: {
          variant: true
        }
      });
      
      const variantIds = experimentVariantsList.map(ev => ev.variant.id);
      
      if (variantIds.length === 0) {
        return { experiment, variants: [] };
      }
      
      // Get metrics for all variants
      const allMetrics = await db.query.promptMetrics.findMany({
        where: inArray(promptMetrics.variantId, variantIds),
      });
      
      // Calculate aggregate metrics for each variant
      const results = experimentVariantsList.map(ev => {
        const variantMetrics = allMetrics.filter(m => m.variantId === ev.variant.id);
        
        const totalResponses = variantMetrics.length;
        const avgResponseTime = variantMetrics.reduce((sum, m) => sum + (m.responseTime || 0), 0) / totalResponses || 0;
        const avgTokensUsed = variantMetrics.reduce((sum, m) => sum + (m.tokensUsed || 0), 0) / totalResponses || 0;
        const escalationRate = variantMetrics.filter(m => m.wasEscalated).length / totalResponses || 0;
        const successRate = variantMetrics.filter(m => m.wasSuccessful).length / 
          variantMetrics.filter(m => m.wasSuccessful !== undefined).length || 0;
        
        // Calculate average customer rating
        const ratingsCount = variantMetrics.filter(m => m.customerRating !== undefined).length;
        const avgCustomerRating = ratingsCount > 0 
          ? variantMetrics.reduce((sum, m) => sum + (m.customerRating || 0), 0) / ratingsCount 
          : 0;
        
        return {
          variant: ev.variant,
          trafficAllocation: ev.trafficAllocation,
          metrics: {
            totalResponses,
            avgResponseTime,
            avgTokensUsed,
            escalationRate,
            successRate,
            avgCustomerRating,
            ratingsCount
          }
        };
      });
      
      return {
        experiment,
        results
      };
    } catch (error) {
      console.error('Error getting experiment results:', error);
      throw error;
    }
  }
  
  /**
   * Creates a new experiment with multiple variants
   */
  async createExperiment(
    name: string,
    description: string,
    dealershipId: number,
    variantSettings: Array<{ variantId: number, trafficAllocation: number }>
  ): Promise<PromptExperiment> {
    try {
      // Validate traffic allocation (should sum to 100)
      const totalAllocation = variantSettings.reduce((sum, v) => sum + v.trafficAllocation, 0);
      if (totalAllocation !== 100) {
        throw new Error(`Traffic allocation must sum to 100, got ${totalAllocation}`);
      }
      
      // Create the experiment
      const [experiment] = await db.insert(promptExperiments).values({
        name,
        description,
        dealershipId,
        startDate: new Date(),
        isActive: true
      }).returning();
      
      // Add the variants
      for (const variantSetting of variantSettings) {
        await db.insert(experimentVariants).values({
          experimentId: experiment.id,
          variantId: variantSetting.variantId,
          trafficAllocation: variantSetting.trafficAllocation
        });
      }
      
      return experiment;
    } catch (error) {
      console.error('Error creating experiment:', error);
      throw error;
    }
  }
  
  /**
   * Selects a variant based on traffic allocation percentages
   */
  private selectVariantByTrafficAllocation(
    experimentVariantsList: (ExperimentVariant & { variant: PromptVariant })[]
  ): PromptVariant {
    // Filter to only include active variants
    const activeVariants = experimentVariantsList.filter(ev => ev.variant.isActive);
    
    if (activeVariants.length === 0) {
      throw new Error('No active variants found for experiment');
    }
    
    // Calculate total traffic allocation for renormalization
    const totalAllocation = activeVariants.reduce((sum, v) => sum + (v.trafficAllocation || 0), 0);
    
    // Generate a random number between 0 and the total allocation
    const randomPoint = Math.random() * totalAllocation;
    
    // Select variant based on traffic allocation
    let cumulativeAllocation = 0;
    for (const experimentVariant of activeVariants) {
      cumulativeAllocation += (experimentVariant.trafficAllocation || 0);
      if (randomPoint <= cumulativeAllocation) {
        return experimentVariant.variant;
      }
    }
    
    // Fallback to the first variant
    return activeVariants[0].variant;
  }
}

// Export singleton instance
export const abTestService = new ABTestService();