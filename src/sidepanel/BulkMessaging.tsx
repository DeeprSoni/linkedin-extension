import React, { useState, useEffect } from 'react';
import { StorageManager } from '../utils/storage';
import { MessageCampaign, MessageTemplate, LinkedInProspect, CampaignContact, PrioritySettings } from '../types';
import { calculatePriorityScore, defaultPrioritySettings } from '../utils/priorityScoring';

export const BulkMessaging: React.FC = () => {
  const [view, setView] = useState<'campaigns' | 'templates'>('campaigns');
  const [campaigns, setCampaigns] = useState<MessageCampaign[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [prospects, setProspects] = useState<LinkedInProspect[]>([]);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [campaignsData, templatesData, prospectsData] = await Promise.all([
      StorageManager.getCampaigns(),
      StorageManager.getTemplates(),
      StorageManager.getProspects()
    ]);
    setCampaigns(campaignsData);
    setTemplates(templatesData);
    setProspects(prospectsData);
  };

  const openMessagingBatch = async (campaign: MessageCampaign, batchSize: number = 5, autoClickMessage: boolean = false) => {
    // Get pending contacts
    const pendingContacts = campaign.contacts.filter(c => c.status === 'pending');

    if (pendingContacts.length === 0) {
      alert('No pending contacts in this campaign!');
      return;
    }

    const count = Math.min(batchSize, pendingContacts.length);

    const message = autoClickMessage
      ? `Open ${count} profile tabs and auto-click "Message" button?\n\nNote: Auto-click may not work on all profiles.`
      : `Open ${count} profile tabs?\n\nClick the "Message" button on each profile to start messaging.`;

    if (!confirm(message)) {
      return;
    }

    // Open profile URLs
    const contactsToOpen = pendingContacts.slice(0, count);

    for (const contact of contactsToOpen) {
      const prospect = prospects.find(p => p.id === contact.prospectId);
      if (prospect) {
        // Open profile page
        window.open(prospect.profileUrl, '_blank');

        // Update contact status to 'opened'
        contact.status = 'opened';
        contact.openedAt = Date.now();
      }
    }

    // Update campaign stats
    campaign.stats.pending -= count;
    campaign.stats.opened += count;

    await StorageManager.updateCampaign(campaign.id, campaign);

    // Store auto-click preference if enabled
    if (autoClickMessage) {
      await chrome.storage.local.set({ 'auto_click_message': true });
      // Clear after 30 seconds
      setTimeout(async () => {
        await chrome.storage.local.remove('auto_click_message');
      }, 30000);
    }

    await loadData();

    const followUp = autoClickMessage
      ? `Opened ${count} profile tabs with auto-click enabled!\n\nThe Message button will be clicked automatically.\nPaste your message and click Send.`
      : `Opened ${count} profile tabs!\n\nClick "Message" on each profile, then paste and send your message.`;

    alert(followUp);
  };

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <h2 style={{ margin: 0, flex: 1 }}>Bulk Messaging</h2>
        <button
          onClick={() => setView('campaigns')}
          style={{
            padding: '8px 16px',
            background: view === 'campaigns' ? '#0a66c2' : '#fff',
            color: view === 'campaigns' ? '#fff' : '#666',
            border: '2px solid #0a66c2',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          Campaigns
        </button>
        <button
          onClick={() => setView('templates')}
          style={{
            padding: '8px 16px',
            background: view === 'templates' ? '#0a66c2' : '#fff',
            color: view === 'templates' ? '#fff' : '#666',
            border: '2px solid #0a66c2',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          Templates
        </button>
      </div>

      {view === 'campaigns' ? (
        <CampaignsView
          campaigns={campaigns}
          templates={templates}
          prospects={prospects}
          onCreateNew={() => setShowCreateCampaign(true)}
          onOpenBatch={openMessagingBatch}
          onRefresh={loadData}
        />
      ) : (
        <TemplatesView
          templates={templates}
          onCreateNew={() => setShowCreateTemplate(true)}
          onRefresh={loadData}
        />
      )}

      {showCreateCampaign && (
        <CreateCampaignModal
          templates={templates}
          prospects={prospects}
          onClose={() => setShowCreateCampaign(false)}
          onCreated={loadData}
        />
      )}

      {showCreateTemplate && (
        <CreateTemplateModal
          onClose={() => setShowCreateTemplate(false)}
          onCreated={loadData}
        />
      )}
    </div>
  );
};

interface CampaignsViewProps {
  campaigns: MessageCampaign[];
  templates: MessageTemplate[];
  prospects: LinkedInProspect[];
  onCreateNew: () => void;
  onOpenBatch: (campaign: MessageCampaign, batchSize: number, autoClick: boolean) => void;
  onRefresh: () => void;
}

const CampaignsView: React.FC<CampaignsViewProps> = ({ campaigns, templates, prospects, onCreateNew, onOpenBatch, onRefresh }) => {
  const deleteCampaign = async (id: string) => {
    if (confirm('Delete this campaign?')) {
      await StorageManager.deleteCampaign(id);
      onRefresh();
    }
  };

  return (
    <div>
      <button
        onClick={onCreateNew}
        style={{
          width: '100%',
          padding: '12px',
          background: '#057642',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          marginBottom: '16px'
        }}
      >
        + Create New Campaign
      </button>

      {campaigns.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <p>No campaigns yet</p>
          <small>Create your first campaign to start bulk messaging</small>
        </div>
      ) : (
        campaigns.map(campaign => {
          const template = templates.find(t => t.id === campaign.templateId);

          return (
            <div
              key={campaign.id}
              style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '12px',
                background: '#fff'
              }}
            >
              <div style={{ marginBottom: '12px' }}>
                <h3 style={{ margin: '0 0 8px 0' }}>{campaign.name}</h3>
                <div style={{ fontSize: '13px', color: '#666' }}>
                  {template ? `Template: ${template.name}` : 'Custom message'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <StatBadge label="Total" value={campaign.stats.total} color="#666" />
                <StatBadge label="Pending" value={campaign.stats.pending} color="#0a66c2" />
                <StatBadge label="Opened" value={campaign.stats.opened} color="#f5a623" />
                <StatBadge label="Messaged" value={campaign.stats.messaged} color="#057642" />
              </div>

              {campaign.stats.pending > 0 && (
                <>
                  <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: '#666' }}>
                    Manual (Click "Message" yourself):
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <button
                      onClick={() => onOpenBatch(campaign, 5, false)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        background: '#0a66c2',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 600
                      }}
                    >
                      Open 5
                    </button>
                    <button
                      onClick={() => onOpenBatch(campaign, 10, false)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        background: '#0a66c2',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 600
                      }}
                    >
                      Open 10
                    </button>
                    <button
                      onClick={() => {
                        const count = parseInt(prompt('How many tabs to open?', '5') || '0');
                        if (count > 0) onOpenBatch(campaign, count, false);
                      }}
                      style={{
                        padding: '8px 12px',
                        background: '#fff',
                        color: '#0a66c2',
                        border: '2px solid #0a66c2',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 600
                      }}
                    >
                      Custom
                    </button>
                  </div>

                  <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: '#666' }}>
                    Auto-click (Message button clicked automatically):
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <button
                      onClick={() => onOpenBatch(campaign, 5, true)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        background: '#057642',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 600
                      }}
                    >
                      Auto 5
                    </button>
                    <button
                      onClick={() => onOpenBatch(campaign, 10, true)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        background: '#057642',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 600
                      }}
                    >
                      Auto 10
                    </button>
                    <button
                      onClick={() => {
                        const count = parseInt(prompt('How many tabs to open with auto-click?', '5') || '0');
                        if (count > 0) onOpenBatch(campaign, count, true);
                      }}
                      style={{
                        padding: '8px 12px',
                        background: '#fff',
                        color: '#057642',
                        border: '2px solid #057642',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 600
                      }}
                    >
                      Custom
                    </button>
                  </div>
                </>
              )}

              <button
                onClick={() => deleteCampaign(campaign.id)}
                style={{
                  width: '100%',
                  padding: '6px',
                  background: '#fff',
                  color: '#dc2626',
                  border: '1px solid #dc2626',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Delete Campaign
              </button>
            </div>
          );
        })
      )}
    </div>
  );
};

