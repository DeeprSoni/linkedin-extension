/**
 * API Client for LinkedIn Agent Backend
 * Handles authentication and credit management
 */

const API_BASE_URL = 'http://147.93.154.31:3000/api';

export type PlanType = 'free' | 'starter' | 'pro' | 'enterprise';
export type ActionType = 'profile_scan' | 'connection_request' | 'bulk_message' | 'crm_sync';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  plan: PlanType;
  emailVerified: boolean;
}

export interface CreditStatus {
  remaining: number;
  dailyLimit: number;
  used: number;
  percentUsed: number;
  nextRefresh: Date;
  warningLevel?: 'low' | 'critical' | null;
}

export interface LoginResponse {
  token: string;
  user: User;
  credits: CreditStatus;
}

export interface APIError {
  error: string;
  details?: any[];
}

class APIClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Get stored auth token
   */
  private async getToken(): Promise<string | null> {
    const result = await chrome.storage.local.get('authToken');
    return result.authToken || null;
  }

  /**
   * Store auth token
   */
  private async setToken(token: string): Promise<void> {
    await chrome.storage.local.set({ authToken: token });
  }

  /**
   * Remove auth token
   */
  private async removeToken(): Promise<void> {
    await chrome.storage.local.remove('authToken');
  }

  /**
   * Make authenticated API request with timeout and retry
   * PERMANENT FIX: Reduces timeout, adds health check, better error messages
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retries: number = 1
  ): Promise<T> {
    const token = await this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Shorter timeout: 15 seconds instead of 30
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    let lastError: any;

    try {
      const startTime = Date.now();
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const elapsed = Date.now() - startTime;

      // Check if response is too slow (>10s) - backend might be unhealthy
      if (elapsed > 10000) {
        console.warn(`Slow response: ${elapsed}ms for ${endpoint}`);
      }

      const data = await response.json();

      if (!response.ok) {
        // Extract detailed error message
        const errorMsg = data.error || data.message || `HTTP ${response.status}`;
        throw new Error(errorMsg);
      }

      return data.data;
    } catch (error: any) {
      clearTimeout(timeoutId);
      lastError = error;

      // Handle timeout/abort
      if (error.name === 'AbortError') {
        console.error(`Timeout on ${endpoint}`);
        if (retries > 0) {
          console.log(`Retrying ${endpoint}... (${retries} left)`);
          await new Promise(resolve => setTimeout(resolve, 500));
          return this.request<T>(endpoint, options, retries - 1);
        }
        throw new Error(
          'Server is not responding. This usually means:\n' +
          '• The backend server is down\n' +
          '• MongoDB/Redis are not running\n' +
          '• Network connection issue\n\n' +
          'Please contact support or try again later.'
        );
      }

      // Handle network errors
      if (error.message === 'Failed to fetch' || error.message.includes('NetworkError') || error.name === 'TypeError') {
        console.error(`Network error on ${endpoint}:`, error.message);
        if (retries > 0) {
          console.log(`Retrying ${endpoint}... (${retries} left)`);
          await new Promise(resolve => setTimeout(resolve, 500));
          return this.request<T>(endpoint, options, retries - 1);
        }
        throw new Error(
          'Cannot connect to server. Please check:\n' +
          '• Your internet connection\n' +
          '• Server status at http://147.93.154.31:3000\n' +
          '• Try again in a few moments'
        );
      }

      // Re-throw other errors as-is
      throw error;
    }
  }

  /**
   * Check if backend server is healthy before making requests
   */
  async checkServerHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('http://147.93.154.31:3000/health', {
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  /**
   * Register new user
   */
  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    referralCode?: string
  ): Promise<{ message: string }> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        firstName,
        lastName,
        referralCode: referralCode?.trim() || undefined
      })
    });
  }

  /**
   * Login user
   * PERMANENT FIX: Check server health first
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    // Quick health check before attempting login
    const isHealthy = await this.checkServerHealth();
    if (!isHealthy) {
      throw new Error(
        'Server is currently unavailable.\n\n' +
        'The backend service may be down or restarting.\n' +
        'Please try again in a few moments or contact support.'
      );
    }

    const response = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    // Store token
    await this.setToken(response.token);

    // Store user data
    await chrome.storage.local.set({
      currentUser: response.user,
      credits: response.credits
    });

    return response;
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    await this.removeToken();
    await chrome.storage.local.remove(['currentUser', 'credits']);
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<{ user: User; credits: CreditStatus }> {
    const profile = await this.request<{ user: User; credits: CreditStatus }>('/auth/me');

    // Update cached data
    await chrome.storage.local.set({
      currentUser: profile.user,
      credits: profile.credits
    });

    return profile;
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    if (!token) return false;

    try {
      await this.getProfile();
      return true;
    } catch (error) {
      // Token is invalid, remove it
      await this.removeToken();
      return false;
    }
  }

  /**
   * Get credit status
   */
  async getCreditStatus(): Promise<CreditStatus> {
    const credits = await this.request<CreditStatus>('/credits/status');

    // Update cached credits
    await chrome.storage.local.set({ credits });

    return credits;
  }

  /**
   * Consume credits for an action
   */
  async consumeCredits(
    action: ActionType,
    linkedInProfileUrl?: string,
    metadata?: Record<string, any>
  ): Promise<{ remaining: number; message: string }> {
    const result = await this.request<{ remaining: number; message: string }>(
      '/credits/consume',
      {
        method: 'POST',
        body: JSON.stringify({ action, linkedInProfileUrl, metadata })
      }
    );

    // Refresh credit status after consumption
    await this.getCreditStatus();

    return result;
  }

  /**
   * Get usage history
   */
  async getUsageHistory(limit: number = 100): Promise<any[]> {
    return this.request(`/credits/history?limit=${limit}`);
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(days: number = 30): Promise<any[]> {
    return this.request(`/credits/stats?days=${days}`);
  }

  /**
   * Create Stripe checkout session
   */
  async createCheckoutSession(plan: PlanType): Promise<{ sessionId: string; url: string }> {
    return this.request('/stripe/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ plan })
    });
  }

  /**
   * Get Stripe customer portal URL
   */
  async getCustomerPortal(): Promise<{ url: string }> {
    return this.request('/stripe/portal');
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(): Promise<{ message: string }> {
    return this.request('/stripe/cancel-subscription', {
      method: 'POST'
    });
  }

  /**
   * Get cached user data (no API call)
   */
  async getCachedUser(): Promise<User | null> {
    const result = await chrome.storage.local.get('currentUser');
    return result.currentUser || null;
  }

  /**
   * Get cached credit data (no API call)
   */
  async getCachedCredits(): Promise<CreditStatus | null> {
    const result = await chrome.storage.local.get('credits');
    return result.credits || null;
  }

  /**
   * Sync prospects to server
   */
  async syncProspects(prospects: any[]): Promise<{ synced: number; updated: number; total: number }> {
    return this.request('/prospects/sync', {
      method: 'POST',
      body: JSON.stringify({ prospects })
    });
  }

  /**
   * Get prospects from server
   */
  async getProspects(status?: string, limit: number = 100, offset: number = 0): Promise<any> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    return this.request(`/prospects?${params.toString()}`);
  }

  /**
   * Get prospect stats from server
   */
  async getProspectStats(): Promise<{ total: number; new: number; contacted: number; responded: number }> {
    return this.request('/prospects/stats');
  }
}

// Export singleton instance
export const apiClient = new APIClient();
export default apiClient;
