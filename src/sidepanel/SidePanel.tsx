import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { StorageManager } from '../utils/storage';
import { LinkedInProspect, PrioritySettings } from '../types';
import { sortProspectsByPriority, getPriorityTier, explainScore, defaultPrioritySettings } from '../utils/priorityScoring';
import { CRMView } from './CRMView';
import { BulkMessaging } from './BulkMessaging';
import './sidepanel.css';

const SidePanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'prospects' | 'crm' | 'messages'>('prospects');
  const [prospects, setProspects] = useState<LinkedInProspect[]>([]);
  const [filteredProspects, setFilteredProspects] = useState<LinkedInProspect[]>([]);
  const [filter, setFilter] = useState<'all' | 'new' | 'reviewed' | 'connected' | 'skipped'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'mutual' | 'priority'>('priority');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [prioritySettings, setPrioritySettings] = useState<PrioritySettings>(defaultPrioritySettings);

  useEffect(() => {
    loadProspects();
    loadSettings();
    checkActiveTabPreference();
  }, []);

  const checkActiveTabPreference = async () => {
    // Check if user clicked "View CRM" button from popup
    const result = await chrome.storage.local.get('sidepanel_active_tab');
    if (result.sidepanel_active_tab === 'crm') {
      setActiveTab('crm');
      // Clear the preference after reading it
      await chrome.storage.local.remove('sidepanel_active_tab');
    }
  };

  useEffect(() => {
    applyFiltersAndSort();
  }, [prospects, filter, sortBy, searchTerm, prioritySettings]);

  const loadProspects = async () => {
    const data = await StorageManager.getProspects();
    setProspects(data);
  };

  const loadSettings = async () => {
    const saved = await StorageManager.getPrioritySettings();
    if (saved) {
      setPrioritySettings(saved);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...prospects];

    // Calculate priority scores for all prospects using user settings
    filtered = sortProspectsByPriority(filtered, prioritySettings);

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(p => p.status === filter);
    }

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.headline.toLowerCase().includes(term) ||
        p.currentCompany?.toLowerCase().includes(term)
      );
    }

    // Apply sort (priority is already sorted from sortProspectsByPriority)
    if (sortBy !== 'priority') {
      filtered.sort((a, b) => {
        if (sortBy === 'date') {
          return b.scannedAt - a.scannedAt;
        } else if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        } else if (sortBy === 'mutual') {
          return (b.mutualConnections || 0) - (a.mutualConnections || 0);
        }
        return 0;
      });
    }

    setFilteredProspects(filtered);
  };

  const updateProspectStatus = async (id: string, status: LinkedInProspect['status']) => {
    await StorageManager.updateProspect(id, { status });
    await loadProspects();
  };

  const deleteProspect = async (id: string) => {
    if (confirm('Are you sure you want to delete this prospect?')) {
      await StorageManager.deleteProspect(id);
      await loadProspects();
    }
  };

  const exportToCSV = async () => {
    const csv = await StorageManager.exportToCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `linkedin-prospects-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearAll = async () => {
    if (confirm('Are you sure you want to delete all prospects? This cannot be undone.')) {
      await StorageManager.clearAll();
      await loadProspects();
    }
  };

  const openNextProspect = async () => {
    // Get prospects with status 'new' or 'reviewed'
    const eligibleProspects = prospects.filter(p =>
      p.status === 'new' || p.status === 'reviewed'
    );

    if (eligibleProspects.length === 0) {
      alert('No eligible prospects found. Mark prospects as "new" or "reviewed" to open them.');
      return;
    }

    // Open first eligible prospect in new tab
    const prospect = eligibleProspects[0];
    window.open(prospect.profileUrl, '_blank');

    // Optionally mark as reviewed
    if (confirm(`Opening ${prospect.name}'s profile.\n\nMark as reviewed after clicking Connect?`)) {
      await updateProspectStatus(prospect.id, 'reviewed');
    }
  };

  const openAllProfiles = async () => {
    // Get prospects with status 'new' or 'reviewed'
    const eligibleProspects = prospects.filter(p =>
      p.status === 'new' || p.status === 'reviewed'
    );

    if (eligibleProspects.length === 0) {
      alert('No eligible prospects found.');
      return;
    }

    const count = parseInt(prompt(
      `How many profiles to open?\n\n` +
      `Eligible prospects: ${eligibleProspects.length}\n` +
      `(Opens each in a new tab for you to manually connect)`,
      Math.min(10, eligibleProspects.length).toString()
    ) || '0');

    if (count < 1) return;

    if (count > 20) {
      if (!confirm(`Opening ${count} tabs may slow down your browser. Continue?`)) {
        return;
      }
    }

    // Open profiles in new tabs
    const prospectsToOpen = eligibleProspects.slice(0, count);
    prospectsToOpen.forEach(prospect => {
      window.open(prospect.profileUrl, '_blank');
    });

    // Auto-mark as connected
    const autoMark = confirm(
      `Opened ${prospectsToOpen.length} profiles.\n\n` +
      `Auto-mark all as "connected"?\n` +
      `(They won't show up in the queue again)`
    );

    if (autoMark) {
      for (const prospect of prospectsToOpen) {
        await updateProspectStatus(prospect.id, 'connected');
      }
      alert(`✓ Marked ${prospectsToOpen.length} prospects as connected!`);
      await loadProspects();
    }
  };

  return (
    <div className="sidepanel-container">
      <header className="header">
        <h1>LinkedIn Agent</h1>
        <div className="stats">
          <span className="stat-badge">{prospects.length} Total</span>
          <span className="stat-badge new">{prospects.filter(p => p.status === 'new').length} New</span>
        </div>
      </header>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        borderBottom: '2px solid #E5E7EB',
        marginBottom: '16px',
      }}>
        <button
          onClick={() => setActiveTab('prospects')}
          style={{
            flex: 1,
            padding: '12px',
            border: 'none',
            background: 'none',
            fontSize: '14px',
            fontWeight: '600',
            color: activeTab === 'prospects' ? '#0a66c2' : '#666',
            borderBottom: activeTab === 'prospects' ? '3px solid #0a66c2' : '3px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          📋 Prospects
        </button>
        <button
          onClick={() => setActiveTab('crm')}
          style={{
            flex: 1,
            padding: '12px',
            border: 'none',
            background: 'none',
            fontSize: '14px',
            fontWeight: '600',
            color: activeTab === 'crm' ? '#0a66c2' : '#666',
            borderBottom: activeTab === 'crm' ? '3px solid #0a66c2' : '3px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          🎯 CRM Pipeline
        </button>
        <button
          onClick={() => setActiveTab('messages')}
          style={{
            flex: 1,
            padding: '12px',
            border: 'none',
            background: 'none',
            fontSize: '14px',
            fontWeight: '600',
            color: activeTab === 'messages' ? '#0a66c2' : '#666',
            borderBottom: activeTab === 'messages' ? '3px solid #0a66c2' : '3px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          💬 Messages
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'crm' ? (
        <CRMView />
      ) : activeTab === 'messages' ? (
        <BulkMessaging />
      ) : (
        <>
          {/* Original Prospects View */}
          <div className="toolbar">
        <input
          type="text"
          className="search-input"
          placeholder="Search by name, headline, or company..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="filters">
          <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="filter-select">
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="reviewed">Reviewed</option>
            <option value="connected">Connected</option>
            <option value="skipped">Skipped</option>
          </select>

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="filter-select">
            <option value="priority">Sort by Priority (Smart)</option>
            <option value="date">Sort by Date</option>
            <option value="name">Sort by Name</option>
            <option value="mutual">Sort by Mutual Connections</option>
          </select>
        </div>

        <div className="action-buttons">
          <button onClick={openNextProspect} className="btn-primary">Open Next Profile</button>
          <button onClick={openAllProfiles} className="btn-secondary">Open Multiple Profiles</button>
          <button onClick={() => setShowSettings(true)} className="btn-secondary">⚙️ Priority Settings</button>
          <button onClick={exportToCSV} className="btn-secondary">Export CSV</button>
          <button onClick={clearAll} className="btn-danger">Clear All</button>
        </div>
      </div>

      {showSettings && (
        <PrioritySettingsModal
          settings={prioritySettings}
          onSave={async (newSettings) => {
            setPrioritySettings(newSettings);
            await StorageManager.savePrioritySettings(newSettings);
            setShowSettings(false);
            applyFiltersAndSort();
          }}
          onClose={() => setShowSettings(false)}
        />
      )}

      <div className="prospects-list">
        {filteredProspects.length === 0 ? (
          <div className="empty-state">
            <p>No prospects found</p>
            <small>Start scanning on LinkedIn to add prospects</small>
          </div>
        ) : (
          filteredProspects.map(prospect => (
            <ProspectCard
              key={prospect.id}
              prospect={prospect}
              onUpdateStatus={updateProspectStatus}
              onDelete={deleteProspect}
              prioritySettings={prioritySettings}
            />
          ))
        )}
      </div>
        </>
      )}
    </div>
  );
};

interface ProspectCardProps {
  prospect: LinkedInProspect;
  onUpdateStatus: (id: string, status: LinkedInProspect['status']) => void;
  onDelete: (id: string) => void;
  prioritySettings: PrioritySettings;
}

const ProspectCard: React.FC<ProspectCardProps> = ({ prospect, onUpdateStatus, onDelete, prioritySettings }) => {
  const [showScoreDetails, setShowScoreDetails] = React.useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return '#0a66c2';
      case 'reviewed': return '#057642';
      case 'skipped': return '#666';
      default: return '#666';
    }
  };

  const priorityTier = getPriorityTier(prospect.priorityScore || 0);
  const scoreDetails = explainScore(prospect, prioritySettings);

  return (
    <div className="prospect-card">
      <div className="prospect-header">
        <div className="prospect-info">
          <h3 className="prospect-name">
            <a href={prospect.profileUrl} target="_blank" rel="noopener noreferrer">
              {prospect.name}
            </a>
            {prospect.priorityScore !== undefined && (
              <span
                className="priority-badge"
                style={{
                  background: priorityTier.color,
                  color: 'white',
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  marginLeft: '8px',
                  cursor: 'pointer'
                }}
                onClick={() => setShowScoreDetails(!showScoreDetails)}
                title="Click to see score breakdown"
              >
                {priorityTier.label} ({prospect.priorityScore})
              </span>
            )}
          </h3>
          {showScoreDetails && (
            <div style={{
              fontSize: '11px',
              color: '#666',
              marginTop: '4px',
              padding: '8px',
              background: '#f5f5f5',
              borderRadius: '4px'
            }}>
              <strong>Score breakdown:</strong>
              <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                {scoreDetails.map((reason, i) => (
                  <li key={i}>{reason}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="prospect-headline">{prospect.headline}</p>
          {prospect.currentCompany && (
            <p className="prospect-company">{prospect.currentCompany}</p>
          )}
          {prospect.location && (
            <p className="prospect-location">📍 {prospect.location}</p>
          )}
        </div>
        <div className="prospect-meta">
          <span className="status-badge" style={{ background: getStatusColor(prospect.status) }}>
            {prospect.status}
          </span>
          {prospect.mutualConnections && prospect.mutualConnections > 0 && (
            <span className="mutual-badge">
              {prospect.mutualConnections} mutual
            </span>
          )}
        </div>
      </div>

      <div className="prospect-actions">
        <button
          onClick={() => window.open(prospect.profileUrl, '_blank')}
          className="btn-primary-small"
        >
          View Profile
        </button>
        <select
          value={prospect.status}
          onChange={(e) => onUpdateStatus(prospect.id, e.target.value as any)}
          className="status-select"
        >
          <option value="new">New</option>
          <option value="reviewed">Reviewed</option>
          <option value="skipped">Skipped</option>
          <option value="connected">Connected</option>
        </select>
        <button
          onClick={() => onDelete(prospect.id)}
          className="btn-delete"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

interface PrioritySettingsModalProps {
  settings: PrioritySettings;
  onSave: (settings: PrioritySettings) => void;
  onClose: () => void;
}

const PrioritySettingsModal: React.FC<PrioritySettingsModalProps> = ({ settings, onSave, onClose }) => {
  const [editedSettings, setEditedSettings] = useState<PrioritySettings>(JSON.parse(JSON.stringify(settings)));
  const [newKeyword, setNewKeyword] = useState('');
  const [newKeywordScore, setNewKeywordScore] = useState('10');
  const [newLocation, setNewLocation] = useState('');
  const [newLocationScore, setNewLocationScore] = useState('10');
  const [newCompany, setNewCompany] = useState('');
  const [newCompanyScore, setNewCompanyScore] = useState('20');

  const addKeyword = () => {
    if (newKeyword.trim()) {
      setEditedSettings({
        ...editedSettings,
        keywordScores: {
          ...editedSettings.keywordScores,
          [newKeyword.toLowerCase()]: parseInt(newKeywordScore)
        }
      });
      setNewKeyword('');
      setNewKeywordScore('10');
    }
  };

  const removeKeyword = (keyword: string) => {
    const { [keyword]: removed, ...rest } = editedSettings.keywordScores;
    setEditedSettings({ ...editedSettings, keywordScores: rest });
  };

  const addLocation = () => {
    if (newLocation.trim()) {
      setEditedSettings({
        ...editedSettings,
        locationScores: {
          ...editedSettings.locationScores,
          [newLocation.toLowerCase()]: parseInt(newLocationScore)
        }
      });
      setNewLocation('');
      setNewLocationScore('10');
    }
  };

  const removeLocation = (location: string) => {
    const { [location]: removed, ...rest } = editedSettings.locationScores;
    setEditedSettings({ ...editedSettings, locationScores: rest });
  };

  const addCompany = () => {
    if (newCompany.trim()) {
      setEditedSettings({
        ...editedSettings,
        companyScores: {
          ...editedSettings.companyScores,
          [newCompany.toLowerCase()]: parseInt(newCompanyScore)
        }
      });
      setNewCompany('');
      setNewCompanyScore('20');
    }
  };

  const removeCompany = (company: string) => {
    const { [company]: removed, ...rest } = editedSettings.companyScores;
    setEditedSettings({ ...editedSettings, companyScores: rest });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '700px',
        maxHeight: '80vh',
        overflow: 'auto',
        width: '90%'
      }}>
        <h2 style={{ marginTop: 0 }}>Priority Settings</h2>
        <p style={{ color: '#666', fontSize: '14px' }}>
          Customize how prospects are prioritized. Higher scores = higher priority.
          Use negative scores to deprioritize (e.g., -10 for recruiters).
        </p>

        {/* Mutual Connections */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Mutual Connections</h3>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <label style={{ flex: 1 }}>
              Weight (multiplier):
              <input
                type="number"
                value={editedSettings.mutualConnectionWeight}
                onChange={(e) => setEditedSettings({
                  ...editedSettings,
                  mutualConnectionWeight: parseFloat(e.target.value)
                })}
                style={{ width: '100%', padding: '8px', marginTop: '4px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </label>
            <label style={{ flex: 1 }}>
              Minimum threshold:
              <input
                type="number"
                value={editedSettings.minMutualConnections}
                onChange={(e) => setEditedSettings({
                  ...editedSettings,
                  minMutualConnections: parseInt(e.target.value)
                })}
                style={{ width: '100%', padding: '8px', marginTop: '4px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </label>
          </div>
          <small style={{ color: '#666' }}>
            Score = (mutual connections × weight). Below threshold gets -10 penalty.
          </small>
        </div>

        {/* Job Title Keywords */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Job Title Keywords (in headline)</h3>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input
              type="text"
              placeholder="Keyword (e.g., 'founder', 'recruiter')"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
              style={{ flex: 2, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
            <input
              type="number"
              placeholder="Score"
              value={newKeywordScore}
              onChange={(e) => setNewKeywordScore(e.target.value)}
              style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
            <button onClick={addKeyword} style={{ padding: '8px 16px', background: '#0a66c2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Add
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {Object.entries(editedSettings.keywordScores).map(([keyword, score]) => (
              <span key={keyword} style={{
                background: score >= 0 ? '#e7f3ff' : '#ffe7e7',
                padding: '6px 12px',
                borderRadius: '16px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {keyword}: {score > 0 && '+'}{score}
                <button
                  onClick={() => removeKeyword(keyword)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', padding: 0 }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Locations */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Locations</h3>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input
              type="text"
              placeholder="Location (e.g., 'san francisco', 'remote')"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addLocation()}
              style={{ flex: 2, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
            <input
              type="number"
              placeholder="Score"
              value={newLocationScore}
              onChange={(e) => setNewLocationScore(e.target.value)}
              style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
            <button onClick={addLocation} style={{ padding: '8px 16px', background: '#0a66c2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Add
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {Object.entries(editedSettings.locationScores).map(([location, score]) => (
              <span key={location} style={{
                background: '#e7f3ff',
                padding: '6px 12px',
                borderRadius: '16px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {location}: +{score}
                <button
                  onClick={() => removeLocation(location)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', padding: 0 }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Companies */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Companies</h3>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input
              type="text"
              placeholder="Company (e.g., 'google', 'stripe')"
              value={newCompany}
              onChange={(e) => setNewCompany(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCompany()}
              style={{ flex: 2, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
            <input
              type="number"
              placeholder="Score"
              value={newCompanyScore}
              onChange={(e) => setNewCompanyScore(e.target.value)}
              style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
            <button onClick={addCompany} style={{ padding: '8px 16px', background: '#0a66c2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Add
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {Object.entries(editedSettings.companyScores).map(([company, score]) => (
              <span key={company} style={{
                background: '#e7f3ff',
                padding: '6px 12px',
                borderRadius: '16px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {company}: +{score}
                <button
                  onClick={() => removeCompany(company)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', padding: 0 }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button
            onClick={() => onSave(editedSettings)}
            style={{
              flex: 1,
              padding: '12px',
              background: '#057642',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Save Settings
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              background: '#fff',
              color: '#666',
              border: '2px solid #ddd',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<SidePanel />);
