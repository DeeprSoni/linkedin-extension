import React, { useEffect, useState } from 'react';
import apiClient, { CreditStatus as ICreditStatus, User } from '../services/apiClient';

export const CreditStatus: React.FC = () => {
  const [credits, setCredits] = useState<ICreditStatus | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    // Refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const cachedUser = await apiClient.getCachedUser();
      const cachedCredits = await apiClient.getCachedCredits();

      setUser(cachedUser);
      setCredits(cachedCredits);

      // Fetch fresh data
      const profile = await apiClient.getProfile();
      setUser(profile.user);
      setCredits(profile.credits);
    } catch (error) {
      console.error('Failed to load credit status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      const plans = ['starter', 'pro', 'enterprise'] as const;
      const currentPlanIndex = plans.indexOf(user?.plan as any);
      const nextPlan = plans[currentPlanIndex + 1] || 'pro';

      const { url } = await apiClient.createCheckoutSession(nextPlan);
      chrome.tabs.create({ url });
    } catch (error) {
      console.error('Failed to create checkout session:', error);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (!credits || !user) {
    return null;
  }

  const percentRemaining = (credits.remaining / credits.dailyLimit) * 100;
  const isLow = credits.warningLevel === 'low';
  const isCritical = credits.warningLevel === 'critical';

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.planBadge}>
          {user.plan.toUpperCase()}
        </div>
        <div style={styles.userName}>
          {user.firstName} {user.lastName}
        </div>
      </div>

      <div style={styles.creditCard}>
        <div style={styles.creditHeader}>
          <span style={styles.creditLabel}>Daily Credits</span>
          <span style={styles.creditCount}>
            {credits.remaining} / {credits.dailyLimit}
          </span>
        </div>

        <div style={styles.progressBarContainer}>
          <div
            style={{
              ...styles.progressBar,
              width: `${percentRemaining}%`,
              backgroundColor: isCritical
                ? '#dc3545'
                : isLow
                ? '#ffc107'
                : '#28a745'
            }}
          />
        </div>

        <div style={styles.creditDetails}>
          <div style={styles.detailItem}>
            <span style={styles.detailLabel}>Used:</span>
            <span style={styles.detailValue}>{credits.used}</span>
          </div>
          <div style={styles.detailItem}>
            <span style={styles.detailLabel}>Next Refresh:</span>
            <span style={styles.detailValue}>
              {new Date(credits.nextRefresh).toLocaleTimeString()}
            </span>
          </div>
        </div>

        {(isLow || isCritical) && (
          <div
            style={{
              ...styles.warning,
              backgroundColor: isCritical ? '#dc3545' : '#ffc107'
            }}
          >
            {isCritical
              ? 'Critical: Running out of credits!'
              : 'Warning: Credits running low'}
          </div>
        )}
      </div>

      {user.plan === 'free' && (
        <button onClick={handleUpgrade} style={styles.upgradeButton}>
          Upgrade Plan
        </button>
      )}

      <div style={styles.creditCosts}>
        <div style={styles.costTitle}>Credit Costs:</div>
        <div style={styles.costItem}>Profile Scan: 1 credit</div>
        <div style={styles.costItem}>CRM Sync: 2 credits</div>
        <div style={styles.costItem}>Bulk Message: 3 credits</div>
        <div style={styles.costItem}>Connection Request: 5 credits</div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px'
  },
  loading: {
    textAlign: 'center',
    padding: '20px',
    color: '#666'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  planBadge: {
    padding: '4px 12px',
    backgroundColor: '#0066cc',
    color: 'white',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600'
  },
  userName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333'
  },
  creditCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  creditHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  creditLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#555'
  },
  creditCount: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#333'
  },
  progressBarContainer: {
    width: '100%',
    height: '8px',
    backgroundColor: '#e9ecef',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '12px'
  },
  progressBar: {
    height: '100%',
    transition: 'width 0.3s ease, background-color 0.3s ease'
  },
  creditDetails: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px'
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  detailLabel: {
    color: '#666'
  },
  detailValue: {
    fontWeight: '600',
    color: '#333'
  },
  warning: {
    marginTop: '12px',
    padding: '8px',
    borderRadius: '4px',
    color: 'white',
    fontSize: '12px',
    fontWeight: '600',
    textAlign: 'center'
  },
  upgradeButton: {
    width: '100%',
    marginTop: '12px',
    padding: '10px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  creditCosts: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: 'white',
    borderRadius: '8px',
    fontSize: '12px'
  },
  costTitle: {
    fontWeight: '600',
    marginBottom: '8px',
    color: '#333'
  },
  costItem: {
    padding: '4px 0',
    color: '#666',
    borderBottom: '1px solid #f0f0f0'
  }
};

export default CreditStatus;
