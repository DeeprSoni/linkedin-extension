/**
 * Plan Limits Configuration
 *
 * Defines credit limits and pricing for each subscription tier.
 * Credits are refreshed every 24 hours and do not roll over.
 */

export type PlanType = 'free' | 'starter' | 'pro' | 'enterprise';

export interface PlanConfig {
  name: string;
  dailyCredits: number;
  price: number;
  stripePriceId?: string;
  features: string[];
}

export const PLANS: Record<PlanType, PlanConfig> = {
  free: {
    name: 'Free',
    dailyCredits: 50,
    price: 0,
    features: [
      '50 credits per day',
      'Basic CRM features',
      'Email support'
    ]
  },
  starter: {
    name: 'Starter',
    dailyCredits: 200,
    price: 9.99,
    stripePriceId: process.env.STRIPE_PRICE_ID_STARTER,
    features: [
      '200 credits per day',
      'Full CRM access',
      'Bulk messaging',
      'Priority email support'
    ]
  },
  pro: {
    name: 'Pro',
    dailyCredits: 1000,
    price: 29.99,
    stripePriceId: process.env.STRIPE_PRICE_ID_PRO,
    features: [
      '1,000 credits per day',
      'Advanced analytics',
      'Custom templates',
      'Priority support',
      'API access'
    ]
  },
  enterprise: {
    name: 'Enterprise',
    dailyCredits: 5000,
    price: 99.99,
    stripePriceId: process.env.STRIPE_PRICE_ID_ENTERPRISE,
    features: [
      '5,000 credits per day',
      'Team collaboration',
      'Advanced integrations',
      'Dedicated support',
      'Custom features',
      'SLA guarantee'
    ]
  }
};

/**
 * Credit costs for each action type
 */
export type ActionType = 'profile_scan' | 'connection_request' | 'bulk_message' | 'crm_sync';

export const CREDIT_COSTS: Record<ActionType, number> = {
  profile_scan: 1,        // Low-cost, high-frequency action
  crm_sync: 2,            // Medium value, data storage
  bulk_message: 3,        // High value, personalization effort
  connection_request: 5   // High value, rate-limited by LinkedIn
};

/**
 * Credit warning thresholds (percentage of daily limit)
 */
export const CREDIT_WARNINGS = {
  LOW: 0.8,    // 80% usage
  CRITICAL: 0.9 // 90% usage
};

/**
 * Get plan configuration by type
 */
export function getPlanConfig(planType: PlanType): PlanConfig {
  return PLANS[planType];
}

/**
 * Get credit cost for an action
 */
export function getCreditCost(action: ActionType): number {
  return CREDIT_COSTS[action];
}

/**
 * Calculate which warning level user has reached
 */
export function getWarningLevel(remaining: number, dailyLimit: number): 'low' | 'critical' | null {
  const usagePercent = 1 - (remaining / dailyLimit);

  if (usagePercent >= CREDIT_WARNINGS.CRITICAL) {
    return 'critical';
  } else if (usagePercent >= CREDIT_WARNINGS.LOW) {
    return 'low';
  }

  return null;
}

export default PLANS;