interface StatBadgeProps {
  label: string;
  value: number;
  color: string;
}

const StatBadge: React.FC<StatBadgeProps> = ({ label, value, color }) => (
  <span style={{
    fontSize: '12px',
    padding: '4px 8px',
    background: color,
    color: 'white',
    borderRadius: '4px',
    fontWeight: 600
  }}>
    {label}: {value}
  </span>
);

interface TemplatesViewProps {
  templates: MessageTemplate[];
  onCreateNew: () => void;
  onRefresh: () => void;
}

const TemplatesView: React.FC<TemplatesViewProps> = ({ templates, onCreateNew, onRefresh }) => {
  const deleteTemplate = async (id: string) => {
    if (confirm('Delete this template?')) {
      await StorageManager.deleteTemplate(id);
      onRefresh();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Template copied to clipboard!');
  };

  return (
    <div>
      <button
        onClick={onCreateNew}
        style={{
          width: '100%',
          padding: '12px',
          background: '#057642',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          marginBottom: '16px'
        }}
      >
        + Create New Template
      </button>

      {templates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <p>No templates yet</p>
          <small>Create message templates to reuse across campaigns</small>
        </div>
      ) : (
        templates.map(template => (
          <div
            key={template.id}
            style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '12px',
              background: '#fff'
            }}
          >
            <h3 style={{ margin: '0 0 8px 0' }}>{template.name}</h3>
            <p style={{
              fontSize: '13px',
              color: '#666',
              background: '#f5f5f5',
              padding: '12px',
              borderRadius: '4px',
              whiteSpace: 'pre-wrap',
              marginBottom: '12px'
            }}>
              {template.content}
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => copyToClipboard(template.content)}
                style={{
                  flex: 1,
                  padding: '8px',
                  background: '#0a66c2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                Copy
              </button>
              <button
                onClick={() => deleteTemplate(template.id)}
                style={{
                  padding: '8px 12px',
                  background: '#fff',
                  color: '#dc2626',
                  border: '1px solid #dc2626',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

interface CreateCampaignModalProps {
  templates: MessageTemplate[];
  prospects: LinkedInProspect[];
  onClose: () => void;
  onCreated: () => void;
}

const CreateCampaignModal: React.FC<CreateCampaignModalProps> = ({ templates, prospects, onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'reviewed'>('new');

  // Advanced filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [keywordFilter, setKeywordFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [minPriorityScore, setMinPriorityScore] = useState<number>(0);
  const [minMutualConnections, setMinMutualConnections] = useState<number>(0);
  const [prioritySettings, setPrioritySettings] = useState<PrioritySettings>(defaultPrioritySettings);

  useEffect(() => {
    loadPrioritySettings();
  }, []);

  const loadPrioritySettings = async () => {
    const saved = await StorageManager.getPrioritySettings();
    if (saved) {
      setPrioritySettings(saved);
    }
  };

  const getFilteredProspects = () => {
    let filtered = prospects;

    // Status filter
    if (statusFilter === 'new') {
      filtered = filtered.filter(p => p.status === 'new');
    } else if (statusFilter === 'reviewed') {
      filtered = filtered.filter(p => p.status === 'reviewed');
    }

    // Advanced filters
    if (keywordFilter.trim()) {
      const keywords = keywordFilter.toLowerCase().split(',').map(k => k.trim());
      filtered = filtered.filter(p =>
        keywords.some(keyword => p.headline?.toLowerCase().includes(keyword))
      );
    }

    if (locationFilter.trim()) {
      const locations = locationFilter.toLowerCase().split(',').map(l => l.trim());
      filtered = filtered.filter(p =>
        locations.some(location => p.location?.toLowerCase().includes(location))
      );
    }

    if (companyFilter.trim()) {
      const companies = companyFilter.toLowerCase().split(',').map(c => c.trim());
      filtered = filtered.filter(p =>
        companies.some(company =>
          p.currentCompany?.toLowerCase().includes(company) ||
          p.headline?.toLowerCase().includes(company)
        )
      );
    }

    if (minMutualConnections > 0) {
      filtered = filtered.filter(p => (p.mutualConnections || 0) >= minMutualConnections);
    }

    if (minPriorityScore > 0) {
      filtered = filtered.filter(p => {
        const score = calculatePriorityScore(p, prioritySettings);
        return score >= minPriorityScore;
      });
    }

    return filtered;
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      alert('Please enter a campaign name');
      return;
    }

    const selectedProspects = getFilteredProspects();

    if (selectedProspects.length === 0) {
      alert('No prospects match the selected filters');
      return;
    }

    // Create campaign contacts
    const contacts: CampaignContact[] = selectedProspects.map(p => ({
      prospectId: p.id,
      status: 'pending'
    }));

    const campaign: MessageCampaign = {
      id: Date.now().toString(),
      name: name.trim(),
      templateId: selectedTemplate || undefined,
      customMessage: customMessage.trim() || undefined,
      contacts,
      createdAt: Date.now(),
      stats: {
        total: contacts.length,
        pending: contacts.length,
        opened: 0,
        messaged: 0,
        skipped: 0
      }
    };

    await StorageManager.addCampaign(campaign);
    onCreated();
    onClose();
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
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <h2 style={{ marginTop: 0 }}>Create Campaign</h2>

        <label style={{ display: 'block', marginBottom: '16px' }}>
          <div style={{ marginBottom: '4px', fontWeight: 600 }}>Campaign Name</div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Q4 Outreach"
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </label>

        <label style={{ display: 'block', marginBottom: '16px' }}>
          <div style={{ marginBottom: '4px', fontWeight: 600 }}>Target Prospects</div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          >
            <option value="all">All Prospects ({prospects.length})</option>
            <option value="new">New Prospects ({prospects.filter(p => p.status === 'new').length})</option>
            <option value="reviewed">Reviewed Prospects ({prospects.filter(p => p.status === 'reviewed').length})</option>
          </select>
        </label>

        {/* Advanced Filters Toggle */}
        <div style={{ marginBottom: '16px' }}>
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            style={{
              width: '100%',
              padding: '10px',
              background: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 600,
              color: '#666',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span>Advanced Filters</span>
            <span>{showAdvancedFilters ? '▲' : '▼'}</span>
          </button>
        </div>

        {/* Advanced Filters Section */}
        {showAdvancedFilters && (
          <div style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px',
            background: '#fafafa'
          }}>
            <label style={{ display: 'block', marginBottom: '12px' }}>
              <div style={{ marginBottom: '4px', fontSize: '13px', fontWeight: 600 }}>
                Keywords in Headline (comma-separated)
              </div>
              <input
                type="text"
                value={keywordFilter}
                onChange={(e) => setKeywordFilter(e.target.value)}
                placeholder="e.g., founder, ceo, engineer"
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px' }}
              />
            </label>

            <label style={{ display: 'block', marginBottom: '12px' }}>
              <div style={{ marginBottom: '4px', fontSize: '13px', fontWeight: 600 }}>
                Location (comma-separated)
              </div>
              <input
                type="text"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                placeholder="e.g., san francisco, new york"
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px' }}
              />
            </label>

            <label style={{ display: 'block', marginBottom: '12px' }}>
              <div style={{ marginBottom: '4px', fontSize: '13px', fontWeight: 600 }}>
                Company (comma-separated)
              </div>
              <input
                type="text"
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                placeholder="e.g., google, stripe, openai"
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px' }}
              />
            </label>

            <label style={{ display: 'block', marginBottom: '12px' }}>
              <div style={{ marginBottom: '4px', fontSize: '13px', fontWeight: 600 }}>
                Minimum Mutual Connections
              </div>
              <input
                type="number"
                value={minMutualConnections}
                onChange={(e) => setMinMutualConnections(parseInt(e.target.value) || 0)}
                placeholder="0"
                min="0"
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px' }}
              />
            </label>

            <label style={{ display: 'block', marginBottom: '0' }}>
              <div style={{ marginBottom: '4px', fontSize: '13px', fontWeight: 600 }}>
                Minimum Priority Score
              </div>
              <input
                type="number"
                value={minPriorityScore}
                onChange={(e) => setMinPriorityScore(parseInt(e.target.value) || 0)}
                placeholder="0"
                min="0"
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px' }}
              />
              <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                Filtered: {getFilteredProspects().length} prospects match
              </div>
            </label>
          </div>
        )}

        <label style={{ display: 'block', marginBottom: '16px' }}>
          <div style={{ marginBottom: '4px', fontWeight: 600 }}>Message Template (Optional)</div>
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          >
            <option value="">No template (manual message)</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </label>

        {selectedTemplate && (
          <div style={{
            background: '#f5f5f5',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '16px',
            fontSize: '13px',
            whiteSpace: 'pre-wrap'
          }}>
            {templates.find(t => t.id === selectedTemplate)?.content}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleCreate}
            style={{
              flex: 1,
              padding: '12px',
              background: '#057642',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Create Campaign
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

interface CreateTemplateModalProps {
  onClose: () => void;
  onCreated: () => void;
}

const CreateTemplateModal: React.FC<CreateTemplateModalProps> = ({ onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');

  const handleCreate = async () => {
    if (!name.trim() || !content.trim()) {
      alert('Please fill in all fields');
      return;
    }

    const template: MessageTemplate = {
      id: Date.now().toString(),
      name: name.trim(),
      content: content.trim(),
      createdAt: Date.now()
    };

    await StorageManager.addTemplate(template);
    onCreated();
    onClose();
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
        maxWidth: '500px',
        width: '90%'
      }}>
        <h2 style={{ marginTop: 0 }}>Create Template</h2>

        <label style={{ display: 'block', marginBottom: '16px' }}>
          <div style={{ marginBottom: '4px', fontWeight: 600 }}>Template Name</div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Initial Outreach"
            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </label>

        <label style={{ display: 'block', marginBottom: '16px' }}>
          <div style={{ marginBottom: '4px', fontWeight: 600 }}>Message Content</div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Hi [Name], I saw your profile and..."
            rows={6}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
          />
        </label>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleCreate}
            style={{
              flex: 1,
              padding: '12px',
              background: '#057642',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Create Template
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
