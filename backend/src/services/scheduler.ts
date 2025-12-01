import cron from 'node-cron';
import creditService from './creditService';

/**
 * Credit refresh scheduler
 * Runs every hour to check and refresh user credits
 */
export const startCreditRefreshScheduler = (): void => {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('[Scheduler] Running credit refresh...');
      const refreshedCount = await creditService.refreshAllCredits();
      console.log(`[Scheduler] Refreshed credits for ${refreshedCount} users`);
    } catch (error) {
      console.error('[Scheduler] Error refreshing credits:', error);
    }
  });

  console.log('✅ Credit refresh scheduler started (runs every hour)');
};

/**
 * Optional: Run cleanup tasks
 * Remove old usage history (older than 1 year)
 */
export const startCleanupScheduler = (): void => {
  // Run daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    try {
      console.log('[Scheduler] Running cleanup tasks...');
      // Add cleanup logic here if needed
      // For example: delete usage history older than 1 year
    } catch (error) {
      console.error('[Scheduler] Error running cleanup:', error);
    }
  });

  console.log('✅ Cleanup scheduler started (runs daily at 2 AM)');
};

export default {
  startCreditRefreshScheduler,
  startCleanupScheduler
};
