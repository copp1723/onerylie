/**
 * Scheduler service for Rylie AI platform
 * 
 * This module manages scheduled tasks using a simple interval-based approach
 * with a fallback mechanism when cron or sophisticated schedulers are unavailable
 */
import { queueReportGeneration } from './queue';
import logger from '../utils/logger';
import { db } from '../db';
import { dealerships } from '../../shared/schema';
import { eq } from 'drizzle-orm';

// Scheduler state
const scheduledJobs = new Map<string, NodeJS.Timeout>();

// Default intervals (in milliseconds)
const DEFAULT_INTERVALS = {
  DAILY_REPORTS: 24 * 60 * 60 * 1000, // 24 hours
  WEEKLY_REPORTS: 7 * 24 * 60 * 60 * 1000, // 7 days
  SYSTEM_HEALTH: 15 * 60 * 1000, // 15 minutes
  METRICS_ROLLUP: 60 * 60 * 1000, // 1 hour
};

/**
 * Schedule a report to be generated on a recurring basis
 * @param dealershipId Dealership ID
 * @param reportType Report type
 * @param interval Interval in milliseconds
 * @param initialDelay Initial delay in milliseconds
 */
export const scheduleRecurringReport = (
  dealershipId: number,
  reportType: 'daily' | 'weekly',
  interval = reportType === 'daily' ? DEFAULT_INTERVALS.DAILY_REPORTS : DEFAULT_INTERVALS.WEEKLY_REPORTS,
  initialDelay = 0
) => {
  const jobId = `report_${reportType}_${dealershipId}`;
  
  // Cancel existing job with the same ID
  if (scheduledJobs.has(jobId)) {
    clearInterval(scheduledJobs.get(jobId));
    scheduledJobs.delete(jobId);
  }
  
  // Schedule initial job after delay
  const timeoutId = setTimeout(() => {
    // Queue the report generation
    queueReportGeneration({
      dealershipId,
      reportType,
    }).then((jobId) => {
      logger.info(`Queued ${reportType} report for dealership ${dealershipId}`, { jobId });
    }).catch((error) => {
      logger.error(`Failed to queue ${reportType} report for dealership ${dealershipId}`, error);
    });
    
    // Set up recurring schedule
    const intervalId = setInterval(() => {
      queueReportGeneration({
        dealershipId,
        reportType,
      }).then((jobId) => {
        logger.info(`Queued recurring ${reportType} report for dealership ${dealershipId}`, { jobId });
      }).catch((error) => {
        logger.error(`Failed to queue recurring ${reportType} report for dealership ${dealershipId}`, error);
      });
    }, interval);
    
    // Store the interval ID
    scheduledJobs.set(jobId, intervalId);
  }, initialDelay);
  
  // Store the timeout ID until it's replaced by the interval
  scheduledJobs.set(jobId, timeoutId);
  
  logger.info(`Scheduled recurring ${reportType} report for dealership ${dealershipId}`);
  
  return jobId;
};

/**
 * Cancel a scheduled report
 * @param jobId Job ID
 */
export const cancelScheduledReport = (jobId: string) => {
  if (scheduledJobs.has(jobId)) {
    clearInterval(scheduledJobs.get(jobId));
    scheduledJobs.delete(jobId);
    logger.info(`Canceled scheduled report ${jobId}`);
    return true;
  }
  logger.warn(`Attempted to cancel non-existent report ${jobId}`);
  return false;
};

/**
 * Initialize scheduled reports for all dealerships
 */
export const initializeReportSchedules = async () => {
  try {
    // Get all active dealerships
    const activeDealerships = await db.select().from(dealerships).where(eq(dealerships.active, true));
    
    // Schedule reports for each dealership at staggered times
    activeDealerships.forEach((dealership, index) => {
      // Stagger initial reports to prevent all reports running at once
      const initialDailyDelay = index * 5 * 60 * 1000; // 5 minutes stagger
      const initialWeeklyDelay = index * 10 * 60 * 1000; // 10 minutes stagger
      
      // Schedule daily reports
      scheduleRecurringReport(dealership.id, 'daily', DEFAULT_INTERVALS.DAILY_REPORTS, initialDailyDelay);
      
      // Schedule weekly reports
      scheduleRecurringReport(dealership.id, 'weekly', DEFAULT_INTERVALS.WEEKLY_REPORTS, initialWeeklyDelay);
    });
    
    logger.info(`Initialized report schedules for ${activeDealerships.length} dealerships`);
  } catch (error) {
    logger.error('Failed to initialize report schedules', error);
  }
};

/**
 * Schedule a one-time report
 * @param dealershipId Dealership ID
 * @param reportType Report type
 * @param delay Delay in milliseconds
 */
export const scheduleOneTimeReport = (
  dealershipId: number,
  reportType: string,
  delay = 0
) => {
  const jobId = `one_time_report_${reportType}_${dealershipId}_${Date.now()}`;
  
  const timeoutId = setTimeout(() => {
    queueReportGeneration({
      dealershipId,
      reportType,
      oneTime: true,
    }).then((jobId) => {
      logger.info(`Queued one-time ${reportType} report for dealership ${dealershipId}`, { jobId });
    }).catch((error) => {
      logger.error(`Failed to queue one-time ${reportType} report for dealership ${dealershipId}`, error);
    });
    
    // Remove job from map once executed
    scheduledJobs.delete(jobId);
  }, delay);
  
  scheduledJobs.set(jobId, timeoutId);
  
  logger.info(`Scheduled one-time ${reportType} report for dealership ${dealershipId}`);
  
  return jobId;
};

/**
 * Clean up all scheduled jobs
 */
export const shutdownScheduler = () => {
  scheduledJobs.forEach((timeoutId, jobId) => {
    clearInterval(timeoutId);
    logger.info(`Canceled scheduled job ${jobId} during shutdown`);
  });
  
  scheduledJobs.clear();
  
  logger.info('Scheduler shutdown complete');
};

// Add scheduler to graceful shutdown process
if (typeof process !== 'undefined') {
  process.on('SIGTERM', () => {
    shutdownScheduler();
  });
  
  process.on('SIGINT', () => {
    shutdownScheduler();
  });
}

export default {
  scheduleRecurringReport,
  cancelScheduledReport,
  scheduleOneTimeReport,
  initializeReportSchedules,
  shutdownScheduler
};