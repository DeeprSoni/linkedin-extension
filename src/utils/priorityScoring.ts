import { LinkedInProspect, PrioritySettings } from '../types';

// Default priority settings
export const defaultPrioritySettings: PrioritySettings = {
  keywordScores: {
    // Job titles (case insensitive matching)
    'founder': 20,
    'ceo': 20,
    'cto': 18,
    'vp': 15,
    'director': 12,
    'senior': 10,
    'lead': 10,
    'principal': 10,
    'staff': 8,
    'manager': 8,
    'engineer': 5,
    'developer': 5,
    'designer': 5,
    'recruiter': -10, // Negative score to deprioritize
    'hr': -5,
  },
  locationScores: {
    // Geographic preferences
    'san francisco': 15,
    'bay area': 15,
    'new york': 12,
    'seattle': 10,
    'austin': 10,
    'boston': 8,
    'los angeles': 8,
    'remote': 5,
  },
  companyScores: {
    // Company preferences (case insensitive matching)
    'google': 25,
    'facebook': 25,
    'meta': 25,
    'amazon': 25,
    'apple': 25,
    'microsoft': 25,
    'netflix': 20,
    'uber': 20,
    'airbnb': 20,
    'stripe': 20,
    'openai': 25,
  },
  mutualConnectionWeight: 2, // Multiply mutual connections by this
  minMutualConnections: 5, // Minimum threshold for consideration
};

/**
 * Calculate priority score for a prospect based on multiple factors
 */
export function calculatePriorityScore(
  prospect: LinkedInProspect,
  settings: PrioritySettings = defaultPrioritySettings
): number {
  let score = 0;

  // 1. Mutual Connections Score
  const mutualConnections = prospect.mutualConnections || 0;
  if (mutualConnections >= settings.minMutualConnections) {
    score += mutualConnections * settings.mutualConnectionWeight;
  } else {
    score -= 10; // Penalty for low mutual connections
  }

  // 2. Headline Keywords Score
  if (prospect.headline) {
    const headlineLower = prospect.headline.toLowerCase();
    for (const [keyword, points] of Object.entries(settings.keywordScores)) {
      if (headlineLower.includes(keyword.toLowerCase())) {
        score += points;
      }
    }
  }

  // 3. Location Score
  if (prospect.location) {
    const locationLower = prospect.location.toLowerCase();
    for (const [location, points] of Object.entries(settings.locationScores)) {
      if (locationLower.includes(location.toLowerCase())) {
        score += points;
        break; // Only count first match
      }
    }
  }

  // 4. Company Score
  if (prospect.currentCompany || prospect.headline) {
    const companyText = (
      (prospect.currentCompany || '') +
      ' ' +
      (prospect.headline || '')
    ).toLowerCase();

    for (const [company, points] of Object.entries(settings.companyScores)) {
      if (companyText.includes(company.toLowerCase())) {
        score += points;
        break; // Only count first match
      }
    }
  }

  // 5. Profile Completeness Bonus
  let completeness = 0;
  if (prospect.headline) completeness++;
  if (prospect.location) completeness++;
  if (prospect.currentCompany) completeness++;
  if (prospect.mutualConnections && prospect.mutualConnections > 0) completeness++;

  score += completeness * 2; // +2 points per complete field

  return Math.max(0, score); // Ensure non-negative
}

/**
 * Calculate scores for all prospects and sort by priority
 */
export function sortProspectsByPriority(
  prospects: LinkedInProspect[],
  settings: PrioritySettings = defaultPrioritySettings
): LinkedInProspect[] {
  return prospects
    .map(prospect => ({
      ...prospect,
      priorityScore: calculatePriorityScore(prospect, settings)
    }))
    .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));
}

/**
 * Get priority tier label based on score
 */
export function getPriorityTier(score: number): { label: string; color: string } {
  if (score >= 50) return { label: 'High', color: '#057642' };
  if (score >= 30) return { label: 'Medium', color: '#0a66c2' };
  if (score >= 10) return { label: 'Low', color: '#666' };
  return { label: 'Very Low', color: '#999' };
}

/**
 * Explain why a prospect got their score (for debugging/transparency)
 */
export function explainScore(
  prospect: LinkedInProspect,
  settings: PrioritySettings = defaultPrioritySettings
): string[] {
  const reasons: string[] = [];

  // Mutual connections
  const mutualConnections = prospect.mutualConnections || 0;
  if (mutualConnections >= settings.minMutualConnections) {
    reasons.push(`+${mutualConnections * settings.mutualConnectionWeight} from ${mutualConnections} mutual connections`);
  } else {
    reasons.push(`-10 for low mutual connections (${mutualConnections})`);
  }

  // Keywords
  if (prospect.headline) {
    const headlineLower = prospect.headline.toLowerCase();
    for (const [keyword, points] of Object.entries(settings.keywordScores)) {
      if (headlineLower.includes(keyword.toLowerCase())) {
        reasons.push(`${points > 0 ? '+' : ''}${points} for keyword "${keyword}"`);
      }
    }
  }

  // Location
  if (prospect.location) {
    const locationLower = prospect.location.toLowerCase();
    for (const [location, points] of Object.entries(settings.locationScores)) {
      if (locationLower.includes(location.toLowerCase())) {
        reasons.push(`+${points} for location "${location}"`);
        break;
      }
    }
  }

  // Company
  if (prospect.currentCompany || prospect.headline) {
    const companyText = (
      (prospect.currentCompany || '') +
      ' ' +
      (prospect.headline || '')
    ).toLowerCase();

    for (const [company, points] of Object.entries(settings.companyScores)) {
      if (companyText.includes(company.toLowerCase())) {
        reasons.push(`+${points} for company "${company}"`);
        break;
      }
    }
  }

  return reasons;
}
