
import Queue from 'bull';
import { EmailParams } from './email';
import { EmailScheduleSettings } from './scheduler';
import { sendEmail, sendConversationSummary } from './email';
import { processScheduledReports } from './scheduler';

// Create queues
const emailQueue = new Queue('email', {
  redis: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
});

const reportQueue = new Queue('report', {
  redis: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
});

// Process email jobs
emailQueue.process(async (job) => {
  const { apiKey, params } = job.data as { apiKey: string; params: EmailParams };
  return await sendEmail(apiKey, params);
});

// Process report generation jobs
reportQueue.process(async (job) => {
  return await processScheduledReports();
});

// Add email to queue
export const queueEmail = async (apiKey: string, params: EmailParams) => {
  return await emailQueue.add({ apiKey, params });
};

// Add conversation summary to queue
export const queueConversationSummary = async (params: any) => {
  return await emailQueue.add('conversationSummary', params);
};

// Add report generation to queue
export const queueReportGeneration = async (settings: EmailScheduleSettings) => {
  return await reportQueue.add(settings);
};

// Error handling
emailQueue.on('error', (error) => {
  console.error('Email queue error:', error);
});

reportQueue.on('error', (error) => {
  console.error('Report queue error:', error);
});

// Completed job handling
emailQueue.on('completed', (job) => {
  console.log(`Email job ${job.id} completed`);
});

reportQueue.on('completed', (job) => {
  console.log(`Report job ${job.id} completed`);
});
