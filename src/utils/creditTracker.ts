/**
 * Credit Tracker Utility
 * Integrates credit consumption into existing extension actions
 */

import apiClient, { ActionType } from '../services/apiClient';

export class CreditTracker {
  /**
   * Track and consume credits for an action
   * Returns true if successful, false if insufficient credits
   */
  static async consumeForAction(
    action: ActionType,
    linkedInProfileUrl?: string,
    metadata?: Record<string, any>
  ): Promise<{ success: boolean; error?: string; remaining?: number }> {
    try {
      // Check if user is authenticated
      const isAuth = await apiClient.isAuthenticated();
      if (!isAuth) {
        return {
          success: false,
          error: 'Please login to use this feature'
        };
      }

      // Consume credits
      const result = await apiClient.consumeCredits(action, linkedInProfileUrl, metadata);

      return {
        success: true,
        remaining: result.remaining
      };
    } catch (error: any) {
      console.error('Credit consumption failed:', error);

      // Parse error message
      let errorMessage = error.message || 'Failed to consume credits';

      if (errorMessage.includes('Insufficient credits')) {
        errorMessage = 'Out of credits! Please upgrade your plan or wait for daily refresh.';
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Check if user has enough credits for an action
   * without consuming them
   */
  static async hasCreditsFor(action: ActionType): Promise<boolean> {
    try {
      const credits = await apiClient.getCreditStatus();

      const costs: Record<ActionType, number> = {
        profile_scan: 1,
        crm_sync: 2,
        bulk_message: 3,
        connection_request: 5
      };

      return credits.remaining >= costs[action];
    } catch (error) {
      console.error('Failed to check credits:', error);
      return false;
    }
  }

  /**
   * Get current credit status
   */
  static async getCreditStatus() {
    try {
      return await apiClient.getCreditStatus();
    } catch (error) {
      console.error('Failed to get credit status:', error);
      return null;
    }
  }

  /**
   * Wrapper for profile scanning with credit tracking
   */
  static async trackProfileScan(profileUrl: string): Promise<boolean> {
    const result = await this.consumeForAction('profile_scan', profileUrl, {
      source: 'manual_scan'
    });

    if (!result.success) {
      // Show error to user
      chrome.runtime.sendMessage({
        type: 'CREDIT_ERROR',
        error: result.error
      });
      return false;
    }

    return true;
  }

  /**
   * Wrapper for connection request with credit tracking
   */
  static async trackConnectionRequest(profileUrl: string, note?: string): Promise<boolean> {
    const result = await this.consumeForAction('connection_request', profileUrl, {
      hasNote: !!note
    });

    if (!result.success) {
      chrome.runtime.sendMessage({
        type: 'CREDIT_ERROR',
        error: result.error
      });
      return false;
    }

    return true;
  }

  /**
   * Wrapper for bulk messaging with credit tracking
   */
  static async trackBulkMessage(recipientUrl: string, messageLength: number): Promise<boolean> {
    const result = await this.consumeForAction('bulk_message', recipientUrl, {
      messageLength
    });

    if (!result.success) {
      chrome.runtime.sendMessage({
        type: 'CREDIT_ERROR',
        error: result.error
      });
      return false;
    }

    return true;
  }

  /**
   * Wrapper for CRM sync with credit tracking
   */
  static async trackCRMSync(profileUrl: string, syncType: string): Promise<boolean> {
    const result = await this.consumeForAction('crm_sync', profileUrl, {
      syncType
    });

    if (!result.success) {
      chrome.runtime.sendMessage({
        type: 'CREDIT_ERROR',
        error: result.error
      });
      return false;
    }

    return true;
  }
}

export default CreditTracker;
