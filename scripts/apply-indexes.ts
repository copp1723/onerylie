/**
 * This script applies all the database indexes defined in our schema
 * Run this script to ensure optimal database performance
 * Usage: npx tsx scripts/apply-indexes.ts
 */
import { db } from "../server/db";
import * as logger from "../server/utils/logger";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function applyIndexes() {
  try {
    logger.info("Starting database performance optimization");
    
    // Step 1: Push the schema changes (including indexes) to the database
    logger.info("Pushing schema with indexes using Drizzle...");
    try {
      const { stdout, stderr } = await execAsync("npx drizzle-kit push");
      if (stderr) {
        logger.warn("Drizzle warnings:", { warnings: stderr });
      }
      logger.info("Drizzle schema pushed successfully", { output: stdout });
    } catch (drizzleError) {
      logger.error("Failed to push Drizzle schema", drizzleError);
      throw drizzleError;
    }

    // Step 2: Verify indexes exist
    logger.info("Verifying database indexes...");
    
    // Query to check for our custom indexes
    const indexesResult = await db.execute(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      AND (
        indexname LIKE 'vehicles_%' OR 
        indexname LIKE 'conversations_%' OR 
        indexname LIKE 'messages_%' OR 
        indexname LIKE 'api_keys_%' OR 
        indexname LIKE 'personas_%'
      )
      ORDER BY tablename, indexname;
    `);
    
    // Log found indexes
    if (Array.isArray(indexesResult) && indexesResult.length > 0) {
      logger.info(`Found ${indexesResult.length} performance indexes`, { 
        indexes: indexesResult.map((row: any) => row.indexname) 
      });
    } else {
      logger.warn("No custom performance indexes found. Schema may need updating.");
    }
    
    logger.info("Performance optimization complete");
    logger.info("Database queries should now perform significantly faster under load");
    
    return { success: true, indexCount: Array.isArray(indexesResult) ? indexesResult.length : 0 };
  } catch (error) {
    logger.error("Failed to apply database performance optimizations", error);
    return { success: false, error };
  }
}

// Only run if directly executed (not imported)
if (require.main === module) {
  applyIndexes()
    .then((result) => {
      if (result.success) {
        logger.info("Index application complete");
        process.exit(0);
      } else {
        logger.error("Index application failed", result.error);
        process.exit(1);
      }
    })
    .catch((err) => {
      logger.error("Unexpected error in index application", err);
      process.exit(1);
    });
}

export { applyIndexes };