import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import apiClient, { User, CreditStatus as ICreditStatus } from '../services/apiClient';
import AuthForm from '../components/AuthForm';
import CreditStatus from '../components/CreditStatus';
import { StorageManager } from '../utils/storage';

const PopupApp: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState({ total: 0, new: 0, lastScan: 'Never' });

  useEffect(() => {
    checkAuth();
    loadStats();
  }, []);

  const checkAuth = async () => {
    try {
      const authenticated = await apiClient.isAuthenticated();
      setIsAuthenticated(authenticated);

      if (authenticated) {
        const cachedUser = await apiClient.getCachedUser();
        setUser(cachedUser);

        // Auto-sync prospects after login
        await syncProspectsToServer();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const syncProspectsToServer = async () => {
    try {
      const prospects = await StorageManager.getProspects();
      if (prospects.length > 0) {
        const result = await apiClient.syncProspects(prospects);
        console.log(`Synced ${result.synced} new, updated ${result.updated} prospects to server`);
      }
    } catch (error) {
      console.error('Failed to sync prospects:', error);
    }
  };

  const loadStats = async () => {
    const prospects = await StorageManager.getProspects();
    const statsData = await StorageManager.getStats();

    const totalCount = prospects.length;
    const newCount = prospects.filter(p => p.status === 'new').length;

    let lastScan = 'Never';
    if (statsData.lastScanDate > 0) {
      const date = new Date(statsData.lastScanDate);
      lastScan = getTimeAgo(date);
    }

    setStats({
      total: totalCount,
      new: newCount,
      lastScan
    });
  };

  const getTimeAgo = (date: Date): string => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const handleStartScan = async () => {
    if (!isAuthenticated) {
      alert('Please login first');
      return;
    }

    // Check credits before scanning
    try {
      const credits = await apiClient.getCreditStatus();
      if (credits.remaining < 1) {
        alert('Insufficient credits. Please upgrade your plan or wait for credit refresh.');
        return;
      }
    } catch (error) {
      console.error('Failed to check credits:', error);
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.id) {
      alert('No active tab found');
      return;
    }

    if (!tab.url?.includes('linkedin.com')) {
      alert('Please navigate to LinkedIn first');
      return;
    }

    chrome.tabs.sendMessage(tab.id, { type: 'START_SCAN' }, (response) => {
      if (chrome.runtime.lastError) {
        alert('Please refresh the LinkedIn page and try again');
      } else {
        window.close();
      }
    });
  };

  const handleViewProspects = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab.id) {
      await chrome.storage.local.remove('sidepanel_active_tab');
      await chrome.sidePanel.open({ tabId: tab.id });
      window.close();
    }
  };

  const handleViewCRM = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab.id) {
      await chrome.storage.local.set({ sidepanel_active_tab: 'crm' });
      await chrome.sidePanel.open({ tabId: tab.id });
      window.close();
    }
  };

  const handleExport = async () => {
    const csv = await StorageManager.exportToCSV();

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `linkedin-prospects-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLogout = async () => {
    await apiClient.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={styles.containerAuth}>
        <AuthForm onAuthSuccess={checkAuth} />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>LinkedIn Agent</h2>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          Logout
        </button>
      </div>

      <CreditStatus />

      <div style={styles.stats}>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>Total Prospects:</span>
          <span style={styles.statValue}>{stats.total}</span>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>New:</span>
          <span style={styles.statValue}>{stats.new}</span>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>Last Scan:</span>
          <span style={styles.statValue}>{stats.lastScan}</span>
        </div>
      </div>

      <button onClick={handleStartScan} style={styles.primaryBtn}>
        Start Scan (1 credit per profile)
      </button>
      <button onClick={handleViewProspects} style={styles.primaryBtn}>
        View All Prospects
      </button>
      <button
        onClick={handleViewCRM}
        style={{ ...styles.primaryBtn, backgroundColor: '#10B981' }}
      >
        View CRM Pipeline
      </button>
      <button onClick={handleExport} style={styles.secondaryBtn}>
        Export to CSV
      </button>

      <div style={styles.instructions}>
        Navigate to LinkedIn Search (People) or My Network, then click "Start Scan" or use the
        floating button on the page.
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '380px',
    padding: '16px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  containerAuth: {
    width: '450px',
    minHeight: '500px'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#666'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
    color: '#000'
  },
  logoutBtn: {
    padding: '6px 12px',
    fontSize: '12px',
    backgroundColor: '#f3f6f8',
    color: '#666',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '600'
  },
  stats: {
    background: '#f3f6f8',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '16px',
    marginTop: '16px'
  },
  statItem: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '14px'
  },
  statLabel: {
    color: '#666'
  },
  statValue: {
    fontWeight: '600',
    color: '#0a66c2'
  },
  primaryBtn: {
    width: '100%',
    padding: '12px',
    border: 'none',
    borderRadius: '24px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    marginBottom: '8px',
    background: '#0a66c2',
    color: 'white'
  },
  secondaryBtn: {
    width: '100%',
    padding: '12px',
    border: 'none',
    borderRadius: '24px',
    fontWeight: '600',
    fontSize: '14px',
    cursor: 'pointer',
    marginBottom: '8px',
    background: '#f3f6f8',
    color: '#666'
  },
  instructions: {
    fontSize: '12px',
    color: '#666',
    marginTop: '12px',
    padding: '12px',
    background: '#fff4e6',
    borderRadius: '6px',
    borderLeft: '3px solid #ff9500'
  }
};

// Mount the app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<PopupApp />);
}

export default PopupApp;
