import User from '../models/User';
import UsageHistory from '../models/UsageHistory';
import { ActionType, getCreditCost, getWarningLevel } from '../config/plans';
import { CreditStatus } from '../types';

class CreditService {
  /**
   * Get user's credit status
   */
  async getCreditStatus(userId: string): Promise<CreditStatus | null> {
    const user = await User.findById(userId);
    if (!user) return null;

    // Check if credits need refresh
    await user.refreshCredits();

    const used = user.credits.dailyLimit - user.credits.remaining;
    const percentUsed = (used / user.credits.dailyLimit) * 100;

    // Calculate next refresh time (24 hours from last refresh)
    const nextRefresh = new Date(user.credits.lastRefresh);
    nextRefresh.setHours(nextRefresh.getHours() + 24);

    return {
      remaining: user.credits.remaining,
      dailyLimit: user.credits.dailyLimit,
      used,
      percentUsed,
      nextRefresh,
      warningLevel: getWarningLevel(user.credits.remaining, user.credits.dailyLimit)
    };
  }

  /**
   * Consume credits for an action
   */
  async consumeCredits(
    userId: string,
    action: ActionType,
    linkedInProfileUrl?: string,
    metadata?: Record<string, any>
  ): Promise<{ success: boolean; remaining?: number; error?: string }> {
    const user = await User.findById(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Refresh credits if needed
    await user.refreshCredits();

    const creditCost = getCreditCost(action);

    // Check if user has enough credits
    if (user.credits.remaining < creditCost) {
      return {
        success: false,
        error: `Insufficient credits. Required: ${creditCost}, Available: ${user.credits.remaining}`
      };
    }

    // Consume credits
    const consumed = await user.consumeCredits(creditCost);
    if (!consumed) {
      return { success: false, error: 'Failed to consume credits' };
    }

    // Record usage history
    await UsageHistory.create({
      userId,
      action,
      creditCost,
      linkedInProfileUrl,
      metadata,
      timestamp: new Date()
    });

    // Check if we need to send warning
    await this.checkAndSendWarnings(user);

    return {
      success: true,
      remaining: user.credits.remaining
    };
  }

  /**
   * Check credit levels and track warnings
   */
  private async checkAndSendWarnings(user: any): Promise<void> {
    const warningLevel = getWarningLevel(
      user.credits.remaining,
      user.credits.dailyLimit
    );

    if (!warningLevel) return;

    // Check if warning was already tracked
    const warningKey = warningLevel === 'low' ? '80%' : '90%';
    if (user.credits.warningsSent.includes(warningKey)) {
      return;
    }

    // Mark warning level reached (for UI display)
    user.credits.warningsSent.push(warningKey);
    await user.save();

    console.log(`User ${user._id} reached ${warningKey} credit usage`);
  }

  /**
   * Get usage history for a user
   */
  async getUsageHistory(
    userId: string,
    limit: number = 100
  ): Promise<any[]> {
    return UsageHistory.find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(userId: string, days: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await UsageHistory.aggregate([
      {
        $match: {
          userId,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
          totalCredits: { $sum: '$creditCost' }
        }
      }
    ]);

    return stats;
  }

  /**
   * Refresh all users' credits (called by scheduler)
   */
  async refreshAllCredits(): Promise<number> {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Find users whose last refresh was more than 24 hours ago
    const users = await User.find({
      'credits.lastRefresh': { $lte: twentyFourHoursAgo }
    });

    let refreshedCount = 0;
    for (const user of users) {
      await user.refreshCredits();
      refreshedCount++;
    }

    return refreshedCount;
  }
}

export default new CreditService();
